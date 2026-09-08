'use strict';

const assert = require('assert');
const {
  PaymentEvidenceRouter,
  BankTransferEngine,
  CashEngine,
  CUSTOMER_KYC_ENGINE,
  CONNECTED_TRANSACTION_ENGINE,
  PRODUCT_STOCK_ENGINE,
  INVOICE_ENGINE,
  REFUND_BUYBACK_ENGINE,
  HASH_AND_TIMESTAMP_ENGINE,
  generateBankTransferDeclarationText,
  generateCashDeclarationText,
  ROLLBACK_AND_CORRECTION_ENGINE,
} = require('../functions/cash-bank-evidence');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

console.log('=== BELGİN KUYUMCULUK — NAKİT & BANKA HAVALESİ DELİL MOTORU TEST SUITE ===\n');

// TEST 1: 35.000 TL CASH_COUNTER -> BLOCK / BANK_REQUIRED
runTest('Acceptance Test 1: 35.000 TL CASH_COUNTER -> BLOCK / BANK_REQUIRED', () => {
  const engine = new CashEngine();
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-CASH-35K',
      amount: 35000,
      customerName: 'Ahmet Yılmaz',
      paymentMethod: 'CASH_COUNTER',
    },
    date: '2026-09-08T10:00:00.000Z',
  });

  assert.strictEqual(res.cashBlocked, true, '35.000 TL nakit blokajı olmalı');
  assert.strictEqual(res.state, 'BANK_REQUIRED', 'Durum BANK_REQUIRED olmalı');
  assert.ok(res.cashBlockReason.includes('iç politika nakit kabul sınırını'), 'Gerekçe iç politika sınırı içermeli');
});

// TEST 2: 20.000 + 15.000 aynı gün aynı müşteri -> ikinci işlem CASH_BLOCKED
runTest('Acceptance Test 2: 20.000 + 15.000 aynı gün aynı müşteri -> ikinci işlem CASH_BLOCKED', () => {
  const engine = new CashEngine();
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-CASH-15K',
      amount: 15000,
      customerName: 'Mehmet Demir',
      paymentMethod: 'CASH_COUNTER',
    },
    historicalOrders: [
      {
        id: 'ORD-CASH-20K',
        amount: 20000,
        customerRef: 'Mehmet Demir',
        createdAt: '2026-09-08T09:00:00.000Z',
      }
    ],
    date: '2026-09-08T14:00:00.000Z',
  });

  assert.strictEqual(res.cashBlocked, true, 'Aynı gün toplam 35.000 TL olunca blokaj olmalı');
  assert.strictEqual(res.state, 'BANK_REQUIRED');
  assert.ok(res.cashBlockReason.includes('Aynı gün aynı müşteriyle yapılan toplam nakit işlem tutarı'), 'Aynı gün toplam gerekçesi içermeli');
});

// TEST 3: 100.000 TL toplam sözleşme, 10.000 TL taksit -> her taksit BANK_REQUIRED
runTest('Acceptance Test 3: 100.000 TL toplam sözleşme, 10.000 TL taksit -> her taksit BANK_REQUIRED', () => {
  const engine = new CashEngine();
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-TAKSIT-1',
      amount: 10000,
      contractTotal: 100000,
      customerName: 'Selin Kaya',
      paymentMethod: 'CASH_COUNTER',
    },
    date: '2026-09-08T11:00:00.000Z',
  });

  assert.strictEqual(res.cashBlocked, true, 'Sözleşme 100K ise 10K taksit elden alınamaz');
  assert.strictEqual(res.state, 'BANK_REQUIRED');
  assert.ok(res.cashBlockReason.includes('Toplam sözleşme bedeli'), 'Sözleşme bedeli tevsik uyarısı içermeli');
});

// TEST 4: 500.000 TL EFT, sender=buyer, KYC/fatura/stok/teslim tam -> GREEN candidate
runTest('Acceptance Test 4: 500.000 TL EFT, sender=buyer, KYC/fatura/stok/teslim tam -> GREEN candidate', () => {
  const engine = new BankTransferEngine();
  const validTckn = '10000000146'; // geçerli test TCKN
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-EFT-500K',
      amount: 500000,
      customerName: 'Burak Özkan',
      items: [{ sku: 'GOLD-BAR-100G', name: '100g Altın Külçe', qty: 1 }],
      paymentMethod: 'EFT',
    },
    bankTransferRaw: {
      sourceOrigin: 'BANK_ORIGINATED',
      settlementStatus: 'SETTLED',
      amount: 500000,
      senderName: 'Burak Özkan',
      senderIban: 'TR330006100511123456789012',
      bankTransactionReference: 'EFT-REF-998877',
      bookingTimestamp: '2026-09-08T10:00:00.000Z',
    },
    invoice: {
      ettn: 'b7a3e9c2-5555-4444-9999-000011112222',
      invoiceNumber: 'BLG2026000000123',
      totalAmount: 500000,
      payableAmount: 500000,
      lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 492500 }, { description: 'İşçilik', amount: 7500 }],
      issueDate: '2026-09-08T10:05:00.000Z',
    },
    kyc: {
      fullName: 'Burak Özkan',
      tckn: validTckn,
      birthDate: '1985-05-12',
      birthPlace: 'İzmir',
      idDocType: 'TC_KIMLIK_KARTI',
      idDocNumber: 'A12B34567',
      address: 'Buca, İzmir',
      profession: 'Mühendis',
      hasWetSignature: true,
    },
    stockRecord: {
      dischargedAt: '2026-09-08T10:10:00.000Z',
      referenceNo: 'STK-OUT-5001',
    },
    wetDeliveryRecord: {
      recipientVerified: true,
      recipientName: 'Burak Özkan',
      hasSignature: true,
      protocolRef: 'DLV-PRT-5001',
      signedAt: '2026-09-08T10:15:00.000Z',
    },
    accountingEntry: {
      voucherNo: 'YEV-2026-0089',
      voucherDate: '2026-09-08',
      entries: [
        { account: '102.01 Banka', debit: 500000, credit: 0 },
        { account: '600.01 Satışlar', debit: 0, credit: 492500 },
        { account: '600.02 İşçilik', debit: 0, credit: 6250 },
        { account: '391.01 KDV', debit: 0, credit: 1250 },
      ]
    },
    timestampToken: {
      status: 'VERIFIED',
      otsProof: 'OTS_PROOF_BYTES_VALIDATED',
      anchoredAt: '2026-09-08T10:20:00.000Z',
    },
  });

  assert.strictEqual(res.isGreenCandidate, true, 'GREEN adayı olmalı');
  assert.strictEqual(res.amlResult.level, 'GREEN');
  assert.strictEqual(res.state, 'ACCOUNTING_RECONCILED');
  assert.strictEqual(res.linkageMatrix.link01_personToKyc, 'PASS');
  assert.strictEqual(res.linkageMatrix.link03_customerToSender, 'PASS');
  assert.strictEqual(res.linkageMatrix.link04_senderToBankRecord, 'PASS');
});

// TEST 5: 500.000 TL EFT, sender!=buyer -> REVIEW_HOLD
runTest('Acceptance Test 5: 500.000 TL EFT, sender!=buyer -> REVIEW_HOLD', () => {
  const engine = new BankTransferEngine();
  const validTckn = '10000000146';
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-EFT-3RD-PARTY',
      amount: 500000,
      customerName: 'Alıcı Canan Yıldız',
      items: [{ sku: 'GOLD-BAR-100G', name: '100g Külçe' }],
      paymentMethod: 'EFT',
    },
    bankTransferRaw: {
      sourceOrigin: 'BANK_ORIGINATED',
      settlementStatus: 'SETTLED',
      amount: 500000,
      senderName: 'Farklı Kişi Ali Veli',
      senderIban: 'TR330006100511123456789099',
      bookingTimestamp: '2026-09-08T10:00:00.000Z',
    },
    kyc: {
      fullName: 'Canan Yıldız',
      tckn: validTckn,
      birthDate: '1990-01-01',
      birthPlace: 'Ankara',
      idDocType: 'TC_KIMLIK_KARTI',
      idDocNumber: 'C99D88776',
      address: 'Alsancak, İzmir',
      profession: 'Avukat',
      hasWetSignature: true,
    },
    stockRecord: { dischargedAt: '2026-09-08T10:10:00.000Z', referenceNo: 'STK-5002' },
    invoice: { ettn: 'abc-123', invoiceNumber: 'BLG1', payableAmount: 500000, lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 500000 }] },
  });

  assert.strictEqual(res.state, 'REVIEW_HOLD', 'Alıcı ile gönderen farklı ise REVIEW_HOLD olmalı');
  assert.strictEqual(res.amlResult.level, 'RED', '500K üçüncü kişi doğrudan RED risk flag tetiklemeli');
  assert.strictEqual(res.linkageMatrix.link03_customerToSender, 'FAIL');
});

// TEST 6: Banka ekran görüntüsü var fakat merchant bank kaydı yok -> PAYMENT_UNVERIFIED
runTest('Acceptance Test 6: Banka ekran görüntüsü var fakat merchant bank kaydı yok -> PAYMENT_UNVERIFIED', () => {
  const engine = new BankTransferEngine();
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-NO-BANK-RECORD',
      amount: 50000,
      customerName: 'Kadir Güneş',
      paymentMethod: 'EFT',
    },
    bankTransferRaw: null, // Bankada kayıt yok, yalnız dekont gelmiş
  });

  assert.ok(res.errors.some(e => e.includes('PAYMENT_UNVERIFIED')), 'PAYMENT_UNVERIFIED hatası üretilmeli');
  assert.strictEqual(res.linkageMatrix.link04_senderToBankRecord, 'FAIL');
  assert.strictEqual(res.deliveryReadiness.ready, false);
});

// TEST 7: KYC eşik/risk gerektiriyor fakat kimlik eksik -> DELIVERY_BLOCKED
runTest('Acceptance Test 7: KYC eşik/risk gerektiriyor fakat kimlik eksik -> DELIVERY_BLOCKED', () => {
  const engine = new BankTransferEngine();
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-HIGH-NO-KYC',
      amount: 250000, // 185.000 TL üzeri MASAK eşiği
      customerName: 'Kemal Aksoy',
      paymentMethod: 'EFT',
    },
    bankTransferRaw: {
      settlementStatus: 'SETTLED',
      amount: 250000,
      senderName: 'Kemal Aksoy',
    },
    kyc: null, // Kimlik yok
    stockRecord: { dischargedAt: '2026-09-08T10:10:00.000Z', referenceNo: 'STK-5003' },
    invoice: { ettn: 'abc-777', invoiceNumber: 'BLG2', payableAmount: 250000, lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 250000 }] },
  });

  assert.strictEqual(res.deliveryReadiness.ready, false, 'Teslimat hazır olmamalı');
  assert.strictEqual(res.deliveryReadiness.status, 'DELIVERY_BLOCKED');
  assert.ok(res.errors.some(e => e.includes('Zorunlu KYC eksikliği')), 'Zorunlu KYC durdurma kuralı tetiklenmeli');
});

// TEST 8: Şirket alıcı, bireysel ödeyen, yetki/ilişki yok -> REVIEW_HOLD
runTest('Acceptance Test 8: Şirket alıcı, bireysel ödeyen, yetki/ilişki yok -> REVIEW_HOLD', () => {
  const engine = new BankTransferEngine();
  const res = engine.processOrderEvidence({
    order: {
      id: 'ORD-CORP-INDIVIDUAL',
      amount: 150000,
      isCompany: true,
      companyTitle: 'ABC Kuyumculuk Ltd. Şti.',
      paymentMethod: 'EFT',
    },
    bankTransferRaw: {
      settlementStatus: 'SETTLED',
      amount: 150000,
      senderName: 'Bireysel Şahıs Zeki',
      senderType: 'INDIVIDUAL',
    },
    kyc: {
      companyTitle: 'ABC Kuyumculuk Ltd. Şti.',
      vkn: '1234567890',
      mersisNo: '0123456789000014',
      tradeRegistryNo: 'TR-12345',
      businessActivity: 'Mücevherat',
      registeredAddress: 'Konak, İzmir',
      representative: {
        fullName: 'Zeki Temsilci',
        tckn: '10000000146',
        birthDate: '1980-01-01',
        birthPlace: 'İzmir',
        idDocType: 'TC_KIMLIK_KARTI',
        idDocNumber: 'Z111',
        address: 'İzmir',
        profession: 'Müdür',
        hasWetSignature: true,
      },
      authorityDocument: null, // Yetki belgesi eksik
    },
    thirdPartyJustification: null, // İlişki beyanı yok
  });

  assert.strictEqual(res.state, 'REVIEW_HOLD', 'Şirket/bireysel yetkisiz ödeme REVIEW_HOLD olmalı');
});

// TEST 9: İade farklı IBAN\'a isteniyor -> AML_REVIEW
runTest('Acceptance Test 9: İade farklı IBAN\'a isteniyor -> AML_REVIEW', () => {
  const refundEval = REFUND_BUYBACK_ENGINE.evaluateRefund({
    originalSenderIban: 'TR330006100511123456789001',
    refundDestinationIban: 'TR990001500158007301000999',
    isSameAccount: false,
    amount: 100000,
    legalJustification: null,
    amlApproval: null,
  });

  assert.strictEqual(refundEval.status, 'AML_REVIEW', 'Farklı IBAN AML_REVIEW durumuna düşmeli');
  assert.strictEqual(refundEval.route, 'BLOCKED', 'Onaysız iade bloke edilmeli');
});

// TEST 10: OTS/harici timestamp PENDING -> raporda VERIFIED yazılamaz
runTest('Acceptance Test 10: OTS/harici timestamp PENDING -> raporda VERIFIED yazılamaz', () => {
  const tsCheck = HASH_AND_TIMESTAMP_ENGINE.verifyTimestampToken({
    status: 'PENDING',
    token: 'OTS_PENDING_TX',
  });

  assert.strictEqual(tsCheck.isVerified, false, 'Pending token doğrulanmış sayılamaz');
  assert.ok(tsCheck.reportableStatus.includes('PENDING (Doğrulanmadı)'), 'Raporda Doğrulanmadı ifadesi yer almalı');
  assert.ok(!tsCheck.reportableStatus.includes('VERIFIED (Doğrulandı)'), 'VERIFIED yazılamaz');
});

// TEST 11: Fatura toplamı != banka tahsilatı -> FAIL
runTest('Acceptance Test 11: Fatura toplamı != banka tahsilatı -> FAIL', () => {
  const invoiceRes = INVOICE_ENGINE.validateInvoice({
    invoiceRecord: {
      ettn: 'ettn-112233',
      invoiceNumber: 'BLG-INV-99',
      payableAmount: 500000,
      lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 500000 }],
    },
    settledAmount: 490000, // 10.000 TL eksik tahsilat
  });

  assert.strictEqual(invoiceRes.valid, false, 'Tutar uyuşmazlığında fatura geçersiz sayılmalı');
  assert.strictEqual(invoiceRes.status, 'FAIL');
  assert.ok(invoiceRes.reason.includes('ile tahsil edilen tutar'));
});

// TEST 12: Stok çıkışı yok -> DELIVERY_BLOCKED
runTest('Acceptance Test 12: Stok çıkışı yok -> DELIVERY_BLOCKED', () => {
  const stockRes = PRODUCT_STOCK_ENGINE.verifyStockDischarge({
    items: [{ sku: 'GOLD-BRACELET-22K', name: '22 Ayar Bilezik' }],
    stockDeductionRecord: null, // Stok çıkışı yok
  });

  assert.strictEqual(stockRes.verified, false, 'Stok çıkışı olmadan doğrulanamaz');
  assert.strictEqual(stockRes.status, 'DELIVERY_BLOCKED');
  assert.ok(stockRes.reason.includes('DELIVERY_BLOCKED: Stok çıkışı henüz onaylanmadı'));
});

// EXTRA TEST 13: AGENTS.md kuralı — Faturada "has altın" geçerse FAIL
runTest('Extra Test 13: AGENTS.md kuralı — Faturada "has altın" geçerse FAIL', () => {
  const invoiceRes = INVOICE_ENGINE.validateInvoice({
    invoiceRecord: {
      ettn: 'ettn-has-gold-error',
      invoiceNumber: 'BLG-INV-FAIL',
      payableAmount: 100000,
      lines: [{ description: 'Has Altın Satışı', amount: 100000 }],
    },
    settledAmount: 100000,
  });

  assert.strictEqual(invoiceRes.valid, false);
  assert.strictEqual(invoiceRes.status, 'FAIL');
  assert.ok(invoiceRes.reason.includes('has altın'));
});

// EXTRA TEST 14: Router delegation — CARD işlemi mevcut kart motoruna yönlenir
runTest('Extra Test 14: Router — CARD işlemi mevcut kart motoruna yönlenir', () => {
  const router = new PaymentEvidenceRouter();
  const routeRes = router.route('CARD');
  assert.strictEqual(routeRes.target, 'EXISTING_CARD_ENGINE');
  assert.strictEqual(routeRes.action, 'DELEGATE_TO_CARD_ENGINE');

  const procRes = router.process({ paymentMethod: 'CREDIT_CARD' });
  assert.strictEqual(procRes.delegated, true);
});

// EXTRA TEST 15: Standart İmzalı Beyan Metinleri Üretimi
runTest('Extra Test 15: Yasal Beyanname Metinleri Standart Formatı', () => {
  const transferDecl = generateBankTransferDeclarationText({
    buyerName: 'Ahmet Karaca',
    buyerTckn: '10000000146',
    phone: '05551112233',
    profession: 'Kuyumcu',
    senderName: 'Ahmet Karaca',
    orderRef: 'BLG-ORD-7788',
  });
  assert.ok(transferDecl.declarationText.includes('Siparişe konu altın ürünlerini mağazada görerek ve kontrol ederek eksiksiz teslim aldım'));
  assert.ok(transferDecl.declarationText.includes('Satış bedelini banka havalesi/EFT/FAST yoluyla ödedim'));

  const cashDecl = generateCashDeclarationText({
    buyerName: 'Veli Yurt',
    amount: 25000,
    orderRef: 'BLG-ORD-9900',
  });
  assert.ok(cashDecl.declarationText.includes('Satış bedelini nakden ödedim'));
  assert.ok(cashDecl.fields.amountStr.includes('25.000 TL'));
});

// EXTRA TEST 16: Rapor Supersede & Audit Trail İmmutability
runTest('Extra Test 16: Rapor Değiştirilemezliği ve SUPERSEDED Zinciri', () => {
  const originalReport = {
    reportId: 'REP-001',
    version: '1',
    manifestRootSha256: 'a1b2c3d4e5f6',
    status: 'INVOICE_VERIFIED',
  };
  const result = ROLLBACK_AND_CORRECTION_ENGINE.supersedeReport(
    originalReport,
    { status: 'DELIVERED', notes: 'Fiili teslim tamamlandı' },
    'ADMIN_USER_1'
  );

  assert.strictEqual(result.previousReportMarked.isSuperseded, true);
  assert.strictEqual(result.newReport.version, '2');
  assert.strictEqual(result.newReport.supersedesReportId, 'REP-001');
  assert.strictEqual(result.newReport.auditHistory.length, 1);
  assert.strictEqual(result.newReport.auditHistory[0].action, 'SUPERSEDED');
});

console.log(`\n======================================================`);
console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} tests successful.`);
console.log(`======================================================\n`);
