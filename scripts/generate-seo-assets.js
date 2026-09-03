'use strict';

const fs = require('fs');
const path = require('path');
const { BASE_URL, SEO_REGISTRY } = require('./seo-registry.js');
const { PRODUCTS: products } = require('../js/data.js');
const { CATEGORY_ROUTES, productUrl } = require('./seo-routes.js');

const ROOT = path.join(__dirname, '..');

function decodeHtml(v) {
  return String(v ?? '')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function x(v) {
  return decodeHtml(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function lastmod(p) {
  const v = p.updatedAt || p.updated_at || p.lastModified || p.lastmod;
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.valueOf()) ? null : d.toISOString().slice(0, 10);
}

function imageUrl(p) {
  if (!p.image) return null;
  return String(p.image).startsWith('http') ? p.image : `${BASE_URL}/${String(p.image).replace(/^\/+/, '')}`;
}

function write(name, body) {
  const target = path.join(ROOT, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body, 'utf8');
}

function uniqueByLoc(items) {
  const seen = new Set();
  return items.filter(item => {
    const loc = String(item.loc);
    if (seen.has(loc)) return false;
    seen.add(loc);
    return true;
  });
}

function urlset(items, withImages = false) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += withImages
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const item of uniqueByLoc(items)) {
    if (String(item.loc).includes('#')) throw new Error(`Fragment URL yasak: ${item.loc}`);
    xml += '  <url>\n';
    xml += `    <loc>${x(item.loc)}</loc>\n`;
    if (item.lastmod) xml += `    <lastmod>${x(item.lastmod)}</lastmod>\n`;
    if (withImages && item.image) {
      xml += '    <image:image>\n';
      xml += `      <image:loc>${x(item.image.loc)}</image:loc>\n`;
      if (item.image.title) xml += `      <image:title>${x(item.image.title)}</image:title>\n`;
      xml += '    </image:image>\n';
    }
    xml += '  </url>\n';
  }
  return xml + '</urlset>\n';
}

function buildSitemaps() {
  const pages = SEO_REGISTRY
    .filter(p => p.indexDirective === 'index' && !String(p.route).includes('#'))
    .map(p => ({ loc: `${BASE_URL}${p.route}` }));

  const categories = Object.keys(CATEGORY_ROUTES).map(k => ({
    loc: `${BASE_URL}${CATEGORY_ROUTES[k]}`
  }));

  const productItems = products.map(p => ({
    loc: productUrl(p),
    lastmod: lastmod(p),
    image: imageUrl(p) ? { loc: imageUrl(p), title: `${p.brand || ''} ${p.name || ''}`.trim() } : null
  }));

  let magArticles = [];
  try {
    const magModule = require('../js/magazine_data.js');
    magArticles = magModule.MAGAZINE_ARTICLES || [];
  } catch (e) {}

  const magazineItems = magArticles.map(a => ({
    loc: `${BASE_URL}/magazin/${a.slug}/`,
    lastmod: a.raw_date || '2026-08-01',
    image: a.image ? { loc: (a.image.startsWith('http') ? a.image : `${BASE_URL}/${a.image.replace(/^\/+/, '')}`), title: a.title } : null
  }));

  write('sitemap-pages.xml', urlset(pages));
  write('sitemap-categories.xml', urlset(categories));
  write('sitemap-products.xml', urlset(productItems, true));
  write('sitemap-magazine.xml', urlset(magazineItems, true));
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${BASE_URL}/sitemap-pages.xml</loc></sitemap>\n  <sitemap><loc>${BASE_URL}/sitemap-categories.xml</loc></sitemap>\n  <sitemap><loc>${BASE_URL}/sitemap-products.xml</loc></sitemap>\n  <sitemap><loc>${BASE_URL}/sitemap-magazine.xml</loc></sitemap>\n</sitemapindex>\n`);
}

function buildLlms() {
  write('llms.txt', `# Belgin Kuyumculuk & Saat — LLM Discovery Manifest\n\nCanonical site: ${BASE_URL}/\nLanguage: tr-TR\nPrimary entity: Belgin Kuyumculuk & Saat, Buca / İzmir\nPurpose: Makine-okunabilir keşif yönlendirmesi. Canonical HTML sayfaları ve güncel runtime ürün verisi birincil kaynaktır.\n\n## Core\n- ${BASE_URL}/llms/core.md\n- ${BASE_URL}/llms-full.txt\n\n## Entities\n- ${BASE_URL}/llms/entities/belgin-kuyumculuk.md\n- ${BASE_URL}/llms/entities/showroom.md\n\n## Brands\n- ${BASE_URL}/llms/brands/rolex.md\n\n## Local\n- ${BASE_URL}/llms/local/izmir-luks-saat.md\n\n## Topics\n- ${BASE_URL}/llms/topics/ikinci-el-luks-saat.md\n\n## Canonical human-facing hubs\n- ${BASE_URL}/\n- ${BASE_URL}/elit-kategori/\n- ${BASE_URL}/markalar/\n- ${BASE_URL}/saatler/\n- ${BASE_URL}/mucevherat/\n- ${BASE_URL}/iletisim.html\n\n## Machine discovery\n- Sitemap: ${BASE_URL}/sitemap.xml\n- Robots: ${BASE_URL}/robots.txt\n\n## Data integrity rules\n- Ürün fiyatı, stok ve anlık availability bu manifestte sabitlenmez; güncel canonical ürün sayfasından/runtime kaynaktan alınır.\n- LLMS, canonical HTML veya schema ile çelişemez.\n- Doğrulanmamış rating, review, sertifika, stok, garanti veya ticari iddia makine katmanına eklenemez.\n- Chrono24 temelli bağlayıcı fiyat/güvence formülü bu bilgi sözleşmesinin parçası değildir ve yeniden eklenemez.\n`);

  write('llms-full.txt', `# Belgin Kuyumculuk & Saat — Full Machine Knowledge Index\n\nCanonical site: ${BASE_URL}/\nLanguage: tr-TR\n\n## Identity\n- Business entity: Belgin Kuyumculuk & Saat\n- Location focus: Buca, İzmir, Türkiye\n- Commercial scope: lüks saat, seçkin saat markaları, mücevherat, showroom ve yerel ürün keşfi\n- Canonical organization node: ${BASE_URL}/llms/entities/belgin-kuyumculuk.md\n- Showroom node: ${BASE_URL}/llms/entities/showroom.md\n\n## Knowledge graph\n- Core: ${BASE_URL}/llms/core.md\n- Rolex brand hub: ${BASE_URL}/llms/brands/rolex.md\n- İzmir lüks saat local hub: ${BASE_URL}/llms/local/izmir-luks-saat.md\n- İkinci el lüks saat topic hub: ${BASE_URL}/llms/topics/ikinci-el-luks-saat.md\n\n## Canonical commerce surfaces\n- Ana sayfa: ${BASE_URL}/\n- Elit kategori: ${BASE_URL}/elit-kategori/\n- Markalar: ${BASE_URL}/markalar/\n- Saatler: ${BASE_URL}/saatler/\n- Mücevherat: ${BASE_URL}/mucevherat/\n- İletişim: ${BASE_URL}/iletisim.html\n\n## Discovery\n- Sitemap index: ${BASE_URL}/sitemap.xml\n- Product/image sitemap: ${BASE_URL}/sitemap-products.xml\n- Category sitemap: ${BASE_URL}/sitemap-categories.xml\n- Pages sitemap: ${BASE_URL}/sitemap-pages.xml\n- Magazine sitemap: ${BASE_URL}/sitemap-magazine.xml\n\n## Runtime truth contract\nBu dosya sabit ürün fiyatı veya stok snapshot'ı taşımaz. Fiyat, stok, availability, ürün teknik özelliği ve ürün bazlı güncel gerçek canonical ürün HTML/runtime kaynağından okunmalıdır. Bu sayede makine bilgi katmanı ile canlı ticari veri arasında drift oluşması engellenir.\n\nLLMS katmanı canonical HTML'nin yerine geçmez; site kimliği, topic ownership ve bilgi grafı yönlendirmesi sağlar.\n`);
}

function buildRobots() {
  const publicBot = (agent, extra = '') => `User-agent: ${agent}\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n${extra}`;
  write('robots.txt', [
    publicBot('Googlebot', 'Disallow: /node_modules/\nDisallow: /canli-fiyatlar/\nDisallow: /canlipiyasalar/\n'),
    publicBot('Bingbot', 'Disallow: /node_modules/\nDisallow: /canli-fiyatlar/\nDisallow: /canlipiyasalar/\n'),
    publicBot('OAI-SearchBot'),
    publicBot('ChatGPT-User'),
    publicBot('PerplexityBot'),
    publicBot('Claude-SearchBot'),
    publicBot('Claude-User'),
    publicBot('GPTBot'),
    publicBot('ClaudeBot'),
    publicBot('Google-Extended'),
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /node_modules/\nDisallow: /canli-fiyatlar/\nDisallow: /canlipiyasalar/\n`,
    `Sitemap: ${BASE_URL}/sitemap.xml\n`
  ].join('\n'));
}

function main() {
  buildSitemaps();
  buildLlms();
  buildRobots();
  console.log(`[seo-assets] ${products.length} ürün canonical URL ile üretildi; LLMS fiyat/stok snapshot'i içermez.`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
