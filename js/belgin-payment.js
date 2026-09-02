/**
 * BELGIN KUYUMCULUK — UNIFIED CLIENT-SIDE PAYMENT COORDINATOR
 * Çoklu POS / PayTR, QNB, Akbank, Yapı Kredi Uyumlu İstemci Katmanı
 */

(function (global) {
  'use strict';

  const BelginPayment = {
    API_BASE: '/api',
    _messageHandler: null,

    async createSession(orderPayload, options = {}) {
      const provider = options.provider || 'KUVEYTTURK';
      const submitBtn = options.submitBtn || document.getElementById('checkoutSubmit') || document.getElementById('btnCompletePayment') || document.getElementById('checkoutSubmitBtn');
      const originalHtml = submitBtn ? submitBtn.innerHTML : '';

      try {
        if (submitBtn) {
          submitBtn.innerHTML = '<span class="spinner-inline"></span> 🔒 Kuveyt Türk 3D Secure Bağlantısı Kuruluyor...';
          submitBtn.disabled = true;
        }

        const payload = {
          provider,
          ...orderPayload,
        };

        const response = await fetch(`${this.API_BASE}/payment/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        });

        let data = {};
        try {
          data = await response.json();
        } catch (_) {
          data = {};
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || `Ödeme servisi yanıt vermedi (${response.status}).`);
        }

        // 1. KUVEYT TÜRK 3D DIRECT HTML FORM FLOW (Banka SMS Şifresi Ekranı)
        if (data.formData && data.gatewayUrl) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.gatewayUrl;
          form.style.display = 'none';
          for (const [k, v] of Object.entries(data.formData)) {
            if (v !== undefined && v !== null) {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = k;
              input.value = String(v);
              form.appendChild(input);
            }
          }
          document.body.appendChild(form);
          form.submit();
          return data;
        }

        if (data.formHtml || data.paymentType === 'HTML_FORM') {
          const rawHtml = data.formHtml || '';
          document.open();
          document.write(rawHtml);
          document.close();

          setTimeout(() => {
            try {
              if (document.downloadForm && typeof document.downloadForm.submit === 'function') {
                document.downloadForm.submit();
              } else if (document.getElementById('kt3dForm')) {
                document.getElementById('kt3dForm').submit();
              } else if (document.forms && document.forms.length > 0) {
                document.forms[0].submit();
              }
            } catch (_) {}
          }, 40);
          return data;
        }

        // 2. IFRAME FLOW (PayTR vb.)
        if (data.paymentType === 'IFRAME' && data.iframeUrl) {
          this.loadIframe(data.iframeUrl, options);
          if (submitBtn) submitBtn.style.display = 'none';
        }
        // 3. REDIRECT / 3D SECURE HOSTED FLOW (QNB, Kuveyt Türk vb.)
        else if (data.paymentType === 'REDIRECT' && (data.redirectUrl || data.gatewayUrl)) {
          window.location.href = data.redirectUrl || data.gatewayUrl;
        }

        window._activeOrderId = data.merchant_oid;
        return data;
      } catch (err) {
        console.error('[BelginPayment] Hata:', err);
        if (typeof showToast === 'function') {
          showToast('Ödeme başlatılamadı: ' + err.message, 'error');
        } else {
          alert('Ödeme başlatılamadı: ' + err.message);
        }
        if (submitBtn) {
          submitBtn.innerHTML = originalHtml;
          submitBtn.disabled = false;
          submitBtn.style.display = 'inline-flex';
        }
        return { success: false, error: err.message };
      }
    },

    loadIframe(iframeUrl, options = {}) {
      const containerId = options.containerId || 'paytr-container';
      const wrapperId = options.wrapperId || 'paytr-iframe-wrapper';
      const container = document.getElementById(containerId);
      const wrapper = document.getElementById(wrapperId);

      if (!container || !wrapper) {
        throw new Error('Ödeme iframe alanı sayfada bulunamadı.');
      }

      const parsed = new URL(iframeUrl);
      if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('paytr.com')) {
        throw new Error('Güvensiz ödeme sağlayıcı adresi engellendi.');
      }

      wrapper.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = parsed.toString();
      iframe.id = 'belgin_payment_iframe';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('title', '3D Secure Güvenli Ödeme');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      iframe.style.width = '100%';
      iframe.style.minHeight = '520px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';

      wrapper.appendChild(iframe);
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (this._messageHandler) {
        window.removeEventListener('message', this._messageHandler);
      }

      this._messageHandler = (event) => {
        if (!event.origin.endsWith('paytr.com') || event.source !== iframe.contentWindow) return;
        try {
          const msgData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          const height = Number.parseInt(msgData?.height, 10);
          if (Number.isFinite(height) && height >= 300 && height <= 2400) {
            iframe.style.height = `${height + 20}px`;
          }
        } catch (_) {}
      };

      window.addEventListener('message', this._messageHandler);
    },
  };

  global.BelginPayment = BelginPayment;
})(typeof window !== 'undefined' ? window : this);
