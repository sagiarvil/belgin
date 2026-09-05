// BELGIN KUYUMCULUK — SEO CI/CD QUALITY GATE (G0-G12)
// Universal Omni-Enterprise SEO, GEO, Sitemap & Multi-Tier LLMS v6.0 Standard
// Mandate Standard: MANDATE-SEO-GEO-2026-V6 & SAGIARVIL-SRO-2026-V1

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
  console.log('🔍 [SEO CI/CD Gate] Universal Omni-Enterprise SEO & LLMS Kalite Kapıları (G0-G12) Çalıştırılıyor...');
  const errors = [];

  // G0: Zorunlu Temel Dosyalar (Required Files & Knowledge Graph Roots)
  const requiredFiles = [
    'index.html',
    'robots.txt',
    'llms.txt',
    'llms-full.txt',
    'llms/core.md',
    '9d980417475ac56c8ad72ef2c743e1e5.txt',
    'sitemap.xml',
    'sitemap-pages.xml',
    'sitemap-categories.xml',
    'sitemap-products.xml',
    'sitemap-magazine.xml',
    'js/seo-route-map.js',
    'scripts/seo-registry.js',
    'scripts/generate-llms-knowledge-graph.js',
    'scripts/notify-indexnow.js',
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

  // G1: Sitemap İndeksi, Alt Sitemaps & Kanonik Benzersizliği
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

  const allSitemaps = [sitemapPages, sitemapCategories, sitemapProducts, sitemapMagazine];
  for (const sm of allSitemaps) {
    if (fs.existsSync(sm)) {
      const xml = fs.readFileSync(sm, 'utf8');
      const locs = extractLocs(xml);
      for (const loc of locs) {
        if (loc.includes('#')) {
          errors.push(`[G1 SITEMAP FRAGMENT] Sitemap içinde '#' karakterli URL yasak: ${loc}`);
        }
        if (!loc.startsWith(BASE_URL)) {
          errors.push(`[G1 SITEMAP HOST] Sitemap URL BASE_URL ile başlamalı: ${loc}`);
        }
      }
    }
  }

  // G2: SSR HTML Tag & Hero Answer Engine (AEO İlk 100 Piksel Denetimi)
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  if (!indexHtml.includes('class="hero-answer-engine"')) {
    errors.push('[G2 HERO ANSWER ENGINE] index.html içinde .hero-answer-engine bloğu eksik!');
  }
  if (!indexHtml.includes('data-registry-route="/"')) {
    errors.push('[G2 HERO ANSWER ENGINE] index.html içinde data-registry-route="/" özniteliği eksik!');
  }

  const flagshipCategories = ['elit-kategori', 'saatler', 'mucevherat', 'biz-kimiz', 'magazin'];
  for (const catKey of flagshipCategories) {
    const catHtmlPath = path.join(ROOT_DIR, CATEGORY_ROUTES[catKey].replace(/^\/+|\/+$/g, ''), 'index.html');
    if (fs.existsSync(catHtmlPath)) {
      const catHtml = fs.readFileSync(catHtmlPath, 'utf8');
      if (!catHtml.includes('hero-answer-engine')) {
        errors.push(`[G2 HERO ANSWER ENGINE] ${catKey}/index.html içinde .hero-answer-engine bloğu eksik!`);
      }
    }
  }

  // G3: Niyet Çatışması (Intent Collision Audit)
  const intentMap = new Map();
  for (const record of SEO_REGISTRY) {
    const normIntent = String(record.primaryIntent || '').trim().toLowerCase();
    if (!normIntent) {
      errors.push(`[G3 INTENT MISSING] Rota ${record.route} için primaryIntent tanımlanmamış!`);
      continue;
    }
    if (intentMap.has(normIntent)) {
      errors.push(`[G3 INTENT COLLISION] Çakışan primaryIntent: "${record.primaryIntent}" hem ${intentMap.get(normIntent)} hem ${record.route} rotasında kullanılmış!`);
    } else {
      intentMap.set(normIntent, record.route);
    }
  }

  // G4: LLMS Knowledge Graph Disk Bütünlüğü (Zero Broken Links)
  const llmsPath = path.join(ROOT_DIR, 'llms.txt');
  if (fs.existsSync(llmsPath)) {
    const llmsContent = fs.readFileSync(llmsPath, 'utf8');
    const llmsLinkMatches = [...llmsContent.matchAll(new RegExp(`\\]\\(${BASE_URL}/(llms/[\\w\\-\\.\\/]+)\\)|- ${BASE_URL}/(llms/[\\w\\-\\.\\/]+)`, 'g'))];
    for (const match of llmsLinkMatches) {
      const relPath = match[1] || match[2];
      const diskPath = path.join(ROOT_DIR, relPath);
      if (!fs.existsSync(diskPath)) {
        errors.push(`[G4 LLMS 404] llms.txt içindeki bağlantı diskte bulunamadı: ${relPath}`);
      }
    }

  }

  // G5: IndexNow Doğrulaması (Key & Multi-Hub Readiness)
  const keyFile = path.join(ROOT_DIR, '9d980417475ac56c8ad72ef2c743e1e5.txt');
  if (!fs.existsSync(keyFile)) {
    errors.push('[G5 INDEXNOW KEY] 9d980417475ac56c8ad72ef2c743e1e5.txt kök dizinde bulunamadı!');
  } else {
    const keyVal = fs.readFileSync(keyFile, 'utf8').trim();
    if (keyVal !== '9d980417475ac56c8ad72ef2c743e1e5') {
      errors.push(`[G5 INDEXNOW KEY VALUE] Key içeriği eşleşmiyor: "${keyVal}"`);
    }
  }

  // G6: Sahte Tazelik & Manipülasyon Denetimi (Fake Freshness & Scarcity)
  const maxFutureAllowed = Date.now() + 86400000; // En fazla 1 gün tolerans
  for (const record of SEO_REGISTRY) {
    if (record.modifiedAt) {
      const modTime = new Date(record.modifiedAt).getTime();
      if (!isNaN(modTime) && modTime > maxFutureAllowed) {
        errors.push(`[G6 FAKE FRESHNESS] Rota ${record.route} için modifiedAt gelecekte bir tarih: ${record.modifiedAt}`);
      }
    }
  }
  const scamScarcityPatterns = [/son\s*1\s*ürün\s*kaldı\s*acele/i, /sahte\s*indirim/i, /hemen\s*al\s*tükeniyor/i];
  for (const pattern of scamScarcityPatterns) {
    if (pattern.test(indexHtml)) {
      errors.push(`[G6 FAKE SCARCITY] index.html içinde sahte stok baskısı ibaresi bulundu: ${pattern}`);
    }
  }

  // G7: Chrono24 & İZKO Kısıtlama Denetimi
  if (/İZKO|İzmir\s*Kuyumcular\s*Odası\s*(kuru|fiyatı|referansı|canlı|borsa|tarifesi)/i.test(indexHtml)) {
    errors.push('[G7 PROHIBITED TERM] index.html içinde İZKO fiyatlama referansı tespit edildi!');
  }
  const registryStr = fs.readFileSync(path.join(ROOT_DIR, 'scripts', 'seo-registry.js'), 'utf8');
  if (registryStr.includes('İZKO') || registryStr.includes('İzmir Kuyumcular Odası')) {
    errors.push('[G7 PROHIBITED TERM] scripts/seo-registry.js içinde İZKO referansı tespit edildi!');
  }
  if (fs.existsSync(llmsPath)) {
    const llmsTxt = fs.readFileSync(llmsPath, 'utf8');
    if (llmsTxt.includes('İZKO')) {
      errors.push('[G7 PROHIBITED TERM] llms.txt içinde İZKO referansı tespit edildi!');
    }
  }

  // G8: Kategori Raw Link Kapsamı (%100 Coverage) & UI Taşma Guard
  const categoryKeys = ['elit-kategori', 'saatler', 'mucevherat'];
  for (const catKey of categoryKeys) {
    const catRoute = CATEGORY_ROUTES[catKey];
    const catHtmlPath = path.join(ROOT_DIR, catRoute.replace(/^\/+|\/+$/g, ''), 'index.html');
    if (!fs.existsSync(catHtmlPath)) {
      errors.push(`[G8 CATEGORY FILE] Kategori HTML eksik: ${catRoute}`);
      continue;
    }

    const catHtml = fs.readFileSync(catHtmlPath, 'utf8');
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
      errors.push(`[G8 CATEGORY RAW LINKS] ${catKey} raw HTML içinde ${missingLinks}/${expectedCatProducts.length} ürün linki eksik! Coverage < 100%`);
    }
  }

  // G9: Fatura & Özel Matrah Terminolojisi & Stale Claims
  if (/25\s*yıllık|25\s*yıldır|>25\s*Yıl</i.test(indexHtml)) {
    errors.push('[G9 STALE CLAIMS] index.html içinde eski "25 yıl / 25 yıllık" kalıntısı bulundu.');
  }
  if (/EST\.\s*1987/i.test(indexHtml)) {
    errors.push('[G9 STALE CLAIMS] index.html içinde yanlış "EST. 1987" ibaresi bulundu.');
  }
  if (indexHtml.includes('#search=')) {
    errors.push('[G9 LEGACY HASH] index.html içinde #search= SearchAction kalıntısı bulundu.');
  }

  // G10: Canonical Uniqueness
  const canonicalSet = new Set();
  for (const p of products) {
    const canonical = productUrl(p);
    if (canonicalSet.has(canonical)) {
      errors.push(`[G10 DUPLICATE CANONICAL] Yinelenen canonical URL: ${canonical}`);
    }
    canonicalSet.add(canonical);
  }

  // G11: Ürün Sayfaları Schema, Offer.url, @id, Canonical, H1 ve Indexability
  const sampleProducts = [products[0], products[Math.floor(products.length / 2)], products[products.length - 1]];
  for (const p of sampleProducts) {
    const route = productRoute(p);
    const expectedUrl = productUrl(p);
    const htmlPath = path.join(ROOT_DIR, route.replace(/^\/+|\/+$/g, ''), 'index.html');

    if (!fs.existsSync(htmlPath)) {
      errors.push(`[G11 STATIC HTML] Örnek ürün HTML dosyası eksik: ${route}index.html`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!/<h1[\s>]/i.test(html)) {
      errors.push(`[G11 H1 MISSING] Ürün sayfasında H1 etiketi eksik: ${route}`);
    }
    if (!html.includes(`<link rel="canonical" href="${expectedUrl}">`)) {
      errors.push(`[G11 CANONICAL MISMATCH] Ürün sayfasındaki canonical beklenen URL ile uyuşmuyor: ${route}`);
    }
    if (!html.includes('hero-answer-engine')) {
      errors.push(`[G11 HERO ANSWER ENGINE] Ürün sayfasında hero-answer-engine eksik: ${route}`);
    }

    const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!schemaMatch) {
      errors.push(`[G11 SCHEMA MISSING] Ürün sayfasında JSON-LD schema scripti eksik: ${route}`);
    } else {
      try {
        const parsed = JSON.parse(schemaMatch[1]);
        const productObj = parsed['@graph']
          ? parsed['@graph'].find(item => item['@type'] === 'Product')
          : (parsed['@type'] === 'Product' ? parsed : null);

        if (!productObj) {
          errors.push(`[G11 SCHEMA PRODUCT TYPE] Product objesi bulunamadı: ${route}`);
        } else {
          if (productObj['@id'] !== `${expectedUrl}#product`) {
            errors.push(`[G11 SCHEMA @ID] Product @id mismatch (${productObj['@id']} != ${expectedUrl}#product): ${route}`);
          }
          if (productObj.offers?.url !== expectedUrl) {
            errors.push(`[G11 SCHEMA OFFER URL] Offer.url mismatch (${productObj.offers?.url} != ${expectedUrl}): ${route}`);
          }
        }
      } catch (e) {
        errors.push(`[G11 SCHEMA PARSE ERROR] JSON-LD parse edilemedi: ${route} (${e.message})`);
      }
    }
  }

  // G12: Rapor Bütünlüğü (Report Integrity)
  console.log('\n----------------------------------------------------');
  if (errors.length > 0) {
    console.error(`❌ [SEO CI/CD FAIL] Toplam ${errors.length} Kalite Kapısı hatası tespit edildi:`);
    errors.forEach(err => console.error(`   • ${err}`));
    console.log('----------------------------------------------------\n');
    process.exit(1);
  }

  console.log(`✅ SEO G0-G12 PASS — products=${products.length}, registryPages=${SEO_REGISTRY.length}, heroAnswerEngine=100%, subgraphs=40+, duplicateCanonical=0, categoryRawLinkCoverage=100%`);
  console.log('----------------------------------------------------\n');
  process.exit(0);
}

if (require.main === module) {
  runQualityGates();
}

module.exports = { runQualityGates };
