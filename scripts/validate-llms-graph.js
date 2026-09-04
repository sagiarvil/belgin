'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const registryPath = path.join(ROOT, 'llms', 'registry.json');
const manifestPath = path.join(ROOT, 'llms.txt');
const fullPath = path.join(ROOT, 'llms-full.txt');

function fail(message) { console.error(`LLMS_GRAPH_FAIL: ${message}`); process.exit(1); }
if (!fs.existsSync(registryPath)) fail('registry missing');
if (!fs.existsSync(manifestPath)) fail('llms.txt missing');
if (!fs.existsSync(fullPath)) fail('llms-full.txt missing');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
if (!Array.isArray(registry.nodes) || registry.nodes.length < 5) fail('multi-node registry too small');
const manifest = fs.readFileSync(manifestPath, 'utf8');
const intents = new Set();
const paths = new Set();
for (const node of registry.nodes) {
  for (const field of ['slug','path','type','primary_entity','primary_intent','canonical_url']) {
    if (!node[field]) fail(`${node.slug || 'unknown'} missing ${field}`);
  }
  if (intents.has(node.primary_intent)) fail(`duplicate primary intent ${node.primary_intent}`);
  intents.add(node.primary_intent);
  if (paths.has(node.path)) fail(`duplicate path ${node.path}`);
  paths.add(node.path);
  const local = path.join(ROOT, node.path);
  if (!fs.existsSync(local)) fail(`node missing ${node.path}`);
  if (!node.canonical_url.startsWith('https://www.belginkuyumculuk.com/')) fail(`foreign canonical ${node.slug}`);
  const publicUrl = `https://www.belginkuyumculuk.com/${node.path}`;
  if (!manifest.includes(publicUrl) && node.type !== 'hub') fail(`manifest orphan ${node.path}`);
}
if (!manifest.includes('/llms/core.md') || !manifest.includes('/llms-full.txt')) fail('root routing incomplete');
console.log(`LLMS_GRAPH_PASS nodes=${registry.nodes.length} intents=${intents.size}`);
