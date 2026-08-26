'use strict';

const fs = require('fs');
const path = require('path');
const { BASE_URL } = require('./seo-routes.js');
const { PRODUCTS: products } = require('../js/data.js');
const { productUrl } = require('./seo-routes.js');

const INDEXNOW_KEY = 'b8f1a2c3d4e5f67890123456789abcdef';
const HOST = 'www.belginkuyumculuk.com';

async function pushToIndexNow(urls) {
  const urlList = urls && urls.length > 0 ? urls : [
    `${BASE_URL}/`,
    `${BASE_URL}/saatler/`,
    `${BASE_URL}/mucevherat/`,
    `${BASE_URL}/ikinci-el/`,
    ...products.slice(0, 50).map(p => productUrl(p))
  ];

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urlList
  };

  console.log(`[IndexNow] ${urlList.length} adet URL Bing, Yandex ve AI crawler motorlarına anons ediliyor...`);

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 200 || res.status === 202) {
      console.log(`✅ [IndexNow] ${urlList.length} URL başarıyla iletildi (HTTP ${res.status}).`);
    } else {
      console.warn(`⚠️ [IndexNow] Yanıt kodu: HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`⚠️ [IndexNow] Ağ uyarısı (Offline/Mock): ${err.message}`);
  }
}

if (require.main === module) {
  pushToIndexNow();
}

module.exports = { pushToIndexNow };
