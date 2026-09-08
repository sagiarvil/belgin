#!/usr/bin/env node
/**
 * BELGIN KUYUMCULUK — ALTIN FİYAT SENKRONİZASYON MOTORU
 * 
 * Amaç: Sarı Tabela (#canli-fiyatlar) nihai canlı satış fiyatları (Primary: İZKO Satış, Fallback: Harem) ile
 * katalogdaki ve ürün detay sayfalarındaki altın ürünlerini %100 birebir eşlemek.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const dataJsPath = path.join(ROOT_DIR, 'js/data.js');

function syncHaremPricesToCatalog(rates) {
  let content = fs.readFileSync(dataJsPath, 'utf8');
  const startIdx = content.indexOf('const PRODUCTS = [');
  if (startIdx === -1) {
    throw new Error('PRODUCTS array not found in js/data.js');
  }
  const endIdx = content.indexOf('\n];', startIdx) + 3;
  const jsonStr = content.substring(startIdx + 'const PRODUCTS = '.length, endIdx - 1);
  const PRODUCTS = JSON.parse(jsonStr);

  const pGram = rates.pGram || 6873;
  const p22k = rates.p22k || 6441;
  const p18k = rates.p18k || 5152;
  const p14k = rates.p14k || 4972;
  const pCeyrekYeni = rates.pCeyrekYeni || 11243;
  const pCeyrekEski = rates.pCeyrekEski || 11035;
  const pYarimYeni = rates.pYarimYeni || 22462;
  const pYarimEski = rates.pYarimEski || 22037;
  const pZiynetYeni = rates.pZiynetYeni || 44761;
  const pZiynetEski = rates.pZiynetEski || 44142;
  const pAtaYeni = rates.pAtaYeni || 45551;
  const pAtaEski = rates.pAtaEski || 45448;

  let updatedCount = 0;

  for (const p of PRODUCTS) {
    if (!p.isGold && p.category !== 'gold' && !p.subCategory?.includes('Ziynet') && !p.subCategory?.includes('Külçe') && !p.subCategory?.includes('Bilezik')) {
      continue;
    }

    const name = (p.name || '').toLowerCase();
    let exactTargetPrice = null;

    // 1. Çeyrek Altın
    if (name.includes('çeyrek')) {
      if (name.includes('ata')) {
        exactTargetPrice = name.includes('eski') ? Math.round(pAtaEski * 0.25) : Math.round(pAtaYeni * 0.25);
      } else {
        exactTargetPrice = name.includes('eski') ? pCeyrekEski : pCeyrekYeni;
      }
    }
    // 2. Yarım Altın
    else if (name.includes('yarım')) {
      if (name.includes('ata')) {
        exactTargetPrice = name.includes('eski') ? Math.round(pAtaEski * 0.5) : Math.round(pAtaYeni * 0.5);
      } else {
        exactTargetPrice = name.includes('eski') ? pYarimEski : pYarimYeni;
      }
    }
    // 3. Ata Altın (Tam, Beşli, 2.5'luk vb.)
    else if (name.includes('ata')) {
      const isEski = name.includes('eski');
      if (name.includes('beşli')) {
        exactTargetPrice = 5 * (isEski ? pAtaEski : pAtaYeni);
      } else if (name.includes('2.5') || name.includes('gremse')) {
        exactTargetPrice = Math.round(2.5 * (isEski ? pAtaEski : pAtaYeni));
      } else {
        exactTargetPrice = isEski ? pAtaEski : pAtaYeni;
      }
    }
    // 4. Ziynet / Tam Altın / Reşat / Beşli / Gremse
    else if (name.includes('tam altın') || name.includes('ziynet') || name.includes('reşat')) {
      const isEski = name.includes('eski');
      if (name.includes('beşli') || name.includes('5 tam')) {
        exactTargetPrice = 5 * (isEski ? pZiynetEski : pZiynetYeni);
      } else if (name.includes('2.5') || name.includes('gremse')) {
        exactTargetPrice = Math.round(2.5 * (isEski ? pZiynetEski : pZiynetYeni));
      } else if (name.includes('3 tam')) {
        exactTargetPrice = 3 * pZiynetYeni;
      } else {
        exactTargetPrice = isEski ? pZiynetEski : pZiynetYeni;
      }
    }
    // 5. 22 Ayar Bilezikler
    else if (name.includes('22 ayar') && name.includes('bilezik')) {
      const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
      const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
      exactTargetPrice = Math.round(gram * p22k);
    }
    // 6. 14 Ayar Bilezikler
    else if (name.includes('14 ayar') && name.includes('bilezik')) {
      const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
      const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
      exactTargetPrice = Math.round(gram * p14k);
    }
    // 7. Külçe / Gram Altın
    else if (name.includes('külçe') || name.includes('gram altın') || name.includes('has altın')) {
      const gramMatch = name.match(/(\d+)\s*(?:gr|gram|kg|kilogram)/i);
      let gram = 1;
      if (name.includes('1 kg') || name.includes('1 kilogram')) gram = 1000;
      else if (gramMatch) gram = parseFloat(gramMatch[1]);
      exactTargetPrice = Math.round(gram * pGram);
    }

    if (exactTargetPrice && exactTargetPrice > 0) {
      if (p.price !== exactTargetPrice) {
        p.price = exactTargetPrice;
        updatedCount++;
      }
    }
  }

  const updatedProductsBlock = `const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};`;
  const updatedDataJs = content.substring(0, startIdx) + updatedProductsBlock + content.substring(endIdx);
  fs.writeFileSync(dataJsPath, updatedDataJs, 'utf8');

  console.log(`[HAREM-SYNC] ${updatedCount} altın ürününün fiyatı Sarı Tabela ile 1:1 senkronize edildi.`);

  // PayTR Ödeme Kataloğu ve SEO Varlıklarını Yenile
  try {
    execSync('node scripts/generate-payment-catalog.js', { stdio: 'inherit' });
    execSync('node scripts/generate-seo-assets.js', { stdio: 'inherit' });
  } catch (err) {
    console.warn('[PRICING-SYNC] Katalog üretimi uyarısı:', err.message);
  }
}

// Canonical Rates (Primary: İZKO Satış / Fallback: Harem Satış - Marjsız 1.00x)
let cacheRates = null;
const cacheFile = path.join(ROOT_DIR, 'izko-rates-cache.json');
if (fs.existsSync(cacheFile)) {
  try {
    cacheRates = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch (e) {}
}

const defaultRates = {
  pGram: cacheRates?.gramGold24k || cacheRates?.hasAltin || 6826,
  p22k: cacheRates?.gramGold22k || 6420,
  p18k: cacheRates?.gramGold18k || 6150,
  p14k: cacheRates?.gramGold14k || 5700,
  pCeyrekYeni: cacheRates?.quarterGold || 11300,
  pCeyrekEski: cacheRates?.oldQuarterGold || 11100,
  pYarimYeni: cacheRates?.halfGold || 22600,
  pYarimEski: cacheRates?.oldHalfGold || 22200,
  pZiynetYeni: cacheRates?.fullGold || 45200,
  pZiynetEski: cacheRates?.oldFullGold || 44400,
  pAtaYeni: cacheRates?.ataGold || 45450,
  pAtaEski: cacheRates?.oldAtaGold || cacheRates?.ataGold || 45159
};

syncHaremPricesToCatalog(defaultRates);

module.exports = { syncHaremPricesToCatalog, defaultRates };
