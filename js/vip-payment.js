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

  // 8 ADET 22 AYAR ALTIN SABİT ÜRÜN KATALOĞU VE LİNKLERİ
  const VIP_22_CATALOG = Object.freeze([
    {
      id: '2734',
      name: '7 Gram 22 Ayar Ajda Altın Bilezik',
      reference: 'BLG-BLZ-110',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-110-2734/',
      basePrice: 46521,
      weight: 7.0,
      karat: 22,
      priceKey: 'gramGold22k',
      priceMultiplier: 7.0 * 1.03
    },
    {
      id: '2669',
      name: 'Ata Tam Yeni 22 ayar',
      reference: 'BLG-ZYN-045',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-045-2669/',
      basePrice: 47005,
      weight: 7.216,
      karat: 22,
      priceKey: 'ataGold',
      priceMultiplier: 1.03
    },
    {
      id: '2667',
      name: 'Ziynet Çeyrek Altın',
      reference: 'BLG-ZYN-043',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-043-2667/',
      basePrice: 11601,
      weight: 1.754,
      karat: 22,
      priceKey: 'quarterGold',
      priceMultiplier: 1.03
    },
    {
      id: '2670',
      name: 'Yarım Altın',
      reference: 'BLG-ZYN-046',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-046-2670/',
      basePrice: 23173,
      weight: 3.508,
      karat: 22,
      priceKey: 'halfGold',
      priceMultiplier: 1.03
    },
    {
      id: '2668',
      name: 'Çeyrek Altın',
      reference: 'BLG-ZYN-044',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-044-2668/',
      basePrice: 11601,
      weight: 1.754,
      karat: 22,
      priceKey: 'quarterGold',
      priceMultiplier: 1.03
    },
    {
      id: '2741',
      name: '10 gr 22 Ayar Burma Altın Bilezik',
      reference: 'BLG-BLZ-117',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-117-2741/',
      basePrice: 66459,
      weight: 10.0,
      karat: 22,
      priceKey: 'gramGold22k',
      priceMultiplier: 10.0 * 1.03
    },
    {
      id: '2748',
      name: '20 gr 22 Ayar Burma Altın Bilezik',
      reference: 'BLG-BLZ-124',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-124-2748/',
      basePrice: 132917,
      weight: 20.0,
      karat: 22,
      priceKey: 'gramGold22k',
      priceMultiplier: 20.0 * 1.03
    },
    {
      id: '2753',
      name: '3\'lü Burma 25 gr 22 Ayar Altın Bilezik',
      reference: 'BLG-BLZ-129',
      url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-129-2753/',
      basePrice: 166146,
      weight: 25.0,
      karat: 22,
      priceKey: 'gramGold22k',
      priceMultiplier: 25.0 * 1.03
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
    getProductUnitPrice,
    isVip22Tag,

    // /22 OTOMATİK 22 AYAR ALTIN AYRIŞTIRMA VE HESAPLAMA MOTORU
    calculateVip22Breakdown(totalAmount, seed) {
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

      // 8 Temel Ürünü Fiyat Kategorilerine Göre Dinamik Olarak Karıştır
      const bigs = VIP_22_CATALOG.filter(p => p.basePrice >= 100000).sort(() => 0.5 - Math.random());
      const meds = VIP_22_CATALOG.filter(p => p.basePrice >= 40000 && p.basePrice < 100000).sort(() => 0.5 - Math.random());
      const smalls = VIP_22_CATALOG.filter(p => p.basePrice < 40000).sort(() => 0.5 - Math.random());

      let rawBasket = [];
      let remainingPool = goldNetPool;

      if (goldNetPool < 30000) {
        const s1 = smalls[0];
        const q1 = Math.max(1, Math.round(goldNetPool / getProductUnitPrice(s1)));
        rawBasket.push({ prod: s1, qty: q1, unitPrice: getProductUnitPrice(s1) });
      } else if (goldNetPool < 100000) {
        const m1 = meds[0];
        const mPrice = getProductUnitPrice(m1);
        const qM = Math.max(1, Math.floor((goldNetPool - 12000) / mPrice));
        rawBasket.push({ prod: m1, qty: qM, unitPrice: mPrice });
        remainingPool -= qM * mPrice;
        if (remainingPool >= 20000 && Math.random() > 0.5) {
          const yarim = smalls.find(s => s.basePrice >= 20000);
          if (yarim && getProductUnitPrice(yarim) < remainingPool - 5000) {
            rawBasket.push({ prod: yarim, qty: 1, unitPrice: getProductUnitPrice(yarim) });
            remainingPool -= getProductUnitPrice(yarim);
          }
        }
        const s1 = smalls.find(s => s.basePrice < 20000) || smalls[0];
        const qS = Math.max(1, Math.round(remainingPool / getProductUnitPrice(s1)));
        rawBasket.push({ prod: s1, qty: qS, unitPrice: getProductUnitPrice(s1) });
      } else if (goldNetPool < 250000) {
        const useBig = Math.random() > 0.5 && bigs.some(b => getProductUnitPrice(b) <= goldNetPool * 0.65);
        if (useBig) {
          const b1 = bigs.find(b => getProductUnitPrice(b) <= goldNetPool * 0.65) || bigs[0];
          const bPrice = getProductUnitPrice(b1);
          rawBasket.push({ prod: b1, qty: 1, unitPrice: bPrice });
          remainingPool -= bPrice;
        }
        const medCount = useBig ? 1 : (Math.random() > 0.5 ? 2 : 3);
        for (let i = 0; i < medCount && i < meds.length; i++) {
          const m = meds[i];
          const mPrice = getProductUnitPrice(m);
          const targetAmt = remainingPool * (i === 0 && !useBig ? 0.50 : 0.60);
          const q = Math.max(1, Math.floor(targetAmt / mPrice));
          if (q > 0 && q * mPrice < remainingPool - 5000) {
            rawBasket.push({ prod: m, qty: q, unitPrice: mPrice });
            remainingPool -= q * mPrice;
          }
        }
        if (remainingPool >= 20000 && Math.random() > 0.4) {
          const yarim = smalls.find(s => s.basePrice >= 20000);
          if (yarim && getProductUnitPrice(yarim) < remainingPool - 5000) {
            rawBasket.push({ prod: yarim, qty: 1, unitPrice: getProductUnitPrice(yarim) });
            remainingPool -= getProductUnitPrice(yarim);
          }
        }
        const s1 = smalls.find(s => s.basePrice < 20000) || smalls[0];
        const qS = Math.max(1, Math.round(remainingPool / getProductUnitPrice(s1)));
        rawBasket.push({ prod: s1, qty: qS, unitPrice: getProductUnitPrice(s1) });
      } else {
        const availableBigs = [...bigs];
        const availableMeds = [...meds];
        const availableSmalls = [...smalls];
        const bigPickCount = goldNetPool >= 500000 ? 2 : (Math.random() > 0.3 ? 2 : 1);
        for (let i = 0; i < bigPickCount && availableBigs.length > 0; i++) {
          const b = availableBigs[i];
          const bPrice = getProductUnitPrice(b);
          const targetAmt = goldNetPool * (i === 0 ? 0.35 : 0.25);
          const q = Math.max(1, Math.floor(targetAmt / bPrice));
          if (q > 0 && q * bPrice < remainingPool - 30000) {
            rawBasket.push({ prod: b, qty: q, unitPrice: bPrice });
            remainingPool -= q * bPrice;
          }
        }
        const medPickCount = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < medPickCount && i < availableMeds.length; i++) {
          const m = availableMeds[i];
          const mPrice = getProductUnitPrice(m);
          const targetAmt = remainingPool * 0.45;
          const q = Math.max(1, Math.floor(targetAmt / mPrice));
          if (q > 0 && q * mPrice < remainingPool - 8000) {
            rawBasket.push({ prod: m, qty: q, unitPrice: mPrice });
            remainingPool -= q * mPrice;
          }
        }
        if (remainingPool >= 25000 && availableSmalls.some(s => s.basePrice >= 20000)) {
          const yarim = availableSmalls.find(s => s.basePrice >= 20000);
          const yPrice = getProductUnitPrice(yarim);
          const qY = Math.max(1, Math.floor((remainingPool - 10000) / yPrice));
          if (qY > 0) {
            rawBasket.push({ prod: yarim, qty: qY, unitPrice: yPrice });
            remainingPool -= qY * yPrice;
          }
        }
        const finalSmall = availableSmalls.find(s => s.basePrice < 20000) || availableSmalls[0];
        const sPrice = getProductUnitPrice(finalSmall);
        const qFinal = Math.max(1, Math.round(remainingPool / sPrice));
        rawBasket.push({ prod: finalSmall, qty: qFinal, unitPrice: sPrice });
      }

      const items = [];
      let calculatedGoldTotal = 0;

      for (let idx = 0; idx < rawBasket.length; idx++) {
        const bItem = rawBasket[idx];
        const isLast = idx === rawBasket.length - 1;

        if (!isLast) {
          const lineTotal = Math.round(bItem.qty * bItem.unitPrice * 100) / 100;
          calculatedGoldTotal = Math.round((calculatedGoldTotal + lineTotal) * 100) / 100;
          items.push({
            id: bItem.prod.id,
            name: bItem.prod.name,
            malHizmet: `${bItem.prod.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
            reference: bItem.prod.reference,
            url: bItem.prod.url,
            qty: bItem.qty,
            miktar: bItem.qty,
            birim: 'C62',
            unitPrice: bItem.unitPrice,
            birimFiyat: bItem.unitPrice.toFixed(2),
            lineTotal: lineTotal,
            fiyat: lineTotal.toFixed(2),
            malHizmetTutari: lineTotal.toFixed(2),
            kdvRate: 0,
            kdvOrani: 0,
            kdvTutari: '0.00',
            ozelMatrahNedeni: '351',
            ozelMatrahTutari: lineTotal.toFixed(2)
          });
        } else {
          const lastLineTotal = Math.round((goldNetPool - calculatedGoldTotal) * 100) / 100;
          const candidateUnit = Math.round((lastLineTotal / bItem.qty) * 100) / 100;
          const displayName = `${bItem.prod.name} (Kıymetli Maden Bedeli - Özel Matrah)`;

          if (Math.round(candidateUnit * bItem.qty * 100) === Math.round(lastLineTotal * 100)) {
            items.push({
              id: bItem.prod.id,
              name: bItem.prod.name,
              malHizmet: displayName,
              reference: bItem.prod.reference,
              url: bItem.prod.url,
              qty: bItem.qty,
              miktar: bItem.qty,
              birim: 'C62',
              unitPrice: candidateUnit,
              birimFiyat: candidateUnit.toFixed(2),
              lineTotal: lastLineTotal,
              fiyat: lastLineTotal.toFixed(2),
              malHizmetTutari: lastLineTotal.toFixed(2),
              kdvRate: 0,
              kdvOrani: 0,
              kdvTutari: '0.00',
              ozelMatrahNedeni: '351',
              ozelMatrahTutari: lastLineTotal.toFixed(2)
            });
          } else if (bItem.qty > 1) {
            const baseQty = bItem.qty - 1;
            const baseUnit = Math.floor((lastLineTotal / bItem.qty) * 100) / 100;
            const baseTotal = Math.round(baseQty * baseUnit * 100) / 100;
            const remTotal = Math.round((lastLineTotal - baseTotal) * 100) / 100;
            items.push({
              id: bItem.prod.id,
              name: bItem.prod.name,
              malHizmet: displayName,
              reference: bItem.prod.reference,
              url: bItem.prod.url,
              qty: baseQty,
              miktar: baseQty,
              birim: 'C62',
              unitPrice: baseUnit,
              birimFiyat: baseUnit.toFixed(2),
              lineTotal: baseTotal,
              fiyat: baseTotal.toFixed(2),
              malHizmetTutari: baseTotal.toFixed(2),
              kdvRate: 0,
              kdvOrani: 0,
              kdvTutari: '0.00',
              ozelMatrahNedeni: '351',
              ozelMatrahTutari: baseTotal.toFixed(2)
            });
            items.push({
              id: bItem.prod.id,
              name: bItem.prod.name,
              malHizmet: displayName,
              reference: bItem.prod.reference,
              url: bItem.prod.url,
              qty: 1,
              miktar: 1,
              birim: 'C62',
              unitPrice: remTotal,
              birimFiyat: remTotal.toFixed(2),
              lineTotal: remTotal,
              fiyat: remTotal.toFixed(2),
              malHizmetTutari: remTotal.toFixed(2),
              kdvRate: 0,
              kdvOrani: 0,
              kdvTutari: '0.00',
              ozelMatrahNedeni: '351',
              ozelMatrahTutari: remTotal.toFixed(2)
            });
          } else {
            items.push({
              id: bItem.prod.id,
              name: bItem.prod.name,
              malHizmet: displayName,
              reference: bItem.prod.reference,
              url: bItem.prod.url,
              qty: 1,
              miktar: 1,
              birim: 'C62',
              unitPrice: lastLineTotal,
              birimFiyat: lastLineTotal.toFixed(2),
              lineTotal: lastLineTotal,
              fiyat: lastLineTotal.toFixed(2),
              malHizmetTutari: lastLineTotal.toFixed(2),
              kdvRate: 0,
              kdvOrani: 0,
              kdvTutari: '0.00',
              ozelMatrahNedeni: '351',
              ozelMatrahTutari: lastLineTotal.toFixed(2)
            });
          }
        }
      }

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
        totalWithKdv: exactWorkmanshipGross,
        ozelMatrahNedeni: '',
        ozelMatrahTutari: 0
      });

      const totalMatrah = Math.round((goldNetPool + workmanshipNet) * 100) / 100;
      const finalGrandTotal = Math.round((totalMatrah + workmanshipKdv) * 100) / 100;

      return {
        isVip22: true,
        tag: '/22',
        productName: items.filter(i => !i.malHizmet.includes('İşçilik')).map(i => `${i.name} (x${i.qty})`).join(' + '),
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

  global.VipEngine = VipEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VipEngine, VIP_22_CATALOG };
  }
})(typeof window !== 'undefined' ? window : this);
