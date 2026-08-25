// BELGIN KUYUMCULUK — VIP ÖDEME LİNKİ & CHECKOUT MOTORU
// Güvenli Token Üretimi, WhatsApp Entegrasyonu ve VIP Ödeme Akışı
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

    // WhatsApp Mesajı Oluşturma
    buildWhatsAppUrl(phone, payload, checkoutUrl) {
      const cleanPhone = String(phone || '').replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('90') ? cleanPhone : ('90' + cleanPhone.replace(/^0/, ''));
      
      const title = payload.title || 'Lüks Koleksiyon Ürünü';
      const amount = Number(payload.amount || 0).toLocaleString('tr-TR');
      const customer = payload.customerName || 'Değerli Müşterimiz';
      const isHighValue = Number(payload.amount || 0) >= 12000;

      const message = 
`Sayın *${customer}*,

Belgin Kuyumculuk & Saat (İzmir Buca Showroom) olarak seçtiğiniz *${title}* için güvenli ödeme bağlantınız hazırlanmıştır.

💳 *Ödeme Tutarı:* ₺${amount}
🔒 *256-Bit SSL 3D Secure Ödeme:*
${checkoutUrl}

${isHighValue ? '🏛️ *Teslimat:* 12.000 TL üzeri siparişlerde iç güvenlik protokolümüz gereği Buca Showroom mağazamızdan kimlik ibrazı ve teslim tutanağı ile teslim edilmektedir.\n' : ''}⚖️ *Yasal Güvence:* 6502 sayılı TKHK, 6698 sayılı KVKK ve HMK m.193 delil güvencesi altındadır.

Sorularınız ve VIP randevunuz için bize 7/24 WhatsApp'tan yazabilirsiniz.`;

      return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    }
  };

  global.VipEngine = VipEngine;
})(typeof window !== 'undefined' ? window : this);
