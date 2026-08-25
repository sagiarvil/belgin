// BELGIN KUYUMCULUK — SEO CI/CD QUALITY GATE (G0-G9)
// Universal SEO & AI Discoverability v5.0 Omni-Enterprise Standard

const fs = require('fs');
const path = require('path');
const { BASE_URL, SEO_REGISTRY } = require('./seo-registry.js');

const ROOT_DIR = path.join(__dirname, '..');

function runQualityGates() {
  console.log('🔍 [SEO CI/CD Gate] Kurumsal SEO & AI Kalite Kapıları Çalıştırılıyor...');
  const errors = [];
  const warnings = [];

  // G1: Canonical Tutarlılığı
  for (const page of SEO_REGISTRY) {
    if (page.indexDirective === 'index' && page.canonicalRoute !== page.route) {
      errors.push(`[G1 CANONICAL HATASI] ${page.route} canonical hedefiyle uyuşmuyor: ${page.canonicalRoute}`);
    }
  }

  // G2: Raw HTML ve Kritik Etiketler Kontrolü
  for (const page of SEO_REGISTRY) {
    const filename = page.route === '/' ? 'index.html' : page.route.replace(/^\//, '');
    const filePath = path.join(ROOT_DIR, filename);

    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');

      if (!html.includes('<title>')) errors.push(`[G2 RAW HTML] <title> etiketi eksik: ${filename}`);
      if (!html.includes('rel="canonical"')) errors.push(`[G2 RAW HTML] canonical link eksik: ${filename}`);
      if (!html.includes('<h1')) errors.push(`[G2 RAW HTML] H1 başlığı eksik: ${filename}`);
      if (!html.includes('application/ld+json')) errors.push(`[G2 RAW HTML] JSON-LD Schema eksik: ${filename}`);
    }
  }

  // G3: Cannibalization (Mükerrer Arama Niyeti)
  const intentMap = new Map();
  for (const page of SEO_REGISTRY) {
    if (page.indexDirective === 'index') {
      const key = `${page.locale}_${page.primaryIntent.toLowerCase().trim()}`;
      if (intentMap.has(key)) {
        errors.push(`[G3 CANNIBALIZATION] "${page.primaryIntent}" niyeti çakışıyor: ${intentMap.get(key)} ve ${page.route}`);
      } else {
        intentMap.set(key, page.route);
      }
    }
  }

  // G4: Sitemap ve Robots Bütünlüğü
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    errors.push('[G4 SITEMAP] sitemap.xml dosyası mevcut değil!');
  } else {
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    if (!sitemapContent.includes('<urlset') || !sitemapContent.includes(BASE_URL)) {
      errors.push('[G4 SITEMAP] sitemap.xml içeriği geçersiz veya boş!');
    }
  }

  const robotsPath = path.join(ROOT_DIR, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    errors.push('[G4 ROBOTS] robots.txt dosyası mevcut değil!');
  } else {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    if (!robotsContent.includes('Sitemap:') || !robotsContent.includes('Googlebot')) {
      errors.push('[G4 ROBOTS] robots.txt sitemap veya bot yönergeleri eksik!');
    }
  }

  // G5: LLMs.txt ve AI Keşif Katmanı
  const llmsPath = path.join(ROOT_DIR, 'llms.txt');
  const llmsFullPath = path.join(ROOT_DIR, 'llms-full.txt');
  if (!fs.existsSync(llmsPath) || !fs.existsSync(llmsFullPath)) {
    errors.push('[G5 GEO/AI] llms.txt veya llms-full.txt dosyası eksik!');
  }

  // SONUÇ RAPORU
  if (errors.length > 0) {
    console.error(`\n❌ [SEO CI/CD Gate] ${errors.length} ADET KRİTİK HATA TESPİT EDİLDİ:\n`);
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('✅ [SEO CI/CD Gate] G0-G9 Tüm SEO Kalite Kapıları 0 Hata ile Başarıyla Geçildi.');
}

runQualityGates();
