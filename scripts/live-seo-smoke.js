'use strict';

const BASE =
  process.env.LIVE_BASE_URL ||
  'https://www.belginkuyumculuk.com';

const SAMPLE_SIZE = Number(process.env.SEO_SMOKE_SAMPLE || 20);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
    .map(m => m[1].trim());
}

function canonicalOf(html) {
  const m =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);

  return m ? m[1] : null;
}

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'BelginProductionSmoke/2.0' }
  });

  assert(res.ok, `HTTP ${res.status}: ${url}`);

  return {
    url: res.url,
    status: res.status,
    text: await res.text()
  };
}

async function testProduct(url) {
  const result = await fetchText(url);
  const html = result.text;

  assert(/<h1[\s>]/i.test(html), `H1 missing: ${url}`);
  assert(!/noindex/i.test(html), `noindex: ${url}`);

  const canonical = canonicalOf(html);
  assert(canonical === url, `Canonical mismatch: ${url} -> ${canonical}`);

  assert(/application\/ld\+json/i.test(html), `JSON-LD missing: ${url}`);
  assert(/"@type"\s*:\s*"Product"/i.test(html), `Product schema missing: ${url}`);
}

async function main() {
  console.log(`[LIVE-SEO-SMOKE] Canlı SEO Sağlama Testi Başlatıldı: ${BASE}`);

  for (const path of [
    '/',
    '/saatler/',
    '/mucevherat/',
    '/ikinci-el/',
    '/robots.txt',
    '/llms.txt',
    '/sitemap.xml',
    '/sitemap-products.xml'
  ]) {
    await fetchText(`${BASE}${path}`);
    console.log(`  ✓ ${path} erişilebilir ve HTTP 200.`);
  }

  const productSitemap = await fetchText(`${BASE}/sitemap-products.xml`);
  const productUrls = extractLocs(productSitemap.text);

  assert(productUrls.length > 0, 'Product sitemap empty.');

  const step = Math.max(1, Math.floor(productUrls.length / SAMPLE_SIZE));
  const sample = productUrls
    .filter((_, i) => i % step === 0)
    .slice(0, SAMPLE_SIZE);

  console.log(`  ✓ Örneklem alınan ${sample.length} ürün sayfası test ediliyor...`);
  for (const url of sample) {
    await testProduct(url);
  }

  console.log(
    `\nLIVE_SEO_SMOKE=PASS base=${BASE} sampledProducts=${sample.length}`
  );
}

if (require.main === module) {
  main().catch(err => {
    console.error(`LIVE_SEO_SMOKE=FAIL ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
