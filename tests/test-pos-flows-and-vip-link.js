'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n======================================================');
console.log('🏦 KUVEYT TÜRK, ZİRAAT KATILIM & VIP LINK TEST SUITE');
console.log('======================================================\n');

async function runTests() {
  // ---------------------------------------------------------------------------
  // 1. KUVEYT TÜRK POS AKIŞI KONTROLLERİ
  // ---------------------------------------------------------------------------
  console.log('--- 1. Kuveyt Türk Sanal POS Akışı Doğrulaması ---');
  const kuveyt = require('../functions/payment/providers/kuveytturk');
  const paymentConstants = require('../functions/payment/payment-constants');
  const paymentRouter = require('../functions/payment/payment-router');

  assert.strictEqual(paymentConstants.DEFAULT_PROVIDER, 'KUVEYTTURK', 'Varsayılan POS Kuveyt Türk olmalıdır');
  assert.strictEqual(paymentRouter.getProvider('KUVEYTTURK').name, 'KUVEYTTURK', 'Router Kuveyt Türk sağlayıcısını getirmelidir');

  // Kuveyt Türk eksik parametre durumunda fail-closed davranışı
  await assert.rejects(
    async () => {
      await kuveyt.createPayment({ order: null });
    },
    (err) => err && err.code === 'INVALID_ORDER',
    'Kuveyt Türk sipariş verisi yoksa INVALID_ORDER fırlatmalıdır'
  );

  // Kuveyt Türk verifyCallback orderId eksik kontrolü
  const cbRes = await kuveyt.verifyCallback({ body: {} });
  assert.strictEqual(cbRes.isValid, false, 'Kuveyt Türk eksik callback verisini geçersiz saymalıdır');
  assert.strictEqual(cbRes.reason, 'ORDER_ID_MISSING', 'Sipariş ID yoksa ORDER_ID_MISSING dönmelidir');
  console.log('  ✅ PASS: Kuveyt Türk fail-closed güvenlik kapıları aktif');

  // Kuveyt Türk 3D Secure başarısız dönüş durumu
  const mockFailBody = {
    AuthenticationResponse: '<KuveytTurkVPosMessage><ResponseCode>99</ResponseCode><ResponseMessage>SMS Sifresi Hatali</ResponseMessage><MerchantOrderId>BLG-12345</MerchantOrderId></KuveytTurkVPosMessage>'
  };
  const failRes = await kuveyt.verifyCallback({ body: mockFailBody });
  assert.strictEqual(failRes.isValid, true, 'Callback formatı geçerli');
  assert.strictEqual(failRes.isSuccess, false, 'Ödeme başarısız olarak işaretlenmeli');
  assert.strictEqual(failRes.failReasonCode, '99', 'Banka hata kodu taşınmalı');
  assert.strictEqual(failRes.orderId, 'BLG-12345', 'Sipariş ID çözülmeli');
  console.log('  ✅ PASS: Kuveyt Türk 3D Secure SMS ret ve hata akışı doğrulanıyor');

  // ---------------------------------------------------------------------------
  // 2. ZİRAAT KATILIM POS AKIŞI KONTROLLERİ
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Ziraat Katılım PayFor 3DHost Akışı Doğrulaması ---');
  process.env.ZIRAAT_MBR_ID = '12';
  process.env.ZIRAAT_MERCHANT_ID = '9814992';
  process.env.ZIRAAT_API_USER = 'test-api-user';
  process.env.ZIRAAT_API_PASSWORD = 'test-api-password';
  process.env.ZIRAAT_MERCHANT_PASS = 'test-merchant-pass';
  process.env.ZIRAAT_3DHOST_URL = 'https://vpos.ziraatkatilim.com.tr/MPI/3DHost.aspx';
  process.env.ZIRAAT_PAYMENT_API = 'https://vpos.ziraatkatilim.com.tr/Mpi/XMLGate.aspx';
  process.env.ZIRAAT_CALLBACK_URL = 'https://www.belginkuyumculuk.com/api/payment/callback/ziraat';

  const ziraat = require('../functions/payment/providers/ziraatkatilim');
  const { normalizePayForBody } = require('../functions/ziraat-callback');

  assert.strictEqual(paymentRouter.getProvider('ZIRAATKATILIM').name, 'ZIRAATKATILIM', 'Router ZIRAATKATILIM sağlayıcısını getirmelidir');
  assert.strictEqual(paymentRouter.getProvider('ZIRAAT').name, 'ZIRAATKATILIM', 'Router ZIRAAT aliasını Ziraat Katılıma yönlendirmelidir');

  // Ziraat Katılım tek işlem üst limit kontrolü (200.000 TL)
  await assert.rejects(
    async () => {
      await ziraat.createPayment({ order: { orderId: 'BLG-OVER', total: 200000.01 } });
    },
    (err) => err && err.code === 'ZIRAAT_AMOUNT_LIMIT',
    'Ziraat Katılım 200.000 TL üstü işlemlerde ZIRAAT_AMOUNT_LIMIT fırlatmalıdır'
  );

  // Ziraat Katılım 3DHost form çıktısı ve hash doğrulaması
  const zOrder = {
    orderId: 'BLG-ZIRAAT-TEST-01',
    total: 99000,
    totalAmount: 99000,
    amountInKurus: '9900000',
  };
  const zCreated = await ziraat.createPayment({ order: zOrder });
  assert.strictEqual(zCreated.success, true);
  assert.strictEqual(zCreated.provider, 'ZIRAATKATILIM');
  assert.strictEqual(zCreated.paymentType, 'FORM_POST');
  assert.strictEqual(zCreated.gatewayUrl, 'https://vpos.ziraatkatilim.com.tr/MPI/3DHost.aspx');
  assert.strictEqual(zCreated.formData.PurchAmount, '99000');
  assert.strictEqual(zCreated.formData.OrderId, zOrder.orderId);
  assert.strictEqual(zCreated.formData.OkUrl, 'https://www.belginkuyumculuk.com/api/payment/callback/ziraat');
  assert.ok(zCreated.formData.Hash, 'Hash alanı üretilmiş olmalı');
  assert.ok(!('CardNumber' in zCreated.formData), '3DHost formunda kart numarası bulunmamalıdır');
  assert.ok(!('MerchantPass' in zCreated.formData), 'MerchantPass asla tarayıcı formuna basılmamalıdır');
  console.log('  ✅ PASS: Ziraat Katılım 3DHost form parametreleri ve hash üretimi güvenli');

  // Ziraat Callback normalizePayForBody testi
  const rawZBody = { OrderId: 'BLG-NORMALIZED-123', ProcReturnCode: '00' };
  const normalizedZ = normalizePayForBody(rawZBody);
  assert.strictEqual(normalizedZ.orderId, 'BLG-NORMALIZED-123', 'normalizePayForBody OrderId alanını orderId olarak standartlaştırmalıdır');
  console.log('  ✅ PASS: Ziraat Katılım callback normalizasyonu çalışıyor');

  // ---------------------------------------------------------------------------
  // 3. VIP LİNK & /22 KISAYOLU SÖZLEŞMESİ KONTROLLERİ
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. VIP Link ve /22 Kısayolu Sözleşmesi Doğrulaması ---');
  const { VipEngine, VIP_22_CATALOG } = require('../js/vip-payment');

  // 3.1. VIP_22_CATALOG altın fiyat marjı kuralı
  assert.strictEqual(VIP_22_CATALOG.length, 1, 'VIP 22 kataloğunda yalnızca 1 ürün olmalıdır');
  assert.strictEqual(VIP_22_CATALOG[0].name, '22 Ayar Bilezik', 'Katalogdaki ürün adı kesinlikle "22 Ayar Bilezik" olmalıdır');
  assert.strictEqual(VIP_22_CATALOG[0].priceMultiplier, 1.0, 'Altın satışlarında marj kesinlikle 1.00x olmalıdır (%0 markup)');
  console.log('  ✅ PASS: VIP_22_CATALOG marjsız 1.00x ve münhasıran "22 Ayar Bilezik"tir');

  // 3.2. /22 etiket tanıma
  assert.strictEqual(VipEngine.isVip22Tag('/22'), true, '/22 tag olarak tanınmalıdır');
  assert.strictEqual(VipEngine.isVip22Tag('22'), true, '22 tag olarak tanınmalıdır');
  assert.strictEqual(VipEngine.isVip22Tag('#22'), true, '#22 tag olarak tanınmalıdır');
  assert.strictEqual(VipEngine.isVip22Tag('22 Ayar Bilezik'), true, '22 Ayar Bilezik tag olarak tanınmalıdır');
  assert.strictEqual(VipEngine.isVip22Tag('Çeyrek Altın'), false, 'Çeyrek Altın /22 tagi olamaz');
  console.log('  ✅ PASS: VipEngine /22 etiketini eksiksiz ve münhasıran tanımlıyor');

  // 3.3. Fatura ve sipariş ayrışımı: 22 Ayar Bilezik + İşçilik
  const bd = VipEngine.calculateVip22Breakdown(100000, '22 Ayar Bilezik');
  assert.strictEqual(bd.isVip22, true);
  assert.strictEqual(bd.productName, '22 Ayar Bilezik');
  assert.strictEqual(bd.items.length, 2, 'Tam olarak 2 kalem ayrışımı yapılmalıdır');
  assert.strictEqual(bd.items[0].name, '22 Ayar Bilezik', '1. kalem saf 22 Ayar Bilezik olmalıdır');
  assert.strictEqual(bd.items[0].kdvRate, 0, '1. kalem %0 KDV Özel Matrah olmalıdır');
  assert.strictEqual(bd.items[0].ozelMatrahNedeni, '351', '1. kalem Özel Matrah 351 olmalıdır');
  assert.strictEqual(bd.items[1].name, 'İşçilik', '2. kalem müstakil "İşçilik" olmalıdır');
  assert.strictEqual(bd.items[1].kdvRate, 20, '2. kalem %20 KDV olmalıdır');
  console.log('  ✅ PASS: VipEngine /22 hesaplaması 1. kalem 22 Ayar Bilezik (%0 KDV) ve 2. kalem İşçilik (%20 KDV) olarak ayrıştırıyor');

  // 3.4. Token Çift Yönlü Encode & Decode (Kuveyt Türk ve Ziraat Katılım)
  const payloadKt = {
    orderId: 'VIP-KT-1001',
    title: '22 Ayar Bilezik',
    amount: 85000,
    provider: 'KUVEYTTURK',
    isVip22: true
  };
  const tokenKt = VipEngine.encodeCompact(payloadKt);
  assert.ok(tokenKt, 'Kuveyt Türk için kompakt token üretilmeli');
  const decodedKt = VipEngine.decodeCompact(tokenKt);
  assert.strictEqual(decodedKt.orderId, payloadKt.orderId);
  assert.strictEqual(decodedKt.title, payloadKt.title);
  assert.strictEqual(decodedKt.amount, payloadKt.amount);
  assert.strictEqual(decodedKt.provider, 'KUVEYTTURK');

  const payloadZk = {
    orderId: 'VIP-ZK-2002',
    title: '22 Ayar Bilezik',
    amount: 145000,
    provider: 'ZIRAATKATILIM',
    isVip22: true
  };
  const tokenZk = VipEngine.encodeCompact(payloadZk);
  assert.ok(tokenZk, 'Ziraat Katılım için kompakt token üretilmeli');
  const decodedZk = VipEngine.decodeCompact(tokenZk);
  assert.strictEqual(decodedZk.orderId, payloadZk.orderId);
  assert.strictEqual(decodedZk.title, payloadZk.title);
  assert.strictEqual(decodedZk.amount, payloadZk.amount);
  assert.strictEqual(decodedZk.provider, 'ZIRAATKATILIM');
  console.log('  ✅ PASS: Hem Kuveyt Türk hem Ziraat Katılım kompakt token üretimi ve çözümü kayıpsız çalışıyor');

  // 3.5. Backend verifyVipToken doğrulaması
  const paymentService = require('../functions/payment/payment-service');
  const verifiedKt = paymentService.__test.verifyVipToken(tokenKt, payloadKt.orderId);
  assert.ok(verifiedKt, 'Backend Kuveyt Türk tokenını doğrulamalı');
  assert.strictEqual(verifiedKt.price, 85000);
  assert.strictEqual(verifiedKt.provider, 'KUVEYTTURK');

  const verifiedZk = paymentService.__test.verifyVipToken(tokenZk, payloadZk.orderId);
  assert.ok(verifiedZk, 'Backend Ziraat Katılım tokenını doğrulamalı');
  assert.strictEqual(verifiedZk.price, 145000);
  assert.strictEqual(verifiedZk.provider, 'ZIRAATKATILIM');
  console.log('  ✅ PASS: Backend payment-service verifyVipToken her iki banka için de tokenları onaylıyor');

  // ---------------------------------------------------------------------------
  // 4. STATİK VE ENTEGRASYON DOSYA DOĞRULAMASI
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. VIP & POS Dosya Bütünlüğü ve Sözleşme Denetimi ---');

  // vip-odeme.html
  const vipOdemeHtml = fs.readFileSync(path.join(__dirname, '../vip-odeme.html'), 'utf8');
  assert(vipOdemeHtml.includes('title: currentPayload.title'), 'vip-odeme.html title göndermeli');
  assert(vipOdemeHtml.includes('productName: currentPayload.title'), 'vip-odeme.html productName göndermeli');
  assert(vipOdemeHtml.includes('vipTitle: currentPayload.title'), 'vip-odeme.html vipTitle göndermeli');
  assert(vipOdemeHtml.includes('provider: provider'), 'vip-odeme.html seçilen providerı göndermeli');
  assert(vipOdemeHtml.includes('isVip22: is22'), 'vip-odeme.html isVip22 göndermeli');
  assert(vipOdemeHtml.includes('HTMLFormElement.prototype.submit.call(form)'), 'vip-odeme.html Ziraat form submit prototype call kullanmalı');
  console.log('  ✅ PASS: vip-odeme.html tüm banka sağlayıcıları ve ürün alanlarını eksiksiz taşıyor');

  // odeme-linki.html
  const odemeLinkiHtml = fs.readFileSync(path.join(__dirname, '../odeme-linki.html'), 'utf8');
  assert(odemeLinkiHtml.includes('value="KUVEYTTURK"'), 'odeme-linki.html Kuveyt Türk seçeneğini barındırmalı');
  assert(odemeLinkiHtml.includes('value="ZIRAATKATILIM"'), 'odeme-linki.html Ziraat Katılım seçeneğini barındırmalı');
  assert(odemeLinkiHtml.includes('apply22BilezikShortcut'), 'odeme-linki.html /22 kısayol fonksiyonunu içermeli');
  assert(odemeLinkiHtml.includes('22 Ayar Bilezik'), 'odeme-linki.html 22 Ayar Bilezik başlığını doğrudan içermeli');
  console.log('  ✅ PASS: odeme-linki.html Kuveyt Türk, Ziraat Katılım ve /22 kısayolunu tam destekliyor');

  // odeme-basarisiz.html
  const odemeBasarisizHtml = fs.readFileSync(path.join(__dirname, '../odeme-basarisiz.html'), 'utf8');
  assert(odemeBasarisizHtml.includes('retryBtn.href = `/vip-odeme.html?p=${encodeURIComponent(token)}'), 'odeme-basarisiz.html token varsa VIP linkine tekrar dönmeli');
  console.log('  ✅ PASS: odeme-basarisiz.html başarısızlık durumunda VIP linki ve tekrar dene akışını koruyor');

  // firebase.json
  const firebaseJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../firebase.json'), 'utf8'));
  const rewrites = firebaseJson.hosting.rewrites;
  const hasKtCallback = rewrites.some(r => r.source === '/api/payment/callback/kuveytturk' && r.function === 'paymentCallback');
  const hasZiraatCallback = rewrites.some(r => r.source === '/api/payment/callback/ziraat' && r.function === 'ziraatPaymentCallback');
  const hasZiraatKatilimCallback = rewrites.some(r => r.source === '/api/payment/callback/ziraatkatilim' && r.function === 'ziraatPaymentCallback');
  const hasVipRewrite = rewrites.some(r => r.source === '/vip' && r.destination === '/vip-odeme.html');
  const hasVipWildcard = rewrites.some(r => r.source === '/vip/**' && r.destination === '/vip-odeme.html');

  assert(hasKtCallback, 'firebase.json Kuveyt Türk callback rewrite barındırmalıdır');
  assert(hasZiraatCallback, 'firebase.json Ziraat callback rewrite barındırmalıdır');
  assert(hasZiraatKatilimCallback, 'firebase.json Ziraat Katılım callback rewrite barındırmalıdır');
  assert(hasVipRewrite && hasVipWildcard, 'firebase.json /vip ve /vip/** rewritelarını barındırmalıdır');
  console.log('  ✅ PASS: firebase.json tüm POS callback ve VIP link rewritelarını eksiksiz içeriyor');

  console.log('\n======================================================');
  console.log('🎉 TÜM KUVEYT TÜRK, ZİRAAT KATILIM VE VIP LİNK TESTLERİ BAŞARIYLA GEÇTİ!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TESTLER BAŞARISIZ OLDU:', err);
  process.exit(1);
});
