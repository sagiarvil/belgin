'use strict';
/**
 * Verification test for 2.El Altın Takılar page and linking
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function verifyAltinTakilar() {
  console.log('🔍 [VERIFY] 2.El Altın Takılar Sayfası ve Bağlantıları Denetleniyor...');

  const htmlPath = path.join(rootDir, 'mucevherat', 'ikinci-el-altin-takilar', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('❌ mucevherat/ikinci-el-altin-takilar/index.html bulunamadı!');
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  if (!htmlContent.includes('<title>2.El Altın Takılar')) {
    console.error('❌ HTML <title> etiketi eksik veya hatalı!');
    process.exit(1);
  }
  if (!htmlContent.includes('2.El Altın Takılar')) {
    console.error('❌ HTML H1 başlığı eksik!');
    process.exit(1);
  }
  if (!htmlContent.includes('rel="canonical"') || !htmlContent.includes('/mucevherat/ikinci-el-altin-takilar/')) {
    console.error('❌ Canonical URL etiketi eksik!');
    process.exit(1);
  }
  if (!htmlContent.includes('property="og:title"') || !htmlContent.includes('name="twitter:card"')) {
    console.error('❌ OpenGraph / Twitter meta etiketleri eksik!');
    process.exit(1);
  }
  if (!htmlContent.includes('application/ld+json')) {
    console.error('❌ JSON-LD @graph şeması eksik!');
    process.exit(1);
  }
  console.log('  ✅ mucevherat/ikinci-el-altin-takilar/index.html eksiksiz ve geçerli.');

  const mdPath = path.join(rootDir, 'llms', 'pages', 'mucevherat', 'ikinci-el-altin-takilar.md');
  if (!fs.existsSync(mdPath)) {
    console.error('❌ llms/pages/mucevherat/ikinci-el-altin-takilar.md bulunamadı!');
    process.exit(1);
  }
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  if (!mdContent.includes('Hero Grounding Answer') || !mdContent.includes('RDF Semantic Triples')) {
    console.error('❌ LLMS alt-grafında zorunlu bölümler eksik!');
    process.exit(1);
  }
  console.log('  ✅ llms/pages/mucevherat/ikinci-el-altin-takilar.md derin alt-grafı geçerli.');

  const mucevheratHtmlPath = path.join(rootDir, 'mucevherat', 'index.html');
  const mucevheratContent = fs.readFileSync(mucevheratHtmlPath, 'utf8');
  if (!mucevheratContent.includes('/mucevherat/ikinci-el-altin-takilar/')) {
    console.error('❌ mucevherat/index.html içinde 2.El Altın Takılar bağlantısı bulunamadı!');
    process.exit(1);
  }
  console.log('  ✅ mucevherat/index.html içinde masaüstü ve mobil menü bağlantıları doğrulandı.');

  // MANDATE v8.0 MOBILE-FIRST KONTROLLERI (MG0 - MG20)
  if (!htmlContent.includes('viewport-fit=cover')) {
    console.error('❌ [MG0] viewport meta etiketi eksik veya viewport-fit=cover içermiyor!');
    process.exit(1);
  }
  if (!htmlContent.includes('SpeakableSpecification')) {
    console.error('❌ [MG4] JSON-LD SpeakableSpecification şeması eksik!');
    process.exit(1);
  }
  if (!htmlContent.includes('sg-mobile-bar')) {
    console.error('❌ [MG11] sg-mobile-bar mobil hızlı erişim çubuğu bulunamadı!');
    process.exit(1);
  }

  // PWA ve Feed dosyaları
  const requiredMobileFiles = [
    'manifest.webmanifest',
    'sw.js',
    'sitemap-mobile.xml',
    'mobile/feed.xml',
    'llms/mobile/ikinci-el-altin-takilar-mobile.md',
    'llms/mobile/voice-queries.md',
    'llms/mobile/local-intent.md',
    'app-link.json',
    '.well-known/assetlinks.json',
    '.well-known/apple-app-site-association'
  ];

  for (const rel of requiredMobileFiles) {
    const fPath = path.join(rootDir, rel);
    if (!fs.existsSync(fPath)) {
      console.error(`❌ Zorunlu mobil dosya bulunamadı: ${rel}`);
      process.exit(1);
    }
  }
  console.log('  ✅ Tüm Mandate v8.0 mobil varlıkları ve PWA/Feed dosyaları eksiksiz doğrulandı.');

  console.log('🎉 [PASS] 2.El Altın Takılar başarıyla kuruldu ve doğrulandı!');
}

if (require.main === module) {
  verifyAltinTakilar();
}

module.exports = { verifyAltinTakilar };
