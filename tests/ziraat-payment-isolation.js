'use strict';

const assert = require('assert');

process.env.ZIRAAT_MBR_ID = '12';
process.env.ZIRAAT_MERCHANT_ID = '9814992';
process.env.ZIRAAT_API_USER = 'test-api-user';
process.env.ZIRAAT_API_PASSWORD = 'test-api-password-not-production';
process.env.ZIRAAT_MERCHANT_PASS = 'test-3d-secret-not-production';
process.env.ZIRAAT_3DHOST_URL = 'https://vpos.ziraatkatilim.com.tr/MPI/3DHost.aspx';
process.env.ZIRAAT_CALLBACK_URL = 'https://example.test/ziraat-callback';

const constants = require('../functions/payment/payment-constants');
const router = require('../functions/payment/payment-router');
const ziraat = require('../functions/payment/providers/ziraatkatilim');

async function main() {
  // Regression lock: Kuveyt Türk stays the canonical/default path.
  assert.strictEqual(constants.DEFAULT_PROVIDER, constants.PROVIDERS.KUVEYTTURK);
  assert.strictEqual(router.getProvider().name, constants.PROVIDERS.KUVEYTTURK);
  assert.strictEqual(router.getProvider('KUVEYTTURK').name, constants.PROVIDERS.KUVEYTTURK);

  // Ziraat exists only as an explicit opt-in provider.
  assert.strictEqual(router.getProvider('ZIRAATKATILIM').name, constants.PROVIDERS.ZIRAATKATILIM);

  const order = {
    orderId: 'BLG-TEST-ZIRAAT-0001',
    total: 200000,
    totalAmount: 200000,
    amountInKurus: '20000000',
  };

  const created = await ziraat.createPayment({ order });
  assert.strictEqual(created.provider, 'ZIRAATKATILIM');
  assert.strictEqual(created.paymentType, 'FORM_POST');
  assert.strictEqual(created.gatewayUrl, 'https://vpos.ziraatkatilim.com.tr/MPI/3DHost.aspx');
  assert.strictEqual(created.formData.SecureType, '3DHost');
  assert.strictEqual(created.formData.TxnType, 'Auth');
  assert.strictEqual(created.formData.Currency, '949');
  assert.strictEqual(created.formData.OrderId, order.orderId);
  assert.strictEqual(created.formData.PurchAmount, '200000.00');

  // 3DHost boundary: Belgin must not send PAN/CVV/expiry to the bank-hosted form.
  for (const prohibited of ['Pan', 'CardNumber', 'Cvv2', 'CVV', 'Expiry', 'CardExpiry', 'MerchantPass']) {
    assert.ok(!(prohibited in created.formData), `3DHost form leaked prohibited field: ${prohibited}`);
  }

  const expectedRequestHash = ziraat.__test.sha1Base64Ascii([
    '12',
    order.orderId,
    '200000.00',
    'https://example.test/ziraat-callback',
    'https://example.test/ziraat-callback',
    'Auth',
    '0',
    created.formData.Rnd,
    'test-3d-secret-not-production',
  ].join(''));
  assert.strictEqual(created.formData.Hash, expectedRequestHash);

  const authCode = 'AUTH123';
  const procReturnCode = '00';
  const responseRnd = 'RND-RESPONSE-1';
  const responseHash = ziraat.__test.sha1Base64Ascii(
    `9814992test-3d-secret-not-production${order.orderId}${authCode}${procReturnCode}${responseRnd}`
  );

  const verified = await ziraat.verifyCallback({
    order,
    body: {
      OrderId: order.orderId,
      AuthCode: authCode,
      ProcReturnCode: procReturnCode,
      ResponseRnd: responseRnd,
      ResponseHash: responseHash,
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(verified.isValid, true);
  assert.strictEqual(verified.isSuccess, true);
  assert.strictEqual(verified.orderId, order.orderId);
  assert.strictEqual(verified.totalAmountReceived, '20000000');

  const tampered = await ziraat.verifyCallback({
    order,
    body: {
      OrderId: order.orderId,
      AuthCode: authCode,
      ProcReturnCode: procReturnCode,
      ResponseRnd: responseRnd,
      ResponseHash: 'tampered',
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(tampered.isValid, false);
  assert.strictEqual(tampered.reason, 'RESPONSE_HASH_MISMATCH');

  await assert.rejects(
    () => ziraat.createPayment({ order: { ...order, orderId: 'BLG-TEST-ZIRAAT-OVER', total: 200000.01 } }),
    (error) => error && error.code === 'ZIRAAT_AMOUNT_LIMIT'
  );

  console.log('ZIRAAT_PAYMENT_ISOLATION=PASS');
}

main().catch((error) => {
  console.error('ZIRAAT_PAYMENT_ISOLATION=FAIL');
  console.error(error);
  process.exit(1);
});
