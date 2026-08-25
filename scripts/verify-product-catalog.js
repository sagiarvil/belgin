const { PRODUCTS } = require('../js/data.js');

const expected = new Map([
  [101, ['TAG Heuer', 'WDA2114.BA0043']],
  [102, ['TAG Heuer', 'CBN2A1AA.FT6228']],
  [103, ['TAG Heuer', 'CAZ101N.FC8243']],
  [104, ['TAG Heuer', 'WAZ1110.FT8023']],
  [105, ['Longines', 'L3.781.4.56.6']],
  [106, ['Longines', 'L2.909.4.78.3']],
  [107, ['Rado', 'R32105353']],
  [108, ['Rado', 'R27086162']],
  [3, ['Cartier', 'B6067417']],
  [5, ['Cartier', 'B4085000']],
  [6, ['Cartier', 'B6048217']]
]);

function fail(message) {
  console.error(`CATALOG GUARD: ${message}`);
  process.exitCode = 1;
}

if (!Array.isArray(PRODUCTS) || PRODUCTS.length !== expected.size) {
  fail(`Expected ${expected.size} published products, got ${PRODUCTS?.length ?? 'invalid'}`);
}

const refs = new Set();
for (const product of PRODUCTS) {
  const rule = expected.get(product.id);
  if (!rule) {
    fail(`Unexpected product id ${product.id}`);
    continue;
  }

  const [brand, ref] = rule;
  if (product.brand !== brand) fail(`Product ${product.id}: expected brand ${brand}, got ${product.brand}`);
  if (!String(product.reference).startsWith(ref)) fail(`Product ${product.id}: reference must start with ${ref}`);
  if (!product.name || !product.image || !product.hoverImage || !product.sourceUrl) fail(`Product ${product.id}: missing name/image/hoverImage/sourceUrl`);
  if (!String(product.image).startsWith('https://')) fail(`Product ${product.id}: image must use HTTPS`);
  if (!String(product.sourceUrl).startsWith('https://')) fail(`Product ${product.id}: sourceUrl must use HTTPS`);
  if (String(product.image).includes('artjewellerywatches.com/api/photo/')) fail(`Product ${product.id}: legacy random photo endpoint is forbidden`);

  const normalizedRef = String(product.reference).split('·')[0].trim();
  if (refs.has(normalizedRef)) fail(`Duplicate product reference ${normalizedRef}`);
  refs.add(normalizedRef);
}

if (!process.exitCode) console.log(`CATALOG GUARD PASS: ${PRODUCTS.length}/${expected.size} published product identities and images are mapped and traceable.`);
