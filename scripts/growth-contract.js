'use strict';

const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const sdkPath = path.join(ROOT, 'js', 'growth.js');
const indexPath = path.join(ROOT, 'index.html');
function fail(message) { console.error(`GROWTH_CONTRACT_FAIL: ${message}`); process.exit(1); }
if (!fs.existsSync(sdkPath)) fail('growth SDK missing');
const sdk = fs.readFileSync(sdkPath, 'utf8');
for (const token of ['page_view','checkout_start','store_visit_intent','traffic_source','first_touch','last_touch','session_id','sagiarvil:growth']) {
  if (!sdk.includes(token)) fail(`missing ${token}`);
}
if (/localStorage|anonymous_user_id/.test(sdk)) fail('persistent identity storage forbidden');
if (!fs.existsSync(indexPath)) fail('index.html missing');
const index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes('/js/growth.js')) fail('homepage not instrumented; run build/injector');
console.log('GROWTH_CONTRACT_PASS');
