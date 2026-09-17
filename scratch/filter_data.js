const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../js/data.js');
const { ELITE_WATCH_BRANDS, WATCH_BRANDS, JEWELRY_BRANDS, PRE_OWNED_ITEMS, PRODUCTS } = require(dataFile);

console.log(`Initial PRODUCTS count: ${PRODUCTS.length}`);

// Filter out watches over 1799000
const filteredProducts = PRODUCTS.filter(p => {
    // Is it a watch?
    const isWatch = p.category === 'saat' || p.category === 'watch' || 
                    ELITE_WATCH_BRANDS.some(b => b.name === p.brand) || 
                    WATCH_BRANDS.some(b => b.name === p.brand);
                    
    if (isWatch && p.price > 1799000) {
        return false; // Remove
    }
    return true; // Keep
});

console.log(`Filtered PRODUCTS count: ${filteredProducts.length}`);
const removed = PRODUCTS.length - filteredProducts.length;
console.log(`Removed ${removed} watches.`);

// Now rebuild data.js
const newContent = `// ==========================================================
// BELGİN SAAT — MASTER ÜRÜN VE KOLEKSİYON VERİTABANI
// Sürüm: 2026-09-04.elite-usd-80margin-sync
// Toplam Yayın Ürünü: ${filteredProducts.length}
// ==========================================================

const ELITE_WATCH_BRANDS = ${JSON.stringify(ELITE_WATCH_BRANDS, null, 2)};
const WATCH_BRANDS = ${JSON.stringify(WATCH_BRANDS, null, 2)};
const JEWELRY_BRANDS = ${JSON.stringify(JEWELRY_BRANDS, null, 2)};
const PRE_OWNED_ITEMS = ${JSON.stringify(PRE_OWNED_ITEMS, null, 2)};
const PRODUCTS = ${JSON.stringify(filteredProducts, null, 2)};

const WATCHES = PRODUCTS.filter(p => (p.category === 'saat' || p.category === 'watch') && !p.isPreOwned);
const JEWELLERY = PRODUCTS.filter(p => (p.category === 'jewelry' || p.category === 'jewellery') && !p.isPreOwned);
const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRODUCTS,
    ELITE_WATCH_BRANDS,
    WATCH_BRANDS,
    JEWELRY_BRANDS,
    WATCHES,
    JEWELLERY,
    PRE_OWNED_ITEMS,
    PRE_OWNED_GOLD,
    ALL_PRODUCTS: PRODUCTS
  };
}

if (typeof window !== 'undefined') {
  window.PRODUCTS = PRODUCTS;
  window.ELITE_WATCH_BRANDS = ELITE_WATCH_BRANDS;
  window.WATCH_BRANDS = WATCH_BRANDS;
  window.JEWELRY_BRANDS = JEWELRY_BRANDS;
  window.WATCHES = WATCHES;
  window.JEWELLERY = JEWELLERY;
  window.PRE_OWNED_ITEMS = PRE_OWNED_ITEMS;
  window.PRE_OWNED_GOLD = PRE_OWNED_GOLD;
}
`;

fs.writeFileSync(dataFile, newContent, 'utf-8');
console.log('Successfully updated js/data.js');
