'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const needle = String.fromCharCode(99, 104, 114, 111, 110, 111, 50, 52).toLowerCase();

const excludedDirs = new Set([
  '.git', '.github', 'node_modules', 'scripts', 'tests', 'scratch', 'docs', 'functions',
  '.venv', 'coverage', 'artifacts'
]);
const excludedRootFiles = new Set([
  'AGENTS.md', 'SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md', 'README.md', 'DESIGN.md'
]);
const allowedExt = new Set(['.html', '.htm', '.js', '.json', '.txt', '.xml', '.md', '.css']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (excludedDirs.has(entry.name)) continue;
      walk(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!rel.includes('/') && excludedRootFiles.has(rel)) continue;
    if (!allowedExt.has(path.extname(entry.name).toLowerCase())) continue;
    out.push(rel);
  }
  return out;
}

const hits = [];
for (const rel of walk(ROOT)) {
  let text;
  try {
    text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].toLowerCase().includes(needle)) {
      hits.push(`${rel}:${i + 1}:${lines[i].trim()}`);
    }
  }
}

if (hits.length) {
  console.error('PROHIBITED_VENDOR_GUARD_FAIL');
  console.error(hits.join('\n'));
  process.exit(1);
}

console.log('PROHIBITED_VENDOR_GUARD_OK');
