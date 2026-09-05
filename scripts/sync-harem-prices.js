#!/usr/bin/env node
/**
 * BELGIN KUYUMCULUK — HAREM ALTIN %100 BİREBİR SENKRONİZASYON MOTORU
 * 
 * Amaç: Sarı Tabela (#canli-fiyatlar) nihai canlı satış fiyatları (+%2 marj) ile
 * katalogdaki ve ürün detay sayfalarındaki altın ürünlerini %100 birebir eşlemek.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const dataJsPath = path.join(ROOT_DIR, 'js/data.js');

function syncHaremPricesToCatalog(rates) {
  let content = fs.readFileSync(dataJsPath, 'utf8');
  const match = content.match(/const PRODUCTS = (\[[\s\S]*?\n\]);/);
  if (!match) {
    throw new Error('PRODUCTS array not found in js/data.js');
  }

  const PRODUCTS = JSON.parse(match[1]);

  const pGram = rates.pGram || 6962;
  const p22k = rates.p22k || 6524;
  const p18k = rates.p18k || 5220;
  const p14k = rates.p14k || 5030;
  const pCeyrekYeni = rates.pCeyrekYeni || 11381;
  const pCeyrekEski = rates.pCeyrekEski || 11179;
  const pYarimYeni = rates.pYarimYeni || 22753;
  const pYarimEski = rates.pYarimEski || 22322;
  const pZiynetYeni = rates.pZiynetYeni || 45340;
  const pZiynetEski = rates.pZiynetEski || 44714;
  const pAtaYeni = rates.pAtaYeni || 46107;
  const pAtaEski = rates.pAtaEski || 46037;

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
    // 3. Ziynet / Tam Altın / Reşat / Beşli / Gremse
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
    // 4. Ata Altın
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
  const updatedDataJs = content.replace(/const PRODUCTS = \[[\\s\\S]*?\\n\];/, updatedProductsBlock);
  fs.writeFileSync(dataJsPath, updatedDataJs, 'utf8');

  console.log(`[HAREM-SYNC] ${updatedCount} altın ürününün fiyatı Sarı Tabela ile 1:1 senkronize edildi.`);

  // PayTR Ödeme Kataloğu ve SEO Varlıklarını Yenile
  try {
    execSync('node scripts/generate-payment-catalog.js', { stdio: 'inherit' });
    execSync('node scripts/generate-seo-assets.js', { stdio: 'inherit' });
  } catch (err) {
    console.warn('[HAREM-SYNC] Katalog üretimi uyarısı:', err.message);
  }
}

// Default Harem Altin Live Rates (+%2 Margin)
const defaultRates = {
  pGram: 7031,
  p22k: 6589,
  p18k: 5272,
  p14k: 5080,
  pCeyrekYeni: 11494,
  pCeyrekEski: 11290,
  pYarimYeni: 22978,
  pYarimEski: 22543,
  pZiynetYeni: 45789,
  pZiynetEski: 45157,
  pAtaYeni: 46563,
  pAtaEski: 46493
};

syncHaremPricesToCatalog(defaultRates);
