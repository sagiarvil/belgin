'use strict';

const { execFileSync } = require('node:child_process');

// The prohibited vendor name is intentionally assembled from character codes so
// this guard never reintroduces the literal into repository content.
const needle = String.fromCharCode(99, 104, 114, 111, 110, 111, 50, 52);
const exclude = [
  '--exclude-dir=.git',
  '--exclude=prohibited-vendor-guard.js',
  '--exclude=repo-content-cleanliness.yml',
];

try {
  const output = execFileSync('grep', ['-RniI', ...exclude, needle, '.'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (output.trim()) {
    console.error('PROHIBITED_VENDOR_GUARD_FAIL');
    console.error(output.trim());
    process.exit(1);
  }
} catch (error) {
  // grep exit 1 means no matches; any other status is an execution failure.
  if (error && error.status === 1) {
    console.log('PROHIBITED_VENDOR_GUARD_OK');
    process.exit(0);
  }
  console.error('PROHIBITED_VENDOR_GUARD_ERROR');
  if (error?.stderr) console.error(String(error.stderr).trim());
  process.exit(1);
}

console.log('PROHIBITED_VENDOR_GUARD_OK');
