const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');

const SCRIPT = '<script src="js/hero-motion-v2.js?v=2026.08.30.0855"></script>';

// Idempotent: remove any previous v2 loader before inserting the canonical one.
html = html.replace(/\n?<script src="js\/hero-motion-v2\.js\?v=[^"]+"><\/script>/g, '');

const anchor = '<script src="js/legal-overrides.js?v=2026.08.29.1255"></script>';
if (!html.includes(anchor)) {
  throw new Error('[hero-motion-v2] legal-overrides anchor not found; refusing non-deterministic injection');
}

html = html.replace(anchor, `${anchor}\n${SCRIPT}`);
fs.writeFileSync(file, html, 'utf8');

if (!html.includes(SCRIPT)) {
  throw new Error('[hero-motion-v2] injection verification failed');
}

console.log('[hero-motion-v2] deterministic loader injected.');
