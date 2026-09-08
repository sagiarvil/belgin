'use strict';

const {
  sha256,
  maskTCKN,
  maskName,
  CUSTOMER_KYC_ENGINE,
  CONNECTED_TRANSACTION_ENGINE,
  PRODUCT_STOCK_ENGINE,
  INVOICE_ENGINE,
  DELIVERY_ENGINE,
  ACCOUNTING_RECON_ENGINE,
  REFUND_BUYBACK_ENGINE,
  SANCTIONS_SCREENING_ENGINE,
  AML_RISK_ENGINE,
  EVIDENCE_PROVENANCE_ENGINE,
  HASH_AND_TIMESTAMP_ENGINE,
  RETENTION_AND_ACCESS_CONTROL,
} = require('./shared-core');
const { getComplianceConfig } = require('./compliance-config');
const { renderCashDossier } = require('./canonical-documents');

/**
 * CASH STATE TRANSITIONS
 */
const CASH_STATES = [
  'DRAFT',
  'CASH_LIMIT_CHECK',
  'KYC_RISK_CHECK',
  'CASH_RECEIVED',
  'INVOICE_VERIFIED',
  'STOCK_VERIFIED',
  'DELIVERY_READY',
  'DELIVERED',
  'CASH_ACCOUNTING_RECONCILED',
  'ARCHIVED',
  'BANK_REQUIRED', // CASH_BLOCKED durumu
  'REVIEW_HOLD',
];

/**
 * İmzalı Nakit Beyanı Standart Metni Oluşturucu (Bölüm 18)
 */
function generateCashDeclarationText(params = {}) {
  const buyerName = params.buyerName || '................................';
  const buyerTckn = params.buyerTckn ? maskTCKN(params.buyerTckn) : '................................';
  const phone = params.phone || '................................';
  const profession = params.profession || '................................';
  const address = params.address || '................................';
  const amountStr = params.amountStr || (params.amount ? `${Number(params.amount).toLocaleString('tr-TR')} TL` : '................ TL');
  const orderRef = params.orderRef || params.orderId || '........';
  const invoiceNo = params.invoiceNo || '................';
  const dateStr = params.dateStr || new Date().toLocaleString('tr-TR');

  return {
    title: 'NAKİT TAHSİLAT VE MAĞAZA TESLİMAT BEYANNAMESİ',
    legalNotice: 'HMK m. 193-200, VUK m. 227-232, 5549 s. MASAK Kanunu ve 6502 s. TKHK m. 15/1-a uyarınca yasal delil beyanıdır.',
    declarationText: `Siparişe konu altın ürünlerini mağazada görerek ve kontrol ederek eksiksiz teslim aldım. Satış bedelini nakden ödedim; işlem bana/temsil ettiğim şirkete aittir.`,
    fields: {
      buyerName,
      phone,
      profession,
      address,
      buyerTckn,
      amountStr,
      orderRef,
      invoiceNo,
      dateStr,
    },
    signatureBlock: {
      buyerSign: 'MÜŞTERİ / TESLİM ALAN (Islak İmza): ................................',
      cashierSign: 'KASA GÖREVLİSİ KAŞE & İMZA: ................................'
    }
  };
}

/**
 * CASH_ENGINE ANA SINIFI
 */
class CashEngine {
  constructor(options = {}) {
    this.options = options;
  }

  processOrderEvidence(input = {}) {
    const {
      order,
      cashReceipt,
      cashierShiftLog,
      invoice,
      kyc,
      stockRecord,
      wetDeliveryRecord,
      accountingEntry,
      historicalOrders = [],
      refundRecord,
      timestampToken,
      cctvTimestampRef,
      date = new Date(),
    } = input;

    const auditTrail = [];
    const errors = [];
    const warnings = [];

    const config = getComplianceConfig(date);
    const orderAmount = Number(order?.amount || order?.total || 0);
    const orderId = order?.id || order?.orderId || `BLG-CSH-${Date.now()}`;
    const buyerName = order?.customerName || order?.buyerName || kyc?.fullName;

    // --- ADIM 1: YASAL NAKİT LİMİT KONTROLLERİ (HARD LEGAL GATES) ---
    // Connected transactions & same-day check
    const connectedAnalysis = CONNECTED_TRANSACTION_ENGINE.analyze({
      currentOrder: {
        ...order,
        amount: orderAmount,
        customerRef: buyerName || order?.buyerTckn,
        buyerTckn: kyc?.tckn || order?.buyerTckn,
        paymentMethod: 'CASH_COUNTER',
      },
      historicalOrders,
      date,
    });

    let state = 'DRAFT';
    let cashBlocked = false;
    let cashBlockReason = null;

    if (connectedAnalysis.cashBlocked) {
      cashBlocked = true;
      cashBlockReason = connectedAnalysis.cashBlockReason;
      state = 'BANK_REQUIRED';
      errors.push(`CASH_BLOCKED: ${cashBlockReason} -> Finansal kurum kanalı (Havale/EFT/FAST) zorunludur.`);
    }

    // --- ADIM 2: RAW KAYNAKLARIN INGESTION & PROVENANCE ---
    const ingestedSources = [];

    // SOURCE-C01: CASH_TRANSACTION_OPENING_RECORD
    const openingRecord = {
      orderId,
      orderAmount,
      currency: 'TRY',
      requestedPaymentMethod: 'CASH_COUNTER',
      evaluatedAt: new Date(date).toISOString(),
    };
    ingestedSources.push(EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C01',
      originalFilename: 'cash_opening_record.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(openingRecord).length,
      rawContent: openingRecord,
      sourceOrigin: 'STORE_SYSTEM',
    }));

    // SOURCE-C02: CASH_RECEIPT / KASA TAHSİLAT KAYDI
    const cashReceiptRaw = cashReceipt ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C02',
      originalFilename: `cash_receipt_${cashReceipt.receiptNumber || 'rec'}.json`,
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(cashReceipt).length,
      rawContent: cashReceipt,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: cashReceipt.receivedAt,
    }) : null;
    if (cashReceiptRaw) ingestedSources.push(cashReceiptRaw);

    // SOURCE-C03: GIB_INVOICE_XML
    const invoiceRaw = invoice ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C03',
      originalFilename: `invoice_${invoice.ettn || invoice.invoiceNumber}.xml`,
      mimeType: 'application/xml',
      sizeBytes: JSON.stringify(invoice).length,
      rawContent: invoice,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: invoice.issueDate,
    }) : null;
    if (invoiceRaw) ingestedSources.push(invoiceRaw);

    // SOURCE-C04: CUSTOMER_KYC
    const kycRaw = kyc ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C04',
      originalFilename: 'customer_kyc.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(kyc).length,
      rawContent: kyc,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: kyc.verifiedAt,
    }) : null;
    if (kycRaw) ingestedSources.push(kycRaw);

    // SOURCE-C05: SIGNED_CASH_PURCHASE_DELIVERY_DECLARATION
    const cashDeclaration = generateCashDeclarationText({
      buyerName,
      buyerTckn: kyc?.tckn,
      phone: order?.phone || kyc?.phone,
      profession: kyc?.profession,
      address: order?.address || kyc?.address,
      amountStr: `${orderAmount.toLocaleString('tr-TR')} TL`,
      orderRef: orderId,
      invoiceNo: invoice?.invoiceNumber,
    });
    ingestedSources.push(EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C05',
      originalFilename: 'signed_cash_purchase_declaration.txt',
      mimeType: 'text/plain',
      sizeBytes: JSON.stringify(cashDeclaration).length,
      rawContent: cashDeclaration,
      sourceOrigin: 'STORE_SYSTEM',
    }));

    // SOURCE-C06: PRODUCT_STOCK_SOURCE
    const stockRaw = stockRecord ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C06',
      originalFilename: 'stock_discharge.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(stockRecord).length,
      rawContent: stockRecord,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: stockRecord.dischargedAt,
    }) : null;
    if (stockRaw) ingestedSources.push(stockRaw);

    // SOURCE-C07: WET_SIGNED_DELIVERY
    const deliveryRaw = wetDeliveryRecord ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C07',
      originalFilename: 'wet_delivery.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      rawContent: wetDeliveryRecord,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: wetDeliveryRecord.signedAt,
    }) : null;
    if (deliveryRaw) ingestedSources.push(deliveryRaw);

    // SOURCE-C08: CASHIER / SHIFT / KASA LOG
    const cashierLogRaw = cashierShiftLog ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C08',
      originalFilename: 'cashier_shift_log.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(cashierShiftLog).length,
      rawContent: cashierShiftLog,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: cashierShiftLog.timestamp,
    }) : null;
    if (cashierLogRaw) ingestedSources.push(cashierLogRaw);

    // SOURCE-C09: ACCOUNTING_ENTRY
    const accountingRaw = accountingEntry ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C09',
      originalFilename: 'cash_journal_entry.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(accountingEntry).length,
      rawContent: accountingEntry,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: accountingEntry.voucherDate,
    }) : null;
    if (accountingRaw) ingestedSources.push(accountingRaw);

    // SOURCE-C10: REFUND_BUYBACK_RECORD
    const refundRaw = refundRecord ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-C10',
      originalFilename: 'cash_refund_record.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(refundRecord).length,
      rawContent: refundRecord,
      sourceOrigin: 'STORE_SYSTEM',
    }) : null;
    if (refundRaw) ingestedSources.push(refundRaw);

    // --- ADIM 3: MODÜL DEĞERLENDİRMELERİ ---
    const sanctionsResult = SANCTIONS_SCREENING_ENGINE.screen({
      name: buyerName,
      tckn: kyc?.tckn,
    });

    const kycGateResult = CUSTOMER_KYC_ENGINE.evaluateKycGate({
      totalAmount: orderAmount,
      customerType: 'NATURAL_PERSON',
      kycData: kyc,
      isOngoingRelationship: Boolean(historicalOrders.length > 0),
      hasStrSuspicion: sanctionsResult.match,
      date,
    });

    const isCashReceived = Boolean(cashReceipt && cashReceipt.collectedAmount >= orderAmount && cashReceipt.status === 'COLLECTED');

    const invoiceGateResult = INVOICE_ENGINE.validateInvoice({
      invoiceRecord: invoice,
      settledAmount: Number(cashReceipt?.collectedAmount || orderAmount),
    });

    const stockGateResult = PRODUCT_STOCK_ENGINE.verifyStockDischarge({
      items: order?.items || [{ sku: 'GOLD-CASH-1', name: 'Altın Ürün' }],
      stockDeductionRecord: stockRecord,
    });

    const deliveryReadiness = DELIVERY_ENGINE.evaluateDeliveryReadiness({
      kycStatus: kycGateResult,
      paymentStatus: isCashReceived ? 'CASH_RECEIVED' : 'PENDING',
      stockStatus: stockGateResult,
      invoiceStatus: invoiceGateResult,
      amlStatus: sanctionsResult.match ? 'RED' : 'GREEN',
    });

    let physicalDeliveryResult = { verified: false, status: 'NOT_DELIVERED' };
    if (wetDeliveryRecord) {
      physicalDeliveryResult = DELIVERY_ENGINE.verifyPhysicalDelivery({
        recipientVerification: { verified: Boolean(wetDeliveryRecord.recipientVerified), recipientName: wetDeliveryRecord.recipientName || buyerName },
        wetSignedDocument: { hasSignature: Boolean(wetDeliveryRecord.hasSignature) },
        deliveryProtocolRef: wetDeliveryRecord.protocolRef || `PRT-${orderId}`,
        cctvTimestampRef,
      });
    }

    let accountingReconResult = { reconciled: false, status: 'PENDING' };
    if (accountingEntry) {
      accountingReconResult = ACCOUNTING_RECON_ENGINE.reconcile({
        paymentMethod: 'CASH_COUNTER',
        amount: orderAmount,
        cashRegisterReceiptNo: cashReceipt?.receiptNumber,
        journalEntry: accountingEntry,
      });
    }

    let refundResult = null;
    if (refundRecord) {
      refundResult = REFUND_BUYBACK_ENGINE.evaluateRefund({
        originalSenderIban: null,
        refundDestinationIban: null,
        isSameAccount: Boolean(refundRecord.isOriginalCustomer),
        amount: refundRecord.amount,
        legalJustification: refundRecord.justification,
        amlApproval: refundRecord.amlApproval,
      });
    }

    const amlResult = AML_RISK_ENGINE.evaluate({
      payerMatchesCustomer: true,
      isThirdParty: false,
      sanctionsCheck: sanctionsResult,
      kycStatus: kycGateResult,
      amount: orderAmount,
      connectedAnalysis,
      bankSourceOrigin: 'STORE_SYSTEM',
    });

    const timestampVerification = HASH_AND_TIMESTAMP_ENGINE.verifyTimestampToken(timestampToken);

    // --- ADIM 4: 10 HALKALI CASH LINKAGE MATRIX (BÖLÜM 10) ---
    const matrix = {
      link01_personToTransaction: buyerName ? 'PASS' : 'FAIL',
      link02_transactionToLegalCashLimit: !cashBlocked ? 'PASS' : 'FAIL',
      link03_cashCollectionToRegisterReceipt: isCashReceived ? 'PASS' : 'FAIL',
      link04_cashRegisterReceiptToInvoice: invoiceGateResult.valid ? 'PASS' : 'FAIL',
      link05_invoiceToProduct: (invoice && order?.items?.length) ? 'PASS' : 'FAIL',
      link06_productToStock: stockGateResult.verified ? 'PASS' : 'FAIL',
      link07_productToDelivery: physicalDeliveryResult.verified ? 'PASS' : 'REVIEW',
      link08_deliveryToNaturalPerson: physicalDeliveryResult.verified ? 'PASS' : 'REVIEW',
      link09_cashCollectionToAccounting: accountingReconResult.reconciled ? 'PASS' : 'REVIEW',
      link10_refundToSamePerson: refundResult ? (refundResult.status === 'REFUND_PERMITTED' ? 'PASS' : 'FAIL') : 'N/A',
    };

    // --- ADIM 5: DURUM MAKİNESİ (BÖLÜM 16) ---
    if (!cashBlocked) {
      if (kycGateResult.required && !kycGateResult.gatePassed) {
        state = 'KYC_RISK_CHECK';
      } else if (!isCashReceived) {
        state = 'CASH_LIMIT_CHECK';
      } else if (isCashReceived && !invoiceGateResult.valid) {
        state = 'CASH_RECEIVED';
      } else if (invoiceGateResult.valid && !stockGateResult.verified) {
        state = 'INVOICE_VERIFIED';
      } else if (stockGateResult.verified && !physicalDeliveryResult.verified) {
        state = deliveryReadiness.ready ? 'DELIVERY_READY' : 'STOCK_VERIFIED';
      } else if (physicalDeliveryResult.verified && !accountingReconResult.reconciled) {
        state = 'DELIVERED';
      } else if (accountingReconResult.reconciled) {
        state = 'CASH_ACCOUNTING_RECONCILED';
      }
    }

    if (sanctionsResult.match || amlResult.action === 'REVIEW_HOLD') {
      state = 'REVIEW_HOLD';
    }

    // --- ADIM 6: TÜRETİLMİŞ BELGELER & MANIFEST KÖK HASH'İ (CANONICAL DOSSIER) ---
    const retention = RETENTION_AND_ACCESS_CONTROL.enforceMasakRetention();
    const canonicalDossier = renderCashDossier({
      order,
      cashReceipt,
      invoice,
      kyc,
      stockRecord,
      wetDeliveryRecord,
      accountingEntry,
      connectedAnalysis,
      amlResult,
      matrix,
      timestampVerification,
      cashBlocked,
      cashBlockReason,
    });

    const manifestRootSha256 = canonicalDossier.manifestRootSha256;
    const derivedDocuments = canonicalDossier.documents;
    const documentHashes = canonicalDossier.documentHashes;

    return {
      orderId,
      engineType: 'CASH_ENGINE',
      state,
      cashBlocked,
      cashBlockReason,
      deliveryReadiness,
      linkageMatrix: matrix,
      isGreenCandidate: !cashBlocked && amlResult.level === 'GREEN' && Object.values(matrix).every(v => v === 'PASS' || v === 'N/A' || v === 'REVIEW'),
      amlResult,
      errors,
      warnings,
      retentionPolicy: retention,
      timestampStatus: timestampVerification.reportableStatus,
      manifestRootSha256,
      derivedDocuments,
      documentHashes,
      documentCount: canonicalDossier.documentCount,
      ingestedSourcesCount: ingestedSources.length,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  CashEngine,
  CASH_STATES,
  generateCashDeclarationText,
};
