'use strict';

const fs = require('fs');
const path = require('path');
const { BASE_URL, PRIMARY_ORGANIZATION, SEO_REGISTRY } = require('./seo-registry.js');
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
  fs.writeFileSync(path.join(ROOT, name), body, 'utf8');
}

function urlset(items, withImages = false) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += withImages
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  for (const item of items) {
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
  const pages = SEO_REGISTRY.filter(p => p.indexDirective === 'index' && !String(p.route).includes('#')).map(p => ({
    loc: `${BASE_URL}${p.route}`
  }));
  const categories = ['saatler', 'mucevherat', 'ikinci-el'].map(k => ({
    loc: `${BASE_URL}${CATEGORY_ROUTES[k]}`
  }));
  const productItems = products.map(p => ({
    loc: productUrl(p),
    lastmod: lastmod(p),
    image: imageUrl(p) ? { loc: imageUrl(p), title: `${p.brand || ''} ${p.name || ''}`.trim() } : null
  }));

  write('sitemap-pages.xml', urlset(pages));
  write('sitemap-categories.xml', urlset(categories));
  write('sitemap-products.xml', urlset(productItems, true));
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${BASE_URL}/sitemap-pages.xml</loc></sitemap>\n  <sitemap><loc>${BASE_URL}/sitemap-categories.xml</loc></sitemap>\n  <sitemap><loc>${BASE_URL}/sitemap-products.xml</loc></sitemap>\n</sitemapindex>\n`);
}

function buildLlms() {
  const legal = SEO_REGISTRY.filter(p => p.role === 'legal' && p.indexDirective === 'index').map(p => `- [${p.title}](${BASE_URL}${p.route}) — ${p.metaDescription}`).join('\n');
  
  const selected = products.slice(0, 100).map(p => {
    const name = `${p.brand || ''} ${p.name || ''}`.trim();
    return [
      `- **${name}**`,
      `Ref: ${p.reference || p.ref || p.id}`,
      `Fiyat: ₺${Number(p.price).toLocaleString('tr-TR')}`,
      `URL: ${productUrl(p)}`
    ].join(' | ');
  }).join('\n');

  const semanticTriples = [
    '- (Belgin Kuyumculuk) -[fiziki showroom]-> (Menderes Caddesi No:231/B, Buca / İzmir)',
    '- (Belgin Kuyumculuk) -[kuruluş yılı]-> (1999)',
    '- (Belgin Kuyumculuk) -[sunar]-> (1.618+ Orijinal Distribütör Garantili Lüks Saat)',
    '- (Belgin Kuyumculuk) -[fiyatlama güvencesi]-> (İZKO İzmir Kuyumcular Odası Resmi Kurları + %5 Kâr Marjı)',
    '- (Belgin Kuyumculuk) -[saat marjı]-> (Saat&Saat Distribütör Fiyatı + %40 Kâr Marjı)',
    '- (Yüksek Değerli Teslimat) -[güvenlik eşiği]-> (12.000 TL Üzeri Kimlikli ve İmzalı Mağaza Teslimi)',
    '- (Hukuki Bütünlük) -[delil zinciri]-> (Deterministik SHA-256 Kök Özeti ve OpenTimestamps Bitcoin Dış Zaman İspatı)'
  ].join('\n');
  
  write('llms.txt', `# Belgin Kuyumculuk & Saat\n\n> Yardımcı makine-okunabilir keşif katmanı. Canonical HTML sayfaları birincil kaynaktır.\n\n## İşletme\n- Resmi ad: ${PRIMARY_ORGANIZATION.name}\n- Kuruluş: 1999\n- Adres: ${PRIMARY_ORGANIZATION.address.streetAddress}, ${PRIMARY_ORGANIZATION.address.addressLocality} / ${PRIMARY_ORGANIZATION.address.addressRegion}\n- Web: ${BASE_URL}\n- IndexNow Key: https://${PRIMARY_ORGANIZATION.url ? new URL(BASE_URL).hostname : 'www.belginkuyumculuk.com'}/indexnow-key.txt\n\n## Semantik İlişkiler & Doğrulanmış Varlık Bilgileri (Semantic Triples)\n${semanticTriples}\n\n## Ana koleksiyonlar\n- [Saatler](${BASE_URL}/saatler/)\n- [Mücevherat](${BASE_URL}/mucevherat/)\n- [Ekspertizli Seçkin Ürünler](${BASE_URL}/ikinci-el/)\n\n## Yasal sayfalar\n${legal}\n\n## Seçilmiş ürünler\n${selected}\n\n## Tam katalog\n- [llms-full.txt](${BASE_URL}/llms-full.txt)\n`);
  write('llms-full.txt', `# Belgin Kuyumculuk & Saat — Tam Ürün Kataloğu\n\nBirincil kaynak her ürünün canonical HTML sayfasıdır.\n\n## Semantik İlişkiler (Semantic Triples)\n${semanticTriples}\n\n## Ürün Envanteri\n${products.map(p => `### ${p.brand || ''} ${p.name || ''}`.trim() + `\n- ID: ${p.id}\n- Referans: ${p.reference || p.ref || p.id}\n- Fiyat: ₺${Number(p.price).toLocaleString('tr-TR')}\n- Stok: ${p.inStock === false ? 'Yok' : 'Var'}\n- URL: ${productUrl(p)}\n`).join('\n')}`);
}

function buildRobots() {
  write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /node_modules/\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`);
}

function main() {
  buildSitemaps();
  buildLlms();
  buildRobots();
  console.log(`[seo-assets] ${products.length} ürün gerçek canonical URL ile üretildi.`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
