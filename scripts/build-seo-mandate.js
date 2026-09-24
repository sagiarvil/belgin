'use strict';
/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & MULTI-TIER LLMS ARCHITECTURE
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7
 * Ana Derleme ve Kalite Kapısı Yürütücüsü (scripts/build-seo-mandate.js)
 */

const fs = require('fs');
const path = require('path');
const { SEO_REGISTRY, DOMAIN } = require('../src/seo/registry');
const { buildRssFeed, buildAtomFeed, buildJsonFeed } = require('../src/seo/feed-builder');
const { runFullQualityGates } = require('./seo-ci-gate');

const rootDir = path.resolve(__dirname, '..');

function buildAll() {
  console.log('⚡ [BUILD] MANDATE-SEO-GEO-2026-V7 Bileşenleri Derleniyor...');

  // 1. RSS 2.0 Feed Derlemesi
  const rssContent = buildRssFeed(SEO_REGISTRY, DOMAIN);
  fs.writeFileSync(path.join(rootDir, 'feed.xml'), rssContent, 'utf8');
  console.log('  ✅ /feed.xml başarıyla üretildi.');

  // 2. Atom 1.0 Feed Derlemesi
  const atomContent = buildAtomFeed(SEO_REGISTRY, DOMAIN);
  fs.writeFileSync(path.join(rootDir, 'atom.xml'), atomContent, 'utf8');
  console.log('  ✅ /atom.xml başarıyla üretildi.');

  // 3. JSON Feed 1.1 Derlemesi
  const jsonFeedContent = buildJsonFeed(SEO_REGISTRY, DOMAIN);
  fs.writeFileSync(path.join(rootDir, 'feed.json'), jsonFeedContent, 'utf8');
  console.log('  ✅ /feed.json başarıyla üretildi.');

  // 4. LLM Semantik Feed Derlemesi
  const llmsDir = path.join(rootDir, 'llms');
  if (!fs.existsSync(llmsDir)) fs.mkdirSync(llmsDir, { recursive: true });
  fs.writeFileSync(path.join(llmsDir, 'feed.xml'), rssContent, 'utf8');
  console.log('  ✅ /llms/feed.xml başarıyla üretildi.');

  // 5. G0 - G15 CI/CD Kalite Kapılarının Koşturulması
  console.log('\n🛡️ [VERIFY] G0-G15 Kalite Kapıları Denetleniyor...');
  const gateResult = runFullQualityGates(SEO_REGISTRY, rootDir);

  if (!gateResult.ok) {
    console.error('\n❌ [BUILD FAILED] Kalite kapısı ihlalleri nedeniyle işlem durduruldu.');
    process.exit(1);
  }

  console.log('\n🎉 [SUCCESS] MANDATE-SEO-GEO-2026-V7 Mimarisi Eksiksiz ve 0 Hata ile Kuruldu!');
}

if (require.main === module) {
  buildAll();
}

module.exports = { buildAll };
