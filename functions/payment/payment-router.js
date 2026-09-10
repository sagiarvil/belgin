/**
 * BELGIN KUYUMCULUK — PAYMENT PROVIDER ROUTER
 * Çoklu POS Yönlendiricisi & Güvenlik Kapısı
 */

const { PROVIDERS, DEFAULT_PROVIDER } = require('./payment-constants');
const paytrProvider = require('./providers/paytr');
const qnbProvider = require('./providers/qnb');
const kuveytTurkProvider = require('./providers/kuveytturk');
const ziraatKatilimProvider = require('./providers/ziraatkatilim');
const yapiKrediProvider = require('./providers/yapikredi');

const PROVIDER_REGISTRY = Object.freeze({
  [PROVIDERS.KUVEYTTURK]: kuveytTurkProvider,
  [PROVIDERS.ZIRAATKATILIM]: ziraatKatilimProvider,
  'ZIRAAT': ziraatKatilimProvider,
  'ZIRAAT_KATILIM': ziraatKatilimProvider,
  [PROVIDERS.PAYTR]: paytrProvider,
  [PROVIDERS.QNB]: qnbProvider,
  [PROVIDERS.YAPIKREDI]: yapiKrediProvider,
});

class PaymentRouter {
  getProvider(providerName = DEFAULT_PROVIDER) {
    if (!providerName) return PROVIDER_REGISTRY[DEFAULT_PROVIDER];
    let key = String(providerName).trim().toUpperCase();
    if (key === 'ZIRAAT' || key === 'ZIRAAT_KATILIM') {
      key = PROVIDERS.ZIRAATKATILIM;
    }
    const provider = PROVIDER_REGISTRY[key] || PROVIDER_REGISTRY[providerName];
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
