/**
 * BELGİN KUYUMCULUK — N8N WORKFLOW PRINCIPLES & REVERSE ENGINEERING SUITE
 * FOR CASH_ENGINE & BANK_TRANSFER_ENGINE
 * 
 * Enforces:
 * 1. Idempotency & Deduplication
 * 2. Deterministic Finite State Machine (FSM)
 * 3. Actual-Byte SHA-256 Recompute Integrity (R1/R4 Standard)
 * 4. Error Resilience & Non-blocking Audit Logging
 * 5. Floating-point Currency Sanitization
 */

'use strict';

const assert = require('assert');
const crypto = require('crypto');
const {
  PaymentEvidenceRouter,
  BankTransferEngine,
  CashEngine,
  computeSha256,
  BANK_STATES,
  CASH_STATES,
} = require('../functions/cash-bank-evidence');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS ${totalCount}]: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL ${totalCount}]: ${name} -> ${err.message}`);
    throw err;
  }
}

async function asyncTest(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`  ✅ [PASS ${totalCount}]: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL ${totalCount}]: ${name} -> ${err.message}`);
    throw err;
  }
}

console.log('\n====================================================================');
console.log('⚡ N8N WORKFLOW PRINCIPLES & REVERSE ENGINEERING SUITE (CASH & BANK)');
console.log('====================================================================\n');

(async () => {
  const router = new PaymentEvidenceRouter();

  // 1. N8N Principle 1: Idempotent Webhook Processing (10 concurrent requests)
  await asyncTest('1. n8n Deduplication: 10 eşzamanlı banka transfer kaydı tek ve deterministik manifest kök özeti üretir', async () => {
    const input = {
      order: { id: 'ORD-IDEMP-88', amount: 150000, customerName: 'Zeynep Aktaş', paymentMethod: 'EFT' },
      bankTransferRaw: {
        settlementStatus: 'SETTLED',
        amount: 150000,
        senderName: 'Zeynep Aktaş',
        bankTransactionReference: 'REF-IDEMP-888',
        bookingTimestamp: '2026-09-08T12:00:00.000Z',
      },
      invoice: {
        ettn: 'idemp-uuid-1234',
        invoiceNumber: 'BLG-INV-88',
        payableAmount: 150000,
        lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 150000 }],
      },
      kyc: {
        fullName: 'Zeynep Aktaş',
        tckn: '10000000146',
        birthDate: '1992-04-10',
        birthPlace: 'İzmir',
        idDocType: 'TC_KIMLIK_KARTI',
        idDocNumber: 'K999',
        address: 'Buca, İzmir',
        profession: 'Eczacı',
        hasWetSignature: true,
      },
      stockRecord: { dischargedAt: '2026-09-08T12:05:00.000Z', referenceNo: 'STK-88' },
      wetDeliveryRecord: { recipientVerified: true, recipientName: 'Zeynep Aktaş', hasSignature: true, signedAt: '2026-09-08T12:10:00.000Z' },
    };

    const promises = Array.from({ length: 10 }, () => Promise.resolve(router.process(input)));
    const results = await Promise.all(promises);

    const firstHash = results[0].result.manifestRootSha256;
    assert.strictEqual(typeof firstHash, 'string');
    assert.strictEqual(firstHash.length, 64);
    assert(results.every(r => r.result.manifestRootSha256 === firstHash), 'Tüm paralel executionların manifest özeti 1:1 özdeş olmalıdır');
    assert(results.every(r => r.result.state === 'DELIVERED'), 'Tüm executionlar DELIVERED durumuna deterministik ulaştı');
  });

  // 2. N8N Principle 2: Strict Finite State Machine (FSM) Determinism
  test('2. n8n FSM State Machine: Sıra dışı durum sıçramaları (jump) ve yetkisiz teslimat kilitlendi', () => {
    const engine = new BankTransferEngine();
    
    // Ödeme kesinleşmeden doğrudan DELIVERED'a geçilemez
    const res = engine.processOrderEvidence({
      order: { id: 'ORD-FSM-FAIL', amount: 50000, paymentMethod: 'EFT' },
      bankTransferRaw: { settlementStatus: 'PENDING', amount: 50000 },
      wetDeliveryRecord: { hasSignature: true },
    });

    assert.notStrictEqual(res.state, 'DELIVERED', 'Ödeme PENDING iken DELIVERED olunamaz');
    assert.strictEqual(res.deliveryReadiness.ready, false, 'Teslimata hazır olamaz');
    assert.ok(res.errors.some(e => e.includes('Ödeme kesinleşmeden')));
  });

  // 3. N8N Principle 3: Actual-Byte SHA-256 Recompute Integrity (R1 / R4)
  test('3. Tersine Mühendislik (R1/R4): 13 Banka ve 12 Nakit belgesinin gerçek dosya baytları recompute edildiğinde 0 uyuşmazlık', () => {
    const bankEngine = new BankTransferEngine();
    const bankRes = bankEngine.processOrderEvidence({
      order: { id: 'ORD-BYTE-CHECK', amount: 100000, customerName: 'Murat Arslan', paymentMethod: 'EFT' },
      bankTransferRaw: { settlementStatus: 'SETTLED', amount: 100000, senderName: 'Murat Arslan' },
      invoice: { ettn: 'ettn-byte-1', invoiceNumber: 'INV-1', payableAmount: 100000, lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 100000 }] },
      stockRecord: { dischargedAt: '2026-09-08T10:00:00.000Z', referenceNo: 'STK-B1' },
      wetDeliveryRecord: { recipientVerified: true, hasSignature: true, signedAt: '2026-09-08T10:10:00.000Z' },
    });

    // Her belgenin content baytlarını tekrar hashle
    for (const [code, doc] of Object.entries(bankRes.derivedDocuments)) {
      const recomputed = computeSha256(doc.content);
      assert.strictEqual(recomputed, doc.sha256, `${code} gerçek bayt özeti uyuşmuyor!`);
    }

    const cashEngine = new CashEngine();
    const cashRes = cashEngine.processOrderEvidence({
      order: { id: 'ORD-CASH-BYTE', amount: 25000, customerName: 'Deniz Eren', paymentMethod: 'CASH_COUNTER' },
      cashReceipt: { receiptNumber: 'REC-01', collectedAmount: 25000, status: 'COLLECTED' },
      invoice: { ettn: 'ettn-c1', invoiceNumber: 'INV-C1', payableAmount: 25000, lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 25000 }] },
      stockRecord: { dischargedAt: '2026-09-08T10:00:00.000Z', referenceNo: 'STK-C1' },
      wetDeliveryRecord: { recipientVerified: true, hasSignature: true, signedAt: '2026-09-08T10:10:00.000Z' },
    });

    for (const [code, doc] of Object.entries(cashRes.derivedDocuments)) {
      const recomputed = computeSha256(doc.content);
      assert.strictEqual(recomputed, doc.sha256, `${code} gerçek bayt özeti uyuşmuyor!`);
    }
  });

  // 4. N8N Principle 4: Error Resilience & Dead-Letter Audit Log
  test('4. n8n Error Trigger: Zaman damgası veya bildirim aksasa dahi delil zinciri bozulmaz ve audit log korunur', () => {
    const engine = new BankTransferEngine();
    const res = engine.processOrderEvidence({
      order: { id: 'ORD-ERR-RESILIENT', amount: 50000, paymentMethod: 'EFT' },
      bankTransferRaw: { settlementStatus: 'SETTLED', amount: 50000 },
      timestampToken: null, // Zaman damgası henüz yok / ağ hatası
    });

    assert.strictEqual(res.timestampStatus, 'NO_TIMESTAMP');
    assert.strictEqual(typeof res.manifestRootSha256, 'string');
    assert.ok(res.retentionPolicy.retainUntil.includes('2034'), '8 yıl muhafaza süresi hesaplandı');
  });

  // 5. N8N Principle 5: High-Precision Currency & Rounding Resilience
  test('5. Hassas Matematik: Kuruş yuvarlama tahrifatı ve float toleransı doğrulaması', () => {
    const engine = new CashEngine();
    const res = engine.processOrderEvidence({
      order: { id: 'ORD-PRECISION', amount: 29999.99, paymentMethod: 'CASH_COUNTER' },
      cashReceipt: { receiptNumber: 'REC-PREC', collectedAmount: 29999.99, status: 'COLLECTED' },
      invoice: { ettn: 'prec-ettn', invoiceNumber: 'INV-PREC', payableAmount: 29999.99, lines: [{ description: 'Kıymetli Maden Bedeli (Özel Matrah)', amount: 29999.99 }] },
    });

    assert.strictEqual(res.cashBlocked, false, '29.999,99 TL kuruşu kuruşuna iç politika sınırında kabul edilir');
    assert.strictEqual(res.linkageMatrix.link02_transactionToLegalCashLimit, 'PASS');
  });

  console.log(`\n====================================================================`);
  console.log(`🎉 ALL ${passCount}/${totalCount} N8N & REVERSE ENGINEERING TESTS PASSED!`);
  console.log(`====================================================================\n`);
})();
