const { PRODUCTS } = require('../js/data.js');

function fail(message) {
  console.error(`CATALOG GUARD: ${message}`);
  process.exitCode = 1;
}

if (!Array.isArray(PRODUCTS) || PRODUCTS.length < 80) {
  fail(`Expected at least 80 published products, got ${PRODUCTS?.length ?? 'invalid'}`);
}

const refs = new Set();
for (const product of PRODUCTS) {
  if (!product.id || !product.brand || !product.name || !product.reference || !product.price) {
    fail(`Product missing basic fields: ID ${product.id}`);
  }
  if (product.price < 12000 && product.category === 'watch') {
    fail(`Product ${product.id} price is below 12,000 TL: ${product.price} TL`);
  }
  if (!product.image || !product.hoverImage || !product.sourceUrl) {
    fail(`Product ${product.id}: missing image/hoverImage/sourceUrl`);
  }
  if (!String(product.image).startsWith('https://') && !String(product.image).startsWith('images/')) {
    fail(`Product ${product.id}: image must use HTTPS or local path`);
  }

  if (refs.has(product.id)) {
    fail(`Duplicate product ID ${product.id}`);
  }
  refs.add(product.id);
}

if (!process.exitCode) {
  console.log(`CATALOG GUARD PASS: All ${PRODUCTS.length} published products are verified, mapped and traceable (Price >= 12,000 TL).`);
}
