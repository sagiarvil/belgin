import { SeoPageRecord } from './registry.types';

export function buildCompleteJsonLdGraph(page: SeoPageRecord, domain: string): string {
  const origin = `https://${domain.replace(/^https?:\/\//, '')}`;
  const pageUrl = `${origin}${page.route === '/' ? '' : page.route}`;

  const graph: Record<string, any>[] = [
    // 1. Kurumsal Otorite Düğümü
    {
      '@type': 'JewelryStore',
      '@id': `${origin}/#organization`,
      name: 'BELGİN KUYUMCULUK - SEMİH SONBAHAR',
      alternateName: 'Belgin Kuyumculuk & Saat (Est. 1999)',
      url: origin,
      logo: {
        '@type': 'ImageObject',
        '@id': `${origin}/#logo`,
        url: `${origin}/images/belgin-logo.png`,
        caption: 'Belgin Kuyumculuk Logo'
      },
      telephone: '+90-541-930-53-72',
      email: 'destek@belginkuyumculuk.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Menderes Caddesi No:231/B',
        addressLocality: 'Buca',
        addressRegion: 'İzmir',
        postalCode: '35380',
        addressCountry: 'TR'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 38.3842,
        longitude: 27.1685
      },
      sameAs: [
        'https://www.instagram.com/belginmucevherat/',
        'https://share.google/e2vmC425agvKPAAHR'
      ]
    },
    // 2. WebSite Düğümü
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: origin,
      name: 'Belgin Kuyumculuk & Saat',
      publisher: { '@id': `${origin}/#organization` },
      inLanguage: page.locale || 'tr-TR'
    },
    // 3. WebPage Düğümü
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      description: page.metaDescription,
      isPartOf: { '@id': `${origin}/#website` },
      about: page.primaryEntity ? { '@id': page.primaryEntity.id || `${origin}/#organization` } : undefined,
      datePublished: page.publishedAt,
      dateModified: page.modifiedAt,
      breadcrumb: { '@id': `${pageUrl}#breadcrumb` }
    },
    // 4. BreadcrumbList Düğümü
    {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: (page.breadcrumbs && page.breadcrumbs.length > 0)
        ? page.breadcrumbs.map((b, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: b.name,
            item: b.item.startsWith('http') ? b.item : `${origin}${b.item}`
          }))
        : [
            { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${origin}/` },
            ...(page.route !== '/' ? [{ '@type': 'ListItem', position: 2, name: page.h1 || page.title, item: pageUrl }] : [])
          ]
    }
  ];

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}
