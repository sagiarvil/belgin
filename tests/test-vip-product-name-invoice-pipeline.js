const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n=== TESTING VIP LINK PRODUCT NAME -> GİB INVOICE PIPELINE ===\n');

// 1. earsiv-service.js test
const { calculateVip22Breakdown, calculateJewelryInvoiceBreakdown } = require('../functions/earsiv-service.js');

const customTitle = '22 Ayar Ajda Bilezik 25 Gr';
const bd = calculateVip22Breakdown(99000, customTitle);

assert.strictEqual(bd.productName, customTitle, 'Breakdown productName must match custom title 1:1');
assert.strictEqual(bd.items[0].name, customTitle, 'Item 0 name must match custom title 1:1');
assert.strictEqual(
  bd.items[0].malHizmet,
  customTitle,
  'Item 0 malHizmet must be pure product name and NEVER polluted with tax exemption clause'
);
assert(!bd.items[0].malHizmet.includes('Özel Matrah'), 'Product name must NOT contain tax exemption text (Kıymetli Maden Bedeli - Özel Matrah)');
assert.strictEqual(bd.items[1].name, 'İşçilik', 'Item 1 name must be İşçilik');
console.log('✅ PASS 1: calculateVip22Breakdown preserves pure custom VIP product name 1:1');

// Test calculateJewelryInvoiceBreakdown with isVip22 and custom title
const bdJewelry = calculateJewelryInvoiceBreakdown(99000, customTitle, { isVip22: true });
assert.strictEqual(bdJewelry.productName, customTitle, 'calculateJewelryInvoiceBreakdown must forward custom title to calculateVip22Breakdown');
assert.strictEqual(bdJewelry.items[0].name, customTitle, 'calculateJewelryInvoiceBreakdown item 0 name must match custom title');
console.log('✅ PASS 2: calculateJewelryInvoiceBreakdown resolves and passes custom VIP title');

// 2. js/vip-payment.js client engine test
const vipPaymentJs = fs.readFileSync(path.join(__dirname, '../js/vip-payment.js'), 'utf8');
assert(vipPaymentJs.includes('calculateVip22Breakdown(totalAmount, customProductName = \'\')'), 'vip-payment.js must accept customProductName parameter');
assert(vipPaymentJs.includes('productName: cleanProdName'), 'vip-payment.js must return cleanProdName');
console.log('✅ PASS 3: js/vip-payment.js supports custom product title in calculateVip22Breakdown');

// 3. payment-service.js verification
const paymentServiceCode = fs.readFileSync(path.join(__dirname, '../functions/payment/payment-service.js'), 'utf8');
assert(paymentServiceCode.includes('rawVipTitle'), 'payment-service.js must extract rawVipTitle');
assert(paymentServiceCode.includes('calculateVip22Breakdown(serverTotal, rawVipTitle)'), 'payment-service.js must pass rawVipTitle to calculateVip22Breakdown');
assert(paymentServiceCode.includes('vipTitle: rawVipTitle'), 'payment-service.js must persist vipTitle on order');
assert(paymentServiceCode.includes('title: rawVipTitle'), 'payment-service.js must persist title on order');
console.log('✅ PASS 4: payment-service.js preserves VIP product name on created order documents');

// 4. vip-odeme.html verification
const vipOdemeHtml = fs.readFileSync(path.join(__dirname, '../vip-odeme.html'), 'utf8');
assert(vipOdemeHtml.includes('title: currentPayload.title'), 'vip-odeme.html must send title in orderPayload');
assert(vipOdemeHtml.includes('productName: currentPayload.title'), 'vip-odeme.html must send productName in orderPayload');
assert(vipOdemeHtml.includes('vipTitle: currentPayload.title'), 'vip-odeme.html must send vipTitle in orderPayload');
console.log('✅ PASS 5: vip-odeme.html transmits custom VIP product name at root payload level');

// 5. admin.html verification
const adminHtml = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');
assert(adminHtml.includes('id="cfgGoldItemName"'), 'admin.html must contain cfgGoldItemName input in cfgGoldSettingsBlock');
assert(adminHtml.includes('🏷️ Altın / Ziynet / VIP Ürün Açıklaması:'), 'admin.html must provide product name input label for gold / VIP items');
console.log('✅ PASS 6: admin.html has cfgGoldItemName editable field in Gold settings modal');

// 6. js/admin.js verification
const adminJs = fs.readFileSync(path.join(__dirname, '../js/admin.js'), 'utf8');
assert(adminJs.includes('cfgGoldItemName'), 'js/admin.js must reference cfgGoldItemName');
assert(adminJs.includes('goldInput.value = prodName'), 'js/admin.js must pre-populate cfgGoldItemName with order product name');
assert(adminJs.includes('effectiveProductName'), 'js/admin.js must pass effectiveProductName in payload');
assert(adminJs.includes('1. Kalem:</strong> ${this.escapeHtml((order.vipTitle || order.title || order.productName'), 'js/admin.js must display order product name in order view modal fallback');
console.log('✅ PASS 7: js/admin.js syncs, edits, and sends custom product name to invoice backend');

// 7. functions/index.js verification
const indexJs = fs.readFileSync(path.join(__dirname, '../functions/index.js'), 'utf8');
assert(indexJs.includes('const resolvedProdName = req.body.productName || order.vipTitle || order.title || order.productName'), 'functions/index.js must resolve custom product name in preview and draft');
console.log('✅ PASS 8: functions/index.js protects and forwards custom product name to GİB e-Arşiv payload');

console.log('\n🌟 ALL 8 VIP PRODUCT NAME INVOICE PIPELINE CHECKS PASSED!\n');
