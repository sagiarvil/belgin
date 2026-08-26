const fs = require('fs');
const path = require('path');

// Extract WATCH_BRANDS, JEWELRY_BRANDS, CERTIFICATE_DB from HEAD~3
const { execSync } = require('child_process');
const originalHeader = execSync('git show HEAD~3:js/data.js | head -n 100', { encoding: 'utf8' });
const originalFooter = execSync('git show HEAD~3:js/data.js | tail -n 120', { encoding: 'utf8' });

const watchBrandsIdx = originalHeader.indexOf('const WATCH_BRANDS = [');
const watchBrandsEndIdx = originalHeader.indexOf('const PRODUCTS = [');
const brandsHeader = originalHeader.slice(watchBrandsIdx, watchBrandsEndIdx);

const certDbIdx = originalFooter.indexOf('const PRE_OWNED_GOLD =');
const fullFooter = originalFooter.slice(certDbIdx);

console.log('Extracted brandsHeader and fullFooter.');

// Update scripts/sync-prices-and-stock.js
let syncCode = fs.readFileSync('scripts/sync-prices-and-stock.js', 'utf8');

const oldSerializeRegex = /\/\/ js\/data\.js dosyasını serialize et[\s\S]*?fs\.writeFileSync\(dataJsPath,[\s\S]*?\);\n  console\.log\(`\[SYNC-ENGINE\] js\/data\.js başarıyla güncellendi\.\`\);/;

const newSerialize = `// js/data.js dosyasını serialize et ve kaydet
  const exportHeader = \`/**\\n * BELGİN KUYUMCULUK - CANLI MASTER KATALOG\\n * Son Fiyat/Stok Senkronizasyonu: \${new Date().toISOString()}\\n */\\n\\n\${${JSON.stringify(brandsHeader)}};\` + '\\n\\n';
  const exportBody = \`const PRODUCTS = \${JSON.stringify(PRODUCTS, null, 2)};\\n\\n\`;
  const exportFooter = \`const WATCHES = PRODUCTS.filter(p => (p.category === 'saat' || p.category === 'watch') && !p.isPreOwned);\\nconst JEWELLERY = PRODUCTS.filter(p => (p.category === 'jewelry' || p.category === 'jewellery') && !p.isPreOwned);\\nconst PRE_OWNED_ITEMS = PRODUCTS.filter(p => p.isPreOwned === true);\\n\${${JSON.stringify(fullFooter)}}\`;

  fs.writeFileSync(dataJsPath, exportHeader + exportBody + exportFooter, 'utf8');
  console.log(\`[SYNC-ENGINE] js/data.js başarıyla güncellendi.\`);`;

syncCode = syncCode.replace(oldSerializeRegex, newSerialize);
fs.writeFileSync('scripts/sync-prices-and-stock.js', syncCode, 'utf8');
console.log('scripts/sync-prices-and-stock.js updated with complete brands and certs database.');
