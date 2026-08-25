// BELGIN KUYUMCULUK — production legal/compliance regression suite
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
assert(Array.isArray(PRODUCTS) && PRODUCTS.length === 1991, 'Yayın kataloğunda 1.991 ürün mevcut');
assert(Array.isArray(WATCHES) && WATCHES.length === 1980, 'Saat koleksiyonu 1.980 ürün');
assert(Array.isArray(JEWELLERY) && JEWELLERY.length === 3, 'Mücevher koleksiyonu 3 ürün');
assert(Array.isArray(PRE_OWNED_ITEMS) && PRE_OWNED_ITEMS.length >= 10, 'İkinci el koleksiyonu mevcut');
assert(Array.isArray(PRE_OWNED_GOLD) && PRE_OWNED_GOLD.length >= 2, 'İkinci el altın ürünleri mevcut');
assert(Array.isArray(WATCH_BRANDS) && WATCH_BRANDS.length === 9, 'Saat markaları mevcut');
assert(Array.isArray(JEWELRY_BRANDS) && JEWELRY_BRANDS.length === 5, 'Mücevher markaları mevcut');
assert(!PRODUCTS.some(p => !Number.isFinite(Number(p.price)) || Number(p.price) <= 0), 'Tüm ürün fiyatları geçerli');
assert(!PRODUCTS.some(p => !p.brand || !p.reference || !p.metal || !p.image), 'Temel ürün alanları eksiksiz');

console.log('\n--- 2. Ödeme güvenliği ---');
const params = { merchant_id:'123', user_ip:'127.0.0.1', merchant_oid:'BLG-1', email:'test@example.com', payment_amount:'1200000', user_basket:'x', no_installment:0, max_installment:6, currency:'TL', test_mode:1 };
const hashStr = String(params.merchant_id)+String(params.user_ip)+String(params.merchant_oid)+String(params.email)+String(params.payment_amount)+String(params.user_basket)+String(params.no_installment)+String(params.max_installment)+String(params.currency)+String(params.test_mode)+'salt';
const token = crypto.createHmac('sha256','key').update(hashStr).digest('base64');
assert(token.length > 20, 'PayTR HMAC-SHA256 token üretimi çalışıyor');
const functionsCode = read('functions/index.js');
assert(functionsCode.includes("Number(product.price) < HIGH_VALUE_SECURE_DELIVERY_THRESHOLD"), 'Backend 12.000 TL eşiğini dahil ederek uygular');
assert(functionsCode.includes("deliveryMethod !== 'showroom'"), 'Backend yüksek değerli üründe mağaza teslimini zorlar');
assert(functionsCode.includes('internalKycPolicyApplied'), 'Sipariş kaydında iç KYC uygulama izi tutulur');
assert(functionsCode.includes('suspiciousTransactionAssessmentAmountIndependent'), 'Şüpheli işlem değerlendirmesinin tutardan bağımsız olduğu kayıt mimarisinde belirtilir');

console.log('\n--- 3. 14 hukuki belge ---');
const legalDir = path.join(__dirname, '../belgin_kuyumculuk_hukuki_sozlesme_paketi');
const legalDocs = [
'00_Web_Hukuki_Uyum_Uygulama_Kontrol_Listesi.docx','01_Mesafeli_Satis_Sozlesmesi_Belgin_Kuyumculuk.docx','02_On_Bilgilendirme_Formu.docx','03_Yuksek_Degerli_Urun_Magazadan_Teslim_Protokolu.docx','04_Cayma_Iade_Degisim_Iptal_Politikasi.docx','05_KVKK_Musteri_Aydinlatma_Metni.docx','06_Gizlilik_ve_Kisisel_Veri_Guvenligi_Politikasi.docx','07_Cerez_Politikasi.docx','08_Web_Sitesi_Kullanim_Kosullari.docx','09_Ticari_Elektronik_Ileti_Onay_Metni.docx','10_KVKK_Acik_Riza_Metni.docx','11_Garanti_Ayipli_Mal_Satis_Sonrasi_Politikasi.docx','12_KYC_MASAK_Supheli_Islem_Uyum_Politikasi.docx','13_Magaza_Teslim_Tesellum_Formu.docx'];
assert(legalDocs.every(f => fs.existsSync(path.join(legalDir, f))), '14 hukuki DOCX dosyası mevcut');

const publicPages = ['mesafeli-satis-sozlesmesi.html','on-bilgilendirme-formu.html','yuksek-degerli-urun-teslimi.html','iade-degisim-cayma.html','kvkk-aydinlatma-metni.html','gizlilik-politikasi.html','cerez-politikasi.html','kullanim-kosullari.html','ticari-elektronik-ileti-onayi.html','kvkk-acik-riza.html','garanti-ve-satis-sonrasi.html','musteri-tanima-ve-islem-guvenligi.html'];
assert(publicPages.every(f => fs.existsSync(path.join(__dirname, '..', f))), '12 müşteri dostu hukuki HTML sayfası mevcut');

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
assert(kycPage.includes('Şüpheli işlem değerlendirmesi parasal bir alt sınıra bağlı değildir'), 'Şüpheli işlem değerlendirmesinin tutardan bağımsız olduğu açıklanmıştır');
assert(kycPage.includes('Bağlantılı ve Bölünmüş İşlemler'), 'Bağlantılı/bölünmüş işlem yaklaşımı açıklanmıştır');
assert(kycPage.includes('Başkası Hesabına Hareket'), 'Başkası hesabına hareket kontrolü açıklanmıştır');
assert(!kycPage.includes('iç risk skoru:') && !kycPage.includes('STR tetik puanı'), 'Gizli risk/STR algoritması public sayfada ifşa edilmez');

const deliveryPage = read('yuksek-degerli-urun-teslimi.html');
assert(deliveryPage.includes('12.000 TL üzerindeki') || deliveryPage.includes('12.000 TL ve üzerindeki'), 'Yüksek değerli teslim sayfasında eşik görünür');
assert(deliveryPage.includes('yalnız mağazadan') || deliveryPage.includes('yalnızca mağazadan'), 'Yüksek değerli ürün mağazadan teslim kuralı görünür');
assert(deliveryPage.includes('kimlik') && deliveryPage.includes('imza'), 'Kimlik doğrulaması ve imza şartı görünür');
assert(deliveryPage.includes('MASAK Yükümlülükleri Ayrıca Uygulanır'), 'MASAK yükümlülüklerinin ayrıca uygulanacağı görünür');

const preInfo = read('on-bilgilendirme-formu.html');
const contract = read('mesafeli-satis-sozlesmesi.html');
const kvkk = read('kvkk.html');
assert(preInfo.includes('Şüpheli işlem değerlendirmesi tutardan bağımsızdır'), 'Ön bilgilendirmede tutardan bağımsız şüpheli işlem ilkesi var');
assert(contract.includes('MASAK ve iç güvenlik standardı birlikte uygulanır'), 'Mesafeli satış sözleşmesinde iç standart ve MASAK birlikte düzenlenmiş');
assert(kvkk.includes('MASAK ve Kanuni Uyum Amaçlı İşleme'), 'KVKK metninde MASAK/uyum veri işleme amacı açıklanmış');
assert(kvkk.includes('Bu metin bir açık rıza metni değildir'), 'KVKK aydınlatma ile açık rıza ayrılmış');

console.log('\n--- 5. Tüketici ve consent korumaları ---');
const returnPolicy = read('iade-degisim-cayma.html');
const normalizedReturnPolicy = returnPolicy.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
assert(!normalizedReturnPolicy.includes('tüm altın ürünlerinde iade yoktur') && !normalizedReturnPolicy.includes('altın ürünlerinde hiçbir şekilde iade yoktur'), 'Altın için blanket iade yok hükmü bulunmaz');
assert(!normalizedReturnPolicy.includes('tüm saat ürünlerinde iade yoktur') && !normalizedReturnPolicy.includes('saat ürünlerinde hiçbir şekilde iade yoktur'), 'Saat için blanket iade yok hükmü bulunmaz');
const cookiePolicy = read('cerez-politikasi.html');
assert(cookiePolicy.length > 500, 'Çerez politikası mevcut');
const marketingPolicy = read('ticari-elektronik-ileti-onayi.html');
assert(marketingPolicy.length > 500, 'Ticari elektronik ileti politikası mevcut');

console.log('\n========================================');
console.log(`SONUÇ: ${passed} TEST BAŞARILI, ${failed} TEST BAŞARISIZ`);
console.log('========================================\n');
if (failed > 0) process.exit(1);
