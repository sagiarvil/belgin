const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = false;
const fail = (msg) => { failed = true; console.error(`❌ ${msg}`); };
const pass = (msg) => console.log(`✅ ${msg}`);

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const firebasePath = path.join(root, 'firebase.json');
if (!fs.existsSync(firebasePath)) fail('firebase.json bulunamadı.');
else {
  const cfg = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
  const rewrites = cfg.hosting?.rewrites || [];
  const required = ['createPayTRToken', 'paytrCallback', 'getOrderStatus'];
  for (const fn of required) {
    if (!rewrites.some((r) => r.function === fn)) fail(`Firebase rewrite eksik: ${fn}`);
  }
  if (required.every((fn) => rewrites.some((r) => r.function === fn))) pass('Firebase API rewrite sözleşmesi tam.');
}

const firebaserc = path.join(root, '.firebaserc');
if (fs.existsSync(firebaserc)) {
  const txt = fs.readFileSync(firebaserc, 'utf8');
  if (/carbon-web-1265b/i.test(txt)) fail('Yanlış Firebase projesi referansı bulundu: carbon-web-1265b');
}

const paytrClient = read('js/paytr.js');
if (/handleDemoSimulation\s*\(/.test(paytrClient)) fail('İstemci ödeme akışında demo-success fallback mevcut.');
else pass('İstemci ödeme akışı fail-closed.');

const functionsCode = read('functions/index.js');
if (/origin:\s*true/.test(functionsCode)) fail('Cloud Functions CORS tüm originlere açık.');
if (/YOUR_MERCHANT_ID/.test(functionsCode)) fail('Cloud Functions içinde canlıda simülasyona düşebilecek PayTR placeholder mevcut.');
if (/merchant_salt\)\s*\+\s*String\(status\)[\s\S]{0,80}merchant_salt/.test(functionsCode)) fail('PayTR callback hash formülünde merchant_salt iki kez kullanılıyor.');

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
