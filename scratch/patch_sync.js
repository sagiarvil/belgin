const fs = require('fs');
let syncCode = fs.readFileSync('scripts/sync-prices-and-stock.js', 'utf8');

const oldSerializeRegex = /\/\/ js\/data\.js dosyasını serialize et[\s\S]*?fs\.writeFileSync\(dataJsPath,[\s\S]*?\);\n  console\.log\(`\[SYNC-ENGINE\] js\/data\.js başarıyla güncellendi\.\`\);/;

const newSerialize = `// js/data.js dosyasını serialize et ve kaydet
  const headerContent = fs.existsSync(path.join(__dirname, '../scratch/clean_header.js'))
    ? fs.readFileSync(path.join(__dirname, '../scratch/clean_header.js'), 'utf8')
    : 'const WATCH_BRANDS = [];\\nconst JEWELRY_BRANDS = [];\\n';
  
  const footerContent = fs.existsSync(path.join(__dirname, '../scratch/clean_footer.js'))
    ? fs.readFileSync(path.join(__dirname, '../scratch/clean_footer.js'), 'utf8')
    : 'const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);\\nif (typeof module !== "undefined" && module.exports) { module.exports = { PRODUCTS, WATCH_BRANDS, JEWELRY_BRANDS, WATCHES, JEWELLERY, PRE_OWNED_ITEMS, PRE_OWNED_GOLD, ALL_PRODUCTS: PRODUCTS }; }';

  const exportHeader = headerContent;
  const exportBody = \`const PRODUCTS = \${JSON.stringify(PRODUCTS, null, 2)};\\n\\n\`;
  const exportMiddle = \`const WATCHES = PRODUCTS.filter(p => (p.category === 'saat' || p.category === 'watch') && !p.isPreOwned);\\nconst JEWELLERY = PRODUCTS.filter(p => (p.category === 'jewelry' || p.category === 'jewellery') && !p.isPreOwned);\\nconst PRE_OWNED_ITEMS = PRODUCTS.filter(p => p.isPreOwned === true);\\n\`;
  const exportFooter = footerContent;

  fs.writeFileSync(dataJsPath, exportHeader + exportBody + exportMiddle + exportFooter, 'utf8');
  console.log(\`[SYNC-ENGINE] js/data.js başarıyla güncellendi.\`);`;

syncCode = syncCode.replace(oldSerializeRegex, newSerialize);
fs.writeFileSync('scripts/sync-prices-and-stock.js', syncCode, 'utf8');
console.log('scripts/sync-prices-and-stock.js patched successfully');
