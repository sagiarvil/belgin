'use strict';

/**
 * BELGIN KUYUMCULUK — ZIRAAT KATILIM PAYFOR 3DHOST ADAPTER
 *
 * Isolation contract:
 * - Kuveyt Türk adapter/config/callback flow is not imported or modified here.
 * - Ziraat credentials are read only from server environment variables.
 * - Card PAN/CVV/expiry are never requested by this adapter; 3DHost collects them on bank page.
 * - MerchantPass is used only for the outbound 3DHost request hash and is never posted to the browser.
 * - Callback ResponseHash is telemetry only for Ziraat Katılım; payment truth comes from server-to-server OrderInquiry.
 * - OrderInquiry is fail-closed and must confirm bank code, order id and amount before PAID.
 */

const crypto = require('crypto');
const axios = require('axios');
const { PROVIDERS } = require('../payment-constants');

const MAX_TRANSACTION_TRY = 200000;
const DEFAULT_GATEWAY_URL = 'https://vpos.ziraatkatilim.com.tr/MPI/3DHost.aspx';
const DEFAULT_PAYMENT_API_URL = 'https://vpos.ziraatkatilim.com.tr/Mpi/XMLGate.aspx';
const INQUIRY_TIMEOUT_MS = 8000;
const ALLOWED_PAYMENT_API_HOST = 'vpos.ziraatkatilim.com.tr';

function sha1Base64Ascii(value) {
  return crypto.createHash('sha1').update(Buffer.from(String(value), 'ascii')).digest('base64');
}

function safeEqualBase64(left, right) {
  const a = Buffer.from(String(left || '').replace(/ /g, '+').trim(), 'utf8');
  const b = Buffer.from(String(right || '').replace(/ /g, '+').trim(), 'utf8');
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

function formatPayForAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '';
  const minor = Math.round((amount + Number.EPSILON) * 100);
  return String(minor / 100);
}

function amountToKurus(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const normalized = String(value).trim().replace(',', '.');
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return String(Math.round((numeric + Number.EPSILON) * 100));
}

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlDecode(value) {
  return String(value ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

function extractXmlTag(xml, names) {
  const source = String(xml || '');
  for (const name of names) {
    const escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `<(?:[A-Za-z_][\\w.-]*:)?${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z_][\\w.-]*:)?${escaped}>`,
      'i'
    );
    const match = source.match(regex);
    if (match) return xmlDecode(match[1]);
  }
  return '';
}

function parsePayForInquiryXml(xml) {
  const source = String(xml || '').trim();
  if (!source || !source.includes('<')) return null;

  const responseCode = extractXmlTag(source, ['ProcReturnCode', 'ResponseCode']);
  const orderId = extractXmlTag(source, ['OrderId']);
  const orgOrderId = extractXmlTag(source, ['OrgOrderId']);
  const purchAmount = extractXmlTag(source, ['PurchAmount', 'TxnAmount']);

  return {
    responseCode,
    responseMessage: extractXmlTag(source, ['ResponseMessage', 'ErrMsg', 'ErrorMessage']),
    orderId,
    orgOrderId,
    purchAmount,
    txnType: extractXmlTag(source, ['TxnType']),
    authCode: extractXmlTag(source, ['AuthCode']),
    hostRefNum: extractXmlTag(source, ['HostRefNum', 'RRN', 'F37']),
    cardMask: extractXmlTag(source, ['CardMask']),
    voidDate: extractXmlTag(source, ['VoidDate']),
    isVoided: extractXmlTag(source, ['IsVoided']),
    refundedAmount: extractXmlTag(source, ['RefundedAmount', 'ReturnedAmount']),
    isRefunded: extractXmlTag(source, ['IsRefunded']),
    transactionDate: extractXmlTag(source, ['InsertDatetime', 'TxnDateTime', 'TransactionDate']),
  };
}

function validatePaymentApiUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || ''));
  } catch (_) {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Ziraat Katılım Payment API URL geçersiz.');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  const normalizedPath = parsed.pathname.toLowerCase();
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname.toLowerCase() !== ALLOWED_PAYMENT_API_HOST ||
    normalizedPath !== '/mpi/xmlgate.aspx'
  ) {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Ziraat Katılım Payment API URL güvenli allowlist ile eşleşmiyor.');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  return parsed.toString();
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

function getConfig({ requireMerchantPass = false } = {}) {
  const mbrId = String(process.env.ZIRAAT_MBR_ID || '12').trim();
  const merchantId = String(process.env.ZIRAAT_MERCHANT_ID || '9814992').trim();
  const userCode = String(process.env.ZIRAAT_API_USER || 'apibelginkymclk').trim();
  const userPass = String(process.env.ZIRAAT_API_PASSWORD || '');
  const merchantPass = String(process.env.ZIRAAT_MERCHANT_PASS || '');
  const gatewayUrl = String(process.env.ZIRAAT_3DHOST_URL || DEFAULT_GATEWAY_URL).trim();
  const paymentApiUrl = validatePaymentApiUrl(
    String(process.env.ZIRAAT_PAYMENT_API || DEFAULT_PAYMENT_API_URL).trim()
  );
  const secureType = String(process.env.ZIRAAT_SECURE_TYPE || '3DHost').trim();

  if (!mbrId || !merchantId || !userCode || !userPass || !gatewayUrl || !paymentApiUrl) {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Ziraat Katılım API kullanıcı/endpoint yapılandırması eksik.');
    error.code = 'PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  if (requireMerchantPass && !merchantPass) {
    const error = new Error('PROVIDER_NOT_CONFIGURED: Ziraat Katılım 3DHost MerchantPass yapılandırması eksik.');
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
    paymentApiUrl,
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

function callbackAmountInKurus(body) {
  const raw = body?.PurchAmount ?? body?.purchAmount ?? body?.TxnAmount ?? body?.txnAmount;
  return amountToKurus(raw);
}

function buildInquiryXml(config, orderId, mode = 'CURRENT') {
  const orderField = mode === 'LEGACY' ? 'OrderId' : 'OrgOrderId';
  const currency = mode === 'LEGACY' ? '<Currency>949</Currency>' : '';

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<PayforRequest>',
    `<MbrId>${xmlEscape(config.mbrId)}</MbrId>`,
    `<MerchantID>${xmlEscape(config.merchantId)}</MerchantID>`,
    `<UserCode>${xmlEscape(config.userCode)}</UserCode>`,
    `<UserPass>${xmlEscape(config.userPass)}</UserPass>`,
    `<${orderField}>${xmlEscape(orderId)}</${orderField}>`,
    '<SecureType>Inquiry</SecureType>',
    '<TxnType>OrderInquiry</TxnType>',
    currency,
    '<Lang>TR</Lang>',
    '</PayforRequest>',
  ].filter(Boolean).join('');
}

async function postInquiry(config, orderId, mode, httpClient) {
  const requestXml = buildInquiryXml(config, orderId, mode);
  const response = await httpClient.post(config.paymentApiUrl, requestXml, {
    timeout: INQUIRY_TIMEOUT_MS,
    maxRedirects: 0,
    responseType: 'text',
    transformResponse: [(data) => data],
    headers: {
      'Content-Type': 'text/xml; charset=UTF-8',
      Accept: 'text/xml, application/xml, text/plain',
    },
    validateStatus(status) {
      return status >= 200 && status < 300;
    },
  });

  const parsed = parsePayForInquiryXml(response?.data);
  if (!parsed) {
    const error = new Error('Ziraat Katılım OrderInquiry yanıtı XML olarak çözümlenemedi.');
    error.code = 'BANK_INQUIRY_PARSE_FAILED';
    throw error;
  }

  return {
    mode,
    httpStatus: Number(response?.status || 0),
    ...parsed,
  };
}

function inquiryMatchesOrder(inquiry, expectedOrderId) {
  const returnedOrderId = String(inquiry?.orderId || inquiry?.orgOrderId || '').trim();
  return Boolean(returnedOrderId) && returnedOrderId === String(expectedOrderId || '').trim();
}

function inquiryIsVoidedOrRefunded(inquiry) {
  const refundedKurus = amountToKurus(inquiry?.refundedAmount);
  const voided = /^(true|1|yes)$/i.test(String(inquiry?.isVoided || '').trim()) ||
    (/^\d+$/.test(String(inquiry?.voidDate || '').trim()) && Number(inquiry.voidDate) > 0);
  const refunded = /^(true|1|yes)$/i.test(String(inquiry?.isRefunded || '').trim()) ||
    (refundedKurus !== null && Number(refundedKurus) > 0);
  return { voided, refunded };
}

function evaluateInquiry(inquiry, order) {
  const expectedOrderId = String(order?.orderId || '').trim();
  const expectedAmountInKurus = String(
    order?.amountInKurus ||
    Math.round(Number(order?.total ?? order?.totalAmount ?? 0) * 100)
  );

  if (!inquiry || String(inquiry.responseCode || '').trim() !== '00') {
    return {
      confirmed: false,
      reason: 'BANK_INQUIRY_NOT_APPROVED',
      responseCode: String(inquiry?.responseCode || '').trim() || null,
    };
  }

  if (!inquiryMatchesOrder(inquiry, expectedOrderId)) {
    return {
      confirmed: false,
      reason: 'BANK_INQUIRY_ORDER_MISMATCH',
      responseCode: inquiry.responseCode,
    };
  }

  const amountInKurus = amountToKurus(inquiry.purchAmount);
  if (amountInKurus === null) {
    return {
      confirmed: false,
      reason: 'BANK_INQUIRY_AMOUNT_MISSING',
      responseCode: inquiry.responseCode,
    };
  }

  if (amountInKurus !== expectedAmountInKurus) {
    return {
      confirmed: false,
      reason: 'BANK_INQUIRY_AMOUNT_MISMATCH',
      responseCode: inquiry.responseCode,
      amountInKurus,
    };
  }

  const txnType = String(inquiry.txnType || '').trim();
  if (txnType && !/^(Auth|InstallmentAuth|PostAuth)$/i.test(txnType)) {
    return {
      confirmed: false,
      reason: 'BANK_INQUIRY_TXN_TYPE_MISMATCH',
      responseCode: inquiry.responseCode,
      amountInKurus,
    };
  }

  const state = inquiryIsVoidedOrRefunded(inquiry);
  if (state.voided || state.refunded) {
    return {
      confirmed: false,
      reason: state.voided ? 'BANK_INQUIRY_VOIDED' : 'BANK_INQUIRY_REFUNDED',
      responseCode: inquiry.responseCode,
      amountInKurus,
    };
  }

  return {
    confirmed: true,
    reason: null,
    responseCode: inquiry.responseCode,
    amountInKurus,
  };
}

async function queryBankOrder(config, order, httpClient = axios) {
  const orderId = String(order?.orderId || '').trim();
  if (!orderId) {
    const error = new Error('Ziraat Katılım OrderInquiry için OrderId zorunludur.');
    error.code = 'BANK_INQUIRY_ORDER_ID_MISSING';
    throw error;
  }

  const attempts = [];
  for (const mode of ['CURRENT', 'LEGACY']) {
    try {
      const inquiry = await postInquiry(config, orderId, mode, httpClient);
      const evaluation = evaluateInquiry(inquiry, order);
      attempts.push({
        mode,
        responseCode: inquiry.responseCode || null,
        returnedOrderId: inquiry.orderId || inquiry.orgOrderId || null,
        amountInKurus: amountToKurus(inquiry.purchAmount),
        confirmed: evaluation.confirmed,
        reason: evaluation.reason,
      });

      if (evaluation.confirmed) {
        return {
          ...inquiry,
          ...evaluation,
          attempts,
        };
      }
    } catch (error) {
      const reason = error?.code === 'ECONNABORTED'
        ? 'BANK_INQUIRY_TIMEOUT'
        : (String(error?.code || '').startsWith('BANK_INQUIRY_')
          ? error.code
          : 'BANK_INQUIRY_REQUEST_FAILED');
      attempts.push({
        mode,
        confirmed: false,
        reason,
      });
    }
  }

  const error = new Error('Ziraat Katılım ödeme sonucu bankadan doğrulanamadı.');
  error.code = attempts[attempts.length - 1]?.reason || 'BANK_INQUIRY_FAILED';
  error.inquiryAttempts = attempts;
  throw error;
}

function callbackHashTelemetry(config, body, orderId) {
  const procReturnCode = String(body.ProcReturnCode ?? body.procReturnCode ?? '').trim();
  const authCode = String(body.AuthCode ?? body.authCode ?? '').trim();
  const threeDStatus = String(body['3DStatus'] ?? body.threeDStatus ?? body.mdStatus ?? '').trim();
  const responseRnd = String(body.ResponseRnd ?? body.responseRnd ?? '').trim();
  const responseHash = String(body.ResponseHash ?? body.responseHash ?? '').replace(/ /g, '+').trim();

  if (!config.merchantPass || !procReturnCode || !responseRnd || !responseHash) {
    return {
      verified: false,
      variant: null,
      available: false,
    };
  }

  const expectedLegacyHash = sha1Base64Ascii(
    `${config.merchantId}${config.merchantPass}${orderId}${authCode}${procReturnCode}${responseRnd}`
  );
  const expectedExtendedHash = sha1Base64Ascii(
    `${config.merchantId}${config.merchantPass}${orderId}${authCode}${procReturnCode}${threeDStatus}${responseRnd}${config.userCode}`
  );

  if (safeEqualBase64(responseHash, expectedExtendedHash)) {
    return { verified: true, variant: 'EXTENDED', available: true };
  }
  if (safeEqualBase64(responseHash, expectedLegacyHash)) {
    return { verified: true, variant: 'LEGACY', available: true };
  }
  return { verified: false, variant: null, available: true };
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

    const config = getConfig({ requireMerchantPass: true });
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

    const purchAmount = formatPayForAmount(total);
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
    const httpClient = params?.httpClient || axios;
    const config = getConfig({ requireMerchantPass: false });

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
    const threeDStatus = String(body['3DStatus'] ?? body.threeDStatus ?? body.mdStatus ?? '').trim();
    const txnResult = String(body.TxnResult ?? body.txnResult ?? '').trim();
    const errorMessage = String(body.ErrorMessage ?? body.errorMessage ?? body.ErrMsg ?? '').trim();
    const callbackAmount = callbackAmountInKurus(body);
    const expectedAmountInKurus = String(
      order.amountInKurus ||
      Math.round(Number(order.total ?? order.totalAmount ?? 0) * 100)
    );
    const hashTelemetry = callbackHashTelemetry(config, body, orderId);

    let inquiry;
    try {
      inquiry = await queryBankOrder(config, order, httpClient);
    } catch (error) {
      return {
        isValid: false,
        isSuccess: false,
        orderId,
        reason: error.code || 'BANK_INQUIRY_FAILED',
        bankInquiry: {
          confirmed: false,
          reason: error.code || 'BANK_INQUIRY_FAILED',
          attempts: Array.isArray(error.inquiryAttempts) ? error.inquiryAttempts : [],
        },
        rawPaymentDetails: {
          orderId,
          callbackProcReturnCode: procReturnCode || null,
          callbackThreeDStatus: threeDStatus || null,
          callbackTxnResult: txnResult || null,
          callbackAmountInKurus: callbackAmount,
          callbackAmountMatchesOrder: callbackAmount === null ? null : callbackAmount === expectedAmountInKurus,
          responseHashVerified: hashTelemetry.verified,
          responseHashVariant: hashTelemetry.variant,
          responseHashAvailable: hashTelemetry.available,
          bankInquiryConfirmed: false,
          callbackTimestamp: new Date().toISOString(),
        },
      };
    }

    const bankAuthCode = String(inquiry.authCode || authCode || '').trim();
    const returnedOrderId = String(inquiry.orderId || inquiry.orgOrderId || '').trim();

    return {
      isValid: true,
      isSuccess: true,
      orderId,
      authCode: bankAuthCode || null,
      provider: PROVIDERS.ZIRAATKATILIM,
      terminalId: config.merchantId,
      totalAmountReceived: inquiry.amountInKurus,
      failReasonCode: null,
      failReasonMsg: null,
      bankInquiry: {
        confirmed: true,
        mode: inquiry.mode,
        responseCode: inquiry.responseCode,
        orderId: returnedOrderId,
        amountInKurus: inquiry.amountInKurus,
        authCode: bankAuthCode || null,
        hostRefNum: inquiry.hostRefNum || null,
        transactionDate: inquiry.transactionDate || null,
        attempts: inquiry.attempts,
      },
      rawPaymentDetails: {
        authCode: bankAuthCode || null,
        orderId,
        procReturnCode: inquiry.responseCode,
        hostRefNum: inquiry.hostRefNum || null,
        cardMask: inquiry.cardMask || null,
        bankTxnType: inquiry.txnType || null,
        callbackProcReturnCode: procReturnCode || null,
        callbackThreeDStatus: threeDStatus || null,
        callbackTxnResult: txnResult || null,
        callbackErrorMessage: errorMessage || null,
        callbackAmountInKurus: callbackAmount,
        callbackAmountMatchesOrder: callbackAmount === null ? null : callbackAmount === expectedAmountInKurus,
        responseHashVerified: hashTelemetry.verified,
        responseHashVariant: hashTelemetry.variant,
        responseHashAvailable: hashTelemetry.available,
        bankInquiryConfirmed: true,
        bankInquiryMode: inquiry.mode,
        amountSource: 'BANK_ORDER_INQUIRY',
        callbackTimestamp: new Date().toISOString(),
      },
    };
  }
}

const provider = new ZiraatKatilimProvider();

provider.__test = Object.freeze({
  MAX_TRANSACTION_TRY,
  DEFAULT_PAYMENT_API_URL,
  INQUIRY_TIMEOUT_MS,
  sha1Base64Ascii,
  safeEqualBase64,
  formatPayForAmount,
  amountToKurus,
  callbackAmountInKurus,
  xmlEscape,
  parsePayForInquiryXml,
  buildInquiryXml,
  evaluateInquiry,
  queryBankOrder,
  callbackHashTelemetry,
  validatePaymentApiUrl,
});

module.exports = provider;
