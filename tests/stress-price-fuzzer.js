// ============================================================================
// BELGIN KUYUMCULUK — STRESS TESTING, REVERSE ENGINEERING & FINANCIAL GUARD
// ============================================================================

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const { PRODUCTS } = require(path.join(ROOT_DIR, 'js/data.js'));
const paymentCatalog = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'functions/product-catalog.json'), 'utf8'));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS]: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL]: ${message}`);
  }
}

console.log('====================================================================');
console.log('🔬 BELGIN KUYUMCULUK ENTERPRISE STRESS TESTING & FUZZER ENGINE');
console.log('====================================================================\n');

// ----------------------------------------------------------------------------
// SUITE 1: RATE PARSER & CIRCUIT BREAKER FUZZING
// ----------------------------------------------------------------------------
console.log('--- 1. RATE PARSER & CIRCUIT BREAKER FUZZING ---');

function isValidMarketRate(val, min = 1000, max = 500000) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= min && val <= max;
}

const fuzzedInputs = [
  { input: 0, expected: false, label: 'Zero price' },
  { input: -500, expected: false, label: 'Negative price' },
  { input: NaN, expected: false, label: 'NaN' },
  { input: undefined, expected: false, label: 'undefined' },
  { input: null, expected: false, label: 'null' },
  { input: Infinity, expected: false, label: 'Infinity' },
  { input: -Infinity, expected: false, label: '-Infinity' },
  { input: '7083', expected: false, label: 'String price' },
  { input: 500, expected: false, label: 'Below floor (<1000)' },
  { input: 9999999, expected: false, label: 'Above ceiling (>500000)' },
  { input: 7111.07, expected: true, label: 'Valid market rate (7111.07)' },
  { input: 11740, expected: true, label: 'Valid quarter rate (11740)' },
  { input: 47340, expected: true, label: 'Valid ata rate (47340)' }
];

fuzzedInputs.forEach(item => {
  const result = isValidMarketRate(item.input);
  assert(result === item.expected, `Fuzz test [${item.label}] => Expected: ${item.expected}, Got: ${result}`);
});

// Test Tier-3 Synthetic Math Logic
const testOns = 4600.5;
const testUsd = 48.14;
const syntheticGram = Math.round((testOns / 31.1034768) * testUsd * 0.995);
assert(isValidMarketRate(syntheticGram, 3000, 50000), `Tier-3 Sentetik Has Altın Hesabı Geçerli (${syntheticGram} TL)`);

// ----------------------------------------------------------------------------
// SUITE 2: ZERO-LOSS CATALOG PROFITABILITY STRESS TEST (1,714 ÜRÜN)
// ----------------------------------------------------------------------------
console.log('\n--- 2. KATALOG ZARAR-ÖNLEME VE MARJ DENETİMİ (1.714 ÜRÜN) ---');

assert(PRODUCTS.length >= 1700, `Yayında en az 1.700 ürün bulunmalı (Bulunan: ${PRODUCTS.length})`);

let invalidPriceCount = 0;
let goldLossCount = 0;
let watchFloorBreachCount = 0;
let preOwnedMarginErrorCount = 0;

// Benchmark Spot Rates for Loss Testing
const benchmarkRates = {
  has24k: 7111.07,
  gold22k: 6680.00,
  gold14k: 5940.00,
  quarter: 11740.00,
  half: 23510.00,
  full: 46720.00,
  ata: 47340.00,
  packaged: 7225.30
};

PRODUCTS.forEach(p => {
  // 1. Price Format & Positive Integer
  if (typeof p.price !== 'number' || isNaN(p.price) || !isFinite(p.price) || p.price <= 0 || !Number.isInteger(p.price)) {
    invalidPriceCount++;
    console.error(`  ❌ Geçersiz fiyat: [${p.reference}] ${p.name} = ${p.price}`);
  }

  // 2. Gold Loss Check
  const n = (p.name || '').toLowerCase();
  const isGold = p.isGold || p.category === 'gold' || p.subCategory?.includes('Ziynet') || p.subCategory?.includes('Külçe') || p.subCategory?.includes('Bilezik');

  if (isGold) {
    let minCost = 0;
    if (n.includes('külçe') && !n.includes('bilezik')) {
      if (/(?:^|[^\d,.])1\s*(?:kg|kilogram)\b/i.test(n)) minCost = benchmarkRates.has24k * 1000;
      else if (/(?:^|[^\d,.])100\s*(?:gr|gram)\b/i.test(n)) minCost = benchmarkRates.has24k * 100;
      else if (/(?:^|[^\d,.])50\s*(?:gr|gram)\b/i.test(n)) minCost = benchmarkRates.has24k * 50;
      else if (/(?:^|[^\d,.])20\s*(?:gr|gram)\b/i.test(n)) minCost = benchmarkRates.has24k * 20;
      else if (/(?:^|[^\d,.])10\s*(?:gr|gram)\b/i.test(n)) minCost = benchmarkRates.has24k * 10;
      else if (/\b2[,.]5\s*(?:gr|gram)\b/i.test(n)) minCost = benchmarkRates.has24k * 2.5;
      else if (/(?:^|[^\d,.])5\s*(?:gr|gram)\b/i.test(n)) minCost = benchmarkRates.has24k * 5;
      else if (/(?:^|[^\d,.])1\s*(?:gr|gram)\b/i.test(n)) minCost = benchmarkRates.packaged;
    } else if (n.includes('çeyrek altın')) {
      minCost = benchmarkRates.quarter;
    } else if (n.includes('yarım altın') && !n.includes('bileklik') && !n.includes('kolye')) {
      minCost = benchmarkRates.half;
    } else if ((n.includes('tam altın') || n.includes('reşat')) && !n.includes('bileklik') && !n.includes('kolye')) {
      minCost = benchmarkRates.full;
    } else if (n.includes('ata') && !n.includes('bilezik')) {
      minCost = benchmarkRates.ata;
    } else if (n.includes('22 ayar') && n.includes('bilezik')) {
      const g = parseFloat((n.match(/(\d+)\s*(?:gr|gram)/i) || [])[1] || 10);
      minCost = g * benchmarkRates.gold22k;
    } else if (n.includes('14 ayar') && n.includes('bilezik')) {
      const g = parseFloat((n.match(/(\d+)\s*(?:gr|gram)/i) || [])[1] || 10);
      minCost = g * benchmarkRates.gold14k;
    }

    if (minCost > 0 && p.price < minCost) {
      goldLossCount++;
      console.error(`  ❌ ZARAR RİSKİ: [${p.reference}] ${p.name} | Satış: ${p.price} TL < Maliyet: ${minCost} TL`);
    }
  }

  // 3. Watch Floor Check
  if (p.category === 'saat' || p.category === 'watch') {
    if (p.price < 12000) {
      watchFloorBreachCount++;
      console.error(`  ❌ Saat 12.000 TL Taban Altında: [${p.reference}] ${p.name} = ${p.price} TL`);
    }
  }

  // 4. Pre-Owned Spread Check
  if (p.isPreOwned) {
    if ((p.price - p.buyPrice) !== 500) {
      preOwnedMarginErrorCount++;
      console.error(`  ❌ İkinci El Al-Sat Marjı Hatalı: [${p.reference}] Alış: ${p.buyPrice}, Satış: ${p.price}`);
    }
  }
});

assert(invalidPriceCount === 0, `Katalogda sıfır, negatif veya geçersiz fiyatlı ürün yok (Hatalı: ${invalidPriceCount})`);
assert(goldLossCount === 0, `Katalogda zararına satılan hiçbir altın ürünü yok (Zararlı: ${goldLossCount})`);
assert(watchFloorBreachCount === 0, `12.000 TL tabanını ihlal eden saat yok (İhlal: ${watchFloorBreachCount})`);
assert(preOwnedMarginErrorCount === 0, `500 TL al-sat marjını ihlal eden ikinci el ürün yok (Hatalı: ${preOwnedMarginErrorCount})`);

// ----------------------------------------------------------------------------
// SUITE 3: SERVER PAYMENT-CATALOG 1:1 REPLICATION CHECK
// ----------------------------------------------------------------------------
console.log('\n--- 3. SERVER-SIDE PAYTR DELİL KATALOĞU BİREBİR EŞLEŞME ---');

let catalogMismatchCount = 0;
PRODUCTS.forEach(p => {
  const payItem = paymentCatalog[p.id] || paymentCatalog[p.reference];
  if (!payItem) {
    catalogMismatchCount++;
    console.error(`  ❌ Server kataloğunda eksik ürün: [${p.reference}] ${p.name}`);
  } else if (payItem.price !== p.price) {
    catalogMismatchCount++;
    console.error(`  ❌ Fiyat uyuşmazlığı: [${p.reference}] client=${p.price}, server=${payItem.price}`);
  }
});

assert(catalogMismatchCount === 0, `Tüm 1.714 ürün server ödeme kataloğu ile kuruşu kuruşuna eşleşiyor (Fark: ${catalogMismatchCount})`);

// ----------------------------------------------------------------------------
// SUITE 4: 10.000 VIRTUAL TICKS DOM REFLECTOR STRESS TEST
// ----------------------------------------------------------------------------
console.log('\n--- 4. 10.000 SANAL DÖNGÜ STRES TESTİ (CURRENCY & DOM STABILITY) ---');

function formatPrice(priceTRY, currency = 'TRY', rates = { TRY: 1, USD: 0.0208, EUR: 0.0178, GBP: 0.0152 }) {
  if (priceTRY === null || priceTRY === undefined || isNaN(priceTRY)) return '₺0';
  const curr = currency || 'TRY';
  const rate = rates[curr] || 1;
  const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '₺';
  const converted = Math.round(Number(priceTRY) * rate);
  return symbol + converted.toLocaleString(curr === 'TRY' ? 'tr-TR' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

let conversionErrors = 0;
const testCurrencies = ['TRY', 'USD', 'EUR', 'GBP'];

for (let i = 0; i < 10000; i++) {
  const randomPrice = Math.floor(Math.random() * 5000000) + 12000;
  const randomCurr = testCurrencies[i % testCurrencies.length];
  const formatted = formatPrice(randomPrice, randomCurr);
  if (!formatted || formatted.includes('NaN') || formatted.includes('undefined') || formatted.includes('null')) {
    conversionErrors++;
  }
}

assert(conversionErrors === 0, `10.000 sanal döngüde 0 para birimi dönüşüm veya format hatası (Hatalı: ${conversionErrors})`);

console.log('\n====================================================================');
console.log(`📊 STRES TESTİ SONUCU: ${passedTests} TEST BAŞARILI, ${failedTests} TEST BAŞARISIZ`);
console.log('====================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
