'use strict';

const { execFileSync } = require('node:child_process');

// Prohibited marketplace name is assembled so the literal never returns to public/runtime content.
const needle = String.fromCharCode(99, 104, 114, 111, 110, 111, 50, 52);
const exclude = [
  '--exclude-dir=.git',
  '--exclude=prohibited-vendor-guard.js',
  '--exclude=SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md',
  '--exclude=magazine-safety-filter.js',
  '--exclude=refine-all-magazine-articles.py',
  '--exclude=sync-exact-elite-images.js',
];

try {
  const output = execFileSync('grep', ['-RniI', ...exclude, needle, '.'], {
    cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (output.trim()) {
    console.error('PROHIBITED_VENDOR_GUARD_FAIL');
    console.error(output.trim());
    process.exit(1);
  }
} catch (error) {
  if (error && error.status === 1) {
    console.log('PROHIBITED_VENDOR_GUARD_OK');
    process.exit(0);
  }
  console.error('PROHIBITED_VENDOR_GUARD_ERROR');
  if (error?.stderr) console.error(String(error.stderr).trim());
  process.exit(1);
}

console.log('PROHIBITED_VENDOR_GUARD_OK');
