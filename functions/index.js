/**
 * BELGIN KUYUMCULUK — FIREBASE CLOUD FUNCTIONS
 * PayTR iFrame API / fail-closed payment processing
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const qs = require('qs');
const PRODUCT_CATALOG = require('./product-catalog.json');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const DEFAULT_ALLOWED_ORIGINS = [
  'https://belgin.web.app',
  'https://belgin.firebaseapp.com',
];

function allowedOrigins() {
  const configured = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, allowedOrigins().has(origin));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 3600,
});

function getPayTRConfig() {
  const legacy = functions.config().paytr || {};
  const config = {
    merchant_id: process.env.PAYTR_MERCHANT_ID || legacy.merchant_id,
    merchant_key: process.env.PAYTR_MERCHANT_KEY || legacy.merchant_key,
    merchant_salt: process.env.PAYTR_MERCHANT_SALT || legacy.merchant_salt,
    api_url: 'https://www.paytr.com/odeme/api/get-token',
  };

  if (!config.merchant_id || !config.merchant_key || !config.merchant_salt) {
    const error = new Error('PayTR sunucu yapılandırması tamamlanmamış.');
    error.code = 'PAYTR_CONFIG_MISSING';
    throw error;
  }
  return config;
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

function generateOrderId() {
  return `BLG-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

function normalizeCart(clientItems) {
  if (!Array.isArray(clientItems) || clientItems.length === 0) {
    throw new Error('Sepet boş olamaz.');
  }
  if (clientItems.length > 20) throw new Error('Sepet ürün sınırı aşıldı.');

  return clientItems.map((item) => {
    const id = String(item.id ?? '');
    const product = PRODUCT_CATALOG[id];
    const qty = Number(item.qty || 1);

    if (!product) throw new Error(`Ürün doğrulanamadı: ${id}`);
    if (product.inStock === false) throw new Error(`${product.name} stokta değil.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error(`Geçersiz ürün adedi: ${id}`);

    return {
      id,
      name: `${product.brand} ${product.name}`.trim(),
      price: Number(product.price),
      qty,
    };
  });
}

function calculateTotal(items) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (!Number.isFinite(total) || total <= 0) throw new Error('Sipariş toplamı hesaplanamadı.');
  return total;
}

function encodeUserBasket(items) {
  const basket = items.map((item) => [item.name, item.price.toFixed(2), String(item.qty)]);
  return Buffer.from(JSON.stringify(basket)).toString('base64');
}

exports.createPayTRToken = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Yalnızca POST kabul edilir.' });

    try {
      const config = getPayTRConfig();
      const body = req.body || {};
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Geçerli e-posta zorunludur.' });
      }

      const items = normalizeCart(body.items);
      const serverTotal = calculateTotal(items);
      const merchant_oid = generateOrderId();
      const clientIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
      const amountInKurus = String(Math.round(serverTotal * 100));
      const basketBase64 = encodeUserBasket(items);
      const testMode = Number(process.env.PAYTR_TEST_MODE || 0) === 1 ? 1 : 0;

      const orderRef = db.collection('orders').doc(merchant_oid);
      await orderRef.set({
        orderId: merchant_oid,
        status: 'pending',
        items,
        total: serverTotal,
        amountInKurus,
        customer: {
          name: String(body.user_name || '').slice(0, 150),
          email,
          phone: String(body.user_phone || '').slice(0, 50),
          address: String(body.user_address || '').slice(0, 1000),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: clientIp,
        testMode: testMode === 1,
      });

      const params = {
        merchant_id: config.merchant_id,
        user_ip: clientIp,
        merchant_oid,
        email,
        payment_amount: amountInKurus,
        paytr_token: '',
        user_basket: basketBase64,
        debug_on: testMode,
        test_mode: testMode,
        no_installment: 0,
        max_installment: 6,
        user_name: String(body.user_name || 'Müşteri').slice(0, 150),
        user_address: String(body.user_address || '').slice(0, 1000),
        user_phone: String(body.user_phone || '').slice(0, 50),
        merchant_ok_url: 'https://belgin.web.app/#payment-success',
        merchant_fail_url: 'https://belgin.web.app/#payment-failed',
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
        await orderRef.update({
          status: 'token_failed',
          errorMessage: String(result.reason || 'PayTR token reddedildi').slice(0, 500),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.status(502).json({ success: false, message: 'Ödeme sağlayıcısı işlemi başlatamadı.' });
      }

      await orderRef.update({
        status: 'token_created',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        token: result.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
        merchant_oid,
      });
    } catch (error) {
      console.error('createPayTRToken Error:', error.code || error.message);
      const status = error.code === 'PAYTR_CONFIG_MISSING' ? 503 : 400;
      return res.status(status).json({ success: false, message: status === 503 ? 'Ödeme servisi henüz aktif değil.' : error.message });
    }
  }));

exports.paytrCallback = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
      const config = getPayTRConfig();
      const { merchant_oid, status, total_amount, hash, failed_reason_code, failed_reason_msg } = req.body || {};
      if (!merchant_oid || !status || !total_amount || !hash) return res.status(400).send('Eksik parametre');

      const hashStr = String(merchant_oid) + String(config.merchant_salt) + String(status) + String(total_amount);
      const expectedHash = crypto.createHmac('sha256', config.merchant_key).update(hashStr).digest('base64');
      const incoming = Buffer.from(String(hash));
      const expected = Buffer.from(expectedHash);

      if (incoming.length !== expected.length || !crypto.timingSafeEqual(incoming, expected)) {
        console.error('[PayTR Security] Callback hash doğrulama başarısız:', merchant_oid);
        return res.status(400).send('PAYTR notification failed: bad hash');
      }

      const orderRef = db.collection('orders').doc(String(merchant_oid));
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) return res.status(404).send('Siparis bulunamadi');

      const order = orderDoc.data();
      if (order.status === 'completed' && order.paymentStatus === 'PAID') return res.status(200).send('OK');

      if (status === 'success') {
        await orderRef.update({
          status: 'completed',
          totalAmountReceived: String(total_amount),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: 'PAID',
        });
      } else {
        await orderRef.update({
          status: 'failed',
          failReason: String(failed_reason_code || 'Bilinmeyen hata').slice(0, 100),
          failMessage: String(failed_reason_msg || '').slice(0, 500),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: 'FAILED',
        });
      }

      return res.status(200).send('OK');
    } catch (error) {
      console.error('paytrCallback Error:', error.code || error.message);
      return res.status(500).send('Internal Server Error');
    }
  });

exports.getOrderStatus = functions
  .runWith({ timeoutSeconds: 10, memory: '128MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (!['GET', 'POST', 'OPTIONS'].includes(req.method)) return res.status(405).json({ success: false });
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const orderId = String(req.query.orderId || req.body?.orderId || '');
    if (!/^BLG-\d{10,}-[a-f0-9]{16}$/.test(orderId)) {
      return res.status(400).json({ success: false, message: 'Geçersiz sipariş numarası.' });
    }

    try {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      const data = orderDoc.data();
      return res.status(200).json({
        success: true,
        orderId,
        status: data.status,
        total: data.total,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : null,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Sipariş durumu okunamadı.' });
    }
  }));

exports.onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status) return null;
    console.log(`[Order Lifecycle] ${context.params.orderId}: ${before.status} -> ${after.status}`);
    return null;
  });
