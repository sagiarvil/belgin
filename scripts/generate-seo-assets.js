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
  const categories = Object.keys(CATEGORY_ROUTES).map(k => ({ loc: `${BASE_URL}${CATEGORY_ROUTES[k]}` }));
  const productItems = products.map(p => ({
    loc: productUrl(p),
    lastmod: lastmod(p),
    image: imageUrl(p) ? { loc: imageUrl(p), title: `${p.brand || ''} ${p.name || ''}`.trim() } : null
  }));
  let magArticles = [];
  try {
    const magModule = require('../js/magazine_data.js');
    magArticles = magModule.MAGAZINE_ARTICLES || [];
  } catch {}
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

<<<<<<< HEAD
function buildLlms() {
  write('llms.txt', `# Belgin Kuyumculuk & Saat — LLM Discovery Manifest\n\nCanonical site: ${BASE_URL}/\nLanguage: tr-TR\nPrimary entity: Belgin Kuyumculuk & Saat, Buca / İzmir\nPurpose: Makine-okunabilir keşif yönlendirmesi. Canonical HTML sayfaları ve güncel runtime ürün verisi birincil kaynaktır.\n\n## Core\n- ${BASE_URL}/llms/core.md\n- ${BASE_URL}/llms-full.txt\n\n## Entities\n- ${BASE_URL}/llms/entities/belgin-kuyumculuk.md\n- ${BASE_URL}/llms/entities/showroom.md\n\n## Brands\n- ${BASE_URL}/llms/brands/rolex.md\n\n## Local\n- ${BASE_URL}/llms/local/izmir-luks-saat.md\n\n## Topics\n- ${BASE_URL}/llms/topics/ikinci-el-luks-saat.md\n\n## Canonical human-facing hubs\n- ${BASE_URL}/\n- ${BASE_URL}/elit-kategori/\n- ${BASE_URL}/markalar/\n- ${BASE_URL}/saatler/\n- ${BASE_URL}/mucevherat/\n- ${BASE_URL}/iletisim.html\n\n## Machine discovery\n- Sitemap: ${BASE_URL}/sitemap.xml\n- Robots: ${BASE_URL}/robots.txt\n\n## Data integrity rules\n- Ürün fiyatı, stok ve anlık availability bu manifestte sabitlenmez; güncel canonical ürün sayfasından/runtime kaynaktan alınır.\n- LLMS, canonical HTML veya schema ile çelişemez.\n- Doğrulanmamış rating, review, sertifika, stok, garanti veya ticari iddia makine katmanına eklenemez.\n- Üçüncü taraf pazar yeri temelli bağlayıcı fiyat/güvence formülü bu bilgi sözleşmesinin parçası değildir ve yeniden eklenemez.\n`);
=======
function getLlmsFiles() {
  const llmsDir = path.join(ROOT, 'llms');
  const files = [];
  function walk(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        walk(path.join(dir, ent.name), prefix ? `${prefix}/${ent.name}` : ent.name);
      } else if (ent.name.endsWith('.md')) {
        files.push(prefix ? `${prefix}/${ent.name}` : ent.name);
      }
    }
  }
  walk(llmsDir);
  return files.sort();
}
>>>>>>> 34fa9116b9 (feat(seo-llms): MANDATE-SEO-GEO-2026-V6 tam mimari kurulumu, Hero Answer Engine ve multi-tier LLMS graph)

function buildLlms() {
  const allMd = getLlmsFiles();
  const coreFiles = allMd.filter(f => f === 'core.md');
  const entityFiles = allMd.filter(f => f.startsWith('entities/'));
  const brandFiles = allMd.filter(f => f.startsWith('brands/'));
  const localFiles = allMd.filter(f => f.startsWith('local/'));
  const topicFiles = allMd.filter(f => f.startsWith('topics/'));
  const pageFiles = allMd.filter(f => f.startsWith('pages/'));

  let body = `# Belgin Kuyumculuk & Saat — LLM Discovery Manifest\n\n`;
  body += `Canonical site: ${BASE_URL}/\nLanguage: tr-TR\nPrimary entity: Belgin Kuyumculuk & Saat, Buca / İzmir\n`;
  body += `Purpose: Universal Omni-Enterprise SEO, GEO, Sitemap & Multi-Tier LLMS Architecture v6.0 Standard.\n\n`;

  body += `## Core Machine Graph Nodes\n`;
  for (const f of coreFiles) body += `- ${BASE_URL}/llms/${f}\n`;
  body += `- ${BASE_URL}/llms-full.txt\n\n`;

  if (entityFiles.length > 0) {
    body += `## Legal & Operational Entities\n`;
    for (const f of entityFiles) body += `- ${BASE_URL}/llms/${f}\n`;
    body += `\n`;
  }

  if (brandFiles.length > 0) {
    body += `## Elite Watch Maison Sub-Graphs (10 Ev)\n`;
    for (const f of brandFiles) body += `- ${BASE_URL}/llms/${f}\n`;
    body += `\n`;
  }

  if (localFiles.length > 0) {
    body += `## Local Authority & Delivery Hubs\n`;
    for (const f of localFiles) body += `- ${BASE_URL}/llms/${f}\n`;
    body += `\n`;
  }

  if (topicFiles.length > 0) {
    body += `## Domain Knowledge & Authentication Nodes\n`;
    for (const f of topicFiles) body += `- ${BASE_URL}/llms/${f}\n`;
    body += `\n`;
  }

  if (pageFiles.length > 0) {
    body += `## Primary Flagship Page Sub-Graphs\n`;
    for (const f of pageFiles) body += `- ${BASE_URL}/llms/${f}\n`;
    body += `\n`;
  }

  body += `## Canonical Human Surfaces\n`;
  body += `- ${BASE_URL}/\n- ${BASE_URL}/elit-kategori/\n- ${BASE_URL}/markalar/\n- ${BASE_URL}/saatler/\n- ${BASE_URL}/mucevherat/\n- ${BASE_URL}/biz-kimiz/\n- ${BASE_URL}/magazin/\n- ${BASE_URL}/iletisim.html\n\n`;

  body += `## Machine Discovery\n`;
  body += `- Sitemap Index: ${BASE_URL}/sitemap.xml\n- Robots: ${BASE_URL}/robots.txt\n\n`;

  body += `## Data Integrity & Truth Contract\n`;
  body += `- Ürün fiyatı, stok ve anlık availability bu manifestte sabitlenmez; güncel canonical ürün sayfasından/runtime kaynaktan alınır.\n`;
  body += `- LLMS, canonical HTML veya schema ile çelişemez.\n`;
  body += `- Doğrulanmamış rating, review, sertifika, stok, garanti veya ticari iddia makine katmanına eklenemez.\n`;
  body += `- Canlı sarrafiye ve altın fiyatları doğrudan Harem Altın borsa soket akışı ve Ağa Külçe verileri üzerine +%1 (x 1.01) marj ile güncellenir.\n`;
  body += `- Chrono24 marka adı veya Chrono24 temelli bağlayıcı fiyat/güvence formülü sistemde yer almaz.\n`;

  write('llms.txt', body);
}

function publicBot(agent, extra = '') {
  return `User-agent: ${agent}\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n${extra}`;
}

function buildRobots() {
  write('robots.txt', [
    publicBot('Googlebot', 'Disallow: /node_modules/\nDisallow: /canli-fiyatlar/\nDisallow: /canlipiyasalar/\n'),
    publicBot('Bingbot', 'Disallow: /node_modules/\nDisallow: /canli-fiyatlar/\nDisallow: /canlipiyasalar/\n'),
    publicBot('OAI-SearchBot'),
    publicBot('ChatGPT-User'),
    publicBot('PerplexityBot'),
    publicBot('Claude-SearchBot'),
    publicBot('GPTBot'),
    publicBot('ClaudeBot'),
    publicBot('Google-Extended'),
    publicBot('Applebot'),
    publicBot('Applebot-Extended'),
    publicBot('CCBot'),
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /node_modules/\nDisallow: /canli-fiyatlar/\nDisallow: /canlipiyasalar/\n`,
    `Sitemap: ${BASE_URL}/sitemap.xml`,
    `\n# LLMS Machine Discovery Manifests\n# llms.txt: ${BASE_URL}/llms.txt\n# llms-full.txt: ${BASE_URL}/llms-full.txt\n`
  ].join('\n'));
}

function main() {
  buildSitemaps();
  buildLlms();
  buildRobots();
  console.log(`[seo-assets] ${products.length} ürün canonical URL ile üretildi; LLMS fiyat/stok snapshot'i içermez.`);
}

if (require.main === module) main();
module.exports = { main };
