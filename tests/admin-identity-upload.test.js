'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const adminHtmlPath = path.join(ROOT, 'admin.html');
const adminJsPath = path.join(ROOT, 'js', 'admin.js');
const runtimePath = path.join(ROOT, 'js', 'admin-identity-upload-fix.js');
const injectorPath = path.join(ROOT, 'scripts', 'inject-admin-identity-upload-fix.js');

console.log('\n=== ADMIN IDENTITY UPLOAD REGRESSION GATE ===\n');

for (const filePath of [adminHtmlPath, adminJsPath, runtimePath, injectorPath]) {
  assert(fs.existsSync(filePath), `Required file missing: ${path.relative(ROOT, filePath)}`);
}

const syntax = spawnSync(process.execPath, ['--check', runtimePath], { encoding: 'utf8' });
assert.strictEqual(syntax.status, 0, `Runtime syntax invalid:\n${syntax.stderr || syntax.stdout}`);
console.log('PASS 1: identity upload runtime JavaScript syntax is valid');

const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');

assert(adminJs.includes('openDeclarationModal(orderId)'), 'AdminApp.openDeclarationModal is missing');
assert(adminJs.includes('handleDeclarationUpload(event)'), 'Admin declaration upload handler is missing');
assert(adminJs.includes('handleDeclarationDrop(event)'), 'Admin declaration drop handler is missing');
assert(adminJs.includes('processStoreIdentityFile(file)'), 'Store identity file processor is missing');
console.log('PASS 2: existing AdminApp identity/declaration controller contract is present');

for (const token of [
  'id="declarationModal"',
  'id="declarationDropZone"',
  'id="declarationFileInput"',
  'id="storeIdentityDropZone"',
  'id="storeIdentityFileInput"'
]) {
  assert(adminHtml.includes(token), `admin.html missing identity UI contract: ${token}`);
}
console.log('PASS 3: declaration and store identity UI contracts are present');

assert(runtime.includes("input.click();"), 'Runtime must synchronously trigger the native file picker');
assert(runtime.includes("event.preventDefault();"), 'Runtime must suppress racing native label activation');
assert(runtime.includes("MAX_BYTES = 15 * 1024 * 1024"), 'Runtime must enforce the 15 MB limit');
assert(runtime.includes("zoneId: 'declarationDropZone'"), 'Declaration picker binding missing');
assert(runtime.includes("zoneId: 'storeIdentityDropZone'"), 'Store picker binding missing');
assert(runtime.includes('handleDeclarationDrop'), 'Declaration drag/drop binding missing');
assert(runtime.includes('handleStoreIdentityDrop'), 'Store drag/drop binding missing');
assert(runtime.includes('openDeclarationFilePicker'), 'Explicit declaration file picker method missing');
assert(runtime.includes('openStoreIdentityFilePicker'), 'Explicit store file picker method missing');
console.log('PASS 4: deterministic click, drag/drop, validation and picker APIs are enforced');

const includeCount = (adminHtml.match(/admin-identity-upload-fix\.js/g) || []).length;
assert.strictEqual(includeCount, 1, `Expected exactly one identity runtime script include after build, found ${includeCount}`);
console.log('PASS 5: build injected identity upload runtime exactly once');

console.log('\nALL ADMIN IDENTITY UPLOAD REGRESSION CHECKS PASSED (5/5)\n');
