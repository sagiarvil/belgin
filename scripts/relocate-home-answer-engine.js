'use strict';

const fs = require('fs');
const path = require('path');
const { SEO_REGISTRY } = require('./seo-registry.js');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function removeLegacyHeroAnswer(html) {
  let startIndex = html.indexOf('<div class="hero-answer-engine" data-registry-route="/">');
  if (startIndex === -1) return html;
  
  let preMatch = html.lastIndexOf('<div class="container-art"', startIndex);
  if (preMatch !== -1) {
    let between = html.substring(preMatch, startIndex).trim();
    if (between.match(/^<div class="container-art"[^>]*>$/i)) {
      startIndex = preMatch;
    }
  }

  let depth = 0;
  let i = startIndex;
  while (i < html.length) {
    if (html.substring(i, i+4).toLowerCase() === '<div') {
      depth++;
      i += 4;
    } else if (html.substring(i, i+6).toLowerCase() === '</div') {
      depth--;
      i += 6;
      if (depth === 0) {
        let closeBracket = html.indexOf('>', i);
        if (closeBracket !== -1) {
           i = closeBracket + 1;
        }
        break;
      }
    } else {
      i++;
    }
  }

  // Handle multiple instances just in case
  let newHtml = html.substring(0, startIndex) + '\n' + html.substring(i);
  if (newHtml.indexOf('<div class="hero-answer-engine" data-registry-route="/">') !== -1) {
    return removeLegacyHeroAnswer(newHtml);
  }
  return newHtml;
}

function buildCompactSeoSection() {
  const home = SEO_REGISTRY.find((item) => item.route === '/');
  if (!home || !home.heroAnswerEngine) return '';

  const modified = (home.modifiedAt || '2026-09-05').slice(0, 10);
  const llms = home.llmSubGraphRoute || '/llms/pages/ana-sayfa.md';

  return `
  <!-- SEO / GEO ticari doğrulama alanı: ana vitrin tasarımını bozmayacak şekilde footer önüne taşındı. -->
  <section class="seo-business-facts" aria-label="Belgin ticari bilgi özeti" style="margin:28px auto 0; max-width:1760px; padding:0 24px;">
    <div class="hero-answer-engine" data-registry-route="/" style="border-top:1px solid rgba(5,51,47,.12); padding:18px 0 20px; color:#5f6664; font-size:12px; line-height:1.7; background:transparent; box-shadow:none;">
      <div style="display:flex; flex-wrap:wrap; gap:10px 22px; align-items:center; margin-bottom:8px; color:#05332f; font-weight:700; letter-spacing:.04em; text-transform:uppercase; font-size:10px;">
        <span>Belgin Saat • Ticari Bilgi Özeti</span>
        <span>İzmir Buca • Est. 1999</span>
      </div>
      <p class="hero-answer">${esc(home.heroAnswerEngine)}</p>
      <div style="display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:8px; font-size:11px; color:#7a807e;">
        <span><strong style="color:#4f5754;">Son doğrulama:</strong> ${esc(modified)}</span>
        <span><strong style="color:#4f5754;">Kaynak:</strong> Belgin SSOT Knowledge Graph</span>
        <a href="${esc(llms)}" style="color:#6b5b2a; text-decoration:none; border-bottom:1px solid rgba(107,91,42,.35);">Makine Özeti (LLMS) →</a>
      </div>
    </div>
  </section>
`;
}

function main() {
  let html = fs.readFileSync(INDEX, 'utf8');

  html = removeLegacyHeroAnswer(html);

  // Önceki build çıktısı varsa tekrarlı eklemeyi engelle.
  html = html.replace(
    /\s*<!-- SEO \/ GEO ticari doğrulama alanı:[\s\S]*?<\/section>\s*/i,
    '\n'
  );

  const block = buildCompactSeoSection();
  if (!block) return;

  if (!/<footer\b/i.test(html)) {
    throw new Error('[home-seo-relocate] footer bulunamadı; güvenli taşıma durduruldu.');
  }

  html = html.replace(/\n\s*<footer\b/i, `${block}\n<footer`);
  fs.writeFileSync(INDEX, html, 'utf8');
  console.log('[home-seo-relocate] PASS hero üstü SEO bloğu kaldırıldı, footer önüne kompakt alan eklendi.');
}

if (require.main === module) main();

module.exports = { main };
