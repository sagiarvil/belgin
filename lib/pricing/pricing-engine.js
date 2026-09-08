/**
 * BELGİN KUYUMCULUK — CANONICAL PRICING ENGINE v3.0
 * 
 * Karar ve Yönetim Motoru:
 * - Müşteri Satış: 1. İZKO normal Satış -> 2. Harem Satış (Fallback) -> 3. Last Known Good -> 4. UNAVAILABLE
 * - Müşteri Alış: 1. Harem Alış (1.00x marjsız) -> 2. Last Known Good -> 3. null
 * - Bayatlık Denetimi: 0-120s LIVE, 120-300s STALE, >300s FALLBACK
 * - Sert TTL: 15 dakika üzeri son bilinen fiyat geçersiz -> UNAVAILABLE
 * - Anomali Koruması: >%2 tekil hareket Harem tarafından doğrulanmazsa REJECT
 */

const { PRICE_SOURCES, PRICE_STATUS, TIMINGS, PRODUCT_LABELS } = require('./types');
const { isValidPrice } = require('./normalize');

/**
 * İki fiyat arasındaki mutlak yüzde değişimini hesaplar.
 * @param {number} previous
 * @param {number} next
 * @returns {number} Yüzde (ör: 2.5)
 */
function percentChange(previous, next) {
  if (!previous || previous <= 0 || !next || next <= 0) return 0;
  return Math.abs((next - previous) / previous) * 100;
}

/**
 * Tek bir kanonik ürün için Belgin Gold Price kararını üretir.
 * 
 * @param {Object} params
 * @param {Object|null} [params.izko] NormalizedGoldPrice
 * @param {Object|null} [params.harem] NormalizedGoldPrice
 * @param {Object|null} [params.previousValidPrice] BelginGoldPrice
 * @param {number} [params.currentTime]
 * @returns {Object} BelginGoldPrice
 */
function buildBelginPrice({
  izko = null,
  harem = null,
  previousValidPrice = null,
  currentTime = Date.now()
}) {
  const productId = izko?.productId || harem?.productId || previousValidPrice?.productId;
  const label = izko?.label || harem?.label || previousValidPrice?.label || (productId ? PRODUCT_LABELS[productId] : '') || 'Altın Ürünü';

  let selectedSell = null;
  let sellSource = null;
  let sellStatus = PRICE_STATUS.UNAVAILABLE;
  let fallbackReason = null;

  const izkoRawSell = (izko && typeof izko.sell === 'number') ? izko.sell : null;
  const haremRawSell = (harem && typeof harem.sell === 'number') ? harem.sell : null;
  const haremRawBuy = (harem && typeof harem.buy === 'number') ? harem.buy : null;

  // ─────────────────────────────────────────────────────────────
  // 1. SATIŞ FİYATI KARAR MATRİSİ
  // ─────────────────────────────────────────────────────────────

  let izkoCandidateValid = false;
  let izkoAge = Infinity;

  if (izko && izko.isValid && isValidPrice(izko.sell)) {
    const izkoTime = izko.sourceTimestamp || izko.fetchedAt || currentTime;
    izkoAge = Math.max(0, currentTime - izkoTime);

    if (izkoAge > TIMINGS.FALLBACK_MAX_AGE_MS) {
      // > 300 saniye: İZKO bayat kabul edilir, Fallback'e düşülür
      fallbackReason = `IZKO_STALE_${Math.round(izkoAge / 1000)}S`;
    } else {
      // Anomali Kontrolü
      if (previousValidPrice && isValidPrice(previousValidPrice.sell)) {
        const izkoPct = percentChange(previousValidPrice.sell, izko.sell);

        if (izkoPct > TIMINGS.ANOMALY_THRESHOLD_PERCENT) {
          // %2 üzeri hareket -> İkincil kaynak (Harem) doğrulaması ara
          let movementConfirmed = false;
          if (harem && isValidPrice(harem.sell) && previousValidPrice.haremSell) {
            const haremPct = percentChange(previousValidPrice.haremSell, harem.sell);
            const izkoDir = izko.sell - previousValidPrice.sell;
            const haremDir = harem.sell - previousValidPrice.haremSell;
            const sameDirection = (izkoDir > 0 && haremDir > 0) || (izkoDir < 0 && haremDir < 0);

            // Eğer Harem de benzer yönde en az %1.0 hareket ettiyse piyasa hareketi doğrulanır
            if (sameDirection && haremPct >= 1.0) {
              movementConfirmed = true;
            }
          }

          if (movementConfirmed) {
            izkoCandidateValid = true;
          } else {
            fallbackReason = `IZKO_ANOMALY_REJECTED_${izkoPct.toFixed(2)}PCT`;
          }
        } else {
          izkoCandidateValid = true;
        }
      } else {
        izkoCandidateValid = true;
      }
    }
  } else if (izko) {
    fallbackReason = 'IZKO_PRICE_INVALID';
  } else {
    fallbackReason = 'IZKO_UNAVAILABLE';
  }

  // A. Birincil Tercih: Geçerli ve Taze İZKO Satış Fiyatı
  if (izkoCandidateValid && izko) {
    selectedSell = izko.sell;
    sellSource = PRICE_SOURCES.IZKO;
    sellStatus = izkoAge <= TIMINGS.LIVE_MAX_AGE_MS ? PRICE_STATUS.LIVE : PRICE_STATUS.STALE;
    fallbackReason = null;
  }

  // B. İkincil Tercih (SATIŞ FALLBACK): Taze Harem Satış Fiyatı
  if (!selectedSell && harem && harem.isValid && isValidPrice(harem.sell)) {
    const haremTime = harem.sourceTimestamp || harem.fetchedAt || currentTime;
    const haremAge = Math.max(0, currentTime - haremTime);

    if (haremAge <= TIMINGS.FALLBACK_MAX_AGE_MS) {
      selectedSell = harem.sell;
      sellSource = PRICE_SOURCES.HAREM;
      sellStatus = PRICE_STATUS.FALLBACK;
      // fallbackReason korunur (ör: IZKO_UNAVAILABLE, IZKO_STALE, vb.)
    }
  }

  // C. Üçüncül Tercih: Last Known Valid Sell (< 15 dk hard TTL)
  if (!selectedSell && previousValidPrice && isValidPrice(previousValidPrice.sell)) {
    const prevAge = Math.max(0, currentTime - previousValidPrice.calculatedAt);
    if (prevAge <= TIMINGS.LAST_VALID_HARD_TTL_MS) {
      selectedSell = previousValidPrice.sell;
      sellSource = previousValidPrice.sellSource || PRICE_SOURCES.IZKO;
      sellStatus = PRICE_STATUS.STALE;
      fallbackReason = fallbackReason ? `${fallbackReason}_USING_LAST_VALID` : 'USING_LAST_VALID';
    } else {
      sellStatus = PRICE_STATUS.UNAVAILABLE;
      fallbackReason = 'HARD_TTL_EXPIRED';
    }
  }

  // D. Dördüncül Durum: Fiyat Bulunamadı / UNAVAILABLE
  if (!selectedSell) {
    selectedSell = null;
    sellSource = null;
    sellStatus = PRICE_STATUS.UNAVAILABLE;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ALIŞ FİYATI KARAR MATRİSİ (BİRİNCİL = HAREM ALIŞ - 1.00x)
  // ─────────────────────────────────────────────────────────────

  let selectedBuy = null;
  let buySource = null;

  if (harem && harem.isValid && isValidPrice(harem.buy)) {
    selectedBuy = harem.buy;
    buySource = PRICE_SOURCES.HAREM;
  } else if (previousValidPrice && isValidPrice(previousValidPrice.buy)) {
    const prevAge = Math.max(0, currentTime - previousValidPrice.calculatedAt);
    if (prevAge <= TIMINGS.LAST_VALID_HARD_TTL_MS) {
      selectedBuy = previousValidPrice.buy;
      buySource = previousValidPrice.buySource || PRICE_SOURCES.HAREM;
    }
  }

  const calculatedAt = currentTime;
  const sourceTimestamp = sellSource === PRICE_SOURCES.IZKO
    ? (izko?.sourceTimestamp || calculatedAt)
    : (harem?.sourceTimestamp || calculatedAt);

  const ageSeconds = Math.round(Math.max(0, currentTime - sourceTimestamp) / 1000);

  return {
    productId,
    label,
    buy: selectedBuy,
    sell: selectedSell,
    buySource,
    sellSource,
    sourceTimestamp,
    calculatedAt,
    status: sellStatus,
    fallbackReason,
    // Debug & Observability meta
    izkoSell: izkoRawSell,
    haremSell: haremRawSell,
    haremBuy: haremRawBuy,
    ageSeconds
  };
}

/**
 * Toplu fiyat motoru yürütücüsü
 * 
 * @param {Object} params
 * @param {Map<string, Object>} params.izkoPrices
 * @param {Map<string, Object>} params.haremPrices
 * @param {Map<string, Object>} [params.previousPricesMap]
 * @param {number} [params.currentTime]
 * @returns {Map<string, Object>} canonicalProductId -> BelginGoldPrice
 */
function runPricingEngine({
  izkoPrices = new Map(),
  haremPrices = new Map(),
  previousPricesMap = new Map(),
  currentTime = Date.now()
}) {
  const allProductIds = new Set([
    ...izkoPrices.keys(),
    ...haremPrices.keys(),
    ...previousPricesMap.keys()
  ]);

  const outputMap = new Map();

  for (const prodId of allProductIds) {
    const izko = izkoPrices.get(prodId) || null;
    const harem = haremPrices.get(prodId) || null;
    const prev = previousPricesMap.get(prodId) || null;

    const belginPrice = buildBelginPrice({
      izko,
      harem,
      previousValidPrice: prev,
      currentTime
    });

    outputMap.set(prodId, belginPrice);
  }

  return outputMap;
}

/**
 * Observability: Güvenli log formatı üretir (credential içermez)
 * @param {Object} price BelginGoldPrice
 * @returns {string} JSON string
 */
function formatPriceAuditLog(price) {
  return JSON.stringify({
    productId: price.productId,
    izkoSell: price.izkoSell,
    haremSell: price.haremSell,
    selectedSell: price.sell,
    selectedBuy: price.buy,
    sellSource: price.sellSource,
    buySource: price.buySource,
    status: price.status,
    ageSeconds: price.ageSeconds,
    fallbackReason: price.fallbackReason || null,
    calculatedAt: price.calculatedAt
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    percentChange,
    buildBelginPrice,
    runPricingEngine,
    formatPriceAuditLog
  };
}

if (typeof window !== 'undefined') {
  window.BelginPricingEngine = {
    percentChange,
    buildBelginPrice,
    runPricingEngine,
    formatPriceAuditLog
  };
}
