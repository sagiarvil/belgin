// ====================================================================
// ⚡ BELGİN KUYUMCULUK — MASAÜSTÜ & MOBİL DERİN LİNK VE BUTON STRES TESTİ
// Tüm sayfalardaki <a> ve <button> öğelerini, rotaları, onclick handler'larını
// ve çalışma zamanı fonksiyonlarını acımasızca denetler.
// ====================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const errors = [];

function check(assertion, description, context = '') {
  totalTests++;
  if (assertion) {
    passedTests++;
  } else {
    failedTests++;
    errors.push({ description, context });
    console.error(`  ❌ [FAIL] ${description} ${context ? '-> ' + context : ''}`);
  }
}

console.log('\n====================================================================');
console.log('🏛️  BELGİN KUYUMCULUK — SERT MASAÜSTÜ & MOBİL STRES TESTİ BAŞLATILIYOR');
console.log('====================================================================\n');

// 1. JS ÇALIŞMA ZAMANI ORTAMI HAZIRLAMA (MOCK RUNTIME)
const sandbox = {
  window: {},
  document: {
    title: '',
    body: { classList: { toggle: () => {}, add: () => {}, remove: () => {} }, style: {} },
    documentElement: { scrollTop: 0 },
    getElementById: (id) => ({
      id,
      classList: { toggle: () => {}, add: () => {}, remove: () => {}, contains: () => false },
      style: {},
      scrollIntoView: () => {},
      appendChild: () => {},
      addEventListener: () => {}
    }),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {}
  },
  location: { pathname: '/', search: '', hash: '' },
  history: { pushState: () => {}, replaceState: () => {} },
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  console: { log: () => {}, warn: () => {}, error: () => {} },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {}
};
sandbox.window = sandbox;

function loadScriptInSandbox(relPath) {
  if (!fs.existsSync(path.join(ROOT_DIR, relPath))) return;
  const code = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
  vm.runInNewContext(code, sandbox, { filename: relPath });
}

// Gerekli JS dosyalarını sandbox içine yükle
try {
  loadScriptInSandbox('js/data.js');
  loadScriptInSandbox('js/utils.js');
  loadScriptInSandbox('js/cart.js');
  loadScriptInSandbox('js/wishlist.js');
  loadScriptInSandbox('js/seo-route-map.js');
  loadScriptInSandbox('js/router.js');
  loadScriptInSandbox('js/app.js');
  console.log('✅ JS Çalışma Zamanı (App, Router, Cart, Wishlist, Data) başarıyla yüklendi.\n');
} catch (err) {
  console.error('❌ JS dosyaları yüklenirken hata:', err.message);
  process.exit(1);
}

const App = sandbox.App || {};
const Router = sandbox.Router || {};
const Cart = sandbox.Cart || {};
const Wishlist = sandbox.Wishlist || {};
const PAGE_TITLES = sandbox.PAGE_TITLES || (Router && Router.PAGE_TITLES) || {};
const PRODUCTS = sandbox.PRODUCTS || [];
const productIdsSet = new Set(PRODUCTS.map(p => String(p.id)));

// 2. TÜM HTML DOSYALARINI TOPLA
function findHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === 'scratch' || file === '.agents' || file === '.firebase') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findHtmlFiles(filePath));
    } else if (file.endsWith('.html')) {
      results.push(filePath);
    }
  }
  return results;
}

const allHtmlFiles = findHtmlFiles(ROOT_DIR);
console.log(`🔍 Toplam ${allHtmlFiles.length} HTML dosyası analiz edilecek.\n`);

// HTML attribute ayıklayıcı (çift ve tek tırnakları doğru ayrıştırır)
function extractTags(html, tagName) {
  const tags = [];
  const regex = new RegExp(`<${tagName}\\b([^>]*)>(.*?)<\\/${tagName}>`, 'gis');
  let match;
  while ((match = regex.exec(html)) !== null) {
    tags.push({
      attrStr: match[1],
      innerText: match[2].replace(/<[^>]*>/g, '').trim(),
      raw: match[0]
    });
  }
  return tags;
}

function getAttrValue(attrStr, attrName) {
  const doubleRegex = new RegExp(`\\b${attrName}="([^"]*)"`, 'i');
  const singleRegex = new RegExp(`\\b${attrName}='([^']*)'`, 'i');
  const m1 = doubleRegex.exec(attrStr);
  if (m1) return m1[1];
  const m2 = singleRegex.exec(attrStr);
  if (m2) return m2[1];
  return null;
}

// 3. SAYFA BAZINDA TEST KOŞUCUSU
allHtmlFiles.forEach((file) => {
  const relFile = path.relative(ROOT_DIR, file);
  const content = fs.readFileSync(file, 'utf8');

  // A) Linkler (<a>)
  const aTags = extractTags(content, 'a');
  aTags.forEach(tag => {
    const href = getAttrValue(tag.attrStr, 'href');
    const onclick = getAttrValue(tag.attrStr, 'onclick');
    const dataPage = getAttrValue(tag.attrStr, 'data-page');
    const dataFilter = getAttrValue(tag.attrStr, 'data-filter');
    const dataProductId = getAttrValue(tag.attrStr, 'data-product-id');

    // 1. href kontrolü
    if (!href && !onclick && !dataPage) {
      check(false, `Boş / işlevsiz <a> etiketi tespit edildi`, `${relFile} -> "${tag.innerText}"`);
    } else if (href) {
      if (href.startsWith('javascript:')) {
        check(false, `Antipattern javascript: href tespit edildi`, `${relFile} -> href="${href}"`);
      } else if (href === '#' && !onclick && !dataPage) {
        check(false, `Ölü link (href="#" eylemsiz)`, `${relFile} -> "${tag.innerText}"`);
      } else if (href.startsWith('/') && !href.startsWith('//')) {
        // Site içi internal link
        const cleanPath = href.split('?')[0].split('#')[0];
        let exists = false;
        if (cleanPath === '/' || cleanPath === '') {
          exists = true;
        } else {
          const directFile = path.join(ROOT_DIR, cleanPath);
          const asHtml = path.join(ROOT_DIR, cleanPath.endsWith('.html') ? cleanPath : cleanPath + '.html');
          const asDirIndex = path.join(ROOT_DIR, cleanPath, 'index.html');
          exists = fs.existsSync(directFile) || fs.existsSync(asHtml) || fs.existsSync(asDirIndex);
          // SPA router rotası mı?
          if (!exists) {
            const routeName = cleanPath.replace(/^\//, '').replace(/\/$/, '');
            if (PAGE_TITLES[routeName] || routeName === 'canli-fiyatlar' || routeName === 'mucevherat' || routeName === 'saatler' || routeName === 'elit-kategori' || routeName === 'biz-kimiz' || routeName === 'markalar' || routeName === 'magazin' || routeName === 'iletisim') {
              exists = true;
            }
          }
          // Ürün SEO rotası mı?
          if (!exists && sandbox.SEO_ROUTE_MAP) {
            exists = Object.values(sandbox.SEO_ROUTE_MAP).includes(cleanPath) || Object.values(sandbox.SEO_ROUTE_MAP).includes(cleanPath + '/');
          }
        }
        check(exists, `Geçersiz internal link hedefi`, `${relFile} -> href="${href}"`);
      }
    }

    // 2. data-page kontrolü
    if (dataPage) {
      const isValidPage = PAGE_TITLES[dataPage] || dataPage === 'ana-sayfa' || dataPage === 'iletisim' || dataPage === 'sepet' || dataPage === 'odeme' || dataPage === 'urun' || dataPage === 'canli-fiyatlar' || dataPage === 'saatler' || dataPage === 'mucevherat' || dataPage === 'elit-kategori' || dataPage === 'markalar' || dataPage === 'biz-kimiz' || dataPage === 'magazin';
      check(Boolean(isValidPage), `Geçersiz data-page değeri`, `${relFile} -> data-page="${dataPage}"`);
    }

    // 3. data-product-id kontrolü
    if (dataProductId) {
      check(productIdsSet.has(String(dataProductId)), `data-product-id katalogda bulunamadı`, `${relFile} -> id="${dataProductId}"`);
    }

    // 4. onclick sözdizim ve fonksiyon kontrolü
    if (onclick && !relFile.includes('admin.html')) {
      testOnclickHandler(onclick, relFile, `<a> "${tag.innerText}"`);
    }
  });

  // B) Butonlar (<button>)
  const btnTags = extractTags(content, 'button');
  btnTags.forEach(tag => {
    const onclick = getAttrValue(tag.attrStr, 'onclick');
    if (onclick && !relFile.includes('admin.html')) {
      testOnclickHandler(onclick, relFile, `<button> "${tag.innerText}"`);
    }
  });
});

function testOnclickHandler(onclickCode, file, elementDesc) {
  // Sözdizim doğrulaması
  let isSyntaxValid = true;
  try {
    new vm.Script(onclickCode);
  } catch (err) {
    isSyntaxValid = false;
    check(false, `Onclick JS sözdizim hatası: ${err.message}`, `${file} -> ${elementDesc} -> [${onclickCode}]`);
    return;
  }
  check(isSyntaxValid, `Onclick JS sözdizimi geçerli`, `${file} -> ${elementDesc}`);

  // Çağrılan ana fonksiyonların varlık kontrolü (Sadece doğrudan App. ve Router. çağrıları)
  const appCalls = onclickCode.match(/(?:^|[^a-zA-Z0-9_])App\.([a-zA-Z0-9_]+)\(/g);
  if (appCalls) {
    appCalls.forEach(call => {
      const fnName = call.replace(/^[^a-zA-Z0-9_]*App\./, '').replace('(', '');
      const exists = typeof App[fnName] === 'function';
      check(exists, `App.${fnName} metodu app.js içinde tanımlı`, `${file} -> ${elementDesc}`);
    });
  }

  const routerCalls = onclickCode.match(/(?:^|[^a-zA-Z0-9_])Router\.([a-zA-Z0-9_]+)\(/g);
  if (routerCalls) {
    routerCalls.forEach(call => {
      const fnName = call.replace(/^[^a-zA-Z0-9_]*Router\./, '').replace('(', '');
      const exists = typeof Router[fnName] === 'function';
      check(exists, `Router.${fnName} metodu router.js içinde tanımlı`, `${file} -> ${elementDesc}`);
    });
  }
}

// 4. ÖZEL MOBİL VE MASAÜSTÜ BİLEŞEN STRESİ
console.log('\n--- 4. Özel Mobil ve Masaüstü Bileşen Denetimleri ---');

const indexContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

// Mobil Dock Butonları
const dockBtns = (indexContent.match(/class="mobile-dock-btn[^"]*"/g) || []).length;
check(dockBtns === 5, `Mobil dock 5 adet buton içermeli`, `Bulunan: ${dockBtns}`);

// Mobil Stories Şeridi
const storyItems = (indexContent.match(/class="haute-story-item"/g) || []).length;
check(storyItems === 6, `Mobil Haute Stories şeridi 6 kategori içermeli`, `Bulunan: ${storyItems}`);

// Hamburger Menü Butonu
check(indexContent.includes('onclick="App.toggleMobileDrawer()"'), `Mobil hamburger menü açma butonu aktif`);

// Arama Butonları
check(indexContent.includes('onclick="App.openSearchModal()"'), `Arama modal açma butonu aktif`);

// PDP Sticky Buy Bar Fonksiyon Testi
check(typeof App.openWireOrderModal === 'function', `App.openWireOrderModal fonksiyonu mevcut`);
check(typeof App.filterJewelleryCategory === 'function', `App.filterJewelleryCategory fonksiyonu mevcut`);
check(typeof App.filterWatchesByBrand === 'function', `App.filterWatchesByBrand fonksiyonu mevcut`);
check(typeof App.filterEliteWatchesByBrand === 'function', `App.filterEliteWatchesByBrand fonksiyonu mevcut`);

// 5. SONUÇ RAPORU
console.log('\n====================================================================');
console.log(`📊 STRES TESTİ TAMAMLANDI: Toplam ${totalTests} Kontrol Noktası`);
console.log(`   ✅ Başarılı (PASS): ${passedTests}`);
console.log(`   ❌ Başarısız (FAIL): ${failedTests}`);
console.log('====================================================================\n');

if (failedTests > 0) {
  console.error(`🚨 TOPLAM ${failedTests} HATA TESPİT EDİLDİ:`);
  errors.forEach((err, idx) => {
    console.error(`  ${idx + 1}. ${err.description} -> ${err.context}`);
  });
  process.exit(1);
} else {
  console.log('🎉 TEBRİKLER! TÜM LİNKLER, BUTONLAR, MOBİL VE MASAÜSTÜ EYLEMLER %100 HATASIZ!\n');
  process.exit(0);
}
