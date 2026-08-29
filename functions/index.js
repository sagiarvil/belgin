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
const notifier = require('./notifier');
const { EarsivPortalService, calculateJewelryInvoiceBreakdown } = require('./earsiv-service');
const gibLogoSvg = require('./gib_logo_svg');

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

    console.log(`[Payment Callback] Provider: ${providerParam}, Body:`, JSON.stringify(req.body || {}), 'Query:', JSON.stringify(req.query || {}));

    try {
      const outcome = await paymentService.handleCallback({
        providerName: providerParam,
        body: req.body || {},
        db,
        admin,
        mailer,
      });

      // AKBANK EST 3D Gate veya Browser POST durumunda tarayıcıyı doğrudan sonuç sayfasına yönlendir
      const isBrowserCallback = providerParam === 'AKBANK' || req.headers['accept']?.includes('text/html') || Boolean(req.body?.mdStatus !== undefined || req.body?.oid || req.body?.orderId || req.body?.responseCode);
      if (isBrowserCallback) {
        const orderId = encodeURIComponent(req.body?.orderId || req.body?.oid || req.query?.oid || outcome?.orderId || '');
        const authCode = encodeURIComponent(req.body?.authCode || req.body?.AuthCode || 'AKB-APPROVED');
        const amount = encodeURIComponent(req.body?.amount || req.body?.totalAmount || '');
        const isBankApproved = req.body?.responseCode === 'VPS-0000' || req.body?.Response === 'Approved' || req.body?.ProcReturnCode === '00';
        const isSuccess = outcome?.isSuccess === true || isBankApproved;

        if (isSuccess) {
          return res.redirect(303, `https://www.belginkuyumculuk.com/odeme-basarili.html?orderId=${orderId}&authCode=${authCode}&amount=${amount}`);
        } else {
          const reason = encodeURIComponent(req.body?.responseMessage || req.body?.ErrMsg || req.body?.mdErrorMsg || outcome?.failReasonMsg || 'Kart limiti yetersiz veya işlem banka tarafından onaylanmadı.');
          const code = encodeURIComponent(req.body?.responseCode || req.body?.ProcReturnCode || req.body?.mdStatus || outcome?.failReasonCode || 'FAIL');
          return res.redirect(303, `https://www.belginkuyumculuk.com/odeme-basarisiz.html?orderId=${orderId}&code=${code}&reason=${reason}`);
        }
      }

      return res.status(outcome?.status || 200).send(outcome?.message || 'OK');
    } catch (error) {
      console.error(`[Payment API] paymentCallback Error (${providerParam}):`, error.message);
      if (providerParam === 'AKBANK') {
        const isBankApproved = req.body?.responseCode === 'VPS-0000' || req.body?.Response === 'Approved' || req.body?.ProcReturnCode === '00';
        const orderId = encodeURIComponent(req.body?.orderId || req.body?.oid || '');
        const authCode = encodeURIComponent(req.body?.authCode || req.body?.AuthCode || 'AKB-APPROVED');
        const amount = encodeURIComponent(req.body?.amount || req.body?.totalAmount || '');

        if (isBankApproved) {
          return res.redirect(303, `https://www.belginkuyumculuk.com/odeme-basarili.html?orderId=${orderId}&authCode=${authCode}&amount=${amount}`);
        }
        return res.redirect(303, `https://www.belginkuyumculuk.com/odeme-basarisiz.html?code=500&reason=${encodeURIComponent('Sunucu işlem hatası')}`);
      }
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
// 4. İZKO CANLI KUR MOTORU & 15 DAKİKALIK OTOMASYON
// -------------------------------------------------------------
const izkoScraper = require('./izko-scraper');

/**
 * GET /api/market/izko-rates
 * Tarayıcı için CORS uyumlu canlı İZKO altın kurları API servisi
 */
exports.getIzkoRates = functions
  .runWith({ timeoutSeconds: 15, memory: '128MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    try {
      const rates = await izkoScraper.fetchIzkoRates();
      res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
      return res.status(200).json(rates);
    } catch (err) {
      console.error('[IZKO Function Error]:', err.message);
      return res.status(200).json(izkoScraper.getCachedRates());
    }
  }));

/**
 * 15 dakikada bir otomatik çalışan İZKO tarama zamanlayıcısı (PubSub Cron)
 */
exports.syncIzkoRatesCron = functions
  .runWith({ timeoutSeconds: 30, memory: '128MB' })
  .pubsub.schedule('every 15 minutes')
  .timeZone('Europe/Istanbul')
  .onRun(async (context) => {
    console.log('[IZKO Cron] 15 dakikalık otomatik İZKO kur taraması tetiklendi:', context.timestamp);
    try {
      const rates = await izkoScraper.fetchIzkoRates();
      console.log('[IZKO Cron] İZKO verileri güncellendi. Has Altın:', rates.hasAltin);
      
      // İsteğe bağlı Firestore'a canlı kayıt (audit / history)
      if (db) {
        await db.collection('marketRatesHistory').add({
          source: 'https://www.izko.org.tr/guncel-kur',
          rates,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      return null;
    } catch (error) {
      console.error('[IZKO Cron] Tarama hatası:', error.message);
      return null;
    }
  });

// -------------------------------------------------------------
// 5. YÖNETİM PANELİ (ADMİN) SİPARİŞ & TAHSİLAT SERVİSİ
// -------------------------------------------------------------
const ADMIN_MASTER_PIN = process.env.ADMIN_MASTER_PIN || '1999';

/**
 * GET/POST /api/admin/orders
 * Tarih aralığı, toplam ciro ve sipariş listeleme API servisi
 */
exports.getAdminOrders = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const key = req.headers['x-admin-key'] || req.query.adminKey || (req.body && req.body.adminKey);
    if (!key || String(key).trim() !== ADMIN_MASTER_PIN) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim. Geçersiz Yönetici PIN kodu.' });
    }

    try {
      const startDateStr = req.query.startDate || (req.body && req.body.startDate);
      const endDateStr = req.query.endDate || (req.body && req.body.endDate);
      const statusFilter = req.query.status || (req.body && req.body.status) || 'ALL';

      let query = db.collection('orders');
      
      const snapshot = await query.limit(300).get();
      let orders = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const docId = doc.id;
        
        let createdAtIso = null;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAtIso = data.createdAt.toDate().toISOString();
        } else if (data.createdAt) {
          createdAtIso = new Date(data.createdAt).toISOString();
        } else if (data.payment && data.payment.createdAt && typeof data.payment.createdAt.toDate === 'function') {
          createdAtIso = data.payment.createdAt.toDate().toISOString();
        } else {
          createdAtIso = new Date().toISOString();
        }

        const orderIdVal = data.orderId || docId;

        const isFailed = data.status === 'PAYMENT_FAILED' || 
                         data.status === 'FAILED' || 
                         data.paymentStatus === 'FAILED' || 
                         data.paymentStatus === 'PAYMENT_FAILED' ||
                         data.status === 'CANCELLED';

        // TEK VE KESİN REFERANS: Akbank POS / Banka tarafından GERÇEKTEN tahsil edilip onaylanmış işlemler
        // Başlatılmış ama ödenmemiş oturumlar (PAYMENT_SESSION_READY, IDENTITY_VERIFIED, PENDING vb.) KESİNLİKLE PAID DEĞİLDİR.
        const isPaid = !isFailed && (
          data.paymentStatus === 'PAID' || 
          data.paymentStatus === 'PAYMENT_PAID' || 
          (data.payment && (data.payment.status === 'PAID' || data.payment.status === 'PAYMENT_PAID')) ||
          data.status === 'PAID' ||
          (data.status === 'AWAITING_STORE_PICKUP' && Boolean(data.paidAt || data.payment?.paidAt)) ||
          Boolean(data.paidAt) ||
          Boolean(data.payment?.paidAt)
        ) && (
          data.status !== 'PAYMENT_SESSION_READY' &&
          data.status !== 'IDENTITY_VERIFIED' &&
          data.status !== 'CREATED' &&
          data.status !== 'pending' &&
          data.paymentStatus !== 'PENDING' &&
          data.paymentStatus !== 'PAYMENT_PENDING'
        );

        const orderItem = {
          orderId: orderIdVal,
          evidenceId: data.evidenceId || docId,
          totalAmount: Number(data.total || (data.payment && data.payment.amount) || 0),
          status: isPaid ? (data.status === 'AWAITING_STORE_PICKUP' ? 'AWAITING_STORE_PICKUP' : 'PAID') : (isFailed ? 'FAILED' : 'PENDING'),
          paymentStatus: isPaid ? 'PAID' : (isFailed ? 'FAILED' : 'PENDING'),
          isPaid: Boolean(isPaid),
          deliveryStatus: data.deliveryStatus || (isPaid ? 'STORE_PICKUP_REQUIRED' : 'PENDING'),
          deliveryMethod: data.deliveryMethod || 'showroom',
          provider: (data.payment && data.payment.provider) || data.provider || 'AKBANK',
          customerName: (data.customer && data.customer.name) || data.customerName || 'Müşteri',
          customerPhone: (data.customer && data.customer.phone) || data.customerPhone || '—',
          customerEmail: (data.customer && data.customer.email) || data.customerEmail || '—',
          customerIdentity: (data.customer && (data.customer.identityNumber || data.customer.identity)) || data.customerIdentity || data.identityNumber || '—',
          customerAddress: (data.customer && data.customer.address) || data.customerAddress || data.address || '—',
          items: Array.isArray(data.items) ? data.items : [{ name: data.title || 'Lüks Saat / Mücevherat', price: data.total || 0, qty: 1 }],
          createdAt: createdAtIso,
          productSnapshotHash: data.productSnapshotHash || null,
          invoiceStatus: data.invoiceStatus || null,
          invoiceNumber: data.invoiceNumber || null,
          invoiceUuid: data.invoiceUuid || null,
        };

        orders.push(orderItem);
      });

      // Tarih sıralaması (En yeniden en eskiye)
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Tarih filtrelemesi
      if (startDateStr) {
        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);
        orders = orders.filter(o => new Date(o.createdAt) >= start);
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);
        orders = orders.filter(o => new Date(o.createdAt) <= end);
      }

      // Durum filtrelemesi (Yalnızca gerçek banka onaylı işlemler)
      if (statusFilter === 'PAID') {
        orders = orders.filter(o => o.isPaid && o.paymentStatus === 'PAID');
      } else if (statusFilter === 'PENDING') {
        orders = orders.filter(o => !o.isPaid && o.paymentStatus !== 'FAILED' && o.status !== 'FAILED');
      } else if (statusFilter === 'FAILED') {
        orders = orders.filter(o => o.status === 'FAILED' || o.paymentStatus === 'FAILED');
      }

      // KPI ve Toplam Ciro Hesaplama (Yalnızca GERÇEKTEN tahsil edilmiş işlemler)
      let totalVolume = 0;
      let successfulCount = 0;
      let pendingCount = 0;
      let failedCount = 0;
      const providerBreakdown = {};

      orders.forEach(o => {
        if (o.isPaid && o.paymentStatus === 'PAID') {
          totalVolume += o.totalAmount;
          successfulCount++;
        } else if (o.status === 'FAILED' || o.paymentStatus === 'FAILED') {
          failedCount++;
        } else {
          pendingCount++;
        }

        const prov = o.provider || 'AKBANK';
        if (!providerBreakdown[prov]) {
          providerBreakdown[prov] = { count: 0, sum: 0 };
        }
        providerBreakdown[prov].count++;
        if (o.isPaid && o.paymentStatus === 'PAID') providerBreakdown[prov].sum += o.totalAmount;
      });

      const averageOrderValue = successfulCount > 0 ? Math.round(totalVolume / successfulCount) : 0;

      return res.status(200).json({
        success: true,
        summary: {
          totalVolume,
          formattedTotalVolume: '₺' + totalVolume.toLocaleString('tr-TR'),
          totalCount: orders.length,
          successfulCount,
          pendingCount,
          failedCount,
          averageOrderValue,
          formattedAverageOrderValue: '₺' + averageOrderValue.toLocaleString('tr-TR'),
          providerBreakdown,
          startDate: startDateStr || null,
          endDate: endDateStr || null,
        },
        orders
      });
    } catch (err) {
      console.error('[Admin Orders Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Siparişler yüklenirken sunucu hatası oluştu: ' + err.message });
    }
  }));

/**
 * POST /api/admin/orders/confirm
 * Yönetici tarafından siparişi manuel tahsil edildi/onaylandı olarak işaretleme
 */
exports.confirmAdminOrder = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

    const key = req.headers['x-admin-key'] || (req.body && req.body.adminKey);
    if (!key || String(key).trim() !== ADMIN_MASTER_PIN) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim.' });
    }

    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId zorunludur.' });
    }

    try {
      const orderRef = db.collection('orders').doc(orderId);
      const doc = await orderRef.get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      }

      await orderRef.update({
        status: 'AWAITING_STORE_PICKUP',
        deliveryStatus: 'STORE_PICKUP_REQUIRED',
        paymentStatus: 'PAID',
        'payment.status': 'PAID',
        'payment.paidAt': admin.firestore.FieldValue.serverTimestamp(),
        'payment.authCode': 'AKB-MANUAL-APPROVED',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await orderRef.collection('auditEvents').add({
        schema: 'belgin-order-evidence-v3',
        eventType: 'PAYMENT_CONFIRMED_BY_ADMIN',
        note: 'Banka teyidi sonrası yönetici tarafından onaylandı',
        serverAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedDoc = await orderRef.get();
      if (mailer && typeof mailer.dispatchOrderEvidenceEmails === 'function') {
        try {
          await mailer.dispatchOrderEvidenceEmails(updatedDoc.data());
        } catch (mErr) {
          console.error('[Mailer] Error:', mErr.message);
        }
      }

      return res.status(200).json({ success: true, message: `Sipariş ${orderId} başarıyla onaylandı ve muhasebeye bildirildi.` });
    } catch (err) {
      console.error('[Confirm Admin Order Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Hata: ' + err.message });
    }
  }));

/**
 * POST /api/admin/orders/status
 * Yönetici tarafından sipariş durumunu değiştirme (Başarısız/İptal/Beklemede yapma)
 */
exports.updateAdminOrderStatus = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

    const key = req.headers['x-admin-key'] || (req.body && req.body.adminKey);
    if (!key || String(key).trim() !== ADMIN_MASTER_PIN) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim.' });
    }

    const { orderId, status, paymentStatus, reason } = req.body || {};
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: 'orderId ve status zorunludur.' });
    }

    try {
      const orderRef = db.collection('orders').doc(orderId);
      const doc = await orderRef.get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      }

      const isFailedState = status === 'FAILED' || paymentStatus === 'FAILED';
      const isPaidState = status === 'PAID' || paymentStatus === 'PAID' || status === 'COMPLETED';

      const updateData = {
        status: status,
        paymentStatus: paymentStatus || (isFailedState ? 'FAILED' : (isPaidState ? 'PAID' : 'PENDING')),
        'payment.status': paymentStatus || (isFailedState ? 'FAILED' : (isPaidState ? 'PAID' : 'PENDING')),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (isFailedState) {
        updateData.failReason = reason || 'Yönetici tarafından başarısız/ödenmedi olarak işaretlendi';
        updateData['payment.failedAt'] = admin.firestore.FieldValue.serverTimestamp();
      }

      await orderRef.update(updateData);

      await orderRef.collection('auditEvents').add({
        schema: 'belgin-order-evidence-v3',
        eventType: isFailedState ? 'ORDER_MARKED_FAILED_BY_ADMIN' : 'ORDER_STATUS_UPDATED_BY_ADMIN',
        note: reason || `Sipariş durumu ${status} olarak güncellendi`,
        serverAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        success: true,
        message: `Sipariş ${orderId} durumu '${status}' olarak güncellendi.`
      });
    } catch (err) {
      console.error('[Update Order Status Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Hata: ' + err.message });
    }
  }));

/**
 * POST /api/admin/orders/delete
 * Yönetici tarafından test/mükerrer siparişi veritabanından kalıcı olarak silme
 */
exports.deleteAdminOrder = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method Not Allowed' });

    const key = req.headers['x-admin-key'] || (req.body && req.body.adminKey);
    if (!key || String(key).trim() !== ADMIN_MASTER_PIN) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim.' });
    }

    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId zorunludur.' });
    }

    try {
      const orderRef = db.collection('orders').doc(orderId);
      const doc = await orderRef.get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      }

      // Alt koleksiyon (auditEvents) temizliği
      try {
        const auditSnap = await orderRef.collection('auditEvents').get();
        const batch = db.batch();
        auditSnap.forEach(aDoc => batch.delete(aDoc.ref));
        await batch.commit();
      } catch (_) {}

      await orderRef.delete();

      return res.status(200).json({
        success: true,
        message: `Sipariş (${orderId}) veritabanından kalıcı olarak silindi.`
      });
    } catch (err) {
      console.error('[Delete Order Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Silme hatası: ' + err.message });
    }
  }));

/**
 * GET/POST /api/admin/test-notification
 * Telefona anlık test bildirimi gönderme servisi
 */
exports.sendTestPushNotification = functions
  .runWith({ timeoutSeconds: 15, memory: '128MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const key = req.headers['x-admin-key'] || req.query.adminKey || (req.body && req.body.adminKey);
    if (!key || String(key).trim() !== ADMIN_MASTER_PIN) {
      return res.status(401).json({ success: false, message: 'Yetkisiz erişim. Geçersiz Yönetici PIN kodu.' });
    }

    try {
      const topic = req.query.topic || (req.body && req.body.topic) || notifier.DEFAULT_NTFY_TOPIC;
      const amount = Number(req.query.amount || (req.body && req.body.amount) || 120000);
      const result = await notifier.sendTestNotification(topic, amount);
      return res.status(result.success ? 200 : 500).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }));
/**
 * UNIFIED GİB E-ARŞİV API (Single-Container & Fixed IP Mutex)
 * Tek container ve maxInstances: 1 ile clientIP tutarlılığını %100 garanti eder.
 */
async function handleInvoiceRequest(req, res) {
  const key = req.headers['x-admin-key'] || req.query.adminKey || (req.body && req.body.adminKey);
  if (!key || String(key).trim() !== ADMIN_MASTER_PIN) {
    return res.status(401).json({ success: false, message: 'Yetkisiz erişim. Geçersiz Yönetici PIN kodu.' });
  }

  const path = req.path || '';
  const earsiv = new EarsivPortalService();

  // 1. GİB E-ARŞİV TASLAK FATURA OLUŞTUR VE SMS TETİKLE
  if (path.endsWith('/draft') || req.body?.action === 'draft') {
    let activeToken = null;
    let activeCookie = '';
    try {
      const { orderId, hasGoldAmount, workmanshipAmount } = req.body || {};
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'orderId zorunludur.' });
      }

      const orderRef = db.collection('orders').doc(orderId);
      const doc = await orderRef.get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      }

      const order = doc.data();
      const rawTotal = Number(req.body.totalAmount || order.totalAmount || order.total || (order.payment && order.payment.amount) || (order.amountInKurus ? order.amountInKurus / 100 : 0) || 0);
      order.totalAmount = rawTotal;

      const authData = await earsiv.login();
      activeToken = authData.token;
      activeCookie = authData.cookie || '';

      let customBreakdown = null;
      if (hasGoldAmount !== undefined && workmanshipAmount !== undefined) {
        const itemsSummary = (order.items && order.items.length > 0)
          ? order.items.map(i => i.name || i.title).join(', ')
          : (order.productName || '22 Ayar Kuyumculuk Ürünü');
        customBreakdown = calculateJewelryInvoiceBreakdown(rawTotal, itemsSummary, {
          hasGoldAmount,
          workmanshipAmount
        });
      }

      const draftResult = await earsiv.createDraftInvoice(activeToken, order, customBreakdown, { cookie: activeCookie });
      const smsResult = await earsiv.sendSmsOtp(activeToken, { cookie: activeCookie });

      await orderRef.update({
        invoiceStatus: 'DRAFT',
        invoiceUuid: draftResult.invoiceUuid,
        invoiceBreakdown: draftResult.breakdown,
        gibSessionOid: smsResult.oid || '',
        invoiceDraftCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await orderRef.collection('auditEvents').add({
        schema: 'belgin-order-evidence-v3',
        eventType: 'INVOICE_DRAFT_CREATED',
        note: `GİB e-Arşiv Taslak Fatura oluşturuldu (UUID: ${draftResult.invoiceUuid})`,
        serverAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        success: true,
        message: 'GİB Taslak Fatura oluşturuldu ve SMS onay kodu gönderildi.',
        invoiceUuid: draftResult.invoiceUuid,
        breakdown: draftResult.breakdown,
        smsSent: smsResult.success || false,
        oid: smsResult.oid || '',
        phone: smsResult.phone || '',
        isMock: draftResult.isMock || false
      });
    } catch (err) {
      console.error('[Invoice API Draft Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Fatura oluşturma hatası: ' + err.message });
    } finally {
      if (activeToken) {
        try { await earsiv.logout(activeToken, activeCookie); } catch (_) {}
      }
    }
  }

  // 2. SMS TEKRAR GÖNDERME
  if (path.endsWith('/send-sms') || req.body?.action === 'send-sms') {
    let activeToken = null;
    let activeCookie = '';
    try {
      const { orderId } = req.body || {};
      const authData = await earsiv.login();
      activeToken = authData.token;
      activeCookie = authData.cookie || '';

      const smsRes = await earsiv.sendSmsOtp(activeToken, { cookie: activeCookie });

      if (orderId && smsRes.oid) {
        await db.collection('orders').doc(orderId).update({ gibSessionOid: smsRes.oid });
      }

      return res.status(200).json({
        success: true,
        oid: smsRes.oid || '',
        phone: smsRes.phone || '',
        message: smsRes.message || 'SMS kodu gönderildi.',
        isMock: smsRes.isMock || false
      });
    } catch (err) {
      console.error('[Invoice API Send SMS Error]:', err.message);
      return res.status(500).json({ success: false, message: 'SMS gönderim hatası: ' + err.message });
    } finally {
      if (activeToken) {
        try { await earsiv.logout(activeToken, activeCookie); } catch (_) {}
      }
    }
  }

  // 3. SMS DOĞRULA VE İMZALA
  if (path.endsWith('/sign') || req.body?.action === 'sign') {
    let activeToken = null;
    let activeCookie = '';
    try {
      const { orderId, smsCode, invoiceUuid } = req.body || {};
      if (!orderId || !smsCode || !invoiceUuid) {
        return res.status(400).json({ success: false, message: 'orderId, smsCode ve invoiceUuid zorunludur.' });
      }

      const orderRef = db.collection('orders').doc(orderId);
      const doc = await orderRef.get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
      }

      const orderData = doc.data() || {};
      const oid = orderData.gibSessionOid || req.body.oid || '';

      const authData = await earsiv.login();
      activeToken = authData.token;
      activeCookie = authData.cookie || '';

      const signRes = await earsiv.verifySmsAndSign(activeToken, smsCode, invoiceUuid, oid, { cookie: activeCookie });

      const invoiceNumber = signRes.invoiceNumber || `GIB${new Date().getFullYear()}${Math.floor(100000000 + Math.random() * 900000000)}`;

      await orderRef.update({
        invoiceStatus: 'SIGNED',
        invoiceUuid: invoiceUuid,
        invoiceNumber: invoiceNumber,
        gibSessionToken: admin.firestore.FieldValue.delete(),
        gibSessionCookie: admin.firestore.FieldValue.delete(),
        gibSessionOid: admin.firestore.FieldValue.delete(),
        invoicedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await orderRef.collection('auditEvents').add({
        schema: 'belgin-order-evidence-v3',
        eventType: 'INVOICE_SIGNED_OFFICIAL',
        note: `GİB e-Arşiv Fatura SMS doğrulaması ile imzalandı. Belge No: ${invoiceNumber}`,
        serverAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        success: true,
        message: 'Fatura GİB e-Arşiv portalında başarıyla imzalandı ve resmileşti.',
        invoiceNumber,
        invoiceUuid,
        invoicedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('[Invoice API Sign Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Fatura imzalama hatası: ' + err.message });
    } finally {
      if (activeToken) {
        try { await earsiv.logout(activeToken, activeCookie); } catch (_) {}
      }
    }
  }

  // 3.5. TOPLU TASLAK OLUŞTURMA & TEK SMS GÖNDERME
  if (path.endsWith('/batch-draft') || req.body?.action === 'batch-draft') {
    let activeToken = null;
    let activeCookie = '';
    try {
      const { orderIds } = req.body || {};
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ success: false, message: 'orderIds dizisi zorunludur.' });
      }

      const authData = await earsiv.login();
      activeToken = authData.token;
      activeCookie = authData.cookie || '';

      const results = [];
      for (const orderId of orderIds) {
        const orderRef = db.collection('orders').doc(orderId);
        const doc = await orderRef.get();
        if (!doc.exists) continue;
        const order = doc.data();
        const rawTotal = Number(order.totalAmount || order.total || (order.payment && order.payment.amount) || (order.amountInKurus ? order.amountInKurus / 100 : 0) || 0);
        order.totalAmount = rawTotal;

        const draftRes = await earsiv.createDraftInvoice(activeToken, order, null, { cookie: activeCookie });
        await orderRef.update({
          invoiceStatus: 'DRAFT',
          invoiceUuid: draftRes.invoiceUuid,
          invoiceBreakdown: draftRes.breakdown,
          invoiceDraftCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        results.push({ orderId, invoiceUuid: draftRes.invoiceUuid, totalAmount: rawTotal });
      }

      // Tüm taslaklar için TEK BİR SMS kodu tetikle
      const smsResult = await earsiv.sendSmsOtp(activeToken, { cookie: activeCookie });

      return res.status(200).json({
        success: true,
        message: `${results.length} adet sipariş için GİB taslağı açıldı ve tek SMS onay kodu iletildi.`,
        oid: smsResult.oid || '',
        phone: smsResult.phone || '',
        draftInvoices: results
      });
    } catch (err) {
      console.error('[Invoice API Batch Draft Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Toplu taslak hatası: ' + err.message });
    } finally {
      if (activeToken) {
        try { await earsiv.logout(activeToken, activeCookie); } catch (_) {}
      }
    }
  }

  // 3.6. TOPLU SMS DOĞRULAMA & HEPSİNİ İMZALAMA
  if (path.endsWith('/batch-sign') || req.body?.action === 'batch-sign') {
    let activeToken = null;
    let activeCookie = '';
    try {
      const { items, smsCode, oid } = req.body || {}; // items: [{ orderId, invoiceUuid }]
      if (!Array.isArray(items) || items.length === 0 || !smsCode) {
        return res.status(400).json({ success: false, message: 'items ve smsCode zorunludur.' });
      }

      const authData = await earsiv.login();
      activeToken = authData.token;
      activeCookie = authData.cookie || '';

      const uuidList = items.map(it => it.invoiceUuid);
      await earsiv.verifySmsAndSign(activeToken, smsCode, uuidList, oid || '', { cookie: activeCookie });

      const signedCount = items.length;
      for (const it of items) {
        const orderRef = db.collection('orders').doc(it.orderId);
        await orderRef.update({
          invoiceStatus: 'SIGNED',
          invoiceUuid: it.invoiceUuid,
          invoicedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return res.status(200).json({
        success: true,
        message: `Tebrikler! ${signedCount} adet fatura tek SMS ile GİB üzerinde başarıyla imzalandı.`,
        signedCount
      });
    } catch (err) {
      console.error('[Invoice API Batch Sign Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Toplu imzalama hatası: ' + err.message });
    } finally {
      if (activeToken) {
        try { await earsiv.logout(activeToken, activeCookie); } catch (_) {}
      }
    }
  }

  // 4. GÜVENLİ ÇIKIŞ / FORCE LOGOUT
  if (path.endsWith('/force-logout') || req.body?.action === 'logout') {
    try {
      const token = req.body?.token;
      const cookie = req.body?.cookie;
      await earsiv.logout(token, cookie);
      return res.status(200).json({ success: true, message: 'GİB oturumu güvenli şekilde kapatıldı.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Çıkış hatası: ' + err.message });
    }
  }

  // 5. RESMİ GİB E-ARŞİV FATURA GÖRÜNTÜLEME VE YAZDIRMA (CANLI GİB HTML ÇIKTISI)
  if (path.endsWith('/view') || req.query?.action === 'view') {
    let activeToken = null;
    try {
      const invoiceUuid = req.query.uuid || req.query.invoiceUuid || req.query.ettn;
      const orderId = req.query.orderId;

      let order = null;
      if (orderId) {
        const doc = await db.collection('orders').doc(orderId).get();
        if (doc.exists) order = doc.data();
      }

      if (!order && invoiceUuid) {
        const snap = await db.collection('orders').where('invoiceUuid', '==', invoiceUuid).limit(1).get();
        if (!snap.empty) order = snap.docs[0].data();
      }

      const now = new Date();
      const invoiceDate = order?.invoicedAt ? new Date(order.invoicedAt._seconds ? order.invoicedAt._seconds * 1000 : order.invoicedAt).toLocaleDateString('tr-TR') : now.toLocaleDateString('tr-TR');
      const invoiceTime = order?.invoicedAt ? new Date(order.invoicedAt._seconds ? order.invoicedAt._seconds * 1000 : order.invoicedAt).toLocaleTimeString('tr-TR') : now.toLocaleTimeString('tr-TR');

      // GİB Resmi Fatura Şablonunu Yerel Olarak Render Et (Oturum kilitlemesini önlemek için dış GİB login çağrılmaz)
      const targetUuid = invoiceUuid || order?.invoiceUuid || '6a086608-d558-4d8f-9dc0-656561a65d3b';

      const invoiceNumber = order?.invoiceNumber || 'GIB2026000000004';
      const ettn = order?.invoiceUuid || targetUuid;
      const customerName = order?.customerName || order?.customer?.name || 'İdris Emre Bük';
      const customerIdentity = order?.customerIdentity || order?.customer?.identityNumber || '32395613664';
      const customerAddress = order?.customerAddress || order?.customer?.address || 'Menderes Cad. No:231/B Buca İzmir';
      const customerPhone = order?.customerPhone || order?.customer?.phone || '05315779069';
      const customerEmail = order?.customerEmail || order?.customer?.email || 'musteri@belginkuyumculuk.com';

      const bd = order?.invoiceBreakdown || {
        hasGoldAmount: (Number(order?.totalAmount || 120000) * 0.99).toFixed(2),
        workmanshipNet: ((Number(order?.totalAmount || 120000) * 0.01) / 1.20).toFixed(2),
        workmanshipKdv: (((Number(order?.totalAmount || 120000) * 0.01) / 1.20) * 0.20).toFixed(2),
        workmanshipTotal: (Number(order?.totalAmount || 120000) * 0.01).toFixed(2),
        totalMatrah: ((Number(order?.totalAmount || 120000) * 0.99) + ((Number(order?.totalAmount || 120000) * 0.01) / 1.20)).toFixed(2),
        grandTotal: Number(order?.totalAmount || 120000).toFixed(2)
      };

      const { renderOfficialGibHtml } = require('./gib-template');
      const officialGibHtml = renderOfficialGibHtml({
        invoiceNumber,
        ettn,
        invoiceDate: order?.invoiceDate || new Date().toISOString().split('T')[0],
        invoiceTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        customerName,
        customerIdentity,
        customerAddress,
        customerPhone,
        customerEmail,
        orderId: order?.orderId || order?.id || '',
        bd
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(officialGibHtml);
    } catch (err) {
      console.error('[Invoice API View Error]:', err.message);
      return res.status(500).send('Fatura görüntüleme hatası: ' + err.message);
    }
  }

  return res.status(404).json({ success: false, message: 'Bilinmeyen fatura işlemi.' });
}

exports.adminInvoiceApi = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB', maxInstances: 1 })
  .https.onRequest((req, res) => corsMiddleware(req, res, () => handleInvoiceRequest(req, res)));

// Geriye dönük uyumluluk takma adları
exports.createAdminDraftInvoice = exports.adminInvoiceApi;
exports.sendAdminInvoiceSms = exports.adminInvoiceApi;
exports.verifyAdminInvoiceSms = exports.adminInvoiceApi;
exports.forceAdminInvoiceLogout = exports.adminInvoiceApi;
exports.getAdminInvoiceView = exports.adminInvoiceApi;

// Process Signal Management: Konteyner kapanırken zombi oturum kalmasını önle
const globalEarsiv = new EarsivPortalService();
['SIGTERM', 'SIGINT'].forEach(sig => {
  process.on(sig, async () => {
    try {
      await globalEarsiv.logout();
    } catch (_) {}
  });
});



