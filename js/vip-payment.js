// BELGIN KUYUMCULUK — VIP ÖDEME LİNKİ & CHECKOUT MOTORU
// Güvenli Token Üretimi, WhatsApp Entegrasyonu ve Müşteri Öz-Giriş Akışı
(function (global) {
  'use strict';

  const VipEngine = {
    // Base64URL Güvenli Encode
    encodePayload(data) {
      try {
        const jsonStr = JSON.stringify(data);
        const utf8Bytes = new TextEncoder().encode(jsonStr);
        let binary = '';
        for (let i = 0; i < utf8Bytes.length; i++) {
          binary += String.fromCharCode(utf8Bytes[i]);
        }
        return btoa(binary)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } catch (e) {
        console.error('VipEngine encode error:', e);
        return null;
      }
    },

    // Base64URL Güvenli Decode
    decodePayload(token) {
      try {
        if (!token) return null;
        let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const jsonStr = new TextDecoder().decode(bytes);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error('VipEngine decode error:', e);
        return null;
      }
    },

    // WhatsApp Mesajı Oluşturma (Genel Paylaşım Şablonu)
    buildWhatsAppShareUrl(payload, checkoutUrl) {
      const title = payload.title || 'Lüks Koleksiyon Ürünü';
      const amount = Number(payload.amount || 0).toLocaleString('tr-TR');
      const isHighValue = Number(payload.amount || 0) >= 12000;

      const message = 
`Sayın Değerli Müşterimiz,

Belgin Kuyumculuk & Saat (İzmir Buca Showroom) olarak belirlediğiniz *${title}* için güvenli ödeme bağlantınız hazırlanmıştır.

💳 *Ödeme Tutarı:* ₺${amount}
🔒 *256-Bit SSL 3D Secure VIP Ödeme Linki:*
${checkoutUrl}

${isHighValue ? '🏛️ *Teslimat:* 12.000 TL üzeri siparişlerde iç güvenlik protokolümüz gereği Buca Showroom mağazamızdan kimlik ibrazı ve teslim tutanağı ile teslim edilmektedir.\n' : ''}⚖️ *Yasal Güvence:* 6502 sayılı TKHK, 6698 sayılı KVKK ve HMK m.193 delil güvencesi altındadır. Lütfen bağlantı üzerinden alıcı bilgilerinizi girerek ödemenizi güvenle tamamlayınız.`;

      return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }
  };

  global.VipEngine = VipEngine;
})(typeof window !== 'undefined' ? window : this);
