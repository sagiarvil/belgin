#!/usr/bin/env node
/**
 * ====================================================================
 * ⚡ BELGIN KUYUMCULUK — INDEXNOW & BING / YANDEX SEARCH SUBMISSION
 * ====================================================================
 * This script submits site URLs to the IndexNow protocol to ensure
 * instantaneous discovery and indexing by modern AI and search engines.
 */

const https = require('https');

const HOST = 'www.belginkuyumculuk.com';
const KEY = 'b7e9a8264d1f463ba7929402685791ab';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const CORE_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/magazin/`,
  `https://${HOST}/elit-kategori/`,
  `https://${HOST}/saatler/`,
  `https://${HOST}/biz-kimiz/`,
  `https://${HOST}/markalar/`,
  `https://${HOST}/mucevherat/`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/sitemap.xml`,
  `https://${HOST}/sitemap-pages.xml`,
  `https://${HOST}/sitemap-categories.xml`,
  `https://${HOST}/sitemap-products.xml`,
  `https://${HOST}/sitemap-magazine.xml`
];

// Add all magazine articles
try {
  const mag = require('../js/magazine_data.js');
  if (mag && mag.MAGAZINE_ARTICLES) {
    mag.MAGAZINE_ARTICLES.forEach(a => {
      if (a.slug) {
        CORE_URLS.push(`https://${HOST}/magazin/${a.slug}/`);
      }
    });
  }
} catch (_) {}

const payload = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: CORE_URLS
});

function submitToIndexNow(endpointHost, endpointPath) {
  return new Promise((resolve) => {
    const options = {
      hostname: endpointHost,
      port: 443,
      path: endpointPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[IndexNow] ${endpointHost} -> HTTP ${res.statusCode} (${CORE_URLS.length} URLs submitted)`);
        resolve({ status: res.statusCode, host: endpointHost });
      });
    });

    req.on('error', (err) => {
      console.warn(`[IndexNow] ${endpointHost} error: ${err.message}`);
      resolve({ status: 0, error: err.message, host: endpointHost });
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn(`[IndexNow] ${endpointHost} timeout`);
      resolve({ status: 0, error: 'timeout', host: endpointHost });
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`🚀 Submitting ${CORE_URLS.length} canonical URLs to IndexNow protocol...`);
  await Promise.all([
    submitToIndexNow('api.indexnow.org', '/indexnow'),
    submitToIndexNow('www.bing.com', '/indexnow')
  ]);
  console.log('✅ IndexNow submission complete.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CORE_URLS, submitToIndexNow };
