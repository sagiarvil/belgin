/**
 * BELGIN KUYUMCULUK — KUVEYT TÜRK SANAL POS ADAPTER (892543)
 * Kuveyt Türk 3D Secure Model & Two-Phase Payment Gateway Modülü
 * Mağaza No: 892543 | Müşteri No: 92757158 | API Kullanıcısı: VP893972
 * Resmi Kuveyt Türk Dokümantasyonu (ISO-8859-9 SHA-1 / ThreeDModelPayGate & ThreeDModelProvisionGate)
 */

const crypto = require('crypto');
const https = require('https');
const { PROVIDERS } = require('../payment-constants');

function getKuveytTurkConfig() {
  const customerId = process.env.KUVEYTTURK_CUSTOMER_ID || '92757158';
  const merchantId = process.env.KUVEYTTURK_MERCHANT_ID || '892543';
  const userName = process.env.KUVEYTTURK_USER_NAME || 'belginapi';
  const password = process.env.KUVEYTTURK_PASSWORD || 'Deneme1974';
  const mode = process.env.KUVEYTTURK_TEST_MODE === 'true' ? 'TEST' : 'PROD';

  const isConfigured = Boolean(customerId && merchantId && userName && password);

  // Resmi Kuveyt Türk 3D Gateway & Provisioning URL'leri
  const payGateUrl = mode === 'PROD'
    ? 'https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate'
    : 'https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelPayGate';

  const provisionGateUrl = mode === 'PROD'
    ? 'https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate'
    : 'https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelProvisionGate';

  return {
    customerId,
    merchantId,
    userName,
    password,
    mode,
    payGateUrl,
    provisionGateUrl,
    isConfigured,
  };
}

/**
 * Kuveyt Türk Dokümanı: SHA-1 ile hash oluşturma (ISO-8859-9 charset) ve Base64 encode
 */
function calculateKuveytTurkSha1Base64(inputString) {
  const buffer = Buffer.from(inputString, 'latin1');
  return crypto.createHash('sha1').update(buffer).digest('base64');
}

function getHashedPassword(password) {
  if (!password) return '';
  return calculateKuveytTurkSha1Base64(password);
}

/**
 * Kuveyt Türk XML Parse Yardımcısı (Hafif ve Regex/String Tabanlı Güvenli Parser)
 */
function extractXmlTag(xmlString, tagName) {
  if (!xmlString || typeof xmlString !== 'string') return '';
  const regex = new RegExp(`<${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xmlString.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Kuveyt Türk XML Gönderme (Sabit Statik IP 35.208.218.109 Gateway Üzerinden)
 */
async function sendXmlRequest(urlOrPath, xmlBody) {
  const http = require('http');
  const https = require('https');
  const PROXY_HOST = '35.208.218.109';
  const PROXY_PORT = 8080;
  const SECRET = 'belgin-pos-sec-2026-kt';

  const pathStr = String(urlOrPath || '');
  let proxyPath = '/proxy-paygate';
  if (pathStr.includes('Provision') || pathStr.includes('provision')) {
    proxyPath = '/proxy-provision';
  } else if (pathStr.includes('KTPay') || pathStr.includes('ktpay')) {
    proxyPath = pathStr.includes('Provision') ? '/proxy-ktpay-provision' : '/proxy-ktpay-payment';
  }

  return new Promise((resolve, reject) => {
    try {
      const postData = Buffer.from(xmlBody, 'utf-8');

      // 1. ÖNCELİK: Sabit Statik IP Gateway (35.208.218.109 - Banka Whitelistindeki IP)
      const proxyReq = http.request({
        host: PROXY_HOST,
        port: PROXY_PORT,
        path: proxyPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Length': postData.length,
          'X-Belgin-Secret': SECRET,
        },
        timeout: 25000,
      }, (res) => {
        let responseText = '';
        res.on('data', (chunk) => { responseText += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: responseText,
          });
        });
      });

      proxyReq.on('error', (proxyErr) => {
        console.warn('[KuveytTurk] Static IP proxy bağlantı uyarısı, doğrudan HTTPS fallback devrede:', proxyErr.message);
        // 2. YEDEK: Doğrudan HTTPS Bağlantısı
        try {
          const directTarget = pathStr.startsWith('http') ? pathStr : ('https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/' + (proxyPath === '/proxy-provision' ? 'ThreeDModelProvisionGate' : 'ThreeDModelPayGate'));
          const directUrl = new URL(directTarget);
          const req = https.request(directUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Content-Length': postData.length,
            },
            timeout: 25000,
          }, (res) => {
            let responseText = '';
            res.on('data', (chunk) => { responseText += chunk; });
            res.on('end', () => {
              resolve({ statusCode: res.statusCode, body: responseText });
            });
          });

          req.on('error', (err) => reject(err));
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Kuveyt Türk Gateway zaman aşımına uğradı (25s).'));
          });

          req.write(postData);
          req.end();
        } catch (directErr) {
          reject(directErr);
        }
      });

      proxyReq.on('timeout', () => {
        proxyReq.destroy();
        reject(new Error('Kuveyt Türk Statik IP Gateway zaman aşımına uğradı (25s).'));
      });

      proxyReq.write(postData);
      proxyReq.end();
    } catch (err) {
      reject(err);
    }
  });
}

class KuveytTurkProvider {
  constructor() {
    this.name = PROVIDERS.KUVEYTTURK;
  }

  /**
   * 1. AŞAMA: 3D Secure Ödeme Oturumu Başlatma (ThreeDModelPayGate - Statik IP 35.208.218.109 üzerinden)
   */
  async createPayment(params, req) {
    const order = params?.order || params;
    if (!order) {
      const error = new Error('Geçersiz sipariş verisi.');
      error.code = 'INVALID_ORDER';
      throw error;
    }

    const config = getKuveytTurkConfig();
    if (!config.isConfigured) {
      const error = new Error('PROVIDER_NOT_CONFIGURED: Kuveyt Türk Sanal POS konfigürasyon parametreleri eksik.');
      error.code = 'PROVIDER_NOT_CONFIGURED';
      throw error;
    }

    // Kuveyt Türk tutarı kuruş cinsinden bekler (100.00 TL -> 10000)
    const amountInKurus = order.amountInKurus || Math.round(Number(order.total || order.totalAmount) * 100);
    const amount = String(amountInKurus);

    const okUrl = 'https://www.belginkuyumculuk.com/api/payment/callback/kuveytturk';
    const failUrl = 'https://www.belginkuyumculuk.com/api/payment/callback/kuveytturk';
    const merchantOrderId = String(order.orderId || order.id);

    const hashedPassword = getHashedPassword(config.password);
    // Hash Sıralaması: MerchantId + MerchantOrderId + Amount + OkUrl + FailUrl + UserName + HashedPassword
    const hashDataRaw = `${config.merchantId}${merchantOrderId}${amount}${okUrl}${failUrl}${config.userName}${hashedPassword}`;
    const hashData = calculateKuveytTurkSha1Base64(hashDataRaw);

    // Kart Bilgileri
    const cardNumber = String(order.cardNumber || params?.cardNumber || '').replace(/\D/g, '');
    const cardCvv2 = String(order.cardCvc || params?.cardCvc || '').replace(/\D/g, '');
    const rawExp = String(order.cardExpiry || params?.cardExpiry || '').trim();
    let cardExpireMonth = '';
    let cardExpireYear = '';
    if (rawExp.includes('/')) {
      const parts = rawExp.split('/');
      cardExpireMonth = parts[0].trim().padStart(2, '0');
      let yy = parts[1].trim();
      if (yy.length === 4) yy = yy.slice(-2);
      cardExpireYear = yy.padStart(2, '0');
    }

    // Eğer kart bilgisi eksikse
    if (!cardNumber || !cardCvv2 || !cardExpireMonth || !cardExpireYear) {
      return {
        success: false,
        paymentType: 'DIRECT_CARD_INPUT_REQUIRED',
        provider: PROVIDERS.KUVEYTTURK,
        merchant_oid: merchantOrderId,
        gatewayUrl: config.payGateUrl,
        message: 'Lütfen kart numarası, son kullanma tarihi ve güvenlik kodunu (CVV) giriniz.',
      };
    }

    const cardHolderName = String(order.cardHolder || params?.cardHolder || order.customer?.name || 'BELGIN DEGERLI MUSTERI').slice(0, 50).toLocaleUpperCase('tr-TR');
    let cardType = 'MasterCard';
    if (cardNumber.startsWith('4')) cardType = 'Visa';
    else if (cardNumber.startsWith('9792')) cardType = 'Troy';

    const payGateXml = `<KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <APIVersion>1.0.0</APIVersion>
  <OkUrl>${okUrl}</OkUrl>
  <FailUrl>${failUrl}</FailUrl>
  <HashData>${hashData}</HashData>
  <MerchantId>${config.merchantId}</MerchantId>
  <CustomerId>${config.customerId}</CustomerId>
  <UserName>${config.userName}</UserName>
  <CardNumber>${cardNumber}</CardNumber>
  <CardExpireDateYear>${cardExpireYear}</CardExpireDateYear>
  <CardExpireDateMonth>${cardExpireMonth}</CardExpireDateMonth>
  <CardCVV2>${cardCvv2}</CardCVV2>
  <CardHolderName>${cardHolderName}</CardHolderName>
  <CardType>${cardType}</CardType>
  <BatchID>0</BatchID>
  <TransactionType>Sale</TransactionType>
  <InstallmentCount>0</InstallmentCount>
  <Amount>${amount}</Amount>
  <DisplayAmount>${amount}</DisplayAmount>
  <CurrencyCode>0949</CurrencyCode>
  <MerchantOrderId>${merchantOrderId}</MerchantOrderId>
  <TransactionSecurity>3</TransactionSecurity>
</KuveytTurkVPosMessage>`;

    try {
      // 1. AŞAMA İSTEĞİ SUNUCUDAN STATİK IP (35.208.218.109) İLE KUVEYT TÜRK'E GÖNDERİLİR
      const payGateResponse = await sendXmlRequest(config.payGateUrl, payGateXml);
      const resBody = payGateResponse.body || '';

      // Eğer banka doğrudan hata döndüyse
      if (resBody.includes('PosMerchantIPError') || resBody.includes('Hata Detayı') || resBody.includes('ErrorCode')) {
        const errDesc = extractXmlTag(resBody, 'ResponseMessage') || 'Kuveyt Türk 3D oturumu açılamadı.';
        const errCode = extractXmlTag(resBody, 'ResponseCode') || 'GATEWAY_ERROR';
        console.error('[KuveytTurk PayGate Error]:', errCode, errDesc);
        throw new Error(`${errDesc} (${errCode})`);
      }

      return {
        success: true,
        paymentType: 'HTML_FORM',
        provider: PROVIDERS.KUVEYTTURK,
        merchant_oid: merchantOrderId,
        gatewayUrl: config.payGateUrl,
        token: `KT-3DS-${Date.now()}`,
        formHtml: resBody,
      };
    } catch (err) {
      console.error('[KuveytTurk PayGate Exception]:', err.message);
      throw err;
    }
  }

  /**
   * 2. AŞAMA: 3D Doğrulama Callback ve Provizyon Alma (ThreeDModelProvisionGate)
   */
  async verifyCallback(params, req) {
    const config = getKuveytTurkConfig();
    const callbackData = params?.body || params || {};
    const orderData = params?.order || req?.order || req?.orderDoc || {};

    let rawXml = '';
    if (callbackData.AuthenticationResponse) {
      let resp = String(callbackData.AuthenticationResponse);
      try {
        if (resp.includes('%')) resp = decodeURIComponent(resp.replace(/\+/g, '%20'));
        if (resp.includes('%')) resp = decodeURIComponent(resp.replace(/\+/g, '%20'));
      } catch (_) {}
      rawXml = resp;
    } else if (typeof callbackData === 'string') {
      rawXml = callbackData;
    }

    const responseCode = extractXmlTag(rawXml, 'ResponseCode') || callbackData.ResponseCode || callbackData.responseCode || '';
    const responseMessage = extractXmlTag(rawXml, 'ResponseMessage') || callbackData.ResponseMessage || '';
    const md = extractXmlTag(rawXml, 'MD') || callbackData.MD || '';
    const merchantOrderId = extractXmlTag(rawXml, 'MerchantOrderId') || callbackData.MerchantOrderId || orderData.orderId || '';
    const rawAmount = extractXmlTag(rawXml, 'Amount') || callbackData.Amount || '';
    const orderId = extractXmlTag(rawXml, 'OrderId') || callbackData.OrderId || '';
    const provisionNumber = extractXmlTag(rawXml, 'ProvisionNumber') || callbackData.ProvisionNumber || '';
    const rrn = extractXmlTag(rawXml, 'RRN') || callbackData.RRN || '';
    const stan = extractXmlTag(rawXml, 'Stan') || callbackData.Stan || '';

    const currentOrderId = String(merchantOrderId || orderData.orderId || '').trim();
    let amount = String(rawAmount || '');
    if (!amount && orderData) {
      amount = String(orderData.amountInKurus || Math.round(Number(orderData.total || orderData.totalAmount || 0) * 100));
    }

    if (!currentOrderId) {
      return { isValid: false, isSuccess: false, reason: 'ORDER_ID_MISSING' };
    }

    if (responseCode !== '00' || !md) {
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: responseCode || '3DS_VERIFICATION_FAILED',
        failReasonMsg: responseMessage || 'Kuveyt Türk 3D Secure kart doğrulama başarısız oldu veya SMS şifresi hatalı.',
        orderId: currentOrderId,
      };
    }

    const cleanMd = String(md || '').replace(/ /g, '+').trim();

    // 2. AŞAMA: PROVİZYON ÇAĞRISI (ThreeDModelProvisionGate)
    try {
      const hashedPassword = getHashedPassword(config.password);
      const provHashRaw = `${config.merchantId}${currentOrderId}${amount}${config.userName}${hashedPassword}`;
      const provHash = calculateKuveytTurkSha1Base64(provHashRaw);

      const provXml = `<?xml version="1.0" encoding="utf-8"?>
<KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <APIVersion>1.0.0</APIVersion>
  <HashData>${provHash}</HashData>
  <MerchantId>${config.merchantId}</MerchantId>
  <CustomerId>${config.customerId}</CustomerId>
  <UserName>${config.userName}</UserName>
  <TransactionType>Sale</TransactionType>
  <InstallmentCount>0</InstallmentCount>
  <CurrencyCode>0949</CurrencyCode>
  <Amount>${amount}</Amount>
  <MerchantOrderId>${currentOrderId}</MerchantOrderId>
  <TransactionSecurity>3</TransactionSecurity>
  <KuveytTurkVPosAdditionalData>
    <AdditionalData>
      <Key>MD</Key>
      <Data>${cleanMd}</Data>
    </AdditionalData>
  </KuveytTurkVPosAdditionalData>
</KuveytTurkVPosMessage>`;

      const provResponse = await sendXmlRequest(config.provisionGateUrl, provXml);
      const provBody = provResponse.body || '';

      const finalResponseCode = extractXmlTag(provBody, 'ResponseCode');
      const finalResponseMessage = extractXmlTag(provBody, 'ResponseMessage');
      const finalProvNumber = extractXmlTag(provBody, 'ProvisionNumber') || provisionNumber || `KT-PROV-${Date.now()}`;
      const finalRrn = extractXmlTag(provBody, 'RRN') || rrn;
      const finalStan = extractXmlTag(provBody, 'Stan') || stan;

      if (finalResponseCode === '00') {
        const finalAuthNumber = finalProvNumber || provisionNumber;
        return {
          isValid: true,
          isSuccess: true,
          orderId: currentOrderId,
          authCode: finalAuthNumber,
          provider: PROVIDERS.KUVEYTTURK,
          terminalId: config.merchantId,
          totalAmountReceived: String(amount),
          rawPaymentDetails: {
            authCode: finalAuthNumber,
            provisionNumber: finalAuthNumber,
            rrn: finalRrn,
            stan: finalStan,
            orderId: orderId,
            merchantOrderId: currentOrderId,
            amount: amount,
            md: cleanMd,
            responseCode: finalResponseCode,
            responseMessage: finalResponseMessage || 'Kuveyt Türk Provizyon Onaylandı',
            callbackTimestamp: new Date().toISOString(),
          },
        };
      } else {
        return {
          isValid: true,
          isSuccess: false,
          failReasonCode: finalResponseCode || 'PROVISION_FAILED',
          failReasonMsg: finalResponseMessage || 'Kuveyt Türk provizyon işlemi banka tarafından onaylanmadı.',
          orderId: currentOrderId,
        };
      }
    } catch (provErr) {
      console.error('[KuveytTurk] ProvisionGate Bağlantı Hatası:', provErr.message);
      return {
        isValid: true,
        isSuccess: false,
        failReasonCode: 'PROVISION_NETWORK_ERROR',
        failReasonMsg: `Kuveyt Türk provizyon servisine bağlanılamadı: ${provErr.message}`,
        orderId: currentOrderId,
      };
    }
  }
}

module.exports = new KuveytTurkProvider();
