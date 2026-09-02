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
 * Kuveyt Türk XML Gönderme (Resmi Güvenli HTTPS Bağlantısı)
 */
async function sendXmlRequest(urlStr, xmlBody) {
  return new Promise((resolve, reject) => {
    try {
      const directUrl = new URL(urlStr);
      const postData = Buffer.from(xmlBody, 'utf-8');

      const req = https.request(directUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Length': postData.length,
        },
        timeout: 20000,
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

      req.on('error', (err) => {
        console.error('[KuveytTurk] Direct HTTPS Error:', err.message);
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Kuveyt Türk Gateway zaman aşımına uğradı (20s).'));
      });

      req.write(postData);
      req.end();
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
   * 1. AŞAMA: 3D Secure Ödeme Oturumu Başlatma (ThreeDModelPayGate)
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
    const clientIp = params?.clientIp || '127.0.0.1';
    const email = String(order.customer?.email || 'destek@belginkuyumculuk.com').slice(0, 100);
    let cardType = 'MasterCard';
    if (cardNumber.startsWith('4')) cardType = 'Visa';
    else if (cardNumber.startsWith('9792')) cardType = 'Troy';

    const formFields = {
      APIVersion: '1.0.0',
      OkUrl: okUrl,
      FailUrl: failUrl,
      HashData: hashData,
      MerchantId: config.merchantId,
      CustomerId: config.customerId,
      UserName: config.userName,
      CardNumber: cardNumber,
      CardExpireDateYear: cardExpireYear,
      CardExpireDateMonth: cardExpireMonth,
      CardCVV2: cardCvv2,
      CardHolderName: cardHolderName,
      CardType: cardType,
      BatchID: '0',
      TransactionType: 'Sale',
      InstallmentCount: '0',
      Amount: amount,
      DisplayAmount: amount,
      CurrencyCode: '0949',
      MerchantOrderId: merchantOrderId,
      TransactionSecurity: '3'
    };

    const formHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kuveyt Türk 3D Secure Yönlendirme</title>
</head>
<body onload="document.getElementById('kt3dForm').submit();" style="background:#0A1412;color:#F0F4F3;display:flex;align-items:center;justify-content:center;height:100vh;font-family:'Plus Jakarta Sans',sans-serif;margin:0;">
  <div style="text-align:center;padding:24px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:12px;color:#D4AF37;">Kuveyt Türk 3D Secure SMS Ekranına Bağlanılıyor...</div>
    <div style="font-size:14px;color:#8EAAA5;">Lütfen bekleyiniz, güvenli banka onay sayfasına aktarılıyorsunuz.</div>
  </div>
  <form id="kt3dForm" method="POST" action="${config.payGateUrl}">
    ${Object.entries(formFields).map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}">`).join('\n    ')}
    <noscript><button type="submit" style="padding:12px 24px;margin-top:20px;background:#D4AF37;color:#000;border:none;border-radius:6px;font-weight:700;cursor:pointer;">Doğrulamaya Devam Et ➔</button></noscript>
  </form>
  <script>
    try {
      document.getElementById('kt3dForm').submit();
    } catch(e) {
      console.log('Form submit auto-triggering');
    }
  </script>
</body>
</html>`;

    return {
      success: true,
      paymentType: 'HTML_FORM',
      provider: PROVIDERS.KUVEYTTURK,
      merchant_oid: merchantOrderId,
      gatewayUrl: config.payGateUrl,
      token: `KT-3DS-${Date.now()}`,
      formHtml: formHtml,
      formData: formFields
    };
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
