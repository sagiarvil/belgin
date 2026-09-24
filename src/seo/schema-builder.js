/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & MULTI-TIER LLMS ARCHITECTURE
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7
 * Dinamik @graph JSON-LD Şema Üreteci (src/seo/schema-builder.js)
 */

'use strict';

function buildCompleteJsonLdGraph(page, domain = 'www.belginkuyumculuk.com') {
  const origin = `https://${domain}`;
  const pageUrl = `${origin}${page.route === '/' ? '' : page.route}`;

  const graph = [
    // 1. Kurumsal Otorite Düğümü
    {
      '@type': 'JewelryStore',
      '@id': `${origin}/#organization`,
      name: 'Belgin Kuyumculuk & Saat',
      url: origin,
      logo: {
        '@type': 'ImageObject',
        '@id': `${origin}/#logo`,
        url: `${origin}/images/logo.png`,
        caption: 'Belgin Kuyumculuk & Saat Logo'
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Menderes Caddesi No:142',
        addressLocality: 'Buca',
        addressRegion: 'İzmir',
        postalCode: '35380',
        addressCountry: 'TR'
      },
      telephone: '+90 232 440 00 00',
      priceRange: '₺₺₺₺',
      sameAs: [
        'https://www.wikidata.org/wiki/Q11589432',
        'https://tr.wikipedia.org/wiki/Belgin_Kuyumculuk',
        'https://www.instagram.com/belginkuyumculuk'
      ]
    },
    // 2. WebSite Düğümü
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: origin,
      name: 'Belgin Kuyumculuk & Saat',
      publisher: { '@id': `${origin}/#organization` },
      inLanguage: page.locale,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    },
    // 3. WebPage Düğümü
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      description: page.metaDescription,
      isPartOf: { '@id': `${origin}/#website` },
      about: { '@id': page.primaryEntity ? page.primaryEntity.id : `${origin}/#organization` },
      datePublished: page.publishedAt,
      dateModified: page.modifiedAt,
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
      primaryImageOfPage: page.openGraphImage ? { '@id': `${pageUrl}#primaryimage` } : undefined,
      speakable: page.speakableSelectors ? { '@type': 'SpeakableSpecification', cssSelector: page.speakableSelectors } : undefined
    },
    // 4. BreadcrumbList Düğümü
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: (page.breadcrumbs || []).map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: b.item.startsWith('http') ? b.item : `${origin}${b.item}`
      }))
    }
  ];

  // 5. Primary ImageObject
  if (page.openGraphImage) {
    graph.push({
      '@type': 'ImageObject',
      '@id': `${pageUrl}#primaryimage`,
      url: `${origin}${page.openGraphImage.url}`,
      contentUrl: `${origin}${page.openGraphImage.url}`,
      width: page.openGraphImage.width,
      height: page.openGraphImage.height,
      caption: page.openGraphImage.caption || page.openGraphImage.alt,
      encodingFormat: page.openGraphImage.mimeType
    });
  }

  // 6. VideoObject
  if (page.video) {
    graph.push({
      '@type': 'VideoObject',
      '@id': `${pageUrl}#video`,
      name: page.video.title,
      description: page.video.description,
      thumbnailUrl: `${origin}${page.video.thumbnailUrl}`,
      uploadDate: page.video.uploadDate,
      duration: page.video.duration,
      contentUrl: `${origin}${page.video.url}`,
      transcript: page.video.transcriptUrl ? `${origin}${page.video.transcriptUrl}` : undefined
    });
  }

  // 7. Author Person
  if (page.author) {
    graph.push({
      '@type': 'Person',
      '@id': page.author.id,
      name: page.author.name,
      sameAs: page.author.sameAs
    });
  }

  // 8. Reviewer Person
  if (page.reviewedBy) {
    graph.push({
      '@type': 'Person',
      '@id': page.reviewedBy.id,
      name: page.reviewedBy.name,
      sameAs: page.reviewedBy.sameAs
    });
  }

  // 9. AggregateRating
  if (page.aggregateRating) {
    graph.push({
      '@type': 'AggregateRating',
      '@id': `${pageUrl}#rating`,
      ratingValue: page.aggregateRating.value,
      reviewCount: page.aggregateRating.count,
      bestRating: page.aggregateRating.best,
      worstRating: page.aggregateRating.worst,
      itemReviewed: { '@id': `${pageUrl}#webpage` }
    });
  }

  // 10. FAQPage Düğümü (Zero-Ambiguity FAQ)
  if (page.faqs && page.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: page.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

module.exports = { buildCompleteJsonLdGraph };
