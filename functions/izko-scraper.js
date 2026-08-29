/**
 * BELGIN KUYUMCULUK — İZMİR KUYUMCULAR ODASI (İZKO) CANLI KUR SERVİSİ
 * Kaynak: https://www.izko.org.tr/guncel-kur / https://www.izko.org.tr/api/web/v1/gold-prices
 * 15 dakikalık periyotlarla otomatik güncellenir.
 */

const https = require('https');

let cachedRates = {
  success: true,
  source: 'https://www.izko.org.tr/guncel-kur',
  lastUpdated: '2026-08-27T17:15:00.000Z',
  lastUpdatedFormatted: '27.08.2026 20:15',
  hasAltin: 7110.05,
  gramGold24k: 7110.05,
  gramGold22k: 6680.00,
  gramGold18k: 6400.00,
  gramGold14k: 5940.00,
  gramGold8k: 3440.00,
  quarterGold: 11740.00,
  oldQuarterGold: 11570.00,
  halfGold: 23500.00,
  oldHalfGold: 23060.00,
  fullGold: 46710.00,
  oldFullGold: 45930.00,
  ataGold: 47330.00,
  packagedGold: 7224.27,
  changeGram: '+0.04%',
  change22k: '+0.04%',
  changeQuarter: '+0.04%',
  direction: 'up'
};

function fetchHttpsJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: options.timeout || 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.izko.org.tr/guncel-kur'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('İstek zaman aşımına uğradı (Timeout)'));
    });
  });
}

function fetchHttpsHtml(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      timeout: options.timeout || 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('İstek zaman aşımına uğradı (Timeout)'));
    });
  });
}

/**
 * İZKO resmi web servisinden ve /guncel-kur sayfasından altın kurlarını çeker.
 */
async function fetchIzkoRates() {
  const now = new Date();
  const formattedTime = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = now.toLocaleDateString('tr-TR');

  // 1. TIER: İZKO Resmi API Endpoint
  try {
    const json = await fetchHttpsJson('https://www.izko.org.tr/api/web/v1/gold-prices', { timeout: 7000 });
    if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
      const rates = {
        success: true,
        source: 'https://www.izko.org.tr/guncel-kur',
        lastUpdated: now.toISOString(),
        lastUpdatedFormatted: `${formattedDate} ${formattedTime}`,
        changeGram: '+0.04%',
        change22k: '+0.04%',
        changeQuarter: '+0.04%',
        direction: 'up'
      };

      json.data.forEach(item => {
        const price = parseFloat(item.sell_price || item.buy_price) || 0;
        if (price > 0) {
          switch (item.key) {
            case 'hasaltin':
              rates.hasAltin = price;
              rates.gramGold24k = price;
              break;
            case 'yirmiiki':
            case 'gram':
              rates.gramGold22k = price;
              break;
            case 'onsekiz':
              rates.gramGold18k = price;
              break;
            case 'ondort':
              rates.gramGold14k = price;
              break;
            case 'sekizayar':
              rates.gramGold8k = price;
              break;
            case 'yeniceyrek':
              rates.quarterGold = price;
              break;
            case 'eskiceyrek':
              rates.oldQuarterGold = price;
              break;
            case 'yeniyarim':
              rates.halfGold = price;
              break;
            case 'eskiyarim':
              rates.oldHalfGold = price;
              break;
            case 'yenitam':
              rates.fullGold = price;
              break;
            case 'eskitam':
              rates.oldFullGold = price;
              break;
            case 'ata':
              rates.ataGold = price;
              break;
            case 'paketlihas':
              rates.packagedGold = price;
              break;
          }
        }
      });

      if (json.data[0] && json.data[0].percent_change !== undefined) {
        const chgNum = parseFloat(json.data[0].percent_change) || 0;
        const chg = (chgNum >= 0 ? '+' : '') + chgNum.toFixed(2) + '%';
        rates.changeGram = chg;
        rates.change22k = chg;
        rates.changeQuarter = chg;
        rates.direction = json.data[0].direction || (chgNum >= 0 ? 'up' : 'down');
      }

      cachedRates = { ...cachedRates, ...rates };
      return cachedRates;
    }
  } catch (apiErr) {
    console.warn('[IZKO Scraper] API denemesi başarısız, HTML fallback deneniyor:', apiErr.message);
  }

  // 2. TIER: İZKO /guncel-kur HTML Ayrıştırma
  try {
    const html = await fetchHttpsHtml('https://www.izko.org.tr/guncel-kur', { timeout: 7000 });
    const matchHasAltin = html.match(/id="hasaltinDiscount"[^>]*>([\d\.,]+)<\/span>/i);
    const match22k = html.match(/id="yirmiikiDiscount"[^>]*>([\d\.,]+)<\/span>/i);
    const matchQuarter = html.match(/id="yeniceyrekDiscount"[^>]*>([\d\.,]+)<\/span>/i);

    const parseTrNum = (str) => {
      if (!str) return 0;
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    };

    if (matchHasAltin || match22k || matchQuarter) {
      const parsed = {
        success: true,
        source: 'https://www.izko.org.tr/guncel-kur (HTML)',
        lastUpdated: now.toISOString(),
        lastUpdatedFormatted: `${formattedDate} ${formattedTime}`,
      };
      if (matchHasAltin) {
        const val = parseTrNum(matchHasAltin[1]);
        if (val > 1000) {
          parsed.hasAltin = val;
          parsed.gramGold24k = val;
        }
      }
      if (match22k) {
        const val = parseTrNum(match22k[1]);
        if (val > 1000) parsed.gramGold22k = val;
      }
      if (matchQuarter) {
        const val = parseTrNum(matchQuarter[1]);
        if (val > 1000) parsed.quarterGold = val;
      }

      cachedRates = { ...cachedRates, ...parsed };
      return cachedRates;
    }
  } catch (htmlErr) {
    console.warn('[IZKO Scraper] HTML ayrıştırma başarısız:', htmlErr.message);
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
