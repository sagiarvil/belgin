const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const ALLOWED_ORIGINS = new Set([
  'https://belginkuyumculuk.com',
  'https://www.belginkuyumculuk.com',
]);

const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, ALLOWED_ORIGINS.has(origin));
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
});

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

async function verifyStaff(req) {
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) {
    const error = new Error('Yetkili personel oturumu gerekli.');
    error.code = 'AUTH_REQUIRED';
    throw error;
  }
  const decoded = await admin.auth().verifyIdToken(auth.slice(7), true);
  if (decoded.admin !== true && decoded.staff !== true) {
    const error = new Error('Bu işlem için personel yetkisi gerekli.');
    error.code = 'FORBIDDEN';
    throw error;
  }
  return decoded;
}

function normalizeIdentifiers(value) {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    const cleaned = value.map((v) => String(v || '').trim()).filter(Boolean).slice(0, 20);
    return cleaned.length ? cleaned : null;
  }
  const cleaned = {};
  for (const [key, val] of Object.entries(value).slice(0, 20)) {
    const safeKey = String(key).replace(/[^a-zA-Z0-9_\-çğıöşüÇĞİÖŞÜ]/g, '').slice(0, 40);
    if (!safeKey) continue;
    cleaned[safeKey] = String(val ?? '').trim().slice(0, 200);
  }
  return Object.keys(cleaned).length ? cleaned : null;
}

const completeHighValueDelivery = functions
  .runWith({ timeoutSeconds: 20, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Yalnızca POST kabul edilir.' });

    try {
      const staff = await verifyStaff(req);
      const body = req.body || {};
      const orderId = String(body.orderId || '').trim();
      if (!/^BLG-\d{10,}-[a-f0-9]{16}$/.test(orderId)) return res.status(400).json({ success: false, message: 'Geçersiz sipariş numarası.' });

      const identityVerified = body.identityVerified === true;
      const deliveryFormCompleted = body.deliveryFormCompleted === true;
      const productIdentifiersVerified = body.productIdentifiersVerified === true;
      const deliveryFormReference = String(body.deliveryFormReference || '').trim().slice(0, 120);
      const productIdentifiers = normalizeIdentifiers(body.productIdentifiers);

      if (!identityVerified || !deliveryFormCompleted || !productIdentifiersVerified) {
        return res.status(400).json({ success: false, message: 'Kimlik doğrulama, teslim formu ve ürün kimliklendirme kontrollerinin tamamı zorunludur.' });
      }
      if (deliveryFormReference.length < 4) {
        return res.status(400).json({ success: false, message: 'Teslim-tesellüm form referansı zorunludur.' });
      }
      if (!productIdentifiers) {
        return res.status(400).json({ success: false, message: 'Ürün kimliklendirme bilgisi zorunludur.' });
      }

      const orderRef = db.collection('orders').doc(orderId);
      const identifiersHash = sha256(JSON.stringify(productIdentifiers));
      const auditId = `DLV-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(orderRef);
        if (!snap.exists) {
          const error = new Error('Sipariş bulunamadı.');
          error.code = 'NOT_FOUND';
          throw error;
        }
        const order = snap.data();
        if (order.highValueSecureDelivery !== true) {
          const error = new Error('Bu endpoint yalnız yüksek değerli mağaza teslim siparişleri içindir.');
          error.code = 'NOT_HIGH_VALUE';
          throw error;
        }
        if (order.paymentStatus !== 'PAID') {
          const error = new Error('Ödeme kesinleşmeden teslim tamamlanamaz.');
          error.code = 'PAYMENT_NOT_FINAL';
          throw error;
        }
        if (order.deliveryStatus === 'DELIVERED') {
          const error = new Error('Sipariş daha önce teslim edilmiş.');
          error.code = 'ALREADY_DELIVERED';
          throw error;
        }

        tx.update(orderRef, {
          status: 'completed',
          deliveryStatus: 'DELIVERED',
          deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
          deliveryVerification: {
            schema: 'belgin-high-value-delivery-v1',
            identityVerified: true,
            deliveryFormCompleted: true,
            productIdentifiersVerified: true,
            deliveryFormReference,
            productIdentifiersHash: identifiersHash,
            staffUid: staff.uid,
            auditId,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await orderRef.collection('auditEvents').add({
        schema: 'belgin-order-evidence-v2',
        eventType: 'HIGH_VALUE_DELIVERY_COMPLETED',
        auditId,
        staffUid: staff.uid,
        identityVerified: true,
        deliveryFormCompleted: true,
        productIdentifiersVerified: true,
        deliveryFormReference,
        productIdentifiersHash: identifiersHash,
        serverAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ success: true, orderId, deliveryStatus: 'DELIVERED', auditId });
    } catch (error) {
      console.error('completeHighValueDelivery Error:', error.code || error.message);
      if (error.code === 'AUTH_REQUIRED') return res.status(401).json({ success: false, message: error.message });
      if (error.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: error.message });
      if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, message: error.message });
      return res.status(400).json({ success: false, message: error.message || 'Teslim tamamlanamadı.' });
    }
  }));

module.exports = { completeHighValueDelivery };
