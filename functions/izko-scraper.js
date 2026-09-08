/**
 * BELGIN KUYUMCULUK — İZMİR KUYUMCULAR ODASI (İZKO) CANLI KUR SERVİSİ
 * Kaynak: https://www.izko.org.tr/guncel-kur / https://www.izko.org.tr/api/web/v1/gold-prices
 * 
 * Güvenlik Kuralları:
 * 1. Müşteri Satış Fiyatı: İZKO normal Satış (Discount / sell_price) kolonu
 * 2. K.K Satış (Regular) kolonu: Normal satış kur motoruna KESİNLİKLE karışmaz
 * 3. Harem Fallback: İZKO başarısız olduğunda Harem Satış fiyatına güvenle geçiş
 */

let fetchIzkoPrices, fetchHaremSnapshot, PRODUCT_IDS;
try {
  ({ fetchIzkoPrices } = require('./lib/providers/izko'));
  ({ fetchHaremSnapshot } = require('./lib/providers/harem'));
  ({ PRODUCT_IDS } = require('./lib/pricing/types'));
} catch (e) {
  ({ fetchIzkoPrices } = require('../lib/providers/izko'));
  ({ fetchHaremSnapshot } = require('../lib/providers/harem'));
  ({ PRODUCT_IDS } = require('../lib/pricing/types'));
}

let cachedRates = {
  success: true,
  source: 'https://www.izko.org.tr/api/web/v1/gold-prices',
  lastUpdated: new Date().toISOString(),
  lastUpdatedFormatted: new Date().toLocaleString('tr-TR'),
  hasAltin: 6826.16,
  gramGold24k: 6420.00,
  gramGold22k: 6420.00,
  gramGold18k: 6150.00,
  gramGold14k: 5700.00,
  gramGold8k: 3300.00,
  quarterGold: 11300.00,
  oldQuarterGold: 11100.00,
  halfGold: 22600.00,
  oldHalfGold: 22200.00,
  fullGold: 45200.00,
  oldFullGold: 44400.00,
  ataGold: 45450.00,
  packagedGold: 6939.81,
  changeGram: '-0.24%',
  change22k: '-0.24%',
  changeQuarter: '-0.24%',
  direction: 'down',
  creditCardRates: {}
};

/**
 * İZKO resmi web servisinden ve /guncel-kur sayfasından altın kurlarını çeker.
 * Başarısızlık halinde Harem Altın fallback'e başvurur.
 */
async function fetchIzkoRates() {
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = now.toLocaleDateString('tr-TR');

  try {
    const izkoRes = await fetchIzkoPrices();
    if (izkoRes.success && izkoRes.prices.size > 0) {
      const p = izkoRes.prices;
      const getVal = (prodId) => {
        const item = p.get(prodId);
        return item && typeof item.sell === 'number' && item.sell > 0 ? item.sell : null;
      };

      const updated = {
        success: true,
        source: izkoRes.source,
        lastUpdated: now.toISOString(),
        lastUpdatedFormatted: `${formattedDate} ${formattedTime}`,
        hasAltin: getVal(PRODUCT_IDS.HAS_24K) || cachedRates.hasAltin,
        gramGold24k: getVal(PRODUCT_IDS.GRAM_24K) || cachedRates.gramGold24k,
        gramGold22k: getVal(PRODUCT_IDS.GOLD_22K) || cachedRates.gramGold22k,
        gramGold18k: getVal(PRODUCT_IDS.GOLD_18K) || cachedRates.gramGold18k,
        gramGold14k: getVal(PRODUCT_IDS.GOLD_14K) || cachedRates.gramGold14k,
        gramGold8k: getVal(PRODUCT_IDS.GOLD_8K) || cachedRates.gramGold8k,
        quarterGold: getVal(PRODUCT_IDS.CEYREK_NEW) || cachedRates.quarterGold,
        oldQuarterGold: getVal(PRODUCT_IDS.CEYREK_OLD) || cachedRates.oldQuarterGold,
        halfGold: getVal(PRODUCT_IDS.YARIM_NEW) || cachedRates.halfGold,
        oldHalfGold: getVal(PRODUCT_IDS.YARIM_OLD) || cachedRates.oldHalfGold,
        fullGold: getVal(PRODUCT_IDS.ZIYNET_NEW) || cachedRates.fullGold,
        oldFullGold: getVal(PRODUCT_IDS.ZIYNET_OLD) || cachedRates.oldFullGold,
        ataGold: getVal(PRODUCT_IDS.ATA_NEW) || cachedRates.ataGold,
        packagedGold: getVal(PRODUCT_IDS.PACKAGED_24K) || cachedRates.packagedGold,
        creditCardRates: {}
      };

      // K.K Satış kolonunu sadece izleme meta olarak sakla (normal fiyata asla karışmaz)
      for (const [prodId, norm] of p.entries()) {
        if (norm.creditCardSell) {
          updated.creditCardRates[prodId] = norm.creditCardSell;
        }
      }

      cachedRates = { ...cachedRates, ...updated };
      return cachedRates;
    }
  } catch (err) {
    console.warn('[IZKO Scraper] İZKO çağrısı başarısız, Harem fallback devrede:', err.message);
  }

  // Fallback: Harem Altın Canlı Satış Fiyatları
  try {
    const haremRes = await fetchHaremSnapshot(5000);
    if (haremRes.success && haremRes.prices.size > 0) {
      const hp = haremRes.prices;
      const getHaremVal = (prodId) => {
        const item = hp.get(prodId);
        return item && typeof item.sell === 'number' && item.sell > 0 ? item.sell : null;
      };

      const fallback = {
        success: true,
        source: 'https://canlipiyasalar.haremaltin.com/ (Harem Fallback)',
        lastUpdated: now.toISOString(),
        lastUpdatedFormatted: `${formattedDate} ${formattedTime}`,
        hasAltin: getHaremVal(PRODUCT_IDS.HAS_24K) || cachedRates.hasAltin,
        gramGold24k: getHaremVal(PRODUCT_IDS.GRAM_24K) || cachedRates.gramGold24k,
        gramGold22k: getHaremVal(PRODUCT_IDS.GOLD_22K) || cachedRates.gramGold22k,
        gramGold18k: getHaremVal(PRODUCT_IDS.GOLD_18K) || cachedRates.gramGold18k,
        gramGold14k: getHaremVal(PRODUCT_IDS.GOLD_14K) || cachedRates.gramGold14k,
        gramGold8k: getHaremVal(PRODUCT_IDS.GOLD_8K) || cachedRates.gramGold8k,
        quarterGold: getHaremVal(PRODUCT_IDS.CEYREK_NEW) || cachedRates.quarterGold,
        oldQuarterGold: getHaremVal(PRODUCT_IDS.CEYREK_OLD) || cachedRates.oldQuarterGold,
        halfGold: getHaremVal(PRODUCT_IDS.YARIM_NEW) || cachedRates.halfGold,
        oldHalfGold: getHaremVal(PRODUCT_IDS.YARIM_OLD) || cachedRates.oldHalfGold,
        fullGold: getHaremVal(PRODUCT_IDS.ZIYNET_NEW) || cachedRates.fullGold,
        oldFullGold: getHaremVal(PRODUCT_IDS.ZIYNET_OLD) || cachedRates.oldFullGold,
        ataGold: getHaremVal(PRODUCT_IDS.ATA_NEW) || cachedRates.ataGold,
        packagedGold: getHaremVal(PRODUCT_IDS.PACKAGED_24K) || cachedRates.packagedGold
      };

      cachedRates = { ...cachedRates, ...fallback };
      return cachedRates;
    }
  } catch (haremErr) {
    console.warn('[IZKO Scraper] Harem fallback çağrısı başarısız:', haremErr.message);
  }

  return cachedRates;
}

function getCachedRates() {
  return cachedRates;
}

module.exports = {
  fetchIzkoRates,
  getCachedRates
};
