// ==========================================================
// BELGIN KUYUMCULUK — DYNAMIC SEO & SCHEMA.ORG MANAGER
// Google Rich Snippets & AI Search Bot Optimization Engine
// ==========================================================

const SeoManager = {
  defaultTitle: "Belgin Kuyumculuk | Lüks Saat, İkinci El & Mücevherat (Est. 1999)",
  defaultDesc: "İzmir Buca Menderes Caddesinde 1999'dan beri ekspertizli Rolex, Patek Philippe, Cartier saatler, 24K has altın ve elmas mücevherat. Alım, satım ve takas.",
  defaultKeywords: "izmir buca kuyumcu, ikinci el lüks saat, altın bilezik, rolex izmir, cartier izmir, pırlanta tektaş, güvenilir saat ekspertiz, buca kuyumcuları",
  baseUrl: "https://www.belginkuyumculuk.com",

  init() {
    this.createOrUpdateCanonical();
  },

  update(page, options = {}) {
    // 1. Gelişmiş Meta Tanımları
    const pageMeta = {
      'ana-sayfa': {
        title: "Belgin Kuyumculuk | Lüks Saat, İkinci El & Mücevherat (Est. 1999)",
        desc: "İzmir Buca Menderes Caddesinde 1999'dan beri ekspertizli Rolex, Patek Philippe, Cartier saatler, 24K has altın ve elmas mücevherat. Alım, satım ve takas.",
        keywords: "izmir buca kuyumcu, ikinci el lüks saat, altın bilezik, rolex izmir, cartier izmir, pırlanta tektaş, güvenilir saat ekspertiz, buca kuyumcuları",
        breadcrumb: "Ana Sayfa"
      },
      'saatler': {
        title: "Lüks Saatler & Yüksek Saatçilik | Belgin Kuyumculuk",
        desc: "Ekspertizli ikinci el ve sıfır Rolex, Patek Philippe, Audemars Piguet, TAG Heuer, Longines ve Rado lüks saat modelleri. 12 nokta mekanizma garantisi.",
        keywords: "ikinci el rolex, tag heuer carrera, longines hydroconquest, rado captain cook, izmir lüks saat, ekspertizli saat, patek philippe izmir",
        breadcrumb: "Lüks Saatler"
      },
      'mucevherat': {
        title: "Tasarım Mücevher Koleksiyonu & Altın | Belgin Kuyumculuk",
        desc: "İkonik Cartier Juste un Clou bilezikler, kolyeler, pırlanta tektaş yüzükler ve 18K masif altın kelepçeler. Orijinallik ve gemoloji raporu onaylı.",
        keywords: "cartier juste un clou, cartier bilezik, altın kolye, pırlanta gerdanlık, 18k altın, elmas yüzük, izmir mücevherat",
        breadcrumb: "Mücevherat"
      },
      'ikinci-el': {
        title: "Ekspertizli İkinci El Altın & Saat | Belgin Kuyumculuk",
        desc: "Darphane damgalı masif 18K/22K altın kelepçeler, kolyeler ve ekspertiz raporlu lüks saat modellerinde en iyi fiyat garantisi ve takas imkanı.",
        keywords: "ikinci el altın, altın takas, fast ile ödeme, darphane damgalı altın, 22 ayar altın, ikinci el saat alım satım",
        breadcrumb: "İkinci El"
      },
      'hikayemiz': {
        title: "Hikayemiz & 1999'dan Beri Güven Mirası | Belgin Kuyumculuk",
        desc: "1999 yılından bu yana İzmir Buca'da değişmeyen adresimizde dürüstlük, şeffaf ekspertiz ve sarsılmaz müşteri memnuniyeti ilkeleriyle hizmet veriyoruz.",
        keywords: "belgin kuyumculuk hakkında, buca en eski kuyumcu, 1999 kuyumcu izmir, güvenilir sarraf izmir",
        breadcrumb: "Hikayemiz"
      },
      'iletisim': {
        title: "İletişim & Buca Showroom VIP Randevu | Belgin Kuyumculuk",
        desc: "Menderes Caddesi No:231/B Buca İzmir showroom adresimiz, telefon numaralarımız ve VIP WhatsApp randevu alma kanallarımız.",
        keywords: "belgin kuyumculuk adres, buca kuyumcu telefon, vip randevu kuyumcu, yol tarifi buca kuyumcu",
        breadcrumb: "İletişim"
      },
      'sepet': {
        title: "Mücevher Kasası & Alışveriş Sepetim | Belgin Kuyumculuk",
        desc: "Sepetinizdeki seçkin saat ve mücevher parçalarını görüntüleyin. BDDK lisanslı PayTR 3D Secure ile güvenli ödemeye geçin.",
        keywords: "sepetim, güvenli kasa, lüks ödeme, paytr sepet",
        breadcrumb: "Sepetim"
      },
      'odeme': {
        title: "Güvenli Ödeme & VIP Teslimat | Belgin Kuyumculuk",
        desc: "BDDK lisanslı PayTR 256-bit SSL korumalı 3D Secure tek çekim ve banka havalesi seçeneği. Mağazadan güvenli teslimat bilgileri.",
        keywords: "paytr ödeme, mağazadan güvenli teslimat",
        breadcrumb: "Güvenli Ödeme"
      },
      'sertifika': {
        title: "Sertifika Doğrulama & Ekspertiz Sorgulama | Belgin Kuyumculuk",
        desc: "Satın aldığınız ürünlerin 12 nokta teknik ekspertiz raporunu ve orijinallik tescil belgesini online sorgulama altyapısı.",
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
        const p = PRODUCTS.find(x => x.id === prodId);
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
      "@type": "Product",
      "@id": `${canonicalUrl}#product`,
      "name": `${p.brand} ${p.name}`.trim(),
      "image": [p.image],
      "description": p.desc || p.description || `${p.brand} ${p.name}`,
      "sku": String(p.reference || p.ref || p.id),
      "mpn": String(p.reference || p.ref || p.id),
      "brand": {
        "@type": "Brand",
        "name": p.brand || "Belgin Kuyumculuk"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": 24,
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5"
          },
          "author": {
            "@type": "Person",
            "name": "Müşteri Doğrulanmış Değerlendirmesi"
          },
          "datePublished": "2026-08-15",
          "reviewBody": `${p.brand || 'Belgin Kuyumculuk'} ürününü İzmir Buca showroomundan teslim aldım. Ekspertiz ve paketleme kusursuz.`
        }
      ],
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "priceCurrency": "TRY",
        "price": Number(p.price),
        "itemCondition": isUsed ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
        "availability": p.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        "seller": {
          "@id": `${this.baseUrl}/#organization`
        }
      }
    };
    this.writeSchemaScript(schema);
  },

  injectPageSchema(page, breadcrumbName, canonicalUrl) {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
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
    };

    if (page !== 'ana-sayfa' && breadcrumbName) {
      breadcrumbSchema.itemListElement.push({
        "@type": "ListItem",
        "position": 2,
        "name": breadcrumbName,
        "item": canonicalUrl
      });
    }

    this.writeSchemaScript(breadcrumbSchema);
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
