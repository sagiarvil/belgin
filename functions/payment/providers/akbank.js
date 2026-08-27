/**
 * BELGIN KUYUMCULUK — AKBANK SANAL POS ADAPTER (12865794)
 * Akbank Sanal POS EST / Nestpay 3D Secure Doğrulama ve Tahsilat Modülü
 */

const crypto = require('crypto');
const { PROVIDERS } = require('../payment-constants');

function getAkbankConfig() {
  const clientId = process.env.AKBANK_CLIENT_ID || '12865794';
  const storeKey = process.env.AKBANK_STORE_KEY || 'BELGIN_AKBANK_STOREKEY_12865794';
  const mode = process.env.AKBANK_TEST_MODE === 'false' ? 'PROD' : 'TEST';
  const gatewayUrl = mode === 'PROD' 
    ? 'https://www.sanalakpos.com/fim/est3Dgate'
    : 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate';

  return { clientId, storeKey, mode, gatewayUrl };
}

class AkbankProvider {
  constructor() {
    this.name = PROVIDERS.AKBANK;
  }

  async createPayment(order, req) {
    if (!order || (!process.env.AKBANK_CLIENT_ID && !process.env.AKBANK_STORE_KEY)) {
      const error = new Error('PROVIDER_NOT_CONFIGURED: Akbank sanal POS entegrasyonu teknik doküman ve API kimlik bilgileri bekleniyor.');
      error.code = 'PROVIDER_NOT_CONFIGURED';
      throw error;
    }
    const config = getAkbankConfig();
    const amount = (order.amountInKurus / 100).toFixed(2);
    const okUrl = `https://www.belginkuyumculuk.com/api/payment/callback/akbank?status=success&oid=${order.orderId}`;
    const failUrl = `https://www.belginkuyumculuk.com/api/payment/callback/akbank?status=fail&oid=${order.orderId}`;
    const rnd = Date.now().toString();
    const currency = '949'; // TL
    const storetype = '3d_pay';

    // Hash: clientId + oid + amount + okUrl + failUrl + storetype + rnd + storeKey
    const hashStr = [config.clientId, order.orderId, amount, okUrl, failUrl, storetype, rnd, config.storeKey].join('');
    const hash = crypto.createHash('sha512').update(hashStr, 'utf-8').digest('base64');

    return {
      paymentType: 'REDIRECT',
      provider: PROVIDERS.AKBANK,
      merchant_oid: order.orderId,
      gatewayUrl: config.gatewayUrl,
      postParams: {
        clientid: config.clientId,
        amount: amount,
        oid: order.orderId,
        okUrl: okUrl,
        failUrl: failUrl,
        rnd: rnd,
        hash: hash,
        storetype: storetype,
        currency: currency,
        lang: 'tr'
      }
    };
  }

  verifyCallback(params, req) {
    if (!params || (!process.env.AKBANK_CLIENT_ID && !process.env.AKBANK_STORE_KEY)) {
      return {
        isValid: false,
        reason: 'PROVIDER_NOT_CONFIGURED'
      };
    }
    const config = getAkbankConfig();
    const { oid, Response, AuthCode, ProcReturnCode, mdStatus } = params;

    // 3D Secure mdStatus: 1, 2, 3, 4 geçerli doğrulamadır
    const is3dValid = ['1', '2', '3', '4'].includes(String(mdStatus));
    const isApproved = Response === 'Approved' || ProcReturnCode === '00';

    if (!isApproved) {
      return {
        isValid: false,
        reason: params.ErrMsg || 'İşlem banka tarafından onaylanmadı.',
        orderId: oid
      };
    }

    return {
      isValid: true,
      orderId: oid,
      authCode: AuthCode,
      provider: PROVIDERS.AKBANK,
      terminalId: config.clientId
    };
  }

  async queryPayment(orderId) {
    return { orderId, status: 'PROCESSED', provider: PROVIDERS.AKBANK };
  }

  async cancelPayment(orderId) {
    return { orderId, status: 'CANCEL_REQUESTED', provider: PROVIDERS.AKBANK };
  }

  async refundPayment(orderId, amount) {
    return { orderId, refundAmount: amount, status: 'REFUND_REQUESTED', provider: PROVIDERS.AKBANK };
  }
}

module.exports = new AkbankProvider();

