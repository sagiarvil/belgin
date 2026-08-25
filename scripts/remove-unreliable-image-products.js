const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dataPath = path.join(root, 'js', 'data.js');
const guardPath = path.join(root, 'scripts', 'verify-product-catalog.js');
const testPath = path.join(root, 'tests', 'test-suite.js');

// These records depend on third-party/hotlink image hosts and are not safe to publish.
const removeIds = [1, 2, 4, 7, 8];

let data = fs.readFileSync(dataPath, 'utf8');
for (const id of removeIds) {
  const re = new RegExp(`\\n  \\{\\n    id: ${id},\\n[\\s\\S]*?\\n  \\},?`, 'm');
  if (!re.test(data)) throw new Error(`Product block not found: ${id}`);
  data = data.replace(re, '');
}
data = data.replace(/\n  "70524805": \{[^\n]+\},?/, '');
data = data.replace(/\n\n\n+/g, '\n\n');
fs.writeFileSync(dataPath, data, 'utf8');

let guard = fs.readFileSync(guardPath, 'utf8');
for (const id of removeIds) {
  const re = new RegExp(`\\n  \\[${id}, \\[.*?\\]\\],`, 'm');
  guard = guard.replace(re, '');
}
guard = guard.replace(
  /if \(!Array\.isArray\(PRODUCTS\) \|\| PRODUCTS\.length !== 16\) \{\n  fail\(`Expected 16 products, got \$\{PRODUCTS\?\.length \?\? 'invalid'\}`\);\n\}/,
  "if (!Array.isArray(PRODUCTS) || PRODUCTS.length !== expected.size) {\n  fail(`Expected ${expected.size} published products, got ${PRODUCTS?.length ?? 'invalid'}`);\n}"
);
guard = guard.replace(
  "if (!process.exitCode) console.log('CATALOG GUARD PASS: 16/16 product identities and images are mapped and traceable.');",
  "if (!process.exitCode) console.log(`CATALOG GUARD PASS: ${PRODUCTS.length}/${expected.size} published product identities and images are mapped and traceable.`);"
);
fs.writeFileSync(guardPath, guard, 'utf8');

let tests = fs.readFileSync(testPath, 'utf8');
tests = tests.replace(
  "assert(Array.isArray(PRODUCTS) && PRODUCTS.length === 16, 'Mücevher ve saat arşivinde tam 16 adet gerçek model mevcut');",
  "assert(Array.isArray(PRODUCTS) && PRODUCTS.length === WATCHES.length + JEWELLERY.length, 'Yayın kataloğunda yalnız görselli ve sınıflandırılmış ürünler mevcut');"
);
tests = tests.replace(
  "assert(Array.isArray(JEWELLERY) && JEWELLERY.length === 8, 'Mücevher koleksiyonunda 8 adet gerçek model mevcut (Cartier Juste un Clou, Love, Tiffany Setting)');",
  "assert(Array.isArray(JEWELLERY) && JEWELLERY.length === 3, 'Mücevher koleksiyonunda yalnız güvenilir görsel kaynağı olan 3 ürün yayında');"
);
tests = tests.replace(
  "assert(Array.isArray(PRE_OWNED_ITEMS) && PRE_OWNED_ITEMS.length >= 12, 'İkinci el altın ve saat koleksiyonunda en az 12 adet ekspertizli parça mevcut');",
  "assert(Array.isArray(PRE_OWNED_ITEMS) && PRE_OWNED_ITEMS.length >= 10, 'Yayın kataloğunda ikinci el ürün alt kümesi tutarlı');"
);
tests = tests.replace(
  "assert(Array.isArray(PRE_OWNED_GOLD) && PRE_OWNED_GOLD.length >= 6, 'İkinci el altın koleksiyonunda en az 6 adet masif altın parça mevcut');",
  "assert(Array.isArray(PRE_OWNED_GOLD) && PRE_OWNED_GOLD.length >= 2, 'Yayın kataloğunda görselli ikinci el altın ürünleri mevcut');"
);
tests = tests.replace(
  "assert(!missingAttributes, 'Her parçada marka, referans, maden, stok, kondisyon rozetleri ve orijinal API görsel URLsi eksiksiz tanımlı');",
  "assert(!missingAttributes, 'Her yayındaki üründe marka, referans, maden, stok, kondisyon ve görsel eksiksiz tanımlı');"
);
fs.writeFileSync(testPath, tests, 'utf8');

console.log(`REMOVED_PRODUCT_IDS=${removeIds.join(',')}`);
