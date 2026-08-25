// ==========================================================
// BELGIN KUYUMCULUK — PAYTR IFRAME INTEGRATION
// Fail-closed production payment flow
// ==========================================================

const PayTR = {
  API_BASE: '/api',
  _messageHandler: null,

  async initializePayment(orderData) {
    const btn = document.getElementById('checkoutSubmit');
    const originalText = btn ? btn.innerHTML : 'Siparişi Tamamla';

    try {
      if (btn) {
        btn.innerHTML = '<span class="spinner-inline"></span> Güvenli PayTR Bağlantısı Kuruluyor...';
        btn.disabled = true;
      }

      const response = await fetch(`${this.API_BASE}/createPayTRToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(orderData),
      });

      let data = {};
      try { data = await response.json(); } catch (_) { data = {}; }
      if (!response.ok) throw new Error(data.message || `Ödeme servisi yanıt vermedi (${response.status}).`);
      if (!data.success || !data.token || !data.iframeUrl || !data.merchant_oid) throw new Error('Ödeme oturumu doğrulanamadı. İşlem başlatılmadı.');

      this.loadIframe(data.iframeUrl);
      if (btn) btn.style.display = 'none';
      window._activeOrderId = data.merchant_oid;
      return { success: true, token: data.token, merchant_oid: data.merchant_oid, deliveryMethod: data.deliveryMethod, highValueSecureDelivery: data.highValueSecureDelivery === true };
    } catch (error) {
      console.error('PayTR Entegrasyon Hatası:', error);
      showToast('Ödeme başlatılamadı. Kartınızdan tahsilat yapılmadı. ' + error.message, 'error');
      if (btn) { btn.innerHTML = originalText; btn.disabled = false; btn.style.display = 'inline-flex'; }
      return { success: false, error: error.message };
    }
  },

  loadIframe(iframeUrl) {
    const container = document.getElementById('paytr-container');
    const wrapper = document.getElementById('paytr-iframe-wrapper');
    if (!container || !wrapper) throw new Error('Ödeme iframe alanı bulunamadı.');
    const parsed = new URL(iframeUrl);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'www.paytr.com') throw new Error('Geçersiz ödeme sağlayıcı adresi.');
    wrapper.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = parsed.toString(); iframe.id = 'paytriframe'; iframe.setAttribute('frameborder', '0'); iframe.setAttribute('scrolling', 'no'); iframe.setAttribute('title', 'PayTR Güvenli Ödeme'); iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin'); iframe.style.width = '100%'; iframe.style.minHeight = '480px'; iframe.style.border = 'none'; iframe.style.borderRadius = 'var(--radius-sm)';
    wrapper.appendChild(iframe); container.style.display = 'block'; container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (this._messageHandler) window.removeEventListener('message', this._messageHandler);
    this._messageHandler = (event) => {
      if (event.origin !== 'https://www.paytr.com' || event.source !== iframe.contentWindow) return;
      try { const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; const height = Number.parseInt(data?.height, 10); if (Number.isFinite(height) && height >= 300 && height <= 2400) iframe.style.height = `${height + 20}px`; } catch (_) {}
    };
    window.addEventListener('message', this._messageHandler);
  },

  handleResult(orderId, success, message = '') {
    if (success) {
      Cart.clear(); const orderEl = document.getElementById('successOrderId'); if (orderEl) orderEl.textContent = orderId || ''; Router.navigate('payment-success'); showToast('Siparişiniz başarıyla alındı.', 'success'); return;
    }
    const reasonEl = document.getElementById('failReason'); if (reasonEl) reasonEl.textContent = message || 'Ödeme tamamlanamadı. Bankanız veya ödeme sağlayıcınız işlemi onaylamadı.'; Router.navigate('payment-failed'); showToast('Ödeme tamamlanamadı.', 'error');
  },

  reset() {
    const container = document.getElementById('paytr-container'); const wrapper = document.getElementById('paytr-iframe-wrapper'); const btn = document.getElementById('checkoutSubmit');
    if (this._messageHandler) { window.removeEventListener('message', this._messageHandler); this._messageHandler = null; }
    if (container) container.style.display = 'none'; if (wrapper) wrapper.innerHTML = '';
    if (btn) { btn.style.display = 'inline-flex'; btn.innerHTML = 'Siparişi Tamamla <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'; btn.disabled = false; }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('link[href*="legal-compliance.css"]')) {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'css/legal-compliance.css?v=2026.8.25'; document.head.appendChild(link);
  }
  const load = (src, done) => { const s=document.createElement('script'); s.src=src; s.onload=done||null; s.onerror=()=>console.error('Compliance script yüklenemedi:',src); document.body.appendChild(s); };
  load('js/legal-compliance.js?v=2026.8.25', () => {
    if (window.LegalCompliance?.init) LegalCompliance.init();
    load('js/legal-overrides.js?v=2026.8.25', () => {
      if(window.App?.refreshViews) App.refreshViews();
      if(window.Router?.currentPage==='checkout') { Cart.renderCheckout(); LegalCompliance.syncCheckout(); }
    });
  });
});
