const assert = require('assert');
const { cleanInvoiceProductName, getCleanInvoiceItemsSummary, calculateVip22Breakdown, calculateJewelryInvoiceBreakdown } = require('../functions/earsiv-service');
const { renderOfficialGibHtml } = require('../functions/gib-template');
const { VipEngine } = require('../js/vip-payment');

console.log('\n=== FATURA ÜRÜN ADI TEMİZLİK VE KALICILIK DOĞRULAMA TESTİ ===\n');

// 1. cleanInvoiceProductName Testleri
const testCases = [
  { input: '22 Ayar Bilezik (x1) + İşçilik (x1)', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Bilezik (x1) + İşçilik', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Bilezik (x1)', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Bilezik + İşçilik (x1)', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Bilezik, İşçilik (x1)', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Bilezik, İşçilik', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Bilezik (Kıymetli Maden Bedeli - Özel Matrah)', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Bilezik (Özel Matrah 351)', expected: '22 Ayar Bilezik' },
  { input: '/22', expected: '22 Ayar Bilezik' },
  { input: '22', expected: '22 Ayar Bilezik' },
  { input: '#22', expected: '22 Ayar Bilezik' },
  { input: 'İşçilik', expected: '22 Ayar Bilezik' },
  { input: 'İşçilik (x1)', expected: '22 Ayar Bilezik' },
  { input: '22 Ayar Ajda Bilezik 25 Gr', expected: '22 Ayar Ajda Bilezik 25 Gr' },
  { input: 'Tam Altın (x2) + İşçilik (x1)', expected: 'Tam Altın' },
  { input: 'Rolex Submariner Date', expected: 'Rolex Submariner Date' }
];

testCases.forEach(({ input, expected }) => {
  const result = cleanInvoiceProductName(input);
  assert.strictEqual(result, expected, `cleanInvoiceProductName failed for "${input}" -> got "${result}", expected "${expected}"`);
});
console.log('✅ TEST 1: cleanInvoiceProductName tüm varyasyonlarda (x1) ve + İşçilik kalıntılarını %100 temizliyor.');

// 2. getCleanInvoiceItemsSummary Testleri
const cart1 = [
  { name: '22 Ayar Bilezik', qty: 1 },
  { name: 'İşçilik', qty: 1 }
];
assert.strictEqual(getCleanInvoiceItemsSummary(cart1), '22 Ayar Bilezik');

const cart2 = [
  { name: '22 Ayar Bilezik (x1) + İşçilik (x1)', qty: 1 }
];
assert.strictEqual(getCleanInvoiceItemsSummary(cart2), '22 Ayar Bilezik');

const cart3 = [
  { name: '22 Ayar Bilezik', qty: 1 },
  { name: 'Gram Altın', qty: 2 },
  { name: 'İşçilik', qty: 1 }
];
assert.strictEqual(getCleanInvoiceItemsSummary(cart3), '22 Ayar Bilezik, Gram Altın');
console.log('✅ TEST 2: getCleanInvoiceItemsSummary sepet kalemlerinde İşçilik ve adet kirliliklerini izole ediyor.');

// 3. calculateVip22Breakdown Testi
const bdVip = calculateVip22Breakdown(99000, '22 Ayar Bilezik (x1) + İşçilik (x1)');
assert.strictEqual(bdVip.productName, '22 Ayar Bilezik');
assert.strictEqual(bdVip.items[0].name, '22 Ayar Bilezik');
assert.strictEqual(bdVip.items[0].malHizmet, '22 Ayar Bilezik');
assert.strictEqual(bdVip.items[1].name, 'İşçilik');
assert.strictEqual(bdVip.items[1].malHizmet, 'İşçilik');
console.log('✅ TEST 3: calculateVip22Breakdown 1. kaleme net olarak "22 Ayar Bilezik", 2. kaleme "İşçilik" atıyor.');

// 4. calculateJewelryInvoiceBreakdown Testi
const bdJewelry = calculateJewelryInvoiceBreakdown(99000, '22 Ayar Bilezik (x1) + İşçilik (x1)');
assert.strictEqual(bdJewelry.items[0].name, '22 Ayar Bilezik');
assert.strictEqual(bdJewelry.items[1].name, 'İşçilik');
console.log('✅ TEST 4: calculateJewelryInvoiceBreakdown kalemleri başarıyla arındırıyor.');

// 5. VipEngine Client Engine Testi
const bdClient = VipEngine.calculateVip22Breakdown(99000, '22 Ayar Bilezik (x1) + İşçilik (x1)');
assert.strictEqual(bdClient.items[0].name, '22 Ayar Bilezik');
assert.strictEqual(bdClient.items[1].name, 'İşçilik');
console.log('✅ TEST 5: js/vip-payment.js VipEngine client motoru saf ürün adını koruyor.');

// 6. GİB Resmi Fatura HTML Testi
const html = renderOfficialGibHtml({
  productName: '22 Ayar Bilezik (x1) + İşçilik (x1)',
  totalAmount: 99000
});
assert(html.includes('22 Ayar Bilezik (Kıymetli Maden Bedeli - Özel Matrah)'), 'Fatura 1. kalemi 22 Ayar Bilezik olmalıdır');
assert(!html.includes('22 Ayar Bilezik (x1) + İşçilik (x1)'), 'Faturada asla (x1) + İşçilik (x1) ibaresi yer almamalıdır');
assert(html.includes('İşçilik'), 'Fatura 2. kalemi müstakil İşçilik olmalıdır');
console.log('✅ TEST 6: Resmi GİB Fatura HTML çıktısında ürün adı tertemiz ve işçilik müstakil kalem olarak basılıyor.');

console.log('\n🌟 TÜM 6 FATURA TEMİZLİK VE KALICILIK KONTROLÜ EKSİKSİZ BAŞARILI!\n');
