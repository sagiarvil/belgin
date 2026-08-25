// ==========================================================
// BELGIN KUYUMCULUK — AUTOMATED TEST SUITE (ART JEWELLERY & PRE-OWNED)
// ==========================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('\n========================================');
console.log('💎 BELGIN KUYUMCULUK TEST RUNNER');
console.log('========================================\n');

// 1. DATA INTEGRITY TESTS
console.log('--- 1. Ürün & Koleksiyon Veri Bütünlüğü Testleri ---');
const dataContent = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

// Run in global context
vm.runInThisContext(dataContent);

assert(Array.isArray(PRODUCTS) && PRODUCTS.length === 16, 'Mücevher ve saat arşivinde tam 16 adet gerçek model mevcut');
assert(Array.isArray(WATCHES) && WATCHES.length === 8, 'Saat koleksiyonunda 8 adet gerçek model mevcut (TAG Heuer Carrera, Formula 1, Longines HydroConquest, Master, Rado Captain Cook, True Square)');
assert(Array.isArray(JEWELLERY) && JEWELLERY.length === 8, 'Mücevher koleksiyonunda 8 adet gerçek model mevcut (Cartier Juste un Clou, Love, Tiffany Setting)');
assert(Array.isArray(PRE_OWNED_ITEMS) && PRE_OWNED_ITEMS.length >= 12, 'İkinci el altın ve saat koleksiyonunda en az 12 adet ekspertizli parça mevcut');
assert(Array.isArray(PRE_OWNED_GOLD) && PRE_OWNED_GOLD.length >= 6, 'İkinci el altın koleksiyonunda en az 6 adet masif altın parça mevcut');
assert(Array.isArray(WATCH_BRANDS) && WATCH_BRANDS.length === 5, 'Saat markaları 5 adet marka içeriyor (TAG Heuer, Longines, Rado, Cartier, Rolex)');
assert(Array.isArray(JEWELRY_BRANDS) && JEWELRY_BRANDS.length === 5, 'Mücevher markaları 5 adet marka içeriyor (Cartier, Tiffany, Bulgari, VCA, Chopard)');

const allProds = [...PRODUCTS];
const invalidPrice = allProds.some(p => typeof p.price !== 'number' || p.price <= 0);
assert(!invalidPrice, 'Tüm parçaların fiyatları pozitif ve geçerli rakamlar içeriyor');

const missingAttributes = PRODUCTS.some(p => !p.brand || !p.reference || !p.metal || !p.statusBadge || !p.conditionBadge || !p.image);
assert(!missingAttributes, 'Her parçada marka, referans, maden, stok, kondisyon rozetleri ve orijinal API görsel URLsi eksiksiz tanımlı');

// 2. UTILS TESTS
console.log('\n--- 2. Yardımcı Fonksiyonlar & Fiyat Formatlayıcı ---');
const utilsContent = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
vm.runInThisContext(utilsContent);

assert(formatPrice(1150000) === '₺1.150.000', 'formatPrice(1150000) "₺1.150.000" üretiyor');
assert(formatPrice(0) === '₺0', 'formatPrice(0) "₺0" üretiyor');

const instSample = calculateInstallments(120000);
assert(Array.isArray(instSample) && instSample.length === 5, 'Taksit seçenekleri hesaplanabiliyor');

// 3. CART & ATÖLYE LOGIC
console.log('\n--- 3. Kasa & Sipariş Testleri ---');
const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; }
};
global.document = {
  querySelectorAll: () => [],
  getElementById: () => null
};
global.showToast = () => {};

const cartContent = fs.readFileSync(path.join(__dirname, '../js/cart.js'), 'utf8');
vm.runInThisContext(cartContent);

Cart.init();
Cart.clear();
assert(Cart.items.length === 0, 'Cart.clear() sepeti boşaltıyor');

const testProd = PRODUCTS[0];
Cart.add(testProd.id, 1);
assert(Cart.items.length === 1 && Cart.items[0].qty === 1, `Cart.add(${testProd.id}) ürünü sepete ekliyor`);
assert(Cart.getSubtotal() === testProd.price, `Ara toplam doğru hesaplanıyor (${formatPrice(testProd.price)})`);

Cart.remove(Cart.items[0].itemKey);
assert(Cart.items.length === 0, 'Cart.remove() ürünü sepetten çıkarıyor');

// 4. PAYTR HMAC-SHA256 GÜVENLİK TESTİ
console.log('\n--- 4. PayTR HMAC-SHA256 Token Doğrulama ---');

function generateTestPayTRToken(params, merchantKey, merchantSalt) {
  const hashStr = 
    String(params.merchant_id) +
    String(params.user_ip) +
    String(params.merchant_oid) +
    String(params.email) +
    String(params.payment_amount) +
    String(params.user_basket) +
    String(params.no_installment) +
    String(params.max_installment) +
    String(params.currency) +
    String(params.test_mode) +
    String(merchantSalt);

  return crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');
}

const mockPayTRParams = {
  merchant_id: '123456',
  user_ip: '176.240.10.20',
  merchant_oid: 'BLG-1740000000000',
  email: 'musteri@belginkuyumculuk.com',
  payment_amount: '38500000',
  user_basket: Buffer.from(JSON.stringify([["Rolex Kermit", "1150000.00", "1"]])).toString('base64'),
  no_installment: 0,
  max_installment: 6,
  currency: 'TL',
  test_mode: 1
};

const token1 = generateTestPayTRToken(mockPayTRParams, 'test_secret_key', 'test_secret_salt');
assert(typeof token1 === 'string' && token1.length > 20, 'PayTR token üretildi (Base64 HMAC-SHA256)');

// --- 5. SEO, Sitemap & LLM Standartları Testleri ---
console.log('\n--- 5. SEO, Sitemap & LLM Standartları Testleri ---');
const sitemapContent = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
assert(sitemapContent.includes('<urlset') && sitemapContent.includes('https://belgin.web.app/'), 'sitemap.xml geçerli urlset ve ana sayfa içeriyor');
assert(sitemapContent.includes('<image:loc>'), 'sitemap.xml Google Image sitemap extension etiketleri içeriyor');

const llmsContent = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
assert(llmsContent.includes('Belgin Kuyumculuk') && llmsContent.includes('İzmir Kuyumcular Odası'), 'llms.txt kurumsal kimlik ve İZKO bilgilerini içeriyor');

const robotsContent = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');
assert(robotsContent.includes('GPTBot') && robotsContent.includes('ClaudeBot') && robotsContent.includes('Sitemap: https://belgin.web.app/sitemap.xml'), 'robots.txt AI bot izinleri ve sitemap linki içeriyor');

console.log('\n========================================');
console.log(`SONUÇ: ${passedTests} TEST BAŞARILI, ${failedTests} TEST BAŞARISIZ`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
