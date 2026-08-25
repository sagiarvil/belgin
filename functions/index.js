/**
 * BELGIN KUYUMCULUK — FIREBASE CLOUD FUNCTIONS
 * PayTR iFrame API / fail-closed payment processing
 * Legal evidence chain / KYC delivery enforcement: 25.08.2026-v2
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const qs = require('qs');
const PRODUCT_CATALOG = require('./product-catalog.json');

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

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

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

function generateRequestId() {
  return `REQ-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
}

function isHighValueCatalogProduct(product) {
  if (!product || Number(product.price) < HIGH_VALUE_SECURE_DELIVERY_THRESHOLD) return false;
  const category = String(product.category || '').toLowerCase();
  const metal = String(product.metal || '').toLowerCase();
  const isWatch = category === 'watch' || category === 'saat';
  const isGold = product.isGold === true || category === 'gold' || category === 'altin' || category === 'altın' || metal.includes('altın') || /au\s?\d{3}/i.test(metal);
  return isWatch || isGold;
}

function normalizeCart(clientItems) {
  if (!Array.isArray(clientItems) || clientItems.length === 0) throw new Error('Sepet boş olamaz.');
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
      brand: String(product.brand || ''),
      reference: String(product.reference || ''),
      metal: String(product.metal || ''),
      price: Number(product.price),
      qty,
      category: String(product.category || ''),
      isGold: product.isGold === true,
      highValueSecureDelivery: isHighValueCatalogProduct(product),
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

function validateLegalAndDelivery(body, items) {
  const hasHighValue = items.some((item) => item.highValueSecureDelivery === true);
  const termsAccepted = body.termsAccepted === true;
  const preInformationAccepted = body.preInformationAccepted === true;
  const highValueDeliveryAccepted = body.highValueDeliveryAccepted === true;
  const deliveryMethod = String(body.deliveryMethod || '').trim().toLowerCase();

  if (!termsAccepted || !preInformationAccepted) {
    const error = new Error('Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu onayı zorunludur.');
    error.code = 'LEGAL_CONSENT_REQUIRED';
    throw error;
  }

  if (hasHighValue) {
    if (!highValueDeliveryAccepted) {
      const error = new Error('12.000 TL ve üzerindeki altın/saat ürünü için mağaza teslim, kimlik doğrulama ve işlem güvenliği koşulu onayı zorunludur.');
      error.code = 'HIGH_VALUE_CONSENT_REQUIRED';
      throw error;
    }
    if (deliveryMethod !== 'showroom') {
      const error = new Error('12.000 TL ve üzerindeki altın ve saat ürünleri yalnız mağazadan teslim edilir.');
      error.code = 'HIGH_VALUE_DELIVERY_REQUIRED';
      throw error;
    }
  } else if (!['showroom', 'carrier'].includes(deliveryMethod)) {
    const error = new Error('Geçerli teslim yöntemi seçilmelidir.');
    error.code = 'DELIVERY_METHOD_INVALID';
    throw error;
  }

  return {
    hasHighValue,
    deliveryMethod: hasHighValue ? 'showroom' : deliveryMethod,
    termsAccepted,
    preInformationAccepted,
    highValueDeliveryAccepted: hasHighValue ? highValueDeliveryAccepted : false,
    marketingConsent: body.marketingConsent === true,
  };
}

async function appendAuditEvent(orderRef, eventType, data = {}) {
  const safeData = JSON.parse(JSON.stringify(data));
  await orderRef.collection('auditEvents').add({
    schema: LEGAL_EVIDENCE_SCHEMA,
    eventType,
    ...safeData,
    serverAt: admin.firestore.FieldValue.serverTimestamp(),
  });
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
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: 'Geçerli e-posta zorunludur.' });

      const items = normalizeCart(body.items);
      const compliance = validateLegalAndDelivery(body, items);
      const legalEvidence = getLegalEvidenceSnapshot(compliance.hasHighValue);
      const serverTotal = calculateTotal(items);
      const merchant_oid = generateOrderId();
      const requestId = generateRequestId();
      const clientIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
      const amountInKurus = String(Math.round(serverTotal * 100));
      const basketBase64 = encodeUserBasket(items);
      const testMode = Number(process.env.PAYTR_TEST_MODE || 0) === 1 ? 1 : 0;
      const productSnapshotHash = sha256(JSON.stringify(items));
      const evidenceId = sha256(JSON.stringify({ merchant_oid, requestId, productSnapshotHash, legalEvidence, total: serverTotal, deliveryMethod: compliance.deliveryMethod }));

      const customerAddress = compliance.deliveryMethod === 'showroom'
        ? 'Belgin Kuyumculuk — Menderes Caddesi No:231/B Buca / İzmir — Mağazadan Teslim'
        : String(body.user_address || '').slice(0, 1000);

      const orderRef = db.collection('orders').doc(merchant_oid);
      await orderRef.set({
        orderId: merchant_oid,
        requestId,
        evidenceId,
        evidenceSchema: LEGAL_EVIDENCE_SCHEMA,
        status: 'pending',
        paymentStatus: 'PENDING',
        deliveryStatus: compliance.hasHighValue ? 'STORE_PICKUP_REQUIRED' : 'PENDING',
        deliveryMethod: compliance.deliveryMethod,
        highValueSecureDelivery: compliance.hasHighValue,
        highValueThreshold: HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
        internalKycPolicyApplied: compliance.hasHighValue,
        internalKycThreshold: HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
        masakLegalOverlayRequired: true,
        items,
        productSnapshotHash,
        total: serverTotal,
        amountInKurus,
        customer: {
          name: String(body.user_name || '').slice(0, 150),
          email,
          phone: String(body.user_phone || '').slice(0, 50),
          address: customerAddress,
        },
        legal: {
          termsAccepted: compliance.termsAccepted,
          preInformationAccepted: compliance.preInformationAccepted,
          highValueDeliveryAccepted: compliance.highValueDeliveryAccepted,
          marketingConsent: compliance.marketingConsent,
          internalKycPolicyApplied: compliance.hasHighValue,
          internalKycThreshold: HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
          masakObligationsApplyWhenLegalConditionsMet: true,
          suspiciousTransactionAssessmentAmountIndependent: true,
          evidence: legalEvidence,
          clientReportedPresentedAt: String(body?.legalPresentation?.presentedAt || '').slice(0, 50) || null,
          clientReportedAcceptedAt: String(body?.legalPresentation?.acceptedAt || '').slice(0, 50) || null,
          acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ipAddress: clientIp,
        userAgent,
        testMode: testMode === 1,
      });

      await appendAuditEvent(orderRef, 'ORDER_CREATED', {
        requestId,
        evidenceId,
        paymentStatus: 'PENDING',
        deliveryMethod: compliance.deliveryMethod,
        highValueSecureDelivery: compliance.hasHighValue,
        highValueThreshold: HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
        productSnapshotHash,
        legalEvidence,
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
        max_installment: 3,
        user_name: String(body.user_name || 'Müşteri').slice(0, 150),
        user_address: customerAddress,
        user_phone: String(body.user_phone || '').slice(0, 50),
        merchant_ok_url: 'https://belginkuyumculuk.com/#payment-success',
        merchant_fail_url: 'https://belginkuyumculuk.com/#payment-failed',
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
        await appendAuditEvent(orderRef, 'PAYMENT_TOKEN_FAILED', { reason: String(result.reason || '').slice(0, 500) });
        return res.status(502).json({ success: false, message: 'Ödeme sağlayıcısı işlemi başlatamadı.' });
      }

      await orderRef.update({ status: 'token_created', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      await appendAuditEvent(orderRef, 'PAYMENT_TOKEN_CREATED', { provider: 'PayTR' });

      return res.status(200).json({
        success: true,
        token: result.token,
        iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
        merchant_oid,
        evidenceId,
        deliveryMethod: compliance.deliveryMethod,
        highValueSecureDelivery: compliance.hasHighValue,
      });
    } catch (error) {
      console.error('createPayTRToken Error:', error.code || error.message);
      const status = ['PAYTR_CONFIG_MISSING', 'LEGAL_MANIFEST_INVALID'].includes(error.code) ? 503 : 400;
      return res.status(status).json({ success: false, message: status === 503 ? 'Ödeme/uyum servisi henüz aktif değil.' : error.message });
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
      if (String(total_amount) !== String(order.amountInKurus)) {
        console.error('[PayTR Security] Callback amount mismatch:', merchant_oid, total_amount, order.amountInKurus);
        await appendAuditEvent(orderRef, 'CALLBACK_AMOUNT_MISMATCH', { received: String(total_amount), expected: String(order.amountInKurus) });
        return res.status(400).send('PAYTR notification failed: amount mismatch');
      }
      if (['paid_awaiting_store_pickup', 'completed'].includes(order.status) && order.paymentStatus === 'PAID') return res.status(200).send('OK');

      if (status === 'success') {
        const highValue = order.highValueSecureDelivery === true;
        await orderRef.update({
          status: highValue ? 'paid_awaiting_store_pickup' : 'completed',
          deliveryStatus: highValue ? 'STORE_PICKUP_REQUIRED' : (order.deliveryStatus || 'PENDING'),
          totalAmountReceived: String(total_amount),
          paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: 'PAID',
        });
        await appendAuditEvent(orderRef, 'PAYMENT_CONFIRMED', {
          provider: 'PayTR',
          paymentStatus: 'PAID',
          totalAmountReceived: String(total_amount),
          nextDeliveryStatus: highValue ? 'STORE_PICKUP_REQUIRED' : (order.deliveryStatus || 'PENDING'),
        });
      } else {
        await orderRef.update({
          status: 'failed',
          failReason: String(failed_reason_code || 'Bilinmeyen hata').slice(0, 100),
          failMessage: String(failed_reason_msg || '').slice(0, 500),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: 'FAILED',
        });
        await appendAuditEvent(orderRef, 'PAYMENT_FAILED', {
          provider: 'PayTR',
          paymentStatus: 'FAILED',
          failReason: String(failed_reason_code || '').slice(0, 100),
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
    if (!/^BLG-\d{10,}-[a-f0-9]{16}$/.test(orderId)) return res.status(400).json({ success: false, message: 'Geçersiz sipariş numarası.' });

    try {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      const data = orderDoc.data();
      return res.status(200).json({
        success: true,
        orderId,
        evidenceId: data.evidenceId || null,
        evidenceSchema: data.evidenceSchema || null,
        status: data.status,
        paymentStatus: data.paymentStatus || null,
        deliveryStatus: data.deliveryStatus || null,
        deliveryMethod: data.deliveryMethod || null,
        highValueSecureDelivery: data.highValueSecureDelivery === true,
        total: data.total,
        legalEvidence: data.legal?.evidence || null,
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
    if (before.status === after.status && before.deliveryStatus === after.deliveryStatus && before.paymentStatus === after.paymentStatus) return null;
    console.log(`[Order Lifecycle] ${context.params.orderId}: ${before.status} -> ${after.status}`);
    const orderRef = change.after.ref;
    await appendAuditEvent(orderRef, 'ORDER_LIFECYCLE_CHANGED', {
      beforeStatus: before.status || null,
      afterStatus: after.status || null,
      beforePaymentStatus: before.paymentStatus || null,
      afterPaymentStatus: after.paymentStatus || null,
      beforeDeliveryStatus: before.deliveryStatus || null,
      afterDeliveryStatus: after.deliveryStatus || null,
    });
    return null;
  });
