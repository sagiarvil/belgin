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
  const required = ['createPayTRToken', 'paytrCallback', 'getOrderStatus', 'completeHighValueDelivery'];
  for (const fn of required) if (!rewrites.some((r) => r.function === fn)) fail(`Firebase rewrite eksik: ${fn}`);
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
if (!functionsCode.includes('productSnapshotHash') || !functionsCode.includes('evidenceId') || !functionsCode.includes("collection('auditEvents')")) fail('Sunucu hukuki delil/audit zinciri eksik.');
if (!functionsCode.includes('getLegalEvidenceSnapshot')) fail('Sunucu hukuk belge hash snapshot katmanı eksik.');
else pass('Cloud Functions ödeme, CORS ve hukuki delil zinciri kontrolü geçti.');

const bootstrapPath = path.join(root, 'functions', 'bootstrap.js');
const deliveryPath = path.join(root, 'functions', 'delivery.js');
if (!fs.existsSync(bootstrapPath) || !fs.existsSync(deliveryPath)) {
  fail('Yüksek değerli teslim tamamlama fonksiyon katmanı eksik.');
} else {
  const bootstrap = read('functions/bootstrap.js');
  const delivery = read('functions/delivery.js');
  if (!bootstrap.includes('completeHighValueDelivery')) fail('completeHighValueDelivery bootstrap exportu eksik.');
  const deliveryRequired = [
    'verifyIdToken',
    'decoded.admin !== true && decoded.staff !== true',
    "order.paymentStatus !== 'PAID'",
    'identityVerified',
    'deliveryFormCompleted',
    'productIdentifiersVerified',
    'deliveryFormReference',
    'productIdentifiersHash',
    'HIGH_VALUE_DELIVERY_COMPLETED',
    "deliveryStatus: 'DELIVERED'",
  ];
  for (const marker of deliveryRequired) if (!delivery.includes(marker)) fail(`Yüksek değerli teslim güvenlik kapısı eksik: ${marker}`);
  if (/tcKimlik|tckn|kimlikNo|identityNumber/i.test(delivery)) fail('Teslim endpointinde ham TCKN/kimlik numarası saklama izi bulundu.');
  else pass('Yüksek değerli teslim; personel yetkisi, ödeme kesinliği, kimlik, imzalı form ve ürün kimliklendirme kapılarıyla korunuyor.');
}

const catalogPath = path.join(root, 'functions', 'product-catalog.json');
if (!fs.existsSync(catalogPath)) fail('Sunucu ödeme kataloğu üretilmemiş. npm run build çalıştırılmalı.');
else {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  if (Object.keys(catalog).length < 1) fail('Sunucu ödeme kataloğu boş.');
  else pass(`Sunucu ödeme kataloğu hazır: ${Object.keys(catalog).length} ürün.`);
}

const manifestPaths = [path.join(root, 'legal-manifest.json'), path.join(root, 'functions', 'legal-manifest.json')];
if (!manifestPaths.every(fs.existsSync)) {
  fail('Hukuki belge bütünlük manifesti eksik. npm run build çalıştırılmalı.');
} else {
  const publicManifest = JSON.parse(fs.readFileSync(manifestPaths[0], 'utf8'));
  const fnManifest = JSON.parse(fs.readFileSync(manifestPaths[1], 'utf8'));
  const docs = publicManifest.documents || {};
  if (publicManifest.schema !== 'belgin-legal-evidence-manifest-v3') fail('Hukuki manifest v3 şemasında değil.');
  if (!/^[a-f0-9]{64}$/i.test(String(publicManifest.manifestRootSha256 || ''))) fail('Deterministik hukuk seti kök SHA-256 eksik/geçersiz.');
  if (Object.keys(docs).length < 12) fail('Hukuki manifest yeterli sayıda belge içermiyor.');
  if (Object.values(docs).some((r) => !/^[a-f0-9]{64}$/i.test(String(r.sha256 || '')))) fail('Hukuki manifestte geçersiz SHA-256 bulundu.');
  const a = JSON.parse(JSON.stringify(publicManifest));
  const b = JSON.parse(JSON.stringify(fnManifest));
  delete a.generatedAt; delete b.generatedAt;
  if (JSON.stringify(a) !== JSON.stringify(b)) fail('Public ve Functions hukuki manifestleri uyuşmuyor.');
  else pass(`Hukuki belge bütünlük manifesti v3 doğrulandı: ${Object.keys(docs).length} belge.`);
}

const legalStamp = read('js/legal-stamp.js');
const prohibitedClaims = ['generateSimulatedHash', 'SHA256-TS-', 'Elektronik Olarak İmzalandı', 'T.C. HUKUKİ DELİL & KALICI VERİ SAKLAYICISI ONAYI'];
for (const claim of prohibitedClaims) if (legalStamp.includes(claim)) fail(`Simüle e-imza/zaman damgası iddiası kaldı: ${claim}`);
if (!legalStamp.includes('nitelikli elektronik imza') || !legalStamp.includes('SHA-256 belge bütünlük özeti')) fail('Belge bütünlük kutusunun hukuki nitelik açıklaması eksik.');
if (!legalStamp.includes('OpenTimestamps') || !legalStamp.includes('EXTERNAL_STATUS_URL')) fail('Ücretsiz bağımsız dış zaman ispatı UI katmanı eksik.');
else pass('Simüle e-imza kaldırıldı; SHA-256 + OpenTimestamps dış zaman ispatı doğru nitelendiriliyor.');

const otsWorkflowPath = path.join(root, '.github', 'workflows', 'legal-free-timestamp.yml');
if (!fs.existsSync(otsWorkflowPath)) {
  fail('OpenTimestamps otomatik dış zaman ispatı workflowu eksik.');
} else {
  const otsWorkflow = read('.github/workflows/legal-free-timestamp.yml');
  if (!otsWorkflow.includes('ots stamp') || !otsWorkflow.includes('ots upgrade')) fail('OpenTimestamps stamp/upgrade adımları eksik.');
  if (!otsWorkflow.includes('manifestRootSha256')) fail('Dış zaman ispatı deterministik hukuk köküne bağlı değil.');
  if (!otsWorkflow.includes('legal-proofs/status.json')) fail('Dış zaman ispatı public durum kaydı üretilmiyor.');
  else pass('Ücretsiz OpenTimestamps/Bitcoin dış zaman ispatı otomasyonu hazır.');
}

if (!fs.existsSync(path.join(root, 'hukuki-delil-ve-kayit-politikasi.html'))) fail('Hukuki Delil ve Kayıt Politikası eksik.');

const secretPatterns = [
  /PAYTR_MERCHANT_KEY\s*=\s*["'][^"']{8,}["']/i,
  /PAYTR_MERCHANT_SALT\s*=\s*["'][^"']{8,}["']/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
const scanFiles = ['functions/index.js', 'functions/delivery.js', 'js/paytr.js', 'package.json', 'firebase.json'];
for (const file of scanFiles) {
  const txt = read(file);
  if (secretPatterns.some((re) => re.test(txt))) fail(`Olası secret bulundu: ${file}`);
}

if (failed) {
  console.error('\nPRODUCTION_GUARD=FAIL');
  process.exit(1);
}
console.log('\nPRODUCTION_GUARD=PASS');
