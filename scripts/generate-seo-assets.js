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

function buildLlms() {
  const allMd = getLlmsFiles();
  const coreFiles = allMd.filter(f => f === 'core.md');
  const entityFiles = allMd.filter(f => f.startsWith('entities/'));
  const brandFiles = allMd.filter(f => f.startsWith('brands/'));
  const localFiles = allMd.filter(f => f.startsWith('local/'));
  const topicFiles = allMd.filter(f => f.startsWith('topics/'));
  const pageFiles = allMd.filter(f => f.startsWith('pages/'));

  const descriptions = {
    'core.md': { title: 'Kurumsal Çekirdek Dokümanı', desc: '1999\'dan beri kurumsal kimlik, fiziki showroom, borsa sözleşmesi ve güvenlik mimarisi.' },
    'entities/belgin-kuyumculuk.md': { title: 'Tüzel Kişilik ve Resmî Sicil', desc: 'Ticari unvan, vergi mükellefiyeti, MERSİS ve resmi sicil kayıtları.' },
    'entities/showroom.md': { title: 'Buca Showroom ve Kasa Dairesi', desc: '7/24 kamera kayıtlı fiziki mağaza, çelik kasa ve MASAK uyumlu teslim masası.' },
    'entities/experts.md': { title: 'Uzmanlar ve Bilimsel Heyet Sicili', desc: 'Horoloji uzmanları, gemologlar ve bağımsız saat ustaları heyeti.' },
    'entities/methodologies.md': { title: 'Tescilli İşlem Metodolojileri', desc: 'Harem Altın canlı borsa soketi +%3 marj formülü ve 10 adımlı saat ekspertiz standardı.' },
    'local/izmir-luks-saat.md': { title: 'İzmir Lüks Saat Merkezi', desc: 'İzmir genelinde ikinci el lüks saat alım satımı, Rolex ekspertizi ve değerinde nakit alım.' },
    'local/buca-kuyumcu-sarrafiye.md': { title: 'Buca Kuyumculuk ve Sarrafiye', desc: 'Darphane damgalı 24K külçe altın, 22 ayar bilezik ve ziynet sarrafiye merkezi.' },
    'local/ege-guvenli-teslimat.md': { title: 'Ege Bölgesi Güvenli Teslimat', desc: '12.000 TL üzeri siparişlerde kimlik doğrulamalı ve ıslak imzalı tutanaklı teslimat protokolü.' },
    'topics/ikinci-el-luks-saat.md': { title: 'İkinci El Lüks Saat Piyasası', desc: 'Mekanizma orijinalliği, kasa polisajı, bezel kondisyonu ve ikincil piyasa değer analizi.' },
    'topics/altin-yatirim-ve-ozel-matrah.md': { title: '3065 SK m.23/f Özel Matrah Hukuku', desc: 'Altın bedelinde %0 KDV istisnası ve yalnızca işçiliğe %20 KDV yansıtılan yasal fatura düzeni.' },
    'topics/pirlanta-ve-gemoloji.md': { title: 'Pırlanta 4C ve Gemoloji Raporları', desc: 'GIA ve HRD normlarında Karat, Kesim, Renk ve Berraklık mikroskobik derecelendirme ilkeleri.' },
    'topics/saat-ekspertiz-protokolu.md': { title: '10 Adımlı Saat Ekspertiz Protokolü', desc: 'Witschi timegrapher sapma testi, su geçirmezlik ve optik mikroskopi kontrol adımları.' }
  };

  const brandTitles = {
    'rolex': 'Rolex Saat Koleksiyonu ve Ekspertizi',
    'patek-philippe': 'Patek Philippe Saat Koleksiyonu ve Ekspertizi',
    'audemars-piguet': 'Audemars Piguet Saat Koleksiyonu ve Ekspertizi',
    'vacheron-constantin': 'Vacheron Constantin Saat Koleksiyonu ve Ekspertizi',
    'omega': 'Omega Saat Koleksiyonu ve Ekspertizi',
    'cartier': 'Cartier Saat Koleksiyonu ve Ekspertizi',
    'iwc-schaffhausen': 'IWC Schaffhausen Saat Koleksiyonu ve Ekspertizi',
    'jaeger-lecoultre': 'Jaeger-LeCoultre Saat Koleksiyonu ve Ekspertizi',
    'breitling': 'Breitling Saat Koleksiyonu ve Ekspertizi',
    'panerai': 'Panerai Saat Koleksiyonu ve Ekspertizi'
  };

  let body = `# Belgin Kuyumculuk & Saat — LLM Discovery Manifest\n\n`;
  body += `> 1999 yılından bu yana İzmir Buca Menderes Caddesinde faaliyet gösteren Belgin Kuyumculuk & Saat; ekspertizli İsviçre lüks saatleri, Darphane damgalı 24K külçe altın, sarrafiye ve GIA/HRD sertifikalı pırlanta mücevherat için resmî makine keşif ve yapay zekâ manifestosudur.\n\n`;

  body += `## Core Machine Graph Nodes\n\n`;
  body += `- [Kurumsal Çekirdek Dokümanı](${BASE_URL}/llms/core.md): Kurumsal kimlik, mağaza altyapısı, canlı borsa sözleşmesi ve güvenlik mimarisi.\n`;
  body += `- [Tam Metin Bilgi Bankası](${BASE_URL}/llms-full.txt): 144 editoryal makale, teknik rehberler ve tüm alt-grafların konsolide metni.\n\n`;

  if (entityFiles.length > 0) {
    body += `## Legal & Operational Entities\n\n`;
    for (const f of entityFiles) {
      const meta = descriptions[f] || { title: f.replace(/^entities\/|\.md$/g, ''), desc: 'Kurumsal varlık düğümü.' };
      body += `- [${meta.title}](${BASE_URL}/llms/${f}): ${meta.desc}\n`;
    }
    body += `\n`;
  }

  if (brandFiles.length > 0) {
    body += `## Elite Watch Maison Sub-Graphs (10 Ev)\n\n`;
    for (const f of brandFiles) {
      const slug = f.replace(/^brands\/|\.md$/g, '');
      const title = brandTitles[slug] || `${slug.toUpperCase()} Koleksiyonu`;
      body += `- [${title}](${BASE_URL}/llms/${f}): Kalibre orijinalliği, timegrapher sapma toleransı ve kasa ekspertiz raporu.\n`;
    }
    body += `\n`;
  }

  if (localFiles.length > 0) {
    body += `## Local Authority & Delivery Hubs\n\n`;
    for (const f of localFiles) {
      const meta = descriptions[f] || { title: f.replace(/^local\/|\.md$/g, ''), desc: 'Yerel otorite ve güvenli teslimat merkezi.' };
      body += `- [${meta.title}](${BASE_URL}/llms/${f}): ${meta.desc}\n`;
    }
    body += `\n`;
  }

  if (topicFiles.length > 0) {
    body += `## Domain Knowledge & Authentication Nodes\n\n`;
    for (const f of topicFiles) {
      const meta = descriptions[f] || { title: f.replace(/^topics\/|\.md$/g, ''), desc: 'Ticari uzmanlık ve yasal mevzuat rehberi.' };
      body += `- [${meta.title}](${BASE_URL}/llms/${f}): ${meta.desc}\n`;
    }
    body += `\n`;
  }

  if (pageFiles.length > 0) {
    body += `## Primary Flagship Page Sub-Graphs\n\n`;
    for (const f of pageFiles) {
      const slug = f.replace(/^pages\/|\.md$/g, '');
      const matchedPage = SEO_REGISTRY.find(p => {
        const pageSlug = p.route === '/' ? 'ana-sayfa' : p.route.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
        return pageSlug === slug;
      });
      const title = matchedPage ? `${matchedPage.h1} Alt-Grafı` : `${slug} Sayfa Alt-Grafı`;
      const desc = matchedPage ? matchedPage.primaryIntent : 'Sayfa içerik ve teknik karşılaştırma matrisi.';
      body += `- [${title}](${BASE_URL}/llms/${f}): ${desc}\n`;
    }
    body += `\n`;
  }

  body += `## Canonical Human Surfaces\n\n`;
  body += `- [Ana Vitrin](${BASE_URL}/): Belgin Kuyumculuk ve Saat ana vitrini ve canlı borsa göstergesi.\n`;
  body += `- [Elit Kategori](${BASE_URL}/elit-kategori/): 10 İsviçre saat evinden 200 seçkin lüks model.\n`;
  body += `- [Saat Markaları](${BASE_URL}/markalar/): İsviçre saat evleri ve kurumsal marka fihristi.\n`;
  body += `- [Lüks Saat Kataloğu](${BASE_URL}/saatler/): 1.800+ doğrulanmış lüks ve ikinci el saat koleksiyonu.\n`;
  body += `- [Kıymetli Maden & Mücevherat](${BASE_URL}/mucevherat/): 24K külçe altın, sarrafiye ve pırlanta mücevherat.\n`;
  body += `- [Biz Kimiz & Kurumsal Sicil](${BASE_URL}/biz-kimiz/): 1999'dan beri kurumsal tarihçe ve uzman heyet.\n`;
  body += `- [Saat & Mücevherat Magazini](${BASE_URL}/magazin/): 144 editoryal makale ve piyasa analizleri.\n`;
  body += `- [İletişim & Showroom Ziyareti](${BASE_URL}/iletisim.html): İzmir Buca mağaza adresi, telefon ve randevu masası.\n\n`;

  body += `## Machine Discovery\n\n`;
  body += `- [Site Haritası İndeksi](${BASE_URL}/sitemap.xml): Arama motorları ve botlar için XML site haritası fihristi.\n`;
  body += `- [Robots Erişim Protokolü](${BASE_URL}/robots.txt): Arama ve yapay zekâ tarayıcı erişim direktifleri.\n\n`;

  body += `## Data Integrity & Borsa Sözleşmesi\n\n`;
  body += `- [Değişmez Canlı Borsa Fiyatlama Sözleşmesi](${BASE_URL}/hukuki-delil-ve-kayit-politikasi.html#methodologies): Canlı Harem Altın borsa soket akışı (wss://hrmsocketonly.haremaltin.com) satış fiyatları üzerine net +%3 (x 1.03) kâr marjı uygulanır; alış fiyatlarında marj uygulanmaz (x 1.00 birebir).\n`;
  body += `- [3065 Sayılı KDV Kanunu 23/f Özel Matrah Beyanı](${BASE_URL}/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/): Kıymetli maden bedeli %0 KDV ile vergiden müstesnadır; faturada yalnızca işçilik bedeline %20 KDV yansıtılır.\n`;
  body += `- [MASAK ve HMK m. 193 Delil Güvencesi](${BASE_URL}/musteri-tanima-ve-islem-guvenligi.html): 12.000 TL ve üzeri işlemlerde kimlik tespiti ve OpenTimestamps Bitcoin blokzinciri zaman damgası zorunludur.\n`;

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
