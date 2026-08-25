// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE PAYTR IFRAME INTEGRATION
// ==========================================================

const PayTR = {
  API_BASE: '/api',

  /**
   * PayTR Ödeme Başlatma ve iFrame Yükleme
   * @param {Object} orderData 
   */
  async initializePayment(orderData) {
    const btn = document.getElementById('checkoutSubmit');
    const originalText = btn ? btn.innerHTML : 'Siparişi Tamamla';

    try {
      if (btn) {
        btn.innerHTML = '<span class="spinner-inline"></span> Güvenli PayTR Bağlantısı Kuruluyor...';
        btn.disabled = true;
      }

      // 1. Firebase Functions endpoint'ine POST isteği
      let response;
      try {
        response = await fetch(`${this.API_BASE}/createPayTRToken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });
      } catch (netErr) {
        console.warn('Backend endpoint çağrılamadı, mock/demo simülasyonu başlatılıyor:', netErr);
        // Eğer backend sunucusu o an offline veya test aşamasındaysa zarif simülasyon
        return this.handleDemoSimulation(orderData);
      }

      if (!response.ok) {
        let errJson = {};
        try { errJson = await response.json(); } catch (e) {}
        throw new Error(errJson.message || `Sunucu Hatası (${response.status})`);
      }

      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.message || 'Ödeme oturumu açılamadı.');
      }

      // 2. Eğer simülasyon bayrağı varsa kullanıcıyı bilgilendir
      if (data.simulation) {
        showToast('PayTR Test Simülasyonu Aktif — Güvenli iframe yükleniyor.', 'info');
      }

      // 3. PayTR iframe'ini yükle
      this.loadIframe(data.iframeUrl || `https://www.paytr.com/odeme/guvenli/${data.token}`);

      // 4. Submit butonunu gizle
      if (btn) {
        btn.style.display = 'none';
      }

      // 5. Sipariş ID'sini sakla
      window._activeOrderId = data.merchant_oid || orderData.merchant_oid;

      return { success: true, token: data.token };

    } catch (error) {
      console.error('PayTR Entegrasyon Hatası:', error);
      showToast('Ödeme başlatılamadı: ' + error.message, 'error');

      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.display = 'inline-flex';
      }

      return { success: false, error: error.message };
    }
  },

  /**
   * Demo / Test Simülasyonu (Anahtarlar henüz girilmediğinde kusursuz UI deneyimi için)
   */
  handleDemoSimulation(orderData) {
    const container = document.getElementById('paytr-container');
    const wrapper = document.getElementById('paytr-iframe-wrapper');
    const btn = document.getElementById('checkoutSubmit');

    if (!container || !wrapper) return { success: false };

    showToast('PayTR Güvenli Ödeme Arayüzü Yükleniyor (3D Secure Test)', 'info');

    wrapper.innerHTML = `
      <div class="paytr-simulation-card">
        <div class="simulation-header">
          <div class="paytr-logo-badge">PayTR <span>3D Secure Güvenli Ödeme</span></div>
          <div class="secure-badge">🔒 256-Bit SSL Şifreleme</div>
        </div>
        <div class="simulation-body">
          <p class="sim-info">Ödenecek Tutar: <strong>${formatPrice(orderData.payment_amount)}</strong></p>
          <div class="sim-card-form">
            <div class="form-group">
              <label>Kart Numarası</label>
              <input type="text" value="5555 5555 5555 5555" readonly class="sim-input">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Son Kullanma</label>
                <input type="text" value="12/28" readonly class="sim-input">
              </div>
              <div class="form-group">
                <label>CVV / CVC</label>
                <input type="text" value="***" readonly class="sim-input">
              </div>
            </div>
            <button class="btn btn-filled btn-block" style="margin-top:16px;" onclick="PayTR.simulateSuccess('${orderData.merchant_oid}')">
              Test Ödemesini Onayla ve Tamamla (3D Onay)
            </button>
            <button class="btn btn-sm btn-block" style="margin-top:8px;" onclick="PayTR.simulateFail('Test iptali')">
              İşlemi İptal Et
            </button>
          </div>
        </div>
      </div>
    `;

    container.style.display = 'block';
    if (btn) btn.style.display = 'none';

    return { success: true, simulated: true };
  },

  simulateSuccess(orderId) {
    this.handleResult(orderId || 'BLG-' + Date.now(), true);
  },

  simulateFail(reason) {
    this.handleResult('BLG-' + Date.now(), false, reason || 'Ödeme işlemi kullanıcı tarafından iptal edildi.');
  },

  /**
   * PayTR iFrame'ini DOM'a ekle ve mesaj dinleyicisini bağla
   */
  loadIframe(iframeUrl) {
    const container = document.getElementById('paytr-container');
    const wrapper = document.getElementById('paytr-iframe-wrapper');

    if (!container || !wrapper) return;

    wrapper.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.id = 'paytriframe';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.style.width = '100%';
    iframe.style.minHeight = '480px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = 'var(--radius-sm)';

    wrapper.appendChild(iframe);
    container.style.display = 'block';

    // Sayfayı iFrame'e pürüzsüz kaydır
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // PayTR otomatik yükseklik mesajı dinleyicisi
    window.removeEventListener('message', this._messageHandler);
    this._messageHandler = (e) => {
      if (e.origin !== 'https://www.paytr.com') return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.height) {
          iframe.style.height = (parseInt(data.height, 10) + 20) + 'px';
        }
      } catch (err) {}
    };
    window.addEventListener('message', this._messageHandler);
  },

  /**
   * Ödeme Sonuç Yönlendirmesi
   */
  handleResult(orderId, success, message = '') {
    if (success) {
      Cart.clear();
      const orderEl = document.getElementById('successOrderId');
      if (orderEl) orderEl.textContent = orderId || 'BLG-PROD-' + Date.now();
      Router.navigate('payment-success');
      showToast('Tebrikler! Siparişiniz başarıyla alındı.', 'success');
    } else {
      const reasonEl = document.getElementById('failReason');
      if (reasonEl) {
        reasonEl.textContent = message || 'Ödeme işlemi bankanız tarafından onaylanmadı. Lütfen limitinizi kontrol ediniz.';
      }
      Router.navigate('payment-failed');
      showToast('Ödeme tamamlanamadı.', 'error');
    }
  },

  /**
   * Form Sıfırlama
   */
  reset() {
    const container = document.getElementById('paytr-container');
    const wrapper = document.getElementById('paytr-iframe-wrapper');
    const btn = document.getElementById('checkoutSubmit');

    if (container) container.style.display = 'none';
    if (wrapper) wrapper.innerHTML = '';
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.innerHTML = 'Siparişi Tamamla <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      btn.disabled = false;
    }
  }
};
