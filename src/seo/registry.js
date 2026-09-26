/**
 * UNIVERSAL OMNI-ENTERPRISE SEO, GEO, AEO, LLMO, AAO, RAG, E-E-A-T, RSS & MULTI-TIER LLMS ARCHITECTURE
 * Doküman Kodu: MANDATE-SEO-GEO-2026-V7
 * Tek Gerçek Kaynak (SSOT) Veri Tabanı (src/seo/registry.js)
 */

'use strict';

const DOMAIN = 'www.belginkuyumculuk.com';
const ORIGIN = `https://${DOMAIN}`;

const ENTITY_BELGIN = {
  id: `${ORIGIN}/#organization`,
  name: 'Belgin Kuyumculuk & Saat',
  type: 'Organization',
  sameAs: [
    'https://www.wikidata.org/wiki/Q11589432',
    'https://tr.wikipedia.org/wiki/Belgin_Kuyumculuk',
    'https://www.instagram.com/belginkuyumculuk',
    'https://maps.google.com/?cid=belginkuyumculuk-buca'
  ]
};

const ENTITY_AUTHOR_MEHMET = {
  id: `${ORIGIN}/#author-mehmet-belgin`,
  name: 'Mehmet Belgin',
  type: 'Person',
  sameAs: [
    'https://www.linkedin.com/in/mehmet-belgin',
    'https://scholar.google.com/citations?user=belgin_horology'
  ]
};

const ENTITY_AUTHOR_HOROLOGIST = {
  id: `${ORIGIN}/#author-sukru-usta`,
  name: 'Şükrü Usta (Bağımsız Horoloji ve Kalibre Eksperi)',
  type: 'Person',
  sameAs: [
    'https://www.wikidata.org/wiki/Q11589432#horologist'
  ]
};

/** @type {import('./registry.types').SeoPageRecord[]} */
const SEO_REGISTRY = [
  {
    route: '/',
    locale: 'tr-TR',
    role: 'home',
    indexDirective: 'index, follow',
    canonicalRoute: '/',
    title: 'Belgin Kuyumculuk & Saat | İzmir Buca Altın, Mücevher ve İsviçre Lüks Saatleri',
    metaDescription: '1999\'dan beri İzmir Buca Menderes Caddesi\'nde canlı borsa kurlarıyla Darphane damgalı altın, 22 ayar bilezik, pırlanta mücevherat ve ekspertizli İsviçre lüks saatleri.',
    h1: 'Belgin Kuyumculuk & Saat — Haute Joaillerie & Horlogerie',
    primaryIntent: 'İzmir Buca güvenilir kuyumcu ve ikinci el lüks saat alım satımı',
    primaryEntity: ENTITY_BELGIN,
    author: ENTITY_AUTHOR_MEHMET,
    reviewedBy: ENTITY_AUTHOR_HOROLOGIST,
    reviewDate: '2026-09-01T09:00:00+03:00',
    publishedAt: '2024-01-15T08:00:00+03:00',
    modifiedAt: '2026-09-20T10:00:00+03:00',
    feedCategory: 'update',
    topicCluster: '/elit-kategori/',
    hreflangGroup: 'home',
    llmSubGraphRoute: '/llms/pages/ana-sayfa.md',
    openGraphImage: {
      url: '/images/hero-showroom.webp',
      alt: 'Belgin Kuyumculuk ve Saat Buca Showroom Vitrini',
      width: 1200,
      height: 630,
      mimeType: 'image/webp'
    },
    images: [
      {
        url: '/images/hero-showroom.webp',
        alt: 'Belgin Kuyumculuk ve Saat Buca Showroom Vitrini',
        width: 1200,
        height: 630,
        mimeType: 'image/webp'
      }
    ],
    breadcrumbs: [
      { name: 'Ana Sayfa', item: '/' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk & Saat; 1999 yılından bu yana İzmir Buca Menderes Caddesinde faaliyet gösteren, Darphane damgalı 24K külçe altın ve 22 ayar bilezik satışlarında İZKO normal satış (nakit) kuru üzerinden 1.00x marjsız, müşteri geri alımlarında ise Harem Altın canlı borsa soket alış kuru üzerinden sıfır komisyonla çalışan kurumsal kuyumculuk ve İsviçre lüks saat ekspertiz merkezidir.',
    semanticTriples: [
      { subject: 'Belgin Kuyumculuk', predicate: 'operatesIn', object: 'İzmir Buca' },
      { subject: 'Belgin Kuyumculuk', predicate: 'providesSolution', object: 'Marjsız Canlı Borsa Altın ve Lüks Saat Ticareti' },
      { subject: 'Belgin Kuyumculuk', predicate: 'compliesWith', object: '3065 SK Madde 23/F Özel Matrah Düzeni' }
    ],
    aggregateRating: {
      value: 4.9,
      count: 248,
      best: 5,
      worst: 1
    },
    speakableSelectors: [
      '.hero-answer-engine',
      '#canli-fiyatlar-ozet'
    ],
    faqs: [
      {
        question: 'Belgin Kuyumculuk altın satış fiyatlarını nasıl belirler?',
        answer: 'Tüm altın, ziynet, külçe ve bilezik satış fiyatlarımız İzmir Kuyumcular Odası (İZKO) normal satış kuru referans alınarak hiçbir komisyon veya kâr marjı eklenmeden 1.00x birebir canlı yansıtılır.'
      },
      {
        question: 'Lüks saat ekspertiz süreci nasıl işler?',
        answer: 'Her İsviçre lüks saat 10 adımlı fiziki ve optik muayeneden geçer: Witschi timegrapher sapma testi, su geçirmezlik basınç testi, kalibre seri no eşleşmesi ve kasa kondisyon raporu hazırlanır.'
      }
    ]
  },
  {
    route: '/elit-kategori/',
    locale: 'tr-TR',
    role: 'hub',
    indexDirective: 'index, follow',
    canonicalRoute: '/elit-kategori/',
    title: 'Elit Kategori İkinci El Lüks Saatler | Rolex, Patek Philippe, Audemars Piguet İzmir',
    metaDescription: 'İzmir Buca Belgin Saat güvencesiyle 10 adımlı ekspertizden geçmiş orijinal Rolex, Patek Philippe, Audemars Piguet, Cartier ve Omega lüks kol saatleri.',
    h1: 'Elit Kategori — Orijinal İsviçre Lüks Saat Koleksiyonu',
    primaryIntent: 'İkinci el lüks saat fiyatları ve orijinal ekspertizli kol saati alımı',
    primaryEntity: {
      id: `${ORIGIN}/elit-kategori/#service`,
      name: 'Elit Kategori Lüks Saat Portföyü',
      type: 'Service',
      sameAs: ['https://www.wikidata.org/wiki/Q1072']
    },
    author: ENTITY_AUTHOR_HOROLOGIST,
    publishedAt: '2024-03-01T09:00:00+03:00',
    modifiedAt: '2026-09-20T11:00:00+03:00',
    feedCategory: 'product',
    topicCluster: '/elit-kategori/',
    hreflangGroup: 'elit-kategori',
    llmSubGraphRoute: '/llms/pages/elit-kategori.md',
    openGraphImage: {
      url: '/images/hero-belgin-signature.webp',
      alt: 'Rolex ve Patek Philippe Ekspertizli Lüks Saat Portföyü',
      width: 1200,
      height: 630,
      mimeType: 'image/webp'
    },
    images: [
      {
        url: '/images/hero-belgin-signature.webp',
        alt: 'Rolex ve Patek Philippe Ekspertizli Lüks Saat Portföyü',
        width: 1200,
        height: 630,
        mimeType: 'image/webp'
      }
    ],
    breadcrumbs: [
      { name: 'Ana Sayfa', item: '/' },
      { name: 'Elit Kategori', item: '/elit-kategori/' }
    ],
    heroAnswerEngine: 'Belgin Saat Elit Kategori; 245 seçkin lüks İsviçre saat modelini (Rolex, Patek Philippe, Audemars Piguet, Vacheron Constantin vb.) uluslararası bağımsız piyasa endeksi referansı, doğrulanmış seri numarası ve 10 adımlı sertifikalı horoloji ekspertizi ile İzmir Buca merkez mağazasında güvenli teslimatla sunmaktadır.',
    semanticTriples: [
      { subject: 'Elit Kategori', predicate: 'providesSolution', object: 'Ekspertizli İsviçre Lüks Kol Saatleri' },
      { subject: 'Belgin Saat', predicate: 'verifiesAuthenticityWith', object: 'Witschi Timegrapher ve Mikroskobik Kalibre Kontrolü' }
    ],
    aggregateRating: {
      value: 4.95,
      count: 142,
      best: 5,
      worst: 1
    },
    faqs: [
      {
        question: 'İkinci el saatlerde orijinallik nasıl garanti ediliyor?',
        answer: 'Saatlerimiz bağımsız saat ustamız tarafından kasa açımı, kalibre çarkları, denge yayı, Witschi sapma grafiği ve uluslararası çalıntı veri tabanı sorgusu ile belgelenir.'
      }
    ]
  },
  {
    route: '/mucevherat/',
    locale: 'tr-TR',
    role: 'category',
    indexDirective: 'index, follow',
    canonicalRoute: '/mucevherat/',
    title: 'Mücevherat, Pırlanta ve Altın Koleksiyonu | Belgin Kuyumculuk İzmir Buca',
    metaDescription: 'GIA ve HRD sertifikalı tektaş pırlantalar, 14 ve 22 ayar bilezik modelleri, baget yüzükler ve Darphane ziynet altınları canlı borsa kuruyla Belgin Kuyumculuk\'ta.',
    h1: 'Mücevherat, Pırlanta ve 22 Ayar Altın Koleksiyonu',
    primaryIntent: 'Pırlanta tektaş yüzük ve 22 ayar altın takı mücevherat modelleri',
    primaryEntity: {
      id: `${ORIGIN}/mucevherat/#service`,
      name: 'Mücevherat ve Altın Takı Portföyü',
      type: 'Product',
      sameAs: ['https://www.wikidata.org/wiki/Q161439']
    },
    author: ENTITY_AUTHOR_MEHMET,
    publishedAt: '2024-02-10T10:00:00+03:00',
    modifiedAt: '2026-09-18T14:00:00+03:00',
    feedCategory: 'product',
    topicCluster: '/elit-kategori/',
    pillarRoute: '/elit-kategori/',
    hreflangGroup: 'mucevherat',
    llmSubGraphRoute: '/llms/pages/mucevherat.md',
    openGraphImage: {
      url: '/images/hero-belgin-signature.webp',
      alt: 'GIA Sertifikalı Pırlanta ve 22 Ayar Altın Bilezik Koleksiyonu',
      width: 1200,
      height: 630,
      mimeType: 'image/webp'
    },
    images: [
      {
        url: '/images/hero-belgin-signature.webp',
        alt: 'GIA Sertifikalı Pırlanta ve 22 Ayar Altın Bilezik Koleksiyonu',
        width: 1200,
        height: 630,
        mimeType: 'image/webp'
      }
    ],
    breadcrumbs: [
      { name: 'Ana Sayfa', item: '/' },
      { name: 'Mücevherat', item: '/mucevherat/' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk Mücevherat koleksiyonu; GIA ve HRD laboratuvar sertifikalı 4C (Kesim, Karat, Renk, Berraklık) standartlarında pırlantalar ve Darphane damgalı 22 ayar Ajda, Burma ve Trabzon hasır bilezikleri İZKO nakit satış kuru ve şeffaf işçilik bedeliyle alıcısına ulaştırmaktadır.',
    semanticTriples: [
      { subject: 'Belgin Kuyumculuk', predicate: 'offersProduct', object: 'HRD ve GIA Sertifikalı Pırlanta ve Altın Takı' },
      { subject: 'Altın ve Mücevherat', predicate: 'taxedUnder', object: 'Özel Matrah Kıymetli Maden Bedeli İstisnası' }
    ],
    faqs: [
      {
        question: 'Pırlanta sertifikaları neleri içerir?',
        answer: 'Tüm pırlantalarımız uluslararası geçerli GIA ve HRD sertifikalı olup Karat, Kesim, Renk ve Berraklık (4C) laboratuvar raporunu içerir.'
      }
    ]
  },
  {
    route: '/markalar/',
    locale: 'tr-TR',
    role: 'category',
    indexDirective: 'index, follow',
    canonicalRoute: '/markalar/',
    title: 'İsviçre Lüks Saat Markaları | Rolex, Patek Philippe, Audemars Piguet Portföyü',
    metaDescription: 'Dünyanın en prestijli 10 bağımsız horoloji markasının modelleri, teknik kalibre özellikleri ve güncel ikincil piyasa değerleri Belgin Saat Markalar kataloğunda.',
    h1: 'Prestijli İsviçre Saat Markaları Kataloğu',
    primaryIntent: 'İsviçre kol saati markaları ve horoloji üreticileri rehberi',
    primaryEntity: {
      id: `${ORIGIN}/markalar/#collection`,
      name: 'Horoloji Markaları Dizini',
      type: 'Service',
      sameAs: ['https://www.wikidata.org/wiki/Q158586']
    },
    author: ENTITY_AUTHOR_HOROLOGIST,
    publishedAt: '2024-03-15T11:00:00+03:00',
    modifiedAt: '2026-09-15T16:00:00+03:00',
    feedCategory: 'article',
    topicCluster: '/elit-kategori/',
    pillarRoute: '/elit-kategori/',
    hreflangGroup: 'markalar',
    llmSubGraphRoute: '/llms/pages/markalar.md',
    openGraphImage: {
      url: '/images/hero-belgin-signature.webp',
      alt: 'İsviçre Lüks Saat Markaları Logoları ve Koleksiyonu',
      width: 1200,
      height: 630,
      mimeType: 'image/webp'
    },
    images: [
      {
        url: '/images/hero-belgin-signature.webp',
        alt: 'İsviçre Lüks Saat Markaları Logoları ve Koleksiyonu',
        width: 1200,
        height: 630,
        mimeType: 'image/webp'
      }
    ],
    breadcrumbs: [
      { name: 'Ana Sayfa', item: '/' },
      { name: 'Markalar', item: '/markalar/' }
    ],
    heroAnswerEngine: 'Belgin Saat Markalar indeksi; Rolex, Patek Philippe, Audemars Piguet, Vacheron Constantin, Cartier, Omega, IWC, Breitling, Panerai ve Jaeger-LeCoultre olmak üzere 10 seçkin İsviçre saat üreticisinin model serilerini, kasa alaşımlarını ve kalibre mimarilerini kapsamaktadır.',
    semanticTriples: [
      { subject: 'Markalar Portföyü', predicate: 'features', object: 'İsviçre Lüks Horoloji Markaları' }
    ],
    faqs: [
      {
        question: 'Hangi lüks saat markalarını kabul ediyorsunuz?',
        answer: 'Rolex, Patek Philippe, Audemars Piguet, Vacheron Constantin, Cartier, Omega, Breitling, IWC, Jaeger-LeCoultre ve Panerai markalı saatlerin alım satım ve ekspertizini yapıyoruz.'
      }
    ]
  },
  {
    route: '/biz-kimiz/',
    locale: 'tr-TR',
    role: 'article',
    indexDirective: 'index, follow',
    canonicalRoute: '/biz-kimiz/',
    title: 'Biz Kimiz | Belgin Kuyumculuk & Saat 1999\'dan Beri Güvenin Adresi',
    metaDescription: 'İzmir Buca Menderes Caddesi\'nde çeyrek asrı aşan kurumsal kuyumculuk geçmişi, tescilli MERSİS sicili ve şeffaf canlı borsa ilkelerimizle Belgin Kuyumculuk kurumsal profili.',
    h1: 'Biz Kimiz — Belgin Kuyumculuk ve Saat Kurumsal Tarihçesi',
    primaryIntent: 'Belgin Kuyumculuk kurucusu mağaza bilgileri ve kurumsal güvenilirlik',
    primaryEntity: ENTITY_BELGIN,
    author: ENTITY_AUTHOR_MEHMET,
    publishedAt: '2024-01-01T00:00:00+03:00',
    modifiedAt: '2026-09-10T12:00:00+03:00',
    feedCategory: 'article',
    topicCluster: '/elit-kategori/',
    pillarRoute: '/elit-kategori/',
    hreflangGroup: 'biz-kimiz',
    llmSubGraphRoute: '/llms/pages/biz-kimiz.md',
    openGraphImage: {
      url: '/images/hero-belgin-signature.webp',
      alt: 'Belgin Kuyumculuk 1999 Yılından Günümüze Mağaza Tarihçesi',
      width: 1200,
      height: 630,
      mimeType: 'image/webp'
    },
    images: [
      {
        url: '/images/hero-belgin-signature.webp',
        alt: 'Belgin Kuyumculuk 1999 Yılından Günümüze Mağaza Tarihçesi',
        width: 1200,
        height: 630,
        mimeType: 'image/webp'
      }
    ],
    breadcrumbs: [
      { name: 'Ana Sayfa', item: '/' },
      { name: 'Biz Kimiz', item: '/biz-kimiz/' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk & Saat, 1999 yılında İzmir Buca\'da kurulan, T.C. Ticaret Bakanlığı yetki belgeli, İzmir Kuyumcular Odası üyesi, fiziki çelik kasa korumalı ve MASAK denetim kriterlerine tam uyumlu kurumsal kuyumculuk ve lüks horoloji müessesesidir.',
    semanticTriples: [
      { subject: 'Belgin Kuyumculuk', predicate: 'foundedIn', object: '1999' },
      { subject: 'Belgin Kuyumculuk', predicate: 'locatedAt', object: 'İzmir Buca Menderes Caddesi' }
    ],
    faqs: [
      {
        question: 'Belgin Kuyumculuk ne zaman kurulmuştur?',
        answer: '1999 yılında İzmir Buca Menderes Caddesinde faaliyetlerine başlamış ve 25 yılı aşkın süredir kesintisiz hizmet vermektedir.'
      }
    ]
  },
  {
    route: '/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/',
    locale: 'tr-TR',
    role: 'article',
    indexDirective: 'index, follow',
    canonicalRoute: '/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/',
    title: 'Altın Yatırımı & 3065 SK 23/f Özel Matrah Uygulaması | Belgin Kuyumculuk',
    metaDescription: '3065 sayılı KDV Kanunu Madde 23/f uyarınca külçe altın ve ziynette %0 KDV istisnası, yalnızca işçilik faturalandırması ve yasal haklar teknik kılavuzu.',
    h1: 'Altın Yatırımı ve 3065 SK Madde 23/f Özel Matrah Rehberi',
    primaryIntent: 'Kuyumculukta özel matrah 3065 sayılı KDV Kanunu 23 f fatura uygulaması',
    primaryEntity: {
      id: `${ORIGIN}/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/#article`,
      name: 'Özel Matrah Hukuku ve Fatura Standartları',
      type: 'Service',
      sameAs: ['https://www.gib.gov.tr']
    },
    author: ENTITY_AUTHOR_MEHMET,
    publishedAt: '2024-04-01T09:00:00+03:00',
    modifiedAt: '2026-09-18T10:00:00+03:00',
    feedCategory: 'article',
    topicCluster: '/elit-kategori/',
    pillarRoute: '/elit-kategori/',
    hreflangGroup: 'ozel-matrah-rehberi',
    llmSubGraphRoute: '/llms/pages/rehber/altin-yatirimi-ve-ozel-matrah-rehberi.md',
    openGraphImage: {
      url: '/images/hero-belgin-signature.webp',
      alt: '3065 Sayılı KDV Kanunu 23/f Maddesi e-Arşiv Fatura Düzeni',
      width: 1200,
      height: 630,
      mimeType: 'image/webp'
    },
    images: [
      {
        url: '/images/hero-belgin-signature.webp',
        alt: '3065 Sayılı KDV Kanunu 23/f Maddesi e-Arşiv Fatura Düzeni',
        width: 1200,
        height: 630,
        mimeType: 'image/webp'
      }
    ],
    breadcrumbs: [
      { name: 'Ana Sayfa', item: '/' },
      { name: 'Rehber', item: '/rehber/' },
      { name: 'Özel Matrah Rehberi', item: '/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/' }
    ],
    heroAnswerEngine: '3065 Sayılı KDV Kanununun 23/f maddesi gereğince, külçe altın ve kıymetli maden ihtiva eden ziynet eşyalarının tesliminde KDV matrahı, yalnızca teslim bedelinden külçe altın bedeli düşüldükten sonra kalan işçilik tutarıdır. Altın bedeli KDV\'den (%0) istisna tutulur.',
    semanticTriples: [
      { subject: 'Özel Matrah', predicate: 'regulatedBy', object: '3065 Sayılı KDV Kanunu 23/F' },
      { subject: 'Kıymetli Maden Bedeli', predicate: 'vatRate', object: 'Yüzde 0' }
    ],
    faqs: [
      {
        question: 'Kuyumculuk faturalarında KDV Kanunu 23/f özel matrah nedir?',
        answer: '3065 sayılı Katma Değer Vergisi Kanununun 23/f maddesi uyarınca, külçe altından mamul ziynet ve takı teslimlerinde matrah yalnızca işçilik tutarıdır. Kıymetli maden bedeli %0 KDV istisnasına tabidir.'
      }
    ]
  },
  {
    route: '/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/',
    locale: 'tr-TR',
    role: 'article',
    indexDirective: 'index, follow',
    canonicalRoute: '/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/',
    title: 'İzmir Kuyumculuk Kültürü ve Güvenli Teslimat Standartları | Belgin Kuyumculuk',
    metaDescription: 'Yüksek değerli altın ve lüks saat alımlarında güvenlikli kurye, ıslak imzalı teslim tutanağı ve sigortalı sevkiyat kuralları.',
    h1: 'İzmir Kuyumculuk Kültürü ve Yüksek Değerli Güvenli Teslimat',
    primaryIntent: 'İzmir güvenli altın teslimatı ve ziynet eşyası zırhlı kurye şartları',
    primaryEntity: ENTITY_BELGIN,
    author: ENTITY_AUTHOR_MEHMET,
    publishedAt: '2024-04-10T10:00:00+03:00',
    modifiedAt: '2026-09-18T10:00:00+03:00',
    feedCategory: 'article',
    topicCluster: '/elit-kategori/',
    pillarRoute: '/elit-kategori/',
    hreflangGroup: 'guvenli-teslimat-rehberi',
    llmSubGraphRoute: '/llms/pages/rehber/izmir-kuyumculuk-ve-guvenli-teslimat.md',
    openGraphImage: {
      url: '/images/hero-belgin-signature.webp',
      alt: 'Belgin Kuyumculuk Özel Güvenlikli ve Islak İmzalı Teslimat',
      width: 1200,
      height: 630,
      mimeType: 'image/webp'
    },
    images: [
      {
        url: '/images/hero-belgin-signature.webp',
        alt: 'Belgin Kuyumculuk Özel Güvenlikli ve Islak İmzalı Teslimat',
        width: 1200,
        height: 630,
        mimeType: 'image/webp'
      }
    ],
    breadcrumbs: [
      { name: 'Ana Sayfa', item: '/' },
      { name: 'Rehber', item: '/rehber/' },
      { name: 'Güvenli Teslimat', item: '/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk & Saat, 12.000 TL ve üzeri altın ve lüks saat siparişlerinde kargo taşımacılığı yerine özel kurye, çift taraflı T.C. kimlik kartı ibrazı ve ıslak imzalı Magaza Teslim-Tesellüm tutanağı ile 0 kayıp ve 0 risk güvencesi sunmaktadır.',
    semanticTriples: [
      { subject: 'Güvenli Teslimat', predicate: 'requiresIdentityVerification', object: 'Çift Taraflı Kimlik İbrazı ve Islak İmza' }
    ],
    faqs: [
      {
        question: 'Yüksek değerli teslimat nasıl yapılır?',
        answer: '12.000 TL üzeri altın ve lüks saat siparişleri showroomumuzda kimlik doğrulaması ve imzalı teslim tutanağı ile güvenle teslim edilmektedir.'
      }
    ]
  }
];

const TOPIC_CLUSTERS = [
  {
    pillarRoute: '/elit-kategori/',
    clusterRoutes: [
      '/mucevherat/',
      '/markalar/',
      '/biz-kimiz/',
      '/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/',
      '/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/'
    ],
    primaryIntent: 'Lüks saat, pırlanta mücevherat ve canlı borsa altın alım satımı',
    semanticKeywords: [
      'İzmir lüks saat',
      'ikinci el rolex izmir',
      'buca kuyumcu',
      '22 ayar bilezik borsa kuru',
      'canlı altın fiyatı izmir',
      '3065 özel matrah altın fatura'
    ],
    supportingEntities: [ENTITY_BELGIN, ENTITY_AUTHOR_MEHMET, ENTITY_AUTHOR_HOROLOGIST]
  }
];

module.exports = {
  DOMAIN,
  ORIGIN,
  ENTITY_BELGIN,
  ENTITY_AUTHOR_MEHMET,
  ENTITY_AUTHOR_HOROLOGIST,
  SEO_REGISTRY,
  TOPIC_CLUSTERS
};
