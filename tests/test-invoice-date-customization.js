const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { EarsivPortalService, formatToGibDate } = require('../functions/earsiv-service');
const { renderOfficialGibHtml } = require('../functions/gib-template');

console.log('=== TEST: FATURA TARİHİ ÖZELLEŞTİRME VE GİB ENTEGRASYON DOĞRULAMASI ===\n');

// 1. formatToGibDate testleri - Kullanıcının yazdığı "11 .9.2026" dahil tüm varyasyonlar
assert.strictEqual(formatToGibDate('2026-09-11'), '11/09/2026', 'YYYY-MM-DD -> DD/MM/YYYY olmalı');
assert.strictEqual(formatToGibDate('11.09.2026'), '11/09/2026', 'DD.MM.YYYY -> DD/MM/YYYY olmalı');
assert.strictEqual(formatToGibDate('11 .9.2026'), '11/09/2026', 'Boşluklu ve tek basamaklı ay "11 .9.2026" -> 11/09/2026 olmalı');
assert.strictEqual(formatToGibDate('11.9.2026'), '11/09/2026', 'Tek basamaklı ay "11.9.2026" -> 11/09/2026 olmalı');
assert.strictEqual(formatToGibDate('1.9.2026'), '01/09/2026', 'Tek basamaklı gün ve ay "1.9.2026" -> 01/09/2026 olmalı');
assert.strictEqual(formatToGibDate('11/09/2026'), '11/09/2026', 'DD/MM/YYYY korunmalı');
assert.strictEqual(formatToGibDate('11-09-2026'), '11/09/2026', 'DD-MM-YYYY -> DD/MM/YYYY olmalı');
console.log('✅ TEST 1: formatToGibDate kullanıcının girdiği "11 .9.2026" dahil tüm varyasyonları hatasız DD/MM/YYYY formatına çeviriyor.');

// 2. EarsivPortalService.createDraftInvoice içinde faturaTarihi testi (Mock Token)
async function testCreateDraftInvoiceDate() {
  const service = new EarsivPortalService();

  // 11 .9.2026 tarihi girildiğinde
  const resultUser = await service.createDraftInvoice('MOCK_GIB_TOKEN_TEST', {
    orderId: 'MGS-20260911-0001',
    totalAmount: 15000,
    customerName: 'Fırat Çetin',
    customerIdentity: '23947681842',
    invoiceDate: '11 .9.2026',
    items: [{ name: '22 Ayar Altın Bilezik', qty: 1, unitPrice: 15000, lineTotal: 15000 }]
  });

  assert.strictEqual(resultUser.invoiceDate, '11/09/2026', 'Kullanıcının girdiği 11 .9.2026 GİB için 11/09/2026 olmalıdır');
  assert.strictEqual(resultUser.invoicePayload.faturaTarihi, '11/09/2026', 'GİB payload faturaTarihi 11/09/2026 olmalıdır');

  // YYYY-MM-DD 2026-09-11 girildiğinde
  const result1 = await service.createDraftInvoice('MOCK_GIB_TOKEN_TEST', {
    orderId: 'MGS-20260911-1234',
    totalAmount: 15000,
    customerName: 'Ahmet Yılmaz',
    customerIdentity: '11111111111',
    invoiceDate: '2026-09-11',
    items: [{ name: '22 Ayar Bilezik', qty: 1, unitPrice: 15000, lineTotal: 15000 }]
  });

  assert.strictEqual(result1.invoiceDate, '11/09/2026', 'Mock dönen invoiceDate 11/09/2026 olmalı');
  assert.strictEqual(result1.invoicePayload.faturaTarihi, '11/09/2026', 'GİB payload faturaTarihi 11/09/2026 olmalı');

  console.log('✅ TEST 2: EarsivPortalService.createDraftInvoice kullanıcının girdiği fatura tarihini ("11 .9.2026") GİB e-Arşiv taslağına eksiksiz işliyor.');
}

// 3. renderOfficialGibHtml şablon testi ("11 .9.2026" ile)
function testGibTemplateDate() {
  const html = renderOfficialGibHtml({
    invoiceNumber: 'GIB2026000000052',
    invoiceDate: '11 .9.2026',
    invoiceTime: '14:30',
    customerName: 'Fırat Çetin',
    customerIdentity: '23947681842',
    totalAmount: 98500,
    items: [{ name: '22 Ayar Altın Bilezik', qty: 1, birimFiyat: 98500, fiyat: 98500, kdvOrani: 0 }]
  });

  assert(html.includes('11-09-2026 14:30'), 'Orijinal faturada 11-09-2026 14:30 tarihi yer almalıdır');
  console.log('✅ TEST 3: renderOfficialGibHtml şablon çıktısında kullanıcının girdiği tarih ("11 .9.2026" -> 11-09-2026) başarıyla görüntüleniyor.');
}

// 4. Kod Bütünlüğü Kontrolü (admin.js & functions/index.js)
function testCodeIntegrity() {
  const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
  assert(adminJs.includes('invoiceDate: invoiceDateVal'), 'js/admin.js draftRes gövdesine invoiceDate eklemelidir');
  assert(adminJs.includes('invoiceDate: invoiceDateForSign'), 'js/admin.js sign gövdesine invoiceDate eklemelidir');

  const functionsIndex = fs.readFileSync(path.join(__dirname, '../functions/index.js'), 'utf8');
  assert(functionsIndex.includes('if (req.body.invoiceDate) order.invoiceDate = req.body.invoiceDate;'), 'functions/index.js invoiceDate atamasını desteklemelidir');
  assert(functionsIndex.includes('invoiceDocDate = orderData?.invoiceDate'), 'functions/index.js sign işleminde invoiceDocDate taşımalıdır');

  console.log('✅ TEST 4: js/admin.js ve functions/index.js üzerinde tarih aktarım zinciri %100 doğrulandı.');
}

(async function run() {
  await testCreateDraftInvoiceDate();
  testGibTemplateDate();
  testCodeIntegrity();
  console.log('\n🌟 TÜM 4 FATURA TARİHİ DOĞRULAMA TESTİ EKSİKSİZ BAŞARILI!');
})();
