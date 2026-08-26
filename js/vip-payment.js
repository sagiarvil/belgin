// BELGIN KUYUMCULUK — VIP ÖDEME LİNKİ & CHECKOUT MOTORU
// Güvenli Token Üretimi, Kompakt Maskeleme ve WhatsApp Entegrasyonu
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

  const VipEngine = {
    // 1. Kompakt Maskeli Token Üretimi (Kısa URL için: orderId|title|amount)
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

    // 2. Kompakt Token Çözümleme
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
        return JSON.parse(jsonStr);
      } catch (e) {
        return null;
      }
    },

    // 5. Akıllı Çözücü (Önce kompakt, sonra JSON dener)
    resolvePayload(param) {
      if (!param) return null;
      const compact = this.decodeCompact(param);
      if (compact && compact.amount > 0) return compact;
      const json = this.decodePayload(param);
      if (json && json.amount > 0) return json;
      return null;
    },

    // 6. Lüks WhatsApp Mesaj Metni
    buildWhatsAppMessageText(payload, shortUrl) {
      const title = payload.title || 'Lüks Showroom Ürünü';
      const amount = Number(payload.amount || 0).toLocaleString('tr-TR');

      return `Sayın Değerli Müşterimiz,

Belgin Kuyumculuk Buca Showroom'umuzda adınıza ayrılan *${title}* için VIP güvenli ödeme bağlantınız hazırlanmıştır:

💳 *Tutar:* ₺${amount}
🔒 *Güvenli Ödeme Linki:*
${shortUrl}

3D Secure ve 256-Bit SSL güvencesiyle ödemenizi tek çekim veya havale ile tamamlayabilirsiniz.`;
    },

    // 7. WhatsApp Paylaşım URL'i
    buildWhatsAppShareUrl(payload, shortUrl) {
      const message = this.buildWhatsAppMessageText(payload, shortUrl);
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }
  };

  global.VipEngine = VipEngine;
})(typeof window !== 'undefined' ? window : this);
