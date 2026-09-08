/**
 * BELGİN KUYUMCULUK — PRICE NORMALIZATION & VALIDATION LAYER
 * 
 * Ham sağlayıcı verilerini doğrular ve kanonik NormalizedGoldPrice nesnelerine dönüştürür.
 */

const { PRICE_SOURCES, PRODUCT_LABELS } = require('./types');

/**
 * Sayısal fiyat doğrulama koruması
 * Müşteriye ASLA NaN, undefined, null, 0 TL, Infinity veya negatif fiyat gösterilmez.
 * 
 * @param {any} val
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
function isValidPrice(val, min = 1, max = 50_000_000) {
  return typeof val === 'number' && Number.isFinite(val) && !isNaN(val) && val >= min && val <= max;
}

/**
 * String / Sayı değerini temizleyip pozitif sayıya çevirir.
 * 
 * @param {any} val
 * @returns {number|null}
 */
function parsePriceNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return isValidPrice(val) ? val : null;
  }
  const str = String(val).trim().replace(/\s+/g, '');
  if (!str || str === '-' || str === '--') return null;

  let parsed = NaN;
  if (str.includes(',') && str.includes('.')) {
    // Örn: 1.234,56 (TR formatı: nokta binlik, virgül ondalık)
    parsed = parseFloat(str.replace(/\./g, '').replace(',', '.'));
  } else if (str.includes(',')) {
    // Örn: 6833,86 (TR ondalık formatı)
    parsed = parseFloat(str.replace(',', '.'));
  } else if (str.includes('.')) {
    // Standart ondalık veya TR binlik kontrolü
    const floatVal = parseFloat(str);
    // Altın/sarrafiye fiyatlarında "6.430" veya "11.350" gibi 1000 TL üstü değerler
    // parseFloat ile 6.43 veya 11.35 olur. Kuruş olarak değerlendirilemez.
    // Ancak döviz (USD/EUR) 48.494 gibi değerler korunmalıdır.
    if (floatVal < 100 && /^\d{1,3}\.\d{3}$/.test(str)) {
      const stripped = parseFloat(str.replace(/\./g, ''));
      if (stripped >= 1000) {
        parsed = stripped;
      } else {
        parsed = floatVal;
      }
    } else {
      parsed = floatVal;
    }
  } else {
    parsed = parseFloat(str);
  }

  return isValidPrice(parsed) ? parsed : null;
}

/**
 * İZKO ham kaydını NormalizedGoldPrice nesnesine dönüştürür.
 * 
 * @param {Object} rawItem İZKO API veya HTML öğesi
 * @param {string} canonicalProductId Kanonik ürün kimliği
 * @param {number} fetchedAt Fetch anındaki zaman damgası (ms)
 * @param {number} [sourceTimestamp] Kaynağın kendi zaman damgası (varsa)
 * @returns {Object} NormalizedGoldPrice
 */
function normalizeIzkoPrice(rawItem, canonicalProductId, fetchedAt = Date.now(), sourceTimestamp = fetchedAt) {
  const label = PRODUCT_LABELS[canonicalProductId] || canonicalProductId;

  // İZKO'da sell_price veya Discount alanı normal nakit satış fiyatıdır
  const rawSell = rawItem.sell_price !== undefined ? rawItem.sell_price : rawItem.discountPrice;
  const sell = parsePriceNumber(rawSell);

  // K.K Satış (Regular) alanı — normal satışa KESİNLİKLE karışmaz, yalnızca ayrıştırılmış meta olarak tutulur
  const rawKKSell = rawItem.regularPrice !== undefined ? rawItem.regularPrice : rawItem.kk_sell_price;
  const creditCardSell = parsePriceNumber(rawKKSell);

  // İZKO API'sinde buy_price 0 gelir; geçerli bir alış fiyatı varsa parse et, yoksa null
  const buy = parsePriceNumber(rawItem.buy_price);

  const isValid = sell !== null && isValidPrice(sell);

  return {
    productId: canonicalProductId,
    label,
    buy,
    sell,
    creditCardSell, // Normal satış motorunda ASLA kullanılmaz
    source: PRICE_SOURCES.IZKO,
    sourceTimestamp: sourceTimestamp || fetchedAt,
    fetchedAt,
    isValid
  };
}

/**
 * Harem Altın ham kaydını NormalizedGoldPrice nesnesine dönüştürür.
 * 
 * @param {Object} rawItem Harem veri öğesi ({ alis, satis, ... })
 * @param {string} canonicalProductId Kanonik ürün kimliği
 * @param {number} fetchedAt Fetch anındaki zaman damgası (ms)
 * @param {number} [sourceTimestamp]
 * @returns {Object} NormalizedGoldPrice
 */
function normalizeHaremPrice(rawItem, canonicalProductId, fetchedAt = Date.now(), sourceTimestamp = fetchedAt) {
  const label = PRODUCT_LABELS[canonicalProductId] || canonicalProductId;

  const buy = parsePriceNumber(rawItem.alis || rawItem.buy);
  const sell = parsePriceNumber(rawItem.satis || rawItem.sell);

  const isValid = (sell !== null && isValidPrice(sell)) || (buy !== null && isValidPrice(buy));

  return {
    productId: canonicalProductId,
    label,
    buy,
    sell,
    creditCardSell: null, // Harem'de K.K satışı yoktur
    source: PRICE_SOURCES.HAREM,
    sourceTimestamp: sourceTimestamp || fetchedAt,
    fetchedAt,
    isValid
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidPrice,
    parsePriceNumber,
    normalizeIzkoPrice,
    normalizeHaremPrice
  };
}

if (typeof window !== 'undefined') {
  window.BelginPriceNormalize = {
    isValidPrice,
    parsePriceNumber,
    normalizeIzkoPrice,
    normalizeHaremPrice
  };
}
