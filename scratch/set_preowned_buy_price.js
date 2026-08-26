const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../js/data.js');
const { PRODUCTS } = require(dataPath);

let updatedCount = 0;
for (const p of PRODUCTS) {
  if (p.isPreOwned === true) {
    p.buyPrice = p.price - 500;
    updatedCount++;
  }
}

const headerContent = fs.existsSync(path.join(__dirname, 'clean_header.js'))
  ? fs.readFileSync(path.join(__dirname, 'clean_header.js'), 'utf8')
  : 'const WATCH_BRANDS = [];\nconst JEWELRY_BRANDS = [];\n';

const footerContent = fs.existsSync(path.join(__dirname, 'clean_footer.js'))
  ? fs.readFileSync(path.join(__dirname, 'clean_footer.js'), 'utf8')
  : 'const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);\nif (typeof module !== "undefined" && module.exports) { module.exports = { PRODUCTS, WATCH_BRANDS, JEWELRY_BRANDS, WATCHES, JEWELLERY, PRE_OWNED_ITEMS, PRE_OWNED_GOLD, ALL_PRODUCTS: PRODUCTS }; }';

const exportHeader = headerContent;
const exportBody = `const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};\n\n`;
const exportMiddle = `const WATCHES = PRODUCTS.filter(p => (p.category === 'saat' || p.category === 'watch') && !p.isPreOwned);\nconst JEWELLERY = PRODUCTS.filter(p => (p.category === 'jewelry' || p.category === 'jewellery') && !p.isPreOwned);\nconst PRE_OWNED_ITEMS = PRODUCTS.filter(p => p.isPreOwned === true);\n`;
const exportFooter = footerContent;

fs.writeFileSync(dataPath, exportHeader + exportBody + exportMiddle + exportFooter, 'utf8');
console.log(`Updated ${updatedCount} pre-owned products in js/data.js with buyPrice = price - 500 TL.`);

// 2. Update js/app.js fallback
const appJsPath = path.join(__dirname, '../js/app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');
appJs = appJs.replace(/\(p\.price\s*-\s*5000\)/g, '(p.price - 500)');
fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('Updated fallback (p.price - 500) in js/app.js.');

// 3. Regenerate payment & SEO catalogs
const { execSync } = require('child_process');
execSync('node scripts/generate-payment-catalog.js', { stdio: 'inherit' });
execSync('node scripts/generate-seo-assets.js', { stdio: 'inherit' });
execSync('node scripts/verify-product-catalog.js', { stdio: 'inherit' });
console.log('Catalogs regenerated.');
