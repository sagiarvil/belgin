'use strict';

const fs = require('fs');
const path = require('path');
const { BASE_URL, productUrl } = require('./seo-routes.js');
const { PRODUCTS: products } = require('../js/data.js');
const { SEO_REGISTRY } = require('./seo-registry.js');

const INDEXNOW_KEY = '9d980417475ac56c8ad72ef2c743e1e5';
const HOST = 'www.belginkuyumculuk.com';

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow'
];

function getAllLlmsUrls() {
  const llmsDir = path.join(__dirname, '..', 'llms');
  const urls = [];
  function walk(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        walk(path.join(dir, ent.name), prefix ? `${prefix}/${ent.name}` : ent.name);
      } else if (ent.name.endsWith('.md')) {
        urls.push(`${BASE_URL}/llms/${prefix ? `${prefix}/${ent.name}` : ent.name}`);
      }
    }
  }
  walk(llmsDir);
  return urls;
}

function getDefaultUrlList() {
  const regUrls = SEO_REGISTRY
    .filter(p => p.indexDirective === 'index' && !String(p.route).includes('#'))
    .map(p => `${BASE_URL}${p.route}`);

  const llmsUrls = getAllLlmsUrls();

  let magArticles = [];
  try {
    const magModule = require('../js/magazine_data.js');
    magArticles = (magModule.MAGAZINE_ARTICLES || []).map(a => `${BASE_URL}/magazin/${a.slug}/`);
  } catch (_) {}

  const topProducts = products.slice(0, 150).map(p => productUrl(p));

  const list = [
    ...regUrls,
    `${BASE_URL}/llms.txt`,
    `${BASE_URL}/llms-full.txt`,
    `${BASE_URL}/sitemap.xml`,
    `${BASE_URL}/sitemap-pages.xml`,
    `${BASE_URL}/sitemap-categories.xml`,
    `${BASE_URL}/sitemap-products.xml`,
    `${BASE_URL}/sitemap-magazine.xml`,
    ...llmsUrls,
    ...magArticles,
    ...topProducts
  ];

  return Array.from(new Set(list));
}

async function pingSitemaps() {
  const sitemapUrl = `${BASE_URL}/sitemap.xml`;
  const pings = [
    { name: 'Google Sitemap Ping', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    { name: 'Yandex Sitemap Ping', url: `https://blogs.yandex.ru/pings/?status=success&url=${encodeURIComponent(sitemapUrl)}` }
  ];

  console.log('\n📡 [Search Engine Ping] Google ve Yandex sitemap bildirimleri gönderiliyor...');
  for (const p of pings) {
    try {
      const res = await fetch(p.url, { method: 'GET' });
      console.log(`  ✅ [${p.name}] Bildirim iletildi (HTTP ${res.status})`);
    } catch (err) {
      console.warn(`  ⚠️ [${p.name}] Ping hatası: ${err.message}`);
    }
  }
}

async function pushToIndexNow(urls) {
  const urlList = urls && urls.length > 0 ? urls : getDefaultUrlList();

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urlList
  };

  console.log(`\n🚀 [IndexNow Global Broadcast] ${urlList.length} adet URL (Tüm LLMS alt-grafları, AEO sayfaları, makaleler) küresel AI & Search Hub ağlarına dağıtılıyor...`);

  const results = await Promise.allSettled(
    ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return { endpoint, status: res.status, ok: res.ok || res.status === 200 || res.status === 202 };
    })
  );

  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      const { endpoint, status, ok } = r.value;
      if (ok) {
        console.log(`  ✅ [${new URL(endpoint).hostname}] ${urlList.length} URL kabul edildi (HTTP ${status})`);
      } else {
        console.warn(`  ⚠️ [${new URL(endpoint).hostname}] Yanıt: HTTP ${status}`);
      }
    } else {
      console.warn(`  ❌ Ağ Hatası: ${r.reason?.message || r.reason}`);
    }
  });

  await pingSitemaps();
  console.log('\n🎉 [Dağıtım Tamamlandı] Tüm LLMS ve AEO URL\'leri küresel yapay zekâ ve arama motorlarına başarıyla servis edildi.\n');
}

if (require.main === module) {
  pushToIndexNow();
}

module.exports = { pushToIndexNow, getDefaultUrlList };
