/**
 * BELGIN KUYUMCULUK — FIREBASE CLOUD FUNCTIONS
 * Enterprise Multi-POS Payment Architecture (PayTR, QNB, Akbank, Yapı Kredi)
 * Legal evidence chain / KYC delivery enforcement: 25.08.2026-v2
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const PRODUCT_CATALOG = require('./product-catalog.json');
const paymentService = require('./payment/payment-service');
const mailer = require('./mailer');

let LEGAL_MANIFEST = { schema: 'missing', documents: {} };
try {
  LEGAL_MANIFEST = require('./legal-manifest.json');
} catch (error) {
  console.error('[Legal Evidence] legal-manifest.json yüklenemedi:', error.message);
}

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const HIGH_VALUE_SECURE_DELIVERY_THRESHOLD = 12000;
const LEGAL_EVIDENCE_SCHEMA = 'belgin-order-evidence-v2';
const LEGAL_VERSIONS = Object.freeze({
  terms: '2026-08-25-v2',
  preInformation: '2026-08-25-v2',
  highValueDelivery: '2026-08-25-v2',
  kycMasak: '2026-08-25-v2',
  kvkkNotice: '2026-08-25-v2',
  evidencePolicy: '2026-08-25-v2',
});

const LEGAL_FILES = Object.freeze({
  terms: 'mesafeli-satis-sozlesmesi.html',
  preInformation: 'on-bilgilendirme-formu.html',
  highValueDelivery: 'yuksek-degerli-urun-teslimi.html',
  kycMasak: 'musteri-tanima-ve-islem-guvenligi.html',
  kvkkNotice: 'kvkk.html',
  evidencePolicy: 'hukuki-delil-ve-kayit-politikasi.html',
});

const DEFAULT_ALLOWED_ORIGINS = [
  'https://belginkuyumculuk.com',
  'https://www.belginkuyumculuk.com',
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

function getLegalRecord(key) {
  const file = LEGAL_FILES[key];
  const record = LEGAL_MANIFEST?.documents?.[file];
  if (!record || !/^[a-f0-9]{64}$/i.test(String(record.sha256 || ''))) {
    const error = new Error(`Hukuki belge bütünlük kaydı hazır değil: ${file}`);
    error.code = 'LEGAL_MANIFEST_INVALID';
    throw error;
  }
  return {
    file,
    version: String(record.version || LEGAL_VERSIONS[key] || ''),
    sha256: String(record.sha256),
    bytes: Number(record.bytes || 0),
  };
}

function getLegalEvidenceSnapshot(hasHighValue) {
  const snapshot = {
    schema: LEGAL_EVIDENCE_SCHEMA,
    manifestSchema: String(LEGAL_MANIFEST?.schema || ''),
    terms: getLegalRecord('terms'),
    preInformation: getLegalRecord('preInformation'),
    kycMasak: getLegalRecord('kycMasak'),
    kvkkNotice: getLegalRecord('kvkkNotice'),
    evidencePolicy: getLegalRecord('evidencePolicy'),
  };
  snapshot.highValueDelivery = hasHighValue ? getLegalRecord('highValueDelivery') : null;
  return snapshot;
}

// -------------------------------------------------------------
// 1. UNIFIED PAYMENT API (MULTI-POS)
// -------------------------------------------------------------

/**
 * POST /api/payment/create
 */
exports.createPayment = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Yalnızca POST kabul edilir.' });

    try {
      const clientIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);

      const result = await paymentService.createPaymentSession({
        body: req.body || {},
        reqContext: { clientIp, userAgent },
        db,
        admin,
        productCatalog: PRODUCT_CATALOG,
        getLegalEvidenceSnapshot,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('[Payment API] createPayment Error:', error.code || error.message);
      const isConfigError = ['PAYTR_CONFIG_MISSING', 'LEGAL_MANIFEST_INVALID', 'PROVIDER_NOT_CONFIGURED'].includes(error.code);
      const status = isConfigError ? 503 : 400;
      return res.status(status).json({ success: false, message: error.message || 'Ödeme oturumu oluşturulamadı.' });
    }
  }));

/**
 * POST /api/payment/callback/:provider
 */
exports.paymentCallback = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const providerParam = String(req.query.provider || req.path.split('/').filter(Boolean).pop() || 'AKBANK').toUpperCase();

    try {
      const outcome = await paymentService.handleCallback({
        providerName: providerParam,
        body: req.body || {},
        db,
        admin,
        mailer,
      });
      return res.status(outcome.status).send(outcome.message);
    } catch (error) {
      console.error(`[Payment API] paymentCallback Error (${providerParam}):`, error.message);
      return res.status(500).send('Internal Server Error');
    }
  });

/**
 * GET/POST /api/payment/status
 */
exports.getPaymentStatus = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (!['GET', 'POST', 'OPTIONS'].includes(req.method)) return res.status(405).json({ success: false });
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const orderId = String(req.query.orderId || req.body?.orderId || '');
    if (!/^BLG-\d{10,}-[a-f0-9]{16}$/.test(orderId) && !orderId.startsWith('VIP-') && !orderId.startsWith('BLG-')) {
      return res.status(400).json({ success: false, message: 'Geçersiz sipariş numarası.' });
    }

    try {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      const data = orderDoc.data();
      return res.status(200).json({
        success: true,
        orderId,
        provider: data.payment?.provider || 'PAYTR',
        paymentStatus: data.paymentStatus || data.payment?.status || null,
        deliveryStatus: data.deliveryStatus || null,
        deliveryMethod: data.deliveryMethod || null,
        highValueSecureDelivery: data.highValueSecureDelivery === true,
        total: data.total,
        evidenceId: data.evidenceId || null,
        evidenceSchema: data.evidenceSchema || null,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : null,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Sipariş durumu okunamadı.' });
    }
  }));

// -------------------------------------------------------------
// 2. BACKWARD COMPATIBILITY DELEGATES (PRESERVE WORKING SYSTEM)
// -------------------------------------------------------------

/**
 * POST /api/createPayTRToken (Legacy proxy -> calls paymentService)
 */
exports.createPayTRToken = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Yalnızca POST kabul edilir.' });

    try {
      const clientIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);

      const body = { ...(req.body || {}), provider: 'PAYTR' };
      const result = await paymentService.createPaymentSession({
        body,
        reqContext: { clientIp, userAgent },
        db,
        admin,
        productCatalog: PRODUCT_CATALOG,
        getLegalEvidenceSnapshot,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('createPayTRToken Error:', error.code || error.message);
      const isConfigError = ['PAYTR_CONFIG_MISSING', 'LEGAL_MANIFEST_INVALID'].includes(error.code);
      const status = isConfigError ? 503 : 400;
      return res.status(status).json({ success: false, message: isConfigError ? 'Ödeme/uyum servisi henüz aktif değil.' : error.message });
    }
  }));

/**
 * POST /api/paytrCallback (Legacy proxy -> calls paymentService handleCallback)
 */
exports.paytrCallback = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
      const outcome = await paymentService.handleCallback({
        providerName: 'PAYTR',
        body: req.body || {},
        db,
        admin,
        mailer,
      });
      return res.status(outcome.status).send(outcome.message);
    } catch (error) {
      console.error('paytrCallback Error:', error.message);
      return res.status(500).send('Internal Server Error');
    }
  });

/**
 * GET/POST /api/getOrderStatus (Legacy proxy)
 */
exports.getOrderStatus = exports.getPaymentStatus;

// -------------------------------------------------------------
// 3. FIRESTORE ORDER LIFECYCLE TRIGGER
// -------------------------------------------------------------
exports.onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.status === after.status && before.deliveryStatus === after.deliveryStatus && before.paymentStatus === after.paymentStatus) return null;
    console.log(`[Order Lifecycle] ${context.params.orderId}: ${before.status} -> ${after.status}`);
    const orderRef = change.after.ref;
    await orderRef.collection('auditEvents').add({
      schema: LEGAL_EVIDENCE_SCHEMA,
      eventType: 'ORDER_LIFECYCLE_CHANGED',
      beforeStatus: before.status || null,
      afterStatus: after.status || null,
      beforePaymentStatus: before.paymentStatus || null,
      afterPaymentStatus: after.paymentStatus || null,
      beforeDeliveryStatus: before.deliveryStatus || null,
      afterDeliveryStatus: after.deliveryStatus || null,
      serverAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return null;
  });
