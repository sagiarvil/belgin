/**
 * BELGIN KUYUMCULUK — FIREBASE CLOUD FUNCTIONS
 * Enterprise & Exclusive PayTR iFrame API & Payment Processing Engine
 * 
 * Güvenlik & Standartlar:
 * - HMAC-SHA256 Token & Hash Doğrulama
 * - Tam CORS & Preflight (OPTIONS) Desteği
 * - Firestore Sipariş Yaşam Döngüsü (pending -> token_created -> completed / failed)
 * - Statik IP gerektirmez (PayTR sunucu taraflı iletişim)
 * - Spark (ücretsiz) veya Blaze plan ile tam uyumlu
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const cors = require('cors')({ origin: true });
const qs = require('qs');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// ============================================
// PAYTR KONFIGURASYONU
// ============================================
const PAYTR_CONFIG = {
  merchant_id: process.env.PAYTR_MERCHANT_ID || functions.config().paytr?.merchant_id || 'YOUR_MERCHANT_ID',
  merchant_key: process.env.PAYTR_MERCHANT_KEY || functions.config().paytr?.merchant_key || 'YOUR_MERCHANT_KEY',
  merchant_salt: process.env.PAYTR_MERCHANT_SALT || functions.config().paytr?.merchant_salt || 'YOUR_MERCHANT_SALT',
  api_url: 'https://www.paytr.com/odeme/api/get-token',
};

// ============================================
// YARDIMCI FONKSIYONLAR
// ============================================

/**
 * PayTR Token Hash Oluşturucu
 * Formula: SHA256(merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt, merchant_key)
 */
function generatePayTRToken(params) {
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
    String(PAYTR_CONFIG.merchant_salt);

  return CryptoJS.HmacSHA256(hashStr, PAYTR_CONFIG.merchant_key).toString(CryptoJS.enc.Base64);
}

/**
 * Sepet verisini PayTR standart JSON Base64 dizisine çevirir
 * Format: [["Ürün Adı", "Fiyat (Örn: '15000.00')", "Adet (Örn: '1')"]]
 */
function encodeUserBasket(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return Buffer.from(JSON.stringify([["Lüks Mücevherat Siparişi", "1.00", "1"]])).toString('base64');
  }
  const basket = items.map(item => [
    String(item.name || 'Mücevher'),
    Number(item.price || 0).toFixed(2),
    String(item.qty || 1)
  ]);
  return Buffer.from(JSON.stringify(basket)).toString('base64');
}

/**
 * Benzersiz Sipariş Kodu Üretici (Örn: BLG-1740000000000-8472)
 */
function generateOrderId() {
  return 'BLG-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
}

// ============================================
// 1. PAYTR TOKEN OLUŞTUR (HTTP REST Endpoint)
// ============================================
exports.createPayTRToken = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest((req, res) => {
    return cors(req, res, async () => {
      // Sadece POST kabul et
      if (req.method === 'OPTIONS') {
        return res.status(204).send('');
      }
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Yalnızca POST istekleri kabul edilir.' });
      }

      try {
        const body = req.body || {};
        const {
          email,
          payment_amount,
          items,
          customer,
          user_name,
          user_address,
          user_phone,
          merchant_oid: reqMerchantOid,
          test_mode = 1,
          no_installment = 0,
          max_installment = 6,
          currency = 'TL',
          lang = 'tr',
          debug_on = 0,
        } = body;

        // Validasyon
        if (!email || !payment_amount || !items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Eksik sipariş bilgisi. E-posta, sepet ve ödeme tutarı zorunludur.',
          });
        }

        const merchant_oid = reqMerchantOid || generateOrderId();
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
        const basketBase64 = encodeUserBasket(items);
        const amountInKurus = Math.round(Number(payment_amount) * 100).toString();

        // 1. Firestore Sipariş Kaydı (pending)
        const orderRef = db.collection('orders').doc(merchant_oid);
        await orderRef.set({
          orderId: merchant_oid,
          status: 'pending',
          items,
          total: Number(payment_amount),
          amountInKurus,
          customer: customer || {
            name: user_name || '',
            email: email,
            phone: user_phone || '',
            address: user_address || ''
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: clientIp,
          testMode: test_mode === 1,
        });

        // 2. PayTR İstek Parametreleri
        const paytrParams = {
          merchant_id: PAYTR_CONFIG.merchant_id,
          user_ip: clientIp,
          merchant_oid: merchant_oid,
          email: email,
          payment_amount: amountInKurus,
          paytr_token: '',
          user_basket: basketBase64,
          debug_on: debug_on,
          test_mode: test_mode,
          no_installment: no_installment,
          max_installment: max_installment,
          user_name: user_name || (customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : 'Müşteri'),
          user_address: user_address || (customer ? customer.address : 'İstanbul / Türkiye'),
          user_phone: user_phone || (customer ? customer.phone : '05000000000'),
          merchant_ok_url: body.merchant_ok_url || 'https://belginkuyumculuk.web.app/#payment-success',
          merchant_fail_url: body.merchant_fail_url || 'https://belginkuyumculuk.web.app/#payment-failed',
          timeout_limit: 30,
          currency: currency,
          lang: lang,
        };

        paytrParams.paytr_token = generatePayTRToken(paytrParams);

        // Canlı / Test PayTR API İsteği
        // Eğer PayTR anahtarları varsayılan / mock ise demo test simülasyonu sağla
        if (PAYTR_CONFIG.merchant_id === 'YOUR_MERCHANT_ID') {
          console.log('[PayTR Simulation] Gerçek anahtarlar tanımlanana kadar simüle edilmiş token üretiliyor.');
          const mockToken = 'mock_paytr_token_' + Buffer.from(merchant_oid).toString('base64');
          await orderRef.update({
            status: 'token_created',
            paytrToken: mockToken,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            simulation: true,
          });

          return res.status(200).json({
            success: true,
            token: mockToken,
            iframeUrl: `https://www.paytr.com/odeme/guvenli/${mockToken}`,
            merchant_oid: merchant_oid,
            simulation: true,
          });
        }

        const response = await axios.post(PAYTR_CONFIG.api_url, qs.stringify(paytrParams), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000,
        });

        const result = response.data;

        if (result.status === 'success') {
          await orderRef.update({
            status: 'token_created',
            paytrToken: result.token,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          return res.status(200).json({
            success: true,
            token: result.token,
            iframeUrl: `https://www.paytr.com/odeme/guvenli/${result.token}`,
            merchant_oid: merchant_oid,
          });
        } else {
          await orderRef.update({
            status: 'token_failed',
            errorMessage: result.reason,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          return res.status(400).json({
            success: false,
            message: `PayTR Hatası: ${result.reason}`,
          });
        }
      } catch (error) {
        console.error('createPayTRToken Exception:', error);
        return res.status(500).json({
          success: false,
          message: 'Ödeme tokeni oluşturulurken sunucu hatası meydana geldi: ' + error.message,
        });
      }
    });
  });

// ============================================
// 2. PAYTR CALLBACK (WebHook / IPN Endpoint)
// ============================================
exports.paytrCallback = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    try {
      const {
        merchant_oid,
        status,
        total_amount,
        hash,
        failed_reason_code,
        failed_reason_msg,
      } = req.body || {};

      if (!merchant_oid || !status || !hash) {
        return res.status(400).send('Eksik parametre');
      }

      // Hash Doğrulama
      const hashStr = String(merchant_oid) + PAYTR_CONFIG.merchant_salt + String(status) + 
                      String(total_amount) + PAYTR_CONFIG.merchant_salt;
      const expectedHash = CryptoJS.HmacSHA256(hashStr, PAYTR_CONFIG.merchant_key).toString(CryptoJS.enc.Base64);

      if (PAYTR_CONFIG.merchant_key !== 'YOUR_MERCHANT_KEY' && hash !== expectedHash) {
        console.error('[PayTR Security Alert] Hash doğrulama başarısız! OID:', merchant_oid);
        return res.status(400).send('PAYTR notification failed: bad hash');
      }

      const orderRef = db.collection('orders').doc(merchant_oid);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        console.warn(`[PayTR Callback] Sipariş bulunamadı: ${merchant_oid}`);
        return res.status(404).send('Siparis bulunamadi');
      }

      if (status === 'success') {
        await orderRef.update({
          status: 'completed',
          totalAmountReceived: total_amount,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: 'PAID',
        });
        console.log(`[PayTR Success] Sipariş başarıyla ödendi: ${merchant_oid}`);
        return res.status(200).send('OK');
      } else {
        await orderRef.update({
          status: 'failed',
          failReason: failed_reason_code || 'Bilinmeyen hata',
          failMessage: failed_reason_msg || '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: 'FAILED',
        });
        console.log(`[PayTR Failed] Sipariş başarısız oldu: ${merchant_oid}, Sebep: ${failed_reason_msg}`);
        return res.status(200).send('OK');
      }
    } catch (error) {
      console.error('paytrCallback Error:', error);
      return res.status(500).send('Internal Server Error');
    }
  });

// ============================================
// 3. SİPARİŞ DURUMU SORGULAMA (HTTP REST Endpoint)
// ============================================
exports.getOrderStatus = functions
  .runWith({ timeoutSeconds: 10, memory: '128MB' })
  .https.onRequest((req, res) => {
    return cors(req, res, async () => {
      const orderId = req.query.orderId || req.body?.orderId;

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'orderId parametresi zorunludur.' });
      }

      try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
          return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
        }

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
        return res.status(500).json({ success: false, message: error.message });
      }
    });
  });

// ============================================
// 4. FIRESTORE TRIGGER: Sipariş Durumu Değişikliği
// ============================================
exports.onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status === after.status) return null;

    const { orderId } = context.params;
    console.log(`[Order Lifecycle] Sipariş ${orderId} durumu güncellendi: ${before.status} -> ${after.status}`);
    return null;
  });
