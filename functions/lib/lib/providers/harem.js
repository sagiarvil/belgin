/**
 * BELGİN KUYUMCULUK — HAREM ALTIN PROVIDER MODULE
 * 
 * Kaynak: https://canlipiyasalar.haremaltin.com/ (wss://hrmsocketonly.haremaltin.com)
 * 
 * Rol:
 * 1. Harem Alış: Belgin için BİRİNCİL ALIŞ (GERİ ALIM) REFERANSI (1.00x birebir)
 * 2. Harem Satış: İZKO başarısız, bayat (>300s) veya geçersiz olduğunda SATIŞ FALLBACK REFERANSI
 * 3. Harem: İkincil piyasa anomali doğrulama kontrolörü
 */

const { PRODUCT_IDS, TIMINGS, PRICE_SOURCES } = require('../pricing/types');
const { HAREM_KEY_MAP } = require('../pricing/product-map');
const { normalizeHaremPrice, isValidPrice } = require('../pricing/normalize');

/**
 * Ham Harem soket veya JSON verisini kanonik NormalizedGoldPrice haritasına dönüştürür.
 * 
 * @param {Object} rawData Harem payload nesnesi
 * @param {number} [fetchedAt]
 * @param {number} [sourceTimestamp]
 * @returns {Map<string, Object>} canonicalProductId -> NormalizedGoldPrice
 */
function parseHaremPayload(rawData, fetchedAt = Date.now(), sourceTimestamp = fetchedAt) {
  if (!rawData || typeof rawData !== 'object') {
    return new Map();
  }

  const dataObj = rawData.data || rawData;
  const resultMap = new Map();

  for (const [haremCode, rawItem] of Object.entries(dataObj)) {
    if (!rawItem || typeof rawItem !== 'object') continue;

    const canonicalId = HAREM_KEY_MAP[haremCode];
    if (!canonicalId) continue;

    const normalized = normalizeHaremPrice(rawItem, canonicalId, fetchedAt, sourceTimestamp);
    if (normalized.isValid) {
      resultMap.set(canonicalId, normalized);
    }

    // ALTIN hem HAS_24K hem GRAM_24K için geçerlidir
    if (haremCode === 'ALTIN' && !resultMap.has(PRODUCT_IDS.GRAM_24K)) {
      const gramNorm = normalizeHaremPrice(rawItem, PRODUCT_IDS.GRAM_24K, fetchedAt, sourceTimestamp);
      if (gramNorm.isValid) {
        resultMap.set(PRODUCT_IDS.GRAM_24K, gramNorm);
      }
    }
  }

  return resultMap;
}

/**
 * Node.js ortamında Harem Altın WebSocket akışından anlık tek snapshot çeker.
 * 
 * @param {number} timeoutMs
 * @returns {Promise<{ success: boolean, prices: Map<string, Object>, sourceTimestamp: number, error?: string }>}
 */
function fetchHaremSnapshot(timeoutMs = TIMINGS.PROVIDER_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let resolved = false;
    let ws = null;
    let timer = null;

    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      if (ws) {
        try { ws.close(); } catch (e) {}
      }
      resolve(result);
    };

    timer = setTimeout(() => {
      finish({
        success: false,
        prices: new Map(),
        sourceTimestamp: Date.now(),
        error: `TIMEOUT_${timeoutMs}MS`
      });
    }, timeoutMs);

    try {
      // Node 22+ built-in WebSocket veya browser WebSocket
      const WSClient = typeof WebSocket !== 'undefined' ? WebSocket : null;
      if (!WSClient) {
        return finish({
          success: false,
          prices: new Map(),
          sourceTimestamp: Date.now(),
          error: 'NO_WEBSOCKET_CLIENT'
        });
      }

      ws = new WSClient('wss://hrmsocketonly.haremaltin.com/socket.io/?EIO=4&transport=websocket');

      ws.onopen = () => {
        try { ws.send('40'); } catch (e) {}
      };

      ws.onmessage = (evt) => {
        try {
          const str = evt.data.toString();
          if (str === '2') {
            try { ws.send('3'); } catch (e) {}
            return;
          }
          if (str.startsWith('42')) {
            const parsed = JSON.parse(str.slice(2));
            if (parsed && parsed[0] === 'price_changed' && parsed[1]?.data) {
              const time = parsed[1].meta?.time || Date.now();
              const prices = parseHaremPayload(parsed[1].data, Date.now(), time);
              if (prices.size > 0) {
                finish({
                  success: true,
                  prices,
                  sourceTimestamp: time
                });
              }
            }
          }
        } catch (e) {
          // parse error
        }
      };

      ws.onerror = (err) => {
        finish({
          success: false,
          prices: new Map(),
          sourceTimestamp: Date.now(),
          error: `WS_ERROR: ${err?.message || 'WebSocket connection error'}`
        });
      };
    } catch (err) {
      finish({
        success: false,
        prices: new Map(),
        sourceTimestamp: Date.now(),
        error: `INIT_ERROR: ${err.message}`
      });
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseHaremPayload,
    fetchHaremSnapshot
  };
}

if (typeof window !== 'undefined') {
  window.BelginHaremProvider = {
    parseHaremPayload,
    fetchHaremSnapshot
  };
}
