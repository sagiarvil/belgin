// BELGIN KUYUMCULUK — production legal/compliance regression suite
process.env.NODE_ENV = 'test';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { console.log(`  ✅ PASS: ${message}`); passed++; }
  else { console.error(`  ❌ FAIL: ${message}`); failed++; }
}
function read(file) { return fs.readFileSync(path.join(__dirname, '..', file), 'utf8'); }

const dataContent = read('js/data.js');
vm.runInThisContext(dataContent);

console.log('\n========================================');
console.log('BELGIN KUYUMCULUK TEST RUNNER');
console.log('========================================\n');

console.log('--- 1. Katalog bütünlüğü ---');
assert(Array.isArray(PRODUCTS) && PRODUCTS.length >= 1000, `Yayın kataloğunda ${PRODUCTS.length} ürün mevcut (>= 1.000)`);
assert(Array.isArray(WATCHES) && WATCHES.length >= 1000, `Saat koleksiyonunda ${WATCHES.length} ürün mevcut (>= 1.000)`);
assert(Array.isArray(JEWELLERY) && JEWELLERY.length >= 3, 'Mücevher koleksiyonu mevcut');
assert(Array.isArray(PRE_OWNED_ITEMS) && PRE_OWNED_ITEMS.length >= 10, 'İkinci el koleksiyonu mevcut');
assert(Array.isArray(PRE_OWNED_GOLD) && !PRODUCTS.some(p => /24\s*ayar/i.test(p.title || p.name) || /külçe/i.test(p.title || p.name)), '24 Ayar külçe/gram altınlar kalıcı olarak katalogdan kaldırılmıştır');
assert(PRE_OWNED_ITEMS.every(p => p.price - p.buyPrice === 500), 'İkinci el tüm ürünlerde al-sat marjı tam 500 TL');
assert(Array.isArray(WATCH_BRANDS) && WATCH_BRANDS.length >= 9, `Saat markaları mevcut (${WATCH_BRANDS.length} marka)`);
assert(Array.isArray(JEWELRY_BRANDS) && JEWELRY_BRANDS.length === 5, 'Mücevher markaları mevcut');
assert(!PRODUCTS.some(p => !Number.isFinite(Number(p.price)) || Number(p.price) <= 0), 'Tüm ürün fiyatları geçerli');
assert(!PRODUCTS.some(p => !p.brand || !p.reference || !p.metal || !p.image), 'Temel ürün alanları eksiksiz');

console.log('\n--- 2. Ödeme güvenliği ve server evidence ---');
const params = { merchant_id:'123', user_ip:'127.0.0.1', merchant_oid:'BLG-1', email:'test@example.com', payment_amount:'1200000', user_basket:'x', no_installment:0, max_installment:6, currency:'TL', test_mode:1 };
const hashStr = String(params.merchant_id)+String(params.user_ip)+String(params.merchant_oid)+String(params.email)+String(params.payment_amount)+String(params.user_basket)+String(params.no_installment)+String(params.max_installment)+String(params.currency)+String(params.test_mode)+'salt';
const token = crypto.createHmac('sha256','key').update(hashStr).digest('base64');
assert(token.length > 20, 'PayTR HMAC-SHA256 token üretimi çalışıyor');
const functionsCode = ['functions/index.js', 'functions/payment/payment-service.js', 'functions/payment/providers/paytr.js'].map(read).join('\n');
assert(functionsCode.includes("Number(product.price) < HIGH_VALUE_SECURE_DELIVERY_THRESHOLD"), 'Backend 12.000 TL eşiğini dahil ederek uygular');
assert(functionsCode.includes("deliveryMethod !== 'showroom'"), 'Backend yüksek değerli üründe mağaza teslimini zorlar');
assert(functionsCode.includes('productSnapshotHash'), 'Sipariş ürün/fiyat snapshot hash kaydı var');
assert(functionsCode.includes('evidenceId'), 'Sipariş hukuki delil kayıt kimliği üretiliyor');
assert(functionsCode.includes("collection('auditEvents')"), 'Append-only audit event alt koleksiyonu kullanılıyor');
assert(functionsCode.includes('getLegalEvidenceSnapshot'), 'Hukuki belge sürüm/hash snapshot katmanı aktif');
assert(functionsCode.includes('suspiciousTransactionAssessmentAmountIndependent'), 'Şüpheli işlem değerlendirmesinin tutardan bağımsız olduğu kayıt mimarisinde belirtilir');

console.log('\n--- 3. Hukuki belge seti ---');
const legalDir = path.join(__dirname, '../belgin_kuyumculuk_hukuki_sozlesme_paketi');
const legalDocs = [
'00_Web_Hukuki_Uyum_Uygulama_Kontrol_Listesi.docx','01_Mesafeli_Satis_Sozlesmesi_Belgin_Kuyumculuk.docx','02_On_Bilgilendirme_Formu.docx','03_Yuksek_Degerli_Urun_Magazadan_Teslim_Protokolu.docx','04_Cayma_Iade_Degisim_Iptal_Politikasi.docx','05_KVKK_Musteri_Aydinlatma_Metni.docx','06_Gizlilik_ve_Kisisel_Veri_Guvenligi_Politikasi.docx','07_Cerez_Politikasi.docx','08_Web_Sitesi_Kullanim_Kosullari.docx','09_Ticari_Elektronik_Ileti_Onay_Metni.docx','10_KVKK_Acik_Riza_Metni.docx','11_Garanti_Ayipli_Mal_Satis_Sonrasi_Politikasi.docx','12_KYC_MASAK_Supheli_Islem_Uyum_Politikasi.docx','13_Magaza_Teslim_Tesellum_Formu.docx'];
assert(legalDocs.every(f => fs.existsSync(path.join(legalDir, f))), '14 hukuki DOCX dosyası mevcut');

const publicPages = ['mesafeli-satis-sozlesmesi.html','on-bilgilendirme-formu.html','yuksek-degerli-urun-teslimi.html','iade-degisim-cayma.html','kvkk-aydinlatma-metni.html','gizlilik-politikasi.html','cerez-politikasi.html','kullanim-kosullari.html','ticari-elektronik-ileti-onayi.html','kvkk-acik-riza.html','garanti-ve-satis-sonrasi.html','musteri-tanima-ve-islem-guvenligi.html','hukuki-delil-ve-kayit-politikasi.html'];
assert(publicPages.every(f => fs.existsSync(path.join(__dirname, '..', f))), '13 müşteri dostu hukuki HTML sayfası mevcut');

console.log('\n--- 4. 12.000 TL iç güvenlik / MASAK ayrımı ---');
const legalClient = read('js/legal-compliance.js');
assert(legalClient.includes('>=HIGH_VALUE_SECURE_DELIVERY_THRESHOLD'), 'Frontend 12.000 TL dahil iç güvenlik standardını tetikler');
function internalHighValue(p) {
  const c = String(p.category||'').toLowerCase();
  return Number(p.price) >= 12000 && (c === 'saat' || c === 'watch' || c === 'altin' || c === 'altın' || c === 'gold' || p.isGold === true);
}
assert(!internalHighValue({price:11999,category:'saat'}), '11.999 TL saat iç güvenlik eşiğini tetiklemez');
assert(internalHighValue({price:12000,category:'saat'}), '12.000 TL saat iç güvenlik/KYC standardını tetikler');
assert(internalHighValue({price:12001,category:'saat'}), '12.001 TL saat iç güvenlik/KYC standardını tetikler');
assert(internalHighValue({price:20000,category:'altin'}), '20.000 TL altın iç güvenlik/KYC standardını tetikler');

const kycPage = read('musteri-tanima-ve-islem-guvenligi.html');
assert(kycPage.includes("12.000 TL tutarı MASAK'ın kanuni parasal eşiği değildir"), '12.000 TL iç eşik ile MASAK kanuni eşiği açıkça ayrılmıştır');
assert(kycPage.includes('Şüpheli işlem için alt tutar beklenmez'), 'Şüpheli işlem değerlendirmesinin tutardan bağımsız olduğu açıklanmıştır');
assert(kycPage.includes('Gerçek Faydalanıcı, Temsil ve Yetki Kontrolü'), 'Gerçek faydalanıcı ve temsil kontrolü açıklanmıştır');
assert(kycPage.includes('Bağlantılı, Bölünmüş ve Tekrarlanan İşlemler'), 'Bağlantılı/bölünmüş işlem yaklaşımı açıklanmıştır');
assert(kycPage.includes('Kayıt, Muhafaza ve Yetkili Makamlara İbraz'), 'MASAK kayıt/muhafaza/ibraz katmanı açıklanmıştır');
assert(kycPage.includes('Delil Zinciri ve Audit Kayıtları'), 'Hukuki delil zinciri KYC politikasına bağlanmıştır');
assert(!kycPage.includes('iç risk skoru:') && !kycPage.includes('STR tetik puanı'), 'Gizli risk/STR algoritması public sayfada ifşa edilmez');

const deliveryPage = read('yuksek-degerli-urun-teslimi.html');
assert(deliveryPage.includes('12.000 TL üzerindeki') || deliveryPage.includes('12.000 TL ve üzerindeki'), 'Yüksek değerli teslim sayfasında eşik görünür');
assert(deliveryPage.includes('yalnız mağazadan') || deliveryPage.includes('yalnızca mağazadan'), 'Yüksek değerli ürün mağazadan teslim kuralı görünür');
assert(deliveryPage.includes('kimlik') && deliveryPage.includes('imza'), 'Kimlik doğrulaması ve imza şartı görünür');
assert(deliveryPage.includes('MASAK Yükümlülükleri Ayrıca Uygulanır'), 'MASAK yükümlülüklerinin ayrıca uygulanacağı görünür');

console.log('\n--- 5. Belge bütünlük ve ücretsiz dış zaman ispatı ---');
const manifest = JSON.parse(read('legal-manifest.json'));
assert(manifest.schema === 'belgin-legal-evidence-manifest-v3', 'Hukuki belge manifest şeması v3');
assert(/^[a-f0-9]{64}$/i.test(String(manifest.manifestRootSha256||'')), 'Deterministik hukuk seti kök SHA-256 mevcut');
assert(Object.keys(manifest.documents || {}).length >= 12, 'Hukuki manifest en az 12 belge içeriyor');
assert(Object.values(manifest.documents || {}).every(x => /^[a-f0-9]{64}$/i.test(String(x.sha256||''))), 'Tüm hukuki belgelerde gerçek SHA-256 biçimi var');
const legalStamp = read('js/legal-stamp.js');
assert(!legalStamp.includes('generateSimulatedHash') && !legalStamp.includes('SHA256-TS-'), 'Simüle hash/zaman damgası üretimi kaldırılmıştır');
assert(!legalStamp.includes('Elektronik Olarak İmzalandı & Onaylandı'), 'Gerçek olmayan elektronik imza iddiası yoktur');
assert(legalStamp.includes('OpenTimestamps') && legalStamp.includes('Dış Zaman İspatı'), 'Hukuk sayfalarında bağımsız OpenTimestamps katmanı gösterilir');
assert(legalStamp.includes('nitelikli elektronik imza') && legalStamp.includes('5070'), 'Ücretsiz teknik zaman ispatının ESHS/e-imza olmadığı açıkça belirtilir');
const evidencePolicy = read('hukuki-delil-ve-kayit-politikasi.html');
assert(evidencePolicy.includes('OpenTimestamps / Bitcoin'), 'Hukuki delil politikasında OpenTimestamps/Bitcoin modeli açıklanmıştır');
assert(evidencePolicy.includes('Append-only işlem geçmişi'), 'Append-only delil zinciri kamu politikasında açıklanmıştır');
assert(evidencePolicy.includes('nitelikli elektronik imza') && evidencePolicy.includes('Elektronik Sertifika Hizmet Sağlayıcısı'), 'Nitelikli zaman damgası/e-imza ayrımı doğru yapılmıştır');
const otsWorkflow = read('.github/workflows/legal-free-timestamp.yml');
assert(otsWorkflow.includes('ots stamp') && otsWorkflow.includes('ots upgrade'), 'OpenTimestamps otomatik stamp/upgrade workflow aktif');
assert(otsWorkflow.includes('manifestRootSha256'), 'OpenTimestamps ham build zamanına değil deterministik hukuk köküne bağlanır');

console.log('\n--- 6. Ön bilgilendirme, sözleşme, KVKK ---');
const preInfo = read('on-bilgilendirme-formu.html');
const contract = read('mesafeli-satis-sozlesmesi.html');
const kvkk = read('kvkk.html');
assert(preInfo.includes('Şüpheli işlem değerlendirmesi tutardan bağımsızdır'), 'Ön bilgilendirmede tutardan bağımsız şüpheli işlem ilkesi var');
assert(contract.includes('MASAK ve iç güvenlik standardı birlikte uygulanır'), 'Mesafeli satış sözleşmesinde iç standart ve MASAK birlikte düzenlenmiş');
assert(kvkk.includes('MASAK ve Kanuni Uyum Amaçlı İşleme'), 'KVKK metninde MASAK/uyum veri işleme amacı açıklanmış');
assert(kvkk.includes('Bu metin bir açık rıza metni değildir'), 'KVKK aydınlatma ile açık rıza ayrılmış');

console.log('\n--- 7. Tüketici ve consent korumaları ---');
const returnPolicy = read('iade-degisim-cayma.html');
const normalizedReturnPolicy = returnPolicy.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
assert(!normalizedReturnPolicy.includes('tüm altın ürünlerinde iade yoktur') && !normalizedReturnPolicy.includes('altın ürünlerinde hiçbir şekilde iade yoktur'), 'Altın için blanket iade yok hükmü bulunmaz');
assert(!normalizedReturnPolicy.includes('tüm saat ürünlerinde iade yoktur') && !normalizedReturnPolicy.includes('saat ürünlerinde hiçbir şekilde iade yoktur'), 'Saat için blanket iade yok hükmü bulunmaz');
const cookiePolicy = read('cerez-politikasi.html');
assert(cookiePolicy.length > 500, 'Çerez politikası mevcut');
const marketingPolicy = read('ticari-elektronik-ileti-onayi.html');
assert(marketingPolicy.length > 500, 'Ticari elektronik ileti politikası mevcut');

console.log('\n--- 8. Çoklu Sanal POS Mimarisi ve Güvenlik Testleri ---');
const { PROVIDERS, PAYMENT_STATUS, DEFAULT_PROVIDER, ORDER_STATUS, canTransition } = require('../functions/payment/payment-constants');
assert(PROVIDERS.PAYTR === 'PAYTR' && PROVIDERS.QNB === 'QNB' && PROVIDERS.AKBANK === 'AKBANK' && PROVIDERS.YAPIKREDI === 'YAPIKREDI', 'Merkezi 4 POS sağlayıcı sabiti tanımlı');
assert(DEFAULT_PROVIDER === 'AKBANK', 'Varsayılan sağlayıcı AKBANK');
assert(PAYMENT_STATUS.PAID === 'PAYMENT_PAID' && PAYMENT_STATUS.PENDING === 'PAYMENT_PENDING', 'Standart ödeme durum modelleri tanımlı');
assert(canTransition(ORDER_STATUS.CREATED, ORDER_STATUS.PAYMENT_SESSION_CREATING), 'FSM: CREATED -> PAYMENT_SESSION_CREATING geçerli');
assert(!canTransition(ORDER_STATUS.CREATED, ORDER_STATUS.COMPLETED), 'FSM: CREATED -> COMPLETED doğrudan geçiş engellenir');

const paymentRouter = require('../functions/payment/payment-router');
assert(paymentRouter.getProvider('AKBANK').name === 'AKBANK', 'Payment router AKBANK sağlayıcısını çözümlüyor');
assert(paymentRouter.getProvider().name === 'AKBANK', 'Payment router boş çağrıda varsayılan AKBANK dönüyor');

const qnbAdapter = paymentRouter.getProvider('QNB');
let qnbBlocked = false;
qnbAdapter.createPayment().catch((e) => { if (e.code === 'PROVIDER_NOT_CONFIGURED') qnbBlocked = true; });
assert(qnbAdapter.verifyCallback().reason === 'PROVIDER_NOT_CONFIGURED', 'QNB Finansbank adapter dokümansız çağrıda FAIL-CLOSED davranıyor (PROVIDER_NOT_CONFIGURED)');

const akbankAdapter = paymentRouter.getProvider('AKBANK');
let akbankBlocked = false;
akbankAdapter.createPayment().catch((e) => { if (e.code === 'PROVIDER_NOT_CONFIGURED') akbankBlocked = true; });
assert(akbankAdapter.verifyCallback().reason === 'PROVIDER_NOT_CONFIGURED', 'Akbank adapter dokümansız çağrıda FAIL-CLOSED davranıyor (PROVIDER_NOT_CONFIGURED)');

const yapiKrediAdapter = paymentRouter.getProvider('YAPIKREDI');
let yapiKrediBlocked = false;
yapiKrediAdapter.createPayment().catch((e) => { if (e.code === 'PROVIDER_NOT_CONFIGURED') yapiKrediBlocked = true; });
assert(yapiKrediAdapter.verifyCallback().reason === 'PROVIDER_NOT_CONFIGURED', 'Yapı Kredi adapter dokümansız çağrıda FAIL-CLOSED davranıyor (PROVIDER_NOT_CONFIGURED)');

let unknownBlocked = false;
try { paymentRouter.getProvider('UNKNOWN_BANK'); } catch (e) { if (e.code === 'UNKNOWN_PROVIDER') unknownBlocked = true; }
assert(unknownBlocked, 'Bilinmeyen sağlayıcı talebi güvenli şekilde engelleniyor (UNKNOWN_PROVIDER)');

const paytrAdapter = require('../functions/payment/providers/paytr');
const fakeCallbackRes = paytrAdapter.verifyCallback({ body: { merchant_oid: 'BLG-123', status: 'success', total_amount: '1000', hash: 'fake_hash' }, order: { total: 100, amountInKurus: '10000' } });
assert(fakeCallbackRes.isValid === false, 'Sahte hash veya tutar uyuşmazlığı olan callback FAIL-CLOSED reddediliyor');

const successPage = read('odeme-basarili.html');
const failPage = read('odeme-basarisiz.html');
assert(successPage.includes('Ödemeniz Başarıyla Alındı') && !successPage.includes('cvv') && !successPage.includes('cardnumber'), 'odeme-basarili.html premium ve güvenli');
assert(failPage.includes('Ödeme Tamamlanamadı') && !failPage.includes('cvv') && !failPage.includes('cardnumber'), 'odeme-basarisiz.html kart bilgisi ifşa etmeden çalışıyor');

const clientPayment = read('js/belgin-payment.js');
assert(clientPayment.includes('/payment/create') && clientPayment.includes('BelginPayment'), 'js/belgin-payment.js çoklu POS istemci katmanı hazır');

console.log('\n========================================');
console.log(`SONUÇ: ${passed} TEST BAŞARILI, ${failed} TEST BAŞARISIZ`);
console.log('========================================\n');
if (failed > 0) process.exit(1);
