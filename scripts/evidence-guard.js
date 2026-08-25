const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let failed = false;
const fail = (m)=>{failed=true;console.error(`❌ ${m}`)};
const pass = (m)=>console.log(`✅ ${m}`);
const read = (p)=>fs.readFileSync(path.join(root,p),'utf8');

for (const file of ['functions/evidence.js','js/order-evidence.js','siparis-hukuki-delil.html']) {
  if (!fs.existsSync(path.join(root,file))) fail(`Eksik delil sistemi dosyası: ${file}`);
}

const firebase = JSON.parse(read('firebase.json'));
const rewrites = firebase.hosting?.rewrites || [];
for (const fn of ['issueEvidenceAccessToken','getOrderEvidence']) {
  if (!rewrites.some(r=>r.function===fn)) fail(`Delil API rewrite eksik: ${fn}`);
}

const bootstrap = read('functions/bootstrap.js');
for (const marker of ['onOrderEvidenceFinalize','issueEvidenceAccessToken','getOrderEvidence']) {
  if (!bootstrap.includes(marker)) fail(`Bootstrap delil exportu eksik: ${marker}`);
}

const evidence = read('functions/evidence.js');
const required = [
  'crypto.randomBytes(32)',
  'TOKEN_TTL_MS',
  'MAX_FAILED_ATTEMPTS',
  'timingSafeEqual',
  'evidenceAccessAttempts',
  'manifestRootSha256',
  'receiptSha256',
  'requestFingerprintHash',
  'EVIDENCE_RECEIPT_VIEWED',
  'LEGAL_EVIDENCE_ROOT_CAPTURED',
  "Cache-Control', 'no-store, private'",
];
for (const marker of required) if (!evidence.includes(marker)) fail(`Delil güvenlik katmanı eksik: ${marker}`);
if (/return[\s\S]{0,80}ipAddress\s*:/i.test(evidence)) fail('Müşteri delil çıktısında ham IP döndürme riski var.');
if (/tcKimlik|tckn|identityNumber|kimlikNo/i.test(evidence)) fail('Delil endpointinde ham kimlik numarası işleme izi bulundu.');

const page = read('siparis-hukuki-delil.html');
if (!page.includes('noindex,nofollow,noarchive')) fail('Sipariş delil ekranı arama motorlarına kapalı değil.');
if (!page.includes('Sipariş, Ödeme, Kabul ve Teslim Hukuki Delil Belgesi')) fail('Sipariş delil belgesi başlığı eksik.');

const client = read('js/order-evidence.js');
for (const marker of ['/api/issueEvidenceAccessToken','/api/getOrderEvidence','sessionStorage','receiptSha256','Yazdır / PDF Kaydet']) {
  if (!client.includes(marker)) fail(`Delil istemci katmanı eksik: ${marker}`);
}
if (/localStorage\.setItem\([^\n]*accessToken/i.test(client)) fail('Delil erişim tokenı localStorage içinde kalıcı saklanmamalı.');

if (failed) { console.error('\nEVIDENCE_GUARD=FAIL'); process.exit(1); }
pass('Siparişe özgü delil sistemi: kimlik doğrulama, kısa ömürlü token, belge/hash, audit, ödeme ve teslim zinciriyle korumalı.');
console.log('\nEVIDENCE_GUARD=PASS');
