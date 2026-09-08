'use strict';

const crypto = require('crypto');
const { getComplianceConfig } = require('./compliance-config');

/**
 * SHA-256 Yardımcı Fonksiyonu
 */
function sha256(data) {
  if (data === null || data === undefined) return null;
  const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * TCKN Algoritma Kontrolü (11 hane, algoritma geçerliliği)
 */
function isValidTCKN(tckn) {
  if (typeof tckn !== 'string' && typeof tckn !== 'number') return false;
  const s = String(tckn).trim();
  if (!/^[1-9]\d{10}$/.test(s)) return false;
  const digits = s.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = ((oddSum * 7) - evenSum) % 10;
  if (d10 < 0 ? d10 + 10 !== digits[9] : d10 !== digits[9]) return false;
  const totalSum = digits.slice(0, 10).reduce((acc, v) => acc + v, 0);
  if (totalSum % 10 !== digits[10]) return false;
  return true;
}

/**
 * VKN Algoritma Kontrolü (10 hane)
 */
function isValidVKN(vkn) {
  if (typeof vkn !== 'string' && typeof vkn !== 'number') return false;
  const s = String(vkn).trim();
  if (!/^\d{10}$/.test(s)) return false;
  const digits = s.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const c = (digits[i] + 9 - i) % 10;
    const v = (c * Math.pow(2, 9 - i)) % 9;
    sum += (c !== 0 && v === 0) ? 9 : v;
  }
  const lastDigit = (10 - (sum % 10)) % 10;
  return lastDigit === digits[9];
}

/**
 * KVKK Maskeleme Fonksiyonları
 */
function maskTCKN(tckn) {
  const s = String(tckn || '').trim();
  if (s.length !== 11) return '***********';
  return `${s.slice(0, 3)}*****${s.slice(-3)}`;
}

function maskIBAN(iban) {
  const s = String(iban || '').replace(/\s+/g, '').toUpperCase();
  if (s.length < 10) return 'TR** **** ****';
  return `${s.slice(0, 4)} **** **** **** **** **${s.slice(-4)}`;
}

function maskName(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return parts.map(p => {
    if (p.length <= 2) return `${p[0] || '*'}*`;
    return `${p[0]}***${p.slice(-1)}`;
  }).join(' ');
}

/**
 * 1. CUSTOMER_KYC_ENGINE
 */
const CUSTOMER_KYC_ENGINE = {
  validateNaturalPerson(data) {
    const errors = [];
    const missing = [];
    const fullName = String(data?.fullName || '').trim();
    const tckn = String(data?.tckn || '').trim();
    const birthDate = data?.birthDate;
    const birthPlace = String(data?.birthPlace || '').trim();
    const nationality = String(data?.nationality || 'TC').trim();
    const idDocType = String(data?.idDocType || '').trim();
    const idDocNumber = String(data?.idDocNumber || '').trim();
    const address = String(data?.address || '').trim();
    const signatureSample = data?.signatureSample || data?.hasWetSignature;
    const profession = String(data?.profession || '').trim();

    if (!fullName) missing.push('fullName');
    if (!tckn) missing.push('tckn');
    else if (!isValidTCKN(tckn)) errors.push('Geçersiz TCKN formatı veya kontrol hanesi hatası.');

    if (!birthDate) missing.push('birthDate');
    if (!birthPlace) missing.push('birthPlace');
    if (!idDocType) missing.push('idDocType');
    if (!idDocNumber) missing.push('idDocNumber');
    if (!address) missing.push('address');
    if (!profession) missing.push('profession');
    if (!signatureSample) missing.push('signatureSample / hasWetSignature');

    // Müşteri bilgi vermek istemedi kontrolü
    if (data?.refusedToProvideInfo || data?.notes?.toLowerCase()?.includes('bilgi vermek istemedi')) {
      errors.push('HARD_FAIL: Müşteri kimlik ve adres bilgisi vermeyi reddetti. Bu durum PASS gerekçesi olamaz.');
    }

    const isValid = missing.length === 0 && errors.length === 0;
    return {
      isValid,
      customerType: 'NATURAL_PERSON',
      missingFields: missing,
      errors,
      kycHash: sha256({ fullName, tckn, birthDate, address, idDocNumber }),
      maskedSummary: {
        fullName: maskName(fullName),
        tckn: maskTCKN(tckn),
        nationality,
        profession,
        addressLength: address.length,
      }
    };
  },

  validateLegalEntity(data) {
    const errors = [];
    const missing = [];
    const companyTitle = String(data?.companyTitle || '').trim();
    const vkn = String(data?.vkn || '').trim();
    const mersisNo = String(data?.mersisNo || '').trim();
    const tradeRegistryNo = String(data?.tradeRegistryNo || '').trim();
    const businessActivity = String(data?.businessActivity || '').trim();
    const registeredAddress = String(data?.registeredAddress || '').trim();
    const representative = data?.representative;
    const authorityDocument = data?.authorityDocument;
    const beneficialOwner = data?.beneficialOwner;

    if (!companyTitle) missing.push('companyTitle');
    if (!vkn) missing.push('vkn');
    else if (!isValidVKN(vkn)) errors.push('Geçersiz VKN formatı veya kontrol hanesi hatası.');

    if (!mersisNo) missing.push('mersisNo');
    if (!tradeRegistryNo) missing.push('tradeRegistryNo');
    if (!businessActivity) missing.push('businessActivity');
    if (!registeredAddress) missing.push('registeredAddress');

    if (!representative) {
      missing.push('representative');
    } else {
      const repKyc = CUSTOMER_KYC_ENGINE.validateNaturalPerson(representative);
      if (!repKyc.isValid) {
        errors.push(`Tüzel kişi temsilcisi KYC geçersiz: ${repKyc.errors.concat(repKyc.missingFields).join(', ')}`);
      }
    }

    if (!authorityDocument || !authorityDocument.type || !authorityDocument.refNumber) {
      missing.push('authorityDocument (İmza Sirküleri / Yetki Belgesi / Vekaletname)');
    }

    if (data?.refusedToProvideInfo) {
      errors.push('HARD_FAIL: Tüzel kişi yetkilisi yasal bilgileri vermeyi reddetti.');
    }

    const isValid = missing.length === 0 && errors.length === 0;
    return {
      isValid,
      customerType: 'LEGAL_ENTITY',
      missingFields: missing,
      errors,
      kycHash: sha256({ companyTitle, vkn, mersisNo, rep: representative?.tckn }),
      maskedSummary: {
        companyTitle,
        vkn: vkn ? `${vkn.slice(0, 3)}****${vkn.slice(-3)}` : '—',
        mersisNo: mersisNo ? `${mersisNo.slice(0, 4)}****` : '—',
        representativeName: representative ? maskName(representative.fullName) : '—',
      }
    };
  },

  evaluateKycGate({ totalAmount, customerType, kycData, isOngoingRelationship, hasStrSuspicion, date = new Date() }) {
    const config = getComplianceConfig(date);
    const requiresMandatoryKyc = 
      totalAmount >= config.rules.MASAK_KYC_THRESHOLD || 
      Boolean(isOngoingRelationship) || 
      Boolean(hasStrSuspicion);

    if (!requiresMandatoryKyc) {
      return {
        required: false,
        status: 'MINIMAL_DATA_PASS',
        gatePassed: true,
        threshold: config.rules.MASAK_KYC_THRESHOLD,
        amount: totalAmount,
        notes: 'MASAK kimlik tespit eşiği altında, veri minimizasyonu uygulanabilir.',
      };
    }

    if (!kycData) {
      return {
        required: true,
        status: 'HARD_FAIL',
        gatePassed: false,
        reason: 'DELIVERY_BLOCKED: MASAK kimlik tespit eşiği (185.000 TL+) veya ŞİB şüphesi nedeniyle zorunlu KYC eksik.',
      };
    }

    const valResult = customerType === 'LEGAL_ENTITY' 
      ? CUSTOMER_KYC_ENGINE.validateLegalEntity(kycData)
      : CUSTOMER_KYC_ENGINE.validateNaturalPerson(kycData);

    if (!valResult.isValid) {
      return {
        required: true,
        status: 'HARD_FAIL',
        gatePassed: false,
        validation: valResult,
        reason: `DELIVERY_BLOCKED: Zorunlu KYC tamamlanamadı. Hatalar: ${valResult.errors.concat(valResult.missingFields).join(', ')}`,
      };
    }

    return {
      required: true,
      status: 'KYC_VERIFIED',
      gatePassed: true,
      validation: valResult,
      threshold: config.rules.MASAK_KYC_THRESHOLD,
    };
  }
};

/**
 * 2. LEGAL_ENTITY_REPRESENTATION_ENGINE
 */
const LEGAL_ENTITY_REPRESENTATION_ENGINE = {
  verifyRepresentation({ legalEntityKyc, representative, authorityDoc }) {
    if (!legalEntityKyc || !representative || !authorityDoc) {
      return { verified: false, status: 'FAIL', reason: 'Temsilci veya yetki belgesi eksik.' };
    }
    const expiry = authorityDoc.expiresAt ? new Date(authorityDoc.expiresAt).getTime() : null;
    if (expiry && expiry < Date.now()) {
      return { verified: false, status: 'FAIL', reason: 'Yetki belgesi / imza sirküleri süresi dolmuş.' };
    }
    if (authorityDoc.limitAmount && authorityDoc.limitAmount < legalEntityKyc.orderAmount) {
      return { verified: false, status: 'FAIL', reason: 'İşlem tutarı temsilcinin münferit imza yetkisi sınırını aşıyor.' };
    }
    return {
      verified: true,
      status: 'PASS',
      authorityType: authorityDoc.type, // IMZA_SIRKULERI | VEKALETNAME | TICARET_SICIL_GAZETESI
      authorityRef: authorityDoc.refNumber,
    };
  }
};

/**
 * 3. BENEFICIAL_OWNER_ENGINE (Gerçek Faydalanıcı İncelemesi)
 */
const BENEFICIAL_OWNER_ENGINE = {
  evaluateBeneficialOwner({ payer, customer, isThirdParty, beneficialOwnerData }) {
    if (!isThirdParty && (!beneficialOwnerData || beneficialOwnerData.isSelf)) {
      return { status: 'PASS', isDirectBeneficiary: true, riskLevel: 'LOW' };
    }
    if (isThirdParty) {
      if (!beneficialOwnerData || !beneficialOwnerData.fullName || !beneficialOwnerData.relationship) {
        return {
          status: 'REVIEW_HOLD',
          isDirectBeneficiary: false,
          riskLevel: 'HIGH',
          reason: 'Ödeyen ile alıcı farklı; gerçek faydalanıcı beyanı ve yasal ilişki belgesi eksik.'
        };
      }
      return {
        status: 'REVIEW_CLEARED',
        isDirectBeneficiary: false,
        riskLevel: 'MEDIUM',
        beneficialOwner: beneficialOwnerData,
      };
    }
    return { status: 'PASS', isDirectBeneficiary: true, riskLevel: 'LOW' };
  }
};

/**
 * 4. CONNECTED_TRANSACTION_ENGINE (Bağlantılı İşlem & Tevsik Analizi)
 */
const CONNECTED_TRANSACTION_ENGINE = {
  analyze({ currentOrder, historicalOrders = [], date = new Date() }) {
    const config = getComplianceConfig(date);
    const currentDateStr = new Date(date).toISOString().slice(0, 10);
    const currentCustomerRef = currentOrder.customerRef || currentOrder.customerId || currentOrder.buyerTckn || currentOrder.buyerVkn;
    const currentAmount = Number(currentOrder.amount || currentOrder.total || 0);

    // 1. Aynı gün aynı taraf analizi (GİB Tevsik Sınırı 30.000 TL)
    let sameDaySameCounterpartyTotal = currentAmount;
    const sameDayOrders = [];

    for (const h of historicalOrders) {
      const hDateStr = new Date(h.date || h.createdAt || h.timestamp).toISOString().slice(0, 10);
      const hCustomerRef = h.customerRef || h.customerId || h.buyerTckn || h.buyerVkn;
      if (hDateStr === currentDateStr && hCustomerRef && hCustomerRef === currentCustomerRef) {
        const hAmt = Number(h.amount || h.total || 0);
        sameDaySameCounterpartyTotal += hAmt;
        sameDayOrders.push(h);
      }
    }

    // 2. Sözleşme / Sipariş parçalama kontrolü (Tek sözleşme taksiti)
    const contractTotal = Number(currentOrder.contractTotal || currentOrder.totalContractAmount || currentAmount);
    const isContractOverLimit = contractTotal > config.rules.CASH_COUNTER_LEGAL_MAX;

    // 3. Nakit tevsik kontrolü
    const isCurrentCash = currentOrder.paymentMethod === 'CASH_COUNTER';
    let cashBlocked = false;
    let cashBlockReason = null;

    if (isCurrentCash) {
      if (currentAmount > config.rules.CASH_COUNTER_POLICY_MAX) {
        cashBlocked = true;
        cashBlockReason = `Sipariş tutarı (${currentAmount.toLocaleString('tr-TR')} TL) iç politika nakit kabul sınırını (${config.rules.CASH_COUNTER_POLICY_MAX.toLocaleString('tr-TR')} TL) aşıyor.`;
      } else if (sameDaySameCounterpartyTotal > config.rules.CASH_COUNTER_POLICY_MAX) {
        cashBlocked = true;
        cashBlockReason = `Aynı gün aynı müşteriyle yapılan toplam nakit işlem tutarı (${sameDaySameCounterpartyTotal.toLocaleString('tr-TR')} TL) yasal tevsik sınırını aşıyor.`;
      } else if (isContractOverLimit) {
        cashBlocked = true;
        cashBlockReason = `Toplam sözleşme bedeli (${contractTotal.toLocaleString('tr-TR')} TL) tevsik sınırını aştığından taksitler dahil tüm tahsilatlar finansal kurum üzerinden yapılmalıdır.`;
      }
    }

    // 4. MASAK Bağlantılı İşlem Kümülasyonu (Ağ Analizi)
    let totalConnectedAmount = currentAmount;
    const connectedOrders = [];
    for (const h of historicalOrders) {
      const isConnected = 
        (h.buyerTckn && h.buyerTckn === currentOrder.buyerTckn) ||
        (h.senderIban && h.senderIban === currentOrder.senderIban) ||
        (h.phoneNumber && h.phoneNumber === currentOrder.phoneNumber) ||
        (h.beneficialOwnerId && h.beneficialOwnerId === currentOrder.beneficialOwnerId);

      if (isConnected) {
        totalConnectedAmount += Number(h.amount || h.total || 0);
        connectedOrders.push(h);
      }
    }

    const triggersMasakKyc = totalConnectedAmount >= config.rules.MASAK_KYC_THRESHOLD;

    return {
      currentAmount,
      sameDaySameCounterpartyTotal,
      contractTotal,
      cashBlocked,
      cashBlockReason,
      triggersMasakKyc,
      totalConnectedAmount,
      connectedOrdersCount: connectedOrders.length,
      sameDayOrdersCount: sameDayOrders.length,
    };
  }
};

/**
 * 5. PRODUCT_STOCK_ENGINE
 */
const PRODUCT_STOCK_ENGINE = {
  verifyStockDischarge({ items = [], stockDeductionRecord }) {
    if (!items || items.length === 0) {
      return { verified: false, status: 'FAIL', reason: 'Siparişte ürün kalemi bulunmuyor.' };
    }
    if (!stockDeductionRecord || !stockDeductionRecord.dischargedAt || !stockDeductionRecord.referenceNo) {
      return {
        verified: false,
        status: 'DELIVERY_BLOCKED',
        reason: 'DELIVERY_BLOCKED: Stok çıkışı henüz onaylanmadı veya stok rezervasyon düşümü eksik.'
      };
    }
    // Her kalemin seri / lot kontrolü
    const unverifiedItems = items.filter(i => !i.sku && !i.lotNumber && !i.serialNumber);
    if (unverifiedItems.length > 0) {
      return {
        verified: false,
        status: 'AMBER',
        reason: 'Bazı ürünlerin lot/seri takibi tanımlı değil.'
      };
    }
    return {
      verified: true,
      status: 'STOCK_VERIFIED',
      stockDeductionRef: stockDeductionRecord.referenceNo,
      dischargedAt: stockDeductionRecord.dischargedAt,
      itemsCount: items.length,
    };
  }
};

/**
 * 6. INVOICE_ENGINE (GİB e-Arşiv / e-Fatura XML & Tutar Uyumu)
 */
const INVOICE_ENGINE = {
  validateInvoice({ invoiceRecord, settledAmount }) {
    if (!invoiceRecord || !invoiceRecord.ettn || !invoiceRecord.invoiceNumber) {
      return { valid: false, status: 'FAIL', reason: 'Fatura numarası veya GİB ETTN eksik.' };
    }
    const invTotal = Number(invoiceRecord.payableAmount || invoiceRecord.totalAmount || 0);
    const payTotal = Number(settledAmount || 0);

    // Kuruşu kuruşuna mutabakat kontrolü
    if (Math.abs(invTotal - payTotal) > 0.01) {
      return {
        valid: false,
        status: 'FAIL',
        reason: `Fatura toplamı (${invTotal.toFixed(2)} TL) ile tahsil edilen tutar (${payTotal.toFixed(2)} TL) uyuşmuyor.`
      };
    }

    // AGENTS.md kuralı: ASLA "has altın" ibaresi kullanılamaz!
    const rawText = JSON.stringify(invoiceRecord).toLowerCase();
    if (rawText.includes('has altın') || rawText.includes('has altin')) {
      return {
        valid: false,
        status: 'FAIL',
        reason: 'AGENTS.md KURAL İHLALİ: Fatura satırlarında veya açıklamalarında "has altın" ibaresi KESİNLİKLE kullanılamaz. Özel matrah satırında "Kıymetli Maden Bedeli (Özel Matrah)" veya ürün adı kullanılmalıdır.'
      };
    }

    return {
      valid: true,
      status: 'INVOICE_VERIFIED',
      ettn: invoiceRecord.ettn,
      invoiceNumber: invoiceRecord.invoiceNumber,
      payableAmount: invTotal,
      settledAmount: payTotal,
      currency: invoiceRecord.currency || 'TRY',
    };
  }
};

/**
 * 7. DELIVERY_ENGINE
 */
const DELIVERY_ENGINE = {
  evaluateDeliveryReadiness({ kycStatus, paymentStatus, stockStatus, invoiceStatus, amlStatus }) {
    const blockers = [];
    if (kycStatus?.required && !kycStatus?.gatePassed) {
      blockers.push(`KYC Tamamlanmadı: ${kycStatus.reason || 'Zorunlu kimlik verisi eksik.'}`);
    }
    if (paymentStatus !== 'PAYMENT_SETTLED' && paymentStatus !== 'CASH_RECEIVED') {
      blockers.push(`Ödeme Kesinleşmedi: Mevcut ödeme durumu: ${paymentStatus}`);
    }
    if (!stockStatus?.verified) {
      blockers.push(`Stok Çıkışı Eksik: ${stockStatus?.reason || 'Stok düşümü gerçekleşmedi.'}`);
    }
    if (!invoiceStatus?.valid) {
      blockers.push(`Fatura Mutabakatı Başarısız: ${invoiceStatus?.reason || 'Fatura geçerli değil.'}`);
    }
    if (amlStatus === 'RED' || amlStatus === 'REVIEW_HOLD') {
      blockers.push(`AML Blokajı: İşlem şüpheli veya inceleme altında (${amlStatus}).`);
    }

    if (blockers.length > 0) {
      return { ready: false, status: 'DELIVERY_BLOCKED', blockers };
    }
    return { ready: true, status: 'DELIVERY_READY' };
  },

  verifyPhysicalDelivery({ recipientVerification, wetSignedDocument, deliveryProtocolRef, cctvTimestampRef }) {
    if (!wetSignedDocument || !wetSignedDocument.hasSignature) {
      return { verified: false, status: 'FAIL', reason: 'Islak imzalı teslim tutanağı eksik veya taranmamış.' };
    }
    if (!recipientVerification || !recipientVerification.verified) {
      return { verified: false, status: 'FAIL', reason: 'Teslim alan kişinin kimlik teyidi yapılmadı.' };
    }
    return {
      verified: true,
      status: 'DELIVERED',
      deliveredAt: new Date().toISOString(),
      recipientMasked: maskName(recipientVerification.recipientName),
      protocolRef: deliveryProtocolRef,
      cctvTimestampRef: cctvTimestampRef || null,
    };
  }
};

/**
 * 8. ACCOUNTING_RECON_ENGINE
 */
const ACCOUNTING_RECON_ENGINE = {
  reconcile({ paymentMethod, amount, bankReference, cashRegisterReceiptNo, journalEntry }) {
    if (!journalEntry || !journalEntry.voucherNo || !journalEntry.entries) {
      return { reconciled: false, status: 'UNRECONCILED', reason: 'Muhasebe yevmiye kaydı eksik.' };
    }
    // Borç-Alacak Eşitliği
    const totalDebit = journalEntry.entries.reduce((s, e) => s + (Number(e.debit) || 0), 0);
    const totalCredit = journalEntry.entries.reduce((s, e) => s + (Number(e.credit) || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { reconciled: false, status: 'FAIL', reason: 'Muhasebe yevmiye kaydında borç ve alacak tutarları eşit değil.' };
    }
    if (Math.abs(totalDebit - amount) > 0.01) {
      return { reconciled: false, status: 'FAIL', reason: `Yevmiye tutarı (${totalDebit}) işlem tutarı (${amount}) ile uyuşmuyor.` };
    }
    return {
      reconciled: true,
      status: 'ACCOUNTING_RECONCILED',
      voucherNo: journalEntry.voucherNo,
      voucherDate: journalEntry.voucherDate,
    };
  }
};

/**
 * 9. REFUND_BUYBACK_ENGINE
 */
const REFUND_BUYBACK_ENGINE = {
  evaluateRefund({ originalSenderIban, refundDestinationIban, isSameAccount, amount, legalJustification, amlApproval }) {
    const origNorm = String(originalSenderIban || '').replace(/\s+/g, '').toUpperCase();
    const destNorm = String(refundDestinationIban || '').replace(/\s+/g, '').toUpperCase();
    const isDirectMatch = origNorm && destNorm && (origNorm === destNorm);

    if (isDirectMatch || isSameAccount) {
      return {
        status: 'REFUND_PERMITTED',
        route: 'ORIGINAL_SOURCE_RETURN',
        riskLevel: 'LOW',
        destinationIbanMasked: maskIBAN(destNorm),
      };
    }

    // Farklı IBAN'a iade talebi: HARD AML_REVIEW
    if (!amlApproval || !legalJustification) {
      return {
        status: 'AML_REVIEW',
        route: 'BLOCKED',
        riskLevel: 'RED',
        reason: 'İade/bozdurma bedelinin orijinal ödeme kaynağından farklı bir hesaba aktarılması MASAK ve AML risk oluşturur; yazılı hukuki gerekçe ve AML Uyum Görevlisi onayı olmadan yapılamaz.',
        destinationIbanMasked: maskIBAN(destNorm),
      };
    }

    return {
      status: 'MANUAL_AML_CLEARED',
      route: 'DIFFERENT_IBAN_AUTHORIZED',
      riskLevel: 'AMBER',
      justification: legalJustification,
      approvalRef: amlApproval.ref,
      destinationIbanMasked: maskIBAN(destNorm),
    };
  }
};

/**
 * 10. AML_RISK_ENGINE & SANCTIONS_SCREENING_ENGINE
 */
const SANCTIONS_SCREENING_ENGINE = {
  screen({ name, tckn, vkn }) {
    // Statik veya dinamik yaptırım listesi kontrolü simülasyonu
    const blockedKeywords = ['TEROR', 'SANCTION', 'KARA_LISTE', 'YAPTIRIM'];
    const target = `${name || ''} ${tckn || ''} ${vkn || ''}`.toUpperCase();
    for (const kw of blockedKeywords) {
      if (target.includes(kw)) {
        return { match: true, hit: kw, status: 'SANCTIONS_HIT_HARD_BLOCK' };
      }
    }
    return { match: false, status: 'CLEAR' };
  }
};

const AML_RISK_ENGINE = {
  evaluate({ payerMatchesCustomer, isThirdParty, sanctionsCheck, kycStatus, amount, connectedAnalysis, bankSourceOrigin }) {
    const redFlags = [];
    const amberFlags = [];

    if (sanctionsCheck?.match) {
      redFlags.push(`Yaptırım/Malvarlığı Dondurma Eşleşmesi: ${sanctionsCheck.hit}`);
    }

    if (bankSourceOrigin === 'MERCHANT_ENTERED') {
      amberFlags.push('Banka kaydı doğrudan merchant tarafından girilmiş (source_origin = MERCHANT_ENTERED); bağımsız banka kanıtı beklenmeli.');
    }

    if (isThirdParty || !payerMatchesCustomer) {
      amberFlags.push('Havale gönderen ile sipariş alıcısı farklı (Üçüncü Kişi Ödemesi).');
    }

    if (connectedAnalysis?.triggersMasakKyc && !kycStatus?.gatePassed) {
      redFlags.push('Bağlantılı işlem toplamı MASAK kimlik tespit sınırını (185.000 TL) aştığı halde KYC eksik.');
    }

    if (amount >= 500000 && !payerMatchesCustomer) {
      redFlags.push('Yüksek değerli işlemde gönderen ile alıcı kimliği uyuşmuyor; açıklanamayan üçüncü kişi riski.');
    }

    if (redFlags.length > 0) {
      return {
        level: 'RED',
        action: 'REVIEW_HOLD',
        freezeDelivery: true,
        redFlags,
        amberFlags,
        strEvaluationRequired: true,
        summary: 'RED != suç hükmü; teslimi durdur, iç AML incelemesi başlat ve gerekiyorsa MASAK ŞİB değerlendirmesi yap.',
      };
    }

    if (amberFlags.length > 0) {
      return {
        level: 'AMBER',
        action: 'REVIEW_REQUIRED',
        freezeDelivery: false,
        redFlags: [],
        amberFlags,
        summary: 'İşlem ek inceleme gerektirir; açıklamalar ve ilişkiler doğrulanmalıdır.',
      };
    }

    return {
      level: 'GREEN',
      action: 'PASS',
      freezeDelivery: false,
      redFlags: [],
      amberFlags: [],
      summary: 'AML kontrolleri tam, şüpheli işlem göstergesi bulunmuyor.',
    };
  }
};

/**
 * 11. EVIDENCE_PROVENANCE_ENGINE & HASH_AND_TIMESTAMP_ENGINE
 */
const EVIDENCE_PROVENANCE_ENGINE = {
  createRecord({ sourceId, originalFilename, mimeType, sizeBytes, rawContent, sourceOrigin, sourceEventAt }) {
    const hash = sha256(rawContent);
    return {
      sourceId,
      originalFilename,
      mimeType,
      sizeBytes,
      sha256: hash,
      sourceEventAt: sourceEventAt || new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      sourceOrigin: sourceOrigin || 'BANK_ORIGINATED', // BANK_ORIGINATED | CUSTOMER_RECEIPT | MERCHANT_ENTERED | STORE_SYSTEM
      vaultRef: `vault://evidence/${sourceId}/${hash}`,
    };
  }
};

const HASH_AND_TIMESTAMP_ENGINE = {
  computeManifestRoot(sources = [], linkageMatrix = {}) {
    const sortedHashes = sources
      .map(s => s.sha256)
      .filter(Boolean)
      .sort();
    const matrixHash = sha256(linkageMatrix);
    const combined = sortedHashes.join(':') + '::' + matrixHash;
    return sha256(combined);
  },

  verifyTimestampToken(timestampToken) {
    if (!timestampToken) {
      return { status: 'NO_TIMESTAMP', isVerified: false, reportableStatus: 'NO_TIMESTAMP' };
    }
    // Hard Rule: PENDING durum asla VERIFIED olarak sunulamaz!
    if (timestampToken.status === 'PENDING') {
      return {
        status: 'PENDING',
        isVerified: false,
        reportableStatus: 'PENDING (Doğrulanmadı)',
        timestampProof: null,
      };
    }
    if (timestampToken.status === 'VERIFIED' && timestampToken.otsProof) {
      return {
        status: 'VERIFIED',
        isVerified: true,
        reportableStatus: 'VERIFIED (Doğrulandı)',
        otsProof: timestampToken.otsProof,
        anchoredAt: timestampToken.anchoredAt,
      };
    }
    return { status: 'FAILED', isVerified: false, reportableStatus: 'FAILED (Geçersiz Zaman Damgası)' };
  }
};

/**
 * 12. RETENTION_AND_ACCESS_CONTROL
 */
const RETENTION_AND_ACCESS_CONTROL = {
  enforceMasakRetention(recordDate = new Date()) {
    const config = getComplianceConfig(recordDate);
    const retainUntil = new Date(recordDate);
    retainUntil.setFullYear(retainUntil.getFullYear() + config.rules.MASAK_RETENTION_YEARS);
    return {
      retentionYears: config.rules.MASAK_RETENTION_YEARS,
      retainUntil: retainUntil.toISOString(),
      legalBasis: '5549 sayılı MASAK Kanunu m. 8 ve Yönetmelik uyarınca 8 yıl muhafaza zorunluluğu.',
    };
  }
};

/**
 * 13. ROLLBACK_AND_CORRECTION_ENGINE
 */
const ROLLBACK_AND_CORRECTION_ENGINE = {
  supersedeReport(previousReport, newDetails, actorUser) {
    if (!previousReport) throw new Error('Önceki rapor bulunamadı.');
    const updatedHistory = previousReport.auditHistory || [];
    updatedHistory.push({
      action: 'SUPERSEDED',
      previousReportHash: previousReport.manifestRootSha256 || previousReport.hash,
      supersededAt: new Date().toISOString(),
      supersededBy: actorUser || 'SYSTEM_ADMIN',
      reason: newDetails.reason || 'Düzeltme / güncellenmiş delil sunumu',
    });

    const newVersion = {
      ...previousReport,
      ...newDetails,
      version: (Number(previousReport.version || 1) + 1).toString(),
      isSuperseded: false,
      supersedesReportId: previousReport.reportId,
      auditHistory: updatedHistory,
      generatedAt: new Date().toISOString(),
    };

    return {
      previousReportMarked: { ...previousReport, isSuperseded: true, supersededAt: new Date().toISOString() },
      newReport: newVersion,
    };
  }
};

module.exports = {
  sha256,
  isValidTCKN,
  isValidVKN,
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
  ROLLBACK_AND_CORRECTION_ENGINE,
};
