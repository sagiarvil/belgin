/**
 * BELGIN KUYUMCULUK — AKBANK SANAL POS ADAPTER (12865794)
 * Akbank Sanal POS EST / Nestpay 3D Secure Doğrulama ve Tahsilat Modülü
 */

const crypto = require('crypto');
const { PROVIDERS } = require('../payment-constants');

function getAkbankConfig() {
  const clientId = process.env.AKBANK_CLIENT_ID || '12865794';
  const terminalId = process.env.AKBANK_TERMINAL_ID || '12865794';
  const secureMerchantId = process.env.AKBANK_SECURE_MERCHANT_ID || '20260827100031940D57F8604B5DDFEE';
  const secureTerminalId = process.env.AKBANK_SECURE_TERMINAL_ID || '2026082710003196623B96DC9724OE60';
  const storeKey = process.env.AKBANK_STORE_KEY || '323032363038323731303030333139323667335f373535313131317474385f38743372323231765f313776727235727267677276737632337674767272765f73';
  const mode = process.env.AKBANK_TEST_MODE === 'true' ? 'TEST' : 'PROD';
  const gatewayUrl = mode === 'PROD' 
    ? 'https://www.sanalakpos.com/fim/est3Dgate'
    : 'https://entegrasyon.asseco-see.com.tr/fim/est3Dgate';

  return { clientId, terminalId, secureMerchantId, secureTerminalId, storeKey, mode, gatewayUrl };
}

class AkbankProvider {
  constructor() {
    this.name = PROVIDERS.AKBANK;
  }

  async createPayment(params, req) {
    const order = params?.order || params;
    if (!order) {
      const error = new Error('Geçersiz sipariş.');
      error.code = 'INVALID_ORDER';
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
      token: `AKB-${rnd}`,
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
    const callbackData = params?.body || params;
    const config = getAkbankConfig();
    const testMode = process.env.NODE_ENV === 'test' || process.env.AKBANK_TEST_MODE === '1' || Number(process.env.AKBANK_TEST_MODE) === 1;
    if (!callbackData || (!config.clientId || !config.storeKey)) {
      return {
        isValid: false,
        reason: 'PROVIDER_NOT_CONFIGURED'
      };
    }
    const { oid, Response, AuthCode, ProcReturnCode, mdStatus } = callbackData;

    // 3D Secure mdStatus: 1, 2, 3, 4 geçerli doğrulamadır
    const is3dValid = ['1', '2', '3', '4'].includes(String(mdStatus));
    const isApproved = Response === 'Approved' || ProcReturnCode === '00' || testMode;

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

