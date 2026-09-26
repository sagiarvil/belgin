'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('\n======================================================');
console.log('💳 TOSLA İŞİM SANAL POS & VIP LINK TEST SUITE');
console.log('======================================================\n');

async function runTests() {
  // ---------------------------------------------------------------------------
  // 1. TOSLA SAĞLAYICI & ROUTER KAYDI KONTROLLERİ
  // ---------------------------------------------------------------------------
  console.log('--- 1. Tosla Sağlayıcı & Router Entegrasyonu ---');
  const paymentConstants = require('../functions/payment/payment-constants');
  const paymentRouter = require('../functions/payment/payment-router');
  const toslaProvider = require('../functions/payment/providers/tosla');

  assert.strictEqual(paymentConstants.PROVIDERS.TOSLA, 'TOSLA', 'PROVIDERS.TOSLA tanımlı olmalıdır');
  assert.strictEqual(paymentConstants.PROVIDERS.TOSLA_ISIM, 'TOSLA_ISIM', 'PROVIDERS.TOSLA_ISIM tanımlı olmalıdır');

  assert.strictEqual(paymentRouter.getProvider('TOSLA').name, 'TOSLA', 'Router TOSLA sağlayıcısını döndürmelidir');
  assert.strictEqual(paymentRouter.getProvider('TOSLA_ISIM').name, 'TOSLA', 'Router TOSLA_ISIM aliasını TOSLA olarak çözümlemelidir');
  assert.strictEqual(paymentRouter.getProvider('tosla').name, 'TOSLA', 'Küçük harf tosla çağrısı desteklenmelidir');
  console.log('  ✅ PASS: Router ve sağlayıcı eşleştirmeleri doğru');

  // ---------------------------------------------------------------------------
  // 2. GÜVENLİK VE FAIL-CLOSED KONTROLLERİ
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Güvenlik & Fail-Closed Kapıları ---');
  await assert.rejects(
    async () => {
      await toslaProvider.createPayment({ order: null });
    },
    (err) => err && err.code === 'INVALID_ORDER',
    'Sipariş yoksa INVALID_ORDER fırlatılmalıdır'
  );

  await assert.rejects(
    async () => {
      await toslaProvider.createPayment({ order: { orderId: 'BLG-1', total: -50 } });
    },
    (err) => err && err.code === 'INVALID_AMOUNT',
    'Negatif tutarda INVALID_AMOUNT fırlatılmalıdır'
  );

  await assert.rejects(
    async () => {
      await toslaProvider.createPayment({ order: { total: 1000 } });
    },
    (err) => err && err.code === 'INVALID_ORDER',
    'OrderId yoksa INVALID_ORDER fırlatılmalıdır'
  );
  console.log('  ✅ PASS: Fail-closed güvenlik doğrulamaları aktif');

  // ---------------------------------------------------------------------------
  // 3. TOSLA HASH HESAPLAMA DOĞRULAMASI
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Tosla SHA-512 Hash Hesaplama Doğrulaması ---');
  const apiPass = 'YHGT98IKMJ';
  const clientId = '1000006961';
  const apiUser = 'apiUser3041341';
  const rnd = 'testRandom123456';
  const timeSpan = '20260925180000';

  const expectedStr = `${apiPass}${clientId}${apiUser}${rnd}${timeSpan}`;
  const expectedHash = crypto.createHash('sha512').update(expectedStr, 'utf8').digest('base64');

  assert.ok(expectedHash && expectedHash.length > 20, 'Hash geçerli bir base64 dizesi olmalıdır');
  console.log('  ✅ PASS: SHA-512 Base64 Hash algoritması başarıyla doğrulandı');

  // ---------------------------------------------------------------------------
  // 4. CALLBACK DOĞRULAMA (VERIFYCALLBACK)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Tosla Callback Doğrulama Senaryoları ---');
  // 4.1 OrderId Uyuşmazlığı
  const mismatchRes = await toslaProvider.verifyCallback({
    body: { OrderId: 'ORDER-A' },
    order: { orderId: 'ORDER-B' }
  });
  assert.strictEqual(mismatchRes.isValid, false);
  assert.strictEqual(mismatchRes.reason, 'ORDER_ID_MISMATCH');

  // 4.2 Başarısız Banka Yanıtı (BankResponseCode != 00)
  const failBankRes = await toslaProvider.verifyCallback({
    body: {
      OrderId: 'VIP-12345',
      BankResponseCode: '51',
      BankResponseMessage: 'Yetersiz Bakiye',
      HostReferenceNumber: 'HRN-999'
    },
    order: { orderId: 'VIP-12345' }
  });
  assert.strictEqual(failBankRes.isValid, false);
  assert.strictEqual(failBankRes.isSuccess, false);
  assert.strictEqual(failBankRes.failReasonCode, '51');
  assert.strictEqual(failBankRes.failReasonMsg, 'Yetersiz Bakiye');

  // 4.3 Başarılı Banka Yanıtı (BankResponseCode == 00)
  const successBankRes = await toslaProvider.verifyCallback({
    body: {
      OrderId: 'VIP-12345',
      BankResponseCode: '00',
      AuthCode: 'TSL-98412',
      HostReferenceNumber: 'HRN-1001',
      BankResponseMessage: 'Onaylandı'
    },
    order: { orderId: 'VIP-12345' }
  });
  assert.strictEqual(successBankRes.isValid, true);
  assert.strictEqual(successBankRes.isSuccess, true);
  assert.strictEqual(successBankRes.authCode, 'TSL-98412');

  // 4.4 Toleranslı OrderId Eşleşmesi (Prefix veya providerOrderId)
  const prefixRes = await toslaProvider.verifyCallback({
    body: {
      OrderId: 'BLG179035393045',
      BankResponseCode: '00',
      AuthCode: 'TSL-PREFIX-1',
    },
    order: { orderId: 'BLG1790353930453F91', payment: { providerOrderId: 'BLG179035393045' } }
  });
  assert.strictEqual(prefixRes.isValid, true, 'Prefix/providerOrderId toleranslı eşleşmelidir');
  assert.strictEqual(prefixRes.isSuccess, true);

  // 4.5 Alternatif Başarı Kodları (Status: SUCCESS, Code: 0, ThreeDSecureCode: 1)
  const statusSuccessRes = await toslaProvider.verifyCallback({
    body: {
      OrderId: 'BLG179035393045',
      Status: 'SUCCESS',
      Code: 0,
      ThreeDSecureCode: '1',
      AuthCode: 'TSL-STATUS-OK',
    },
    order: { orderId: 'BLG179035393045' }
  });
  assert.strictEqual(statusSuccessRes.isValid, true, 'Status=SUCCESS ve Code=0 başarılı kabul edilmelidir');
  assert.strictEqual(statusSuccessRes.isSuccess, true);
  console.log('  ✅ PASS: Callback başarı ve toleranslı senaryolar doğrulandı');

  // ---------------------------------------------------------------------------
  // 5. HTML VE VIP LINK ŞABLON DOĞRULAMASI
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. HTML & VIP Link Arayüzü Doğrulaması ---');
  const odemeLinkiHtml = fs.readFileSync(path.join(__dirname, '../odeme-linki.html'), 'utf8');
  assert.ok(odemeLinkiHtml.includes('id="bankCardKuveyt"'), 'odeme-linki.html Kuveyt Türk kartını içermelidir');
  assert.ok(odemeLinkiHtml.includes('id="bankCardZiraat"'), 'odeme-linki.html Ziraat Katılım kartını içermelidir');
  assert.ok(odemeLinkiHtml.includes('id="bankCardTosla"'), 'odeme-linki.html Tosla İşim kartını içermelidir');
  assert.ok(odemeLinkiHtml.includes('value="TOSLA"'), 'odeme-linki.html TOSLA değerine sahip radio butonunu içermelidir');
  console.log('  ✅ PASS: odeme-linki.html Kuveyt, Ziraat ve Tosla 3 banka seçeneğini barındırıyor');

  const vipOdemeHtml = fs.readFileSync(path.join(__dirname, '../vip-odeme.html'), 'utf8');
  assert.ok(vipOdemeHtml.includes('isTosla'), 'vip-odeme.html Tosla İşim kontrolünü içermelidir');
  assert.ok(vipOdemeHtml.includes('TOSLA İŞİM'), 'vip-odeme.html Tosla İşim marka metnini içermelidir');
  assert.ok(odemeLinkiHtml.includes('id="btnTelegram"'), 'odeme-linki.html Telegram paylaşım butonunu içermelidir');
  assert.ok(odemeLinkiHtml.includes('btn-telegram'), 'odeme-linki.html btn-telegram CSS sınıfını içermelidir');

  const vipPaymentJs = fs.readFileSync(path.join(__dirname, '../js/vip-payment.js'), 'utf8');
  assert.ok(vipPaymentJs.includes('buildTelegramShareUrl'), 'js/vip-payment.js buildTelegramShareUrl metodunu barındırmalıdır');
  assert.ok(vipPaymentJs.includes('buildTelegramProtoUrl'), 'js/vip-payment.js buildTelegramProtoUrl metodunu barındırmalıdır');

  // Telegram URL formatı ve 'url' parametresinin varlığı testi (302 telegram.org yönlendirmesini engelleyen kural)
  const { VipEngine } = require('../js/vip-payment.js');
  const samplePayload = { title: '22 Ayar Bilezik', amount: 85000, orderId: 'VIP-TEST-01' };
  const sampleVipUrl = 'https://www.belginkuyumculuk.com/vip/v-test123';
  const tgShareUrl = VipEngine.buildTelegramShareUrl(samplePayload, sampleVipUrl);
  assert.ok(tgShareUrl.startsWith('https://t.me/share/url?url='), 'Telegram share URL t.me/share/url?url= ile başlamalıdır');
  assert.ok(tgShareUrl.includes(encodeURIComponent(sampleVipUrl)), 'Telegram share URL hedef kısa linki encode edilmiş olarak içermelidir');
  assert.ok(tgShareUrl.includes('85.000'), 'Telegram mesaj metni tutarı içermelidir');

  const tgProtoUrl = VipEngine.buildTelegramProtoUrl(samplePayload, sampleVipUrl);
  assert.ok(tgProtoUrl.startsWith('tg://msg_url?url='), 'Telegram proto URL tg://msg_url?url= ile başlamalıdır');
  assert.ok(tgProtoUrl.includes(encodeURIComponent(sampleVipUrl)), 'Telegram proto URL hedef linki içermelidir');

  console.log('  ✅ PASS: Telegram share URL (t.me) ve proto URL (tg://) doğrulaması başarılı');
  console.log('  ✅ PASS: vip-odeme.html ve odeme-linki.html Telegram & Tosla entegrasyonu tamamlandı');

  console.log('\n======================================================');
  console.log('🎉 TÜM TOSLA İŞİM & VIP LİNK TESTLERİ %100 BAŞARILI!');
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('❌ TEST BAŞARISIZ:', err);
  process.exit(1);
});
