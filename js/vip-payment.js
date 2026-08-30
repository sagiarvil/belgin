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

  // 5 ADET 22 AYAR ALTIN SABİT ÜRÜN KATALOĞU VE LİNKLERİ
  const VIP_22_CATALOG = Object.freeze([
    {
      id: '2734',
      name: '7 Gram 22 Ayar Ajda Altın Bilezik',
      reference: 'BLG-BLZ-110',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-110-2734/',
      basePrice: 51853,
      weight: 7.0,
      karat: 22,
      priceKey: 'gramGold22k',
      priceMultiplier: 7.0 * 1.10
    },
    {
      id: '2669',
      name: 'Ata Tam Yeni 22 ayar',
      reference: 'BLG-ZYN-045',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-045-2669/',
      basePrice: 47400,
      weight: 7.216,
      karat: 22,
      priceKey: 'ataGold',
      priceMultiplier: 1.0
    },
    {
      id: '2667',
      name: 'Ziynet Çeyrek Altın',
      reference: 'BLG-ZYN-043',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-043-2667/',
      basePrice: 11750,
      weight: 1.754,
      karat: 22,
      priceKey: 'quarterGold',
      priceMultiplier: 1.0
    },
    {
      id: '2670',
      name: 'Yarım Altın',
      reference: 'BLG-ZYN-046',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-046-2670/',
      basePrice: 23500,
      weight: 3.508,
      karat: 22,
      priceKey: 'halfGold',
      priceMultiplier: 1.0
    },
    {
      id: '2668',
      name: 'Çeyrek Altın',
      reference: 'BLG-ZYN-044',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-044-2668/',
      basePrice: 11750,
      weight: 1.754,
      karat: 22,
      priceKey: 'quarterGold',
      priceMultiplier: 1.0
    }
  ]);

  function getProductUnitPrice(prod) {
    if (typeof LIVE_MARKET_DATA !== 'undefined') {
      if (prod.priceKey && LIVE_MARKET_DATA[prod.priceKey]) {
        const liveVal = Number(LIVE_MARKET_DATA[prod.priceKey]) || 0;
        if (liveVal > 0) {
          return Math.round(liveVal * (prod.priceMultiplier || 1.0));
        }
      }
    }
    return prod.basePrice;
  }

  function isVip22Tag(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim().toLowerCase();
    return clean === '/22' || clean.includes('/22') || clean === '22' || clean === '#22';
  }

  const VipEngine = {
    VIP_22_CATALOG,
    isVip22Tag,

    // /22 OTOMATİK 22 AYAR ALTIN AYRIŞTIRMA VE HESAPLAMA MOTORU
    calculateVip22Breakdown(totalAmount, seed) {
      const total = Number(totalAmount) || 0;
      if (total <= 0) {
        return null;
      }

      // %1.5 İşçilik ve %20 KDV hesaplaması (Fiyatın içinde)
      const workmanshipTotal = Math.round(total * 0.015 * 100) / 100;
      const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
      const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
      const goldNetPool = Math.round((total - workmanshipTotal) * 100) / 100;

      const items = [];
      const catalog = [...VIP_22_CATALOG];

      // Karışık / Rastgele seçim
      const shuffled = catalog.sort(() => 0.5 - Math.random());

      if (total <= 200000) {
        // DURUM A: <= 200.000 TL -> Tek 22 Ayar Ürün + %1.5 İşçilik
        const p1 = shuffled[0];
        const p1Price = getProductUnitPrice(p1);
        const qty1 = Math.max(1, Math.round(goldNetPool / p1Price));
        const unitPrice1 = Math.round((goldNetPool / qty1) * 100) / 100;

        items.push({
          id: p1.id,
          name: p1.name,
          malHizmet: `${p1.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
          reference: p1.reference,
          url: p1.url,
          qty: qty1,
          miktar: qty1,
          birim: 'C62',
          unitPrice: unitPrice1,
          birimFiyat: unitPrice1.toFixed(2),
          lineTotal: goldNetPool,
          fiyat: goldNetPool.toFixed(2),
          malHizmetTutari: goldNetPool.toFixed(2),
          kdvRate: 0,
          kdvOrani: 0,
          kdvTutari: '0.00',
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: goldNetPool.toFixed(2)
        });
      } else {
        // DURUM B: > 200.000 TL -> 2 Farklı 22 Ayar Ürün + %1.5 İşçilik
        const p1 = shuffled[0];
        const p2 = shuffled[1];

        // 1. Ürün için %55 ile %70 arasında mantıklı rastgele oran
        const ratio1 = (Math.floor(Math.random() * 16) + 55) / 100; // 0.55 .. 0.70
        const pool1 = Math.round(goldNetPool * ratio1 * 100) / 100;
        const pool2 = Math.round((goldNetPool - pool1) * 100) / 100;

        const p1Price = getProductUnitPrice(p1);
        const qty1 = Math.max(1, Math.round(pool1 / p1Price));
        const unitPrice1 = Math.round((pool1 / qty1) * 100) / 100;

        const p2Price = getProductUnitPrice(p2);
        const qty2 = Math.max(1, Math.round(pool2 / p2Price));
        const unitPrice2 = Math.round((pool2 / qty2) * 100) / 100;

        items.push({
          id: p1.id,
          name: p1.name,
          malHizmet: `${p1.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
          reference: p1.reference,
          url: p1.url,
          qty: qty1,
          miktar: qty1,
          birim: 'C62',
          unitPrice: unitPrice1,
          birimFiyat: unitPrice1.toFixed(2),
          lineTotal: pool1,
          fiyat: pool1.toFixed(2),
          malHizmetTutari: pool1.toFixed(2),
          kdvRate: 0,
          kdvOrani: 0,
          kdvTutari: '0.00',
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: pool1.toFixed(2)
        });

        items.push({
          id: p2.id,
          name: p2.name,
          malHizmet: `${p2.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
          reference: p2.reference,
          url: p2.url,
          qty: qty2,
          miktar: qty2,
          birim: 'C62',
          unitPrice: unitPrice2,
          birimFiyat: unitPrice2.toFixed(2),
          lineTotal: pool2,
          fiyat: pool2.toFixed(2),
          malHizmetTutari: pool2.toFixed(2),
          kdvRate: 0,
          kdvOrani: 0,
          kdvTutari: '0.00',
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: pool2.toFixed(2)
        });
      }

      // 3. (veya 2.) Satır: İşçilik Bedeli (%20 KDV dahil)
      items.push({
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
        totalWithKdv: workmanshipTotal,
        ozelMatrahNedeni: '',
        ozelMatrahTutari: '0.00'
      });

      const totalMatrah = Math.round((goldNetPool + workmanshipNet) * 100) / 100;

      return {
        isVip22: true,
        tag: '/22',
        productName: items.filter(i => i.id !== 'WORKMANSHIP-22K').map(i => `${i.name} (x${i.qty})`).join(' + '),
        hasGoldAmount: goldNetPool.toFixed(2),
        workmanshipNet: workmanshipNet.toFixed(2),
        workmanshipKdv: workmanshipKdv.toFixed(2),
        workmanshipTotal: workmanshipTotal.toFixed(2),
        totalMatrah: totalMatrah.toFixed(2),
        totalKdv: workmanshipKdv.toFixed(2),
        grandTotal: total.toFixed(2),
        items: items
      };
    },

    // 1. Kompakt Maskeli Token Üretimi (orderId|title|amount|provider)
    encodeCompact(payload) {
      try {
        const orderId = String(payload.orderId || '').trim();
        const title = String(payload.title || '').trim();
        const amount = String(payload.amount || '').trim();
        const provider = (payload.provider || 'AKBANK').toUpperCase();
        const compactStr = provider !== 'AKBANK' 
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
          const provider = (parts[3] || 'AKBANK').toUpperCase();
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
            const provider = (sp.get('provider') || sp.get('pos') || 'AKBANK').toUpperCase();
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

  global.VipEngine = VipEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VipEngine, VIP_22_CATALOG };
  }
})(typeof window !== 'undefined' ? window : this);
