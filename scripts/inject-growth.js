'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = '<script src="/js/growth.js" defer></script>';
const SKIP_DIRS = new Set(['.git', 'node_modules', 'functions', 'tests', 'scripts', 'scratch']);
let changed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.') continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    if (rel.startsWith('docs/')) continue;
    let html = fs.readFileSync(full, 'utf8');
    if (html.includes('/js/growth.js')) continue;
    if (!html.includes('</head>')) continue;
    html = html.replace('</head>', `  ${SCRIPT}\n</head>`);
    fs.writeFileSync(full, html, 'utf8');
    changed++;
  }
}

walk(ROOT);
console.log(`[growth-inject] instrumented_html=${changed}`);
