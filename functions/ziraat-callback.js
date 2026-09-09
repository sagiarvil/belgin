'use strict';

/**
 * Dedicated Ziraat Katılım callback boundary.
 * Keeps provider-specific request normalization outside the existing Kuveyt Türk flow.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const paymentService = require('./payment/payment-service');
const mailer = require('./mailer');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

function normalizePayForBody(input) {
  const body = { ...(input || {}) };
  body.orderId = String(
    body.orderId ||
    body.OrderId ||
    body.ORDERID ||
    body.oid ||
    body.merchant_oid ||
    ''
  ).trim();
  return body;
}

function redirectHtml(targetUrl, success) {
  const title = success ? 'Ödeme doğrulandı' : 'Ödeme tamamlanamadı';
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <meta name="robots" content="noindex,nofollow">
  <title>${title}</title>
</head>
<body>
  <p>${title}. Yönlendiriliyorsunuz…</p>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`;
}

const ziraatPaymentCallback = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'no-store, max-age=0');

    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const body = normalizePayForBody(req.body);
    const orderId = body.orderId;

    try {
      const outcome = await paymentService.handleCallback({
        providerName: 'ZIRAATKATILIM',
        body,
        db,
        admin,
        mailer,
      });

      const resolvedOrderId = encodeURIComponent(outcome?.orderId || orderId || '');
      const isSuccess = outcome?.isSuccess === true;
      const targetUrl = isSuccess
        ? `https://www.belginkuyumculuk.com/odeme-basarili.html?orderId=${resolvedOrderId}&authCode=${encodeURIComponent(outcome?.authCode || '')}&provider=ZIRAATKATILIM`
        : `https://www.belginkuyumculuk.com/odeme-basarisiz.html?orderId=${resolvedOrderId}&code=${encodeURIComponent(outcome?.failReasonCode || 'ZIRAAT_PAYMENT_FAILED')}&reason=${encodeURIComponent(outcome?.failReasonMsg || 'Ziraat Katılım ödeme işlemi tamamlanamadı.')}&provider=ZIRAATKATILIM`;

      res.set('Location', targetUrl);
      return res.status(200).send(redirectHtml(targetUrl, isSuccess));
    } catch (error) {
      console.error('[Ziraat Katilim Callback] fail-closed:', error.code || error.message);
      const targetUrl = `https://www.belginkuyumculuk.com/odeme-basarisiz.html?orderId=${encodeURIComponent(orderId || '')}&code=ZIRAAT_CALLBACK_ERROR&reason=${encodeURIComponent('Ödeme sonucu doğrulanamadı. İşlem kaydı kontrol edilmelidir.')}&provider=ZIRAATKATILIM`;
      res.set('Location', targetUrl);
      return res.status(200).send(redirectHtml(targetUrl, false));
    }
  });

module.exports = {
  ziraatPaymentCallback,
  normalizePayForBody,
};
