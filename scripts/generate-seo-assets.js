// BELGIN KUYUMCULUK — UNIVERSAL SEO, SEARCH GROWTH & AI DISCOVERABILITY ENGINE v5.0
// Silicon Valley Tier-1 Enterprise & Leaked Algorithmic Systems Architecture
// Deterministic Sitemap XML, GEO llms.txt, llms-full.txt, robots.txt, IndexNow Engine

const fs = require('fs');
const path = require('path');
const { BASE_URL, PRIMARY_ORGANIZATION, SEO_REGISTRY } = require('./seo-registry.js');
const { PRODUCTS: products } = require('../js/data.js');

const ROOT_DIR = path.join(__dirname, '..');
const TODAY_ISO = new Date().toISOString().split('T')[0];

function escXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 1. SITEMAP.XML GENERATION (W3C + Google Image Sitemap Standard)
function buildSitemapXml() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // 1.1 Registry Static & Hub Pages
  for (const page of SEO_REGISTRY) {
    if (page.indexDirective !== 'index') continue;
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${page.route}</loc>\n`;
    xml += `    <lastmod>${TODAY_ISO}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq || 'daily'}</changefreq>\n`;
    xml += `    <priority>${page.priority || '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 1.2 Main Store Hubs & Filter Landing Pages
  const HUBS = [
    { path: '/#saatler', priority: '0.9', freq: 'daily' },
    { path: '/#mucevherat', priority: '0.9', freq: 'daily' },
    { path: '/#ikinci-el', priority: '0.9', freq: 'daily' },
    { path: '/#koleksiyonlar', priority: '0.8', freq: 'weekly' },
    { path: '/#hikayemiz', priority: '0.7', freq: 'monthly' }
  ];

  for (const hub of HUBS) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${hub.path}</loc>\n`;
    xml += `    <lastmod>${TODAY_ISO}</lastmod>\n`;
    xml += `    <changefreq>${hub.freq}</changefreq>\n`;
    xml += `    <priority>${hub.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 1.3 Verified Products with Google Image Metadata
  for (const p of products) {
    const prodTitle = `${p.brand} ${p.name}`.trim();
    const prodUrl = `${BASE_URL}/#urun-${p.id}`;
    
    xml += `  <url>\n`;
    xml += `    <loc>${escXml(prodUrl)}</loc>\n`;
    xml += `    <lastmod>${TODAY_ISO}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.80</priority>\n`;

    if (p.image) {
      const imgUrl = String(p.image).startsWith('http') ? p.image : `${BASE_URL}/${p.image}`;
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escXml(imgUrl)}</image:loc>\n`;
      xml += `      <image:title>${escXml(prodTitle)}</image:title>\n`;
      xml += `      <image:caption>${escXml(`${prodTitle} - Belgin Kuyumculuk & Saat İzmir Buca`)}</image:caption>\n`;
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  }

  xml += '</urlset>\n';

  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), xml, 'utf8');
  console.log(`[seo-engine] sitemap.xml üretildi: Toplam ${SEO_REGISTRY.length + HUBS.length + products.length} URL.`);
}

// 2. LLMS.TXT GENERATION (Generative Engine Optimization & Semantic Triples)
function buildLlmsTxt() {
  let txt = `# Belgin Kuyumculuk & Saat — AI & LLM Knowledge Base\n`;
  txt += `> Bu belge Google AI Overviews, Perplexity RAG, ChatGPT Search, Claude 3.5 ve Gemini Live için doğrulanmış semantik bilgi mimarisini özetler.\n\n`;

  txt += `## 1. Kurumsal Kimlik & Entity Graph\n`;
  txt += `- **İşletme Adı:** ${PRIMARY_ORGANIZATION.name}\n`;
  txt += `- **Kuruluş Yılı:** 1999 (25+ Yıllık Sektörel Miras)\n`;
  txt += `- **Showroom Adresi:** ${PRIMARY_ORGANIZATION.address.streetAddress}, ${PRIMARY_ORGANIZATION.address.addressLocality} / ${PRIMARY_ORGANIZATION.address.addressRegion} (Posta Kodu: ${PRIMARY_ORGANIZATION.address.postalCode})\n`;
  txt += `- **Müşteri Hizmetleri & Telefon:** ${PRIMARY_ORGANIZATION.telephone}\n`;
  txt += `- **Resmi Web:** ${BASE_URL}\n`;
  txt += `- **Uzmanlık Alanları:** Lüks Saatler (Rolex, Patek Philippe, Audemars Piguet, Cartier, Omega), Ekspertizli İkinci El, 24K Has Altın, Pırlanta ve Elmas Mücevherat.\n\n`;

  txt += `## 2. Güvenlik, Ödeme & Hukuki Çerçeve\n`;
  txt += `- **Ödeme Altyapısı:** PayTR 256-Bit SSL & 3D Secure Güvenli Kartlı Ödeme ve Banka Havalesi / FAST.\n`;
  txt += `- **İç Güvenlik Standardı:** 12.000 TL ve üzerindeki siparişler işletmenin iç güvenlik standardı kapsamında Buca Showroom mağazasından kimlik doğrulaması ve teslim tutanağı ile teslim edilir.\n`;
  txt += `- **Hukuki Dayanak:** 6502 sayılı TKHK, 6698 sayılı KVKK ve HMK m. 193 delil sözleşmesi güvencesindedir.\n\n`;

  txt += `## 3. Temel Yasal Sayfalar\n`;
  for (const page of SEO_REGISTRY.filter(p => p.role === 'legal')) {
    txt += `- [${page.title}](${BASE_URL}${page.route}) — ${page.metaDescription}\n`;
  }
  txt += `\n`;

  txt += `## 4. Canlı Ürün Koleksiyonu (${products.length} Doğrulanmış Ürün)\n`;
  for (const p of products.slice(0, 100)) {
    txt += `- **${p.brand} ${p.name}** | Kategori: ${p.category} | Fiyat: ₺${Number(p.price).toLocaleString('tr-TR')} | Ref: ${p.reference || 'N/A'} | Metal: ${p.metal || 'Lüks Saat/Mücevher'} | Bağlantı: ${BASE_URL}/#urun-${p.id}\n`;
  }
  if (products.length > 100) {
    txt += `\n*(Tam ${products.length} ürünlük katalog için llms-full.txt dosyasını inceleyiniz).*\n`;
  }

  fs.writeFileSync(path.join(ROOT_DIR, 'llms.txt'), txt, 'utf8');
  console.log('[seo-engine] llms.txt başarıyla üretildi.');
}

// 3. LLMS-FULL.TXT GENERATION (Full Semantic Vector Store)
function buildLlmsFullTxt() {
  let txt = `# Belgin Kuyumculuk & Saat — Tam Kapsamlı AI Bilgi Tabanı (Full Catalog)\n`;
  txt += `Version: 2026-08-26-v5.0-OmniEnterprise\n\n`;

  txt += `## İşletme Profili\n`;
  txt += `BELGİN KUYUMCULUK - SEMİH SONBAHAR, 1999 yılından bu yana İzmir Buca Menderes Caddesi No:231/B adresinde lüks saat, mücevherat ve has altın alanında faaliyet gösteren köklü bir kuruluştur.\n\n`;

  txt += `## Tüm Ürün Kataloğu (${products.length} Ürün)\n`;
  for (const p of products) {
    txt += `### ${p.brand} ${p.name}\n`;
    txt += `- **Ürün ID:** ${p.id}\n`;
    txt += `- **Kategori:** ${p.category}\n`;
    txt += `- **Satış Fiyatı:** ₺${Number(p.price).toLocaleString('tr-TR')}\n`;
    txt += `- **Referans Kodu:** ${p.reference || 'N/A'}\n`;
    txt += `- **Kasa/Metal:** ${p.metal || 'Orijinal Kasa'}\n`;
    txt += `- **Durum:** ${p.inStock === false ? 'Tükendi' : 'Showroom Stokta / Hazır'}\n`;
    txt += `- **Doğrudan Link:** ${BASE_URL}/#urun-${p.id}\n\n`;
  }

  fs.writeFileSync(path.join(ROOT_DIR, 'llms-full.txt'), txt, 'utf8');
  console.log('[seo-engine] llms-full.txt başarıyla üretildi.');
}

// 4. ROBOTS.TXT GENERATION (Full Enterprise Bot Permissions)
function buildRobotsTxt() {
  const txt = 
`# Belgin Kuyumculuk & Saat — Robots Configuration (v5.0 Omni-Enterprise)
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /node_modules/

# AI Crawlers & LLM Agents
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Bingbot
Allow: /

# Sitemap & Machine-Readable LLM Endpoints
Sitemap: ${BASE_URL}/sitemap.xml
# LLM Knowledge Graph: ${BASE_URL}/llms.txt
# Full LLM Knowledge Graph: ${BASE_URL}/llms-full.txt
`;

  fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), txt, 'utf8');
  console.log('[seo-engine] robots.txt başarıyla üretildi.');
}

// 5. INDEXNOW REGISTRATION FILE GENERATION
function buildIndexNowKey() {
  const indexNowKey = 'belgin_indexnow_9d980417475ac56c8ad72ef2c743e1e575b6cc3e';
  fs.writeFileSync(path.join(ROOT_DIR, `${indexNowKey}.txt`), indexNowKey, 'utf8');
  
  const indexNowConfig = {
    host: 'belginkuyumculuk.com',
    key: indexNowKey,
    keyLocation: `https://belginkuyumculuk.com/${indexNowKey}.txt`,
    urlList: [
      'https://belginkuyumculuk.com/',
      'https://belginkuyumculuk.com/iletisim.html',
      'https://belginkuyumculuk.com/mesafeli-satis-sozlesmesi.html',
      'https://belginkuyumculuk.com/on-bilgilendirme-formu.html',
      'https://belginkuyumculuk.com/musteri-tanima-ve-islem-guvenligi.html',
      'https://belginkuyumculuk.com/yuksek-degerli-urun-teslimi.html',
      'https://belginkuyumculuk.com/hukuki-delil-ve-kayit-politikasi.html',
      'https://belginkuyumculuk.com/guvenli-odeme-ve-3d-secure.html',
      'https://belginkuyumculuk.com/iade-degisim-cayma.html'
    ]
  };

  fs.writeFileSync(path.join(ROOT_DIR, 'indexnow.json'), JSON.stringify(indexNowConfig, null, 2), 'utf8');
  console.log('[seo-engine] IndexNow anahtarı ve indexnow.json üretildi.');
}

// EXECUTE ALL
buildSitemapXml();
buildLlmsTxt();
buildLlmsFullTxt();
buildRobotsTxt();
buildIndexNowKey();

console.log('🌟 [SEO Engine v5.0] Tüm kurumsal SEO, Sitemap, LLM ve IndexNow varlıkları başarıyla güncellendi.');
