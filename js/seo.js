// ==========================================================
// BELGIN KUYUMCULUK — DYNAMIC SEO & SCHEMA.ORG MANAGER
// Google Rich Snippets & AI Search Bot Optimization Engine
// ==========================================================

const SeoManager = {
  defaultTitle: "Belgin Saat | Lüks Saat & Prestij Koleksiyonu (Est. 1999)",
  defaultDesc: "İzmir Buca Menderes Caddesinde 1999'dan beri ekspertizli Rolex, Patek Philippe, Cartier ve lüks saat modelleri. Alım, satım ve takas.",
  defaultKeywords: "izmir buca lüks saat, ikinci el lüks saat, rolex izmir, cartier izmir, güvenilir saat ekspertiz, buca saat modelleri",
  baseUrl: "https://www.belginkuyumculuk.com",

  init() {
    this.createOrUpdateCanonical();
  },

  update(page, options = {}) {
    // 1. Gelişmiş Meta Tanımları
    const pageMeta = {
      'ana-sayfa': {
        title: "Belgin Saat | Lüks Saat & Prestij Koleksiyonu (Est. 1999)",
        desc: "İzmir Buca Menderes Caddesinde 1999'dan beri ekspertizli Rolex, Patek Philippe, Cartier ve lüks saat modelleri. Alım, satım ve takas.",
        keywords: "izmir buca lüks saat, ikinci el lüks saat, rolex izmir, cartier izmir, güvenilir saat ekspertiz, buca saat modelleri",
        breadcrumb: "Ana Sayfa"
      },
      'saatler': {
        title: "Lüks Saatler & Yüksek Saatçilik | Belgin Saat",
        desc: "Ekspertizli ikinci el ve sıfır Rolex, Patek Philippe, Audemars Piguet, TAG Heuer, Longines ve Rado lüks saat modelleri. ürün bazında kontrol bilgisi.",
        keywords: "ikinci el rolex, tag heuer carrera, longines hydroconquest, rado captain cook, izmir lüks saat, ekspertizli saat, patek philippe izmir",
        breadcrumb: "Lüks Saatler"
      },
      'mucevherat': {
        title: "Özel Koleksiyon | Belgin Saat",
        desc: "Lüks ve seçkin prestij parçaları.",
        keywords: "lüks saat, seçkin koleksiyon, izmir",
        breadcrumb: "Koleksiyon"
      },
      'ikinci-el': {
        title: "Ekspertizli Seçkin Saatler | Belgin Saat",
        desc: "ürün bazında kontrol bilgisi sunulan lüks saat modellerinde şeffaf fiyat bilgisi ve takas imkanı.",
        keywords: "ikinci el saat, saat takas, fast ile ödeme, sertifikalı saat, ikinci el saat alım satım",
        breadcrumb: "Seçkin Saatler"
      },
      'hikayemiz': {
        title: "Hikayemiz & 1999'dan Beri Güven Mirası | Belgin Saat",
        desc: "1999 yılından bu yana İzmir Buca'da değişmeyen adresimizde dürüstlük, şeffaf ekspertiz ve sarsılmaz müşteri memnuniyeti ilkeleriyle hizmet veriyoruz.",
        keywords: "belgin saat hakkında, buca en eski saat mağazası, 1999 lüks saat izmir, güvenilir saat ekspertiz",
        breadcrumb: "Hikayemiz"
      },
      'iletisim': {
        title: "İletişim & Buca Showroom VIP Randevu | Belgin Saat",
        desc: "Menderes Caddesi No:231/B Buca İzmir showroom adresimiz, telefon numaralarımız ve VIP WhatsApp randevu alma kanallarımız.",
        keywords: "belgin saat adres, buca telefon, vip randevu, yol tarifi buca showroom",
        breadcrumb: "İletişim"
      },
      'sepet': {
        title: "Alışveriş Sepetim | Belgin Saat",
        desc: "Sepetinizdeki seçkin saat parçalarını görüntüleyin. BDDK lisanslı PayTR 3D Secure ile güvenli ödemeye geçin.",
        keywords: "sepetim, güvenli kasa, lüks ödeme, paytr sepet",
        breadcrumb: "Sepetim"
      },
      'odeme': {
        title: "Güvenli Ödeme & VIP Teslimat | Belgin Saat",
        desc: "BDDK lisanslı PayTR 256-bit SSL korumalı 3D Secure tek çekim ve banka havalesi seçeneği. Mağazadan güvenli teslimat bilgileri.",
        keywords: "paytr ödeme, mağazadan güvenli teslimat",
        breadcrumb: "Güvenli Ödeme"
      },
      'sertifika': {
        title: "Sertifika Doğrulama & Ekspertiz Sorgulama | Belgin Saat",
        desc: "Satın aldığınız ürünlerin ürüne ait mevcut kontrol ve belge bilgisini online sorgulama altyapısı.",
        keywords: "sertifika doğrulama, ekspertiz sorgula, saat orijinallik kontrolü",
        breadcrumb: "Sertifika Sorgulama"
      }
    };

    let title = this.defaultTitle;
    let desc = this.defaultDesc;
    let keywords = this.defaultKeywords;
    let breadcrumbName = "";
    let canonicalUrl = this.baseUrl;

    // Ürün Sayfası Özel Kontrolü
    if (page.startsWith('urun-') || page === 'urun') {
      let prodId = options.id || options.productId;
      if (!prodId && page.startsWith('urun-')) {
        prodId = parseInt(page.replace('urun-', ''));
      }
      
      if (typeof PRODUCTS !== 'undefined') {
        const p = (typeof getProductById === 'function' ? getProductById(prodId) : null) || (PRODUCTS.find ? PRODUCTS.find(x => x.id === prodId) : null);
        if (p) {
          title = `${p.brand} ${p.name} | Belgin Kuyumculuk`;
          desc = `${p.brand} ${p.name} (${p.reference || p.ref || p.id}) - ${p.desc || p.description || ''}`.slice(0, 280);
          keywords = `${p.brand.toLowerCase()}, ${p.name.toLowerCase()}, izmir buca kuyumcu, lüks saat, külçe altın`;
          breadcrumbName = p.name;

          const route = (window.SEO_ROUTE_MAP || {})[String(p.id)] || `/?urun=${encodeURIComponent(p.id)}`;
          canonicalUrl = `${this.baseUrl}${route}`;

          // 2. Ürün İçin JSON-LD Şeması Enjekte Et
          this.injectProductSchema(p, canonicalUrl);
        }
      }
    } else {
      const meta = pageMeta[page] || pageMeta['ana-sayfa'];
      title = meta.title;
      desc = meta.desc;
      keywords = meta.keywords;
      breadcrumbName = meta.breadcrumb;

      const route = (window.SEO_CATEGORY_ROUTES || {})[page] || (page === 'ana-sayfa' ? '/' : `/${page}/`);
      canonicalUrl = `${this.baseUrl}${route}`;

      // Kategori ve Statik Sayfa Şeması Enjekte Et
      this.injectPageSchema(page, breadcrumbName, canonicalUrl);
    }

    // 3. Meta Etiketlerini Tarayıcıya Yazdır
    document.title = title;
    this.setMetaTag('description', desc);
    this.setMetaTag('keywords', keywords);

    // Open Graph
    this.setMetaProperty('og:title', title);
    this.setMetaProperty('og:description', desc);
    this.setMetaProperty('og:url', canonicalUrl);
    
    // Canonical link güncelle
    this.createOrUpdateCanonical(canonicalUrl);
  },

  setMetaTag(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  },

  setMetaProperty(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  },

  createOrUpdateCanonical(url) {
    const href = url || this.baseUrl;
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  },

  injectProductSchema(p, canonicalUrl) {
    const isUsed = p.isPreOwned || /ikinci.?el/i.test(p.conditionBadge || '');
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Product",
          "@id": `${canonicalUrl}#product`,
          "name": `${p.brand} ${p.name}`.trim(),
          "image": [p.image],
          "description": p.desc || p.description || `${p.brand} ${p.name} modeli İzmir Buca Belgin Kuyumculuk güvencesiyle.`,
          "sku": String(p.reference || p.ref || p.id),
          "mpn": String(p.reference || p.ref || p.id),
          "brand": {
            "@type": "Brand",
            "name": p.brand || "Belgin Saat"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": 28,
            "bestRating": "5",
            "worstRating": "1"
          },
          "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": "TRY",
            "price": Number(p.price),
            "priceValidUntil": "2027-12-31",
            "itemCondition": isUsed ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
            "availability": p.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "hasMerchantReturnPolicy": {
              "@type": "MerchantReturnPolicy",
              "applicableCountry": "TR",
              "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
              "merchantReturnDays": 14,
              "returnMethod": "https://schema.org/ReturnInStore",
              "returnFees": "https://schema.org/FreeReturn"
            },
            "shippingDetails": {
              "@type": "OfferShippingDetails",
              "shippingRate": {
                "@type": "MonetaryAmount",
                "value": "0",
                "currency": "TRY"
              },
              "shippingDestination": {
                "@type": "DefinedRegion",
                "addressCountry": "TR"
              }
            },
            "seller": {
              "@id": `${this.baseUrl}/#organization`
            }
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumb`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Ana Sayfa",
              "item": `${this.baseUrl}/`
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": p.category === 'mucevherat' ? "Mücevherat" : "Saatler",
              "item": `${this.baseUrl}/${p.category === 'mucevherat' ? 'mucevherat' : 'saatler'}/`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": `${p.brand} ${p.name}`,
              "item": canonicalUrl
            }
          ]
        }
      ]
    };
    this.writeSchemaScript(schema);
  },

  injectPageSchema(page, breadcrumbName, canonicalUrl) {
    const graph = [
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Ana Sayfa",
            "item": `${this.baseUrl}/`
          }
        ]
      }
    ];

    if (page !== 'ana-sayfa' && breadcrumbName) {
      graph[0].itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": breadcrumbName,
        "item": canonicalUrl
      });
    }

    // Kategori Sayfaları İçin ItemList & CollectionPage
    if (page === 'saatler' || page === 'elit-kategori' || page === 'mucevherat') {
      const isElite = page === 'elit-kategori';
      const isJewel = page === 'mucevherat';
      let items = [];
      if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
        if (isElite) {
          items = PRODUCTS.filter(p => p.isElite || p.category === 'elit-saatler').slice(0, 16);
        } else if (isJewel) {
          items = PRODUCTS.filter(p => p.category === 'mucevherat' || p.isGold).slice(0, 16);
        } else {
          items = PRODUCTS.filter(p => !p.isGold && p.category !== 'mucevherat').slice(0, 16);
        }
      }

      const collectionPageSchema = {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#collection`,
        "url": canonicalUrl,
        "name": breadcrumbName || "Koleksiyon",
        "isPartOf": { "@id": `${this.baseUrl}/#website` },
        "mainEntity": {
          "@type": "ItemList",
          "name": breadcrumbName || "Ürün Koleksiyonu",
          "numberOfItems": items.length,
          "itemListElement": items.map((p, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": {
              "@type": "Product",
              "name": `${p.brand} ${p.name}`.trim(),
              "url": `${this.baseUrl}${(window.SEO_ROUTE_MAP || {})[String(p.id)] || `/?urun=${p.id}`}`,
              "image": p.image,
              "brand": { "@type": "Brand", "name": p.brand },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "TRY",
                "price": Number(p.price),
                "availability": p.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
              }
            }
          }))
        }
      };
      graph.push(collectionPageSchema);
    } else if (page === 'canli-fiyatlar') {
      graph.push({
        "@type": "FinancialProduct",
        "@id": `${canonicalUrl}#rates`,
        "name": "Belgin Kuyumculuk Canlı Altın ve Borsa Kurları",
        "description": "İzmir Kuyumcular Odası (İZKO) ve Harem Altın canlı verisiyle 24K Has Altın, 22 Ayar Bilezik, Çeyrek, Yarım ve Ata Altın kurları.",
        "provider": { "@id": `${this.baseUrl}/#organization` },
        "currenciesAccepted": "TRY, USD, EUR, GBP"
      });
    }

    this.writeSchemaScript({ "@context": "https://schema.org", "@graph": graph });
  },

  writeSchemaScript(schema) {
    let scriptEl = document.getElementById('dynamic-seo-schema');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.setAttribute('type', 'application/ld+json');
      scriptEl.setAttribute('id', 'dynamic-seo-schema');
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schema, null, 2);
  }
};

// Modül export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SeoManager };
}
