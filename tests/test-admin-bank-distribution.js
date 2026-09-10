const assert = require('assert');

const normalizeBankKey = (raw) => {
  if (!raw) return 'KUVEYTTURK';
  const s = String(raw).toUpperCase().replace(/[^A-Z0-9ĞÜŞİÖÇ_]/g, ' ').trim();
  if (s.includes('KUVEYT') || s.includes('KT')) return 'KUVEYTTURK';
  if (s.includes('AKBANK')) return 'AKBANK';
  if (s.includes('ZIRAAT') || s.includes('ZİRAAT')) return 'ZIRAAT';
  if (s.includes('VAKIF') || s.includes('VAKIFBANK')) return 'VAKIFBANK';
  if (s.includes('YAPI') || s.includes('YKB')) return 'YAPIKREDI';
  if (s.includes('GARANTI') || s.includes('GARANTİ')) return 'GARANTI';
  if (s.includes('İŞ') || s.includes('ISBANK') || s.includes('IS BANK')) return 'ISBANK';
  if (s.includes('HALK')) return 'HALKBANK';
  if (s.includes('DENIZ') || s.includes('DENİZ')) return 'DENIZBANK';
  if (s.includes('QNB') || s.includes('FINANS')) return 'QNB';
  if (s.includes('TEB')) return 'TEB';
  if (s.includes('TOSLA')) return 'TOSLA';
  if (s.includes('PAYTR')) return 'PAYTR';
  return s.replace(/\s+/g, '_');
};

console.log('=== TEST 1: Bank Normalization & Arbitrary New Banks ===');
assert.strictEqual(normalizeBankKey('Kuveyt Türk Katılım Bankası'), 'KUVEYTTURK');
assert.strictEqual(normalizeBankKey('KT'), 'KUVEYTTURK');
assert.strictEqual(normalizeBankKey('Akbank T.A.Ş.'), 'AKBANK');
assert.strictEqual(normalizeBankKey('T.C. Ziraat Bankası A.Ş.'), 'ZIRAAT');
assert.strictEqual(normalizeBankKey('VakıfBank'), 'VAKIFBANK');
assert.strictEqual(normalizeBankKey('Yapı Kredi'), 'YAPIKREDI');
assert.strictEqual(normalizeBankKey('Garanti BBVA'), 'GARANTI');
assert.strictEqual(normalizeBankKey('Türkiye İş Bankası'), 'ISBANK');
assert.strictEqual(normalizeBankKey('Halkbank'), 'HALKBANK');
assert.strictEqual(normalizeBankKey('DenizBank'), 'DENIZBANK');
assert.strictEqual(normalizeBankKey('QNB Finansbank'), 'QNB');
assert.strictEqual(normalizeBankKey('Türk Ekonomi Bankası TEB'), 'TEB');
assert.strictEqual(normalizeBankKey('Enpara'), 'ENPARA');
assert.strictEqual(normalizeBankKey('Albaraka Türk'), 'ALBARAKA_TÜRK');
assert.strictEqual(normalizeBankKey('Fibabanka'), 'FIBABANKA');
assert.strictEqual(normalizeBankKey('Odeabank'), 'ODEABANK');
console.log('✅ PASS: Bank Normalization & Arbitrary Bank Support Verified');

console.log('\n=== TEST 2: Aggregation & Split (POS vs Havale) ===');
const mockOrders = [
  { orderId: 'BLG-1', totalAmount: 1674500, isPaid: true, paymentStatus: 'PAID', provider: 'KUVEYTTURK', paymentMethod: 'KREDI_KARTI' },
  { orderId: 'BLG-2', totalAmount: 860000, isPaid: true, paymentStatus: 'PAID', provider: 'TOSLA_ISIM', paymentMethod: 'KREDI_KARTI' },
  { orderId: 'BLG-3', totalAmount: 1346600, isPaid: true, paymentStatus: 'PAID', provider: 'AKBANK', paymentMethod: 'KREDI_KARTI' },
  { orderId: 'BLG-EFT-1', totalAmount: 500000, isPaid: true, paymentStatus: 'PAID', isManualEft: true, bankName: 'Kuveyt Türk' },
  { orderId: 'BLG-EFT-2', totalAmount: 350000, isPaid: true, paymentStatus: 'PAID', isManualEft: true, bankName: 'Akbank' },
  { orderId: 'BLG-EFT-3', totalAmount: 250000, isPaid: true, paymentStatus: 'PAID', isManualEft: true, bankName: 'Ziraat Bankası' },
  { orderId: 'BLG-EFT-4', totalAmount: 150000, isPaid: true, paymentStatus: 'PAID', isManualEft: true, bankName: 'Enpara.com' }
];

let totalVolume = 0;
let posVolume = 0;
let havaleVolume = 0;
const providerBreakdown = {};
const bankTransferBreakdown = {};

mockOrders.forEach(o => {
  const isHavale = Boolean(o.isManualEft || o.paymentMethod === 'HAVALE_EFT' || o.paymentMethod === 'HAVALE' || o.paymentMethod === 'EFT' || String(o.orderId || '').startsWith('BLG-EFT-'));
  if (o.isPaid && o.paymentStatus === 'PAID') {
    totalVolume += o.totalAmount;
    if (isHavale) {
      havaleVolume += o.totalAmount;
      const bKey = normalizeBankKey(o.bankName);
      if (!bankTransferBreakdown[bKey]) bankTransferBreakdown[bKey] = { count: 0, sum: 0 };
      bankTransferBreakdown[bKey].count++;
      bankTransferBreakdown[bKey].sum += o.totalAmount;
    } else {
      posVolume += o.totalAmount;
      const prov = (o.provider || 'KUVEYTTURK').toUpperCase();
      if (!providerBreakdown[prov]) providerBreakdown[prov] = { count: 0, sum: 0 };
      providerBreakdown[prov].count++;
      providerBreakdown[prov].sum += o.totalAmount;
    }
  }
});

assert.strictEqual(totalVolume, 5131100);
assert.strictEqual(posVolume, 3881100);
assert.strictEqual(havaleVolume, 1250000);
assert.strictEqual(posVolume + havaleVolume, totalVolume);

assert.strictEqual(bankTransferBreakdown['KUVEYTTURK'].sum, 500000);
assert.strictEqual(bankTransferBreakdown['AKBANK'].sum, 350000);
assert.strictEqual(bankTransferBreakdown['ZIRAAT'].sum, 250000);
assert.strictEqual(bankTransferBreakdown['ENPARA_COM'].sum, 150000);
console.log('✅ PASS: Aggregation split and volume balance verified');

console.log('\n=== TEST 3: Output lines formatting ===');
const bankEntries = Object.entries(bankTransferBreakdown).sort((a, b) => b[1].sum - a[1].sum);
const lines = bankEntries.map(([k, v]) => `${k}: ₺${Number(v.sum).toLocaleString('tr-TR')}`);
assert.deepStrictEqual(lines, [
  'KUVEYTTURK: ₺500.000',
  'AKBANK: ₺350.000',
  'ZIRAAT: ₺250.000',
  'ENPARA_COM: ₺150.000'
]);
console.log('Formatted lines:\n  ' + lines.join('\n  '));
console.log('✅ PASS: Render formatting verified identical to POS card visual design');
console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
