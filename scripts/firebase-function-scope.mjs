import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const entry = path.join(root, 'functions', 'index.js');
const source = fs.readFileSync(entry, 'utf8');

if (/\bmodule\.exports\s*=/.test(source) || /Object\.assign\s*\(\s*exports\b/.test(source)) {
  throw new Error('Unsupported dynamic Firebase export pattern detected; deploy scope cannot be proven safely.');
}

const names = [...source.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g)]
  .map((match) => match[1]);
const unique = [...new Set(names)].sort();

const required = ['createPayTRToken', 'paytrCallback', 'getOrderStatus'];
for (const name of required) {
  if (!unique.includes(name)) throw new Error(`Required Belgin Firebase export missing: ${name}`);
}

if (unique.length < required.length) {
  throw new Error('Belgin Firebase export scope is unexpectedly empty.');
}

process.stdout.write(unique.map((name) => `functions:${name}`).join(','));
