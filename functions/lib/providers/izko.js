/**
 * BELGİN KUYUMCULUK — İZKO PROVIDER MODULE (Cloud Functions build)
 * 
 * Kaynak: 
 * 1. Tier 1: https://www.izko.org.tr/api/web/v1/gold-prices (Resmi JSON API - internal only / timeout fast)
 * 2. Tier 2: https://www.izko.org.tr/guncel-kur (HTML data-container + Resmi İZKO Matematik Mutabakatı)
 * 
 * Güvenlik Kuralları:
 * - fail-closed: Beklenen veri şeması bozulursa yanlış fiyat üretilmez, sağlayıcı geçersiz sayılır.
 * - Satış kolonu = Müşteri Satış Fiyatı (Primary)
 * - K.K Satış kolonu = NORMAL FİYAT MOTORUNDA KESİNLİKLE KULLANILMAZ.
 */

const fs = require('fs');
const path = require('path');
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
async function httpsGetWithRetry(url, options = {}, maxRetries = 1) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await httpsGet(url, options);
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const jitter = Math.floor(Math.random() * 100);
        const delayMs = (attempt + 1) * 150 + jitter;
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  throw lastErr;
}

/**
 * İZKO Resmi Yuvarlama Algoritmaları (izko.org.tr client runtime tersine mühendislik doğrulaması)
 */
function yuvarlaSatisEski(satisFiyati) {
  const r = Math.round(satisFiyati * 100) / 100;
  return Math.ceil(r / 10) * 10;
}

function roundPrice50(v) {
  const b = Math.floor(v / 50) * 50;
  return (Math.round((v - b) * 100) / 100) < 20 ? b : b + 50;
}

function roundForKey(key, v) {
  const OLD_ROUND_KEYS = ['yirmiiki', 'gram'];
  return OLD_ROUND_KEYS.includes(key) ? yuvarlaSatisEski(v) : roundPrice50(v);
}

/**
 * Tier 1: İZKO Resmi JSON API'sinden fiyatları çeker (hızlı zaman aşımı 1200ms).
 */
async function fetchIzkoFromApi() {
  const fetchedAt = Date.now();
  const rawJsonStr = await httpsGetWithRetry('https://www.izko.org.tr/api/web/v1/gold-prices', {
    accept: 'application/json',
    timeout: 1200
  }, 0);

  const parsed = JSON.parse(rawJsonStr);
  if (!parsed || !parsed.success) {
    throw new Error('IZKO_API_PAYLOAD_INVALID');
  }

  // Durum A: Toplu liste formatı
  if (Array.isArray(parsed.data) && parsed.data.length > 0) {
    const resultMap = new Map();
    for (const item of parsed.data) {
      const canonicalId = IZKO_KEY_MAP[item.key];
      if (!canonicalId) continue;
      const normalized = normalizeIzkoPrice({
        sell_price: item.sell_price,
        buy_price: item.buy_price,
        regularPrice: null
      }, canonicalId, fetchedAt);
      if (normalized.isValid) {
        resultMap.set(canonicalId, normalized);
      }
    }
    if (resultMap.size >= MIN_EXPECTED_PRODUCTS) {
      return resultMap;
    }
  }

  // Durum B: has_altin_price tekil nesnesi
  if (parsed.has_altin_price && parseFloat(parsed.has_altin_price) > 1000) {
    return computeIzkoConsensus(parseFloat(parsed.has_altin_price), {}, fetchedAt);
  }

  throw new Error('IZKO_API_NO_VALID_DATA');
}

/**
 * İZKO resmi milyem ve katsayı mutabakatı ile canlı altın fiyatlarını hesaplar.
 */
function computeIzkoConsensus(hasAltin, dataAttrs = {}, fetchedAt = Date.now()) {
  const getNum = (key, fallback) => parseFloat(dataAttrs[key] || fallback) || fallback;

  const yirmiikiM = getNum('yirmiiki-number', 0.9250);
  const yirmiikiP = getNum('yirmiiki-profit', 100.00);
  const yirmiiki = roundForKey('yirmiiki', (hasAltin * yirmiikiM) + yirmiikiP);

  const yeniceyrekM = getNum('yeniceyrek-number', 1.6360);
  const yeniceyrekP = getNum('yeniceyrek-profit', 150.00);
  const yeniceyrek = roundForKey('yeniceyrek', (hasAltin * yeniceyrekM) + yeniceyrekP);

  const yeniyarim = yeniceyrek * 2;
  const yenitam = yeniceyrek * 4;

  const eskiceyrekM = getNum('eskiceyrek-number', 1.6050);
  const eskiceyrekP = getNum('eskiceyrek-profit', 150.00);
  const eskiceyrek = roundForKey('eskiceyrek', (hasAltin * eskiceyrekM) + eskiceyrekP);

  const eskiyarim = eskiceyrek * 2;
  const eskitam = eskiceyrek * 4;

  const ataM = getNum('ata-number', 6.6000);
  const ataP = getNum('ata-profit', 400.00);
  const ata = roundForKey('ata', (hasAltin * ataM) + ataP);

  const gramM = getNum('gram-number', 0.9250);
  const gramP = getNum('gram-profit', 100.00);
  const gram = roundForKey('gram', (hasAltin * gramM) + gramP);

  const onsekizM = getNum('onsekiz-number', 0.9000);
  const onsekizP = getNum('onsekiz-profit', 0.00);
  const onsekiz = roundForKey('onsekiz', (hasAltin * onsekizM) + onsekizP);

  const ondortM = getNum('ondort-number', 0.8350);
  const ondortP = getNum('ondort-profit', 0.00);
  const ondort = roundForKey('ondort', (hasAltin * ondortM) + ondortP);

  const sekizM = getNum('sekizayar-number', 0.4830);
  const sekizP = getNum('sekizayar-profit', 0.00);
  const sekiz = roundForKey('sekizayar', (hasAltin * sekizM) + sekizP);

  const paketliM = getNum('paketlihas-number', 1.0020);
  const paketliP = getNum('paketlihas-profit', 100.00);
  const paketlihas = Number(((hasAltin * paketliM) + paketliP).toFixed(2));

  const items = [
    { id: PRODUCT_IDS.GOLD_22K, sell: yirmiiki },
    { id: PRODUCT_IDS.GRAM_24K, sell: gram },
    { id: PRODUCT_IDS.GOLD_18K, sell: onsekiz },
    { id: PRODUCT_IDS.GOLD_14K, sell: ondort },
    { id: PRODUCT_IDS.GOLD_8K, sell: sekiz },
    { id: PRODUCT_IDS.CEYREK_NEW, sell: yeniceyrek },
    { id: PRODUCT_IDS.CEYREK_OLD, sell: eskiceyrek },
    { id: PRODUCT_IDS.YARIM_NEW, sell: yeniyarim },
    { id: PRODUCT_IDS.YARIM_OLD, sell: eskiyarim },
    { id: PRODUCT_IDS.ZIYNET_NEW, sell: yenitam },
    { id: PRODUCT_IDS.ZIYNET_OLD, sell: eskitam },
    { id: PRODUCT_IDS.ATA_NEW, sell: ata },
    { id: PRODUCT_IDS.PACKAGED_24K, sell: paketlihas },
    { id: PRODUCT_IDS.HAS_24K, sell: hasAltin }
  ];

  const resultMap = new Map();
  for (const item of items) {
    const normalized = normalizeIzkoPrice({
      discountPrice: item.sell,
      regularPrice: null,
      buy_price: 0
    }, item.id, fetchedAt);
    if (normalized.isValid) {
      resultMap.set(item.id, normalized);
    }
  }
  return resultMap;
}

/**
 * Tier 2: İZKO /guncel-kur sayfasını ve canlı data-container parametrelerini ayrıştırır.
 */
async function fetchIzkoFromHtml(referenceHasAltin = null) {
  const fetchedAt = Date.now();
  const html = await httpsGetWithRetry('https://www.izko.org.tr/guncel-kur', {
    accept: 'text/html,application/xhtml+xml',
    timeout: 3500
  });

  if (!html.includes('col-satis') && !html.includes('data-container')) {
    throw new Error('IZKO_HTML_SCHEMA_CHANGED: Column headers or data-container missing');
  }

  const resultMap = new Map();

  // 1. Statik dolu span kontrolü (Varsa doğrudan al)
  for (const [izkoKey, canonicalId] of Object.entries(IZKO_KEY_MAP)) {
    const discountRegex = new RegExp(`id=["']${izkoKey}Discount["'][^>]*>([\\d\\.,]+)<\\/span>`, 'i');
    const discountMatch = html.match(discountRegex);
    const regularRegex = new RegExp(`id=["']${izkoKey}Regular["'][^>]*>([\\d\\.,]+)<\\/span>`, 'i');
    const regularMatch = html.match(regularRegex);

    if (discountMatch && discountMatch[1] && discountMatch[1] !== '-') {
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

  if (resultMap.size >= MIN_EXPECTED_PRODUCTS) {
    return resultMap;
  }

  // 2. Dinamik İZKO Engine: #data-container özniteliklerini oku
  const containerMatch = html.match(/<div id=["']data-container["']([^>]*)>/i);
  const dataAttrs = {};
  if (containerMatch) {
    const regex = /data-([\w-]+)=["']([^"']*)["']/g;
    let m;
    while ((m = regex.exec(containerMatch[1])) !== null) {
      dataAttrs[m[1]] = m[2];
    }
  }

  // Referans Has Altın fiyatını belirle
  let hasAltin = referenceHasAltin;
  if (!hasAltin || hasAltin <= 0) {
    try {
      const cachePath = path.join(__dirname, '..', '..', '..', 'izko-rates-cache.json');
      if (fs.existsSync(cachePath)) {
        const cData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        if (cData.hasAltin && cData.hasAltin > 1000) {
          hasAltin = cData.hasAltin;
        }
      }
    } catch (e) {}
  }

  if (hasAltin && hasAltin > 1000) {
    return computeIzkoConsensus(hasAltin, dataAttrs, fetchedAt);
  }

  if (resultMap.size < MIN_EXPECTED_PRODUCTS) {
    throw new Error(`IZKO_HTML_INSUFFICIENT_PRODUCTS: Expected >= ${MIN_EXPECTED_PRODUCTS}, got ${resultMap.size}`);
  }

  return resultMap;
}

/**
 * Birincil API, ikincil HTML / data-container matematik mutabakatı olmak üzere İZKO fiyatlarını çeker.
 */
async function fetchIzkoPrices(options = {}) {
  // 1. Tier 1: JSON API (Hızlı 1200ms)
  try {
    const prices = await fetchIzkoFromApi();
    return {
      success: true,
      source: 'https://www.izko.org.tr/api/web/v1/gold-prices',
      prices,
      fetchedAt: Date.now()
    };
  } catch (apiErr) {
    // 2. Tier 2: HTML & data-container Resmi İZKO Formül Motoru
    try {
      const prices = await fetchIzkoFromHtml(options.referenceHasAltin);
      return {
        success: true,
        source: 'https://www.izko.org.tr/guncel-kur (Official Consensus)',
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
    computeIzkoConsensus,
    yuvarlaSatisEski,
    roundPrice50,
    roundForKey,
    IZKO_SELECTORS,
    MIN_EXPECTED_PRODUCTS
  };
}
