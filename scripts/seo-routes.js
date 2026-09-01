'use strict';

const { BASE_URL } = require('./seo-registry.js');

const CATEGORY_ROUTES = Object.freeze({
  'ana-sayfa': '/',
  'elit-kategori': '/elit-kategori/',
  'elit-saatler': '/elit-kategori/',
  'markalar': '/markalar/',
  'saatler': '/saatler/',
  'mucevherat': '/mucevherat/'
});

function slugify(value) {
  const tr = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
  };

  return String(value ?? '')
    .split('')
    .map(ch => tr[ch] ?? ch)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function productReference(product) {
  return String(
    product.reference || product.ref || product.sku || product.mpn || product.id
  ).trim();
}

function productSlug(product) {
  const base = slugify(`${product.brand || 'urun'}-${productReference(product)}`);
  return `${base || 'urun'}-${slugify(product.id)}`;
}

function productRoute(product) {
  return `/urun/${productSlug(product)}/`;
}

function productUrl(product) {
  return `${BASE_URL}${productRoute(product)}`;
}

function routeForPage(page) {
  return CATEGORY_ROUTES[page] || '/';
}

module.exports = {
  BASE_URL,
  CATEGORY_ROUTES,
  slugify,
  productReference,
  productSlug,
  productRoute,
  productUrl,
  routeForPage
};
