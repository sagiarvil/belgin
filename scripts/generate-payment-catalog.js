const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('../js/data.js');

if (!Array.isArray(PRODUCTS) || PRODUCTS.length === 0) {
  throw new Error('PRODUCTS kataloğu boş veya okunamıyor.');
}

const catalog = Object.fromEntries(
  PRODUCTS.map((product) => {
    const id = String(product.id);
    const price = Number(product.price);
    if (!id || !Number.isFinite(price) || price <= 0) {
      throw new Error(`Geçersiz ürün fiyat kaydı: ${id || 'ID_YOK'}`);
    }

    return [id, {
      id,
      name: String(product.name || 'Ürün'),
      brand: String(product.brand || ''),
      price,
      category: String(product.category || ''),
      isGold: product.isGold === true,
      metal: String(product.metal || ''),
      inStock: product.inStock !== false,
    }];
  })
);

const outputPath = path.join(__dirname, '..', 'functions', 'product-catalog.json');
fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

const paytrPath = path.join(__dirname, '..', 'paytr_products.json');
const paytrList = PRODUCTS.map((product) => ({
  id: product.id,
  name: String(product.name || 'Ürün'),
  brand: String(product.brand || ''),
  price: Number(product.price),
  inStock: product.inStock !== false
}));
fs.writeFileSync(paytrPath, `${JSON.stringify(paytrList, null, 2)}\n`, 'utf8');

console.log(`✅ Ödeme kataloğu üretildi: ${Object.keys(catalog).length} ürün (functions/product-catalog.json & paytr_products.json)`);
