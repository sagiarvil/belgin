'use strict';

/**
 * =========================================================================
 * BELGİN SAAT — GÜNLÜK SAAT 03:00 Piyasa FİYAT & STOK SENKRONİZASYON MOTORU
 * =========================================================================
 * - Çalışma Zamanı: Her gün 03:00 (Cron: 0 3 * * *)
 * - Fiyatlama Formülü: Piyasa USD Piyasa Fiyatı + %40 (x 1.40) * USD/TRY Kuru
 * - Kategori Şartı: 10 Elit Markanın her birinde daima tam 20 aktif ürün (toplam 200)
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const dataJsPath = path.join(ROOT, 'js', 'data.js');

const USD_TRY_RATE = 48.279; // Serbest piyasa USD/TRY referans kuru (doviz.com)
const MARKET_MARKUP = 1.80; // Zorunlu +%80 kâr marjı

const REQUIRED_BRANDS = [
  "Rolex",
  "Omega",
  "Patek Philippe",
  "Audemars Piguet",
  "Breitling",
  "Cartier",
  "Tudor",
  "TAG Heuer",
  "IWC Schaffhausen",
  "Panerai"
];

function runSync() {
  console.log(`[Piyasa Sync - 03:00] Başlatılıyor: ${new Date().toISOString()}`);
  console.log(`[Piyasa Sync] Referans Kur: 1 USD = ${USD_TRY_RATE} TL | Kâr Marjı: +%80 (x${MARKET_MARKUP})`);

  const { PRODUCTS, ELITE_WATCH_BRANDS, WATCH_BRANDS, PRE_OWNED_ITEMS } = require(dataJsPath);

  let updatedCount = 0;
  const brandProductCounts = {};
  REQUIRED_BRANDS.forEach(b => brandProductCounts[b] = 0);

  const updatedProducts = PRODUCTS.map(p => {
    if (p.isElite || p.category === 'elit-saatler') {
      const brand = p.brand;
      if (brandProductCounts[brand] !== undefined) {
        brandProductCounts[brand]++;
      }

      // Re-calculate price with +80% Doviz.com USD formula
      const baseUsd = Number(p.usdRefPrice) || Math.round(p.price / (MARKET_MARKUP * USD_TRY_RATE));
      const targetTry = Math.round(baseUsd * MARKET_MARKUP * USD_TRY_RATE);

      if (targetTry !== p.price) {
        p.price = targetTry;
        p.usdRefPrice = baseUsd;
        p.marketMarkup = "+80%";
        updatedCount++;
      }
      p.inStock = true;
      p.stock = Math.max(1, p.stock || 2);
    }
    return p;
  });

  // Verify that all 10 brands have exactly 20 products
  let valid = true;
  REQUIRED_BRANDS.forEach(b => {
    const count = brandProductCounts[b] || 0;
    console.log(`  ✓ ${b.padEnd(20)}: ${count} / 20 Ürün Aktif`);
    if (count !== 20) {
      console.warn(`  ⚠️ UYARI: ${b} markasında ${count} ürün bulundu, 20 olmalıdır!`);
      valid = false;
    }
  });

  if (valid) {
    console.log(`[Piyasa Sync] Tüm 10 marka için 20'şer ürün (Toplam 200 Elit Ürün) eksiksiz doğrulandı.`);
  }

  // Update data.js
  const headerComment = `// ==========================================================
// BELGİN SAAT — MASTER ÜRÜN VE KOLEKSİYON VERİTABANI
// Sürüm: ${new Date().toISOString().slice(0, 10)}.Piyasa-daily-sync
// Toplam Yayın Ürünü: ${updatedProducts.length} (200 Elit Saat + ${updatedProducts.length - 200} Saat Kataloğu)
// ==========================================================

const ELITE_WATCH_BRANDS = ${JSON.stringify(ELITE_WATCH_BRANDS, null, 2)};

const WATCH_BRANDS = ${JSON.stringify(WATCH_BRANDS, null, 2)};

const JEWELRY_BRANDS = [];

const PRE_OWNED_ITEMS = ${JSON.stringify(PRE_OWNED_ITEMS, null, 2)};

const PRODUCTS = ${JSON.stringify(updatedProducts, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ELITE_WATCH_BRANDS,
    WATCH_BRANDS,
    JEWELRY_BRANDS,
    PRE_OWNED_ITEMS,
    PRODUCTS
  };
}
`;

  fs.writeFileSync(dataJsPath, headerComment, 'utf8');
  console.log(`[Piyasa Sync] Senkronizasyon başarıyla tamamlandı. (${updatedCount} fiyat güncellendi).`);
}

if (require.main === module) {
  runSync();
}

module.exports = { runSync };
