// BELGIN KUYUMCULUK — SEO REGISTRY SINGLE SOURCE OF TRUTH (SSOT)
// Universal SEO & AI Discoverability v5.0 Omni-Enterprise Standard

const BASE_URL = 'https://www.belginkuyumculuk.com';

const PRIMARY_ORGANIZATION = {
  id: `${BASE_URL}/#organization`,
  name: 'BELGİN KUYUMCULUK - SEMİH SONBAHAR',
  alternateName: 'Belgin Kuyumculuk & Saat (Est. 1999)',
  type: 'JewelryStore',
  url: BASE_URL,
  logo: `${BASE_URL}/images/belgin-logo.png`,
  telephone: '+90-541-930-53-72',
  email: 'destek@belginkuyumculuk.com',
  address: {
    streetAddress: 'Menderes Caddesi No:231/B',
    addressLocality: 'Buca',
    addressRegion: 'İzmir',
    postalCode: '35380',
    addressCountry: 'TR'
  },
  geo: {
    latitude: 38.3842,
    longitude: 27.1685
  },
  sameAs: [
    'https://www.instagram.com/belginmucevherat/',
    'https://maps.google.com/?cid=belginkuyumculuk'
  ]
};

const SEO_REGISTRY = [
  {
    route: '/',
    canonicalRoute: '/',
    locale: 'tr-TR',
    role: 'home',
    indexDirective: 'index',
    title: 'Belgin Kuyumculuk & Saat — Lüks Saat, İkinci El & Mücevherat (Est. 1999)',
    metaDescription: "İzmir Buca Menderes Caddesinde 25 yıllık mirasla ekspertizli Rolex, Patek Philippe, Audemars Piguet saatler, 24K has altın ve elmas mücevherat. Canlı İZKO borsa kurları.",
    h1: 'Belgin Kuyumculuk & Saat — Haute Joaillerie & Horlogerie',
    primaryIntent: 'İzmir Buca lüks saat, pırlanta mücevherat ve altın alım satımı',
    primaryEntity: {
      type: 'JewelryStore',
      name: 'Belgin Kuyumculuk & Saat',
      sameAs: ['https://www.instagram.com/belginmucevherat/']
    },
    semanticTriples: [
      { subject: 'Belgin Kuyumculuk', predicate: 'kurulusYili', object: '1999' },
      { subject: 'Belgin Kuyumculuk', predicate: 'lokasyon', object: 'İzmir Buca Menderes Caddesi No:231/B' },
      { subject: 'Belgin Kuyumculuk', predicate: 'uzmanlik', object: 'Lüks Saatler, İkinci El Ekspertiz, 24K Has Altın, Pırlanta Mücevherat' },
      { subject: 'Belgin Kuyumculuk', predicate: 'odemeGuvenligi', object: 'PayTR 256-Bit SSL 3D Secure' }
    ],
    informationGainElements: ['firstPartyData', 'calculator', 'expertExperience', 'comparisonMatrix'],
    richResultTypes: ['Organization', 'LocalBusiness', 'WebSite', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'view_item_and_checkout',
    priority: '1.0',
    changefreq: 'daily'
  },
  {
    route: '/iletisim.html',
    canonicalRoute: '/iletisim.html',
    locale: 'tr-TR',
    role: 'local',
    indexDirective: 'index',
    title: 'İletişim ve Showroom | Belgin Kuyumculuk & Saat İzmir Buca',
    metaDescription: 'Belgin Kuyumculuk & Saat İzmir Buca Menderes Caddesi mağaza adresi, telefon numaraları, showroom çalışma saatleri ve harita konumu.',
    h1: 'İletişim & Buca Showroom Mağazamız',
    primaryIntent: 'Belgin Kuyumculuk mağaza adresi ve iletişim',
    primaryEntity: {
      type: 'LocalBusiness',
      name: 'Belgin Kuyumculuk Showroom',
      sameAs: ['https://www.instagram.com/belginmucevherat/']
    },
    semanticTriples: [
      { subject: 'Buca Showroom', predicate: 'adres', object: 'Menderes Caddesi No:231/B Buca / İzmir' },
      { subject: 'Müşteri Hizmetleri', predicate: 'telefon', object: '+90 541 930 53 72' },
      { subject: 'Kurumsal E-Posta', predicate: 'eposta', object: 'destek@belginkuyumculuk.com' }
    ],
    informationGainElements: ['firstPartyData', 'expertExperience'],
    richResultTypes: ['LocalBusiness', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'contact_showroom',
    priority: '0.9',
    changefreq: 'weekly'
  },
  {
    route: '/mesafeli-satis-sozlesmesi.html',
    canonicalRoute: '/mesafeli-satis-sozlesmesi.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Mesafeli Satış Sözleşmesi (01) | Belgin Kuyumculuk',
    metaDescription: '6502 sayılı TKHK kapsamında mesafeli satış, ödeme, teslimat, KYC ve tüketici haklarına ilişkin resmi sözleşme metni.',
    h1: 'Mesafeli Satış Sözleşmesi',
    primaryIntent: 'Belgin Kuyumculuk mesafeli satış sözleşmesi ve yasal şartlar',
    primaryEntity: { type: 'WebPage', name: 'Mesafeli Satış Sözleşmesi', sameAs: [] },
    semanticTriples: [
      { subject: 'Mesafeli Satış Sözleşmesi', predicate: 'yasalDayanak', object: '6502 sayılı TKHK m.48' }
    ],
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },
  {
    route: '/on-bilgilendirme-formu.html',
    canonicalRoute: '/on-bilgilendirme-formu.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Ön Bilgilendirme Formu (02) | Belgin Kuyumculuk',
    metaDescription: 'Sipariş öncesi ürün bedeli, kargo/teslimat şartları, ödeme yöntemleri ve cayma hakkı bilgilendirmesi.',
    h1: 'Ön Bilgilendirme Formu',
    primaryIntent: 'Belgin Kuyumculuk ön bilgilendirme şartları',
    primaryEntity: { type: 'WebPage', name: 'Ön Bilgilendirme Formu', sameAs: [] },
    semanticTriples: [
      { subject: 'Ön Bilgilendirme', predicate: 'mevzuat', object: 'Mesafeli Sözleşmeler Yönetmeliği m.5' }
    ],
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },
  {
    route: '/musteri-tanima-ve-islem-guvenligi.html',
    canonicalRoute: '/musteri-tanima-ve-islem-guvenligi.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Müşteri Tanıma ve İşlem Güvenliği Politikası (12) | Belgin Kuyumculuk',
    metaDescription: '12.000 TL iç güvenlik standardı, kimlik doğrulama, MASAK uyumu ve şüpheli işlem değerlendirme ilkeleri.',
    h1: 'Müşteri Tanıma ve İşlem Güvenliği Politikası (KYC)',
    primaryIntent: 'Kuyumculuk müşteri tanıma ve işlem güvenliği politikası',
    primaryEntity: { type: 'WebPage', name: 'Müşteri Tanıma Politikası', sameAs: [] },
    semanticTriples: [
      { subject: 'İşlem Güvenliği', predicate: 'icGuvenlikStandardi', object: '12.000 TL ve Üzeri Mağazadan Teslim & Kimlik Doğrulama' }
    ],
    informationGainElements: ['expertExperience', 'methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },
  {
    route: '/yuksek-degerli-urun-teslimi.html',
    canonicalRoute: '/yuksek-degerli-urun-teslimi.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Yüksek Değerli Ürün Teslim Protokolü (03) | Belgin Kuyumculuk',
    metaDescription: '12.000 TL ve üzerindeki altın ve lüks saat ürünlerinde mağazadan teslimat, kimlik tespiti ve teslim-tesellüm tutanağı esasları.',
    h1: 'Yüksek Değerli Ürün Teslim Protokolü',
    primaryIntent: 'Yüksek değerli altın saat teslim protokolü',
    primaryEntity: { type: 'WebPage', name: 'Yüksek Değerli Teslim Protokolü', sameAs: [] },
    semanticTriples: [
      { subject: 'Yüksek Değerli Ürün', predicate: 'teslimSekli', object: 'Buca Showroom Kimlik İbrazı ve Islak İmzalı Tutanak' }
    ],
    informationGainElements: ['expertExperience', 'methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },
  {
    route: '/hukuki-delil-ve-kayit-politikasi.html',
    canonicalRoute: '/hukuki-delil-ve-kayit-politikasi.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Hukuki Delil ve Kayıt Politikası (04) | Belgin Kuyumculuk',
    metaDescription: 'HMK m. 193 delil sözleşmesi, SHA-256 bütünlük özetleri, OpenTimestamps Bitcoin blokzincir dış zaman ispatı ve sipariş audit zinciri.',
    h1: 'Hukuki Delil ve Kayıt Politikası',
    primaryIntent: 'Elektronik ticaret delil ve zaman ispatı politikası',
    primaryEntity: { type: 'WebPage', name: 'Hukuki Delil Politikası', sameAs: [] },
    semanticTriples: [
      { subject: 'Hukuki Delil', predicate: 'kanitModeli', object: 'SHA-256 + OpenTimestamps / Bitcoin Dış Zaman İspatı' }
    ],
    informationGainElements: ['firstPartyData', 'methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },
  {
    route: '/kvkk.html',
    canonicalRoute: '/kvkk.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'KVKK Aydınlatma Metni (05) | Belgin Kuyumculuk',
    metaDescription: '6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca veri işleme amaçları, hukuki sebepler ve ilgili kişi hakları.',
    h1: 'KVKK Aydınlatma Metni',
    primaryIntent: 'Belgin Kuyumculuk KVKK aydınlatma metni',
    primaryEntity: { type: 'WebPage', name: 'KVKK Aydınlatma Metni', sameAs: [] },
    semanticTriples: [
      { subject: 'Kişisel Veri', predicate: 'sorumlu', object: 'Belgin Kuyumculuk - Semih Sonbahar' }
    ],
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },
  {
    route: '/iade-degisim-cayma.html',
    canonicalRoute: '/iade-degisim-cayma.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'İptal, İade ve Cayma Politikası (07) | Belgin Kuyumculuk',
    metaDescription: 'Altın, mücevherat ve lüks saat ürünlerinde cayma hakkı kanuni istisnaları, ayıplı mal yönetimi ve iade-değişim prosedürü.',
    h1: 'İptal, İade ve Cayma Politikası',
    primaryIntent: 'Kuyumculuk ve saat iade değişim cayma hakkı',
    primaryEntity: { type: 'WebPage', name: 'İptal İade Politikası', sameAs: [] },
    semanticTriples: [
      { subject: 'Finansal Piyasa Altın', predicate: 'caymaHakki', object: '6502 sayılı Kanun m.15/1-a Uyarınca İstisna' }
    ],
    informationGainElements: ['methodology', 'comparisonMatrix'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },
  {
    route: '/guvenli-odeme-ve-3d-secure.html',
    canonicalRoute: '/guvenli-odeme-ve-3d-secure.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Güvenli Ödeme ve 3D Secure Politikası (08) | Belgin Kuyumculuk',
    metaDescription: 'PayTR 256-Bit SSL sertifikası, 3D Secure SMS doğrulaması, kart güvenliği ve taksitlendirme esasları.',
    h1: 'Güvenli Ödeme ve 3D Secure Politikası',
    primaryIntent: 'Güvenli kart ödemesi ve 3D Secure standartları',
    primaryEntity: { type: 'WebPage', name: 'Güvenli Ödeme Politikası', sameAs: [] },
    semanticTriples: [
      { subject: 'Kartlı Ödeme', predicate: 'guvenlik', object: '256-Bit SSL & 3D Secure' }
    ],
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  }
];

module.exports = {
  BASE_URL,
  PRIMARY_ORGANIZATION,
  SEO_REGISTRY
};
