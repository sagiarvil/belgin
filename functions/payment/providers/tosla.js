'use strict';

/**
 * BELGIN KUYUMCULUK — TOSLA İŞİM SANAL POS (AKÖDE / AKBANK) ADAPTER
 * 
 * 3D Secure / 3DHost & Two-Phase Payment Gateway Modülü
 * Resmi Tosla İşim API Mimarisi (SHA-512 Base64 Hash Protokolü)
 */

const crypto = require('crypto');
const axios = require('axios');
const { PROVIDERS } = require('../payment-constants');

const DEFAULT_PROD_URL = 'https://entegrasyon.tosla.com/api/Payment';
const DEFAULT_TEST_URL = 'https://prepentegrasyon.tosla.com/api/Payment';

const TEST_CLIENT_ID = '1000000494';
const TEST_API_USER = 'POS_ENT_Test_001';
const TEST_API_PASS = 'POS_ENT_Test_001!*!*';

function isTestCardNumber(cardNum) {
  if (!cardNum) return false;
  const clean = String(cardNum).replace(/\D/g, '');
  // Tosla resmi test BIN'leri ve standart test kartları
  return clean.startsWith('454671') || 
         clean.startsWith('454360') || 
         clean.startsWith('552608') || 
         clean.startsWith('400000') ||
         clean.startsWith('540000');
}

function getToslaConfig(context = {}) {
  // Canlı ortam (entegrasyon.tosla.com) birincildir; prepentegrasyon Cloud Functions IP'lerini engelleyebildiğinden yalnızca açık TOSLA_TEST_MODE ile tetiklenir
  const forceTest = Boolean(process.env.TOSLA_TEST_MODE === 'true');

  let clientId = process.env.TOSLA_CLIENT_ID || '1000006961';
  let apiUser = process.env.TOSLA_API_USER || 'apiUser3041341';
  let apiPass = process.env.TOSLA_API_PASS || 'YHGT98IKMJ';
  let baseUrl = DEFAULT_PROD_URL;

  if (forceTest) {
    clientId = process.env.TOSLA_TEST_CLIENT_ID || TEST_CLIENT_ID;
    apiUser = process.env.TOSLA_TEST_API_USER || TEST_API_USER;
    apiPass = process.env.TOSLA_TEST_API_PASS || TEST_API_PASS;
    baseUrl = DEFAULT_TEST_URL;
  }

  const callbackUrl = process.env.TOSLA_CALLBACK_URL || 'https://www.belginkuyumculuk.com/api/payment/callback/tosla';

  return {
    clientId,
    apiUser,
    apiPass,
    isTest: forceTest,
    baseUrl,
    registerUrl: `${baseUrl}/threeDPayment`,
    processCardUrl: `${baseUrl}/ProcessCardForm`,
    threeDHostUrl: `${baseUrl}/threeDSecure`,
    callbackUrl,
    isConfigured: Boolean(clientId && apiUser && apiPass),
  };
}

/**
 * Türkiye Saat Dilimine (GMT+3) Uygun TimeSpan Üretimi (yyyyMMddHHmmss)
 */
function getTurkeyTimeSpan() {
  const d = new Date();
  // UTC+3 hesaplaması
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const turkeyDate = new Date(utc + (3600000 * 3));

  const yyyy = turkeyDate.getFullYear();
  const MM = String(turkeyDate.getMonth() + 1).padStart(2, '0');
  const dd = String(turkeyDate.getDate()).padStart(2, '0');
  const HH = String(turkeyDate.getHours()).padStart(2, '0');
  const mm = String(turkeyDate.getMinutes()).padStart(2, '0');
  const ss = String(turkeyDate.getSeconds()).padStart(2, '0');

  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}

/**
 * Tosla İşim SHA-512 Base64 Hash Hesaplama
 * Formül: SHA512(ApiPass + ClientId + ApiUser + RandomString + TimeSpan) -> Base64
 */
function calculateToslaHash(apiPass, clientId, apiUser, rnd, timeSpan) {
  const rawStr = `${apiPass}${clientId}${apiUser}${rnd}${timeSpan}`;
  return crypto.createHash('sha512').update(rawStr, 'utf8').digest('base64');
}

/**
 * Callback Yanıt Hash Doğrulaması
 * Tosla İşim HashParameters: Virgülle ayrılmış parametre listesi
 * Formül: SHA512(ApiPass + Param1 + Param2 + ...) -> Base64
 */
function verifyToslaCallbackHash(apiPass, body) {
  try {
    const expectedHash = String(body.Hash || body.hash || '').trim();
    const hashParams = String(body.HashParameters || body.hashParameters || '').trim();

    if (!expectedHash || !hashParams) {
      return { verified: false, reason: 'HASH_OR_PARAMS_MISSING' };
    }

    const paramKeys = hashParams.split(',');
    let concatenated = String(apiPass);

    for (const key of paramKeys) {
      const cleanKey = key.trim();
      if (!cleanKey) continue;
      const val = body[cleanKey] !== undefined ? String(body[cleanKey]) : '';
      concatenated += val;
    }

    const calculatedHash = crypto.createHash('sha512').update(concatenated, 'utf8').digest('base64');
    const isValid = calculatedHash === expectedHash;

    return {
      verified: isValid,
      calculatedHash,
      expectedHash,
      reason: isValid ? null : 'HASH_MISMATCH',
    };
  } catch (err) {
    return { verified: false, reason: err.message };
  }
}

/**
 * Tosla Kart Son Kullanma Tarihi Formatlayıcı: AA/YY (Örn: 12/28)
 * 12/28, 12/2028, 1228, 122028 vb. tüm formatları güvenle AA/YY yapar
 */
function formatExpireDate(rawExp) {
  if (!rawExp) return '';
  const clean = String(rawExp).trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    const mm = parts[0].trim().padStart(2, '0');
    const yy = parts[1].trim().slice(-2);
    return `${mm}/${yy}`;
  }
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 4) {
    const mm = digits.slice(0, 2);
    const yy = digits.slice(2, 4);
    return `${mm}/${yy}`;
  }
  if (digits.length === 6) {
    // Örn: 122028 -> 12/28
    const mm = digits.slice(0, 2);
    const yy = digits.slice(4, 6);
    return `${mm}/${yy}`;
  }
  return clean;
}

class ToslaProvider {
  constructor() {
    this.name = PROVIDERS.TOSLA;
  }

  /**
   * Ödeme Başlatma: Session alma ve Kart Post veya Ortak Ödeme yönlendirmesi
   */
  async createPayment(params) {
    const order = (params && typeof params === 'object' && 'order' in params) ? params.order : params;
    if (!order) {
      const error = new Error('Geçersiz sipariş verisi.');
      error.code = 'INVALID_ORDER';
      throw error;
    }

    const cardNum = String(order.cardNumber || params.cardNumber || '').replace(/\D/g, '');
    const cardExp = String(order.cardExpiry || params.cardExpiry || '').trim();
    const cardCvc = String(order.cardCvc || params.cardCvc || '').replace(/\D/g, '');
    const cardHolder = String(order.cardHolder || params.cardHolder || order.user_name || '').trim();

    const config = getToslaConfig({
      cardNumber: cardNum,
      isTest: Boolean(order.isTest || params.isTest),
    });

    const total = Number(order.total ?? order.totalAmount);

    if (!Number.isFinite(total) || total <= 0) {
      const error = new Error('Geçersiz sipariş tutarı.');
      error.code = 'INVALID_AMOUNT';
      throw error;
    }

    const rawOrderId = String(order.orderId || order.id || '').trim();
    if (!rawOrderId) {
      const error = new Error('Tosla için OrderId zorunludur.');
      error.code = 'INVALID_ORDER';
      throw error;
    }

    // Tosla API orderId alanı maksimum 20 karakter kabul eder (VARCHAR(20))
    const orderId = rawOrderId.length > 20 ? rawOrderId.slice(0, 20) : rawOrderId;

    // Tosla API amount alanını Int64 kuruş (10 TL = 1000) olarak bekler
    const kurusAmount = Math.round(total * 100);
    const rnd = crypto.randomBytes(12).toString('hex');
    const timeSpan = getTurkeyTimeSpan();
    const hash = calculateToslaHash(config.apiPass, config.clientId, config.apiUser, rnd, timeSpan);

    const initPayload = {
      clientId: config.clientId,
      apiUser: config.apiUser,
      rnd: rnd,
      timeSpan: timeSpan,
      hash: hash,
      callbackUrl: config.callbackUrl,
      orderId: orderId,
      amount: kurusAmount,
      currency: 949, // TRY
      installmentCount: 1,
    };

    console.log(`[Tosla Provider] Oturum Açılıyor: OrderId=${orderId}, AmountKurus=${kurusAmount}, Mode=${config.isTest ? 'TEST' : 'PROD'}, URL=${config.registerUrl}`);

    let sessionResponse;
    try {
      const res = await axios.post(config.registerUrl, initPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'BelginKuyumculuk/1.0 (Tosla Integration Node.js)',
        },
        timeout: 15000,
      });
      sessionResponse = res.data;
    } catch (err) {
      console.error('[Tosla Provider] Session isteği hatası:', err.response?.data || err.message);
      const errMsg = err.response?.data?.Message || err.response?.data?.message || err.message || 'Tosla Sanal POS bağlantı hatası';
      const error = new Error(`Tosla Sanal POS oturumu açılamadı: ${errMsg}`);
      error.code = 'TOSLA_INIT_ERROR';
      error.details = err.response?.data;
      throw error;
    }

    const threeDSessionId = sessionResponse?.ThreeDSessionId || sessionResponse?.threeDSessionId || sessionResponse?.Data?.ThreeDSessionId || sessionResponse?.data?.threeDSessionId;

    if (!threeDSessionId) {
      console.error('[Tosla Provider] ThreeDSessionId alınamadı:', sessionResponse);
      const errMsg = sessionResponse?.Message || sessionResponse?.message || 'Banka oturum kimliği dönemedi.';
      const error = new Error(`Tosla Sanal POS hatası: ${errMsg}`);
      error.code = 'TOSLA_NO_SESSION';
      error.details = sessionResponse;
      throw error;
    }

    // Kart bilgileri var mı kontrol et (Doğrudan Kart Formu Modu - 3DPay)
    const hasCardDetails = Boolean(cardNum && cardNum.length >= 15 && cardExp && cardCvc);

    if (hasCardDetails) {
      // 1. 3DPay (Kart Bilgisiyle Doğrudan Banka 3D SMS Ekranına Post - multipart/form-data)
      const formattedExp = formatExpireDate(cardExp);
      return {
        success: true,
        provider: PROVIDERS.TOSLA,
        paymentType: 'FORM_POST',
        merchant_oid: orderId,
        gatewayUrl: config.processCardUrl,
        enctype: 'multipart/form-data',
        formData: {
          ThreeDSessionId: threeDSessionId,
          CardHolderName: cardHolder,
          CardNo: cardNum,
          ExpireDate: formattedExp,
          Cvv: cardCvc,
        },
      };
    }

    // 2. 3DHost (Ortak Ödeme Sayfası)
    const hostPageUrl = `${config.threeDHostUrl}/${threeDSessionId}`;
    return {
      success: true,
      provider: PROVIDERS.TOSLA,
      paymentType: 'REDIRECT',
      merchant_oid: orderId,
      gatewayUrl: hostPageUrl,
      iframeUrl: hostPageUrl,
      threeDSessionId: threeDSessionId,
    };
  }

  /**
   * Callback Doğrulama: Bankadan gelen ödeme sonucunun teyidi
   */
  async verifyCallback(params) {
    const body = params?.body || params || {};
    const order = params?.order || {};
    const config = getToslaConfig(order);

    const orderId = String(
      body.OrderId || body.orderId || body.order_id || body.merchant_oid || body.MerchantOrderId ||
      order.orderId || order.id || ''
    ).trim();

    const expectedOrderId = String(order?.orderId || order?.id || '').trim();
    const providerOrderId = String(order?.payment?.providerOrderId || '').trim();

    // Toleranslı Eşleşme (Birebir, prefix veya providerOrderId uyumu)
    const isOrderMatched = !orderId || !expectedOrderId ||
      orderId === expectedOrderId ||
      orderId === providerOrderId ||
      orderId.startsWith(expectedOrderId) ||
      expectedOrderId.startsWith(orderId) ||
      (providerOrderId && (orderId.startsWith(providerOrderId) || providerOrderId.startsWith(orderId)));

    if (!orderId || !isOrderMatched) {
      return {
        isValid: false,
        isSuccess: false,
        orderId: orderId || expectedOrderId,
        reason: 'ORDER_ID_MISMATCH',
      };
    }

    // Tosla İşim & Akbank Yanıt Kodları: '00', '0', Status=Success, Code=0 veya ThreeDSecureCode=1 = Başarılı
    const bankResponseCode = String(body.BankResponseCode || body.bankResponseCode || body.ProcReturnCode || body.procReturnCode || body.Code || body.code || '').trim();
    const statusStr = String(body.Status || body.status || body.PaymentStatus || body.paymentStatus || '').trim().toUpperCase();
    const threeDCode = String(body.ThreeDSecureCode || body.threeDSecureCode || body.mdStatus || '').trim();
    const bankResponseMessage = String(body.BankResponseMessage || body.bankResponseMessage || body.Message || body.message || '').trim();

    const isSuccessCode = 
      bankResponseCode === '00' || 
      bankResponseCode === '0' || 
      statusStr === 'SUCCESS' || 
      statusStr === 'APPROVED' || 
      (body.Code === 0 || body.Code === '0') ||
      threeDCode === '1';

    const authCode = String(body.AuthCode || body.authCode || '').trim();
    const hostRefNum = String(body.HostReferenceNumber || body.hostReferenceNumber || body.TransactionId || '').trim();

    // Hash Doğrulaması (Canlı ve Test fallback)
    let hashCheck = verifyToslaCallbackHash(config.apiPass, body);
    if (!hashCheck.verified && config.apiPass !== TEST_API_PASS) {
      const testHashCheck = verifyToslaCallbackHash(TEST_API_PASS, body);
      if (testHashCheck.verified) {
        hashCheck = testHashCheck;
      }
    }

    if (!isSuccessCode) {
      return {
        isValid: false,
        isSuccess: false,
        orderId,
        stage: 'PROVISION',
        reason: bankResponseCode || statusStr || 'PAYMENT_FAILED',
        failReasonCode: bankResponseCode || statusStr || 'PAYMENT_FAILED',
        failReasonMsg: bankResponseMessage || 'Tosla Sanal POS ödemesi onaylanmadı.',
        rawPaymentDetails: {
          orderId,
          provider: PROVIDERS.TOSLA,
          bankResponseCode,
          status: statusStr,
          threeDCode,
          bankResponseMessage,
          hostRefNum,
          hashVerified: hashCheck.verified,
          callbackTimestamp: new Date().toISOString(),
        },
      };
    }

    return {
      isValid: true,
      isSuccess: true,
      orderId,
      authCode: authCode || 'TSL-AUTH',
      rawPaymentDetails: {
        orderId,
        provider: PROVIDERS.TOSLA,
        bankResponseCode,
        status: statusStr,
        threeDCode,
        bankResponseMessage,
        authCode,
        hostRefNum,
        hashVerified: hashCheck.verified,
        callbackTimestamp: new Date().toISOString(),
      },
    };
  }
}

module.exports = new ToslaProvider();
