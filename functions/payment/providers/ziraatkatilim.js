'use strict';

/**
 * BELGIN KUYUMCULUK — ZIRAAT KATILIM PAYFOR 3DHOST ADAPTER
 *
 * Isolation contract:
 * - Kuveyt Türk adapter/config/callback flow is not imported or modified here.
 * - Ziraat credentials are read only from server environment variables.
 * - Card PAN/CVV/expiry are never requested by this adapter; 3DHost collects them on bank page.
 * - Fail-closed if API password, MerchantPass or callback endpoint cannot be resolved.
 */

const crypto = require('crypto');
const { PROVIDERS } = require('../payment-constants');

const MAX_TRANSACTION_TRY = 200000;
const DEFAULT_GATEWAY_URL = 'https://vpos.ziraatkatilim.com.tr/MPI/3DHost.aspx';

function sha1Base64Ascii(value) {
  return crypto.createHash('sha1').update(Buffer.from(String(value), 'ascii')).digest('base64');
}

function safeEqualBase64(left, right) {
  const a = Buffer.from(String(left || '').replace(/ /g, '+').trim(), 'utf8');
  const b = Buffer.from(String(right || '').replace(/ /g, '+').trim(), 'utf8');
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function resolveCallbackUrl() {
  const explicit = String(process.env.ZIRAAT_CALLBACK_URL || '').trim();
  if (explicit) return explicit;

  const projectId = String(
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    ''
  ).trim();

  if (!projectId) {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Ziraat Katılım callback URL/proje kimliği bulunamadı.');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  const region = String(process.env.FUNCTION_REGION || 'us-central1').trim();
  return `https://${region}-${projectId}.cloudfunctions.net/ziraatPaymentCallback`;
}

function getConfig() {
  const mbrId = String(process.env.ZIRAAT_MBR_ID || '12').trim();
  const merchantId = String(process.env.ZIRAAT_MERCHANT_ID || '9814992').trim();
  const userCode = String(process.env.ZIRAAT_API_USER || 'apibelginkymclk').trim();
  const userPass = String(process.env.ZIRAAT_API_PASSWORD || '');
  const merchantPass = String(process.env.ZIRAAT_MERCHANT_PASS || '');
  const gatewayUrl = String(process.env.ZIRAAT_3DHOST_URL || DEFAULT_GATEWAY_URL).trim();
  const secureType = String(process.env.ZIRAAT_SECURE_TYPE || '3DHost').trim();

  if (!mbrId || !merchantId || !userCode || !userPass || !merchantPass || !gatewayUrl) {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Ziraat Katılım API kullanıcı/3DHost secret yapılandırması eksik.');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  return {
    mbrId,
    merchantId,
    userCode,
    userPass,
    merchantPass,
    gatewayUrl,
    secureType,
    callbackUrl: resolveCallbackUrl(),
  };
}

function normalizeOrderId(body, order) {
  return String(
    body?.OrderId ||
    body?.orderId ||
    body?.ORDERID ||
    body?.oid ||
    body?.merchant_oid ||
    order?.orderId ||
    ''
  ).trim();
}

class ZiraatKatilimProvider {
  constructor() {
    this.name = PROVIDERS.ZIRAATKATILIM;
  }

  async createPayment(params) {
    const order = params?.order || params;
    if (!order) {
      const error = new Error('Geçersiz sipariş verisi.');
      error.code = 'INVALID_ORDER';
      throw error;
    }

    const config = getConfig();
    const total = Number(order.total ?? order.totalAmount);

    if (!Number.isFinite(total) || total <= 0 || total > MAX_TRANSACTION_TRY) {
      const error = new Error(`Ziraat Katılım tek işlem tutarı 0,01 TL ile ${MAX_TRANSACTION_TRY.toLocaleString('tr-TR')} TL arasında olmalıdır.`);
      error.code = 'ZIRAAT_AMOUNT_LIMIT';
      throw error;
    }

    const orderId = String(order.orderId || order.id || '').trim();
    if (!orderId) {
      const error = new Error('Ziraat Katılım için OrderId zorunludur.');
      error.code = 'INVALID_ORDER';
      throw error;
    }

    // PayFor dokümanındaki alan sırası ve 3DHost hash sözleşmesi.
    const purchAmount = total.toFixed(2);
    const txnType = 'Auth';
    const installmentCount = '0';
    const rnd = crypto.randomBytes(16).toString('hex');
    const okUrl = config.callbackUrl;
    const failUrl = config.callbackUrl;

    const hashInput = [
      config.mbrId,
      orderId,
      purchAmount,
      okUrl,
      failUrl,
      txnType,
      installmentCount,
      rnd,
      config.merchantPass,
    ].join('');

    const hash = sha1Base64Ascii(hashInput);

    return {
      success: true,
      provider: PROVIDERS.ZIRAATKATILIM,
      paymentType: 'FORM_POST',
      merchant_oid: orderId,
      gatewayUrl: config.gatewayUrl,
      formData: {
        MbrId: config.mbrId,
        MerchantID: config.merchantId,
        UserCode: config.userCode,
        UserPass: config.userPass,
        SecureType: config.secureType,
        TxnType: txnType,
        InstallmentCount: installmentCount,
        Currency: '949',
        OkUrl: okUrl,
        FailUrl: failUrl,
        OrderId: orderId,
        PurchAmount: purchAmount,
        Lang: 'TR',
        Rnd: rnd,
        Hash: hash,
      },
    };
  }

  async verifyCallback(params) {
    const body = params?.body || params || {};
    const order = params?.order || {};
    const config = getConfig();

    const orderId = normalizeOrderId(body, order);
    const expectedOrderId = String(order?.orderId || '').trim();

    if (!orderId || !expectedOrderId || orderId !== expectedOrderId) {
      return {
        isValid: false,
        isSuccess: false,
        orderId: orderId || expectedOrderId,
        reason: 'ORDER_ID_MISMATCH',
      };
    }

    const procReturnCode = String(body.ProcReturnCode ?? body.procReturnCode ?? '').trim();
    const authCode = String(body.AuthCode ?? body.authCode ?? '').trim();
    const responseRnd = String(body.ResponseRnd ?? body.responseRnd ?? '').trim();
    const responseHash = String(body.ResponseHash ?? body.responseHash ?? '').replace(/ /g, '+').trim();
    const txnResult = String(body.TxnResult ?? body.txnResult ?? '').trim();
    const errorMessage = String(body.ErrorMessage ?? body.errorMessage ?? '').trim();

    if (!procReturnCode || !responseRnd || !responseHash) {
      return {
        isValid: false,
        isSuccess: false,
        orderId,
        reason: 'RESPONSE_HASH_FIELDS_MISSING',
      };
    }

    const expectedHash = sha1Base64Ascii(
      `${config.merchantId}${config.merchantPass}${orderId}${authCode}${procReturnCode}${responseRnd}`
    );

    if (!safeEqualBase64(responseHash, expectedHash)) {
      return {
        isValid: false,
        isSuccess: false,
        orderId,
        reason: 'RESPONSE_HASH_MISMATCH',
      };
    }

    const txnOk = !txnResult || /^(success|approved|ok)$/i.test(txnResult);
    const isSuccess = procReturnCode === '00' && txnOk;

    return {
      isValid: true,
      isSuccess,
      orderId,
      authCode: authCode || null,
      provider: PROVIDERS.ZIRAATKATILIM,
      terminalId: config.merchantId,
      totalAmountReceived: String(order.amountInKurus || Math.round(Number(order.total || order.totalAmount || 0) * 100)),
      failReasonCode: isSuccess ? null : (procReturnCode || 'PAYMENT_FAILED'),
      failReasonMsg: isSuccess ? null : (errorMessage || txnResult || 'Ziraat Katılım işlemi onaylanmadı.'),
      rawPaymentDetails: {
        authCode: authCode || null,
        orderId,
        procReturnCode,
        txnResult: txnResult || null,
        responseRnd,
        responseHashVerified: true,
        errorMessage: errorMessage || null,
        callbackTimestamp: new Date().toISOString(),
      },
    };
  }
}

const provider = new ZiraatKatilimProvider();

// Test/gate helpers contain no credentials and make the deterministic bank contract auditable.
provider.__test = Object.freeze({
  MAX_TRANSACTION_TRY,
  sha1Base64Ascii,
  safeEqualBase64,
});

module.exports = provider;
