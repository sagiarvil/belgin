import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIREBASE_FILE = path.join(ROOT, 'firebase.json');
const dryRun = process.argv.includes('--dry-run');

const config = JSON.parse(readFileSync(FIREBASE_FILE, 'utf8'));
if (!config.hosting || !Array.isArray(config.hosting.redirects)) {
  throw new Error('firebase.json hosting.redirects bulunamadı');
}

const target = { source: '/index.html', destination: '/', type: 301 };
const conflicts = config.hosting.redirects.filter((r) => r?.source === '/index.html');
if (conflicts.some((r) => r.destination !== '/' || Number(r.type) !== 301)) {
  throw new Error(`/index.html için çakışan redirect bulundu: ${JSON.stringify(conflicts)}`);
}

if (!conflicts.length) {
  config.hosting.redirects.unshift(target);
}

const effective = config.hosting.redirects.filter((r) => r?.source === '/index.html');
if (effective.length !== 1 || effective[0].destination !== '/' || Number(effective[0].type) !== 301) {
  throw new Error('/index.html → / 301 canonical redirect sözleşmesi sağlanamadı');
}

if (!dryRun) {
  writeFileSync(FIREBASE_FILE, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

console.log(`BELGIN_INDEX_CANONICAL_REDIRECT_OK mode=${dryRun ? 'dry-run' : 'write'} source=/index.html destination=/ type=301`);
