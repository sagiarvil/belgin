/**
 * BELGIN KUYUMCULUK — QNB FINANSBANK PROVIDER ADAPTER (FAIL-CLOSED SCAFFOLD)
 * Teknik doküman ve resmi API parametreleri geldiğinde entegre edilecektir.
 */

const { PROVIDERS } = require('../payment-constants');

class QNBProvider {
  constructor() {
    this.name = PROVIDERS.QNB;
  }

  async createPayment() {
    const error = new Error('PROVIDER_NOT_CONFIGURED: QNB Finansbank sanal POS entegrasyonu teknik doküman ve API kimlik bilgileri bekleniyor.');
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
    throw new Error('PROVIDER_NOT_CONFIGURED: QNB Finansbank sorgulama servisi aktif değil.');
  }

  async cancelPayment() {
    throw new Error('PROVIDER_NOT_CONFIGURED: QNB Finansbank iptal servisi aktif değil.');
  }

  async refundPayment() {
    throw new Error('PROVIDER_NOT_CONFIGURED: QNB Finansbank iade servisi aktif değil.');
  }
}

module.exports = new QNBProvider();
