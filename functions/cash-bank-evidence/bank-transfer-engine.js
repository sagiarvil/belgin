'use strict';

const {
  sha256,
  maskTCKN,
  maskIBAN,
  maskName,
  CUSTOMER_KYC_ENGINE,
  LEGAL_ENTITY_REPRESENTATION_ENGINE,
  BENEFICIAL_OWNER_ENGINE,
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
const { renderBankTransferDossier } = require('./canonical-documents');

/**
 * BANK TRANSFER STATE TRANSITIONS
 */
const BANK_STATES = [
  'DRAFT',
  'KYC_PENDING',
  'KYC_VERIFIED',
  'PAYMENT_PENDING',
  'PAYMENT_SETTLED',
  'INVOICE_VERIFIED',
  'STOCK_VERIFIED',
  'DELIVERY_READY',
  'DELIVERED',
  'ACCOUNTING_RECONCILED',
  'ARCHIVED',
  'REVIEW_HOLD',
  'STR_REVIEW',
  'REJECTED',
];

/**
 * İmzalı Banka Havalesi Beyanı Standart Metni Oluşturucu (Bölüm 17)
 */
function generateBankTransferDeclarationText(params = {}) {
  const buyerName = params.buyerName || '................................';
  const buyerTckn = params.buyerTckn ? maskTCKN(params.buyerTckn) : '................................';
  const phone = params.phone || '................................';
  const profession = params.profession || '................................';
  const address = params.address || '................................';
  const companyTitle = params.companyTitle || '—';
  const companyVkn = params.companyVkn ? maskTCKN(params.companyVkn) : '—';
  const senderName = params.senderName || buyerName;
  const ibanLast4 = params.ibanLast4 || (params.senderIban ? params.senderIban.slice(-4) : '....');
  const capacity = params.capacity || 'Kendi nam ve hesabıma';
  const orderRef = params.orderRef || params.orderId || '........';
  const dateStr = params.dateStr || new Date().toLocaleString('tr-TR');

  return {
    title: 'BANKA HAVALESİ / EFT / FAST ÖDEME VE TESLİMAT BEYANNAMESİ',
    legalNotice: 'HMK m. 193-200, 6098 s. TBK, 5549 s. MASAK Kanunu ve 6502 s. TKHK m. 15/1-a uyarınca yasal delil beyanıdır.',
    declarationText: `Siparişe konu altın ürünlerini mağazada görerek ve kontrol ederek eksiksiz teslim aldım. Satış bedelini banka havalesi/EFT/FAST yoluyla ödedim. Ödeme ve satın alma işleminin bana/temsil ettiğim şirkete ait olduğunu beyan ederim.`,
    fields: {
      buyerName,
      buyerTckn,
      phone,
      profession,
      address,
      companyTitle,
      companyVkn,
      senderName,
      ibanLast4,
      capacity,
      orderRef,
      dateStr,
    },
    signatureBlock: {
      buyerSign: 'MÜŞTERİ / TESLİM ALAN (Islak İmza): ................................',
      storeSign: 'BELGİN KUYUMCULUK YETKİLİ KAŞE & İMZA: ................................'
    }
  };
}

/**
 * BANK_TRANSFER_ENGINE ANA SINIFI
 */
class BankTransferEngine {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Tam Süreç Değerlendirmesi & Rapor Üretimi
   */
  processOrderEvidence(input = {}) {
    const {
      order,
      bankTransferRaw,
      invoice,
      kyc,
      stockRecord,
      wetDeliveryRecord,
      accountingEntry,
      historicalOrders = [],
      refundRecord,
      timestampToken,
      thirdPartyJustification,
      cctvTimestampRef,
    } = input;

    const auditTrail = [];
    const errors = [];
    const warnings = [];

    const orderAmount = Number(order?.amount || order?.total || 0);
    const orderId = order?.id || order?.orderId || `BLG-TRF-${Date.now()}`;
    const buyerName = order?.customerName || order?.buyerName || kyc?.fullName;
    const isCompany = Boolean(order?.isCompany || kyc?.companyTitle || order?.companyTitle);

    // --- ADIM 1: RAW KAYNAKLARIN INGESTION & PROVENANCE ---
    const ingestedSources = [];

    // SOURCE-E01: BANK_INCOMING_RAW
    const bankRawRecord = bankTransferRaw ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E01',
      originalFilename: 'bank_incoming_statement.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(bankTransferRaw).length,
      rawContent: bankTransferRaw,
      sourceOrigin: bankTransferRaw.sourceOrigin || 'BANK_ORIGINATED',
      sourceEventAt: bankTransferRaw.bookingTimestamp,
    }) : null;
    if (bankRawRecord) ingestedSources.push(bankRawRecord);

    // SOURCE-E02: GIB_INVOICE_XML
    const invoiceRawRecord = invoice ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E02',
      originalFilename: `invoice_${invoice.ettn || invoice.invoiceNumber}.xml`,
      mimeType: 'application/xml',
      sizeBytes: JSON.stringify(invoice).length,
      rawContent: invoice,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: invoice.issueDate,
    }) : null;
    if (invoiceRawRecord) ingestedSources.push(invoiceRawRecord);

    // SOURCE-E03: CUSTOMER_KYC
    const kycRawRecord = kyc ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E03',
      originalFilename: 'customer_kyc_data.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(kyc).length,
      rawContent: kyc,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: kyc.verifiedAt || new Date().toISOString(),
    }) : null;
    if (kycRawRecord) ingestedSources.push(kycRawRecord);

    // SOURCE-E04: SIGNED_BANK_TRANSFER_PURCHASE_DECLARATION
    const declaration = generateBankTransferDeclarationText({
      buyerName,
      buyerTckn: kyc?.tckn,
      phone: order?.phone || kyc?.phone,
      profession: kyc?.profession,
      address: order?.address || kyc?.address,
      companyTitle: kyc?.companyTitle,
      companyVkn: kyc?.vkn,
      senderName: bankTransferRaw?.senderName,
      senderIban: bankTransferRaw?.senderIban,
      orderRef: orderId,
    });
    const declarationRawRecord = EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E04',
      originalFilename: 'signed_bank_transfer_purchase_declaration.txt',
      mimeType: 'text/plain',
      sizeBytes: JSON.stringify(declaration).length,
      rawContent: declaration,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: new Date().toISOString(),
    });
    ingestedSources.push(declarationRawRecord);

    // SOURCE-E05: PRODUCT_STOCK_SOURCE
    const stockRawRecord = stockRecord ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E05',
      originalFilename: 'product_stock_discharge.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(stockRecord).length,
      rawContent: stockRecord,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: stockRecord.dischargedAt,
    }) : null;
    if (stockRawRecord) ingestedSources.push(stockRawRecord);

    // SOURCE-E08: WET_SIGNED_DELIVERY
    const deliveryRawRecord = wetDeliveryRecord ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E08',
      originalFilename: 'wet_signed_delivery_protocol.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      rawContent: wetDeliveryRecord,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: wetDeliveryRecord.signedAt,
    }) : null;
    if (deliveryRawRecord) ingestedSources.push(deliveryRawRecord);

    // SOURCE-E09: ACCOUNTING_ENTRY
    const accountingRawRecord = accountingEntry ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E09',
      originalFilename: 'journal_entry.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(accountingEntry).length,
      rawContent: accountingEntry,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: accountingEntry.voucherDate,
    }) : null;
    if (accountingRawRecord) ingestedSources.push(accountingRawRecord);

    // SOURCE-E11: REFUND_BUYBACK_RECORD
    const refundRawRecord = refundRecord ? EVIDENCE_PROVENANCE_ENGINE.createRecord({
      sourceId: 'SOURCE-E11',
      originalFilename: 'refund_buyback_record.json',
      mimeType: 'application/json',
      sizeBytes: JSON.stringify(refundRecord).length,
      rawContent: refundRecord,
      sourceOrigin: 'STORE_SYSTEM',
      sourceEventAt: refundRecord.requestedAt,
    }) : null;
    if (refundRawRecord) ingestedSources.push(refundRawRecord);

    // --- ADIM 2: BANK TRANSFER HARD RULES KONTROLLERİ ---

    // Kural 1: Banka tahsilatı kontrolü
    const bankSettlementStatus = bankTransferRaw?.settlementStatus;
    const isPaymentSettled = Boolean(bankTransferRaw && bankSettlementStatus === 'SETTLED');
    const bankSourceOrigin = bankTransferRaw?.sourceOrigin || 'BANK_ORIGINATED';
    const isOnlyMerchantEntered = bankSourceOrigin === 'MERCHANT_ENTERED';

    if (!bankTransferRaw || bankSettlementStatus !== 'SETTLED') {
      errors.push('PAYMENT_UNVERIFIED: Banka tahsilat kaydı (SETTLED) bulunamadı. Dekont veya müşteri ekran görüntüsü tek başına yeterli değildir.');
    }
    if (isOnlyMerchantEntered) {
      warnings.push('BANK_SOURCE_WARNING: source_origin = MERCHANT_ENTERED tek başına tam delil sayılmaz; banka API/ekstresi beklenmelidir.');
    }

    // Kural 2: Payer Match & Üçüncü Kişi Kontrolü
    const senderNameClean = String(bankTransferRaw?.senderName || '').trim().toLowerCase();
    const buyerNameClean = String(buyerName || '').trim().toLowerCase();
    const isPayerMatch = senderNameClean && buyerNameClean && (
      senderNameClean === buyerNameClean || 
      senderNameClean.includes(buyerNameClean) || 
      buyerNameClean.includes(senderNameClean)
    );
    const isSenderAnonymous = !senderNameClean || senderNameClean.includes('bilinmeyen') || senderNameClean.includes('anonim');

    let thirdPartyStatus = 'EXACT';
    if (!isPayerMatch) {
      thirdPartyStatus = thirdPartyJustification ? 'AUTHORIZED' : 'THIRD_PARTY';
    }
    if (isSenderAnonymous) {
      thirdPartyStatus = 'UNKNOWN';
    }

    // Şirket müşterisinde gerçek kişi hesabı kontrolü
    let companyAuthorityReviewRequired = false;
    if (isCompany && bankTransferRaw?.senderType !== 'LEGAL_ENTITY') {
      if (!thirdPartyJustification) {
        companyAuthorityReviewRequired = true;
      }
    }

    // --- ADIM 3: ÇEKİRDEK MODÜL DEĞERLENDİRMELERİ ---

    // Sanctions Screening
    const sanctionsResult = SANCTIONS_SCREENING_ENGINE.screen({
      name: buyerName || bankTransferRaw?.senderName,
      tckn: kyc?.tckn,
      vkn: kyc?.vkn,
    });

    // Connected Transactions Analysis
    const connectedAnalysis = CONNECTED_TRANSACTION_ENGINE.analyze({
      currentOrder: {
        ...order,
        customerRef: buyerName,
        amount: orderAmount,
        buyerTckn: kyc?.tckn,
        senderIban: bankTransferRaw?.senderIban,
        paymentMethod: 'EFT',
      },
      historicalOrders,
    });

    // KYC Engine Gate
    const kycGateResult = CUSTOMER_KYC_ENGINE.evaluateKycGate({
      totalAmount: orderAmount,
      customerType: isCompany ? 'LEGAL_ENTITY' : 'NATURAL_PERSON',
      kycData: kyc,
      isOngoingRelationship: Boolean(historicalOrders.length > 0),
      hasStrSuspicion: sanctionsResult.match,
    });

    // Representation Engine (Şirketse)
    let repResult = { verified: true, status: 'N/A' };
    if (isCompany) {
      repResult = LEGAL_ENTITY_REPRESENTATION_ENGINE.verifyRepresentation({
        legalEntityKyc: kyc,
        representative: kyc?.representative,
        authorityDoc: kyc?.authorityDocument,
      });
    }

    // Stock Engine Gate
    const stockGateResult = PRODUCT_STOCK_ENGINE.verifyStockDischarge({
      items: order?.items || [{ sku: 'GOLD-ITEM-1', name: 'Altın Ürün' }],
      stockDeductionRecord: stockRecord,
    });

    // Invoice Engine Gate
    const invoiceGateResult = INVOICE_ENGINE.validateInvoice({
      invoiceRecord: invoice,
      settledAmount: Number(bankTransferRaw?.amount || orderAmount),
    });

    // Delivery Gate
    const deliveryReadiness = DELIVERY_ENGINE.evaluateDeliveryReadiness({
      kycStatus: kycGateResult,
      paymentStatus: isPaymentSettled ? 'PAYMENT_SETTLED' : 'PAYMENT_PENDING',
      stockStatus: stockGateResult,
      invoiceStatus: invoiceGateResult,
      amlStatus: sanctionsResult.match ? 'RED' : (thirdPartyStatus === 'THIRD_PARTY' && orderAmount >= 500000 ? 'RED' : 'GREEN'),
    });

    // Physical Delivery Verification
    let physicalDeliveryResult = { verified: false, status: 'NOT_DELIVERED' };
    if (wetDeliveryRecord) {
      physicalDeliveryResult = DELIVERY_ENGINE.verifyPhysicalDelivery({
        recipientVerification: { verified: Boolean(wetDeliveryRecord.recipientVerified), recipientName: wetDeliveryRecord.recipientName || buyerName },
        wetSignedDocument: { hasSignature: Boolean(wetDeliveryRecord.hasSignature) },
        deliveryProtocolRef: wetDeliveryRecord.protocolRef || `PRT-${orderId}`,
        cctvTimestampRef,
      });
    }

    // Accounting Recon
    let accountingReconResult = { reconciled: false, status: 'PENDING' };
    if (accountingEntry) {
      accountingReconResult = ACCOUNTING_RECON_ENGINE.reconcile({
        paymentMethod: 'EFT',
        amount: orderAmount,
        bankReference: bankTransferRaw?.bankTransactionReference,
        journalEntry: accountingEntry,
      });
    }

    // Refund / Buyback Engine
    let refundResult = null;
    if (refundRecord) {
      refundResult = REFUND_BUYBACK_ENGINE.evaluateRefund({
        originalSenderIban: bankTransferRaw?.senderIban,
        refundDestinationIban: refundRecord.destinationIban,
        isSameAccount: refundRecord.isSameAccount,
        amount: refundRecord.amount,
        legalJustification: refundRecord.justification,
        amlApproval: refundRecord.amlApproval,
      });
    }

    // AML Risk Engine
    const amlResult = AML_RISK_ENGINE.evaluate({
      payerMatchesCustomer: isPayerMatch,
      isThirdParty: !isPayerMatch,
      sanctionsCheck: sanctionsResult,
      kycStatus: kycGateResult,
      amount: orderAmount,
      connectedAnalysis,
      bankSourceOrigin,
    });

    // Timestamp Engine
    const timestampVerification = HASH_AND_TIMESTAMP_ENGINE.verifyTimestampToken(timestampToken);

    // --- ADIM 4: 12 HALKALI LINKAGE MATRIX (BÖLÜM 5) ---
    const matrix = {
      link01_personToKyc: kycGateResult.gatePassed ? 'PASS' : (kycGateResult.required ? 'FAIL' : 'PASS'),
      link02_personToRepresentation: isCompany ? (repResult.verified ? 'PASS' : 'FAIL') : 'N/A',
      link03_customerToSender: isPayerMatch ? 'PASS' : (thirdPartyJustification ? 'REVIEW' : 'FAIL'),
      link04_senderToBankRecord: isPaymentSettled ? (isOnlyMerchantEntered ? 'REVIEW' : 'PASS') : 'FAIL',
      link05_bankTransferToOrder: (isPaymentSettled && Math.abs(Number(bankTransferRaw?.amount) - orderAmount) < 0.01) ? 'PASS' : 'FAIL',
      link06_orderToInvoice: invoiceGateResult.valid ? 'PASS' : 'FAIL',
      link07_invoiceToProduct: (invoice && order?.items?.length) ? 'PASS' : 'FAIL',
      link08_productToStock: stockGateResult.verified ? 'PASS' : 'FAIL',
      link09_productToPhysicalDelivery: physicalDeliveryResult.verified ? 'PASS' : 'REVIEW',
      link10_deliveryToNaturalPerson: physicalDeliveryResult.verified ? 'PASS' : 'REVIEW',
      link11_bankToAccounting: accountingReconResult.reconciled ? 'PASS' : 'REVIEW',
      link12_refundToOriginalPayer: refundResult ? (refundResult.status === 'REFUND_PERMITTED' ? 'PASS' : (refundResult.status === 'MANUAL_AML_CLEARED' ? 'REVIEW' : 'FAIL')) : 'N/A',
    };

    // --- ADIM 5: DURUM MAKİNESİ HESAPLAMASI (BÖLÜM 15) ---
    let state = 'DRAFT';
    if (!kycGateResult.gatePassed && kycGateResult.required) {
      state = 'KYC_PENDING';
    } else if (kycGateResult.gatePassed && !isPaymentSettled) {
      state = 'PAYMENT_PENDING';
    } else if (isPaymentSettled && !invoiceGateResult.valid) {
      state = 'PAYMENT_SETTLED';
    } else if (invoiceGateResult.valid && !stockGateResult.verified) {
      state = 'INVOICE_VERIFIED';
    } else if (stockGateResult.verified && !physicalDeliveryResult.verified) {
      state = deliveryReadiness.ready ? 'DELIVERY_READY' : 'STOCK_VERIFIED';
    } else if (physicalDeliveryResult.verified && !accountingReconResult.reconciled) {
      state = 'DELIVERED';
    } else if (accountingReconResult.reconciled) {
      state = 'ACCOUNTING_RECONCILED';
    }

    // Yan yol: REVIEW_HOLD tetikleyicileri
    if (
      amlResult.action === 'REVIEW_HOLD' || 
      sanctionsResult.match || 
      isSenderAnonymous || 
      companyAuthorityReviewRequired || 
      (thirdPartyStatus === 'THIRD_PARTY' && orderAmount >= 185000)
    ) {
      state = 'REVIEW_HOLD';
    }

    // Stop conditions
    if (kycGateResult.required && !kycGateResult.gatePassed) {
      errors.push('STOP_CONDITION: Zorunlu KYC eksikliği nedeniyle işlem ilerletilemez.');
    }
    if (stockGateResult.status === 'DELIVERY_BLOCKED') {
      errors.push('STOP_CONDITION: Stok çıkışı yapılmadan teslim edilemez.');
    }
    if (!isPaymentSettled) {
      errors.push('STOP_CONDITION: Ödeme kesinleşmeden (PAYMENT_SETTLED) teslimat aşamasına geçilemez.');
    }

    // --- ADIM 6: TÜRETİLMİŞ BELGELER & MANIFEST KÖK HASH'İ (CANONICAL DOSSIER) ---
    const retention = RETENTION_AND_ACCESS_CONTROL.enforceMasakRetention();
    const canonicalDossier = renderBankTransferDossier({
      order,
      bankTransferRaw,
      invoice,
      kyc,
      stockRecord,
      wetDeliveryRecord,
      accountingEntry,
      connectedAnalysis,
      amlResult,
      matrix,
      timestampVerification,
      thirdPartyJustification,
      refundRecord,
    });

    const manifestRootSha256 = canonicalDossier.manifestRootSha256;
    const derivedDocuments = canonicalDossier.documents;
    const documentHashes = canonicalDossier.documentHashes;

    return {
      orderId,
      engineType: 'BANK_TRANSFER_ENGINE',
      state,
      deliveryReadiness,
      linkageMatrix: matrix,
      isGreenCandidate: amlResult.level === 'GREEN' && Object.values(matrix).every(v => v === 'PASS' || v === 'N/A' || v === 'REVIEW'),
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
  BankTransferEngine,
  BANK_STATES,
  generateBankTransferDeclarationText,
};
