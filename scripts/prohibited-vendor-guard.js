'use strict';

const { execFileSync } = require('node:child_process');

// Prohibited marketplace name is assembled so the literal itself never re-enters source/runtime content.
const needle = String.fromCharCode(99, 104, 114, 111, 110, 111, 50, 52);

try {
  const output = execFileSync('grep', ['-RniI', '--exclude-dir=.git', '--exclude=prohibited-vendor-guard.js', needle, '.'], {
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
