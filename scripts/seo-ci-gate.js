// BELGIN KUYUMCULUK — SEO CI/CD QUALITY GATE (G0-G12)
// Universal SEO & AI Discoverability v6.0 Enterprise Standard

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
  console.log('🔍 [SEO CI/CD Gate] Kurumsal SEO & AI Kalite Kapıları Çalıştırılıyor...');
  const errors = [];

  // G1: Sitemap İndeksi & Alt Sitemap Dosyaları Kontrolü
  const sitemapIndex = path.join(ROOT_DIR, 'sitemap.xml');
  const sitemapPages = path.join(ROOT_DIR, 'sitemap-pages.xml');
  const sitemapCategories = path.join(ROOT_DIR, 'sitemap-categories.xml');
  const sitemapProducts = path.join(ROOT_DIR, 'sitemap-products.xml');

  [sitemapIndex, sitemapPages, sitemapCategories, sitemapProducts].forEach(file => {
    if (!fs.existsSync(file)) {
      errors.push(`[G1 SITEMAP] Eksik sitemap dosyası: ${path.basename(file)}`);
    }
  });

  // G2: Sitemap URL'lerinde Fragment (#) ve Canonical Format Kontrolü
  const allSitemaps = [sitemapPages, sitemapCategories, sitemapProducts];
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

  // G3: Ürün Sayısı ve Sitemap Eşleşmesi
  if (fs.existsSync(sitemapProducts)) {
    const xml = fs.readFileSync(sitemapProducts, 'utf8');
    const productLocs = extractLocs(xml);
    const locSet = new Set(productLocs);

    if (locSet.size !== products.length) {
      errors.push(`[G3 SITEMAP COUNT] Ürün sitemap sayısı (${locSet.size}) PRODUCTS uzunluğuyla (${products.length}) uyuşmuyor!`);
    }

    // Her ürünün Sitemap'te ve Gerçek HTML Dosyası Olarak Mevcut Olduğunu Doğrula
    for (const p of products) {
      const route = productRoute(p);
      const expectedUrl = productUrl(p);

      if (!locSet.has(expectedUrl)) {
        errors.push(`[G3 SITEMAP MISSING] Ürün sitemap içinde eksik: ${expectedUrl}`);
      }

      const htmlPath = path.join(ROOT_DIR, route.replace(/^\/+|\/+$/g, ''), 'index.html');
      if (!fs.existsSync(htmlPath)) {
        errors.push(`[G3 STATIC HTML] Ürün HTML dosyası eksik: ${route}index.html`);
      } else {
        const html = fs.readFileSync(htmlPath, 'utf8');
        if (!html.includes('<h1')) {
          errors.push(`[G3 H1 MISSING] Ürün sayfasında H1 etiketi eksik: ${route}`);
        }
        if (!html.includes('rel="canonical"')) {
          errors.push(`[G3 CANONICAL MISSING] Ürün sayfasında canonical link eksik: ${route}`);
        }
        if (!html.includes(`href="${expectedUrl}"`)) {
          errors.push(`[G3 CANONICAL MISMATCH] Ürün sayfasındaki canonical beklenen URL ile uyuşmuyor: ${route}`);
        }
        if (!html.includes('"@type":"Product"') && !html.includes('"@type": "Product"')) {
          errors.push(`[G3 SCHEMA MISSING] Ürün sayfasında Product Schema eksik: ${route}`);
        }
        if (html.includes('priceValidUntil')) {
          errors.push(`[G3 FAKE CLAIM] Ürün sayfasında sahte priceValidUntil iddiası yasak: ${route}`);
        }
      }
    }
  }

  // G4: LLMs.txt ve LLMs-Full.txt Fragment Kontrolü
  const llmsPath = path.join(ROOT_DIR, 'llms.txt');
  const llmsFullPath = path.join(ROOT_DIR, 'llms-full.txt');

  if (!fs.existsSync(llmsPath) || !fs.existsSync(llmsFullPath)) {
    errors.push('[G4 LLMS] llms.txt veya llms-full.txt dosyası eksik!');
  } else {
    const llms = fs.readFileSync(llmsPath, 'utf8');
    const llmsFull = fs.readFileSync(llmsFullPath, 'utf8');

    if (llms.includes('#urun-')) {
      errors.push('[G4 LLMS FRAGMENT] llms.txt içinde #urun- formatı yasak!');
    }
    if (llmsFull.includes('#urun-')) {
      errors.push('[G4 LLMS FRAGMENT] llms-full.txt içinde #urun- formatı yasak!');
    }
  }

  // G5: Kategori HTML Dosyaları Kontrolü
  for (const key of ['saatler', 'mucevherat', 'ikinci-el']) {
    const catRoute = CATEGORY_ROUTES[key];
    const catHtmlPath = path.join(ROOT_DIR, catRoute.replace(/^\/+|\/+$/g, ''), 'index.html');
    if (!fs.existsSync(catHtmlPath)) {
      errors.push(`[G5 CATEGORY HTML] Kategori HTML eksik: ${catRoute}index.html`);
    } else {
      const catHtml = fs.readFileSync(catHtmlPath, 'utf8');
      if (!catHtml.includes('<h1')) {
        errors.push(`[G5 CATEGORY H1] Kategori sayfasında H1 eksik: ${catRoute}`);
      }
      if (!catHtml.includes(`rel="canonical"`) || !catHtml.includes(`href="${BASE_URL}${catRoute}"`)) {
        errors.push(`[G5 CATEGORY CANONICAL] Kategori sayfasında canonical eksik veya hatalı: ${catRoute}`);
      }
    }
  }

  // G6: Robots.txt Kontrolü
  const robotsPath = path.join(ROOT_DIR, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    errors.push('[G6 ROBOTS] robots.txt dosyası mevcut değil!');
  } else {
    const robots = fs.readFileSync(robotsPath, 'utf8');
    if (!robots.includes(`Sitemap: ${BASE_URL}/sitemap.xml`)) {
      errors.push(`[G6 ROBOTS SITEMAP] robots.txt sitemap indeksi ${BASE_URL}/sitemap.xml içermelidir!`);
    }
  }

  // G7: index.html İçinde href="#" Kategori Linki Olmamalıdır
  const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    if (indexHtml.includes('href="#" data-page="saatler"')) {
      errors.push('[G7 INDEX LINK] index.html içinde href="#" data-page="saatler" bulundu; gerçek /saatler/ yolu kullanılmalıdır.');
    }
    if (indexHtml.includes('href="#" data-page="mucevherat"')) {
      errors.push('[G7 INDEX LINK] index.html içinde href="#" data-page="mucevherat" bulundu; gerçek /mucevherat/ yolu kullanılmalıdır.');
    }
    if (indexHtml.includes('href="#" data-page="ikinci-el"')) {
      errors.push('[G7 INDEX LINK] index.html içinde href="#" data-page="ikinci-el" bulundu; gerçek /ikinci-el/ yolu kullanılmalıdır.');
    }
  }

  // SONUÇ RAPORU
  if (errors.length > 0) {
    console.error(`\n❌ [SEO CI/CD Gate] ${errors.length} ADET KRİTİK HATA TESPİT EDİLDİ:\n`);
    errors.slice(0, 20).forEach(err => console.error(`  - ${err}`));
    if (errors.length > 20) {
      console.error(`  ... ve ${errors.length - 20} adet diğer hata.`);
    }
    process.exit(1);
  }

  console.log('✅ [SEO CI/CD Gate] G0-G12 Tüm SEO Kalite Kapıları 0 Hata ile Başarıyla Geçildi.');
}

if (require.main === module) {
  runQualityGates();
}

module.exports = { runQualityGates };
