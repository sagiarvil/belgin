/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & SITEMAP SYNCHRONIZATION
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7
 * Dinamik Sitemap Üreteci (src/seo/sitemap-builder.js)
 */

'use strict';

function buildPagesSitemap(pages, domain = 'www.belginkuyumculuk.com') {
  const origin = `https://${domain}`;
  const urls = pages
    .filter(p => p.indexDirective === 'index, follow')
    .map(p => {
      const pageUrl = `${origin}${p.route === '/' ? '/' : p.route}`;
      // W3C Date format YYYY-MM-DDTHH:mm:ss+03:00 or YYYY-MM-DD
      const lastmod = new Date(p.modifiedAt).toISOString().split('T')[0];
      const priority = p.role === 'home' ? '1.0' : (p.role === 'hub' ? '0.9' : '0.8');
      const changefreq = p.role === 'home' ? 'hourly' : (p.role === 'hub' || p.role === 'category' ? 'daily' : 'weekly');

      return `  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function buildRootSitemapIndex(latestDate, domain = 'www.belginkuyumculuk.com') {
  const origin = `https://${domain}`;
  const dateStr = latestDate ? new Date(latestDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${origin}/sitemap-pages.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${origin}/sitemap-categories.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${origin}/sitemap-products.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${origin}/sitemap-magazine.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
</sitemapindex>
`;
}

module.exports = {
  buildPagesSitemap,
  buildRootSitemapIndex
};
