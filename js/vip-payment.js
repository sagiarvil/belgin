// BELGIN KUYUMCULUK — VIP ÖDEME LİNKİ & CHECKOUT MOTORU
// Prestijli Temiz URL (Clean Slug & Amount), Kompakt Maskeleme ve WhatsApp Entegrasyonu
(function (global) {
  'use strict';

  function slugify(value) {
    const tr = {
      'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g',
      'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o',
      'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
    };

    return String(value ?? '')
      .split('')
      .map(ch => tr[ch] ?? ch)
      .join('')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' ve ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  function unslugify(slug) {
    if (!slug) return 'Lüks Showroom Siparişi';
    return slug
      .split('-')
      .map(word => {
        if (!word) return '';
        if (word.length <= 2) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

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

  const VipEngine = {
    slugify,
    unslugify,

    // 1. Prestijli Temiz URL Üretimi (/vip/rolex-submariner-41mm-date-55555)
    buildPremiumUrl(payload, customOrigin) {
      const origin = customOrigin || (typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.belginkuyumculuk.com');
      const slug = slugify(payload.title || 'ozel-siparis');
      const amount = Math.round(Number(payload.amount) || 0);
      return `${origin}/vip/${slug}-${amount}`;
    },

    // 2. Prestijli URL Path Çözümleme (Örn: /vip/rolex-submariner-55555)
    resolveFromPath(pathname) {
      if (!pathname) return null;
      const cleanPath = pathname.replace(/\/+$/, '');
      const match = cleanPath.match(/\/vip\/([a-zA-Z0-9_-]+)-(\d+)$/);
      if (match) {
        const slug = match[1];
        const amount = Number(match[2]);
        const title = unslugify(slug);
        return {
          orderId: 'VIP-' + Math.floor(100000 + Math.random() * 900000),
          title,
          amount
        };
      }
      return null;
    },

    // 3. Kompakt Maskeli Token Üretimi (orderId|title|amount)
    encodeCompact(payload) {
      try {
        const orderId = String(payload.orderId || '').trim();
        const title = String(payload.title || '').trim();
        const amount = String(payload.amount || '').trim();
        const compactStr = `${orderId}|${title}|${amount}`;
        return toBase64Url(compactStr);
      } catch (e) {
        console.error('VipEngine compact encode error:', e);
        return null;
      }
    },

    // 4. Kompakt Token Çözümleme
    decodeCompact(token) {
      try {
        if (!token) return null;
        const decoded = fromBase64Url(token);
        const parts = decoded.split('|');
        if (parts.length >= 3) {
          return {
            orderId: parts[0],
            title: parts[1],
            amount: Number(parts[2]) || 0
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    },

    // 5. Standart JSON Base64URL Encode (Geriye dönük uyumluluk)
    encodePayload(data) {
      try {
        const jsonStr = JSON.stringify(data);
        return toBase64Url(jsonStr);
      } catch (e) {
        console.error('VipEngine encode error:', e);
        return null;
      }
    },

    // 6. Standart JSON Base64URL Decode
    decodePayload(token) {
      try {
        if (!token) return null;
        const jsonStr = fromBase64Url(token);
        return JSON.parse(jsonStr);
      } catch (e) {
        return null;
      }
    },

    // 7. Akıllı Çözücü (Sırasıyla: Path -> Kompakt Token -> JSON Token)
    resolvePayload(param, pathname) {
      if (pathname) {
        const fromPath = this.resolveFromPath(pathname);
        if (fromPath && fromPath.amount > 0) return fromPath;
      }
      if (!param) return null;
      const compact = this.decodeCompact(param);
      if (compact && compact.amount > 0) return compact;
      const json = this.decodePayload(param);
      if (json && json.amount > 0) return json;
      return null;
    },

    // 8. Sade & Güvenli WhatsApp Mesaj Metni
    buildWhatsAppMessageText(payload, shortUrl) {
      const title = payload.title || 'Siparişiniz';
      const amount = Number(payload.amount || 0).toLocaleString('tr-TR');

      return `${title} için güvenli ödeme bağlantınız hazırlanmıştır:

Tutar: ₺${amount}
Güvenli Ödeme Linki:
${shortUrl}

3D Secure güvencesiyle ödemenizi tamamlayabilirsiniz.`;
    },

    // 9. WhatsApp Paylaşım URL'i
    buildWhatsAppShareUrl(payload, shortUrl) {
      const message = this.buildWhatsAppMessageText(payload, shortUrl);
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }
  };

  global.VipEngine = VipEngine;
})(typeof window !== 'undefined' ? window : this);
