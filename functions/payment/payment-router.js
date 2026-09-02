/**
 * BELGIN KUYUMCULUK — PAYMENT PROVIDER ROUTER
 * Çoklu POS Yönlendiricisi & Güvenlik Kapısı
 */

const { PROVIDERS, DEFAULT_PROVIDER } = require('./payment-constants');
const paytrProvider = require('./providers/paytr');
const qnbProvider = require('./providers/qnb');
const kuveytTurkProvider = require('./providers/kuveytturk');
const yapiKrediProvider = require('./providers/yapikredi');

const PROVIDER_REGISTRY = Object.freeze({
  [PROVIDERS.KUVEYTTURK]: kuveytTurkProvider,
  [PROVIDERS.PAYTR]: paytrProvider,
  [PROVIDERS.QNB]: qnbProvider,
  [PROVIDERS.YAPIKREDI]: yapiKrediProvider,
});

class PaymentRouter {
  getProvider(providerName = DEFAULT_PROVIDER) {
    if (!providerName) return PROVIDER_REGISTRY[DEFAULT_PROVIDER];
    const key = String(providerName).trim().toUpperCase();
    const provider = PROVIDER_REGISTRY[key];
    if (!provider) {
      const error = new Error(`Desteklenmeyen veya geçersiz ödeme sağlayıcısı: ${providerName}`);
      error.code = 'UNKNOWN_PROVIDER';
      throw error;
    }
    return provider;
  }

  listProviders() {
    return Object.keys(PROVIDER_REGISTRY);
  }
}

module.exports = new PaymentRouter();
