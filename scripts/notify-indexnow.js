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

function getDefaultUrlList() {
  const regUrls = SEO_REGISTRY
    .filter(p => p.indexDirective === 'index' && !String(p.route).includes('#'))
    .map(p => `${BASE_URL}${p.route}`);

  const topProducts = products.slice(0, 150).map(p => productUrl(p));

  const list = [
    ...regUrls,
    `${BASE_URL}/llms.txt`,
    `${BASE_URL}/llms-full.txt`,
    `${BASE_URL}/llms/core.md`,
    `${BASE_URL}/llms/pages/ana-sayfa.md`,
    `${BASE_URL}/llms/pages/elit-kategori.md`,
    `${BASE_URL}/llms/pages/biz-kimiz.md`,
    `${BASE_URL}/llms/brands/rolex.md`,
    `${BASE_URL}/llms/brands/patek-philippe.md`,
    `${BASE_URL}/llms/local/izmir-luks-saat.md`,
    `${BASE_URL}/llms/topics/ikinci-el-luks-saat.md`,
    ...topProducts
  ];

  return Array.from(new Set(list));
}

async function pushToIndexNow(urls) {
  const urlList = urls && urls.length > 0 ? urls : getDefaultUrlList();

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urlList
  };

  console.log(`[IndexNow Broadcasting] ${urlList.length} adet URL küresel IndexNow & AI Hub ağlarına dağıtılıyor...`);

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
}

if (require.main === module) {
  pushToIndexNow();
}

module.exports = { pushToIndexNow };
