// BELGIN KUYUMCULUK — BELGE BUTUNLUK VE DELIL KAYDI
// Bu modul nitelikli elektronik imza veya 5070 sayili Kanun kapsaminda zaman damgasi iddiasinda bulunmaz.
(function () {
  'use strict';

  const MANIFEST_URL = '/legal-manifest.json';

  function currentFileName() {
    const path = String(window.location.pathname || '').split('/').pop();
    return path || 'index.html';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadManifest() {
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) return null;
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  function renderBox(record, manifest) {
    const mainEl = document.querySelector('main.legal') || document.querySelector('.legal-shell') || document.querySelector('.legal-doc-container') || document.querySelector('main') || document.body;
    if (!mainEl || document.getElementById('legalEvidenceIntegrityBox')) return;

    const file = currentFileName();
    const version = record?.version || 'Sürüm bilgisi yüklenemedi';
    const sha256 = record?.sha256 || 'Bütünlük özeti yüklenemedi';
    const generatedAt = manifest?.generatedAt ? new Date(manifest.generatedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : '—';

    const html = `
      <section id="legalEvidenceIntegrityBox" aria-label="Belge sürümü ve bütünlük kaydı" style="margin:40px 0 0;padding:26px 30px;background:#fff;border:2px solid #084c47;border-radius:12px;box-shadow:0 8px 30px rgba(8,76,71,.08);font-family:system-ui,-apple-system,sans-serif;color:#222;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;border-bottom:1px solid #e6e0d6;padding-bottom:16px;margin-bottom:18px;">
          <div>
            <div style="font-size:11px;letter-spacing:1.7px;text-transform:uppercase;font-weight:800;color:#b68a32;margin-bottom:5px;">BELGE BÜTÜNLÜK VE DELİL KAYDI</div>
            <h3 style="margin:0;color:#084c47;font-size:20px;">Belge Sürümü ve SHA-256 Bütünlük Özeti</h3>
          </div>
          <span style="background:#eef6f4;border:1px solid #cfe2de;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:700;color:#084c47;">Sistem Kayıt Katmanı</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:18px;font-size:13px;">
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;">Belge</strong>${escapeHtml(file)}</div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;">Sürüm</strong>${escapeHtml(version)}</div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;">Manifest üretim zamanı</strong>${escapeHtml(generatedAt)}</div>
        </div>

        <div style="background:#eef6f4;border:1px solid #cfe2de;border-radius:8px;padding:14px 16px;margin-bottom:16px;overflow-wrap:anywhere;">
          <strong style="display:block;color:#084c47;margin-bottom:5px;">SHA-256 belge bütünlük özeti</strong>
          <code style="font-size:12px;">${escapeHtml(sha256)}</code>
        </div>

        <p style="font-size:12.5px;line-height:1.7;color:#555;margin:0 0 10px;">Bu kayıt, yayımlanan hukuki metnin sürümünü ve içeriğinin bütünlük kontrolünde kullanılabilecek SHA-256 özetini gösterir. Siparişe özgü kabul, ödeme ve teslim delilleri ayrıca sunucu tarafındaki sipariş/audit kayıtlarında tutulur.</p>
        <p style="font-size:12.5px;line-height:1.7;color:#555;margin:0;"><strong>Hukuki nitelik açıklaması:</strong> Bu alan tek başına nitelikli elektronik imza, güvenli elektronik imza veya 5070 sayılı Kanun kapsamında yetkili elektronik sertifika hizmet sağlayıcısı tarafından üretilmiş zaman damgası değildir. Böyle bir hizmet devreye alınırsa ayrıca sağlayıcı ve doğrulanabilir token bilgisiyle gösterilir.</p>
      </section>`;

    mainEl.insertAdjacentHTML('beforeend', html);
  }

  async function init() {
    const manifest = await loadManifest();
    const record = manifest?.documents?.[currentFileName()] || null;
    renderBox(record, manifest);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
