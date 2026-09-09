/**
 * Verification Test: Corporate Invoices (VKN 10-digits), Company Title (Unvan), Tax Office & Address Parsing
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== TESTING CORPORATE INVOICE: UNVAN, VKN, VERGI DAIRESI & ADDRESS RESOLUTION ===\n');

// 1. Test GIB Template Rendering (gib-template.js)
const { renderOfficialGibHtml } = require('../functions/gib-template');

// Test Case 1: Corporate Customer (10-digit VKN)
const corporateInvoiceHtml = renderOfficialGibHtml({
  invoiceNumber: 'GIB2026000000042',
  ettn: 'b8249a97-44ac-4218-9f9b-9120679d8707',
  invoiceDate: '2026-09-08',
  invoiceTime: '17:11',
  customerName: 'Ahmet Karatay',
  companyName: 'KONYA ALTIN VE ZİYNET TİC. A.Ş.',
  customerIdentity: '6231951309', // 10 haneli VKN
  taxOffice: 'Mevlana Vergi Dairesi',
  customerAddress: 'FEVZİÇAKMAK MAH. 10432. SK. NO: 2 A KARATAY/ KONYA',
  customerPhone: '05000000000',
  totalAmount: 1147125,
  items: [
    { name: '22 AYAR ATA ALTIN (x25) (Kıymetli Maden Bedeli - Özel Matrah)', qty: 1, unitPrice: 1132750, lineTotal: 1132750, kdvRate: 0 },
    { name: 'İşçilik', qty: 1, unitPrice: 14375, lineTotal: 14375, kdvRate: 20, kdvTutari: 2875 }
  ]
});

assert(corporateInvoiceHtml.includes('KONYA ALTIN VE ZİYNET TİC. A.Ş.'),
  'FAIL: Corporate company name / unvan must be printed under SAYIN');
assert(corporateInvoiceHtml.includes('Vergi Dairesi: Mevlana Vergi Dairesi'),
  'FAIL: Vergi Dairesi must be rendered for the buyer');
assert(corporateInvoiceHtml.includes('VKN: 6231951309'),
  'FAIL: VKN label and number must be rendered');
assert(corporateInvoiceHtml.includes('FEVZİÇAKMAK MAH. 10432. SK. NO: 2 A KARATAY/ KONYA'),
  'FAIL: Full address must be preserved');
console.log('✅ PASS 1: gib-template.js correctly renders Company Unvan, Tax Office, and VKN for corporate invoice');

// Test Case 2: Individual Customer (11-digit TCKN)
const individualInvoiceHtml = renderOfficialGibHtml({
  invoiceNumber: 'GIB2026000000043',
  ettn: 'a1234567-44ac-4218-9f9b-9120679d8708',
  invoiceDate: '2026-09-08',
  customerName: 'Zeynep Yıldız',
  customerIdentity: '32395613664', // 11 haneli TCKN
  customerAddress: 'Atatürk Cad. No:10 Konak İzmir',
  totalAmount: 25000,
  items: [
    { name: '22 Ayar Bilezik', qty: 1, unitPrice: 25000, lineTotal: 25000, kdvRate: 0 }
  ]
});

assert(individualInvoiceHtml.includes('Zeynep Yıldız'),
  'FAIL: Individual customer name must be printed under SAYIN');
assert(individualInvoiceHtml.includes('TCKN: 32395613664'),
  'FAIL: TCKN label and number must be rendered');
console.log('✅ PASS 2: gib-template.js correctly renders individual customer name and TCKN');

// 2. Test createDraftInvoice in EarsivPortalService (Mock mode)
const { EarsivPortalService } = require('../functions/earsiv-service');
const service = new EarsivPortalService();

async function testDraftService() {
  const result = await service.createDraftInvoice('MOCK_GIB_TOKEN_123', {
    orderId: 'MGS-20260908-9999',
    customerName: 'Firma Yetkilisi',
    companyName: 'ÖZDEMİR KUYUMCULUK SAN. VE TİC. LTD. ŞTİ.',
    customerIdentity: '6231951309', // 10 haneli VKN
    taxOffice: 'Mevlana Vergi Dairesi',
    customerAddress: 'FEVZİÇAKMAK MAH. 10432. SK. NO: 2 A KARATAY/ KONYA',
    totalAmount: 50000,
    items: [
      { name: '22 Ayar Bilezik', qty: 1, price: 50000 }
    ]
  });

  const payload = result.invoicePayload;
  assert.strictEqual(payload.vknTckn, '6231951309', 'FAIL: vknTckn must be 6231951309');
  assert.strictEqual(payload.aliciUnvan, 'ÖZDEMİR KUYUMCULUK SAN. VE TİC. LTD. ŞTİ.',
    'FAIL: aliciUnvan must not be empty for 10-digit VKN, must be official company title');
  assert.strictEqual(payload.aliciAdi, '', 'FAIL: aliciAdi must be empty for 10-digit VKN in GIB e-Arşiv');
  assert.strictEqual(payload.aliciSoyadi, '', 'FAIL: aliciSoyadi must be empty for 10-digit VKN in GIB e-Arşiv');
  assert.strictEqual(payload.vergiDairesi, 'Mevlana Vergi Dairesi', 'FAIL: vergiDairesi must match');
  assert.strictEqual(payload.sehir, 'Konya', 'FAIL: sehir must be resolved to Konya from address');
  assert.strictEqual(payload.mahalleSemtIlce, 'Karatay', 'FAIL: ilce must be resolved to Karatay from address');
  console.log('✅ PASS 3: EarsivPortalService.createDraftInvoice sets aliciUnvan, vergiDairesi, and resolves Konya/Karatay without forcing Buca/İzmir');

  // Test individual TCKN in draft
  const individualResult = await service.createDraftInvoice('MOCK_GIB_TOKEN_123', {
    orderId: 'BLG-2026-1001',
    customerName: 'Mehmet Demir',
    customerIdentity: '12345678901',
    customerAddress: 'Bağdat Cad. No:44 Kadıköy / İstanbul',
    totalAmount: 10000,
    items: [{ name: 'Çeyrek Altın', qty: 1, price: 10000 }]
  });

  const indPayload = individualResult.invoicePayload;
  assert.strictEqual(indPayload.vknTckn, '12345678901');
  assert.strictEqual(indPayload.aliciAdi, 'Mehmet');
  assert.strictEqual(indPayload.aliciSoyadi, 'Demir');
  assert.strictEqual(indPayload.sehir, 'İstanbul');
  assert.strictEqual(indPayload.mahalleSemtIlce, 'Kadıköy');
  console.log('✅ PASS 4: EarsivPortalService.createDraftInvoice formats individual TCKN and resolves İstanbul/Kadıköy');
}

// 3. Check HTML and JS source files for presence of fields
const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
assert(adminHtml.includes('id="storeCustCompanyName"'), 'FAIL: admin.html must have storeCustCompanyName');
assert(adminHtml.includes('id="storeCustTaxOffice"'), 'FAIL: admin.html must have storeCustTaxOffice');
assert(adminHtml.includes('id="cfgModalCompanyNameInput"'), 'FAIL: admin.html must have cfgModalCompanyNameInput');
assert(adminHtml.includes('id="cfgModalTaxOfficeInput"'), 'FAIL: admin.html must have cfgModalTaxOfficeInput');
console.log('✅ PASS 5: admin.html contains corporate title, tax office, and modal input fields');

const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
assert(adminJs.includes('storeCustCompanyName'), 'FAIL: admin.js must query storeCustCompanyName');
assert(adminJs.includes('storeCustTaxOffice'), 'FAIL: admin.js must query storeCustTaxOffice');
assert(adminJs.includes('cfgModalCompanyNameInput'), 'FAIL: admin.js must query cfgModalCompanyNameInput');
assert(adminJs.includes('cfgModalTaxOfficeInput'), 'FAIL: admin.js must query cfgModalTaxOfficeInput');
console.log('✅ PASS 6: js/admin.js reads and synchronizes company name and tax office fields');

testDraftService().then(() => {
  console.log('\n🌟 ALL 6 CORPORATE INVOICE VERIFICATION CHECKS PASSED!\n');
}).catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
