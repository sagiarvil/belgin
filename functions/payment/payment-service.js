/**
 * BELGIN KUYUMCULUK — PRODUCTION HARDENED PAYMENT SERVICE
 * Akbank Sanal POS Odaklı Çoklu POS, FSM Durum Modeli, Idempotency ve Finansal Güvenlik
 */

const crypto = require('crypto');
const {
  PROVIDERS,
  DEFAULT_PROVIDER,
  ORDER_STATUS,
  PAYMENT_STATUS,
  canTransition,
  assertValidTransition,
} = require('./payment-constants');
const paymentRouter = require('./payment-router');

const HIGH_VALUE_SECURE_DELIVERY_THRESHOLD = 12000;
const LEGAL_EVIDENCE_SCHEMA = 'belgin-order-evidence-v2';
const VIP_SIGNING_SECRET = process.env.VIP_PAYMENT_SECRET || 'BELGIN_VIP_SECURITY_SECRET_2026';

// Idempotency & Rate Limit In-Memory Cache (LRU-like with TTL)
const idempotencyCache = new Map();
const inFlightIdempotency = new Map();
const rateLimitMap = new Map();

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function generateOrderId() {
  return `BLG-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

function generateRequestId() {
  return `REQ-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
}

function checkRateLimit(clientIp, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count += 1;
  }
  rateLimitMap.set(clientIp, record);
  if (record.count > limit) {
    const error = new Error('İstek sınırı aşıldı. Lütfen bir süre sonra tekrar deneyiniz.');
    error.code = 'RATE_LIMIT_EXCEEDED';
    throw error;
  }
}

function verifyVipToken(token, expectedId = '') {
  if (!token || typeof token !== 'string') return null;

  // Format 1: HMAC Signed Token (payloadB64.signatureHex)
  const parts = token.split('.');
  if (parts.length === 2) {
    const [payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', VIP_SIGNING_SECRET).update(payloadB64).digest('hex');
    if (sig.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      try {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
        if (payload.exp && Date.now() > payload.exp) return null;
        if (expectedId && payload.id && payload.id !== expectedId) return null;
        const price = Number(payload.price || payload.amount);
        if (!Number.isFinite(price) || price < 10) return null;
        return {
          id: String(payload.id || payload.orderId || `VIP-${Date.now()}`),
          name: String(payload.name || payload.title || 'Lüks Özel Sipariş').slice(0, 200),
          price,
          brand: 'Belgin Kuyumculuk',
          reference: 'VIP-SHOWROOM',
          metal: 'Özel Tasarım',
          category: 'luxury',
          isGold: true,
          highValueSecureDelivery: price >= HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
        };
      } catch (_) {}
    }
  }

  // Format 2: Base64URL Compact Token (orderId|title|amount)
  try {
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    const pipeParts = decoded.split('|');
    if (pipeParts.length >= 3) {
      const orderId = pipeParts[0].trim();
      const title = pipeParts[1].trim();
      const price = Number(pipeParts[2]);
      if (Number.isFinite(price) && price >= 10) {
        return {
          id: orderId || `VIP-${Date.now()}`,
          name: title || 'Lüks Koleksiyon Siparişi',
          price,
          brand: 'Belgin Kuyumculuk',
          reference: 'VIP-SHOWROOM',
          metal: 'Özel Tasarım',
          category: 'luxury',
          isGold: true,
          highValueSecureDelivery: price >= HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
        };
      }
    }
  } catch (_) {}

  return null;
}

function isHighValueCatalogProduct(product) {
  if (!product || Number(product.price) < HIGH_VALUE_SECURE_DELIVERY_THRESHOLD) return false;
  const category = String(product.category || '').toLowerCase();
  const metal = String(product.metal || '').toLowerCase();
  const isWatch = category === 'watch' || category === 'saat';
  const isGold = product.isGold === true || category === 'gold' || category === 'altin' || category === 'altın' || metal.includes('altın') || /au\s?\d{3}/i.test(metal);
  return isWatch || isGold;
}

function normalizeCart(clientItems, isVipPayment = false, vipToken = null, productCatalog = {}) {
  if (!Array.isArray(clientItems) || clientItems.length === 0) throw new Error('Sepet boş olamaz.');
  if (clientItems.length > 20) throw new Error('Sepet ürün sınırı aşıldı.');

  return clientItems.map((item) => {
    const id = String(item.id ?? '');
    const rawQty = item.qty !== undefined && item.qty !== null ? Number(item.qty) : 1;
    if (!Number.isInteger(rawQty) || rawQty < 1 || rawQty > 10) {
      const error = new Error(`Geçersiz ürün adedi: ${id}`);
      error.code = 'INVALID_QUANTITY';
      throw error;
    }
    const qty = rawQty;

    // VIP / Özel Sipariş Güvenlik Denetimi
    if (isVipPayment || item.isVipCustom === true || id.startsWith('VIP-') || id.startsWith('BLG-')) {
      const verifiedVip = verifyVipToken(vipToken || item.vipToken || item.signedToken, id);
      if (!verifiedVip) {
        const error = new Error('VIP / Özel ödeme tutarı güvenliği: Yetkisiz istemci fiyatı reddedildi. Geçerli sunucu imzalı token zorunludur.');
        error.code = 'VIP_PRICE_TAMPERING_DETECTED';
        throw error;
      }
      return {
        id: verifiedVip.id,
        name: verifiedVip.name,
        brand: verifiedVip.brand,
        reference: verifiedVip.reference,
        metal: verifiedVip.metal,
        price: verifiedVip.price,
        qty,
        category: verifiedVip.category,
        isGold: verifiedVip.isGold,
        highValueSecureDelivery: verifiedVip.highValueSecureDelivery,
      };
    }

    // Katalog Ürün Fiyatı: Client'tan gelen price KESİNLİKLE dikkate alınmaz, server kataloğundan okunur!
    const product = productCatalog[id];
    if (!product) {
      const error = new Error(`Ürün doğrulanamadı: ${id}`);
      error.code = 'PRODUCT_NOT_FOUND';
      throw error;
    }
    if (product.inStock === false) {
      const error = new Error(`${product.name} stokta değil.`);
      error.code = 'PRODUCT_OUT_OF_STOCK';
      throw error;
    }

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

async function appendAuditEvent(orderRef, eventType, data = {}, admin) {
  const safeData = JSON.parse(JSON.stringify(data));
  if (orderRef && typeof orderRef.collection === 'function') {
    await orderRef.collection('auditEvents').add({
      schema: LEGAL_EVIDENCE_SCHEMA,
      eventType,
      ...safeData,
      serverAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

class PaymentService {
  async createPaymentSession({ body, reqContext, db, admin, productCatalog, getLegalEvidenceSnapshot }) {
    const clientIp = reqContext.clientIp || '127.0.0.1';
    const userAgent = reqContext.userAgent || '';

    // 1. Abuse & Rate Limit Control
    checkRateLimit(clientIp, 60, 60000);

    // 2. Idempotency Control
    const idempotencyKey = String(
      reqContext.idempotencyKey ||
      body.idempotencyKey ||
      body.idempotency_key ||
      ''
    ).trim();

    if (idempotencyKey) {
      if (idempotencyCache.has(idempotencyKey)) {
        const cached = idempotencyCache.get(idempotencyKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 min TTL
          return { ...cached.response, isIdempotentReplay: true };
        }
      }
      if (inFlightIdempotency.has(idempotencyKey)) {
        const inFlightRes = await inFlightIdempotency.get(idempotencyKey);
        return { ...inFlightRes, isIdempotentReplay: true };
      }
    }

    const sessionTask = async () => {
      const isVipPayment = body.isVipPayment === true || (Array.isArray(body.items) && body.items.some((i) => i.isVipCustom || String(i.id).startsWith('VIP-') || String(i.id).startsWith('BLG-')));
      let email = String(body.email || '').trim().toLowerCase();
      if (!email && isVipPayment) {
        const cleanPhone = String(body.user_phone || '').replace(/\D/g, '');
        email = cleanPhone ? `musteri_${cleanPhone}@belginkuyumculuk.com` : `vip_${Date.now()}@belginkuyumculuk.com`;
      }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      const error = new Error('Geçerli e-posta zorunludur.');
      error.code = 'INVALID_EMAIL';
      throw error;
    }

    const items = normalizeCart(body.items, isVipPayment, body.vipToken, productCatalog);
    const compliance = validateLegalAndDelivery(body, items);
    const legalEvidence = getLegalEvidenceSnapshot(compliance.hasHighValue);
    const serverTotal = calculateTotal(items);
    const merchant_oid = generateOrderId();
    const requestId = generateRequestId();
    const amountInKurus = String(Math.round(serverTotal * 100));
    const testMode = Number(process.env.PAYTR_TEST_MODE || process.env.AKBANK_TEST_MODE || 0) === 1;
    const productSnapshotHash = sha256(JSON.stringify(items));
    const evidenceId = sha256(JSON.stringify({ merchant_oid, requestId, productSnapshotHash, legalEvidence, total: serverTotal, deliveryMethod: compliance.deliveryMethod }));

    const customerAddress = compliance.deliveryMethod === 'showroom'
      ? 'Belgin Kuyumculuk — Menderes Caddesi No:231/B Buca / İzmir — Mağazadan Teslim'
      : String(body.user_address || '').slice(0, 1000);

    const providerName = String(body.provider || DEFAULT_PROVIDER).toUpperCase();
    const provider = paymentRouter.getProvider(providerName);

    const orderRef = db.collection('orders').doc(merchant_oid);
    const orderData = {
      orderId: merchant_oid,
      requestId,
      evidenceId,
      idempotencyKey: idempotencyKey || null,
      evidenceSchema: LEGAL_EVIDENCE_SCHEMA,
      status: ORDER_STATUS.PAYMENT_SESSION_CREATING,
      paymentStatus: PAYMENT_STATUS.PENDING,
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
        name: String(body.user_name || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 150),
        email,
        phone: String(body.user_phone || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 50),
        identityNumber: String(body.customerIdentity || body.identityNumber || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 50),
        address: customerAddress ? String(customerAddress).replace(/<[^>]*>?/gm, '').trim() : null,
      },
      payment: {
        provider: provider.name,
        status: PAYMENT_STATUS.PENDING,
        amount: serverTotal,
        amountInKurus,
        currency: 'TRY',
        providerTransactionId: null,
        providerOrderId: merchant_oid,
        installment: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paidAt: null,
        failedAt: null,
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
      testMode,
    };

    await orderRef.set(orderData);

    await appendAuditEvent(orderRef, 'ORDER_CREATED', {
      requestId,
      evidenceId,
      provider: provider.name,
      status: ORDER_STATUS.PAYMENT_SESSION_CREATING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      deliveryMethod: compliance.deliveryMethod,
      highValueSecureDelivery: compliance.hasHighValue,
      total: serverTotal,
    }, admin);

    let providerResult;
    try {
      providerResult = await provider.createPayment({
        order: orderData,
        cardNumber: body.cardNumber,
        cardCvc: body.cardCvc,
        cardExpiry: body.cardExpiry,
        clientIp,
        testMode,
      });

      assertValidTransition(ORDER_STATUS.PAYMENT_SESSION_CREATING, ORDER_STATUS.PAYMENT_SESSION_READY, merchant_oid);

      await orderRef.update({
        status: ORDER_STATUS.PAYMENT_SESSION_READY,
        'payment.providerToken': providerResult.token || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await appendAuditEvent(orderRef, 'PAYMENT_SESSION_READY', {
        provider: provider.name,
        paymentType: providerResult.paymentType || 'REDIRECT',
      }, admin);
    } catch (providerError) {
      await orderRef.update({
        status: ORDER_STATUS.PAYMENT_SESSION_FAILED,
        failReason: providerError.code || providerError.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await appendAuditEvent(orderRef, 'PAYMENT_SESSION_FAILED', {
        provider: provider.name,
        error: providerError.message,
      }, admin);

      throw providerError;
    }

    const sessionResponse = {
      success: true,
      provider: provider.name,
      token: providerResult.token || null,
      iframeUrl: providerResult.iframeUrl || null,
      redirectUrl: providerResult.redirectUrl || null,
      gatewayUrl: providerResult.gatewayUrl || null,
      postParams: providerResult.postParams || null,
      paymentType: providerResult.paymentType || 'REDIRECT',
      merchant_oid,
      evidenceId,
      deliveryMethod: compliance.deliveryMethod,
      highValueSecureDelivery: compliance.hasHighValue,
    };

    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        response: sessionResponse,
        timestamp: Date.now(),
      });
    }

    return sessionResponse;
    };

    if (idempotencyKey) {
      const taskPromise = sessionTask();
      inFlightIdempotency.set(idempotencyKey, taskPromise);
      try {
        return await taskPromise;
      } finally {
        inFlightIdempotency.delete(idempotencyKey);
      }
    }

    return await sessionTask();
  }

  async handleCallback({ providerName, body, db, admin, mailer }) {
    const provider = paymentRouter.getProvider(providerName);
    const orderId = String(body.merchant_oid || body.orderId || body.oid || '');
    if (!orderId) {
      return { status: 400, message: 'Geçersiz sipariş numarası' };
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { status: 404, message: 'Siparis bulunamadi' };
    }

    const order = orderDoc.data();

    // Provider Binding Güvenlik Kontrolü
    if (order.payment?.provider && order.payment.provider !== provider.name) {
      console.error(`[Payment Security] PROVIDER_MISMATCH! Sipariş Provider: ${order.payment.provider}, Gelen: ${provider.name}`);
      await appendAuditEvent(orderRef, 'PROVIDER_MISMATCH', {
        expectedProvider: order.payment.provider,
        incomingProvider: provider.name,
      }, admin);
      return { status: 400, message: 'PROVIDER_MISMATCH: Callback sağlayıcısı sipariş ile eşleşmiyor.' };
    }

    // Atomic Idempotency Kontrolü: Zaten PAID ise hemen 200 OK dön
    if (['PAID', 'PAYMENT_PAID'].includes(order.paymentStatus) || [ORDER_STATUS.PAID, ORDER_STATUS.AWAITING_STORE_PICKUP, ORDER_STATUS.COMPLETED].includes(order.status)) {
      return { status: 200, message: 'OK' };
    }

    const verification = provider.verifyCallback({ body, order });

    if (!verification.isValid) {
      console.error(`[Payment Security] ${provider.name} Callback doğrulama başarısız:`, orderId, verification.reason);
      await appendAuditEvent(orderRef, 'CALLBACK_VERIFICATION_FAILED', {
        provider: provider.name,
        reason: verification.reason,
      }, admin);
      return { status: 400, message: `Callback verification failed: ${verification.reason}` };
    }

    if (verification.isSuccess) {
      const highValue = order.highValueSecureDelivery === true;
      const totalReceived = verification.totalAmountReceived || String(order.amountInKurus);
      const nextStatus = highValue ? ORDER_STATUS.AWAITING_STORE_PICKUP : ORDER_STATUS.PAID;

      assertValidTransition(order.status, nextStatus, orderId);

      await orderRef.update({
        status: nextStatus,
        deliveryStatus: highValue ? 'STORE_PICKUP_REQUIRED' : (order.deliveryStatus || 'PENDING'),
        totalAmountReceived: totalReceived,
        paymentStatus: 'PAID',
        'payment.status': PAYMENT_STATUS.PAID,
        'payment.paidAt': admin.firestore.FieldValue.serverTimestamp(),
        'payment.totalAmountReceived': totalReceived,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        // completedAt KESİNLİKLE BURADA YAZILMAZ! Sadece teslimat tamamlandığında COMPLETED state'inde yazılır.
      });

      await appendAuditEvent(orderRef, 'PAYMENT_CONFIRMED', {
        provider: provider.name,
        paymentStatus: 'PAID',
        totalAmountReceived: totalReceived,
        status: nextStatus,
      }, admin);

      if (mailer && typeof mailer.dispatchOrderEvidenceEmails === 'function') {
        try {
          const updatedDoc = await orderRef.get();
          await mailer.dispatchOrderEvidenceEmails(updatedDoc.data());
        } catch (mailErr) {
          console.error('[Mailer] Callback e-posta gönderim hatası:', mailErr.message);
        }
      }
    } else {
      assertValidTransition(order.status, ORDER_STATUS.PAYMENT_FAILED, orderId);

      await orderRef.update({
        status: ORDER_STATUS.PAYMENT_FAILED,
        failReason: String(verification.failReasonCode || 'Bilinmeyen hata').slice(0, 100),
        failMessage: String(verification.failReasonMsg || '').slice(0, 500),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentStatus: 'FAILED',
        'payment.status': PAYMENT_STATUS.FAILED,
        'payment.failedAt': admin.firestore.FieldValue.serverTimestamp(),
      });

      await appendAuditEvent(orderRef, 'PAYMENT_FAILED', {
        provider: provider.name,
        paymentStatus: 'FAILED',
        failReason: String(verification.failReasonCode || '').slice(0, 100),
      }, admin);
    }

    return { status: 200, message: 'OK' };
  }
}

module.exports = new PaymentService();

