'use strict';

const fs = require('fs');
const path = require('path');
const { BASE_URL } = require('./seo-routes.js');
const { PRODUCTS: products } = require('../js/data.js');
const { productUrl } = require('./seo-routes.js');

const INDEXNOW_KEY = '9d980417475ac56c8ad72ef2c743e1e5';
const HOST = 'www.belginkuyumculuk.com';

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow'
];

async function pushToIndexNow(urls) {
  const urlList = urls && urls.length > 0 ? urls : [
    `${BASE_URL}/`,
    `${BASE_URL}/saatler/`,
    `${BASE_URL}/mucevherat/`,
    `${BASE_URL}/seckin-urunler/`,
    `${BASE_URL}/ikinci-el/`,
    `${BASE_URL}/llms.txt`,
    `${BASE_URL}/llms/saatler.md`,
    `${BASE_URL}/llms/mucevherat.md`,
    `${BASE_URL}/llms/ikinci-el.md`,
    `${BASE_URL}/llms/seckin-urunler.md`,
    `${BASE_URL}/llms/altin-yatirim-ve-ozel-matrah.md`,
    `${BASE_URL}/llms/hukuki-delil-ve-guvenlik.md`,
    `${BASE_URL}/llms/kurumsal-kimlik-ve-iletisim.md`,
    `${BASE_URL}/iletisim.html`,
    `${BASE_URL}/mesafeli-satis-sozlesmesi.html`,
    ...products.slice(0, 100).map(p => productUrl(p))
  ];

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
