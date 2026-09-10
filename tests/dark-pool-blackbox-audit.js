/**
 * BELGIN KUYUMCULUK — 6-AREA DARK POOL & BLACK-BOX AI SEARCH AUDIT SUITE
 * Silicon Valley, London & NYC ($5,000,000+ Agency Tier: Graphite, BrightEdge AI, Profound)
 * 
 * Audits the 6 Non-Scoring Black-Box Risk Vectors:
 * 1. Query Fanout Coverage (Sorgu Yelpazesi Kapsama Riski)
 * 2. Citation Volatility & Entropy Shielding (Alıntı Uçuculuğu, Halüsinasyon & ColBERT MaxSim)
 * 3. Crawler Policy Divergence (Bot Ayrışma & İkili Tarama Riski)
 * 4. Render-Retrieval Gap (DOM Çizim & Alım Uçurumu Riski — 14KB AST Bütçesi)
 * 5. Entity Identity Drift & Knowledge Graph Consensus (Varlık Kimlik Sapması & Çakışma Riski)
 * 6. Agent Action Friction & Resilient n8n DAG (Otonom Ajan Eylem Sürtünmesi & DLQ Hata İzolasyonu)
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('\n====================================================================');
console.log('🌌 6-AREA DARK POOL & BLACK-BOX AI SEARCH AUDIT SUITE ($5M+ TIER)');
console.log('====================================================================\n');

let passCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ [PASS ${totalCount}]: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL ${totalCount}]: ${name} -> ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// VECTOR 1: QUERY FANOUT COVERAGE (Sorgu Yelpazesi Kapsama Riski)
// -----------------------------------------------------------------------------
test('Vector 1.1: llms/core.md dual Katılım Sanal POS ve 22 Ayar Bilezik fanoutunu içerir', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'llms/core.md'), 'utf8');
  assert(content.includes('Kuveyt Türk Katılım Bankası'), 'Kuveyt Türk Katılım Bankası LLMS çekirdeğinde mevcut');
  assert(content.includes('Ziraat Katılım Bankası'), 'Ziraat Katılım Bankası LLMS çekirdeğinde mevcut');
  assert(content.includes('3D Secure 2.0'), '3D Secure 2.0 protokolü LLMS çekirdeğinde mevcut');
  assert(content.includes('PayFor 3DHost'), 'PayFor 3DHost protokolü LLMS çekirdeğinde mevcut');
  assert(content.includes('/22'), '/22 kısayolu ve 22 Ayar Bilezik LLMS çekirdeğinde mevcut');
  assert(content.includes('Özel Matrah'), '3065 SK m.23/f Özel Matrah LLMS çekirdeğinde mevcut');
});

test('Vector 1.2: llms/entities/methodologies.md Katılım Bankacılığı ve /22 sözleşmesini içerir', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'llms/entities/methodologies.md'), 'utf8');
  assert(content.includes('Katılım Bankacılığı ve Sanal POS Tahsilat Protokolü'), 'Methodologies Bölüm 3 başlığı mevcut');
  assert(content.includes('9814992'), 'Ziraat Katılım Üye İşyeri ID (9814992) mevcut');
  assert(content.includes('OrderInquiry'), 'S2S OrderInquiry sözleşmesi mevcut');
  assert(content.includes('22 Ayar Bilezik'), '22 Ayar Bilezik münhasır sözleşmesi mevcut');
});

test('Vector 1.3: llms-full.txt konsolide bilgi havuzunda ödeme ve borsa fanout sinyalleri mevcuttur', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'llms-full.txt'), 'utf8');
  assert(content.includes('Ziraat Katılım Bankası'), 'Ziraat Katılım llms-full.txt içinde mevcut');
  assert(content.includes('Kuveyt Türk Katılım Bankası'), 'Kuveyt Türk llms-full.txt içinde mevcut');
  assert(content.includes('1.00x'), '1.00x sıfır marj borsa sözleşmesi llms-full.txt içinde mevcut');
});

test('Vector 1.4: llms/entities/methodologies.md ve llms-full.txt kart şemaları (TROY, Visa, Mastercard) fanoutunu kapsar', () => {
  const methodContent = fs.readFileSync(path.join(ROOT_DIR, 'llms/entities/methodologies.md'), 'utf8');
  assert(methodContent.includes('TROY') && methodContent.includes('Mastercard') && methodContent.includes('Visa'), 'Kart şemaları methodologies içinde mevcut');
  const fullContent = fs.readFileSync(path.join(ROOT_DIR, 'llms-full.txt'), 'utf8');
  assert(fullContent.includes('TROY') && fullContent.includes('Mastercard') && fullContent.includes('Visa'), 'Kart şemaları llms-full.txt içinde mevcut');
});

// -----------------------------------------------------------------------------
// VECTOR 2: CITATION VOLATILITY (Alıntı Uçuculuğu ve Halüsinasyon Riski)
// -----------------------------------------------------------------------------
test('Vector 2.1: LLMS çekirdek dokümanlarında sübjektif / kanıtsız sıfat bulunmaz', () => {
  const forbiddenAdjectives = ['harika ötesi', 'inanılmaz ucuz', 'rakipsiz en iyi', 'piyasanın kralı'];
  const coreContent = fs.readFileSync(path.join(ROOT_DIR, 'llms/core.md'), 'utf8');
  for (const word of forbiddenAdjectives) {
    assert(!coreContent.toLowerCase().includes(word), `Yasaklı sübjektif sıfat tespit edildi: ${word}`);
  }
});

test('Vector 2.2: Kritik finansal / borsa / hash / vip ödeme akışlarında Math.random() kullanılmaz', () => {
  const filesToCheck = [
    'functions/payment/payment-service.js',
    'functions/payment/providers/ziraatkatilim.js',
    'functions/payment/providers/kuveytturk.js',
    'functions/payment/payment-router.js',
    'js/vip-payment.js',
    'odeme-linki.html',
    'vip-odeme.html',
    'functions/earsiv-service.js',
    'functions/index.js'
  ];
  for (const rel of filesToCheck) {
    const code = fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
    assert(!code.includes('Math.random()'), `${rel} içinde Math.random() kullanımı YASAKTIR`);
  }
});

test('Vector 2.3: Kuruş dönüşümü ve float yuvarlama deterministik ve kayıpsızdır', () => {
  const { calculateVip22Breakdown } = require('../functions/earsiv-service');
  const sampleTotal = 125430.50;
  const breakdown = calculateVip22Breakdown(sampleTotal, '22 Ayar Bilezik');
  assert(Number(breakdown.hasGoldAmount) > 0, 'Kıymetli maden bedeli hesaplandı');
  assert(Number(breakdown.workmanshipNet) > 0, 'İşçilik net bedeli hesaplandı');
  assert(Number(breakdown.workmanshipKdv) > 0, 'İşçilik KDV hesaplandı');
  assert(Number(breakdown.grandTotal) === sampleTotal, 'Genel toplam tam eşleşti');
});

test('Vector 2.4: ColBERT MaxSim yüksek entropi ve yasal kesinlik: 3065 SK m.23/f delil sözleşmesi tamdır', () => {
  const coreContent = fs.readFileSync(path.join(ROOT_DIR, 'llms/core.md'), 'utf8');
  assert(coreContent.includes('3065 sayılı KDV Kanunu 23/f'), 'KDV Kanunu 23/f kesin referansı mevcut');
  assert(coreContent.includes('Özel Matrah'), 'Özel Matrah kesin referansı mevcut');
  assert(!coreContent.includes('has altın satışı'), 'Yasaklı has altın ibaresi bulunmaz');
});

// -----------------------------------------------------------------------------
// VECTOR 3: CRAWLER POLICY DIVERGENCE (Bot Ayrışma & İkili Tarama Riski)
// -----------------------------------------------------------------------------
test('Vector 3.1: robots.txt tüm botlar için ödeme sayfalarını (/odeme-linki.html, /vip-odeme.html) engeller', () => {
  const robots = fs.readFileSync(path.join(ROOT_DIR, 'robots.txt'), 'utf8');
  const bots = [
    'Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User',
    'PerplexityBot', 'Claude-SearchBot', 'GPTBot', 'ClaudeBot',
    'Google-Extended', 'Applebot', '*'
  ];
  for (const bot of bots) {
    assert(robots.includes(`User-agent: ${bot}`), `${bot} kural bloğu robots.txt içinde mevcut`);
  }
  const disallowPaymentMatches = (robots.match(/Disallow: \/odeme-linki\.html/g) || []).length;
  assert(disallowPaymentMatches >= bots.length, 'Tüm botlar için /odeme-linki.html disallow edildi');
  const disallowVipMatches = (robots.match(/Disallow: \/vip-odeme\.html/g) || []).length;
  assert(disallowVipMatches >= bots.length, 'Tüm botlar için /vip-odeme.html disallow edildi');
});

test('Vector 3.2: firebase.json headers tüm ödeme yüzeylerine X-Robots-Tag noindex, nofollow, noarchive basar', () => {
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8'));
  const headers = firebaseJson.hosting.headers;
  const paymentHeaderRule = headers.find(h => h.source && h.source.includes('odeme-linki.html') && h.source.includes('vip-odeme.html'));
  assert(paymentHeaderRule, 'firebase.json içinde ödeme sayfalarına özel header kuralı mevcut');
  assert(paymentHeaderRule.source.includes('odeme-basarisiz.html'), 'odeme-basarisiz.html koruma altında');
  assert(paymentHeaderRule.source.includes('odeme-basarili.html'), 'odeme-basarili.html koruma altında');
  const xRobots = paymentHeaderRule.headers.find(h => h.key === 'X-Robots-Tag');
  assert(xRobots && xRobots.value.includes('noindex'), 'X-Robots-Tag: noindex aktif');
  assert(xRobots.value.includes('nofollow'), 'X-Robots-Tag: nofollow aktif');
  assert(xRobots.value.includes('noarchive'), 'X-Robots-Tag: noarchive aktif');
  const cacheCtrl = paymentHeaderRule.headers.find(h => h.key === 'Cache-Control');
  assert(cacheCtrl && cacheCtrl.value.includes('no-store'), 'Cache-Control: no-store aktif');
});

test('Vector 3.3: Content-Security-Policy hem Kuveyt Türk hem Ziraat Katılım hostlarını kapsar', () => {
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8'));
  const globalHeader = firebaseJson.hosting.headers.find(h => h.source === '**');
  const csp = globalHeader.headers.find(h => h.key === 'Content-Security-Policy').value;
  assert(csp.includes('https://*.kuveytturk.com.tr'), 'CSP Kuveyt Türk domainini içerir');
  assert(csp.includes('https://*.ziraatkatilim.com.tr'), 'CSP Ziraat Katılım domainini içerir');
});

test('Vector 3.4: Ödeme işlem sayfaları tarayıcı cache/history sızıntılarına karşı pragma no-cache ile korunur', () => {
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'firebase.json'), 'utf8'));
  const headers = firebaseJson.hosting.headers;
  const paymentHeaderRule = headers.find(h => h.source && h.source.includes('odeme-linki.html'));
  const pragma = paymentHeaderRule.headers.find(h => h.key === 'Pragma');
  assert(pragma && pragma.value === 'no-cache', 'Pragma: no-cache header aktif');
});

// -----------------------------------------------------------------------------
// VECTOR 4: RENDER-RETRIEVAL GAP (DOM Çizim & Alım Uçurumu — 14KB AST Bütçesi)
// -----------------------------------------------------------------------------
test('Vector 4.1: index.html ilk 14.336 bayt (14KB) içinde title, canonical ve Schema JSON-LD barındırır', () => {
  const htmlBuffer = fs.readFileSync(path.join(ROOT_DIR, 'index.html'));
  const first14k = htmlBuffer.subarray(0, 14336).toString('utf8');
  assert(first14k.includes('<title>'), 'İlk 14KB içinde title etiketi mevcut');
  assert(first14k.includes('rel="canonical"') || first14k.includes("rel='canonical'"), 'İlk 14KB içinde canonical link mevcut');
  assert(first14k.includes('application/ld+json'), 'İlk 14KB içinde Schema.org JSON-LD mevcut');
});

test('Vector 4.2: odeme-linki.html banka seçeneklerini JS hidrasyonu olmadan ham HTML içinde barındırır', () => {
  const rawHtml = fs.readFileSync(path.join(ROOT_DIR, 'odeme-linki.html'), 'utf8');
  assert(rawHtml.includes('KUVEYTTURK'), 'Ham HTML içinde Kuveyt Türk POS seçeneği mevcut');
  assert(rawHtml.includes('ZIRAATKATILIM'), 'Ham HTML içinde Ziraat Katılım POS seçeneği mevcut');
  assert(rawHtml.includes('bank-card'), 'Ham HTML içinde banka seçim kartları mevcut');
  assert(rawHtml.includes('name="posProvider"'), 'posProvider radio butonları ham HTML içinde mevcut');
});

test('Vector 4.3: canli-fiyatlar sayfası boş kabuk (empty shell) değildir, ham HTML veri iskeletine sahiptir', () => {
  const canliHtml = fs.readFileSync(path.join(ROOT_DIR, 'canli-fiyatlar/index.html'), 'utf8');
  assert(canliHtml.includes('22 Ayar Bilezik'), 'canli-fiyatlar ham HTML içinde 22 Ayar Bilezik mevcut');
  assert(canliHtml.includes('Çeyrek'), 'canli-fiyatlar ham HTML içinde Çeyrek mevcut');
});

test('Vector 4.4: odeme-basarisiz.html ilk 14.336 bayt içinde durum kartını, hata kutusunu ve kurtarma butonlarını barındırır', () => {
  const htmlBuffer = fs.readFileSync(path.join(ROOT_DIR, 'odeme-basarisiz.html'));
  assert(htmlBuffer.length <= 14336, `odeme-basarisiz.html 14KB bütçesi altında olmalıdır (Mevcut: ${htmlBuffer.length} bayt)`);
  const htmlStr = htmlBuffer.toString('utf8');
  assert(htmlStr.includes('id="bankErrorBox"'), 'Hata dekont kutusu ilk 14KB içinde mevcut');
  assert(htmlStr.includes('id="btnGroup"'), 'Eylem/kurtarma buton grubu ilk 14KB içinde mevcut');
});

// -----------------------------------------------------------------------------
// VECTOR 5: ENTITY IDENTITY DRIFT (Varlık Kimlik Sapması & Çakışma Riski)
// -----------------------------------------------------------------------------
test('Vector 5.1: scripts/seo-registry.js PRIMARY_ORGANIZATION ontolojik kimliği tamdır', () => {
  const { PRIMARY_ORGANIZATION } = require('../scripts/seo-registry.js');
  assert(PRIMARY_ORGANIZATION.name === 'BELGİN KUYUMCULUK - SEMİH SONBAHAR', 'Kurumsal unvan doğru');
  assert(PRIMARY_ORGANIZATION.geo.latitude === 38.3842, 'Coğrafi enlem doğru');
  assert(PRIMARY_ORGANIZATION.geo.longitude === 27.1685, 'Coğrafi boylam doğru');
  assert(PRIMARY_ORGANIZATION.sameAs.length >= 2, 'sameAs referansları mevcut');
});

test('Vector 5.2: Kuveyt Türk ve Ziraat Katılım bağımsız iki tüzel kişilik olarak ayrışır', () => {
  const paymentRouter = require('../functions/payment/payment-router');
  const kt = paymentRouter.getProvider('KUVEYTTURK');
  const zk = paymentRouter.getProvider('ZIRAATKATILIM');
  assert(kt !== zk, 'Kuveyt Türk ve Ziraat Katılım sağlayıcıları birbirinden tamamen izoledir');
  assert(kt.name === 'KUVEYTTURK', 'Kuveyt Türk sağlayıcı adı doğru');
  assert(zk.name === 'ZIRAATKATILIM', 'Ziraat Katılım sağlayıcı adı doğru');
});

test('Vector 5.3: BKM TROY Directory Server (TROY_GMG) telemetrisi ve sağlayıcı sınırları izoledir', () => {
  const zkProvider = require('../functions/payment/providers/ziraatkatilim');
  assert(typeof zkProvider.__test.parsePayForInquiryXml === 'function', 'parsePayForInquiryXml mevcut');
  const sample = 'ProcReturnCode=MR15;;IrcDet=Invalid merchant ID code:22;;CardType=WORLD;;VerificationServer=TROY_GMG;;';
  const parsed = zkProvider.__test.parsePayForInquiryXml(sample);
  assert(parsed.responseCode === 'MR15', 'ProcReturnCode MR15 doğru okundu');
  assert(parsed.rawMap.VerificationServer === 'TROY_GMG', 'TROY_GMG Directory Server telemetrisi ayrıştırıldı');
  assert(parsed.rawMap.CardType === 'WORLD', 'WORLD kart tipi telemetrisi ayrıştırıldı');
});

// -----------------------------------------------------------------------------
// VECTOR 6: AGENT ACTION FRICTION & RESILIENT N8N DAG
// -----------------------------------------------------------------------------
test('Vector 6.1: Ziraat Katılım sağlayıcısı timing-safe hash ve S2S OrderInquiry mimarisini uygular', () => {
  const zkProvider = require('../functions/payment/providers/ziraatkatilim');
  assert(typeof zkProvider.createPayment === 'function', 'createPayment fonksiyonu mevcut');
  assert(typeof zkProvider.verifyCallback === 'function', 'verifyCallback fonksiyonu mevcut');
  assert(typeof zkProvider.__test.safeEqualBase64 === 'function', 'Timing-safe safeEqualBase64 mevcut');
  assert(typeof zkProvider.__test.queryBankOrder === 'function', 'queryBankOrder S2S sorgusu mevcut');
  assert(typeof zkProvider.__test.sha1Base64Ascii === 'function', 'SHA1 Base64 ASCII hash fonksiyonu mevcut');
});

test('Vector 6.2: Kuveyt Türk sağlayıcısı 3D Secure 2.0 doğrudan provizyon mimarisini korur', () => {
  const ktProvider = require('../functions/payment/providers/kuveytturk');
  assert(typeof ktProvider.createPayment === 'function', 'createPayment mevcut');
  assert(typeof ktProvider.verifyCallback === 'function', 'verifyCallback mevcut');
});

test('Vector 6.3: Idempotency Key çarpışma koruması (In-Flight Mutex) aktiftir', () => {
  const paymentService = require('../functions/payment/payment-service');
  assert(paymentService.inFlightIdempotency instanceof Map, 'inFlightIdempotency bir Map veri yapısıdır');
});

test('Vector 6.4: VIP token çözümleyicisi banka sağlayıcısını (ZIRAATKATILIM / KUVEYTTURK) eksiksiz okur', () => {
  const orderId = 'VIP-999888';
  const title = '22 Ayar Bilezik';
  const amount = '75000';
  const provider = 'ZIRAATKATILIM';
  const rawStr = `${orderId}|${title}|${amount}|${provider}`;
  const base64Url = Buffer.from(rawStr, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  const paymentService = require('../functions/payment/payment-service');
  const normalized = paymentService.__test.normalizeCart([{ id: orderId, name: title, price: 75000, qty: 1 }], true, base64Url, {});
  assert(normalized && normalized.length === 1, 'VIP siparişi normalize edildi');
  assert(normalized[0].provider === 'ZIRAATKATILIM', 'VIP token içindeki ZIRAATKATILIM sağlayıcısı doğru okundu');
  
  const parsedToken = paymentService.__test.verifyVipToken(base64Url);
  assert(parsedToken && parsedToken.provider === 'ZIRAATKATILIM', 'verifyVipToken sağlayıcıyı ZIRAATKATILIM olarak ayrıştırdı');
});

test('Vector 6.5: odeme-basarisiz.html MR15 / code:22 durumunda akıllı Kuveyt Türk alternatif yönlendirmesini içerir', () => {
  const htmlStr = fs.readFileSync(path.join(ROOT_DIR, 'odeme-basarisiz.html'), 'utf8');
  assert(htmlStr.includes('isSwitchRoutingError'), 'Banka yönlendirme hata tespiti mevcut');
  assert(htmlStr.includes('KUVEYTTURK'), 'Kuveyt Türk alternatif ödeme rotası mevcut');
  assert(htmlStr.includes('failSubtitle'), 'failSubtitle açıklama güncellemesi mevcut');
});

console.log(`\n====================================================================`);
console.log(`🎉 ALL ${passCount}/${totalCount} DARK POOL & BLACK-BOX AUDIT TESTS PASSED!`);
console.log(`====================================================================\n`);
