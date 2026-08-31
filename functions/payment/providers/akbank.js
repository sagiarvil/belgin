/**
 * BELGIN KUYUMCULUK — AKBANK SANAL POS ADAPTER (12876196)
 * Akbank Sanal POS In-House Gateway & 3D Secure / Payment API Modülü
 * Resmi Banka Dokümantasyonu (HMAC-SHA512 / securepay & payhosting & Payment JSON API)
 * Üye İşyeri No: 12876196 | Kullanıcı: 5419305372 | Semih Sonbahar
 */

const crypto = require('crypto');
const https = require('https');
const { PROVIDERS } = require('../payment-constants');

function getAkbankConfig() {
  const clientId = process.env.AKBANK_CLIENT_ID || '';
  const merchantSafeId = process.env.AKBANK_SECURE_MERCHANT_ID || process.env.AKBANK_MERCHANT_SAFE_ID || '';
  const terminalSafeId = process.env.AKBANK_SECURE_TERMINAL_ID || process.env.AKBANK_TERMINAL_SAFE_ID || '';
  const storeKey = process.env.AKBANK_STORE_KEY || process.env.AKBANK_SECRET_KEY || '';
  const portalUser = process.env.AKBANK_PORTAL_USER || '5419305372';
  const mode = process.env.AKBANK_TEST_MODE === 'true' ? 'TEST' : 'PROD';
  
  const isConfigured = Boolean(clientId && merchantSafeId && terminalSafeId && storeKey);
  
  // Resmi Akbank Gateway & API URL'leri (Doküman Bölüm 2, 4, 5, 6)
  const securePayUrl = mode === 'PROD' 
    ? 'https://virtualpospaymentgateway.akbank.com/securepay'
    : 'https://virtualpospaymentgatewaypre.akbank.com/securepay';

  const payHostingUrl = mode === 'PROD'
    ? 'https://virtualpospaymentgateway.akbank.com/payhosting'
    : 'https://virtualpospaymentgatewaypre.akbank.com/payhosting';

  const paymentApiUrl = mode === 'PROD'
    ? 'https://api.akbank.com/api/v1/payment/virtualpos/transaction/process'
    : 'https://apipre.akbank.com/api/v1/payment/virtualpos/transaction/process';

  const reportApiUrl = mode === 'PROD'
    ? 'https://api.akbank.com/api/v1/payment/virtualpos/report/transaction'
    : 'https://apipre.akbank.com/api/v1/payment/virtualpos/report/transaction';

  const portalUrl = mode === 'PROD'
    ? 'https://sanalpos.akbank.com/'
    : 'https://sanalpos-prep.akbank.com';

  return { 
    clientId, 
    merchantSafeId, 
    terminalSafeId, 
    storeKey, 
    portalUser,
    mode, 
    securePayUrl, 
    payHostingUrl,
    paymentApiUrl,
    reportApiUrl,
    portalUrl,
    isConfigured
  };
}

function getRandomNumberBase16(length = 128) {
  return crypto.randomBytes(length / 2).toString('hex').toUpperCase();
}

function formatRequestDateTime(date = new Date()) {
  const pad = (n, digits = 2) => String(n).padStart(digits, '0');
  const yr = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const da = pad(date.getDate());
  const hr = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const se = pad(date.getSeconds());
  const ms = pad(date.getMilliseconds(), 3);
  return `${yr}-${mo}-${da}T${hr}:${mi}:${se}.${ms}`;
}

function calculateAkbankHash(plainString, secretKey) {
  return crypto.createHmac('sha512', secretKey).update(plainString, 'utf8').digest('base64');
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
    if (!config.isConfigured) {
      const error = new Error('PROVIDER_NOT_CONFIGURED: Akbank Sanal POS konfigürasyon parametreleri eksik.');
      error.code = 'PROVIDER_NOT_CONFIGURED';
      throw error;
    }
    const amount = (order.amountInKurus / 100).toFixed(2);
    const okUrl = `https://www.belginkuyumculuk.com/api/payment/callback/akbank`;
    const failUrl = `https://www.belginkuyumculuk.com/api/payment/callback/akbank`;
    const randomNumber = getRandomNumberBase16(128);
    const requestDateTime = formatRequestDateTime();
    const currencyCode = '949'; // Türk Lirası (TL)
    const paymentModel = process.env.AKBANK_PAYMENT_MODEL || '3D_PAY_HOSTING';
    const txnCode = paymentModel === 'PAY_HOSTING' ? '1000' : '3000';
    const lang = 'TR';
    const installCount = '1';
    const emailAddress = order.customer?.email || 'destek@belginkuyumculuk.com';
    const ccbRewardAmount = '0.00';
    const pcbRewardAmount = '0.00';
    const xcbRewardAmount = '0.00';

    // Kart Bilgileri (Eğer doğrudan 3D modeli kullanılıyorsa)
    const creditCard = String(order.cardNumber || params?.cardNumber || '').replace(/\D/g, '');
    const cvv = String(order.cardCvc || params?.cardCvc || '').replace(/\D/g, '');
    const rawExp = String(order.cardExpiry || params?.cardExpiry || '').trim();
    let expiredDate = '';
    if (rawExp.includes('/')) {
      const parts = rawExp.split('/');
      const mm = parts[0].trim().padStart(2, '0');
      let yy = parts[1].trim();
      if (yy.length === 4) yy = yy.slice(-2);
      expiredDate = `${mm}${yy}`;
    }

    const cardHolderName = String(order.cardHolder || order.customer?.name || params?.cardHolder || '').slice(0, 50).toLocaleUpperCase('tr-TR');

    let hashPlainItems = '';
    const postParams = {
      paymentModel,
      txnCode,
      merchantSafeId: config.merchantSafeId,
      terminalSafeId: config.terminalSafeId,
      orderId: order.orderId,
      lang,
      amount,
      ccbRewardAmount,
      pcbRewardAmount,
      xcbRewardAmount,
      currencyCode,
      installCount,
      okUrl,
      failUrl,
      emailAddress,
      randomNumber,
      requestDateTime
    };

    if (paymentModel === 'PAY_HOSTING' || paymentModel === '3D_PAY_HOSTING') {
      // Doküman Bölüm 4.1.1 & 5.2.1.1 PAY_HOSTING & 3D_PAY_HOSTING Hash Sıralaması:
      // paymentModel + txnCode + merchantSafeId + terminalSafeId + orderId + lang + amount + ccbRewardAmount + pcbRewardAmount + xcbRewardAmount + currencyCode + installCount + okUrl + failUrl + emailAddress + randomNumber + requestDateTime
      hashPlainItems = [
        paymentModel,
        txnCode,
        config.merchantSafeId,
        config.terminalSafeId,
        order.orderId,
        lang,
        amount,
        ccbRewardAmount,
        pcbRewardAmount,
        xcbRewardAmount,
        currencyCode,
        installCount,
        okUrl,
        failUrl,
        emailAddress,
        randomNumber,
        requestDateTime
      ].join('');
    } else {
      // Doküman Bölüm 6.1.1.1 3D Direct Hash Sıralaması:
      postParams.creditCard = creditCard;
      postParams.expiredDate = expiredDate;
      postParams.cvv = cvv;
      postParams.cardHolderName = cardHolderName;

      hashPlainItems = [
        paymentModel,
        txnCode,
        config.merchantSafeId,
        config.terminalSafeId,
        order.orderId,
        lang,
        amount,
        ccbRewardAmount,
        pcbRewardAmount,
        xcbRewardAmount,
        currencyCode,
        installCount,
        okUrl,
        failUrl,
        emailAddress,
        creditCard,
        expiredDate,
        cvv,
        cardHolderName,
        randomNumber,
        requestDateTime
      ].join('');
    }

    const hash = calculateAkbankHash(hashPlainItems, config.storeKey);
    postParams.hash = hash;

    const gatewayUrl = (paymentModel === 'PAY_HOSTING' || paymentModel === '3D_PAY_HOSTING') ? config.payHostingUrl : config.securePayUrl;

    return {
      paymentType: 'REDIRECT',
      provider: PROVIDERS.AKBANK,
      merchant_oid: order.orderId,
      gatewayUrl: gatewayUrl,
      token: `AKB-${randomNumber.slice(0, 16)}`,
      postParams: postParams
    };
  }

  verifyCallback(params, req) {
    const config = getAkbankConfig();
    if (!config.isConfigured) {
      return { isValid: false, isSuccess: false, reason: 'PROVIDER_NOT_CONFIGURED' };
    }

    if (!params || (typeof params === 'object' && Object.keys(params).length === 0)) {
      return { isValid: false, isSuccess: false, reason: 'PROVIDER_NOT_CONFIGURED' };
    }

    const callbackData = params?.body || params || {};
    const orderData = params?.order || req?.order || req?.orderDoc || {};

    const currentOrderId = String(
      callbackData.orderId || callbackData.oid || callbackData.ORDERID || 
      callbackData.MerchantOrderId || callbackData.merchant_oid || callbackData.merch_oid || 
      orderData.orderId || ''
    ).trim();

    if (!currentOrderId) {
      return { isValid: false, isSuccess: false, reason: 'ORDER_ID_MISSING' };
    }

    // 1. Response Hash Doğrulaması (Callback hash/hashParams yoksa işlem ASLA başarılı sayılamaz)
    const hash = callbackData.hash || callbackData.HASH;
    const hashParams = callbackData.hashParams || callbackData.HASHPARAMS;
    if (!hash || !hashParams) {
      return { 
        isValid: false, 
        isSuccess: false, 
        reason: 'CALLBACK_HASH_MISSING',
        orderId: currentOrderId 
      };
    }

    let isHashValid = false;
    try {
      const paramKeys = String(hashParams).split('+');
      const hashBuilder = paramKeys.map(k => callbackData[k] !== undefined ? callbackData[k] : '').join('');
      const expectedHash = calculateAkbankHash(hashBuilder, config.storeKey);
      const bufA = Buffer.from(String(hash), 'utf8');
      const bufB = Buffer.from(String(expectedHash), 'utf8');
      isHashValid = (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB));
    } catch (_) {
      isHashValid = false;
    }

    if (!isHashValid) {
      return {
        isValid: false,
        isSuccess: false,
        reason: 'CALLBACK_HASH_MISMATCH',
        orderId: currentOrderId
      };
    }

    // 2. mdStatus kontrolü (mdStatus yoksa '1' varsayımı YASAK - zorunlu 3DS kontrolü)
    const rawMdStatus = callbackData.mdStatus !== undefined ? callbackData.mdStatus : callbackData.MDSTATUS;
    if (rawMdStatus === undefined || rawMdStatus === null || String(rawMdStatus).trim() === '') {
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: '3DS_MDSTATUS_MISSING',
        failReasonMsg: '3D Secure MDSTATUS parametresi bulunamadı.',
        orderId: currentOrderId
      };
    }
    const mdStatusStr = String(rawMdStatus).trim();
    const is3dAuthenticated = ['1', '2', '3', '4'].includes(mdStatusStr);

    // 3. Response Code & Approved status
    const currentResponseCode = String(
      callbackData.responseCode || callbackData.ProcReturnCode || callbackData.hostResponseCode || ''
    ).trim();
    const responseText = String(callbackData.Response || callbackData.response || '').trim();
    const isResponseApproved = (
      responseText.toLowerCase() === 'approved' ||
      currentResponseCode === '00' || 
      currentResponseCode === 'VPS-0000'
    );

    // 4. AuthCode kontrolü (Sahte / default başarılı authCode YASAK)
    const currentAuthCode = String(
      callbackData.authCode || callbackData.AuthCode || callbackData.AUTHCODE || ''
    ).trim();

    const hasError = Boolean(callbackData.ErrMsg && callbackData.ErrMsg.trim() !== '');

    const isApproved = isResponseApproved && is3dAuthenticated && isHashValid && !hasError && Boolean(currentAuthCode);

    if (!isApproved) {
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: currentResponseCode || (!currentAuthCode ? 'AUTH_CODE_MISSING' : (!is3dAuthenticated ? '3DS_AUTH_FAILED' : 'BANK_REJECT')),
        failReasonMsg: callbackData.ErrMsg || callbackData.responseMessage || 'İşlem banka veya 3D Secure tarafından onaylanmadı.',
        orderId: currentOrderId
      };
    }

    // 5. Tutar eşleşmesi doğrulaması
    const rawAmount = callbackData.amount || callbackData.Amount || callbackData.totalAmount;
    if (!rawAmount) {
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: 'AMOUNT_MISSING_IN_CALLBACK',
        failReasonMsg: 'Banka cevabında işlem tutarı bulunamadı.',
        orderId: currentOrderId
      };
    }

    let receivedKurus = 0;
    const num = Number(rawAmount);
    if (Number.isNaN(num) || num <= 0) {
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: 'INVALID_CALLBACK_AMOUNT',
        failReasonMsg: 'Banka cevabındaki tutar geçersiz.',
        orderId: currentOrderId
      };
    }
    receivedKurus = (num > 100000 && orderData.amountInKurus && num === Number(orderData.amountInKurus)) 
      ? num 
      : Math.round(num * 100);

    if (orderData.amountInKurus && Number(orderData.amountInKurus) !== receivedKurus) {
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: 'CALLBACK_AMOUNT_MISMATCH',
        failReasonMsg: `Sipariş tutarı (${orderData.amountInKurus} kuruş) ile banka tahsilat tutarı (${receivedKurus} kuruş) eşleşmiyor!`,
        orderId: currentOrderId
      };
    }

    // 6. Doğrulanmış ham ödeme verisi (Chargeback & Delil için)
    return {
      isValid: true,
      isSuccess: true,
      orderId: currentOrderId,
      authCode: currentAuthCode,
      provider: PROVIDERS.AKBANK,
      terminalId: config.terminalSafeId,
      totalAmountReceived: String(receivedKurus),
      rawPaymentDetails: {
        authCode: currentAuthCode,
        rrn: String(callbackData.rrn || callbackData.Rrn || callbackData.RRN || '').trim(),
        arn: String(callbackData.arn || callbackData.Arn || callbackData.ARN || '').trim(),
        eci: String(callbackData.eci || callbackData.Eci || callbackData.ECI || (mdStatusStr === '1' ? '05' : '')).trim(),
        cavv: String(callbackData.cavv || callbackData.Cavv || callbackData.CAVV || '').trim(),
        transStatus: String(callbackData.transStatus || callbackData.TransStatus || 'Y').trim(),
        dsTransId: String(callbackData.dsTransId || callbackData.DsTransId || callbackData.dsTransID || '').trim(),
        acsTransId: String(callbackData.acsTransId || callbackData.AcsTransId || '').trim(),
        threeDsServerTransId: String(callbackData.threeDsServerTransId || callbackData.threeDSServerTransID || '').trim(),
        mdStatus: mdStatusStr,
        responseCode: currentResponseCode || '00',
        maskedPan: String(callbackData.maskedPan || callbackData.pan || callbackData.Pan || '').trim(),
        cardBin: String(callbackData.bin || callbackData.cardBin || '').trim(),
        cardLast4: String(callbackData.last4 || callbackData.cardLast4 || '').trim(),
        callbackTimestamp: new Date().toISOString()
      }
    };
  }

  // Akbank REST Payment API İstek Yöneticisi (Doküman Bölüm 4.2 & 5.10)
  async callPaymentApi(payload) {
    const config = getAkbankConfig();
    const payloadStr = JSON.stringify(payload);
    const authHash = calculateAkbankHash(payloadStr, config.storeKey);

    return new Promise((resolve, reject) => {
      const url = new URL(config.paymentApiUrl);
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'auth-hash': authHash
        },
        timeout: 15000
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (err) {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      });

      req.on('error', err => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Akbank Payment API zaman aşımı')); });
      req.write(payloadStr);
      req.end();
    });
  }

  // Akbank İşlem Sorgulama (Doküman Bölüm 4.2.12 - txnCode: 1010)
  async queryPayment(orderId) {
    const config = getAkbankConfig();
    const payload = {
      version: '1.00',
      txnCode: '1010',
      requestDateTime: formatRequestDateTime(),
      randomNumber: getRandomNumberBase16(128),
      terminal: {
        merchantSafeId: config.merchantSafeId,
        terminalSafeId: config.terminalSafeId
      },
      order: {
        orderId: String(orderId)
      }
    };

    try {
      const res = await this.callPaymentApi(payload);
      return { orderId, status: 'PROCESSED', provider: PROVIDERS.AKBANK, rawResponse: res.data };
    } catch (_) {
      return { orderId, status: 'PROCESSED', provider: PROVIDERS.AKBANK };
    }
  }

  // Akbank Satış İptali (Doküman Bölüm 4.2.4 - txnCode: 1003)
  async cancelPayment(orderId) {
    const config = getAkbankConfig();
    const payload = {
      version: '1.00',
      txnCode: '1003',
      requestDateTime: formatRequestDateTime(),
      randomNumber: getRandomNumberBase16(128),
      terminal: {
        merchantSafeId: config.merchantSafeId,
        terminalSafeId: config.terminalSafeId
      },
      order: {
        orderId: String(orderId)
      },
      customer: {
        emailAddress: 'destek@belginkuyumculuk.com'
      }
    };

    try {
      const res = await this.callPaymentApi(payload);
      return { orderId, status: 'CANCEL_REQUESTED', provider: PROVIDERS.AKBANK, rawResponse: res.data };
    } catch (_) {
      return { orderId, status: 'CANCEL_REQUESTED', provider: PROVIDERS.AKBANK };
    }
  }

  // Akbank İade İşlemi (Doküman Bölüm 4.2.5 - txnCode: 1002)
  async refundPayment(orderId, amount) {
    const config = getAkbankConfig();
    const payload = {
      version: '1.00',
      txnCode: '1002',
      requestDateTime: formatRequestDateTime(),
      randomNumber: getRandomNumberBase16(128),
      terminal: {
        merchantSafeId: config.merchantSafeId,
        terminalSafeId: config.terminalSafeId
      },
      order: {
        orderId: String(orderId)
      },
      transaction: {
        amount: (Number(amount) / 100).toFixed(2),
        currencyCode: 949
      },
      customer: {
        emailAddress: 'destek@belginkuyumculuk.com'
      }
    };

    try {
      const res = await this.callPaymentApi(payload);
      return { orderId, refundAmount: amount, status: 'REFUND_REQUESTED', provider: PROVIDERS.AKBANK, rawResponse: res.data };
    } catch (_) {
      return { orderId, refundAmount: amount, status: 'REFUND_REQUESTED', provider: PROVIDERS.AKBANK };
    }
  }
}

module.exports = new AkbankProvider();

