'use strict';
/**
 * 🧪 VERIFY DAEMON RUNNER INTEGRITY TEST
 */

const assert = require('assert');
const { executeCycle, CONFIG } = require('./daemon_runner');

async function testDaemon() {
  console.log('⚡ [TEST] 24/7 Daemon Runner Deterministik Testi Başlatılıyor...\n');

  assert(typeof executeCycle === 'function', 'executeCycle fonksiyon olmalıdır.');
  assert(Number.isInteger(CONFIG.intervalMs) && CONFIG.intervalMs > 0, 'Geçersiz döngü süresi.');

  // Tek döngü dry-run testi
  const cycle = await executeCycle(true);
  assert(cycle.ok === true, 'Daemon döngüsü başarısız oldu.');
  assert(cycle.geoResult && cycle.geoResult.allPass === true, 'GEO denetimi başarılı olmalıdır.');
  assert(cycle.blastResult && cycle.blastResult.urlsCount > 0, 'Blast sonucu geçerli olmalıdır.');

  console.log('\n================================================================');
  console.log('🎉 [PASS] 24/7 Daemon Runner Tam Güç Çalışmaya Hazır!');
  console.log('================================================================\n');
}

testDaemon()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ [FAIL] Daemon testi başarısız:', err.message);
    process.exit(1);
  });
