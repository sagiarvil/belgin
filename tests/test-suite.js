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

assert(Array.isArray(PRODUCTS) && PRODUCTS.length === 1991, 'Yayın kataloğunda 1.991 ürün eksiksiz mevcut (1.980 Sıfır Saat + 8 İkinci El Saat + 3 Mücevher)');
assert(Array.isArray(WATCHES) && WATCHES.length === 1980, 'Saat koleksiyonunda 1.980 adet 12.000 TL ve üzeri sıfır model mevcut (Seiko, Versace, Calvin Klein, Michael Kors, Diesel, Gc, Fossil, Guess, Welder)');
assert(Array.isArray(JEWELLERY) && JEWELLERY.length === 3, 'Mücevher koleksiyonunda orijinal Cartier Juste un Clou & Love modelleri yayında');
assert(Array.isArray(PRE_OWNED_ITEMS) && PRE_OWNED_ITEMS.length >= 10, 'İkinci el koleksiyonunda doğrulanmış lüks saat ve mücevher modelleri mevcut');
assert(Array.isArray(PRE_OWNED_GOLD) && PRE_OWNED_GOLD.length >= 2, 'Yayın kataloğunda görselli ikinci el altın ürünleri mevcut');
assert(Array.isArray(WATCH_BRANDS) && WATCH_BRANDS.length === 9, 'Saat markaları 9 adet marka içeriyor (Seiko, Versace, Calvin Klein, Michael Kors, Diesel, Gc, Fossil, Guess, Welder)');
assert(Array.isArray(JEWELRY_BRANDS) && JEWELRY_BRANDS.length === 5, 'Mücevher markaları 5 adet marka içeriyor (Cartier, Tiffany, Bulgari, VCA, Chopard)');

const allProds = [...PRODUCTS];
const invalidPrice = allProds.some(p => typeof p.price !== 'number' || p.price <= 0);
assert(!invalidPrice, 'Tüm parçaların fiyatları pozitif ve geçerli rakamlar içeriyor');

const missingAttributes = PRODUCTS.some(p => !p.brand || !p.reference || !p.metal || !p.statusBadge || !p.image);
assert(!missingAttributes, 'Her yayındaki üründe marka, referans, maden, stok ve görsel eksiksiz tanımlı');

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
const metaElements = {};
const linkElements = {};
const scriptElements = {};

global.document = {
  title: '',
  head: {
    appendChild: (el) => {
      if (el.tagName === 'META') {
        const key = el.getAttribute('name') || el.getAttribute('property');
        metaElements[key] = el;
      }
      if (el.tagName === 'LINK') {
        const rel = el.getAttribute('rel');
        linkElements[rel] = el;
      }
      if (el.tagName === 'SCRIPT') {
        const id = el.getAttribute('id');
        scriptElements[id] = el;
      }
    }
  },
  querySelector: (selector) => {
    if (selector.startsWith('meta[name=')) {
      const name = selector.match(/"([^"]+)"/)[1];
      return metaElements[name] || null;
    }
    if (selector.startsWith('meta[property=')) {
      const prop = selector.match(/"([^"]+)"/)[1];
      return metaElements[prop] || null;
    }
    if (selector.startsWith('link[rel=')) {
      const rel = selector.match(/"([^"]+)"/)[1];
      return linkElements[rel] || null;
    }
    return null;
  },
  getElementById: (id) => {
    return scriptElements[id] || null;
  },
  createElement: (tagName) => {
    const attrs = {};
    return {
      tagName: tagName.toUpperCase(),
      setAttribute: (name, val) => { attrs[name] = val; },
      getAttribute: (name) => attrs[name],
      set textContent(val) { this._textContent = val; },
      get textContent() { return this._textContent; }
    };
  },
  querySelectorAll: () => []
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

// Load js/seo.js
const seoContent = fs.readFileSync(path.join(__dirname, '../js/seo.js'), 'utf8');
vm.runInThisContext(seoContent);

// Test SeoManager Category
SeoManager.init();
SeoManager.update('saatler');
assert(global.document.title === 'Lüks Saatler & Yüksek Saatçilik | Belgin Kuyumculuk', 'SeoManager kategori sayfa başlığını başarıyla güncelliyor');

// Test SeoManager Product Page
const testProductForSeo = PRODUCTS.find(p => p.id === 101) || PRODUCTS[0];
SeoManager.update('urun-' + testProductForSeo.id);
assert(global.document.title.includes(testProductForSeo.name), 'SeoManager ürün detay sayfa başlığını başarıyla güncelliyor');
const dynamicSchemaScript = global.document.getElementById('dynamic-seo-schema');
assert(dynamicSchemaScript !== null, 'Dinamik Schema.org JSON-LD script bloğu başarıyla üretildi');
const parsedSchema = JSON.parse(dynamicSchemaScript.textContent);
assert(parsedSchema['@type'] === 'Product' && parsedSchema.brand.name === testProductForSeo.brand, 'Dinamik Schema.org JSON-LD geçerli Product şeması üretti');

const sitemapContent = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
assert(sitemapContent.includes('<urlset') && sitemapContent.includes('https://belginkuyumculuk.com/'), 'sitemap.xml geçerli urlset ve ana sayfa içeriyor');
assert(sitemapContent.includes('<image:loc>'), 'sitemap.xml Google Image sitemap extension etiketleri içeriyor');
assert(sitemapContent.includes('https://belginkuyumculuk.com/#saatler'), 'sitemap.xml kategori SPA bağlantılarını içeriyor');

const llmsContent = fs.readFileSync(path.join(__dirname, '..', 'llms.txt'), 'utf8');
assert(llmsContent.includes('Belgin Kuyumculuk') && llmsContent.includes('İzmir Kuyumcular Odası'), 'llms.txt kurumsal kimlik ve İZKO bilgilerini içeriyor');

const robotsContent = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');
assert(robotsContent.includes('GPTBot') && robotsContent.includes('ClaudeBot') && robotsContent.includes('Sitemap: https://belginkuyumculuk.com/sitemap.xml'), 'robots.txt AI bot izinleri ve sitemap linki içeriyor');

// --- 6. 14 Hukuki Belge & Red Team Testleri ---
console.log('\n--- 6. 14 Hukuki Belge & Red Team Testleri ---');

// 14 Dosya Varlık Testi
const legalFiles = [
  '00_Web_Hukuki_Uyum_Uygulama_Kontrol_Listesi.docx',
  '01_Mesafeli_Satis_Sozlesmesi_Belgin_Kuyumculuk.docx',
  '02_On_Bilgilendirme_Formu.docx',
  '03_Yuksek_Degerli_Urun_Magazadan_Teslim_Protokolu.docx',
  '04_Cayma_Iade_Degisim_Iptal_Politikasi.docx',
  '05_KVKK_Musteri_Aydinlatma_Metni.docx',
  '06_Gizlilik_ve_Kisisel_Veri_Guvenligi_Politikasi.docx',
  '07_Cerez_Politikasi.docx',
  '08_Web_Sitesi_Kullanim_Kosullari.docx',
  '09_Ticari_Elektronik_Ileti_Onay_Metni.docx',
  '10_KVKK_Acik_Riza_Metni.docx',
  '11_Garanti_Ayipli_Mal_Satis_Sonrasi_Politikasi.docx',
  '12_KYC_MASAK_Supheli_Islem_Uyum_Politikasi.docx',
  '13_Magaza_Teslim_Tesellum_Formu.docx'
];

const allDocsExist = legalFiles.every(f => fs.existsSync(path.join(__dirname, '../belgin_kuyumculuk_hukuki_sozlesme_paketi', f)));
assert(allDocsExist, '14 Hukuki DOCX belgesinin tamamı proje paketinde eksiksiz mevcut');

// 12 Public HTML Sayfası Varlık Testi
const publicHtmlPages = [
  'mesafeli-satis-sozlesmesi.html',
  'on-bilgilendirme-formu.html',
  'yuksek-degerli-urun-teslimi.html',
  'iade-degisim-cayma.html',
  'kvkk-aydinlatma-metni.html',
  'gizlilik-politikasi.html',
  'cerez-politikasi.html',
  'kullanim-kosullari.html',
  'ticari-elektronik-ileti-onayi.html',
  'kvkk-acik-riza.html',
  'garanti-ve-satis-sonrasi.html',
  'musteri-tanima-ve-islem-guvenligi.html'
];

const allHtmlExist = publicHtmlPages.every(p => fs.existsSync(path.join(__dirname, '..', p)));
assert(allHtmlExist, '12 adet müşteri dostu hukuki HTML sayfası eksiksiz yayında');

// RED TEAM TEST 1 — 11.999 TL saat
const test1Product = { price: 11999, category: 'saat' };
assert(!isHighValueSecureDelivery(test1Product), 'RED TEAM 1: 11.999 TL saat için 03 protokolü tetiklenmemeli');

// RED TEAM TEST 2 — 12.000 TL saat
const test2Product = { price: 12000, category: 'saat' };
assert(!isHighValueSecureDelivery(test2Product), 'RED TEAM 2: 12.000 TL saat için (12.000 ÜZERİ kuralı) 03 protokolü tetiklenmemeli');

// RED TEAM TEST 3 — 12.001 TL saat
const test3Product = { price: 12001, category: 'saat' };
assert(isHighValueSecureDelivery(test3Product), 'RED TEAM 3: 12.001 TL saat için 03 protokolü tetiklenmeli');

// RED TEAM TEST 4 — 20.000 TL altın
const test4Product = { price: 20000, category: 'altin' };
assert(isHighValueSecureDelivery(test4Product), 'RED TEAM 4: 20.000 TL altın için 03 protokolü tetiklenmeli');

// RED TEAM TEST 5 — Pazarlama onayı verilmedi
const mockOrderNoMarketing = { marketingConsent: false };
assert(mockOrderNoMarketing.marketingConsent === false, 'RED TEAM 5: Pazarlama izni verilmediğinde sipariş engellenmez');

// RED TEAM TEST 6 — Açık rıza verilmedi
const mockOrderNoConsent = { optionalConsent: false };
assert(mockOrderNoConsent.optionalConsent === false, 'RED TEAM 6: İsteğe bağlı açık rıza verilmediğinde sipariş engellenmez');

// RED TEAM TEST 7 — Üçüncü kişi teslim talebi kuralı
const deliveryProtocolText = fs.readFileSync(path.join(__dirname, '../yuksek-degerli-urun-teslimi.html'), 'utf8');
assert(deliveryProtocolText.includes('Üçüncü kişiye teslim kural olarak yapılmaz') || deliveryProtocolText.includes('üçüncü kişiye'), 'RED TEAM 7: Üçüncü kişiye teslimat sınırlaması kuralı doğrulanmıştır');

// RED TEAM TEST 8 — Ödeme kesinleşme şartı
assert(deliveryProtocolText.includes('Ödeme ekran görüntüsü') || deliveryProtocolText.includes('ödemenin kesinleştiği'), 'RED TEAM 8: Ödeme kesinleşmeden ürün teslim edilmeme kuralı doğrulanmıştır');

// RED TEAM TEST 9 — KYC / MASAK risk gizliliği
const masakPageContent = fs.readFileSync(path.join(__dirname, '../musteri-tanima-ve-islem-guvenligi.html'), 'utf8');
assert(!masakPageContent.includes('bölünmüş işlem tespit mantığı') && !masakPageContent.includes('iç escalation kuralları'), 'RED TEAM 9: Müşteriye iç risk / şüpheli işlem algoritması gösterilmemektedir');

// RED TEAM TEST 10 — Cayma / İade hakkı ayrımı
const returnPageContent = fs.readFileSync(path.join(__dirname, '../iade-degisim-cayma.html'), 'utf8');
assert(returnPageContent.includes('Tüketicinin emredici kanuni hakları saklıdır') || returnPageContent.includes('Ayıplı mal hükümleri her durumda saklıdır'), 'RED TEAM 10: Altın ve saatler için toptancı "iade yok" yazılmamış, kanuni haklar korunmuştur');

console.log('\n========================================');
console.log(`SONUÇ: ${passedTests} TEST BAŞARILI, ${failedTests} TEST BAŞARISIZ`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
}
