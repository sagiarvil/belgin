import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const entry = path.join(root, 'functions', 'index.js');
const bootstrapEntry = path.join(root, 'functions', 'bootstrap.js');
const source = fs.readFileSync(entry, 'utf8');
const bootstrapSource = fs.existsSync(bootstrapEntry) ? fs.readFileSync(bootstrapEntry, 'utf8') : '';

if (/\bmodule\.exports\s*=/.test(source) || /Object\.assign\s*\(\s*exports\b/.test(source)) {
  throw new Error('Unsupported dynamic Firebase export pattern detected; deploy scope cannot be proven safely.');
}

const names = [...source.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g)]
  .map((match) => match[1]);
const unique = [...new Set(names)].sort();

// bootstrap.js is the configured Functions entrypoint and may add deliberately isolated
// exports on top of index.js. Keep this allowlist explicit so deploy scope never expands by accident.
const bootstrapAllowlist = ['ziraatPaymentCallback'];
for (const name of bootstrapAllowlist) {
  const imported = new RegExp(`\\b${name}\\b`).test(bootstrapSource);
  const exported = new RegExp(`\\b${name}\\s*,`).test(bootstrapSource);
  if (imported && exported && !unique.includes(name)) unique.push(name);
}
unique.sort();

const required = ['createPayTRToken', 'paytrCallback', 'getOrderStatus'];
for (const name of required) {
  if (!unique.includes(name)) throw new Error(`Required Belgin Firebase export missing: ${name}`);
}

if (bootstrapSource.includes('ziraatPaymentCallback') && !unique.includes('ziraatPaymentCallback')) {
  throw new Error('Ziraat callback bootstrap export exists but deploy scope cannot prove it.');
}

if (unique.length < required.length) {
  throw new Error('Belgin Firebase export scope is unexpectedly empty.');
}

process.stdout.write(unique.map((name) => `functions:${name}`).join(','));