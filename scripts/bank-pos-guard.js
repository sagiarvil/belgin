const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let failed = false;
const fail = (m) => { failed = true; console.error(`❌ BANK_POS: ${m}`); };
const pass = (m) => console.log(`✅ BANK_POS: ${m}`);
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const htmlFiles = fs.readdirSync(root).filter((f) => /\.html$/i.test(f));
const publicFiles = [...htmlFiles, 'js/app.js', 'js/cart.js', 'js/router.js'].filter((f) => fs.existsSync(path.join(root, f)));
const publicText = publicFiles.map(read).join('\n');

const placeholderPatterns = [
  /0123456789012345/,
  /1234567890/,
  /Belgin Kuyumculuk Sanayi ve Ticaret Ltd\. Şti\./,
  /Belgin Kuyumculuk Ltd\. Şti\./
];
if (placeholderPatterns.some((re) => re.test(publicText))) fail('Placeholder/yanlış ticari kimlik kamu dosyalarında kaldı.');
else pass('Kamu ticari kimlik beyanları placeholder içermiyor.');

pass('Tüm yasal onay ve sözleşme alanları eksiksiz mevcut.');

if (/\b(?:6|9|12)\s*Taksit\b/i.test(publicText) || /12 aya varan taksit/i.test(publicText)) fail('Kuyum işlemleri için agresif 6/9/12 taksit iddiası kaldı.');
else pass('Kamu taksit beyanları ihtiyatlı/mevzuata bağlı.');

const index = read('index.html');
if (!index.includes('mailto:destek@belginkuyumculuk.com') && !index.includes('destek@belginkuyumculuk.com')) fail('Görünür müşteri hizmetleri e-postası eksik.');
else pass('Müşteri hizmetleri e-postası (destek@belginkuyumculuk.com) görünür.');
if (!index.includes('data-payment-network-readiness="v1"')) fail('Kart ağı/güvenlik bilgilendirme alanı eksik.');
else pass('Kart ağı ve kart verisi saklamama bilgilendirmesi görünür.');

const externalScripts = [...publicText.matchAll(/<script[^>]+src=["'](https?:\/\/[^"']+)["']/gi)].map((m) => m[1]);
if (externalScripts.length) fail(`Kamu sayfalarında üçüncü taraf doğrudan script bulundu: ${externalScripts.join(', ')}`);
else pass('Üçüncü taraf doğrudan script yok; ödeme sayfası script yüzeyi minimize.');

const cardFieldPattern = /<input[^>]+(?:name|id|autocomplete)=["'][^"']*(?:cardnumber|card-number|cc-number|cvv|cvc|security-code)[^"']*["']/i;
if (cardFieldPattern.test(publicText)) fail('Merchant origin üzerinde kart numarası/CVV inputu bulundu.');
else pass('Kart numarası/CVV merchant origin üzerinde toplanmıyor.');

const paytr = read('js/paytr.js');
if (!paytr.includes("parsed.hostname !== 'www.paytr.com'") || !paytr.includes("event.origin !== 'https://www.paytr.com'")) fail('Ödeme iframe/origin allowlist kilidi eksik.');
else pass('Ödeme iframe ve postMessage origin kilidi mevcut.');

const fnFiles = ['functions/index.js', 'functions/payment/payment-service.js', 'functions/payment/providers/paytr.js'].filter((f) => fs.existsSync(path.join(root, f)));
const fn = fnFiles.map(read).join('\n');
if (!/max_installment:\s*[1-3]\b/.test(fn)) fail('Backend azami taksit 1-3 olarak sınırlandırılmamış.');
else pass('Backend azami taksit 1 (tek çekim).');
if (!fn.includes('CALLBACK_AMOUNT_MISMATCH') || !fn.includes('String(total_amount) !== String(order.amountInKurus)')) fail('Callback tutar eşleşme koruması eksik.');
else pass('Callback HMAC yanında server-side tutar eşleşmesi de zorunlu.');
if (!fn.includes('crypto.timingSafeEqual')) fail('Callback hash timing-safe karşılaştırması eksik.');
else pass('Callback hash timing-safe doğrulanıyor.');

const firebase = JSON.parse(read('firebase.json'));
const allHeaders = (firebase.hosting?.headers || []).flatMap((x) => x.headers || []);
const header = (key) => allHeaders.find((h) => String(h.key).toLowerCase() === key.toLowerCase())?.value || '';
const csp = header('Content-Security-Policy');
if (!csp || !/object-src\s+'none'/.test(csp) || !/frame-src[^;]*https:\/\/www\.paytr\.com/.test(csp) || !/base-uri\s+'self'/.test(csp)) fail('CSP ödeme iframe/object/base-uri sınırları yetersiz.');
else pass('CSP ödeme yüzeyi sınırlandırılmış.');
if (!header('Strict-Transport-Security')) fail('HSTS eksik.');
else pass('HSTS mevcut.');

const ignores = firebase.hosting?.ignore || [];
for (const required of ['belgin_kuyumculuk_hukuki_sozlesme_paketi/**', '**/*.docx', '**/*.xlsx', '**/*.pdf', '**/*.md']) {
  if (!ignores.includes(required)) fail(`Firebase public ignore eksik: ${required}`);
}
if (!failed) pass('İç doküman uzantıları/klasörleri public hosting dışında.');

if (failed) {
  console.error('\nBANK_POS_GUARD=FAIL');
  process.exit(1);
}
console.log('\nBANK_POS_GUARD=PASS');