const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

let LEGAL_MANIFEST = { schema: 'missing', manifestRootSha256: null, externalTimestampModel: null };
try {
  LEGAL_MANIFEST = require('./legal-manifest.json');
} catch (error) {
  console.error('[Order Evidence] legal-manifest.json yüklenemedi:', error.message);
}

const EVIDENCE_SCHEMA = 'belgin-order-legal-receipt-v1';
const TOKEN_TTL_MS = 30 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 8;
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

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').replace(/^90(?=5\d{9}$)/, '').replace(/^0(?=5\d{9}$)/, '');
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

function maskEmail(value) {
  const email = normalizeEmail(value);
  const [name, domain] = email.split('@');
  if (!name || !domain) return '—';
  const shown = name.length <= 2 ? `${name[0] || '*'}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${shown}@${domain}`;
}

function maskPhone(value) {
  const p = normalizePhone(value);
  if (p.length < 4) return '—';
  return `*** *** ${p.slice(-4)}`;
}

function timestampToIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isValidOrderId(value) {
  return /^BLG-\d{10,}-[a-f0-9]{16}$/i.test(String(value || '').trim());
}

async function enforceAttemptLimit(orderId, req, success) {
  const now = Date.now();
  const key = sha256(`${orderId}|${clientIp(req)}`);
  const ref = db.collection('evidenceAccessAttempts').doc(key);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};
    const start = Number(data.windowStartMs || 0);
    const expired = !start || now - start > ATTEMPT_WINDOW_MS;
    const failed = expired ? 0 : Number(data.failedCount || 0);
    if (!success && failed >= MAX_FAILED_ATTEMPTS) {
      const error = new Error('Çok fazla başarısız doğrulama denemesi. Lütfen daha sonra tekrar deneyin.');
      error.code = 'RATE_LIMITED';
      throw error;
    }
    tx.set(ref, {
      windowStartMs: expired ? now : start,
      failedCount: success ? 0 : failed + 1,
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      ipHash: sha256(clientIp(req)),
      orderIdHash: sha256(orderId),
    }, { merge: true });
  });
}

async function verifyOrderOwner(order, orderId, req, email, phone) {
  const actualEmail = normalizeEmail(order?.customer?.email);
  const actualPhone = normalizePhone(order?.customer?.phone);
  const ok = actualEmail && actualPhone && actualEmail === normalizeEmail(email) && actualPhone === normalizePhone(phone);
  await enforceAttemptLimit(orderId, req, ok);
  return ok;
}

function tokenMatches(candidate, storedHash) {
  if (!candidate || !storedHash) return false;
  const candidateHash = Buffer.from(sha256(candidate), 'hex');
  const expectedHash = Buffer.from(String(storedHash), 'hex');
  return candidateHash.length === expectedHash.length && crypto.timingSafeEqual(candidateHash, expectedHash);
}

function sanitizeLegalEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return null;
  const out = {};
  for (const [key, value] of Object.entries(evidence)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = {
        file: value.file || null,
        version: value.version || null,
        sha256: value.sha256 || null,
        bytes: Number(value.bytes || 0),
      };
    } else if (['schema', 'manifestSchema', 'manifestRootSha256', 'externalTimestampModel'].includes(key)) {
      out[key] = value;
    }
  }
  return out;
}

async function buildEvidenceReceipt(orderId, order) {
  const eventsSnap = await db.collection('orders').doc(orderId).collection('auditEvents').orderBy('serverAt', 'asc').limit(100).get();
  const auditTimeline = eventsSnap.docs.map((doc) => {
    const event = doc.data() || {};
    return {
      eventType: String(event.eventType || 'EVENT'),
      serverAt: timestampToIso(event.serverAt),
      auditId: event.auditId ? String(event.auditId) : null,
      paymentStatus: event.paymentStatus ? String(event.paymentStatus) : null,
      deliveryStatus: event.nextDeliveryStatus ? String(event.nextDeliveryStatus) : null,
    };
  });

  const root = String(order?.legal?.evidence?.manifestRootSha256 || order?.legalEvidenceRoot?.manifestRootSha256 || LEGAL_MANIFEST.manifestRootSha256 || '');
  const externalProof = /^[a-f0-9]{64}$/i.test(root) ? {
    model: 'OpenTimestamps/Bitcoin auxiliary proof',
    manifestRootSha256: root,
    rootFile: `/legal-proofs/legal-root-${root}.txt`,
    proofFile: `/legal-proofs/legal-root-${root}.txt.ots`,
    legalQualification: 'Yardımcı teknik dış zaman/varlık ispatıdır; 5070 kapsamında ESHS zaman damgası veya nitelikli elektronik imza değildir.',
  } : null;

  const deliveryVerification = order.deliveryVerification ? {
    identityVerified: order.deliveryVerification.identityVerified === true,
    deliveryFormCompleted: order.deliveryVerification.deliveryFormCompleted === true,
    productIdentifiersVerified: order.deliveryVerification.productIdentifiersVerified === true,
    deliveryFormReference: order.deliveryVerification.deliveryFormReference || null,
    productIdentifiersHash: order.deliveryVerification.productIdentifiersHash || null,
    auditId: order.deliveryVerification.auditId || null,
    completedAt: timestampToIso(order.deliveryVerification.completedAt || order.deliveredAt),
  } : null;

  const receipt = {
    schema: EVIDENCE_SCHEMA,
    generatedAt: new Date().toISOString(),
    seller: {
      tradeName: 'BELGİN KUYUMCULUK - SEMİH SONBAHAR',
      address: 'Menderes Caddesi No:231/B Buca / İzmir',
      phone: '+90 541 930 53 72',
      secondaryPhone: '+90 539 823 41 41',
      email: 'info@belgin.com',
      note: 'VKN/MERSİS/yetki bilgileri yalnız doğrulanmış resmi işletme kayıtlarıyla ayrıca gösterilir.',
    },
    buyer: {
      name: String(order?.customer?.name || ''),
      email: maskEmail(order?.customer?.email),
      phone: maskPhone(order?.customer?.phone),
    },
    order: {
      orderId,
      requestId: order.requestId || null,
      evidenceId: order.evidenceId || null,
      evidenceSchema: order.evidenceSchema || null,
      createdAt: timestampToIso(order.createdAt),
      status: order.status || null,
      total: Number(order.total || 0),
      currency: 'TRY',
      deliveryMethod: order.deliveryMethod || null,
      deliveryStatus: order.deliveryStatus || null,
      highValueSecureDelivery: order.highValueSecureDelivery === true,
      highValueThreshold: Number(order.highValueThreshold || 0),
      productSnapshotHash: order.productSnapshotHash || null,
      requestFingerprintHash: order.ipAddress ? sha256(`${order.ipAddress}|${order.userAgent || ''}`) : null,
    },
    items: Array.isArray(order.items) ? order.items.map((item) => ({
      id: item.id || null,
      name: item.name || null,
      brand: item.brand || null,
      reference: item.reference || null,
      metal: item.metal || null,
      category: item.category || null,
      price: Number(item.price || 0),
      qty: Number(item.qty || 0),
      highValueSecureDelivery: item.highValueSecureDelivery === true,
    })) : [],
    payment: {
      provider: 'PayTR',
      status: order.paymentStatus || null,
      confirmedAt: timestampToIso(order.paymentConfirmedAt),
      providerAmount: order.totalAmountReceived || null,
    },
    legal: {
      acceptedAt: timestampToIso(order?.legal?.acceptedAt),
      clientReportedPresentedAt: order?.legal?.clientReportedPresentedAt || null,
      clientReportedAcceptedAt: order?.legal?.clientReportedAcceptedAt || null,
      termsAccepted: order?.legal?.termsAccepted === true,
      preInformationAccepted: order?.legal?.preInformationAccepted === true,
      highValueDeliveryAccepted: order?.legal?.highValueDeliveryAccepted === true,
      marketingConsent: order?.legal?.marketingConsent === true,
      documents: sanitizeLegalEvidence(order?.legal?.evidence),
      externalProof,
    },
    kycAndDelivery: {
      internalKycPolicyApplied: order.internalKycPolicyApplied === true,
      internalKycThreshold: Number(order.internalKycThreshold || 0),
      masakLegalOverlayRequired: order.masakLegalOverlayRequired === true,
      deliveryVerification,
    },
    auditTimeline,
    qualification: 'Bu belge sunucu kayıtlarından üretilen işlem/delil özetidir. Tek başına nitelikli elektronik imza veya 5070 sayılı Kanun kapsamında ESHS zaman damgası değildir.',
  };

  const canonical = JSON.stringify(receipt);
  return { ...receipt, receiptSha256: sha256(canonical) };
}

const onOrderEvidenceFinalize = functions.firestore.document('orders/{orderId}').onCreate(async (snap, context) => {
  const order = snap.data() || {};
  const root = String(LEGAL_MANIFEST.manifestRootSha256 || '');
  if (!/^[a-f0-9]{64}$/i.test(root)) return null;
  const legalEvidenceRoot = {
    manifestSchema: LEGAL_MANIFEST.schema || null,
    manifestVersion: LEGAL_MANIFEST.version || null,
    manifestRootSha256: root,
    externalTimestampModel: LEGAL_MANIFEST.externalTimestampModel || 'OpenTimestamps/Bitcoin auxiliary proof',
    capturedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const bundleHash = sha256(JSON.stringify({
    orderId: context.params.orderId,
    evidenceId: order.evidenceId || null,
    productSnapshotHash: order.productSnapshotHash || null,
    manifestRootSha256: root,
  }));
  await snap.ref.set({ legalEvidenceRoot, evidenceBundleHash: bundleHash }, { merge: true });
  await snap.ref.collection('auditEvents').add({
    schema: 'belgin-order-evidence-v3',
    eventType: 'LEGAL_EVIDENCE_ROOT_CAPTURED',
    manifestRootSha256: root,
    evidenceBundleHash: bundleHash,
    serverAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return null;
});

const issueEvidenceAccessToken = functions
  .runWith({ timeoutSeconds: 15, memory: '128MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Yalnızca POST kabul edilir.' });
    try {
      const body = req.body || {};
      const orderId = String(body.orderId || '').trim();
      if (!isValidOrderId(orderId)) return res.status(400).json({ success: false, message: 'Geçerli sipariş numarası zorunludur.' });
      const orderRef = db.collection('orders').doc(orderId);
      const snap = await orderRef.get();
      if (!snap.exists) {
        await enforceAttemptLimit(orderId, req, false);
        return res.status(404).json({ success: false, message: 'Sipariş doğrulanamadı.' });
      }
      const order = snap.data();
      const ownerOk = await verifyOrderOwner(order, orderId, req, body.email, body.phone);
      if (!ownerOk) return res.status(403).json({ success: false, message: 'Sipariş bilgileri eşleşmedi.' });

      const token = crypto.randomBytes(32).toString('base64url');
      const expiresAtMs = Date.now() + TOKEN_TTL_MS;
      await orderRef.set({
        evidenceAccess: {
          tokenHash: sha256(token),
          expiresAtMs,
          issuedAt: admin.firestore.FieldValue.serverTimestamp(),
          issuedIpHash: sha256(clientIp(req)),
        },
      }, { merge: true });
      await orderRef.collection('auditEvents').add({
        schema: 'belgin-order-evidence-v3',
        eventType: 'EVIDENCE_ACCESS_ISSUED',
        expiresAtMs,
        serverAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ success: true, orderId, accessToken: token, expiresAt: new Date(expiresAtMs).toISOString() });
    } catch (error) {
      console.error('issueEvidenceAccessToken Error:', error.code || error.message);
      if (error.code === 'RATE_LIMITED') return res.status(429).json({ success: false, message: error.message });
      return res.status(400).json({ success: false, message: 'Delil belgesi erişimi oluşturulamadı.' });
    }
  }));

const getOrderEvidence = functions
  .runWith({ timeoutSeconds: 20, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Yalnızca POST kabul edilir.' });
    try {
      const orderId = String(req.body?.orderId || '').trim();
      if (!isValidOrderId(orderId)) return res.status(400).json({ success: false, message: 'Geçerli sipariş numarası zorunludur.' });
      const auth = String(req.headers.authorization || '');
      if (!auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Delil belgesi erişim anahtarı gerekli.' });

      const orderRef = db.collection('orders').doc(orderId);
      const snap = await orderRef.get();
      if (!snap.exists) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      const order = snap.data();
      const access = order.evidenceAccess || {};
      if (Date.now() > Number(access.expiresAtMs || 0) || !tokenMatches(auth.slice(7), access.tokenHash)) {
        return res.status(401).json({ success: false, message: 'Delil belgesi erişim anahtarının süresi dolmuş veya geçersiz.' });
      }

      const receipt = await buildEvidenceReceipt(orderId, order);
      await orderRef.collection('auditEvents').add({
        schema: 'belgin-order-evidence-v3',
        eventType: 'EVIDENCE_RECEIPT_VIEWED',
        receiptSha256: receipt.receiptSha256,
        serverAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.set('Cache-Control', 'no-store, private');
      return res.status(200).json({ success: true, receipt });
    } catch (error) {
      console.error('getOrderEvidence Error:', error.code || error.message);
      return res.status(400).json({ success: false, message: 'Sipariş delil belgesi oluşturulamadı.' });
    }
  }));

module.exports = { onOrderEvidenceFinalize, issueEvidenceAccessToken, getOrderEvidence };
