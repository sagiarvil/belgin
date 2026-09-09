// BELGIN KUYUMCULUK — VIP ÖDEME LİNKİ & CHECKOUT MOTORU
// Güvenli Kompakt Maskeli Token (?p=...) ve WhatsApp Entegrasyonu
(function (global) {
  'use strict';

  function toBase64Url(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function fromBase64Url(base64Url) {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  // 22 AYAR BİLEZİK — /22 KISAYOLU İÇİN TEK VE DEĞİŞMEZ ÜRÜN
  const VIP_22_CATALOG = Object.freeze([
    {
      id: '22-ayar-bilezik',
      name: '22 Ayar Bilezik',
      reference: 'BLG-BLZ-22K',
      url: 'https://www.belginkuyumculuk.com/urun/22-ayar-bilezik/',
      basePrice: 65000,
      karat: 22,
      priceKey: 'gramGold22k',
      priceMultiplier: 1.005
    }
  ]);

  function getProductUnitPrice(prod) {
    if (typeof LIVE_MARKET_DATA !== 'undefined') {
      if (prod && prod.priceKey && LIVE_MARKET_DATA[prod.priceKey]) {
        const liveVal = Number(LIVE_MARKET_DATA[prod.priceKey]) || 0;
        if (liveVal > 0) {
          return Math.round(liveVal * (prod.priceMultiplier || 1.0));
        }
      }
    }
    return prod ? (prod.basePrice || 65000) : 65000;
  }

  function isVip22Tag(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim().toLowerCase();
    return clean === '/22' || clean.includes('/22') || clean === '22' || clean === '#22' || clean.includes('22 ayar bilezik') || clean === '22 ayar';
  }

  const VipEngine = {
    VIP_22_CATALOG,
    getProductUnitPrice,
    isVip22Tag,

    // /22 OTOMATİK 22 AYAR BİLEZİK AYRIŞTIRMA VE HESAPLAMA MOTORU
    calculateVip22Breakdown(totalAmount) {
      const total = Number(totalAmount) || 0;
      if (total <= 0) {
        return null;
      }

      // %1.25 İşçilik ve %20 KDV hesaplaması (Fiyatın içinde)
      const workmanshipTotal = Math.max(1, Math.round(total * 0.0125 * 100) / 100);
      const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
      const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
      const exactWorkmanshipGross = Math.round((workmanshipNet + workmanshipKdv) * 100) / 100;
      const goldNetPool = Math.round((total - exactWorkmanshipGross) * 100) / 100;

      const items = [
        {
          id: '22-ayar-bilezik',
          name: '22 Ayar Bilezik',
          malHizmet: '22 Ayar Bilezik (Kıymetli Maden Bedeli - Özel Matrah)',
          reference: 'BLG-BLZ-22K',
          url: 'https://www.belginkuyumculuk.com/urun/22-ayar-bilezik/',
          qty: 1,
          miktar: 1,
          birim: 'C62',
          unitPrice: goldNetPool,
          birimFiyat: goldNetPool.toFixed(2),
          lineTotal: goldNetPool,
          fiyat: goldNetPool.toFixed(2),
          malHizmetTutari: goldNetPool.toFixed(2),
          kdvRate: 0,
          kdvOrani: 0,
          kdvTutari: '0.00',
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: goldNetPool.toFixed(2)
        },
        {
          id: 'WORKMANSHIP-22K',
          name: 'İşçilik',
          malHizmet: 'İşçilik',
          reference: 'BLG-ISC-22K',
          url: 'https://www.belginkuyumculuk.com/',
          qty: 1,
          miktar: 1,
          birim: 'C62',
          unitPrice: workmanshipNet,
          birimFiyat: workmanshipNet.toFixed(2),
          lineTotal: workmanshipNet,
          fiyat: workmanshipNet.toFixed(2),
          malHizmetTutari: workmanshipNet.toFixed(2),
          kdvRate: 20,
          kdvOrani: 20,
          kdvTutari: workmanshipKdv.toFixed(2),
          totalWithKdv: exactWorkmanshipGross,
          ozelMatrahNedeni: '',
          ozelMatrahTutari: 0
        }
      ];

      const totalMatrah = Math.round((goldNetPool + workmanshipNet) * 100) / 100;
      const finalGrandTotal = Math.round((totalMatrah + workmanshipKdv) * 100) / 100;

      return {
        isVip22: true,
        tag: '/22',
        productName: '22 Ayar Bilezik',
        hasGoldAmount: goldNetPool.toFixed(2),
        workmanshipNet: workmanshipNet.toFixed(2),
        workmanshipKdv: workmanshipKdv.toFixed(2),
        workmanshipTotal: exactWorkmanshipGross.toFixed(2),
        totalMatrah: totalMatrah.toFixed(2),
        totalKdv: workmanshipKdv.toFixed(2),
        grandTotal: finalGrandTotal.toFixed(2),
        items: items
      };
    },

    // 1. Kompakt Maskeli Token Üretimi (orderId|title|amount|provider)
    encodeCompact(payload) {
      try {
        const orderId = String(payload.orderId || '').trim();
        const title = String(payload.title || '').trim();
        const amount = String(payload.amount || '').trim();
        const provider = (payload.provider || 'KUVEYTTURK').toUpperCase();
        const compactStr = provider !== 'KUVEYTTURK' 
          ? `${orderId}|${title}|${amount}|${provider}`
          : `${orderId}|${title}|${amount}`;
        return toBase64Url(compactStr);
      } catch (e) {
        console.error('VipEngine compact encode error:', e);
        return null;
      }
    },

    // 2. Kompakt Token Çözümleme
    decodeCompact(token) {
      try {
        if (!token) return null;
        const decoded = fromBase64Url(token);
        const parts = decoded.split('|');
        if (parts.length >= 3) {
          const orderId = parts[0];
          const title = parts[1];
          const amount = Number(parts[2]) || 0;
          const provider = (parts[3] || 'KUVEYTTURK').toUpperCase();
          const is22 = isVip22Tag(title);
          return {
            orderId,
            title,
            amount,
            provider,
            isVip22: is22
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    // 3. Standart JSON Base64URL Encode (Geriye dönük uyumluluk)
    encodePayload(data) {
      try {
        const jsonStr = JSON.stringify(data);
        return toBase64Url(jsonStr);
      } catch (e) {
        console.error('VipEngine encode error:', e);
        return null;
      }
    },

    // 4. Standart JSON Base64URL Decode
    decodePayload(token) {
      try {
        if (!token) return null;
        const jsonStr = fromBase64Url(token);
        const data = JSON.parse(jsonStr);
        if (data && (isVip22Tag(data.title) || data.isVip22)) {
          data.isVip22 = true;
        }
        return data;
      } catch (e) {
        return null;
      }
    },

    // 5. VIP Link Üretimi (https://www.belginkuyumculuk.com/vip?p=...)
    buildVipUrl(payload, customOrigin) {
      const origin = customOrigin || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.belginkuyumculuk.com');
      const compactToken = this.encodeCompact(payload);
      return `${origin}/vip?p=${compactToken}`;
    },

    // 6. Akıllı Çözücü (?p=... -> ?token=... -> ?amount=... -> ?tutar=... -> /vip/slug-amount)
    resolvePayload(param, pathname, search) {
      // 6.1. Token Parametresi (?p=... veya ?token=...)
      if (param) {
        const compact = this.decodeCompact(param);
        if (compact && compact.amount > 0) {
          compact.rawToken = param;
          if (isVip22Tag(compact.title)) {
            compact.isVip22 = true;
            compact.vip22Breakdown = this.calculateVip22Breakdown(compact.amount);
          }
          return compact;
        }
        const json = this.decodePayload(param);
        if (json && json.amount > 0) {
          json.rawToken = param;
          if (isVip22Tag(json.title) || json.isVip22) {
            json.isVip22 = true;
            json.vip22Breakdown = this.calculateVip22Breakdown(json.amount);
          }
          return json;
        }
      }

      // 6.2. Doğrudan Tutar / Parametre Desteği (?amount=100 veya ?tutar=100 veya ?fiyat=100)
      if (search || (typeof window !== 'undefined' && window.location.search)) {
        const queryStr = search || window.location.search;
        const sp = new URLSearchParams(queryStr);
        const rawAmt = sp.get('amount') || sp.get('tutar') || sp.get('fiyat') || sp.get('price');
        if (rawAmt) {
          const numAmt = Number(String(rawAmt).replace(/\D/g, '')) || Number(rawAmt) || 0;
          if (numAmt > 0) {
            const rawTitle = sp.get('title') || sp.get('baslik') || sp.get('urun') || sp.get('name') || 'Lüks Özel Sipariş';
            const orderId = sp.get('orderId') || sp.get('oid') || ('VIP-' + Math.floor(100000 + Math.random() * 900000));
            const is22 = isVip22Tag(rawTitle) || sp.get('tag') === '22';
            const provider = (sp.get('provider') || sp.get('pos') || 'KUVEYTTURK').toUpperCase();
            const payload = {
              orderId,
              title: rawTitle,
              amount: numAmt,
              provider: provider,
              isVip22: is22
            };
            if (is22) {
              payload.vip22Breakdown = this.calculateVip22Breakdown(numAmt);
            }
            payload.rawToken = this.encodeCompact(payload);
            return payload;
          }
        }
      }

      // 6.3. URL Yolu Desteği (/vip/altin-kolye-5000 veya /vip/slug-amount)
      if (pathname) {
        const cleanPath = pathname.replace(/\/+$/, '');
        const match = cleanPath.match(/\/vip\/([a-zA-Z0-9_-]+)-(\d+)$/);
        if (match) {
          const rawSlug = match[1];
          const amount = Number(match[2]);
          const title = rawSlug
            .split('-')
            .map(w => w ? (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)) : '')
            .join(' ');
          const is22 = isVip22Tag(title) || rawSlug === '22';
          const payload = {
            orderId: 'VIP-' + Math.floor(100000 + Math.random() * 900000),
            title,
            amount,
            isVip22: is22
          };
          if (is22) {
            payload.vip22Breakdown = this.calculateVip22Breakdown(amount);
          }
          payload.rawToken = this.encodeCompact(payload);
          return payload;
        }
      }

      return null;
    },

    // 7. Sade & Net WhatsApp Mesaj Metni
    buildWhatsAppMessageText(payload, shortUrl) {
      const amount = Number(payload.amount || 0).toLocaleString('tr-TR');

      return `Tutar: ₺${amount}
Güvenli Ödeme Linki:
${shortUrl}

3D Secure güvencesiyle ödemenizi tamamlayabilirsiniz.`;
    },

    // 8. WhatsApp Paylaşım URL'i
    buildWhatsAppShareUrl(payload, shortUrl) {
      const message = this.buildWhatsAppMessageText(payload, shortUrl);
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }
  };

  // ---------------------------------------------------------------------------
  // ZİRAAT KATILIM 3DHOST — İZOLE ADD-ON
  // Kuveyt Türk varsayılan sağlayıcı, token biçimi ve ödeme fonksiyonları değiştirilmez.
  // ---------------------------------------------------------------------------
  const ZIRAAT_PROVIDER = 'ZIRAATKATILIM';
  const ZIRAAT_MAX_TRY = 200000;

  function getPayloadFromLocation() {
    try {
      const sp = new URLSearchParams(global.location?.search || '');
      const param = sp.get('p') || sp.get('token') || sp.get('amount') || sp.get('tutar');
      return VipEngine.resolvePayload(param, global.location?.pathname || '', global.location?.search || '');
    } catch (_) {
      return null;
    }
  }

  function updateBankSelectionTags(cards) {
    cards.forEach((card) => {
      const radio = card.querySelector('input[name="posProvider"]');
      const tag = card.querySelector('.bank-active-tag');
      if (!radio || !tag) return;
      if (radio.checked) {
        tag.textContent = '✓ Seçili POS';
      } else if (radio.value === 'KUVEYTTURK') {
        tag.textContent = 'Kuveyt POS';
      } else if (radio.value === ZIRAAT_PROVIDER) {
        tag.textContent = '3DHost';
      }
    });
  }

  function installZiraatLinkCreator() {
    if (typeof document === 'undefined') return;
    const grid = document.getElementById('bankSelectorGrid');
    if (!grid) return;

    if (!document.getElementById('bankCardZiraat')) {
      const card = document.createElement('label');
      card.className = 'bank-card';
      card.id = 'bankCardZiraat';
      card.innerHTML = `
        <input type="radio" name="posProvider" value="${ZIRAAT_PROVIDER}">
        <div class="bank-card-inner">
          <div class="bank-emblem-wrap" style="background:#0B6B3A;color:#fff;font-weight:900;font-size:16px;letter-spacing:-1px;">ZK</div>
          <div class="bank-info">
            <div class="bank-name-row">
              <span class="bank-title">Ziraat Katılım Bankası</span>
              <span class="bank-active-tag">3DHost</span>
            </div>
            <div class="bank-desc">3D Secure Ortak Ödeme Sayfası • Kart bilgisi bankada girilir</div>
          </div>
        </div>`;
      grid.appendChild(card);
    }

    const cards = Array.from(document.querySelectorAll('.bank-card, .pos-card'));
    // Eski inline reset kodundaki global referansı güvenli şekilde karşıla; Kuveyt mantığına dokunma.
    global.posCards = cards;

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const radio = card.querySelector('input[name="posProvider"]');
        if (radio) radio.checked = true;
        setTimeout(() => updateBankSelectionTags(cards), 0);
      });
    });

    try {
      const sp = new URLSearchParams(global.location?.search || '');
      const requested = String(sp.get('posProvider') || sp.get('pos') || sp.get('provider') || '').toUpperCase();
      if (requested === ZIRAAT_PROVIDER) {
        const z = document.querySelector(`input[name="posProvider"][value="${ZIRAAT_PROVIDER}"]`);
        if (z) {
          cards.forEach((c) => c.classList.remove('active'));
          z.checked = true;
          z.closest('.bank-card')?.classList.add('active');
        }
      }
    } catch (_) {}

    updateBankSelectionTags(cards);

    const form = document.getElementById('linkForm');
    const amountInput = document.getElementById('productAmount');
    const amountShell = document.getElementById('amountShell');
    const amountError = document.getElementById('amountError');
    if (form && !form.dataset.ziraatGuardBound) {
      form.dataset.ziraatGuardBound = '1';
      form.addEventListener('submit', (event) => {
        const selected = document.querySelector('input[name="posProvider"]:checked')?.value || 'KUVEYTTURK';
        const amount = Number(amountInput?.dataset?.raw || String(amountInput?.value || '').replace(/\D/g, '')) || 0;
        if (selected === ZIRAAT_PROVIDER && amount > ZIRAAT_MAX_TRY) {
          event.preventDefault();
          event.stopImmediatePropagation();
          amountShell?.classList.add('error');
          if (amountError) {
            amountError.textContent = '⚠ Ziraat Katılım tek işlem üst limiti ₺200.000’dir.';
            amountError.classList.add('show');
          }
          amountInput?.focus();
        } else if (amountError && selected !== ZIRAAT_PROVIDER) {
          amountError.textContent = '⚠ Lütfen geçerli bir satış tutarı giriniz (min. ₺100).';
        }
      }, true);
    }
  }

  async function startZiraatHostedPayment(payload) {
    const name = document.getElementById('custName')?.value?.trim() || '';
    const phone = document.getElementById('custPhone')?.value?.trim() || '';
    const identity = document.getElementById('custIdentity')?.value?.trim() || '';
    const address = document.getElementById('custAddress')?.value?.trim() || '';

    if (!name || !phone) {
      alert('Lütfen adınızı, soyadınızı ve telefon numaranızı eksiksiz doldurunuz.');
      document.getElementById('custName')?.focus();
      return;
    }
    if (!identity) {
      alert('Lütfen fatura ve güvenlik doğrulaması için T.C. Kimlik / Pasaport / Vergi numaranızı giriniz.');
      document.getElementById('custIdentity')?.focus();
      return;
    }
    if (!address || address.length < 5) {
      alert('Lütfen fatura ve yasal teslimat için açık adresinizi giriniz.');
      document.getElementById('custAddress')?.focus();
      return;
    }

    const totalAmt = Number(payload?.amount || 0);
    if (!Number.isFinite(totalAmt) || totalAmt <= 0 || totalAmt > ZIRAAT_MAX_TRY) {
      alert('Ziraat Katılım tek işlem tutarı en fazla ₺200.000 olabilir.');
      return;
    }

    const btn = document.getElementById('btnCompletePayment');
    const originalHtml = btn?.innerHTML || '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>🔒</span> Ziraat Katılım güvenli 3DHost ödeme sayfasına geçiliyor...';
    }

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const token = payload.rawToken || VipEngine.encodeCompact(payload);
      const is22 = Boolean(payload.isVip22 || VipEngine.isVip22Tag(payload.title));
      const orderItems = [{
        id: payload.orderId || `VIP-${Date.now()}`,
        name: payload.title || 'Lüks Showroom Siparişi',
        price: totalAmt,
        qty: 1,
        isVipCustom: true,
        vipToken: token,
        brand: 'Belgin Kuyumculuk',
        category: 'luxury'
      }];

      const response = await fetch('/api/payment/create?_t=' + Date.now(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          provider: ZIRAAT_PROVIDER,
          isVipPayment: true,
          isVip22: is22,
          vipToken: token,
          user_name: name,
          user_phone: phone,
          email: cleanPhone ? `musteri_${cleanPhone}@belginkuyumculuk.com` : `vip_${Date.now()}@belginkuyumculuk.com`,
          customerIdentity: identity,
          customerAddress: address,
          user_address: address,
          address,
          deliveryMethod: 'showroom',
          termsAccepted: true,
          preInformationAccepted: true,
          highValueDeliveryAccepted: true,
          deliveryStatementAccepted: true,
          marketingConsent: true,
          items: orderItems
        })
      });

      let data = {};
      try { data = await response.json(); } catch (_) { data = {}; }
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Ziraat Katılım Sanal POS bağlantısı kurulamadı.');
      }

      if (!data.gatewayUrl || !data.formData) {
        throw new Error('Ziraat Katılım 3DHost yönlendirme formu alınamadı.');
      }

      const postForm = document.createElement('form');
      postForm.method = 'POST';
      postForm.action = data.gatewayUrl;
      postForm.enctype = 'application/x-www-form-urlencoded';
      postForm.acceptCharset = 'UTF-8';
      postForm.style.display = 'none';
      Object.entries(data.formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        postForm.appendChild(input);
      });
      document.body.appendChild(postForm);
      HTMLFormElement.prototype.submit.call(postForm);
    } catch (error) {
      console.error('Ziraat Katılım VIP ödeme hatası:', error);
      alert('Ödeme başlatılamadı: ' + error.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  }

  function installZiraatHostedCheckout() {
    if (typeof document === 'undefined' || !document.getElementById('cardFieldsWrap')) return;
    const payload = getPayloadFromLocation();
    if (!payload || String(payload.provider || 'KUVEYTTURK').toUpperCase() !== ZIRAAT_PROVIDER) return;

    const cardWrap = document.getElementById('cardFieldsWrap');
    if (cardWrap) cardWrap.style.display = 'none';

    if (!document.getElementById('ziraatHostNotice')) {
      const notice = document.createElement('div');
      notice.id = 'ziraatHostNotice';
      notice.style.cssText = 'background:#0B1917;border:1.5px solid #1E3B36;border-radius:12px;padding:16px;margin-bottom:18px;color:#F3E5AB;font-size:12.5px;line-height:1.55;';
      notice.innerHTML = '<strong style="display:block;margin-bottom:5px;">Ziraat Katılım 3D Secure Ortak Ödeme</strong><span style="color:#8EAAA5;">Kart numarası, son kullanma tarihi ve CVV bilgileri Belgin ekranında alınmaz. “Güvenli Öde” sonrası Ziraat Katılım’ın 3DHost sayfasında girilir.</span>';
      cardWrap?.parentNode?.insertBefore(notice, cardWrap);
    }

    const originalProcess = global.processVipPayment;
    if (typeof originalProcess === 'function' && !originalProcess.__ziraatWrapped) {
      const wrapped = async function () {
        const livePayload = getPayloadFromLocation();
        if (!livePayload || String(livePayload.provider || 'KUVEYTTURK').toUpperCase() !== ZIRAAT_PROVIDER) {
          return originalProcess.apply(this, arguments);
        }
        return startZiraatHostedPayment(livePayload);
      };
      wrapped.__ziraatWrapped = true;
      global.processVipPayment = wrapped;
    }
  }

  // Link oluşturucu DOM'u bu script yüklendiğinde hazırdır; Ziraat kartını inline handler kurulmadan ekle.
  installZiraatLinkCreator();

  // Checkout inline scripti daha sonra processVipPayment'i tanımlar; event döngüsünün sonunda sadece Ziraat yolunu sar.
  if (typeof global.addEventListener === 'function') {
    global.addEventListener('DOMContentLoaded', () => {
      setTimeout(installZiraatHostedCheckout, 0);
    });
  }

  global.VipEngine = VipEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VipEngine, VIP_22_CATALOG };
  }
})(typeof window !== 'undefined' ? window : this);