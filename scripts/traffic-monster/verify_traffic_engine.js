'use strict';
/**
 * 🛡️ VERIFY TRAFFIC ENGINE & ENTERPRISE SUITE
 * Deterministic Test Runner for Master Suite v2 Quality Gate
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { runTrafficBlast, gatherTargetUrls, INDEXNOW_ENDPOINTS, WEBSUB_HUBS } = require('./traffic_blast');
const { audit14KbAstBudget, calculateColbertEntropy, runGeoBoosterAudit } = require('./ai_search_geo_booster');

async function runTests() {
  console.log('🧪 [VERIFICATION] Starting Traffic Monster & GEO Booster verification suite...');

  // Test 1: URL Harvester
  console.log('Test 1: gatherTargetUrls...');
  const urls = gatherTargetUrls();
  assert(Array.isArray(urls), 'URLs must be an array');
  assert(urls.length > 0, 'URL list cannot be empty');
  assert(urls.some(u => u.includes('belginkuyumculuk.com')), 'Must include core domain URLs');
  console.log(`  ✅ Passed: Harvested ${urls.length} URLs.`);

  // Test 2: IndexNow & WebSub Endpoints
  console.log('Test 2: Multi-Hub Configuration...');
  assert(INDEXNOW_ENDPOINTS.length >= 3, 'Must contain at least 3 IndexNow endpoints');
  assert(WEBSUB_HUBS.length >= 2, 'Must contain at least 2 WebSub hubs');
  console.log('  ✅ Passed: Endpoints and Hubs configured properly.');

  // Test 3: Dry-run Traffic Blast
  console.log('Test 3: runTrafficBlast dry-run...');
  const blastResult = await runTrafficBlast(true);
  assert(blastResult.indexNow.dryRun === true, 'IndexNow dry-run flag must be true');
  assert(blastResult.webSub.dryRun === true, 'WebSub dry-run flag must be true');
  console.log('  ✅ Passed: Dry-run completed cleanly.');

  // Test 4: 14KB AST Budget on index.html
  console.log('Test 4: 14KB AST Budget...');
  const astCheck = audit14KbAstBudget('index.html');
  assert(astCheck.exists === true, 'index.html must exist');
  assert(astCheck.score >= 50, 'index.html must satisfy at least 50% first 14KB rules');
  console.log(`  ✅ Passed: index.html AST gate score: ${astCheck.score}%`);

  // Test 5: ColBERT Entropy Calculator
  console.log('Test 5: ColBERT Entropy calculation...');
  const entropy = calculateColbertEntropy('Belgin Kuyumculuk altın ziynet bilezik pırlanta mücevherat saat borsa canlı');
  assert(entropy.totalWords > 0, 'Word count must be positive');
  assert(entropy.entropyScore > 0, 'Entropy must be positive');
  console.log(`  ✅ Passed: Entropy calculated: ${entropy.entropyScore}`);

  // Test 6: Full GEO Booster Audit Run
  console.log('Test 6: runGeoBoosterAudit...');
  const geoAudit = runGeoBoosterAudit();
  assert(Array.isArray(geoAudit.commercialEntities), 'Must have commercial entities array');
  assert(geoAudit.commercialEntities.length > 0, 'Must contain top entities');
  console.log('  ✅ Passed: Full GEO audit completed.');

  // Test 7: Zero BOM Verification
  console.log('Test 7: UTF-8 Zero-BOM check...');
  const scriptFiles = [
    path.join(__dirname, 'traffic_blast.js'),
    path.join(__dirname, 'ai_search_geo_booster.js'),
    path.join(__dirname, 'verify_traffic_engine.js')
  ];
  for (const f of scriptFiles) {
    const buf = fs.readFileSync(f);
    assert(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF), `File ${f} contains BOM byte!`);
  }
  console.log('  ✅ Passed: 0 BOM bytes found in suite files.');

  console.log('\n🎉 [PASS] All Traffic Engine & GEO Booster Tests Passed with 0 Errors!');
}

runTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n❌ [FAIL] Verification failed:', err);
  process.exit(1);
});
