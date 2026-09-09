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

  // PayFor natural amount representation.
  assert.strictEqual(ziraat.__test.formatPayForAmount(200000), '200000');
  assert.strictEqual(ziraat.__test.formatPayForAmount(199.90), '199.9');
  assert.strictEqual(ziraat.__test.formatPayForAmount(0.01), '0.01');

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
  assert.strictEqual(created.formData.PurchAmount, '200000');

  // 3DHost boundary: Belgin must not send card data or MerchantPass to the hosted page.
  for (const prohibited of ['Pan', 'CardNumber', 'Cvv2', 'CVV', 'Expiry', 'CardExpiry', 'MerchantPass']) {
    assert.ok(!(prohibited in created.formData), `3DHost form leaked prohibited field: ${prohibited}`);
  }

  // The legacy PayFor 3DHost contract uses the API-role password in the posted form.
  assert.strictEqual(created.formData.UserCode, 'test-api-user');
  assert.strictEqual(created.formData.UserPass, 'test-api-password-not-production');

  const expectedRequestHash = ziraat.__test.sha1Base64Ascii([
    '12',
    order.orderId,
    '200000',
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
  const threeDStatus = '1';

  // Current/extended PayFor response hash.
  const extendedResponseHash = ziraat.__test.sha1Base64Ascii(
    `9814992test-3d-secret-not-production${order.orderId}${authCode}${procReturnCode}${threeDStatus}${responseRnd}test-api-user`
  );

  const verifiedExtended = await ziraat.verifyCallback({
    order,
    body: {
      OrderId: order.orderId,
      AuthCode: authCode,
      ProcReturnCode: procReturnCode,
      '3DStatus': threeDStatus,
      ResponseRnd: responseRnd,
      ResponseHash: extendedResponseHash,
      PurchAmount: '200000',
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(verifiedExtended.isValid, true);
  assert.strictEqual(verifiedExtended.isSuccess, true);
  assert.strictEqual(verifiedExtended.orderId, order.orderId);
  assert.strictEqual(verifiedExtended.totalAmountReceived, '20000000');
  assert.strictEqual(verifiedExtended.rawPaymentDetails.responseHashVariant, 'EXTENDED');
  assert.strictEqual(verifiedExtended.rawPaymentDetails.amountSource, 'BANK_CALLBACK');

  // Legacy Ziraat/PayFor response hash remains accepted, but only on exact cryptographic match.
  const legacyResponseHash = ziraat.__test.sha1Base64Ascii(
    `9814992test-3d-secret-not-production${order.orderId}${authCode}${procReturnCode}${responseRnd}`
  );

  const verifiedLegacy = await ziraat.verifyCallback({
    order,
    body: {
      OrderId: order.orderId,
      AuthCode: authCode,
      ProcReturnCode: procReturnCode,
      ResponseRnd: responseRnd,
      ResponseHash: legacyResponseHash,
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(verifiedLegacy.isValid, true);
  assert.strictEqual(verifiedLegacy.isSuccess, true);
  assert.strictEqual(verifiedLegacy.rawPaymentDetails.responseHashVariant, 'LEGACY');
  assert.strictEqual(verifiedLegacy.rawPaymentDetails.amountSource, 'IMMUTABLE_ORDER');

  // Valid hash but failed 3D authentication must never be marked paid.
  const failed3dStatus = '0';
  const failed3dHash = ziraat.__test.sha1Base64Ascii(
    `9814992test-3d-secret-not-production${order.orderId}${authCode}${procReturnCode}${failed3dStatus}${responseRnd}test-api-user`
  );
  const failed3d = await ziraat.verifyCallback({
    order,
    body: {
      OrderId: order.orderId,
      AuthCode: authCode,
      ProcReturnCode: procReturnCode,
      '3DStatus': failed3dStatus,
      ResponseRnd: responseRnd,
      ResponseHash: failed3dHash,
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(failed3d.isValid, true);
  assert.strictEqual(failed3d.isSuccess, false);

  // Amount mismatch must fail closed when the bank returns an amount.
  const amountMismatch = await ziraat.verifyCallback({
    order,
    body: {
      OrderId: order.orderId,
      AuthCode: authCode,
      ProcReturnCode: procReturnCode,
      '3DStatus': threeDStatus,
      ResponseRnd: responseRnd,
      ResponseHash: extendedResponseHash,
      PurchAmount: '199999.99',
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(amountMismatch.isValid, false);
  assert.strictEqual(amountMismatch.reason, 'CALLBACK_AMOUNT_MISMATCH');

  const tampered = await ziraat.verifyCallback({
    order,
    body: {
      OrderId: order.orderId,
      AuthCode: authCode,
      ProcReturnCode: procReturnCode,
      '3DStatus': threeDStatus,
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
