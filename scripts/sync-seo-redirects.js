'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const firebasePath = path.join(ROOT, 'firebase.json');
const registryPath = path.join(ROOT, 'scripts', 'seo-retired-products.json');

const firebase = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const managed = (registry.redirects || []).map(r => ({
  source: r.from.replace(/\/$/, ''),
  destination: r.to,
  type: Number(r.type || 301)
}));

const existing = firebase.hosting?.redirects || [];

for (const r of managed) {
  if (r.source === r.destination) {
    throw new Error(`Self redirect loop detected: ${r.source}`);
  }
}

if (!firebase.hosting) {
  firebase.hosting = {};
}

firebase.hosting.redirects = [
  ...existing.filter(r => !String(r.source || '').startsWith('/urun/')),
  ...managed
];

fs.writeFileSync(
  firebasePath,
  `${JSON.stringify(firebase, null, 2)}\n`,
  'utf8'
);

console.log(`[seo-redirects] ${managed.length} yönetilen yönlendirme firebase.json ile senkronize edildi.`);
