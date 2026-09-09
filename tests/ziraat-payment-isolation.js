'use strict';

const assert = require('assert');

process.env.ZIRAAT_MBR_ID = '12';
process.env.ZIRAAT_MERCHANT_ID = '9814992';
process.env.ZIRAAT_API_USER = 'test-api-user';
process.env.ZIRAAT_API_PASSWORD = 'test-api-password-not-production';
process.env.ZIRAAT_MERCHANT_PASS = 'test-3d-secret-not-production';
process.env.ZIRAAT_3DHOST_URL = 'https://vpos.ziraatkatilim.com.tr/MPI/3DHost.aspx';
process.env.ZIRAAT_PAYMENT_API = 'https://vpos.ziraatkatilim.com.tr/Mpi/XMLGate.aspx';
process.env.ZIRAAT_CALLBACK_URL = 'https://example.test/ziraat-callback';

const constants = require('../functions/payment/payment-constants');
const router = require('../functions/payment/payment-router');
const ziraat = require('../functions/payment/providers/ziraatkatilim');

function approvedInquiryXml(orderId, amount = '200000', extra = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PayforResponse>
  <ProcReturnCode>00</ProcReturnCode>
  <OrderId>${orderId}</OrderId>
  <OrgOrderId>${orderId}</OrgOrderId>
  <TxnType>Auth</TxnType>
  <PurchAmount>${amount}</PurchAmount>
  <AuthCode>BANK-AUTH-123</AuthCode>
  <HostRefNum>HOST-REF-456</HostRefNum>
  <CardMask>415565******6111</CardMask>
  <RefundedAmount>0</RefundedAmount>
  <IsRefunded>false</IsRefunded>
  <IsVoided>false</IsVoided>
  ${extra}
</PayforResponse>`;
}

function mockHttp(responses) {
  const calls = [];
  return {
    calls,
    async post(url, body, options) {
      calls.push({ url, body, options });
      if (responses.length === 0) throw new Error('Unexpected HTTP call');
      const next = responses.shift();
      if (next instanceof Error) throw next;
      if (typeof next === 'function') return next({ url, body, options, calls });
      return { status: 200, data: next };
    },
  };
}

async function main() {
  assert.strictEqual(constants.DEFAULT_PROVIDER, constants.PROVIDERS.KUVEYTTURK);
  assert.strictEqual(router.getProvider().name, constants.PROVIDERS.KUVEYTTURK);
  assert.strictEqual(router.getProvider('KUVEYTTURK').name, constants.PROVIDERS.KUVEYTTURK);
  assert.strictEqual(router.getProvider('ZIRAATKATILIM').name, constants.PROVIDERS.ZIRAATKATILIM);

  assert.strictEqual(ziraat.__test.formatPayForAmount(200000), '200000');
  assert.strictEqual(ziraat.__test.formatPayForAmount(199.90), '199.9');
  assert.strictEqual(ziraat.__test.formatPayForAmount(0.01), '0.01');
  assert.strictEqual(ziraat.__test.amountToKurus('199.9'), '19990');
  assert.strictEqual(
    ziraat.__test.validatePaymentApiUrl('https://vpos.ziraatkatilim.com.tr/Mpi/XMLGate.aspx'),
    'https://vpos.ziraatkatilim.com.tr/Mpi/XMLGate.aspx'
  );
  assert.throws(
    () => ziraat.__test.validatePaymentApiUrl('https://attacker.example/XMLGate.aspx'),
    (error) => error && error.code === 'PROVIDER_NOT_CONFIGURED'
  );

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

  for (const prohibited of ['Pan', 'CardNumber', 'Cvv2', 'CVV', 'Expiry', 'CardExpiry', 'MerchantPass']) {
    assert.ok(!(prohibited in created.formData), `3DHost form leaked prohibited field: ${prohibited}`);
  }

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

  // ResponseHash is deliberately wrong. Bank OrderInquiry is authoritative and must still confirm PAID.
  const tamperedHashHttp = mockHttp([approvedInquiryXml(order.orderId)]);
  const verifiedTamperedHash = await ziraat.verifyCallback({
    order,
    httpClient: tamperedHashHttp,
    body: {
      OrderId: order.orderId,
      AuthCode: 'CALLBACK-AUTH',
      ProcReturnCode: '00',
      '3DStatus': '1',
      ResponseRnd: 'CALLBACK-RND',
      ResponseHash: 'tampered',
      PurchAmount: '1',
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(verifiedTamperedHash.isValid, true);
  assert.strictEqual(verifiedTamperedHash.isSuccess, true);
  assert.strictEqual(verifiedTamperedHash.totalAmountReceived, '20000000');
  assert.strictEqual(verifiedTamperedHash.rawPaymentDetails.responseHashVerified, false);
  assert.strictEqual(verifiedTamperedHash.rawPaymentDetails.bankInquiryConfirmed, true);
  assert.strictEqual(verifiedTamperedHash.rawPaymentDetails.amountSource, 'BANK_ORDER_INQUIRY');
  assert.strictEqual(verifiedTamperedHash.bankInquiry.confirmed, true);
  assert.ok(tamperedHashHttp.calls[0].body.includes(`<OrgOrderId>${order.orderId}</OrgOrderId>`));
  assert.ok(!tamperedHashHttp.calls[0].body.includes('test-3d-secret-not-production'));

  // Exact valid callback hash remains telemetry only.
  const threeDStatus = '1';
  const responseRnd = 'RND-RESPONSE-1';
  const validHash = ziraat.__test.sha1Base64Ascii(
    `9814992test-3d-secret-not-production${order.orderId}CALLBACK-AUTH00${threeDStatus}${responseRnd}test-api-user`
  );
  const validHashHttp = mockHttp([approvedInquiryXml(order.orderId)]);
  const verifiedValidHash = await ziraat.verifyCallback({
    order,
    httpClient: validHashHttp,
    body: {
      OrderId: order.orderId,
      AuthCode: 'CALLBACK-AUTH',
      ProcReturnCode: '00',
      '3DStatus': threeDStatus,
      ResponseRnd: responseRnd,
      ResponseHash: validHash,
      TxnResult: 'Success',
    },
  });
  assert.strictEqual(verifiedValidHash.isSuccess, true);
  assert.strictEqual(verifiedValidHash.rawPaymentDetails.responseHashVerified, true);
  assert.strictEqual(verifiedValidHash.rawPaymentDetails.responseHashVariant, 'EXTENDED');

  // If the current public implementation request shape is rejected, retry the legacy guide shape once.
  const fallbackHttp = mockHttp([
    '<PayforResponse><ProcReturnCode>V001</ProcReturnCode><ErrMsg>Siparis bulunamadi</ErrMsg></PayforResponse>',
    approvedInquiryXml(order.orderId),
  ]);
  const fallback = await ziraat.verifyCallback({
    order,
    httpClient: fallbackHttp,
    body: { OrderId: order.orderId, ProcReturnCode: '00', TxnResult: 'Success' },
  });
  assert.strictEqual(fallback.isSuccess, true);
  assert.strictEqual(fallback.bankInquiry.mode, 'LEGACY');
  assert.strictEqual(fallbackHttp.calls.length, 2);
  assert.ok(fallbackHttp.calls[1].body.includes(`<OrderId>${order.orderId}</OrderId>`));
  assert.ok(fallbackHttp.calls[1].body.includes('<Currency>949</Currency>'));

  // Bank amount mismatch can never mark PAID.
  const amountMismatchHttp = mockHttp([
    approvedInquiryXml(order.orderId, '199999.99'),
    approvedInquiryXml(order.orderId, '199999.99'),
  ]);
  const amountMismatch = await ziraat.verifyCallback({
    order,
    httpClient: amountMismatchHttp,
    body: { OrderId: order.orderId, ProcReturnCode: '00', TxnResult: 'Success' },
  });
  assert.strictEqual(amountMismatch.isValid, false);
  assert.strictEqual(amountMismatch.isSuccess, false);
  assert.strictEqual(amountMismatch.reason, 'BANK_INQUIRY_AMOUNT_MISMATCH');
  assert.strictEqual(amountMismatch.bankInquiry.confirmed, false);

  // Bank order mismatch can never mark PAID.
  const orderMismatchHttp = mockHttp([
    approvedInquiryXml('BLG-OTHER-ORDER'),
    approvedInquiryXml('BLG-OTHER-ORDER'),
  ]);
  const orderMismatch = await ziraat.verifyCallback({
    order,
    httpClient: orderMismatchHttp,
    body: { OrderId: order.orderId, ProcReturnCode: '00', TxnResult: 'Success' },
  });
  assert.strictEqual(orderMismatch.isValid, false);
  assert.strictEqual(orderMismatch.reason, 'BANK_INQUIRY_ORDER_MISMATCH');

  // Network timeout must fail closed and leave the order unconfirmed.
  const timeout1 = new Error('timeout');
  timeout1.code = 'ECONNABORTED';
  const timeout2 = new Error('timeout');
  timeout2.code = 'ECONNABORTED';
  const timeoutHttp = mockHttp([timeout1, timeout2]);
  const timedOut = await ziraat.verifyCallback({
    order,
    httpClient: timeoutHttp,
    body: { OrderId: order.orderId, ProcReturnCode: '00', TxnResult: 'Success' },
  });
  assert.strictEqual(timedOut.isValid, false);
  assert.strictEqual(timedOut.reason, 'BANK_INQUIRY_TIMEOUT');

  // A forged callback for a different order is rejected before any bank request.
  const shouldNotCall = mockHttp([]);
  const forgedOrder = await ziraat.verifyCallback({
    order,
    httpClient: shouldNotCall,
    body: { OrderId: 'BLG-FORGED', ProcReturnCode: '00', TxnResult: 'Success' },
  });
  assert.strictEqual(forgedOrder.isValid, false);
  assert.strictEqual(forgedOrder.reason, 'ORDER_ID_MISMATCH');
  assert.strictEqual(shouldNotCall.calls.length, 0);

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
