'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const dataJsPath = path.join(ROOT, 'js', 'data.js');

const DEFAULT_USD_RATE = 48.279;
const MARKET_MARKUP = 1.80; // Zorunlu +%80 Kâr Marjı

function fetchLiveUsdRate() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'kur.doviz.com',
      path: '/serbest-piyasa/amerikan-dolari',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const match = data.match(/data-socket-key="USD"[^>]*data-socket-attr="s"[^>]*>([0-9.,]+)</) ||
                        data.match(/"selling":([0-9.]+)/) ||
                        data.match(/class="text-xl font-bold[^>]*>([0-9.,]+)</);
          if (match) {
            const parsed = parseFloat(match[1].replace(',', '.'));
            if (parsed > 30 && parsed < 100) {
              console.log('[Doviz.com] Canlı USD Satış Kuru Başarıyla Çekildi: ' + parsed + ' TL');
              return resolve(parsed);
            }
          }
        } catch (e) {
          console.warn('[Doviz.com] Parse hatası:', e.message);
        }
        console.log('[Doviz.com] Varsayılan kur kullanılıyor: ' + DEFAULT_USD_RATE + ' TL');
        resolve(DEFAULT_USD_RATE);
      });
    });
    req.on('error', (e) => {
      console.warn('[Doviz.com] Ağ hatası: ' + e.message + ', varsayılan ' + DEFAULT_USD_RATE + ' TL kullanılıyor.');
      resolve(DEFAULT_USD_RATE);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(DEFAULT_USD_RATE);
    });
    req.end();
  });
}

async function run() {
  console.log('=================================================================');
  console.log('👑 ELİT KATEGORİ CANLI USD KUR + %80 MARJ FİYAT GÜNCELLEME MOTORU');
  console.log('=================================================================');
  const usdRate = await fetchLiveUsdRate();
  console.log('📌 Referans Kur: 1 USD = ' + usdRate + ' TL');
  console.log('📌 Uygulanan Formül: [USD Fiyatı] * ' + usdRate + ' * 1.80 (+%80 Artış)');

  let code = fs.readFileSync(dataJsPath, 'utf8');
  code += '\nmodule.exports = { PRODUCTS, ELITE_WATCH_BRANDS, WATCH_BRANDS, JEWELRY_BRANDS, PRE_OWNED_ITEMS };';
  const m = new module.constructor();
  m._compile(code, 'data.js');
  const { PRODUCTS, ELITE_WATCH_BRANDS, WATCH_BRANDS, JEWELRY_BRANDS, PRE_OWNED_ITEMS } = m.exports;

  let eliteCount = 0;
  const updatedProducts = PRODUCTS.map(p => {
    if (p.isElite || p.category === 'elit-saatler') {
      eliteCount++;
      const baseUsd = Number(p.usdRefPrice) || 10000;
      const exactPrice = baseUsd * usdRate * MARKET_MARKUP;
      const targetTry = Math.round(exactPrice);
      p.price = targetTry;
      p.usdRefPrice = baseUsd;
      p.marketMarkup = '+80%';
      p.usdSellingRate = usdRate;
      p.inStock = true;
    }
    return p;
  });

  console.log('✅ Toplam ' + eliteCount + ' adet Elit Saat fiyatı +%80 marj ve ' + usdRate + ' TL kuruyla güncellendi.');
  const fileContent = '// ==========================================================\n' +
    '// BELGİN SAAT — MASTER ÜRÜN VE KOLEKSİYON VERİTABANI\n' +
    '// Sürüm: ' + new Date().toISOString().slice(0, 10) + '.elite-usd-80margin-sync\n' +
    '// Toplam Yayın Ürünü: ' + updatedProducts.length + ' (200 Elit Saat + ' + (updatedProducts.length - 200) + ' Saat Kataloğu)\n' +
    '// ==========================================================\n\n' +
    'const ELITE_WATCH_BRANDS = ' + JSON.stringify(ELITE_WATCH_BRANDS, null, 2) + ';\n\n' +
    'const WATCH_BRANDS = ' + JSON.stringify(WATCH_BRANDS, null, 2) + ';\n\n' +
    'const JEWELRY_BRANDS = [];\n\n' +
    'const PRE_OWNED_ITEMS = ' + JSON.stringify(PRE_OWNED_ITEMS, null, 2) + ';\n\n' +
    'const PRODUCTS = ' + JSON.stringify(updatedProducts, null, 2) + ';\n\n' +
    'if (typeof module !== \'undefined\' && module.exports) {\n' +
    '  module.exports = {\n' +
    '    PRODUCTS,\n' +
    '    ELITE_WATCH_BRANDS,\n' +
    '    WATCH_BRANDS,\n' +
    '    JEWELRY_BRANDS,\n' +
    '    PRE_OWNED_ITEMS\n' +
    '  };\n' +
    '}\n\n' +
    'if (typeof window !== \'undefined\') {\n' +
    '  window.PRODUCTS = PRODUCTS;\n' +
    '  window.ELITE_WATCH_BRANDS = ELITE_WATCH_BRANDS;\n' +
    '  window.WATCH_BRANDS = WATCH_BRANDS;\n' +
    '  window.JEWELRY_BRANDS = JEWELRY_BRANDS;\n' +
    '  window.PRE_OWNED_ITEMS = PRE_OWNED_ITEMS;\n' +
    '}\n';

  fs.writeFileSync(dataJsPath, fileContent, 'utf8');
  console.log('💾 js/data.js dosyası başarıyla kaydedildi.');
}

if (require.main === module) {
  run().catch(console.error);
}
module.exports = { run, fetchLiveUsdRate, MARKET_MARKUP, DEFAULT_USD_RATE };
