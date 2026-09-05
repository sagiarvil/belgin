'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const registryPath = path.join(ROOT, 'llms', 'registry.json');
const manifestPath = path.join(ROOT, 'llms.txt');
const fullPath = path.join(ROOT, 'llms-full.txt');

function fail(message) {
  console.error(`❌ LLMS_GRAPH_FAIL: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(registryPath)) fail('registry.json missing');
if (!fs.existsSync(manifestPath)) fail('llms.txt missing');
if (!fs.existsSync(fullPath)) fail('llms-full.txt missing');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
if (!Array.isArray(registry.nodes) || registry.nodes.length < 5) fail('multi-node registry too small');

const manifest = fs.readFileSync(manifestPath, 'utf8');
const intents = new Set();
const paths = new Set();

// 1. Registry Nodes Verification
for (const node of registry.nodes) {
  for (const field of ['slug', 'path', 'type', 'primary_entity', 'primary_intent', 'canonical_url']) {
    if (!node[field]) fail(`${node.slug || 'unknown'} missing ${field}`);
  }
  if (intents.has(node.primary_intent)) fail(`duplicate primary intent ${node.primary_intent}`);
  intents.add(node.primary_intent);
  if (paths.has(node.path)) fail(`duplicate path ${node.path}`);
  paths.add(node.path);

  const local = path.join(ROOT, node.path);
  if (!fs.existsSync(local)) fail(`node missing on disk: ${node.path}`);
  if (!node.canonical_url.startsWith('https://www.belginkuyumculuk.com/')) fail(`foreign canonical: ${node.slug}`);

  const publicUrl = `https://www.belginkuyumculuk.com/${node.path}`;
  if (!manifest.includes(publicUrl)) fail(`manifest orphan: ${node.path}`);
}

if (!manifest.includes('/llms/core.md') || !manifest.includes('/llms-full.txt')) {
  fail('root routing incomplete in llms.txt');
}

// 2. Comprehensive Disk Verification of All Manifest Links
const manifestLinkRegex = /https:\/\/www\.belginkuyumculuk\.com\/(llms[^\s\)]+)/g;
let match;
let linkCount = 0;
const checkedFiles = new Set();

while ((match = manifestLinkRegex.exec(manifest)) !== null) {
  linkCount++;
  const relPath = match[1];
  const diskPath = path.join(ROOT, relPath);
  if (!fs.existsSync(diskPath)) {
    fail(`llms.txt references non-existent file on disk: ${relPath}`);
  }
  checkedFiles.add(diskPath);
}

// 3. Scan all LLMS files for invariant rule violations
function walkDir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(walkDir(full));
    } else if (full.endsWith('.md') || full.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

const allLlmsFiles = walkDir(path.join(ROOT, 'llms'));
allLlmsFiles.push(manifestPath);

const prohibitedRules = [
  { pattern: /İZKO|İzmir\s*Kuyumcular\s*Odası/i, name: 'İZKO prohibited reference' },
  { pattern: /Chrono24/i, name: 'Chrono24 prohibited term' },
  { pattern: /Ağa\s*Külçe/i, name: 'Ağa Külçe prohibited supplier claim' },
  { pattern: /hakkimizda\.html/i, name: 'hakkimizda.html broken 404 URL' },
  { pattern: /24K\s*Has\s*Altın/i, name: 'has altın forbidden (must use 24K Külçe Altın)' },
  { pattern: /\b(1\.01|1\.02)\b/, name: 'Stale 1% or 2% gold margin (must be 1.03 / +%3)' },
  { pattern: /\+%(1|2|5)\b.*kâr\s*marjı/i, name: 'Wrong gold profit margin (must be +%3)' }
];

let filesScanned = 0;
for (const file of allLlmsFiles) {
  filesScanned++;
  const content = fs.readFileSync(file, 'utf8');
  if (content.trim().length === 0) {
    fail(`Empty file detected: ${path.relative(ROOT, file)}`);
  }
  for (const rule of prohibitedRules) {
    if (rule.pattern.test(content)) {
      fail(`Rule violation [${rule.name}] in ${path.relative(ROOT, file)}`);
    }
  }
}

console.log(`LLMS_GRAPH_PASS nodes=${registry.nodes.length} intents=${intents.size} manifestLinks=${linkCount} filesScanned=${filesScanned} integrity=100%`);
