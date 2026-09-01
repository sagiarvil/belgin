// BELGIN KUYUMCULUK — SEO CI/CD QUALITY GATE (G0-G12)
// Universal SEO, Indexability & Production Hardening Mandate v2.0 Standard

const fs = require('fs');
const path = require('path');
const { BASE_URL, SEO_REGISTRY } = require('./seo-registry.js');
const { PRODUCTS: products } = require('../js/data.js');
const { CATEGORY_ROUTES, productRoute, productUrl } = require('./seo-routes.js');

const ROOT_DIR = path.join(__dirname, '..');

function extractLocs(xml) {
  const matches = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)];
  return matches.map(m => m[1].trim());
}

function runQualityGates() {
  console.log('🔍 [SEO CI/CD Gate] Kurumsal SEO Kalite Kapıları (G0-G12) Çalıştırılıyor...');
  const errors = [];

  // G0: Zorunlu Temel Dosyalar (Required Files)
  const requiredFiles = [
    'index.html',
    'robots.txt',
    'llms.txt',
    'llms-full.txt',
    'sitemap.xml',
    'sitemap-pages.xml',
    'sitemap-categories.xml',
    'sitemap-products.xml',
    'sitemap-magazine.xml',
    'js/seo-route-map.js',
    'scripts/live-seo-smoke.js',
    'scripts/seo-claims-registry.js',
    'scripts/seo-retired-products.json',
    'scripts/sync-seo-redirects.js'
  ];
  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(ROOT_DIR, f))) {
      errors.push(`[G0 REQUIRED FILES] Zorunlu dosya eksik: ${f}`);
    }
  }

  // G1: Sitemap İndeksi & Alt Sitemaps
  const sitemapIndex = path.join(ROOT_DIR, 'sitemap.xml');
  const sitemapPages = path.join(ROOT_DIR, 'sitemap-pages.xml');
  const sitemapCategories = path.join(ROOT_DIR, 'sitemap-categories.xml');
  const sitemapProducts = path.join(ROOT_DIR, 'sitemap-products.xml');
  const sitemapMagazine = path.join(ROOT_DIR, 'sitemap-magazine.xml');

  if (fs.existsSync(sitemapIndex)) {
    const idxContent = fs.readFileSync(sitemapIndex, 'utf8');
    if (!idxContent.includes('sitemap-pages.xml') || !idxContent.includes('sitemap-categories.xml') || !idxContent.includes('sitemap-products.xml') || !idxContent.includes('sitemap-magazine.xml')) {
      errors.push('[G1 SITEMAP INDEX] sitemap.xml tüm alt sitemapleri içermeli.');
    }
  }

  // G2: Sitemap URL'lerinde Fragment (#) ve Host Kontrolü
  const allSitemaps = [sitemapPages, sitemapCategories, sitemapProducts, sitemapMagazine];
  for (const sm of allSitemaps) {
    if (fs.existsSync(sm)) {
      const xml = fs.readFileSync(sm, 'utf8');
      const locs = extractLocs(xml);
      for (const loc of locs) {
        if (loc.includes('#')) {
          errors.push(`[G2 SITEMAP FRAGMENT] Sitemap içinde '#' karakterli URL yasak: ${loc}`);
        }
        if (!loc.startsWith(BASE_URL)) {
          errors.push(`[G2 SITEMAP HOST] Sitemap URL BASE_URL ile başlamalı: ${loc}`);
        }
      }
    }
  }

  // G3: Ürün Sayısı ve Sitemap Kapsamı (Product Coverage)
  let productLocSet = new Set();
  if (fs.existsSync(sitemapProducts)) {
    const xml = fs.readFileSync(sitemapProducts, 'utf8');
    const productLocs = extractLocs(xml);
    productLocSet = new Set(productLocs);

    if (productLocSet.size !== products.length) {
      errors.push(`[G3 SITEMAP COUNT] Ürün sitemap sayısı (${productLocSet.size}) PRODUCTS uzunluğuyla (${products.length}) uyuşmuyor!`);
    }
  }

  // G4: Canonical Benzersizliği & Uyuşmazlık Taraması (Canonical Uniqueness)
  const canonicalSet = new Set();
  for (const p of products) {
    const canonical = productUrl(p);
    if (canonicalSet.has(canonical)) {
      errors.push(`[G4 DUPLICATE CANONICAL] Yinelenen canonical URL: ${canonical}`);
    }
    canonicalSet.add(canonical);
  }

  // G5 & G11: Ürün Sayfaları Schema, Offer.url, @id, Canonical, H1 ve Indexability
  for (const p of products) {
    const route = productRoute(p);
    const expectedUrl = productUrl(p);
    const htmlPath = path.join(ROOT_DIR, route.replace(/^\/+|\/+$/g, ''), 'index.html');

    if (!fs.existsSync(htmlPath)) {
      errors.push(`[G11 STATIC HTML] Ürün HTML dosyası eksik: ${route}index.html`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!/<h1[\s>]/i.test(html)) {
      errors.push(`[G11 H1 MISSING] Ürün sayfasında H1 etiketi eksik: ${route}`);
    }
    if (/noindex/i.test(html)) {
      errors.push(`[G11 NOINDEX ERROR] Ürün sayfasında noindex bulundu: ${route}`);
    }
    if (!html.includes(`<link rel="canonical" href="${expectedUrl}">`)) {
      errors.push(`[G4 CANONICAL MISMATCH] Ürün sayfasındaki canonical beklenen URL ile uyuşmuyor: ${route}`);
    }
    if (!html.includes(`<meta property="og:url" content="${expectedUrl}">`)) {
      errors.push(`[G7 OG:URL MISMATCH] Ürün og:url canonical ile uyuşmuyor: ${route}`);
    }

    // Schema kontrolleri
    const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!schemaMatch) {
      errors.push(`[G5 SCHEMA MISSING] Ürün sayfasında JSON-LD schema scripti eksik: ${route}`);
    } else {
      try {
        const parsed = JSON.parse(schemaMatch[1]);
        const productObj = parsed['@graph']
          ? parsed['@graph'].find(item => item['@type'] === 'Product')
          : (parsed['@type'] === 'Product' ? parsed : null);

        if (!productObj) {
          errors.push(`[G5 SCHEMA PRODUCT TYPE] Product objesi bulunamadı: ${route}`);
        } else {
          if (productObj['@id'] !== `${expectedUrl}#product`) {
            errors.push(`[G5 SCHEMA @ID] Product @id mismatch (${productObj['@id']} != ${expectedUrl}#product): ${route}`);
          }
          if (productObj.offers?.url !== expectedUrl) {
            errors.push(`[G5 SCHEMA OFFER URL] Offer.url mismatch (${productObj.offers?.url} != ${expectedUrl}): ${route}`);
          }
          if (typeof productObj.offers?.price !== 'number' || isNaN(productObj.offers?.price)) {
            errors.push(`[G5 SCHEMA PRICE] Offer.price geçerli bir sayı değil: ${route}`);
          }
        }
      } catch (e) {
        errors.push(`[G5 SCHEMA PARSE ERROR] JSON-LD parse edilemedi: ${route} (${e.message})`);
      }
    }
  }

  // G6: Kategori Sayfaları Raw Product Href Kapsamı (%100 Coverage)
  const categoryKeys = ['elit-kategori', 'saatler', 'mucevherat'];
  for (const catKey of categoryKeys) {
    const catRoute = CATEGORY_ROUTES[catKey];
    const catHtmlPath = path.join(ROOT_DIR, catRoute.replace(/^\/+|\/+$/g, ''), 'index.html');
    if (!fs.existsSync(catHtmlPath)) {
      errors.push(`[G6 CATEGORY FILE] Kategori HTML eksik: ${catRoute}`);
      continue;
    }

    const catHtml = fs.readFileSync(catHtmlPath, 'utf8');
    const catCanonical = `${BASE_URL}${catRoute}`;

    // G7: Kategori Canonical == OG:URL ve H1
    if (!catHtml.includes(`<link rel="canonical" href="${catCanonical}">`)) {
      errors.push(`[G7 CATEGORY CANONICAL] Kategori canonical mismatch: ${catRoute}`);
    }
    if (!catHtml.includes(`<meta property="og:url" content="${catCanonical}">`)) {
      errors.push(`[G7 CATEGORY OG:URL] Kategori og:url canonical ile uyuşmuyor: ${catRoute}`);
    }
    if (!/<h1[\s>]/i.test(catHtml)) {
      errors.push(`[G7 CATEGORY H1] Kategori sayfasında H1 eksik: ${catRoute}`);
    }

    // Raw link coverage kontrolü
    const helper = require('./generate-static-seo-pages.js');
    const expectedCatProducts = products.filter(p => helper.categoryKey(p) === catKey);

    let missingLinks = 0;
    for (const p of expectedCatProducts) {
      const href = productRoute(p);
      if (!catHtml.includes(`href="${href}"`)) {
        missingLinks++;
      }
    }
    if (missingLinks > 0) {
      errors.push(`[G6 CATEGORY RAW LINKS] ${catKey} raw HTML içinde ${missingLinks}/${expectedCatProducts.length} ürün linki eksik! Coverage < 100%`);
    }
  }

  // G8: llms.txt & llms-full.txt Sözdizimi ve Biçimlendirme
  const llmsPath = path.join(ROOT_DIR, 'llms.txt');
  const llmsFullPath = path.join(ROOT_DIR, 'llms-full.txt');
  if (fs.existsSync(llmsPath)) {
    const llms = fs.readFileSync(llmsPath, 'utf8');
    if (/#urun-|#saatler|#mucevherat|#ikinci-el/.test(llms)) {
      errors.push('[G8 LLMS FRAGMENT] llms.txt içinde legacy fragment URL bulundu.');
    }
    // Check for malformed bold (e.g. - **Brand Name without closing **)
    const lines = llms.split('\n').filter(l => l.startsWith('- **'));
    for (const line of lines) {
      const boldParts = line.match(/\*\*/g);
      if (!boldParts || boldParts.length < 2) {
        errors.push(`[G8 LLMS BOLD MALFORMED] llms.txt içinde bozuk markdown bold: ${line}`);
      }
    }
  }
  if (fs.existsSync(llmsFullPath)) {
    const full = fs.readFileSync(llmsFullPath, 'utf8');
    if (/#urun-/.test(full)) {
      errors.push('[G8 LLMS FULL FRAGMENT] llms-full.txt içinde #urun- fragment URL bulundu.');
    }
  }

  // G9: Eski / Doğrulanmamış Hak Talepleri (25 Yıl, EST 1987, vb.)
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  if (/25\s*yıllık|25\s*yıldır|>25\s*Yıl</i.test(indexHtml)) {
    errors.push('[G9 STALE CLAIMS] index.html içinde eski "25 yıl / 25 yıllık" kalıntısı bulundu.');
  }
  if (/EST\.\s*1987/i.test(indexHtml)) {
    errors.push('[G9 STALE CLAIMS] index.html içinde yanlış "EST. 1987" ibaresi bulundu.');
  }

  // G10: Legacy Hash SEO Parçacıkları Kontrolü
  if (indexHtml.includes('#search=')) {
    errors.push('[G10 LEGACY HASH] index.html içinde #search= SearchAction kalıntısı bulundu.');
  }

  // G12: Rapor Bütünlüğü (Report Integrity)
  console.log('\n----------------------------------------------------');
  if (errors.length > 0) {
    console.error(`❌ [SEO CI/CD FAIL] Toplam ${errors.length} SEO/Indexability hatası tespit edildi:`);
    errors.forEach(err => console.error(`   • ${err}`));
    console.log('----------------------------------------------------\n');
    process.exit(1);
  }

  console.log(`SEO G0-G12 PASS — products=${products.length}, fragments=0, duplicateCanonical=0, categoryRawLinkCoverage=100%`);
  console.log('----------------------------------------------------\n');
  process.exit(0);
}

if (require.main === module) {
  runQualityGates();
}

module.exports = { runQualityGates };
