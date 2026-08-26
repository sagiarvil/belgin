/**
 * BELGIN KUYUMCULUK — PAYTR PROVIDER ADAPTER
 * Hosted iFrame / 3D Secure Entegrasyonu
 */

const crypto = require('crypto');
const axios = require('axios');
const qs = require('qs');
const { PROVIDERS, PAYMENT_STATUS } = require('../payment-constants');

function getPayTRConfig() {
  const merchant_id = process.env.PAYTR_MERCHANT_ID || 'dummy_merchant_id';
  const merchant_key = process.env.PAYTR_MERCHANT_KEY || 'dummy_merchant_key';
  const merchant_salt = process.env.PAYTR_MERCHANT_SALT || 'dummy_merchant_salt';
  const api_url = process.env.PAYTR_API_URL || 'https://www.paytr.com/odeme/api/get-token';

  if (!merchant_id || !merchant_key || !merchant_salt) {
    const error = new Error('PayTR entegrasyon anahtarları eksik.');
    error.code = 'PAYTR_CONFIG_MISSING';
    throw error;
  }

  return { merchant_id, merchant_key, merchant_salt, api_url };
}

function generatePayTRToken(params, config) {
  const hashStr =
    String(params.merchant_id) +
    String(params.user_ip) +
    String(params.merchant_oid) +
    String(params.email) +
    String(params.payment_amount) +
    String(params.user_basket) +
    String(params.no_installment) +
    String(params.max_installment) +
    String(params.currency) +
    String(params.test_mode) +
    String(config.merchant_salt);

  return crypto.createHmac('sha256', config.merchant_key).update(hashStr).digest('base64');
}

function encodeUserBasket(items) {
  const basket = items.map((item) => [item.name, item.price.toFixed(2), String(item.qty)]);
  return Buffer.from(JSON.stringify(basket)).toString('base64');
}

class PayTRProvider {
  constructor() {
    this.name = PROVIDERS.PAYTR;
  }

  async createPayment({ order, clientIp, testMode = false }) {
    const config = getPayTRConfig();
    const basketBase64 = encodeUserBasket(order.items);
    const amountInKurus = String(Math.round(order.total * 100));

    const params = {
      merchant_id: config.merchant_id,
      user_ip: clientIp || '127.0.0.1',
      merchant_oid: order.orderId,
      email: order.customer.email,
      payment_amount: amountInKurus,
      paytr_token: '',
      user_basket: basketBase64,
      debug_on: testMode ? 1 : 0,
      test_mode: testMode ? 1 : 0,
      no_installment: 1, // Kuyumculukta %100 tek çekim
      max_installment: 1,
      user_name: String(order.customer.name || 'Müşteri').slice(0, 150),
      user_address: String(order.customer.address || '').slice(0, 1000),
      user_phone: String(order.customer.phone || '').slice(0, 50),
      merchant_ok_url: 'https://www.belginkuyumculuk.com/odeme-basarili',
      merchant_fail_url: 'https://www.belginkuyumculuk.com/odeme-basarisiz',
      timeout_limit: 30,
      currency: 'TL',
      lang: 'tr',
    };

    params.paytr_token = generatePayTRToken(params, config);

    const response = await axios.post(config.api_url, qs.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
      maxContentLength: 256 * 1024,
    });

    const result = response.data || {};
    if (result.status !== 'success' || !result.token) {
      const error = new Error(String(result.reason || 'PayTR token üretimi başarısız oldu.'));
      error.code = 'PROVIDER_TOKEN_FAILED';
      throw error;
    }

    return {
      provider: PROVIDERS.PAYTR,
      token: result.token,
      iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
      paymentType: 'IFRAME',
      merchant_oid: order.orderId,
      amountInKurus,
    };
  }

  verifyCallback({ body, order }) {
    const config = getPayTRConfig();
    const { merchant_oid, status, total_amount, hash, failed_reason_code, failed_reason_msg } = body || {};

    if (!merchant_oid || !status || !total_amount || !hash) {
      return { isValid: false, reason: 'MISSING_PARAMETERS' };
    }

    const hashStr = String(merchant_oid) + String(config.merchant_salt) + String(status) + String(total_amount);
    const expectedHash = crypto.createHmac('sha256', config.merchant_key).update(hashStr).digest('base64');

    const incoming = Buffer.from(String(hash));
    const expected = Buffer.from(expectedHash);

    if (incoming.length !== expected.length || !crypto.timingSafeEqual(incoming, expected)) {
      return { isValid: false, reason: 'BAD_HASH' };
    }

    if (String(total_amount) !== String(order.amountInKurus)) {
      return { isValid: false, reason: 'CALLBACK_AMOUNT_MISMATCH', received: total_amount, expected: String(order.amountInKurus) };
    }

    return {
      isValid: true,
      isSuccess: status === 'success',
      providerOrderId: merchant_oid,
      totalAmountReceived: String(total_amount),
      failReasonCode: failed_reason_code || null,
      failReasonMsg: failed_reason_msg || null,
    };
  }

  async queryPayment() {
    throw new Error('PayTR queryPayment API dokümantasyonu bekleniyor.');
  }

  async cancelPayment() {
    throw new Error('PayTR cancelPayment API dokümantasyonu bekleniyor.');
  }

  async refundPayment() {
    throw new Error('PayTR refundPayment API dokümantasyonu bekleniyor.');
  }
}

module.exports = new PayTRProvider();
