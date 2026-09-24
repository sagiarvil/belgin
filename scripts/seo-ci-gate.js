'use strict';
/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & MULTI-TIER LLMS ARCHITECTURE
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7 — Bölüm VIII: CI/CD Kalite Kapıları (G0-G15)
 */

const fs = require('fs');
const path = require('path');

function runFullQualityGates(pages, rootDir) {
  console.log('🛡️ [CI-GATE] Enterprise SEO, GEO, AEO, LLMO, AAO & LLM Kalite Kapıları Çalıştırılıyor...');
  const violations = [];

  // G0: Policy & Noindex İhlali
  for (const page of pages) {
    if (page.indexDirective.includes('noindex') && page.role === 'home') {
      violations.push(`[G0 POLICY] Ana sayfa noindex olamaz: ${page.route}`);
    }
  }

  // G1: Canonical Tutarlılığı
  for (const page of pages) {
    if (page.indexDirective === 'index, follow' && page.canonicalRoute !== page.route) {
      violations.push(`[G1 CANONICAL] ${page.route} indexlenebilir fakat canonical rotası farklı: ${page.canonicalRoute}`);
    }
  }

  // G2: Ham SSR HTML Varlık Kontrolü
  for (const page of pages) {
    if (page.indexDirective === 'index, follow') {
      let candidate = page.route === '/' ? 'index.html' : `${page.route.replace(/^\//, '')}`;
      if (!candidate.endsWith('.html')) {
        candidate = path.join(candidate, 'index.html');
      }
      const filePath = path.join(rootDir, candidate);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('<title>') && !content.includes('<title ')) {
          violations.push(`[G2 SSR] ${page.route} sayfasında <title> etiketi yok!`);
        }
        if (!content.includes('<h1') && !content.includes('<H1')) {
          violations.push(`[G2 SSR] ${page.route} sayfasında <H1> başlığı yok!`);
        }
        if (!content.includes('application/ld+json')) {
          violations.push(`[G2 SSR] ${page.route} sayfasında JSON-LD @graph eksik!`);
        }
        if (!content.includes('rel="canonical"')) {
          violations.push(`[G2 SSR] ${page.route} sayfasında Canonical etiket eksik!`);
        }
      }
    }
  }

  // G3: Arama Niyeti & Cannibalization Kontrolü
  const intentMap = new Map();
  for (const page of pages) {
    const key = `${page.locale}_${page.primaryIntent.toLowerCase().trim()}`;
    if (intentMap.has(key)) {
      violations.push(`[G3 CANNIBALIZATION] "${page.primaryIntent}" niyeti hem ${intentMap.get(key)} hem de ${page.route} sayfasına atanmış!`);
    } else {
      intentMap.set(key, page.route);
    }
  }

  // G4: LLM Derin Alt-Graf (/llms/*.md) Bütünlüğü
  const rootLlmsPath = path.join(rootDir, 'llms.txt');
  if (!fs.existsSync(rootLlmsPath)) {
    violations.push(`[G4 LLMS ROOT] Kök /llms.txt dosyası bulunamadı!`);
  }
  for (const page of pages) {
    if (page.llmSubGraphRoute) {
      const subGraphFile = path.join(rootDir, page.llmSubGraphRoute.replace(/^\//, ''));
      if (!fs.existsSync(subGraphFile)) {
        violations.push(`[G4 SUB-GRAPH] ${page.route} için kayıtlı ${page.llmSubGraphRoute} dosyası diskte mevcut değil!`);
      }
    }
  }

  // G5: IndexNow Alfanümerik Key Dosyası
  const keyFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.txt') && f.length >= 16 && (f.includes('indexnow') || /^[a-zA-Z0-9-]{16,}\.txt$/.test(f)));
  if (keyFiles.length === 0) {
    violations.push(`[G5 INDEXNOW] Çıktı dizininde alfanümerik IndexNow [KEY].txt doğrulama dosyası bulunamadı!`);
  }

  // G6: Sahte Tazelik (Fake Freshness) Denetimi
  const now = new Date().getTime();
  for (const page of pages) {
    const modTime = new Date(page.modifiedAt).getTime();
    if (modTime > now + 300000) {
      violations.push(`[G6 FAKE FRESHNESS] ${page.route} modifiedAt gelecekte bir tarih içeriyor: ${page.modifiedAt}`);
    }
  }

  // G7: hreflang Grubu Tutarlılığı
  const hreflangMap = new Map();
  for (const page of pages) {
    if (page.hreflangGroup) {
      const list = hreflangMap.get(page.hreflangGroup) || [];
      list.push(page.route);
      hreflangMap.set(page.hreflangGroup, list);
    }
  }
  for (const [group, routes] of hreflangMap.entries()) {
    if (routes.length < 1) {
      violations.push(`[G7 HREFLANG] "${group}" grubunda hiçbir rota yok!`);
    }
  }

  // G8: OpenGraph & Twitter Card Zorunluluğu
  for (const page of pages) {
    if (page.indexDirective === 'index, follow') {
      let candidate = page.route === '/' ? 'index.html' : `${page.route.replace(/^\//, '')}`;
      if (!candidate.endsWith('.html')) {
        candidate = path.join(candidate, 'index.html');
      }
      const filePath = path.join(rootDir, candidate);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('property="og:title"')) violations.push(`[G8 OG] ${page.route} sayfasında og:title eksik!`);
        if (!content.includes('property="og:image"')) violations.push(`[G8 OG] ${page.route} sayfasında og:image eksik!`);
        if (!content.includes('name="twitter:card"')) violations.push(`[G8 TWITTER] ${page.route} sayfasında twitter:card eksik!`);
      }
    }
  }

  // G9: Feed Bütünlüğü
  const requiredFeeds = ['feed.xml', 'atom.xml', 'feed.json'];
  for (const f of requiredFeeds) {
    if (!fs.existsSync(path.join(rootDir, f))) {
      violations.push(`[G9 FEED] Zorunlu feed dosyası bulunamadı: /${f}`);
    }
  }

  // G10: agent.txt ve MCP
  if (!fs.existsSync(path.join(rootDir, 'agent.txt'))) {
    violations.push(`[G10 AGENT] Kök /agent.txt dosyası bulunamadı!`);
  }

  // G11: Redirect Chain Tespiti
  for (const page of pages) {
    if (page.redirectFrom && page.redirectFrom.length > 0) {
      for (const src of page.redirectFrom) {
        const srcFile = path.join(rootDir, `${src.replace(/^\//, '')}.html`);
        if (fs.existsSync(srcFile)) {
          const content = fs.readFileSync(srcFile, 'utf8');
          const redirectCount = (content.match(/http-equiv=["']refresh["']/gi) || []).length;
          if (redirectCount > 1) {
            violations.push(`[G11 REDIRECT] ${src} zincirinde birden fazla redirect var!`);
          }
        }
      }
    }
  }

  // G12: Görsel Alt Text Zorunluluğu
  for (const page of pages) {
    if (page.images && page.images.length > 0) {
      for (const img of page.images) {
        if (!img.alt || img.alt.trim().length < 5) {
          violations.push(`[G12 IMG ALT] ${page.route} sayfasında görsel alt text eksik veya çok kısa: ${img.url}`);
        }
      }
    }
  }

  // G13: FAQ / Speakable Zorunluluğu (amiral gemisi sayfalar için)
  for (const page of pages) {
    if ((page.role === 'service' || page.role === 'product' || page.role === 'home' || page.role === 'hub') && page.indexDirective === 'index, follow') {
      let candidate = page.route === '/' ? 'index.html' : `${page.route.replace(/^\//, '')}`;
      if (!candidate.endsWith('.html')) {
        candidate = path.join(candidate, 'index.html');
      }
      const filePath = path.join(rootDir, candidate);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('FAQPage') && (!page.faqs || page.faqs.length === 0)) {
          violations.push(`[G13 FAQ] ${page.route} amiral gemisi sayfasında FAQPage schema veya faqs tanımı yok!`);
        }
      }
    }
  }

  // G14: Topic Cluster Bütünlüğü
  for (const page of pages) {
    if (page.role === 'hub' && !pages.some(p => p.pillarRoute === page.route)) {
      violations.push(`[G14 CLUSTER] ${page.route} pillar sayfasının hiç cluster içeriği yok!`);
    }
  }

  // G15: WCAG 2.2 Kritik Kontroller (görsel/başlık hiyerarşisi)
  for (const page of pages) {
    if (page.indexDirective === 'index, follow') {
      let candidate = page.route === '/' ? 'index.html' : `${page.route.replace(/^\//, '')}`;
      if (!candidate.endsWith('.html')) {
        candidate = path.join(candidate, 'index.html');
      }
      const filePath = path.join(rootDir, candidate);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('lang="')) violations.push(`[G15 WCAG] ${page.route} sayfasında <html lang="..."> eksik!`);
        const h1Matches = content.match(/<h1[\s>]/gi) || [];
        if (h1Matches.length !== 1) {
          violations.push(`[G15 WCAG] ${page.route} sayfasında tam olarak 1 adet <h1> olmalı! Bulunan: ${h1Matches.length}`);
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error(`\n❌ [DEPLOY BLOCKED] ${violations.length} adet kritik SEO/GEO/LLMO/AAO ihlali saptandı:\n`);
    violations.forEach(v => console.error(`  ⛔ ${v}`));
    return { ok: false, violations };
  }

  console.log('✅ [PASSED] Tüm G0-G15 Kalite Kapıları 0 Hata İle Geçildi.');
  return { ok: true, violations: [] };
}

module.exports = { runFullQualityGates };
