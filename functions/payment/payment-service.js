/**
 * BELGIN KUYUMCULUK — UNIFIED PAYMENT SERVICE
 * Çoklu POS İş Mantığı, Doğrulama, Sipariş Kaydı ve Callback Yönetimi
 */

const crypto = require('crypto');
const { PROVIDERS, PAYMENT_STATUS, DEFAULT_PROVIDER } = require('./payment-constants');
const paymentRouter = require('./payment-router');

const HIGH_VALUE_SECURE_DELIVERY_THRESHOLD = 12000;
const LEGAL_EVIDENCE_SCHEMA = 'belgin-order-evidence-v2';

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
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

function normalizeCart(clientItems, isVipPayment = false, productCatalog = {}) {
  if (!Array.isArray(clientItems) || clientItems.length === 0) throw new Error('Sepet boş olamaz.');
  if (clientItems.length > 20) throw new Error('Sepet ürün sınırı aşıldı.');

  return clientItems.map((item) => {
    const id = String(item.id ?? '');
    const qty = Number(item.qty || 1);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error(`Geçersiz ürün adedi: ${id}`);

    if (isVipPayment || item.isVipCustom === true || id.startsWith('VIP-') || id.startsWith('BLG-')) {
      const price = Number(item.price);
      if (!Number.isFinite(price) || price < 10) throw new Error('Geçersiz VIP sipariş tutarı.');
      const name = String(item.name || 'Lüks Koleksiyon Siparişi').slice(0, 200).trim();
      const isHighValue = price >= HIGH_VALUE_SECURE_DELIVERY_THRESHOLD;
      return {
        id: id || `VIP-${Date.now()}`,
        name,
        brand: String(item.brand || 'Belgin Kuyumculuk').slice(0, 100),
        reference: String(item.reference || 'VIP-SHOWROOM').slice(0, 100),
        metal: String(item.metal || 'Lüks Özel Sipariş').slice(0, 100),
        price,
        qty,
        category: String(item.category || 'luxury').slice(0, 50),
        isGold: item.isGold === true,
        highValueSecureDelivery: isHighValue,
      };
    }

    const product = productCatalog[id];
    if (!product) throw new Error(`Ürün doğrulanamadı: ${id}`);
    if (product.inStock === false) throw new Error(`${product.name} stokta değil.`);

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
  await orderRef.collection('auditEvents').add({
    schema: LEGAL_EVIDENCE_SCHEMA,
    eventType,
    ...safeData,
    serverAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

class PaymentService {
  async createPaymentSession({ body, reqContext, db, admin, productCatalog, getLegalEvidenceSnapshot }) {
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

    const items = normalizeCart(body.items, isVipPayment, productCatalog);
    const compliance = validateLegalAndDelivery(body, items);
    const legalEvidence = getLegalEvidenceSnapshot(compliance.hasHighValue);
    const serverTotal = calculateTotal(items);
    const merchant_oid = generateOrderId();
    const requestId = generateRequestId();
    const clientIp = reqContext.clientIp || '127.0.0.1';
    const userAgent = reqContext.userAgent || '';
    const amountInKurus = String(Math.round(serverTotal * 100));
    const testMode = Number(process.env.PAYTR_TEST_MODE || 0) === 1;
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
        identityNumber: String(body.customerIdentity || body.identityNumber || '').trim().slice(0, 50),
        address: customerAddress,
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
      paymentStatus: 'PENDING',
      deliveryMethod: compliance.deliveryMethod,
      highValueSecureDelivery: compliance.hasHighValue,
      highValueThreshold: HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
      customerIdentity: String(body.customerIdentity || body.identityNumber || '').trim().slice(0, 50),
      productSnapshotHash,
      legalEvidence,
    }, admin);

    const providerResult = await provider.createPayment({
      order: orderData,
      clientIp,
      testMode,
    });

    await orderRef.update({
      status: 'token_created',
      'payment.providerToken': providerResult.token || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await appendAuditEvent(orderRef, 'PAYMENT_SESSION_INITIATED', {
      provider: provider.name,
      paymentType: providerResult.paymentType || 'IFRAME',
    }, admin);

    return {
      success: true,
      provider: provider.name,
      token: providerResult.token,
      iframeUrl: providerResult.iframeUrl || null,
      redirectUrl: providerResult.redirectUrl || null,
      paymentType: providerResult.paymentType || 'IFRAME',
      merchant_oid,
      evidenceId,
      deliveryMethod: compliance.deliveryMethod,
      highValueSecureDelivery: compliance.hasHighValue,
    };
  }

  async handleCallback({ providerName, body, db, admin, mailer }) {
    const provider = paymentRouter.getProvider(providerName);
    const orderId = String(body.merchant_oid || body.orderId || '');
    if (!orderId) {
      return { status: 400, message: 'Geçersiz sipariş numarası' };
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { status: 404, message: 'Siparis bulunamadi' };
    }

    const order = orderDoc.data();
    const verification = provider.verifyCallback({ body, order });

    if (!verification.isValid) {
      console.error(`[Payment Security] ${provider.name} Callback doğrulama başarısız:`, orderId, verification.reason);
      await appendAuditEvent(orderRef, 'CALLBACK_VERIFICATION_FAILED', {
        provider: provider.name,
        reason: verification.reason,
        details: verification,
      }, admin);
      return { status: 400, message: `Callback verification failed: ${verification.reason}` };
    }

    // Idempotency: Eğer zaten PAID ise tekrar işlem yapma
    if (['paid_awaiting_store_pickup', 'completed'].includes(order.status) && order.paymentStatus === 'PAID') {
      return { status: 200, message: 'OK' };
    }

    if (verification.isSuccess) {
      const highValue = order.highValueSecureDelivery === true;
      const totalReceived = verification.totalAmountReceived || String(order.amountInKurus);

      await orderRef.update({
        status: highValue ? 'paid_awaiting_store_pickup' : 'completed',
        deliveryStatus: highValue ? 'STORE_PICKUP_REQUIRED' : (order.deliveryStatus || 'PENDING'),
        totalAmountReceived: totalReceived,
        paymentConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentStatus: 'PAID',
        'payment.status': PAYMENT_STATUS.PAID,
        'payment.paidAt': admin.firestore.FieldValue.serverTimestamp(),
        'payment.totalAmountReceived': totalReceived,
      });

      await appendAuditEvent(orderRef, 'PAYMENT_CONFIRMED', {
        provider: provider.name,
        paymentStatus: 'PAID',
        totalAmountReceived: totalReceived,
        nextDeliveryStatus: highValue ? 'STORE_PICKUP_REQUIRED' : (order.deliveryStatus || 'PENDING'),
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
      await orderRef.update({
        status: 'failed',
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
