#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const adminHtmlPath = path.join(ROOT, 'admin.html');
const runtimePath = path.join(ROOT, 'js', 'admin-identity-upload-fix.js');
const SCRIPT_TAG = '<script src="js/admin-identity-upload-fix.js?v=20260916-identity-upload-v1"></script>';

function fail(message) {
  console.error(`[identity-upload-inject] FAIL: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(adminHtmlPath)) fail('admin.html not found');
if (!fs.existsSync(runtimePath)) fail('js/admin-identity-upload-fix.js not found');

let html = fs.readFileSync(adminHtmlPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');

const requiredRuntimeTokens = [
  'openDeclarationFilePicker',
  'openStoreIdentityFilePicker',
  'declarationDropZone',
  'storeIdentityDropZone',
  'MAX_BYTES = 15 * 1024 * 1024'
];

for (const token of requiredRuntimeTokens) {
  if (!runtime.includes(token)) fail(`runtime contract missing token: ${token}`);
}

const requiredAdminTokens = [
  'id="declarationFileInput"',
  'id="declarationDropZone"',
  'id="storeIdentityFileInput"',
  'id="storeIdentityDropZone"'
];

for (const token of requiredAdminTokens) {
  if (!html.includes(token)) fail(`admin.html contract missing token: ${token}`);
}

// Remove stale/duplicate copies first; deployment must be deterministic.
html = html.replace(/\s*<script\s+src=["']js\/admin-identity-upload-fix\.js[^"']*["']\s*><\/script>\s*/gi, '\n');

if (!/<\/body>/i.test(html)) fail('admin.html closing </body> not found');
html = html.replace(/<\/body>/i, `  ${SCRIPT_TAG}\n</body>`);

fs.writeFileSync(adminHtmlPath, html, 'utf8');

const finalHtml = fs.readFileSync(adminHtmlPath, 'utf8');
const occurrences = (finalHtml.match(/admin-identity-upload-fix\.js/g) || []).length;
if (occurrences !== 1) fail(`expected exactly one runtime include, found ${occurrences}`);

console.log('[identity-upload-inject] PASS: admin identity upload hardening injected exactly once');
