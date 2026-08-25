const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const PRIMARY_DOMAIN = 'https://belginkuyumculuk.com';
const LEGACY_PRIMARY = 'https://belgin.web.app';
const VERIFIED_HOSTING_SITE = 'belgin';
let failed = false;
const fail = (msg) => { failed = true; console.error(`❌ ${msg}`); };
const pass = (msg) => console.log(`✅ ${msg}`);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const firebasePath = path.join(root, 'firebase.json');
if (!fs.existsSync(firebasePath)) {
  fail('firebase.json bulunamadı.');
} else {
  const cfg = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
  if (cfg.hosting?.site !== VERIFIED_HOSTING_SITE) fail(`Firebase Hosting site hedefi ${VERIFIED_HOSTING_SITE} olmalıdır.`);
  else pass(`Firebase Hosting site hedefi doğrulandı: ${VERIFIED_HOSTING_SITE}.`);

  const rewrites = cfg.hosting?.rewrites || [];
  const required = ['createPayTRToken', 'paytrCallback', 'getOrderStatus'];
  for (const fn of required) {
    if (!rewrites.some((r) => r.function === fn)) fail(`Firebase rewrite eksik: ${fn}`);
  }
  if (required.every((fn) => rewrites.some((r) => r.function === fn))) pass('Firebase API rewrite sözleşmesi tam.');
}

const index = read('index.html');
if (!index.includes(`<link rel="canonical" href="${PRIMARY_DOMAIN}/">`)) fail('Ana sayfa canonical yeni özel domaine bağlı değil.');
if (!index.includes(`"url": "${PRIMARY_DOMAIN}/"`)) fail('Organization/WebSite schema yeni özel domaine bağlı değil.');
if (index.includes(LEGACY_PRIMARY)) fail('index.html içinde eski belgin.web.app primary-domain referansı kaldı.');
else pass('Ana sayfa özel domain canonical/schema kontrolü geçti.');

const generator = read('scripts/generate-seo-assets.js');
if (!generator.includes(`const BASE_URL = '${PRIMARY_DOMAIN}'`)) fail('SEO registry BASE_URL özel domaine bağlı değil.');
if (generator.includes(LEGACY_PRIMARY)) fail('SEO üreticisinde eski primary-domain referansı kaldı.');
else pass('SEO registry özel domaine bağlı.');

const robots = read('robots.txt');
if (!robots.includes(`Sitemap: ${PRIMARY_DOMAIN}/sitemap.xml`)) fail('robots.txt sitemap adresi özel domaine bağlı değil.');

const paytrClient = read('js/paytr.js');
if (/handleDemoSimulation\s*\(/.test(paytrClient)) fail('İstemci ödeme akışında demo-success fallback mevcut.');
else pass('İstemci ödeme akışı fail-closed.');

const functionsCode = read('functions/index.js');
if (/origin:\s*true/.test(functionsCode)) fail('Cloud Functions CORS tüm originlere açık.');
if (/YOUR_MERCHANT_ID/.test(functionsCode)) fail('Cloud Functions içinde canlıda simülasyona düşebilecek PayTR placeholder mevcut.');
if (/merchant_salt\)\s*\+\s*String\(status\)[\s\S]{0,80}merchant_salt/.test(functionsCode)) fail('PayTR callback hash formülünde merchant_salt iki kez kullanılıyor.');
if (!functionsCode.includes(`'${PRIMARY_DOMAIN}'`)) fail('Cloud Functions CORS özel domaini içermiyor.');
if (!functionsCode.includes(`${PRIMARY_DOMAIN}/#payment-success`)) fail('PayTR başarı URL özel domaine bağlı değil.');
if (!functionsCode.includes(`${PRIMARY_DOMAIN}/#payment-failed`)) fail('PayTR hata URL özel domaine bağlı değil.');
if (functionsCode.includes(LEGACY_PRIMARY)) fail('Cloud Functions içinde eski belgin.web.app primary-domain referansı kaldı.');
else pass('Cloud Functions özel domain ödeme/CORS sözleşmesi geçti.');

const catalogPath = path.join(root, 'functions', 'product-catalog.json');
if (!fs.existsSync(catalogPath)) fail('Sunucu ödeme kataloğu üretilmemiş. npm run build çalıştırılmalı.');
else {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  if (Object.keys(catalog).length < 1) fail('Sunucu ödeme kataloğu boş.');
  else pass(`Sunucu ödeme kataloğu hazır: ${Object.keys(catalog).length} ürün.`);
}

const secretPatterns = [
  /PAYTR_MERCHANT_KEY\s*=\s*["'][^"']{8,}["']/i,
  /PAYTR_MERCHANT_SALT\s*=\s*["'][^"']{8,}["']/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
const scanFiles = ['functions/index.js', 'js/paytr.js', 'package.json', 'firebase.json'];
for (const file of scanFiles) {
  const txt = read(file);
  if (secretPatterns.some((re) => re.test(txt))) fail(`Olası secret bulundu: ${file}`);
}

if (failed) {
  console.error('\nPRODUCTION_GUARD=FAIL');
  process.exit(1);
}
console.log('\nPRODUCTION_GUARD=PASS');
