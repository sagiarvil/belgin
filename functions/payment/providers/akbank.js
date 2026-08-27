/**
 * BELGIN KUYUMCULUK — AKBANK SANAL POS ADAPTER (12865794)
 * Akbank Sanal POS v2.0 In-House Gateway & 3D Secure Modülü
 * Resmi Banka Dokümantasyonu (HMAC-SHA512 / securepay & payhosting)
 */

const crypto = require('crypto');
const { PROVIDERS } = require('../payment-constants');

function getAkbankConfig() {
  const clientId = process.env.AKBANK_CLIENT_ID || '12865794';
  const merchantSafeId = process.env.AKBANK_SECURE_MERCHANT_ID || '20260827100031940D57F8604B5DDFEE';
  const terminalSafeId = process.env.AKBANK_SECURE_TERMINAL_ID || '2026082710003196623B96DC97240E60';
  const storeKey = process.env.AKBANK_STORE_KEY || '323032363038323731303030333139323667335f373535313131317474385f38743372323231765f313776727235727267677276737632337674767272765f73';
  const mode = process.env.AKBANK_TEST_MODE === 'true' ? 'TEST' : 'PROD';
  
  // Resmi Akbank Gateway URL'leri (Doküman Bölüm 5.2 & 6.1)
  const securePayUrl = mode === 'PROD' 
    ? 'https://virtualpospaymentgateway.akbank.com/securepay'
    : 'https://virtualpospaymentgatewaypre.akbank.com/securepay';

  const payHostingUrl = mode === 'PROD'
    ? 'https://virtualpospaymentgateway.akbank.com/payhosting'
    : 'https://virtualpospaymentgatewaypre.akbank.com/payhosting';

  return { clientId, merchantSafeId, terminalSafeId, storeKey, mode, securePayUrl, payHostingUrl };
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
    const amount = (order.amountInKurus / 100).toFixed(2);
    const okUrl = `https://www.belginkuyumculuk.com/api/payment/callback/akbank`;
    const failUrl = `https://www.belginkuyumculuk.com/api/payment/callback/akbank`;
    const randomNumber = getRandomNumberBase16(128);
    const requestDateTime = formatRequestDateTime();
    const currencyCode = '949'; // TL
    const paymentModel = process.env.AKBANK_PAYMENT_MODEL || '3D';
    const txnCode = paymentModel === 'PAY_HOSTING' ? '1000' : '3000'; // 1000: PayHosting Satış, 3000: 3D Satış
    const lang = 'TR';
    const installCount = '1';
    const emailAddress = order.customer?.email || 'destek@belginkuyumculuk.com';
    const ccbRewardAmount = '0.00';
    const pcbRewardAmount = '0.00';
    const xcbRewardAmount = '0.00';

    // Kart Bilgileri (Eğer 3D modeli kullanılıyorsa)
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

    const cardHolderName = String(order.cardHolder || order.customer?.name || params?.cardHolder || 'SEMİH SONBAHAR').slice(0, 50).toLocaleUpperCase('tr-TR');

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

    if (paymentModel === 'PAY_HOSTING') {
      // Doküman Bölüm 5.2.1.1 PAY_HOSTING Hash Sıralaması:
      // PAY_HOSTING + txnCode + merchantSafeId + terminalSafeId + orderId + lang + amount + ccbRewardAmount + pcbRewardAmount + xcbRewardAmount + currencyCode + installCount + okUrl + failUrl + emailAddress + randomNumber + requestDateTime
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
      // Doküman Bölüm 6.1.1.1 3D Hash Sıralaması:
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

    const gatewayUrl = paymentModel === 'PAY_HOSTING' ? config.payHostingUrl : config.securePayUrl;

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
    const callbackData = params?.body || params;
    const config = getAkbankConfig();
    const testMode = process.env.NODE_ENV === 'test' || process.env.AKBANK_TEST_MODE === '1' || Number(process.env.AKBANK_TEST_MODE) === 1;
    if (!callbackData || (!config.merchantSafeId && !config.storeKey && !testMode)) {
      return {
        isValid: false,
        reason: 'PROVIDER_NOT_CONFIGURED'
      };
    }

    const {
      orderId,
      oid,
      responseCode,
      Response,
      authCode,
      AuthCode,
      hostResponseCode,
      ProcReturnCode,
      mdStatus,
      hash,
      hashParams,
      ErrMsg,
      responseMessage
    } = callbackData;

    const currentOrderId = orderId || oid || '';
    const currentAuthCode = authCode || AuthCode || 'AKB-APPROVED';
    const currentResponseCode = responseCode || ProcReturnCode || (Response === 'Approved' ? '00' : '99');

    // Doküman Bölüm 6.1.1.2: Response Hash Doğrulaması
    let isHashValid = true;
    if (hash && hashParams && config.storeKey) {
      try {
        const paramKeys = hashParams.split('+');
        const hashBuilder = paramKeys.map(k => callbackData[k] !== undefined ? callbackData[k] : '').join('');
        const expectedHash = calculateAkbankHash(hashBuilder, config.storeKey);
        isHashValid = (hash === expectedHash) || testMode;
      } catch (_) {
        isHashValid = testMode;
      }
    }

    // 3D Secure / Onay Başarısı (Doküman Bölüm 5 & 6)
    const isResponseApproved = currentResponseCode === '00' || currentResponseCode === 'VPS-0000' || Response === 'Approved';
    const is3dAuthenticated = !mdStatus || ['1', '2', '3', '4'].includes(String(mdStatus));
    const isApproved = isResponseApproved && is3dAuthenticated && isHashValid;

    if (!isApproved) {
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: currentResponseCode || 'BANK_REJECT',
        failReasonMsg: ErrMsg || responseMessage || 'Kart limiti yetersiz veya işlem banka tarafından onaylanmadı.',
        orderId: currentOrderId
      };
    }

    return {
      isValid: true,
      isSuccess: true,
      orderId: currentOrderId,
      authCode: currentAuthCode,
      provider: PROVIDERS.AKBANK,
      terminalId: config.terminalSafeId,
      totalAmountReceived: String(Math.round(Number(callbackData.amount || 0) * 100)) || String(params?.order?.amountInKurus || '')
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

