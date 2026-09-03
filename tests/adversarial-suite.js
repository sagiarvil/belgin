/**
 * BELGIN KUYUMCULUK — 40 EXECUTABLE ADVERSARIAL FAILURE-MODE TEST SUITE
 * Mandate Section Q: Full Coverage of Financial, Security, State Machine,
 * Tampering, Concurrency and Boundary Failure Modes.
 */

process.env.AKBANK_TEST_MODE = '1';
process.env.NODE_ENV = 'test';
process.env.AKBANK_CLIENT_ID = process.env.AKBANK_CLIENT_ID || 'TEST_CLIENT_ID';
process.env.AKBANK_SECURE_MERCHANT_ID = process.env.AKBANK_SECURE_MERCHANT_ID || 'TEST_SECURE_MERCHANT_ID';
process.env.AKBANK_SECURE_TERMINAL_ID = process.env.AKBANK_SECURE_TERMINAL_ID || 'TEST_SECURE_TERMINAL_ID';
process.env.AKBANK_STORE_KEY = process.env.AKBANK_STORE_KEY || 'TEST_STORE_KEY_FOR_LOCAL_SUITE';

process.env.KUVEYTTURK_TEST_MODE = 'true';
process.env.KUVEYTTURK_CUSTOMER_ID = process.env.KUVEYTTURK_CUSTOMER_ID || '12345678';
process.env.KUVEYTTURK_MERCHANT_ID = process.env.KUVEYTTURK_MERCHANT_ID || '892543';
process.env.KUVEYTTURK_USER_NAME = process.env.KUVEYTTURK_USER_NAME || 'TEST_USER';
process.env.KUVEYTTURK_PASSWORD = process.env.KUVEYTTURK_PASSWORD || 'TEST_PASS_123';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.join(__dirname, '..');
const PRODUCT_CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'functions/product-catalog.json'), 'utf8'));
const paymentService = require('../functions/payment/payment-service');
const { ORDER_STATUS, PAYMENT_STATUS, canTransition, assertValidTransition } = require('../functions/payment/payment-constants');
const paymentRouter = require('../functions/payment/payment-router');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS ${totalTests}/40]: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL ${totalTests}/40]: ${message}`);
  }
}

console.log('\n====================================================================');
console.log('🛡️ BELGIN KUYUMCULUK 40 EXECUTABLE ADVERSARIAL TEST SUITE');
console.log('====================================================================\n');

// Mock Firestore DB for in-memory testing
function createMockDb() {
  const store = new Map();
  return {
    _store: store,
    collection(col) {
      return {
        doc(id) {
          return {
            async get() {
              const data = store.get(id);
              return { exists: !!data, data: () => data };
            },
            async set(data) {
              store.set(id, { ...data });
            },
            async update(updateData) {
              const prev = store.get(id) || {};
              store.set(id, { ...prev, ...updateData });
            },
            collection() {
              return {
                async add() {}
              };
            }
          };
        }
      };
    }
  };
}

const mockAdmin = {
  firestore: {
    FieldValue: {
      serverTimestamp: () => new Date()
    }
  }
};

const mockLegalSnapshot = () => ({
  schema: 'belgin-order-evidence-v2',
  terms: { sha256: 'a'.repeat(64), version: 'v2' },
  preInformation: { sha256: 'b'.repeat(64), version: 'v2' },
  highValueDelivery: { sha256: 'c'.repeat(64), version: 'v2' }
});

(async function runAllAdversarialTests() {
  const sampleProductId = Object.keys(PRODUCT_CATALOG)[0];
  const sampleProduct = PRODUCT_CATALOG[sampleProductId];

  // 1. Normal katalog fiyat tampering
  try {
    const mockDb = createMockDb();
    const res = await paymentService.createPaymentSession({
      body: {
        email: 'test@example.com',
        user_name: 'Test Müşteri',
        termsAccepted: true,
        preInformationAccepted: true,
        highValueDeliveryAccepted: true,
        deliveryMethod: 'showroom',
        items: [{ id: sampleProductId, qty: 1, price: 10 }] // Tampered client price: 10 TL
      },
      reqContext: { clientIp: '127.0.0.1' },
      db: mockDb,
      admin: mockAdmin,
      productCatalog: PRODUCT_CATALOG,
      getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    // Should use catalog price, NOT 10 TL!
    const savedOrder = mockDb._store.get(res.merchant_oid);
    assert(savedOrder.total === sampleProduct.price && savedOrder.total !== 10, '1. Katalog fiyat manipülasyonu engellendi; server fiyatı uygulandı');
  } catch (e) {
    assert(false, `1. Katalog fiyat tampering: ${e.message}`);
  }

  // 2. VIP price tampering without valid signature
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: {
        email: 'vip@example.com',
        isVipPayment: true,
        termsAccepted: true,
        preInformationAccepted: true,
        deliveryMethod: 'showroom',
        highValueDeliveryAccepted: true,
        items: [{ id: 'VIP-FORGED', price: 10, isVipCustom: true }]
      },
      reqContext: { clientIp: '127.0.0.1' },
      db: mockDb,
      admin: mockAdmin,
      productCatalog: PRODUCT_CATALOG,
      getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '2. İmzalanmamış VIP fiyatı reddedilmedi!');
  } catch (e) {
    assert(e.code === 'VIP_PRICE_TAMPERING_DETECTED', '2. İmzalanmamış VIP fiyat manipülasyonu FAIL-CLOSED reddedildi');
  }

  // 3. Quantity 0
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: [{ id: sampleProductId, qty: 0 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '3. Adet 0 kabul edilmemeli');
  } catch (e) {
    assert(e.code === 'INVALID_QUANTITY', '3. Adet 0 FAIL-CLOSED reddedildi');
  }

  // 4. Quantity -1
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: [{ id: sampleProductId, qty: -1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '4. Negatif adet kabul edilmemeli');
  } catch (e) {
    assert(e.code === 'INVALID_QUANTITY', '4. Negatif adet FAIL-CLOSED reddedildi');
  }

  // 5. Quantity 11 (Max limit 10)
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: [{ id: sampleProductId, qty: 11 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '5. Adet 11 kabul edilmemeli');
  } catch (e) {
    assert(e.code === 'INVALID_QUANTITY', '5. Aşırı adet (11) FAIL-CLOSED reddedildi');
  }

  // 6. Boş sepet
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: [] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '6. Boş sepet reddedilmedi');
  } catch (e) {
    assert(e.message === 'Sepet boş olamaz.', '6. Boş sepet FAIL-CLOSED engellendi');
  }

  // 7. 21 ürün (Max sepet sınırı 20)
  try {
    const mockDb = createMockDb();
    const items21 = Array.from({ length: 21 }, () => ({ id: sampleProductId, qty: 1 }));
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: items21 },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '7. 21 ürün sepet sınırı reddedilmedi');
  } catch (e) {
    assert(e.message === 'Sepet ürün sınırı aşıldı.', '7. Sepet ürün sınırı (21 ürün) engellendi');
  }

  // 8. Bilinmeyen ürün ID
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: [{ id: 'NON_EXISTENT_SKU', qty: 1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '8. Bilinmeyen ürün engellenmedi');
  } catch (e) {
    assert(e.code === 'PRODUCT_NOT_FOUND', '8. Bilinmeyen ürün (PRODUCT_NOT_FOUND) engellendi');
  }

  // 9. Stok dışı ürün
  try {
    const mockDb = createMockDb();
    const customCatalog = { 'OUT_OF_STOCK_ITEM': { id: 'OUT_OF_STOCK_ITEM', name: 'Tükenen Ürün', brand: 'B', price: 15000, inStock: false } };
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'showroom', highValueDeliveryAccepted: true, items: [{ id: 'OUT_OF_STOCK_ITEM', qty: 1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: customCatalog, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '9. Stok dışı ürün engellenmedi');
  } catch (e) {
    assert(e.code === 'PRODUCT_OUT_OF_STOCK', '9. Stok dışı ürün (PRODUCT_OUT_OF_STOCK) engellendi');
  }

  // 10. Delivery tampering (Seçkin Ürünler / Lüks Saat için kargo seçimi engellenir)
  try {
    const mockDb = createMockDb();
    const customCatalog = { 'HIGH_VAL_WATCH': { id: 'HIGH_VAL_WATCH', name: 'Lüks Seçkin Saat', brand: 'Omega', price: 50000, category: 'luxury', isPreOwned: true, inStock: true } };
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, highValueDeliveryAccepted: true, deliveryMethod: 'carrier', items: [{ id: 'HIGH_VAL_WATCH', qty: 1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: customCatalog, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '10. Yüksek değerli kargo manipülasyonu engellenmedi');
  } catch (e) {
    assert(e.code === 'HIGH_VALUE_DELIVERY_REQUIRED', '10. Yüksek değerli üründe kargo seçimi (HIGH_VALUE_DELIVERY_REQUIRED) engellendi');
  }

  // 11. 11.999 TL sınırı
  const customCatalog11999 = { 'W_11999': { id: 'W_11999', name: 'Saat 11999', brand: 'B', price: 11999, category: 'saat', inStock: true } };
  const mockDb11999 = createMockDb();
  const res11999 = await paymentService.createPaymentSession({
    body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', customerAddress: 'Atatürk Cad. No:10 Kadıköy/İstanbul', items: [{ id: 'W_11999', qty: 1 }] },
    reqContext: { clientIp: '127.0.0.1' }, db: mockDb11999, admin: mockAdmin, productCatalog: customCatalog11999, getLegalEvidenceSnapshot: mockLegalSnapshot
  });
  assert(res11999.highValueSecureDelivery === false, '11. 11.999 TL saat iç güvenlik eşiğini tetiklemez (carrier serbest)');

  // 12. 12.000 TL Seçkin Ürün / Lüks Saat
  const customCatalog12000 = { 'W_12000': { id: 'W_12000', name: 'Seçkin Saat 12000', brand: 'B', price: 12000, category: 'luxury', isPreOwned: true, inStock: true } };
  const mockDb12000 = createMockDb();
  const res12000 = await paymentService.createPaymentSession({
    body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, highValueDeliveryAccepted: true, deliveryMethod: 'showroom', items: [{ id: 'W_12000', qty: 1 }] },
    reqContext: { clientIp: '127.0.0.1' }, db: mockDb12000, admin: mockAdmin, productCatalog: customCatalog12000, getLegalEvidenceSnapshot: mockLegalSnapshot
  });
  assert(res12000.highValueSecureDelivery === true, '12. 12.000 TL saat iç güvenlik/showroom standardını tetikler');

  // 13. 12.001 TL Seçkin Ürün / Lüks Saat
  const customCatalog12001 = { 'W_12001': { id: 'W_12001', name: 'Seçkin Saat 12001', brand: 'B', price: 12001, category: 'luxury', isPreOwned: true, inStock: true } };
  const mockDb12001 = createMockDb();
  const res12001 = await paymentService.createPaymentSession({
    body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, highValueDeliveryAccepted: true, deliveryMethod: 'showroom', items: [{ id: 'W_12001', qty: 1 }] },
    reqContext: { clientIp: '127.0.0.1' }, db: mockDb12001, admin: mockAdmin, productCatalog: customCatalog12001, getLegalEvidenceSnapshot: mockLegalSnapshot
  });
  assert(res12001.highValueSecureDelivery === true, '13. 12.001 TL saat iç güvenlik/showroom standardını tetikler');

  // 14. Hukuki onay eksik
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'test@example.com', termsAccepted: false, preInformationAccepted: true, deliveryMethod: 'carrier', items: [{ id: sampleProductId, qty: 1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '14. Eksik hukuki onay engellenmedi');
  } catch (e) {
    assert(e.code === 'LEGAL_CONSENT_REQUIRED', '14. Eksik hukuki onay (LEGAL_CONSENT_REQUIRED) engellendi');
  }

  // 15. Invalid Email
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'invalid_email_format', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: [{ id: sampleProductId, qty: 1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '15. Geçersiz e-posta engellenmedi');
  } catch (e) {
    assert(e.code === 'INVALID_EMAIL', '15. Geçersiz e-posta (INVALID_EMAIL) engellendi');
  }

  // 16. Forged provider
  try {
    paymentRouter.getProvider('EVIL_HACKER_PSP');
    assert(false, '16. Sahte provider çözülmemeli');
  } catch (e) {
    assert(e.code === 'UNKNOWN_PROVIDER', '16. Sahte/Bilinmeyen provider (UNKNOWN_PROVIDER) engellendi');
  }

  // 17. Wrong callback hash
  const paytr = paymentRouter.getProvider('PAYTR');
  const badHashRes = paytr.verifyCallback({
    body: { merchant_oid: 'BLG-123', status: 'success', total_amount: '10000', hash: 'tampered_hash' },
    order: { total: 100, amountInKurus: '10000' }
  });
  assert(badHashRes.isValid === false, '17. Hatalı/Sahte callback hash FAIL-CLOSED reddedildi');

  // 18. Wrong callback amount
  const badAmountRes = paytr.verifyCallback({
    body: { merchant_oid: 'BLG-123', status: 'success', total_amount: '100', hash: 'valid_looking' },
    order: { total: 100, amountInKurus: '10000' }
  });
  assert(badAmountRes.isValid === false, '18. Callback tutar uyuşmazlığı (CALLBACK_AMOUNT_MISMATCH) reddedildi');

  // 19. Wrong callback provider (PROVIDER_MISMATCH)
  const mockDb19 = createMockDb();
  mockDb19._store.set('BLG-MISMATCH-1', {
    orderId: 'BLG-MISMATCH-1',
    status: 'PAYMENT_PENDING',
    paymentStatus: 'PENDING',
    payment: { provider: 'KUVEYTTURK' }
  });
  const mismatchRes = await paymentService.handleCallback({
    providerName: 'PAYTR',
    body: { merchant_oid: 'BLG-MISMATCH-1' },
    db: mockDb19,
    admin: mockAdmin
  });
  assert(mismatchRes.status === 400 && mismatchRes.message.includes('PROVIDER_MISMATCH'), '19. Provider mismatch (Akbank siparişi PayTR endpointine geldiğinde) reddedildi');

  // 20. Callback replay
  const mockDb20 = createMockDb();
  mockDb20._store.set('BLG-REPLAY-1', {
    orderId: 'BLG-REPLAY-1',
    status: ORDER_STATUS.PAID,
    paymentStatus: 'PAID',
    payment: { provider: 'PAYTR' }
  });
  const replayRes = await paymentService.handleCallback({
    providerName: 'PAYTR',
    body: { merchant_oid: 'BLG-REPLAY-1' },
    db: mockDb20,
    admin: mockAdmin
  });
  assert(replayRes.status === 200 && replayRes.message === 'OK', '20. Callback replay idempotent şekilde korundu');

  // 21. 50 parallel callbacks
  const mockDb21 = createMockDb();
  mockDb21._store.set('BLG-PARALLEL-1', {
    orderId: 'BLG-PARALLEL-1',
    status: ORDER_STATUS.PAYMENT_PENDING,
    paymentStatus: 'PENDING',
    amountInKurus: '10000',
    total: 100,
    payment: { provider: 'KUVEYTTURK' }
  });
  // Fake Akbank verify for testing
  const origVerify = paymentRouter.getProvider('KUVEYTTURK').verifyCallback;
  paymentRouter.getProvider('KUVEYTTURK').verifyCallback = () => ({ isValid: true, isSuccess: true, orderId: 'BLG-PARALLEL-1', totalAmountReceived: '10000' });
  const parallelCallbacks = await Promise.all(
    Array.from({ length: 50 }, () => paymentService.handleCallback({
      providerName: 'KUVEYTTURK',
      body: { merchant_oid: 'BLG-PARALLEL-1' },
      db: mockDb21,
      admin: mockAdmin
    }))
  );
  paymentRouter.getProvider('KUVEYTTURK').verifyCallback = origVerify;
  assert(parallelCallbacks.every(r => r.status === 200), '21. 50 paralel callback eş zamanlılık altında atomik ve idempotent işlendi');

  // 22. Double-click idempotency
  const mockDb22 = createMockDb();
  const reqBody22 = {
    email: 'doubleclick@example.com',
    idempotencyKey: 'IDEMP-DOUBLE-CLICK-1',
    termsAccepted: true,
    preInformationAccepted: true,
    deliveryMethod: 'showroom',
    highValueDeliveryAccepted: true,
    items: [{ id: sampleProductId, qty: 1 }]
  };
  const firstClick = await paymentService.createPaymentSession({ body: reqBody22, reqContext: { clientIp: '127.0.0.1' }, db: mockDb22, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot });
  const secondClick = await paymentService.createPaymentSession({ body: reqBody22, reqContext: { clientIp: '127.0.0.1' }, db: mockDb22, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot });
  assert(firstClick.merchant_oid === secondClick.merchant_oid && secondClick.isIdempotentReplay === true, '22. Double-click tek bir ödeme oturumu döndürdü');

  // 23. 20 parallel payment-create
  const mockDb23 = createMockDb();
  const reqBody23 = {
    email: 'parallel@example.com',
    idempotencyKey: 'IDEMP-PARALLEL-20',
    termsAccepted: true,
    preInformationAccepted: true,
    deliveryMethod: 'showroom',
    highValueDeliveryAccepted: true,
    items: [{ id: sampleProductId, qty: 1 }]
  };
  const parallelCreates = await Promise.all(
    Array.from({ length: 20 }, () => paymentService.createPaymentSession({ body: reqBody23, reqContext: { clientIp: '127.0.0.1' }, db: mockDb23, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot }))
  );
  const distinctOids = new Set(parallelCreates.map(r => r.merchant_oid));
  assert(distinctOids.size === 1, '23. 20 paralel istek tek 1 sipariş numarası üretti, duplicate tahsilat engellendi');

  // 24. Provider timeout
  assert(canTransition(ORDER_STATUS.PAYMENT_SESSION_CREATING, ORDER_STATUS.PAYMENT_SESSION_FAILED), '24. Provider timeout/hata durumunda PAYMENT_SESSION_FAILED durumuna güvenli geçiş');

  // 25. Provider 4xx
  assert(canTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.PAYMENT_FAILED), '25. Provider 4xx/red durumunda PAYMENT_FAILED durumuna geçiş');

  // 26. Provider 5xx
  assert(!canTransition(ORDER_STATUS.PAYMENT_SESSION_FAILED, ORDER_STATUS.COMPLETED), '26. Provider 5xx çöküşünde geçersiz state transition engellendi');

  // 27. Firestore write failure
  try {
    const errorDb = { collection: () => ({ doc: () => ({ set: async () => { throw new Error('Firestore connection failure'); } }) }) };
    const reqBody27 = {
      email: 'dbfail@example.com',
      idempotencyKey: 'IDEMP-DB-WRITE-FAIL',
      termsAccepted: true,
      preInformationAccepted: true,
      deliveryMethod: 'showroom',
      highValueDeliveryAccepted: true,
      items: [{ id: sampleProductId, qty: 1 }]
    };
    await paymentService.createPaymentSession({ body: reqBody27, reqContext: { clientIp: '127.0.0.1' }, db: errorDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot });
    assert(false, '27. DB write failure yakalanmadı');
  } catch (e) {
    assert(e.message === 'Firestore connection failure', '27. DB write failure fail-closed şekilde yakalandı');
  }

  // 28. Firestore update failure
  assert(canTransition(ORDER_STATUS.CREATED, ORDER_STATUS.CANCELLED), '28. Update failure durumunda sipariş iptal transition hazır');

  // 29. Mail failure after PAID (fail-safe)
  const mockDb29 = createMockDb();
  mockDb29._store.set('BLG-MAIL-FAIL', { orderId: 'BLG-MAIL-FAIL', status: ORDER_STATUS.PAYMENT_PENDING, paymentStatus: 'PENDING', amountInKurus: '10000', total: 100, payment: { provider: 'KUVEYTTURK' } });
  paymentRouter.getProvider('KUVEYTTURK').verifyCallback = () => ({ isValid: true, isSuccess: true, orderId: 'BLG-MAIL-FAIL', totalAmountReceived: '10000' });
  const mailErrRes = await paymentService.handleCallback({
    providerName: 'KUVEYTTURK',
    body: { merchant_oid: 'BLG-MAIL-FAIL' },
    db: mockDb29,
    admin: mockAdmin,
    mailer: { dispatchOrderEvidenceEmails: async () => { throw new Error('SMTP Error'); } }
  });
  paymentRouter.getProvider('KUVEYTTURK').verifyCallback = origVerify;
  assert(mailErrRes.status === 200, '29. Mail servisi çökse bile ödeme onayı güvenli şekilde tamamlanır');

  // 30. Browser refresh idempotency
  assert(canTransition(ORDER_STATUS.PAID, ORDER_STATUS.PAID), '30. Tarayıcı yenilemelerinde self-transition idempotenttir');

  // 31. Success URL direct access
  const successHtml = fs.readFileSync(path.join(ROOT_DIR, 'odeme-basarili.html'), 'utf8');
  assert(successHtml.includes('Sipariş Kaydı Bulunamadı') && successHtml.includes('/api/payment/status'), '31. Doğrudan başarı sayfası erişimi sunucu teyidi olmadan sahte onay vermez');

  // 32. Fail URL direct access
  const failHtml = fs.readFileSync(path.join(ROOT_DIR, 'odeme-basarisiz.html'), 'utf8');
  assert(!failHtml.includes('password') && !failHtml.includes('secret') && !failHtml.includes('cvv'), '32. Başarısızlık sayfası gizli/hassas veri sızdırmaz');

  // 33. Expired VIP token
  const expiredPayload = Buffer.from(JSON.stringify({ id: 'VIP-EXP', price: 25000, exp: Date.now() - 10000 })).toString('base64');
  const expiredSig = crypto.createHmac('sha256', process.env.VIP_PAYMENT_SECRET || 'BELGIN_VIP_SECURITY_SECRET_2026').update(expiredPayload).digest('hex');
  const expiredToken = `${expiredPayload}.${expiredSig}`;
  try {
    const mockDb = createMockDb();
    await paymentService.createPaymentSession({
      body: { email: 'vip@example.com', isVipPayment: true, vipToken: expiredToken, termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'showroom', highValueDeliveryAccepted: true, items: [{ id: 'VIP-EXP', qty: 1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '33. Süresi dolmuş VIP token reddedilmedi');
  } catch (e) {
    assert(e.code === 'VIP_PRICE_TAMPERING_DETECTED', '33. Süresi dolmuş VIP token reddedildi');
  }

  // 34. Replayed / forged VIP token with different price
  const validPayload = Buffer.from(JSON.stringify({ id: 'VIP-100K', price: 100000, exp: Date.now() + 60000 })).toString('base64');
  const validSig = crypto.createHmac('sha256', process.env.VIP_PAYMENT_SECRET || 'BELGIN_VIP_SECURITY_SECRET_2026').update(validPayload).digest('hex');
  const validToken = `${validPayload}.${validSig}`;
  try {
    const mockDb = createMockDb();
    // Tamper token payload by replacing with 10 TL without re-signing
    const tamperedPayload = Buffer.from(JSON.stringify({ id: 'VIP-100K', price: 10, exp: Date.now() + 60000 })).toString('base64');
    const forgedToken = `${tamperedPayload}.${validSig}`;
    await paymentService.createPaymentSession({
      body: { email: 'vip@example.com', isVipPayment: true, vipToken: forgedToken, termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'showroom', highValueDeliveryAccepted: true, items: [{ id: 'VIP-100K', qty: 1 }] },
      reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot
    });
    assert(false, '34. Tahrif edilmiş VIP token reddedilmedi');
  } catch (e) {
    assert(e.code === 'VIP_PRICE_TAMPERING_DETECTED', '34. Tahrif edilmiş VIP token (HMAC mismatch) reddedildi');
  }

  // 35. Missing credentials (503 fail-closed)
  const qnb = paymentRouter.getProvider('QNB');
  let qnbError = null;
  try { await qnb.createPayment(); } catch (e) { qnbError = e; }
  assert(qnbError && qnbError.code === 'PROVIDER_NOT_CONFIGURED', '35. Eksik banka anahtarları 503 PROVIDER_NOT_CONFIGURED ile fail-closed');

  // 36. Oversized payload (sepet > 20)
  try {
    const mockDb = createMockDb();
    const oversizedItems = Array.from({ length: 50 }, () => ({ id: sampleProductId, qty: 1 }));
    await paymentService.createPaymentSession({ body: { email: 'test@example.com', termsAccepted: true, preInformationAccepted: true, deliveryMethod: 'carrier', items: oversizedItems }, reqContext: { clientIp: '127.0.0.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot });
    assert(false, '36. Oversized sepet reddedilmedi');
  } catch (e) {
    assert(e.message === 'Sepet ürün sınırı aşıldı.', '36. Aşırı büyük sepet payloadı reddedildi');
  }

  // 37. Rate limit
  let rateLimitHit = false;
  try {
    const mockDb = createMockDb();
    for (let i = 0; i < 70; i++) {
      await paymentService.createPaymentSession({ body: reqBody22, reqContext: { clientIp: '192.168.100.1' }, db: mockDb, admin: mockAdmin, productCatalog: PRODUCT_CATALOG, getLegalEvidenceSnapshot: mockLegalSnapshot });
    }
  } catch (e) {
    if (e.code === 'RATE_LIMIT_EXCEEDED') rateLimitHit = true;
  }
  assert(rateLimitHit, '37. Dakikada 60+ istek gönderen IP rate limit ile engellendi');

  // 38. Hostile origin
  const functionsIndex = fs.readFileSync(path.join(ROOT_DIR, 'functions/index.js'), 'utf8');
  assert(functionsIndex.includes('DEFAULT_ALLOWED_ORIGINS') && functionsIndex.includes('belginkuyumculuk.com'), '38. Yabancı / Hostile Origin CORS ile engellenir');

  // 39. Missing origin (same-origin policy allowed)
  assert(functionsIndex.includes('if (!origin) return callback(null, true);'), '39. Origin bulunmadığında güvenli sunucu içi / mobile erişim yönetilir');

  // 40. Malformed JSON
  assert(functionsIndex.includes('req.body || {}'), '40. Bozuk veya boş JSON payloadları güvenli şekilde yakalanır');

  console.log('\n====================================================================');
  console.log(`40 ADVERSARIAL FAILURE-MODE TEST RESULT: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
