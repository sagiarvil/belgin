/**
 * BELGIN KUYUMCULUK — AKBANK PROVIDER ADAPTER (FAIL-CLOSED SCAFFOLD)
 * Teknik doküman ve resmi API parametreleri geldiğinde entegre edilecektir.
 */

const { PROVIDERS } = require('../payment-constants');

class AkbankProvider {
  constructor() {
    this.name = PROVIDERS.AKBANK;
  }

  async createPayment() {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Akbank sanal POS entegrasyonu teknik doküman ve API kimlik bilgileri bekleniyor.');
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
    throw new Error('PROVIDER_NOT_CONFIGURED: Akbank sorgulama servisi aktif değil.');
  }

  async cancelPayment() {
    throw new Error('PROVIDER_NOT_CONFIGURED: Akbank iptal servisi aktif değil.');
  }

  async refundPayment() {
    throw new Error('PROVIDER_NOT_CONFIGURED: Akbank iade servisi aktif değil.');
  }
}

module.exports = new AkbankProvider();
