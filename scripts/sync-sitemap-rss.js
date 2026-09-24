'use strict';
/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & SITEMAP SYNCHRONIZATION
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7 — Sitemap & RSS Eşzamanlılık Motoru
 * (scripts/sync-sitemap-rss.js)
 */

const fs = require('fs');
const path = require('path');
const { SEO_REGISTRY, DOMAIN } = require('../src/seo/registry');
const { buildPagesSitemap, buildRootSitemapIndex } = require('../src/seo/sitemap-builder');

const rootDir = path.resolve(__dirname, '..');

function syncSitemapAndRss() {
  console.log('🔄 [SYNC] Sitemap ve RSS/Atom Akışları Eşzamanlanıyor (SSOT Parity)...');

  // 1. En son semantik güncelleme tarihini tespit et
  let latestModifiedMs = 0;
  for (const page of SEO_REGISTRY) {
    const t = new Date(page.modifiedAt).getTime();
    if (t > latestModifiedMs) latestModifiedMs = t;
  }
  const latestDateIso = new Date(latestModifiedMs).toISOString();

  // 2. sitemap-pages.xml dosyasını SSOT üzerinden üret ve yaz
  const pagesSitemapXml = buildPagesSitemap(SEO_REGISTRY, DOMAIN);
  const sitemapPagesPath = path.join(rootDir, 'sitemap-pages.xml');
  fs.writeFileSync(sitemapPagesPath, pagesSitemapXml, 'utf8');
  console.log(`  ✅ [Sitemap Pages] sitemap-pages.xml güncellendi (${SEO_REGISTRY.length} canonical URL).`);

  // 3. sitemap.xml kök indeksini en son tarihle güncelle
  const rootSitemapXml = buildRootSitemapIndex(latestDateIso, DOMAIN);
  const rootSitemapPath = path.join(rootDir, 'sitemap.xml');
  fs.writeFileSync(rootSitemapPath, rootSitemapXml, 'utf8');
  console.log(`  ✅ [Sitemap Index] sitemap.xml kök indeksi güncellendi (lastmod: ${latestDateIso.split('T')[0]}).`);

  // 4. feed.json ve feed.xml ile 1:1 eşzamanlılık doğrulama testi (Parity Gate)
  console.log('\n🔍 [PARITY AUDIT] RSS / Feed ve Sitemap Tarihsel Bütünlüğü Denetleniyor...');
  const feedJsonPath = path.join(rootDir, 'feed.json');
  if (!fs.existsSync(feedJsonPath)) {
    console.error('❌ [ERROR] feed.json bulunamadı. Önce build-seo-mandate.js çalıştırılmalıdır.');
    process.exit(1);
  }

  const feedData = JSON.parse(fs.readFileSync(feedJsonPath, 'utf8'));
  const sitemapContent = fs.readFileSync(sitemapPagesPath, 'utf8');

  let parityViolations = [];

  for (const item of feedData.items) {
    // URL varlık kontrolü
    if (!sitemapContent.includes(`<loc>${item.url}</loc>`) && !sitemapContent.includes(`<loc>${item.url}/</loc>`)) {
      parityViolations.push(`URL Uyuşmazlığı: ${item.url} feed içinde var fakat sitemap-pages.xml içinde bulunamadı!`);
    }

    // Tarihsel eşzamanlılık kontrolü (lastmod vs date_modified)
    const expectedLastmod = new Date(item.date_modified).toISOString().split('T')[0];
    const locPattern = new RegExp(`<loc>${item.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?</loc>\\s*<lastmod>([^<]+)</lastmod>`, 'i');
    const match = sitemapContent.match(locPattern);

    if (!match) {
      parityViolations.push(`Tarih Bulunamadı: ${item.url} için sitemap lastmod etiketi okunamadı!`);
    } else if (match[1] !== expectedLastmod) {
      parityViolations.push(`Zaman Kayması (Drift): ${item.url} Feed tarihi: ${expectedLastmod} | Sitemap tarihi: ${match[1]}`);
    }
  }

  if (parityViolations.length > 0) {
    console.error(`\n❌ [PARITY FAILED] ${parityViolations.length} adet eşzamanlılık ihlali saptandı:`);
    parityViolations.forEach(v => console.error(`  ⛔ ${v}`));
    process.exit(1);
  }

  console.log('  ✅ [Parity PASS] %100 URL ve Tarih Eşzamanlılığı Doğrulandı: Sıfır Kayma (0 Drift).');
  console.log('🎉 [SUCCESS] Sitemap ile RSS Akışı Kusursuz ve Tam Eşzamanlı Hale Getirildi.');
}

if (require.main === module) {
  syncSitemapAndRss();
}

module.exports = { syncSitemapAndRss };
