/**
 * BELGİN KUYUMCULUK — İZKO PROVIDER MODULE
 * 
 * Kaynak: 
 * 1. Tier 1: https://www.izko.org.tr/api/web/v1/gold-prices (Resmi JSON API)
 * 2. Tier 2: https://www.izko.org.tr/guncel-kur (HTML Fallback)
 * 
 * Güvenlik Kuralları:
 * - fail-closed: Beklenen veri şeması bozulursa yanlış fiyat üretilmez, sağlayıcı geçersiz sayılır.
 * - Satış kolonu = Müşteri Satış Fiyatı (Primary)
 * - K.K Satış kolonu = NORMAL FİYAT MOTORUNDA KESİNLİKLE KULLANILMAZ.
 */

const https = require('https');
const { PRODUCT_IDS, TIMINGS, PRICE_SOURCES } = require('../pricing/types');
const { IZKO_KEY_MAP } = require('../pricing/product-map');
const { normalizeIzkoPrice, isValidPrice } = require('../pricing/normalize');

const MIN_EXPECTED_PRODUCTS = 6;

const IZKO_SELECTORS = {
  panelHeader: '.panel-header',
  priceRow: '.price-row',
  rowName: '.row-name',
  kkSellSpan: '.row-satis span',
  discountSellSpan: '.row-ind span'
};

function httpsGet(url, options = {}) {
  const timeoutMs = options.timeout || TIMINGS.PROVIDER_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': options.accept || 'application/json, text/plain, */*',
        'Referer': 'https://www.izko.org.tr/guncel-kur'
      }
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP_STATUS_${res.statusCode}`));
      }
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body));
    });

    req.on('error', (err) => reject(new Error(`NETWORK_ERROR: ${err.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`TIMEOUT_${timeoutMs}MS`));
    });
  });
}

/**
 * Enterprise Resilience: Ağ kesintilerine karşı üstel geri çekilmeli yeniden deneme
 */
async function httpsGetWithRetry(url, options = {}, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await httpsGet(url, options);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 150);
        const delayMs = (attempt + 1) * 250 + jitter;
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  throw lastErr;
}

/**
 * Tier 1: İZKO Resmi JSON API'sinden fiyatları çeker.
 * @returns {Promise<Map<string, Object>>} canonicalProductId -> NormalizedGoldPrice
 */
async function fetchIzkoFromApi() {
  const fetchedAt = Date.now();
  const rawJsonStr = await httpsGetWithRetry('https://www.izko.org.tr/api/web/v1/gold-prices', {
    accept: 'application/json'
  });

  const parsed = JSON.parse(rawJsonStr);
  if (!parsed || !parsed.success || !Array.isArray(parsed.data) || parsed.data.length === 0) {
    throw new Error('IZKO_API_PAYLOAD_INVALID');
  }

  const resultMap = new Map();

  for (const item of parsed.data) {
    const canonicalId = IZKO_KEY_MAP[item.key];
    if (!canonicalId) continue;

    // sell_price İZKO API'sindeki nakit satış tavsiye fiyatıdır
    const normalized = normalizeIzkoPrice({
      sell_price: item.sell_price,
      buy_price: item.buy_price,
      regularPrice: null // API'de sadece sell_price gelir
    }, canonicalId, fetchedAt);

    if (normalized.isValid) {
      resultMap.set(canonicalId, normalized);
    }
  }

  if (resultMap.size < MIN_EXPECTED_PRODUCTS) {
    throw new Error(`IZKO_API_INSUFFICIENT_PRODUCTS: Expected >= ${MIN_EXPECTED_PRODUCTS}, got ${resultMap.size}`);
  }

  return resultMap;
}

/**
 * Tier 2: İZKO /guncel-kur HTML sayfasını fail-closed şekilde ayrıştırır.
 * @returns {Promise<Map<string, Object>>} canonicalProductId -> NormalizedGoldPrice
 */
async function fetchIzkoFromHtml() {
  const fetchedAt = Date.now();
  const html = await httpsGetWithRetry('https://www.izko.org.tr/guncel-kur', {
    accept: 'text/html,application/xhtml+xml'
  });

  // Basit güvenlik/şema kontrolü
  if (!html.includes('col-satis') || !html.includes('col-ind')) {
    throw new Error('IZKO_HTML_SCHEMA_CHANGED: Column headers missing');
  }

  const resultMap = new Map();

  // HTML'deki id="{key}Discount" (Satış) ve id="{key}Regular" (K.K Satış) span'larını tara
  for (const [izkoKey, canonicalId] of Object.entries(IZKO_KEY_MAP)) {
    // Normal Satış Fiyatı (Discount)
    const discountRegex = new RegExp(`id=["']${izkoKey}Discount["'][^>]*>([\\d\\.,]+)<\\/span>`, 'i');
    const discountMatch = html.match(discountRegex);

    // K.K Satış Fiyatı (Regular) — normal satışa KESİNLİKLE karışmaz
    const regularRegex = new RegExp(`id=["']${izkoKey}Regular["'][^>]*>([\\d\\.,]+)<\\/span>`, 'i');
    const regularMatch = html.match(regularRegex);

    if (discountMatch) {
      const normalized = normalizeIzkoPrice({
        discountPrice: discountMatch[1],
        regularPrice: regularMatch ? regularMatch[1] : null,
        buy_price: 0
      }, canonicalId, fetchedAt);

      if (normalized.isValid) {
        resultMap.set(canonicalId, normalized);
      }
    }
  }

  if (resultMap.size < MIN_EXPECTED_PRODUCTS) {
    throw new Error(`IZKO_HTML_INSUFFICIENT_PRODUCTS: Expected >= ${MIN_EXPECTED_PRODUCTS}, got ${resultMap.size}`);
  }

  return resultMap;
}

/**
 * Birincil API, ikincil HTML fallback olmak üzere İZKO fiyatlarını çeker.
 * @returns {Promise<{ success: boolean, source: string, prices: Map<string, Object>, error?: string }>}
 */
async function fetchIzkoPrices() {
  // 1. Tier 1: JSON API
  try {
    const prices = await fetchIzkoFromApi();
    return {
      success: true,
      source: 'https://www.izko.org.tr/api/web/v1/gold-prices',
      prices,
      fetchedAt: Date.now()
    };
  } catch (apiErr) {
    // 2. Tier 2: HTML Fallback
    try {
      const prices = await fetchIzkoFromHtml();
      return {
        success: true,
        source: 'https://www.izko.org.tr/guncel-kur (HTML)',
        prices,
        fetchedAt: Date.now()
      };
    } catch (htmlErr) {
      return {
        success: false,
        source: 'IZKO',
        prices: new Map(),
        error: `API: ${apiErr.message} | HTML: ${htmlErr.message}`,
        fetchedAt: Date.now()
      };
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchIzkoPrices,
    fetchIzkoFromApi,
    fetchIzkoFromHtml,
    IZKO_SELECTORS,
    MIN_EXPECTED_PRODUCTS
  };
}
