'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'js', 'magazine_data.js');

if (!fs.existsSync(target)) {
  throw new Error('js/magazine_data.js bulunamadı');
}

const before = fs.readFileSync(target, 'utf8');
const sourcePattern = /(\"source_url\"\s*:\s*)\"[^\"]*\"/g;
const after = before.replace(sourcePattern, '$1\"\"');

fs.writeFileSync(target, after, 'utf8');

const remaining = [...after.matchAll(sourcePattern)].filter((m) => m[0] && !/\"source_url\"\s*:\s*\"\"/.test(m[0]));
if (remaining.length) {
  throw new Error(`Public magazine provenance temizlenemedi: ${remaining.length}`);
}

console.log('PUBLIC_MAGAZINE_PROVENANCE_SANITIZED');
