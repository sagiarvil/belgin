/**
 * BELGIN KUYUMCULUK — YAPI KREDİ POSNET PROVIDER ADAPTER (FAIL-CLOSED SCAFFOLD)
 * Teknik doküman ve resmi API parametreleri geldiğinde entegre edilecektir.
 */

const { PROVIDERS } = require('../payment-constants');

class YapiKrediProvider {
  constructor() {
    this.name = PROVIDERS.YAPIKREDI;
  }

  async createPayment() {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Yapı Kredi Posnet sanal POS entegrasyonu teknik doküman ve API kimlik bilgileri bekleniyor.');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  verifyCallback() {
    return {
      isValid: false,
      reason: 'PROVIDER_NOT_CONFIGURED',
    };
  }

  async queryPayment() {
    throw new Error('PROVIDER_NOT_CONFIGURED: Yapı Kredi sorgulama servisi aktif değil.');
  }

  async cancelPayment() {
    throw new Error('PROVIDER_NOT_CONFIGURED: Yapı Kredi iptal servisi aktif değil.');
  }

  async refundPayment() {
    throw new Error('PROVIDER_NOT_CONFIGURED: Yapı Kredi iade servisi aktif değil.');
  }
}

module.exports = new YapiKrediProvider();
