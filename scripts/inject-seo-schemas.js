// BELGIN KUYUMCULUK — SCHEMA.ORG @GRAPH & CANONICAL INJECTOR
// Universal SEO & AI Discoverability v5.0 Omni-Enterprise Standard

const fs = require('fs');
const path = require('path');
const { BASE_URL, PRIMARY_ORGANIZATION, SEO_REGISTRY } = require('./seo-registry.js');

const ROOT_DIR = path.join(__dirname, '..');

function buildPageJsonLd(page) {
  const pageUrl = `${BASE_URL}${page.route}`;
  const graph = [
    {
      "@type": "JewelryStore",
      "@id": `${BASE_URL}/#organization`,
      "name": PRIMARY_ORGANIZATION.name,
      "alternateName": PRIMARY_ORGANIZATION.alternateName,
      "url": BASE_URL,
      "logo": PRIMARY_ORGANIZATION.logo,
      "telephone": PRIMARY_ORGANIZATION.telephone,
      "email": PRIMARY_ORGANIZATION.email,
      "address": {
        "@type": "PostalAddress",
        ...PRIMARY_ORGANIZATION.address
      },
      "geo": {
        "@type": "GeoCoordinates",
        ...PRIMARY_ORGANIZATION.geo
      },
      "sameAs": PRIMARY_ORGANIZATION.sameAs
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "url": BASE_URL,
      "name": "Belgin Kuyumculuk & Saat",
      "publisher": { "@id": `${BASE_URL}/#organization` },
      "inLanguage": page.locale || "tr-TR"
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      "url": pageUrl,
      "name": page.title,
      "description": page.metaDescription,
      "isPartOf": { "@id": `${BASE_URL}/#website` },
      "inLanguage": page.locale || "tr-TR",
      "breadcrumb": { "@id": `${pageUrl}#breadcrumb` }
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Ana Sayfa",
          "item": BASE_URL
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": page.h1 || page.title,
          "item": pageUrl
        }
      ]
    }
  ];

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

function processHtmlFiles() {
  for (const page of SEO_REGISTRY) {
    if (page.route === '/') continue; // index.html already has custom complex schema
    const filename = page.route.replace(/^\//, '');
    let filePath = path.join(ROOT_DIR, filename);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) continue;

    let content = fs.readFileSync(filePath, 'utf8');
    const pageUrl = `${BASE_URL}${page.route}`;

    // 1. Canonical Link
    if (!content.includes('rel="canonical"')) {
      const canonicalTag = `\n  <link rel="canonical" href="${pageUrl}">`;
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${canonicalTag}\n</head>`);
      }
    }

    // 2. Schema.org JSON-LD
    if (!content.includes('application/ld+json')) {
      const jsonLd = `\n  <!-- SCHEMA.ORG JSON-LD v5.0 OMNI-ENTERPRISE -->\n  <script type="application/ld+json">\n${buildPageJsonLd(page)}\n  </script>\n`;
      if (content.includes('</head>')) {
        content = content.replace('</head>', `${jsonLd}</head>`);
      }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[schema-injector] ${filename} için Canonical ve Schema.org JSON-LD güncellendi.`);
  }
}

processHtmlFiles();
