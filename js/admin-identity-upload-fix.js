// ==========================================================
// BELGIN ADMIN — IDENTITY DOCUMENT UPLOAD HARDENING
// Purpose: make declaration/store identity pickers deterministic
// across Chrome, Safari/iOS and WebView implementations.
// ==========================================================
(function identityUploadHardening() {
  'use strict';

  const MAX_BYTES = 15 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'heic', 'heif']);
  const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf'
  ]);

  function getAdminApp() {
    return window.AdminApp || null;
  }

  function showError(message, error) {
    if (error) console.error('[IDENTITY_UPLOAD]', message, error);
    else console.error('[IDENTITY_UPLOAD]', message);

    const app = getAdminApp();
    if (app && typeof app.showToast === 'function') {
      app.showToast('❌ ' + message, 'error');
      return;
    }
    window.alert(message);
  }

  function isAllowedFile(file) {
    if (!file) return false;
    if (file.size > MAX_BYTES) {
      showError('Kimlik belgesi 15 MB sınırını aşamaz.');
      return false;
    }

    const fileName = String(file.name || '');
    const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
    const mime = String(file.type || '').toLowerCase();

    // HEIC/HEIF can arrive with an empty MIME type in Safari/iOS.
    if ((mime && ALLOWED_MIME_TYPES.has(mime)) || ALLOWED_EXTENSIONS.has(extension)) {
      return true;
    }

    showError('Desteklenmeyen dosya türü. JPG, PNG, WEBP, HEIC/HEIF veya PDF yükleyin.');
    return false;
  }

  function openFilePicker(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      showError('Kimlik dosyası seçme alanı bulunamadı. Sayfayı yenileyip tekrar deneyin.');
      return;
    }

    // Keep the invocation inside the original user gesture. This is critical
    // for Safari/iOS and popup/security constrained WebViews.
    try {
      input.click();
    } catch (error) {
      showError('Dosya seçici açılamadı.', error);
    }
  }

  function makeRealPickerButton(zone, inputId, text) {
    if (!zone) return;

    const existing = zone.querySelector('[data-identity-picker-button="true"]');
    if (existing) return;

    const legacyVisualButton = Array.from(zone.querySelectorAll('span')).find((el) =>
      /dosya seç|bilgisayardan|telefondan/i.test(el.textContent || '')
    );

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.identityPickerButton = 'true';
    button.className = legacyVisualButton?.className || 'btn-admin-primary';
    button.textContent = text;
    button.style.cssText = legacyVisualButton?.style?.cssText || '';
    button.style.pointerEvents = 'auto';
    button.style.cursor = 'pointer';

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFilePicker(inputId);
    });

    if (legacyVisualButton) legacyVisualButton.replaceWith(button);
    else zone.appendChild(button);
  }

  function bindPickerZone({ zoneId, inputId, buttonText, dropHandler }) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    if (!zone || !input || zone.dataset.identityPickerBound === 'true') return;

    zone.dataset.identityPickerBound = 'true';
    zone.removeAttribute('for');
    zone.setAttribute('role', 'button');
    zone.setAttribute('aria-controls', inputId);
    if (!zone.hasAttribute('tabindex')) zone.tabIndex = 0;

    // Prevent native <label> activation from racing with programmatic click.
    zone.addEventListener('click', (event) => {
      if (event.target.closest('[data-identity-picker-button="true"]')) return;
      if (event.target === input) return;
      event.preventDefault();
      openFilePicker(inputId);
    });

    zone.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openFilePicker(inputId);
    });

    zone.addEventListener('dragover', (event) => {
      event.preventDefault();
      zone.dataset.identityDragActive = 'true';
    });

    zone.addEventListener('dragleave', () => {
      delete zone.dataset.identityDragActive;
    });

    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      delete zone.dataset.identityDragActive;
      const file = event.dataTransfer?.files?.[0];
      if (!isAllowedFile(file)) return;
      const app = getAdminApp();
      if (app && typeof app[dropHandler] === 'function') {
        app[dropHandler](event);
      } else {
        showError('Kimlik belge yükleme motoru hazır değil. Sayfayı yenileyin.');
      }
    });

    makeRealPickerButton(zone, inputId, buttonText);
  }

  function hardenHandlers() {
    const app = getAdminApp();
    if (!app || app.__identityUploadHardeningApplied) return;
    app.__identityUploadHardeningApplied = true;

    app.openDeclarationFilePicker = function openDeclarationFilePicker() {
      openFilePicker('declarationFileInput');
    };

    app.openStoreIdentityFilePicker = function openStoreIdentityFilePicker() {
      openFilePicker('storeIdentityFileInput');
    };

    const originalDeclarationFile = app.handleDeclarationFile;
    if (typeof originalDeclarationFile === 'function') {
      app.handleDeclarationFile = async function hardenedDeclarationFile(file) {
        if (!isAllowedFile(file)) return false;
        try {
          return await originalDeclarationFile.call(this, file);
        } catch (error) {
          showError('Kimlik / beyan belgesi işlenirken hata oluştu.', error);
          return false;
        }
      };
    }

    const originalStoreIdentityFile = app.processStoreIdentityFile;
    if (typeof originalStoreIdentityFile === 'function') {
      app.processStoreIdentityFile = async function hardenedStoreIdentityFile(file) {
        if (!isAllowedFile(file)) return false;
        try {
          return await originalStoreIdentityFile.call(this, file);
        } catch (error) {
          showError('Mağaza kimlik belgesi işlenirken hata oluştu.', error);
          return false;
        }
      };
    }
  }

  function apply() {
    hardenHandlers();

    bindPickerZone({
      zoneId: 'declarationDropZone',
      inputId: 'declarationFileInput',
      buttonText: '📂 Bilgisayardan / Telefondan Dosya Seç',
      dropHandler: 'handleDeclarationDrop'
    });

    bindPickerZone({
      zoneId: 'storeIdentityDropZone',
      inputId: 'storeIdentityFileInput',
      buttonText: '📂 Dosya Seç',
      dropHandler: 'handleStoreIdentityDrop'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }

  // The store form can be re-rendered. Rebind only when needed.
  const observer = new MutationObserver(() => apply());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
