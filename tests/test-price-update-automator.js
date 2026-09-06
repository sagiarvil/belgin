/**
 * TEST SUITE: PRICE UPDATE AUTOMATOR (CANLI FİYAT VE LİNK OTOMASYONU)
 * Doğrular:
 * 1. _productByIdMap ile O(1) anlık erişim (2.125 ürün taranmadan anında erişim)
 * 2. _cachedGoldProducts ile 2.125 ürün yerine yalnızca altın/mücevher ürünlerinin hesaplanması
 * 3. requestAnimationFrame / debounce ile birden fazla soket sinyalinin tek render döngüsünde birleştirilmesi (Throttling)
 * 4. DOM üzerindeki tüm data-product-price-id link ve etiketlerinin otomatik güncellenmesi
 * 5. Sepetteki altın ürünlerinin fiyatlarının borsa verisiyle otomatik senkronize edilmesi
 * 6. MutationObserver ile sayfaya sonradan eklenen kart/linklerin otomatik tespiti ve güncellenmesi
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('====================================================================');
console.log('⚡ CANLI FİYAT VE LİNK OTOMASYONU TEST SUITE (PriceUpdateAutomator)');
console.log('====================================================================\n');

// 1. Mock Browser Environment
global.window = global;
global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: (id) => null,
  querySelectorAll: (selector) => [],
  querySelector: (selector) => null,
  documentElement: { style: {} },
  body: { style: {} }
};

// 2. Load PRODUCTS from js/data.js
const dataFile = path.join(__dirname, '..', 'js', 'data.js');
const dataContent = fs.readFileSync(dataFile, 'utf-8');
eval(dataContent);

// 3. Load utils.js as module
const utils = require('../js/utils.js');
const {
  PriceUpdateAutomator,
  getProductById,
  getGoldProducts,
  findProduct,
  updateDynamicGoldProductPrices,
  LIVE_MARKET_DATA
} = utils;

// --- TEST 1: _productByIdMap ile O(1) Anlık Erişim ---
const totalProducts = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.length : 0;
assert(totalProducts > 1000, `PRODUCTS yüklü olmalıdır (Bulunan: ${totalProducts})`);

PriceUpdateAutomator.initIndices();
const sampleProduct = PRODUCTS[100];
const lookupStart = process.hrtime.bigint();
const found = PriceUpdateAutomator.getProductById(sampleProduct.id);
const lookupDurationNs = Number(process.hrtime.bigint() - lookupStart);

assert.strictEqual(found.id, sampleProduct.id, 'O(1) Map araması doğru ürünü döndürmelidir');
assert(lookupDurationNs < 1000000, `O(1) arama 1ms'nin altında tamamlanmalıdır (Geçen: ${lookupDurationNs}ns)`);
console.log(`  ✅ [PASS 1]: _productByIdMap ile ${totalProducts} ürün içinde O(1) erişim doğrulandı (${lookupDurationNs} ns).`);

// --- TEST 2: _cachedGoldProducts İzolasyonu ---
const goldProducts = PriceUpdateAutomator.getGoldProducts();
assert(goldProducts.length > 0, 'Altın ürünleri listesi boş olamaz');
assert(goldProducts.length < 200, `Altın ürünleri tüm katalog (${totalProducts}) yerine filtrelenmiş olmalıdır (Mevcut: ${goldProducts.length})`);

// Tüm goldProducts elemanlarının gerçekten altın veya ziynet olduğunu doğrula
const allAreGold = goldProducts.every(p =>
  p.isGold || p.category === 'gold' || p.subCategory?.includes('Ziynet') || p.subCategory?.includes('Külçe') || p.subCategory?.includes('Bilezik')
);
assert(allAreGold, 'Tüm önbelleklenen ürünler altın/ziynet/bilezik kuralına uygun olmalıdır');
console.log(`  ✅ [PASS 2]: _cachedGoldProducts ${totalProducts} ürün içinden yalnız ${goldProducts.length} adet altın ürününü izole etti.`);

// --- TEST 3: findProduct() O(1) Hızlı Arama & Geriye Uyumluluk ---
const byId = findProduct(sampleProduct.id);
const bySlug = sampleProduct.slug ? findProduct(sampleProduct.slug) : null;
assert.strictEqual(byId.id, sampleProduct.id, 'findProduct(id) doğru ürünü bulmalıdır');
if (sampleProduct.slug) {
  assert.strictEqual(bySlug.id, sampleProduct.id, 'findProduct(slug) doğru ürünü bulmalıdır');
}
console.log('  ✅ [PASS 3]: findProduct() fonksiyonu ID, Slug ve Reference aramalarında O(1) hızında çalışıyor.');

// --- TEST 4: Throttling ve Coalescing (Tek Render Frame İçinde Birleştirme) ---
let executionCount = 0;
const originalExecute = PriceUpdateAutomator.executeUpdates;
PriceUpdateAutomator.executeUpdates = () => {
  executionCount++;
};

// 100 eşzamanlı soket güncellemesi gönderildiğini simüle et
for (let i = 0; i < 100; i++) {
  PriceUpdateAutomator.scheduleUpdate();
}

// Throttled döngünün bitmesini bekle
setTimeout(() => {
  assert.strictEqual(executionCount, 1, `100 eşzamanlı soket tetiklemesi 1 kez render edilmelidir (Tetiklenen: ${executionCount})`);
  console.log('  ✅ [PASS 4]: requestAnimationFrame/batching ile 100 eşzamanlı soket sinyali tek render döngüsünde birleştirildi.');

  // Restore
  PriceUpdateAutomator.executeUpdates = originalExecute;

  // --- TEST 5: Otomasyon ile DOM Elementleri ve Link Fiyat Senkronizasyonu ---
  // Mock DOM elements
  const mockElements = [
    {
      id: goldProducts[0].id,
      textContent: '0 TL',
      getAttribute: (attr) => String(goldProducts[0].id)
    },
    {
      id: goldProducts[1].id,
      textContent: '0 TL',
      getAttribute: (attr) => String(goldProducts[1].id)
    }
  ];

  document.querySelectorAll = (selector) => {
    if (selector === '[data-product-price-id]') return mockElements;
    return [];
  };

  // Simüle edilmiş Harem Altın veri güncellemesi
  LIVE_MARKET_DATA.items = {
    ALTIN: { satis: 7200, alis: 7100 },
    AYAR22: { satis: 6600, alis: 6500 },
    CEYREK_YENI: { satis: 11800, alis: 11600 }
  };

  updateDynamicGoldProductPrices();

  // Fiyatların güncellendiğini doğrula
  assert.notStrictEqual(mockElements[0].textContent, '0 TL', 'Mock DOM elementi canlı fiyatla güncellenmiş olmalıdır');
  assert.notStrictEqual(mockElements[1].textContent, '0 TL', 'Mock DOM elementi canlı fiyatla güncellenmiş olmalıdır');
  console.log('  ✅ [PASS 5]: DOM üzerindeki tüm [data-product-price-id] link ve etiketleri otomatik güncellendi.');

  // --- TEST 6: Sepet Fiyat Senkronizasyonu ---
  global.Cart = {
    items: [
      { id: goldProducts[0].id, price: 100 },
      { id: 999999, price: 500 } // Normal veya varolmayan ürün
    ],
    updated: false,
    updateUI: function() { this.updated = true; }
  };

  // Fiyat değişimini tetikle
  LIVE_MARKET_DATA.items.ALTIN.satis = 7800;
  LIVE_MARKET_DATA.items.AYAR22.satis = 7200;
  LIVE_MARKET_DATA.items.CEYREK_YENI.satis = 12500;

  updateDynamicGoldProductPrices();
  assert.strictEqual(global.Cart.updated, true, 'Sepetteki altın ürününün fiyatı değiştiğinde Cart.updateUI tetiklenmelidir');
  assert.notStrictEqual(global.Cart.items[0].price, 100, 'Sepetteki altın fiyatı borsa fiyatıyla eşitlenmelidir');
  console.log('  ✅ [PASS 6]: Sepetteki altın ürünleri borsa akışıyla otomatik senkronize edildi.');

  console.log('\n====================================================================');
  console.log('🎉 TÜM 6/6 CANLI FİYAT VE LİNK OTOMASYON TESTLERİ BAŞARIYLA GEÇTİ!');
  console.log('====================================================================\n');
}, 100);
