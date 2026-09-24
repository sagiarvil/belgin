/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & MULTI-TIER LLMS ARCHITECTURE
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7
 * Dinamik hreflang Üreteci (src/seo/hreflang-builder.js)
 */

'use strict';

function buildHreflangTags(page, allPages, domain = 'www.belginkuyumculuk.com') {
  if (!page.hreflangGroup) return '';

  const origin = `https://${domain}`;
  const alternates = allPages
    .filter(p => p.hreflangGroup === page.hreflangGroup && p.locale !== page.locale)
    .map(p => `<link rel="alternate" hreflang="${p.locale}" href="${origin}${p.route === '/' ? '' : p.route}">`)
    .join('\n');

  const defaultTag = `<link rel="alternate" hreflang="x-default" href="${origin}${page.route === '/' ? '' : page.route}">`;
  return alternates ? `${alternates}\n${defaultTag}` : defaultTag;
}

module.exports = { buildHreflangTags };
