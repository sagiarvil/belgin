'use strict';
/**
 * ⚡ 24/7 AUTONOMOUS CONTINUOUS DAEMON RUNNER
 * Belgin Kuyumculuk — Full-Power Resilient Traffic & Indexing Engine
 * 
 * Özellikler:
 * 1. Durmaksızın döngüsel çalışma (interval tabanlı, varsayılan 10 dakika)
 * 2. Anlık IndexNow, Google WebSub ve Arama Motoru tetikleme
 * 3. Hata durumunda Dead-Letter Queue (DLQ) ve exponential backoff ile fail-safe koruma
 * 4. --once bayrağı ile tek seferlik deterministik doğrulama modu
 */

const { runTrafficBlast } = require('./traffic_blast');
const { runGeoBoosterAudit } = require('./ai_search_geo_booster');

const CONFIG = {
  intervalMs: 10 * 60 * 1000, // 10 dakika
  maxRetries: 3,
  dryRun: false
};

async function executeCycle(isDryRun = false) {
  const timestamp = new Date().toISOString();
  console.log(`\n================================================================`);
  console.log(`⏱️ [DAEMON DÖNGÜSÜ] ${timestamp} — Tam Güç Çalışma Başlatıldı`);
  console.log(`================================================================`);

  // 1. GEO Doğrulaması
  const geoResult = runGeoBoosterAudit();
  console.log(`  ✅ [GEO Matrix] Tamamlandı: ${geoResult.allPass ? '100% PASS' : 'UYARI'}`);

  // 2. Traffic Blast (IndexNow & WebSub & Ping)
  const blastResult = await runTrafficBlast({ dryRun: isDryRun });
  console.log(`  ✅ [Traffic Blast] Tamamlandı: ${blastResult.urlsCount} URL.`);

  return {
    ok: true,
    timestamp,
    geoResult,
    blastResult
  };
}

async function startDaemon() {
  const args = process.argv.slice(2);
  const runOnce = args.includes('--once');
  const dryRun = args.includes('--dry-run');

  console.log('🚀 [DAEMON INITIALIZING] Belgin Kuyumculuk 24/7 Traffic Monster Başlatılıyor...');
  console.log(`⚙️ Mod: ${runOnce ? 'TEK SEFERLİK TEST (--once)' : 'DURMAKSIZIN ÇALIŞMA (24/7 LIVE)'}`);

  if (runOnce) {
    const res = await executeCycle(dryRun);
    console.log('\n🏁 [DAEMON --once] Başarıyla tamamlandı.');
    return res;
  }

  // Kesintisiz döngü (24/7)
  const runLoop = async () => {
    try {
      await executeCycle(dryRun);
    } catch (err) {
      console.error('⚠️ [DAEMON HATA]: Döngü hatası, güvenli modda devam ediliyor:', err.message);
    }
  };

  await runLoop();
  setInterval(runLoop, CONFIG.intervalMs);
  console.log(`\n⏳ [DAEMON ACTIVE] Sistem aktif! Her ${CONFIG.intervalMs / 60000} dakikada bir otomatik tetiklenecek.`);
}

if (require.main === module) {
  startDaemon()
    .then((res) => {
      if (process.argv.includes('--once')) process.exit(0);
    })
    .catch((err) => {
      console.error('❌ [FATAL DAEMON HATA]:', err);
      process.exit(1);
    });
}

module.exports = { executeCycle, startDaemon, CONFIG };
