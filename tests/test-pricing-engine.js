/**
 * BELGİN KUYUMCULUK — ALTIN FİYAT MOTORU KAPSAMLI BİRİM TESTLERİ
 * 
 * Mandate Madde 23: 13 Zorunlu Birim Test Senaryosu
 */

const { buildBelginPrice, percentChange } = require('../lib/pricing/pricing-engine');
const { PRODUCT_IDS, PRICE_SOURCES, PRICE_STATUS, TIMINGS } = require('../lib/pricing/types');
const { normalizeIzkoPrice, normalizeHaremPrice, isValidPrice } = require('../lib/pricing/normalize');
const { resolveCatalogProductPrice } = require('../lib/pricing/product-map');

console.log('====================================================================');
console.log('🏛️  BELGİN KUYUMCULUK — ALTIN FİYAT MOTORU TEST SUITE (13 TEST)');
console.log('====================================================================\n');

let passCount = 0;
let failCount = 0;

function assertTest(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS]: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL]: ${testName}`);
    if (details) console.error(`     Detay: ${details}`);
    failCount++;
  }
}

const NOW = 1788870000000;

// TEST 1: IZKO valid + Harem valid -> sell = IZKO
{
  const izko = {
    productId: PRODUCT_IDS.CEYREK_NEW,
    sell: 11350,
    buy: 0,
    source: PRICE_SOURCES.IZKO,
    sourceTimestamp: NOW - 10000,
    fetchedAt: NOW - 10000,
    isValid: true
  };
  const harem = {
    productId: PRODUCT_IDS.CEYREK_NEW,
    sell: 11161,
    buy: 11048,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW - 5000,
    fetchedAt: NOW - 5000,
    isValid: true
  };

  const res = buildBelginPrice({ izko, harem, currentTime: NOW });
  assertTest(
    res.sell === 11350 && res.sellSource === PRICE_SOURCES.IZKO && res.status === PRICE_STATUS.LIVE,
    'TEST 1: IZKO valid, Harem valid -> sell = IZKO (11.350 TL)',
    `Expected sell: 11350, got: ${res.sell}, source: ${res.sellSource}`
  );
}

// TEST 2: IZKO invalid + Harem valid -> sell = Harem
{
  const izko = {
    productId: PRODUCT_IDS.CEYREK_NEW,
    sell: null,
    buy: null,
    source: PRICE_SOURCES.IZKO,
    sourceTimestamp: NOW - 10000,
    fetchedAt: NOW - 10000,
    isValid: false
  };
  const harem = {
    productId: PRODUCT_IDS.CEYREK_NEW,
    sell: 11161,
    buy: 11048,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW - 5000,
    fetchedAt: NOW - 5000,
    isValid: true
  };

  const res = buildBelginPrice({ izko, harem, currentTime: NOW });
  assertTest(
    res.sell === 11161 && res.sellSource === PRICE_SOURCES.HAREM && res.status === PRICE_STATUS.FALLBACK,
    'TEST 2: IZKO invalid, Harem valid -> sell = Harem (11.161 TL Fallback)',
    `Expected sell: 11161, got: ${res.sell}, source: ${res.sellSource}`
  );
}

// TEST 3: IZKO stale >300 sn + Harem valid -> sell = Harem
{
  const izko = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 6850,
    buy: 0,
    source: PRICE_SOURCES.IZKO,
    sourceTimestamp: NOW - 320000, // 320 saniye önce (>300s)
    fetchedAt: NOW - 320000,
    isValid: true
  };
  const harem = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 6827,
    buy: 6806,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW - 20000,
    fetchedAt: NOW - 20000,
    isValid: true
  };

  const res = buildBelginPrice({ izko, harem, currentTime: NOW });
  assertTest(
    res.sell === 6827 && res.sellSource === PRICE_SOURCES.HAREM && res.status === PRICE_STATUS.FALLBACK,
    'TEST 3: IZKO stale >300 sn, Harem valid -> sell = Harem Fallback',
    `Expected sell: 6827, got: ${res.sell}, source: ${res.sellSource}, status: ${res.status}`
  );
}

// TEST 4: IZKO valid + Harem valid -> buy = Harem
{
  const izko = {
    productId: PRODUCT_IDS.GOLD_22K,
    sell: 6430,
    buy: 0,
    source: PRICE_SOURCES.IZKO,
    sourceTimestamp: NOW - 5000,
    fetchedAt: NOW - 5000,
    isValid: true
  };
  const harem = {
    productId: PRODUCT_IDS.GOLD_22K,
    sell: 6380,
    buy: 6245,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW - 5000,
    fetchedAt: NOW - 5000,
    isValid: true
  };

  const res = buildBelginPrice({ izko, harem, currentTime: NOW });
  assertTest(
    res.buy === 6245 && res.buySource === PRICE_SOURCES.HAREM,
    'TEST 4: IZKO valid, Harem valid -> buy = Harem (6.245 TL marjsız birebir)',
    `Expected buy: 6245, got: ${res.buy}, source: ${res.buySource}`
  );
}

// TEST 5: IZKO K.K Satış mevcut -> normal sell fiyatı asla K.K Satış'tan gelmez
{
  // Simüle: İZKO'da Discount = 6.430, Regular (K.K) = 6.750
  const normalized = normalizeIzkoPrice({
    discountPrice: '6.430',
    regularPrice: '6.750',
    buy_price: 0
  }, PRODUCT_IDS.GOLD_22K, NOW, NOW);

  const res = buildBelginPrice({ izko: normalized, harem: null, currentTime: NOW });
  assertTest(
    res.sell === 6430 && res.sell !== 6750 && normalized.creditCardSell === 6750,
    'TEST 5: IZKO K.K Satış mevcut -> normal sell asla K.K Satış kolonundan gelmez (sell: 6430 != kk: 6750)',
    `sell: ${res.sell}, creditCardSell: ${normalized.creditCardSell}`
  );
}

// TEST 6: IZKO 0 -> reject
{
  const normalizedZero = normalizeIzkoPrice({
    sell_price: 0,
    discountPrice: '0'
  }, PRODUCT_IDS.ATA_NEW, NOW, NOW);

  const harem = {
    productId: PRODUCT_IDS.ATA_NEW,
    sell: 45500,
    buy: 45100,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW,
    fetchedAt: NOW,
    isValid: true
  };

  const res = buildBelginPrice({ izko: normalizedZero, harem, currentTime: NOW });
  assertTest(
    normalizedZero.isValid === false && res.sell === 45500 && res.sellSource === PRICE_SOURCES.HAREM,
    'TEST 6: IZKO 0 -> reject ve Harem fallback',
    `normalized.isValid: ${normalizedZero.isValid}, res.sell: ${res.sell}`
  );
}

// TEST 7: IZKO NaN -> reject
{
  const normalizedNaN = normalizeIzkoPrice({
    sell_price: NaN,
    discountPrice: 'NaN'
  }, PRODUCT_IDS.CEYREK_NEW, NOW, NOW);

  assertTest(
    normalizedNaN.isValid === false && normalizedNaN.sell === null,
    'TEST 7: IZKO NaN -> reject (isValid=false, sell=null)',
    `isValid: ${normalizedNaN.isValid}, sell: ${normalizedNaN.sell}`
  );
}

// TEST 8: IZKO null -> fallback
{
  const harem = {
    productId: PRODUCT_IDS.YARIM_NEW,
    sell: 22700,
    buy: 22200,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW,
    fetchedAt: NOW,
    isValid: true
  };

  const res = buildBelginPrice({ izko: null, harem, currentTime: NOW });
  assertTest(
    res.sell === 22700 && res.sellSource === PRICE_SOURCES.HAREM && res.status === PRICE_STATUS.FALLBACK,
    'TEST 8: IZKO null -> Harem fallback',
    `res.sell: ${res.sell}, source: ${res.sellSource}`
  );
}

// TEST 9: iki provider down, last known valid fresh -> last valid
{
  const previous = {
    productId: PRODUCT_IDS.ATA_NEW,
    sell: 45400,
    buy: 45000,
    sellSource: PRICE_SOURCES.IZKO,
    buySource: PRICE_SOURCES.HAREM,
    calculatedAt: NOW - (5 * 60 * 1000) // 5 dakika önce (fresh < 15dk)
  };

  const res = buildBelginPrice({ izko: null, harem: null, previousValidPrice: previous, currentTime: NOW });
  assertTest(
    res.sell === 45400 && res.buy === 45000 && res.status === PRICE_STATUS.STALE,
    'TEST 9: İki provider down, last known valid fresh -> last valid',
    `sell: ${res.sell}, buy: ${res.buy}, status: ${res.status}`
  );
}

// TEST 10: iki provider down, last valid > hard TTL -> UNAVAILABLE
{
  const previousOld = {
    productId: PRODUCT_IDS.ATA_NEW,
    sell: 45400,
    buy: 45000,
    sellSource: PRICE_SOURCES.IZKO,
    buySource: PRICE_SOURCES.HAREM,
    calculatedAt: NOW - (16 * 60 * 1000) // 16 dakika önce (>15 dk hard TTL)
  };

  const res = buildBelginPrice({ izko: null, harem: null, previousValidPrice: previousOld, currentTime: NOW });
  assertTest(
    res.sell === null && res.status === PRICE_STATUS.UNAVAILABLE && res.fallbackReason === 'HARD_TTL_EXPIRED',
    'TEST 10: İki provider down, last valid > hard TTL -> UNAVAILABLE',
    `sell: ${res.sell}, status: ${res.status}, reason: ${res.fallbackReason}`
  );
}

// TEST 11: IZKO +8%, Harem +0.2% -> anomaly reject
{
  const previous = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 6500,
    buy: 6400,
    haremSell: 6500,
    calculatedAt: NOW - 30000
  };

  // İZKO 6500 -> 7020 (+%8.0 anomali sıçrama)
  const izkoAnomaly = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 7020,
    buy: 0,
    source: PRICE_SOURCES.IZKO,
    sourceTimestamp: NOW,
    fetchedAt: NOW,
    isValid: true
  };

  // Harem 6500 -> 6513 (+%0.2 olağan seyir)
  const haremNormal = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 6513,
    buy: 6410,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW,
    fetchedAt: NOW,
    isValid: true
  };

  const res = buildBelginPrice({
    izko: izkoAnomaly,
    harem: haremNormal,
    previousValidPrice: previous,
    currentTime: NOW
  });

  assertTest(
    res.sell !== 7020 && res.sell === 6513 && res.sellSource === PRICE_SOURCES.HAREM && res.fallbackReason.includes('ANOMALY_REJECTED'),
    'TEST 11: IZKO +8%, Harem +0.2% -> anomaly reject (7020 TL reddedildi, Harem 6513 TL seçildi)',
    `sell: ${res.sell}, source: ${res.sellSource}, reason: ${res.fallbackReason}`
  );
}

// TEST 12: IZKO +3%, Harem +2.8% -> accept
{
  const previous = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 6500,
    buy: 6400,
    haremSell: 6500,
    calculatedAt: NOW - 30000
  };

  // İZKO 6500 -> 6695 (+%3.0 gerçek piyasa hareketi)
  const izkoUp = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 6695,
    buy: 0,
    source: PRICE_SOURCES.IZKO,
    sourceTimestamp: NOW,
    fetchedAt: NOW,
    isValid: true
  };

  // Harem 6500 -> 6682 (+%2.8 hareketi doğrular)
  const haremUp = {
    productId: PRODUCT_IDS.GRAM_24K,
    sell: 6682,
    buy: 6580,
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: NOW,
    fetchedAt: NOW,
    isValid: true
  };

  const res = buildBelginPrice({
    izko: izkoUp,
    harem: haremUp,
    previousValidPrice: previous,
    currentTime: NOW
  });

  assertTest(
    res.sell === 6695 && res.sellSource === PRICE_SOURCES.IZKO && res.status === PRICE_STATUS.LIVE,
    'TEST 12: IZKO +3%, Harem +2.8% -> hareket doğrulandı ve kabul edildi (sell: 6695)',
    `sell: ${res.sell}, source: ${res.sellSource}`
  );
}

// TEST 13: Harem markup -> hiçbir sarrafiye fiyatında 1.02 veya 1.005 uygulanmıyor
{
  const mockPriceMap = {
    [PRODUCT_IDS.HAS_24K]: 6833,
    [PRODUCT_IDS.GRAM_24K]: 6833,
    [PRODUCT_IDS.GOLD_22K]: 6430,
    [PRODUCT_IDS.CEYREK_NEW]: 11350,
    [PRODUCT_IDS.CEYREK_OLD]: 11100,
    [PRODUCT_IDS.YARIM_NEW]: 22700,
    [PRODUCT_IDS.YARIM_OLD]: 22200,
    [PRODUCT_IDS.ZIYNET_NEW]: 45400,
    [PRODUCT_IDS.ZIYNET_OLD]: 44400,
    [PRODUCT_IDS.ATA_NEW]: 45500,
    [PRODUCT_IDS.ATA_OLD]: 45500
  };

  const sampleProduct = {
    name: 'Yeni Kulplu Ziynet Çeyrek Altın',
    isGold: true,
    category: 'gold',
    subCategory: 'Ziynet'
  };

  const targetPrice = resolveCatalogProductPrice(sampleProduct, mockPriceMap);
  const markupPrice102 = Math.round(11350 * 1.02);
  const markupPrice1005 = Math.round(11350 * 1.005);

  assertTest(
    targetPrice === 11350 && targetPrice !== markupPrice102 && targetPrice !== markupPrice1005,
    'TEST 13: Harem markup yok -> Çeyrek fiyatı tam 11.350 TL (11577 veya 11407 TL değil)',
    `targetPrice: ${targetPrice}, markup102: ${markupPrice102}, markup1005: ${markupPrice1005}`
  );
}

console.log('\n====================================================================');
if (failCount === 0) {
  console.log(`🎉 TÜM 13/13 FİYAT MOTORU TESTİ BAŞARIYLA GEÇTİ! (${passCount} PASSED, 0 FAILED)`);
  console.log('====================================================================\n');
  process.exit(0);
} else {
  console.error(`❌ ${failCount} TEST BAŞARISIZ OLDU!`);
  console.log('====================================================================\n');
  process.exit(1);
}
