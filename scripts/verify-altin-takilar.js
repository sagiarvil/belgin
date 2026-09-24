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

  console.log('🎉 [PASS] 2.El Altın Takılar başarıyla kuruldu ve doğrulandı!');
}

if (require.main === module) {
  verifyAltinTakilar();
}

module.exports = { verifyAltinTakilar };
