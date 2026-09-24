/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & MULTI-TIER LLMS ARCHITECTURE
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7
 * Dinamik Feed Üreteci (src/seo/feed-builder.js)
 */

'use strict';

function buildRssFeed(pages, domain = 'www.belginkuyumculuk.com', meta = {
  title: 'Belgin Kuyumculuk & Saat | Canlı Borsa Kurları ve Horoloji Akışı',
  description: 'İzmir Buca Belgin Kuyumculuk canlı altın fiyatları, 22 ayar bilezik, ekspertizli İsviçre lüks saatleri ve mevzuat rehberleri.',
  language: 'tr-TR'
}) {
  const origin = `https://${domain}`;
  const items = pages
    .filter(p => p.indexDirective === 'index, follow')
    .map(p => {
      const pageUrl = `${origin}${p.route === '/' ? '' : p.route}`;
      const pubDate = new Date(p.publishedAt).toUTCString();
      const llmGraph = p.llmSubGraphRoute ? `${origin}${p.llmSubGraphRoute}` : '';
      return `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${pageUrl}</link>
      <guid isPermaLink="true">${pageUrl}</guid>
      <description><![CDATA[${p.metaDescription}]]></description>
      <content:encoded><![CDATA[${p.heroAnswerEngine}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <author>bilgi@belginkuyumculuk.com (${p.author?.name || 'Editoryal Heyet'})</author>
      <category>${p.feedCategory || 'article'}</category>
      ${llmGraph ? `<atom:link rel="alternate" type="text/markdown" href="${llmGraph}"/>` : ''}
    </item>`;
    }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${meta.title}</title>
    <link>${origin}</link>
    <description>${meta.description}</description>
    <language>${meta.language}</language>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml"/>
    <atom:link rel="hub" href="https://pubsubhubbub.appspot.com/"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

function buildAtomFeed(pages, domain = 'www.belginkuyumculuk.com', meta = {
  title: 'Belgin Kuyumculuk & Saat Atom Akışı',
  subtitle: 'İzmir Buca canlı borsa altın ve ekspertizli lüks saat bildirimleri',
  language: 'tr'
}) {
  const origin = `https://${domain}`;
  const entries = pages
    .filter(p => p.indexDirective === 'index, follow')
    .map(p => {
      const pageUrl = `${origin}${p.route === '/' ? '' : p.route}`;
      const updated = new Date(p.modifiedAt).toISOString();
      const published = new Date(p.publishedAt).toISOString();
      return `  <entry>
    <title>${p.title}</title>
    <link rel="alternate" type="text/html" href="${pageUrl}"/>
    <id>${pageUrl}</id>
    <published>${published}</published>
    <updated>${updated}</updated>
    <summary>${p.metaDescription}</summary>
    <content type="html"><![CDATA[${p.heroAnswerEngine}]]></content>
    <author>
      <name>${p.author?.name || 'Belgin Kuyumculuk'}</name>
      <email>bilgi@belginkuyumculuk.com</email>
    </author>
    <category term="${p.feedCategory || 'general'}"/>
  </entry>`;
    }).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${meta.title}</title>
  <subtitle>${meta.subtitle}</subtitle>
  <link href="${origin}/atom.xml" rel="self" type="application/atom+xml"/>
  <link href="${origin}" rel="alternate" type="text/html"/>
  <link rel="hub" href="https://pubsubhubbub.appspot.com/"/>
  <id>${origin}/</id>
  <updated>${new Date().toISOString()}</updated>
${entries}
</feed>`;
}

function buildJsonFeed(pages, domain = 'www.belginkuyumculuk.com', meta = {
  title: 'Belgin Kuyumculuk & Saat JSON Feed 1.1',
  description: 'AI RAG pipeline ve LLM çıkarım motorları için optimize edilmiş yapılandırılmış JSON besleme akışı.'
}) {
  const origin = `https://${domain}`;
  const items = pages
    .filter(p => p.indexDirective === 'index, follow')
    .map(p => {
      const pageUrl = `${origin}${p.route === '/' ? '' : p.route}`;
      return {
        id: pageUrl,
        url: pageUrl,
        title: p.title,
        content_text: p.heroAnswerEngine,
        summary: p.metaDescription,
        date_published: new Date(p.publishedAt).toISOString(),
        date_modified: new Date(p.modifiedAt).toISOString(),
        author: {
          name: p.author?.name || 'Belgin Kuyumculuk Heyeti',
          url: p.author?.sameAs?.[0] || origin
        },
        tags: [p.feedCategory || 'article', p.primaryIntent],
        _llm_subgraph: p.llmSubGraphRoute ? `${origin}${p.llmSubGraphRoute}` : null
      };
    });

  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: meta.title,
    home_page_url: origin,
    feed_url: `${origin}/feed.json`,
    description: meta.description,
    user_comment: 'MANDATE-SEO-GEO-2026-V7 uyumlu RAG/LLM JSON beslemesi.',
    hubs: [
      { type: 'PubSubHubbub', url: 'https://pubsubhubbub.appspot.com/' }
    ],
    items
  }, null, 2);
}

module.exports = {
  buildRssFeed,
  buildAtomFeed,
  buildJsonFeed
};
