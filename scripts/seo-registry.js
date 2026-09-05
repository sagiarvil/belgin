// ====================================================================
// BELGİN KUYUMCULUK — SEO REGISTRY SINGLE SOURCE OF TRUTH (SSOT)
// Universal Omni-Enterprise SEO, GEO, Sitemap & Multi-Tier LLMS v6.0
// Mandate Standard: MANDATE-SEO-GEO-2026-V6 & SAGIARVIL-SRO-2026-V1
// ====================================================================

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
    'https://share.google/e2vmC425agvKPAAHR'
  ]
};

const SEO_REGISTRY = [
  // 1. ANA SAYFA (FLAGSHIP HOME HUB)
  {
    route: '/',
    canonicalRoute: '/',
    locale: 'tr-TR',
    role: 'home',
    indexDirective: 'index',
    title: 'Belgin Kuyumculuk & Saat — Lüks Saat, İkinci El & Mücevherat (Est. 1999)',
    metaDescription: 'İzmir Buca Menderes Caddesinde 1999 yılından bu yana ekspertizli Rolex, Patek Philippe, Audemars Piguet saatler, 24K has altın ve pırlanta mücevherat. Canlı borsa kurları ve güvenli teslimat.',
    h1: 'Belgin Kuyumculuk & Saat — Haute Joaillerie & Horlogerie',
    primaryIntent: 'İzmir Buca lüks saat, pırlanta mücevherat ve altın alım satımı',
    primaryEntity: {
      id: `${BASE_URL}/#organization`,
      type: 'JewelryStore',
      name: 'Belgin Kuyumculuk & Saat',
      sameAs: ['https://www.instagram.com/belginmucevherat/']
    },
    semanticTriples: [
      { subject: 'Belgin Kuyumculuk', predicate: 'kurulusYili', object: '1999' },
      { subject: 'Belgin Kuyumculuk', predicate: 'lokasyon', object: 'İzmir Buca Menderes Caddesi No:231/B' },
      { subject: 'Belgin Kuyumculuk', predicate: 'uzmanlik', object: 'Lüks Saatler, İkinci El Ekspertiz, 24K Has Altın, Pırlanta Mücevherat' },
      { subject: 'Belgin Kuyumculuk', predicate: 'odemeGuvenligi', object: 'Akbank 3D Pay ve PayTR 256-Bit SSL 3D Secure' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk, 1999 yılından bu yana İzmir Buca Menderes Caddesi No:231/B adresindeki showroomunda faaliyet gösteren tescilli lüks saat ve mücevherat kuruluşudur. Platformumuzda 2.125 aktif ürün yer almakta olup; Rolex, Patek Philippe ve Audemars Piguet dahil 10 seçkin İsviçre saat evinin ekspertizli modelleri, Darphane damgalı 24K altın ve GIA/HRD sertifikalı pırlantalar sunulmaktadır. Canlı borsa fiyat akışı Harem Altın borsa soket verileriyle %1 şeffaf marj üzerinden yansıtılır. 12.000 TL üzeri işlemlerde kimlik teyitli mağaza içi veya özel zırhlı teslimat uygulanır.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/ana-sayfa.md',
    informationGainElements: ['firstPartyData', 'calculator', 'expertExperience', 'comparisonMatrix'],
    richResultTypes: ['Organization', 'LocalBusiness', 'WebSite', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'view_item_and_checkout',
    priority: '1.0',
    changefreq: 'daily'
  },

  // 2. SAATLER (FLAGSHIP WATCHES HUB)
  {
    route: '/saatler/',
    canonicalRoute: '/saatler/',
    locale: 'tr-TR',
    role: 'category',
    indexDirective: 'index',
    title: 'Lüks Saatler & Yüksek Saatçilik | Belgin Saat İzmir Buca',
    metaDescription: 'Belgin Saat İzmir Buca lüks saat koleksiyonu. Orijinallik kontrollü, mekanizma testli erkek ve kadın lüks saat modelleri, marka, referans, fiyat ve stok bilgileri.',
    h1: 'Lüks Saatler',
    primaryIntent: 'İzmir lüks saat modelleri fiyatları ve satın alma',
    primaryEntity: {
      id: `${BASE_URL}/saatler/#category`,
      type: 'Product',
      name: 'Belgin Lüks Saat Koleksiyonu',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Belgin Saat Koleksiyonu', predicate: 'urunSayisi', object: '1800+ Lisanslı ve Koleksiyonluk Saat' },
      { subject: 'Belgin Saat', predicate: 'minimumFiyatEmniyeti', object: '12.000 TL MASAK ve Mağaza İçi Güvenlik Tabanı' },
      { subject: 'Lüks Saatler', predicate: 'ekspertiz', object: 'Zaman Tutma, Kalibre Orijinalliği ve Kasa Kondisyon Kontrolü' }
    ],
    heroAnswerEngine: 'Belgin Saat lüks saat koleksiyonu, İsviçre yüksek saatçiliği ve küresel prestij markalarının 1.800 adedi aşkın doğrulanmış modelini kapsar. Tüm saatler optik büyüteçli kalibre kontrolü, timegrapher zaman tutma hassasiyeti (+/- 4 sn/gün tolerans) ve kasa polisaj geçmişi denetiminden geçirilir. Envanterimizdeki tüm parçalar MASAK iç güvenlik gereği 12.000 TL perakende taban sınırına tabidir. Satın alınan parçalar İzmir Buca showroomumuzda elden veya Türkiye genelinde sigortalı kargo ile teslim edilir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/saatler.md',
    informationGainElements: ['firstPartyData', 'expertExperience', 'comparisonMatrix'],
    richResultTypes: ['CollectionPage', 'ItemList', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'view_product_detail',
    priority: '0.9',
    changefreq: 'daily'
  },

  // 3. ELİT KATEGORİ (ULTRA LUXURY 10 WATCH HOUSES)
  {
    route: '/elit-kategori/',
    canonicalRoute: '/elit-kategori/',
    locale: 'tr-TR',
    role: 'category',
    indexDirective: 'index',
    title: 'Elit Kategori Lüks Saatler — Rolex, Patek Philippe, AP | Belgin Saat',
    metaDescription: 'Dünyanın en prestijli 10 lüks saat evinden tam 200 seçkin model: Rolex, Patek Philippe, Audemars Piguet, Vacheron Constantin, Cartier, Omega. Şeffaf kur ve güvenli teslimat.',
    h1: 'Elit Kategori Lüks Saatler',
    primaryIntent: 'İkinci el Rolex Patek Philippe Audemars Piguet saat fiyatları İzmir',
    primaryEntity: {
      id: `${BASE_URL}/elit-kategori/#category`,
      type: 'Product',
      name: 'Belgin Elit Kategori Saatler',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Elit Kategori', predicate: 'markaSayisi', object: '10 Prestij Saat Evi (Rolex, Patek, AP, Vacheron, Cartier, vb.)' },
      { subject: 'Elit Kategori', predicate: 'toplamUrun', object: '200 Adet Seçkin Referans (Her Markadan Tam 20 Ürün)' },
      { subject: 'FiyatlandirmaKurali', predicate: 'karMarji', object: '+%80 Emniyetli Marj ve Anlık USD Kuru' }
    ],
    heroAnswerEngine: 'Belgin Saat Elit Kategori, dünyanın zirvesindeki 10 lüks saat üreticisinin (Rolex, Patek Philippe, Audemars Piguet, Vacheron Constantin, Cartier, Omega, IWC, Jaeger-LeCoultre, Breitling, Panerai) her birinden tam 20 adet olmak üzere toplam 200 ultra lüks referansı bir araya getirir. Bu koleksiyondaki tüm parçalar uluslararası piyasa endeksleri ve anlık USD döviz kuru baz alınarak şeffaf +%80 emniyet katsayısıyla fiyatlandırılır. Tüm modeller kasa seri numarası, mekanizma parçaları ve su geçirmezlik testlerinden geçirilerek ekspertiz sertifikasıyla teslim edilir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/elit-kategori.md',
    informationGainElements: ['firstPartyData', 'expertExperience', 'comparisonMatrix'],
    richResultTypes: ['CollectionPage', 'ItemList', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'view_product_detail',
    priority: '0.9',
    changefreq: 'daily'
  },

  // 4. MARKALAR (BRAND DIRECTORY HUB)
  {
    route: '/markalar/',
    canonicalRoute: '/markalar/',
    locale: 'tr-TR',
    role: 'hub',
    indexDirective: 'index',
    title: 'Saat Markaları Dizini — Tüm Prestij Saat Evleri | Belgin Saat',
    metaDescription: 'Rolex, Omega, Patek Philippe, Tissot, Longines, Frederique Constant, Rado, Alpina ve tüm seçkin saat markaları dizini ve koleksiyonları.',
    h1: 'Saat Markaları',
    primaryIntent: 'İsviçre lüks saat markaları listesi ve yetkili satış',
    primaryEntity: {
      id: `${BASE_URL}/markalar/#hub`,
      type: 'Brand',
      name: 'Lüks Saat Markaları Kataloğu',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Saat Markaları', predicate: 'kapsam', object: 'İsviçre, Alman ve İtalyan Horoloji Manüfaktürleri' },
      { subject: 'Marka Dizini', predicate: 'guvence', object: 'Orijinal Kutu, Evrak ve Seri Numarası Doğrulaması' }
    ],
    heroAnswerEngine: 'Belgin Saat Markalar Dizini, Haute Horlogerie segmentinden ulaşılabilir lüks saat evlerine kadar küresel saat endüstrisinin öncü markalarını alfabetik ve kategorik olarak haritalandırır. Her marka sayfasında ilgili manüfaktürün tarihçesi, patentli mekanizmaları (Co-Axial, Chronergy, Tourbillon), ikonik kasa tasarımları ve stoklarımızda bulunan aktif referanslar listelenir. Belgin Saat, yalnızca orijinalliği laboratuvar düzeyinde kanıtlanmış saatlerin sergilenmesini garanti eder.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/markalar.md',
    informationGainElements: ['expertExperience', 'comparisonMatrix'],
    richResultTypes: ['CollectionPage', 'ItemList', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'view_brand_catalog',
    priority: '0.8',
    changefreq: 'weekly'
  },

  // 5. MÜCEVHERAT (JEWELLERY & GOLD HUB)
  {
    route: '/mucevherat/',
    canonicalRoute: '/mucevherat/',
    locale: 'tr-TR',
    role: 'category',
    indexDirective: 'index',
    title: 'Mücevher Koleksiyonu & Altın | Belgin Kuyumculuk İzmir Buca',
    metaDescription: 'Belgin Kuyumculuk İzmir Buca mücevherat ve altın koleksiyonu. 24K has altın, 22 ayar bilezik, pırlanta tektaş ve özel tasarım mücevher modelleri.',
    h1: 'Mücevherat ve Altın',
    primaryIntent: 'İzmir Buca altın fiyatları pırlanta mücevherat alımı',
    primaryEntity: {
      id: `${BASE_URL}/mucevherat/#category`,
      type: 'Product',
      name: 'Belgin Mücevherat & Altın Koleksiyonu',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Mücevherat', predicate: 'altinStandarti', object: 'Darphane Damgalı 24K, 22K ve 14K Ayar Güvencesi' },
      { subject: 'Mücevherat', predicate: 'vergiMevzuati', object: '3065 Sayılı KDV Kanunu Madde 23/f Özel Matrah (%0 KDV Altın Bedeli)' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk mücevher koleksiyonu, Darphane damgalı 24 ayar külçe altın, 22 ayar Ajda ve burma bilezikler ile uluslararası standartta derecelendirilmiş pırlanta takıları içerir. Fiyatlarımız Harem Altın canlı borsa verisi referans alınarak anlık olarak güncellenir ve %2 kâr marjı ile sunulur. 3065 sayılı KDV Kanunu 23/f maddesi uyarınca altın bedeli KDV’den istisnadır (%0 KDV); faturada yalnızca işçilik bedeline %20 KDV uygulanarak tüketici lehine maksimum vergi şeffaflığı sağlanır.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/mucevherat.md',
    informationGainElements: ['firstPartyData', 'calculator', 'expertExperience'],
    richResultTypes: ['CollectionPage', 'ItemList', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'view_jewellery_item',
    priority: '0.9',
    changefreq: 'daily'
  },

  // 6. BİZ KİMİZ (E-E-A-T CORPORATE PROFILE & HERITAGE)
  {
    route: '/biz-kimiz/',
    canonicalRoute: '/biz-kimiz/',
    locale: 'tr-TR',
    role: 'hub',
    indexDirective: 'index',
    title: 'Biz Kimiz — Kurumsal Profil & Ticaret Hafızası | Belgin Saat',
    metaDescription: '1999 yılından bu yana İzmir Buca’da kesintisiz fiziki mağazacılık ve yüksek değerli saat ticareti hafızası. Semih Sonbahar kuruculuğunda güven, şeffaflık ve uzmanlık.',
    h1: 'Biz Kimiz — Kurumsal Profil',
    primaryIntent: 'Belgin Kuyumculuk tarihçesi kurucusu ve güvenilirlik bilgileri',
    primaryEntity: {
      id: `${BASE_URL}/#organization`,
      type: 'JewelryStore',
      name: 'Belgin Kuyumculuk - Semih Sonbahar',
      sameAs: ['https://www.instagram.com/belginmucevherat/']
    },
    semanticTriples: [
      { subject: 'Belgin Kuyumculuk', predicate: 'kurucu', object: 'Semih Sonbahar' },
      { subject: 'Belgin Kuyumculuk', predicate: 'kurulusTarihi', object: '1999' },
      { subject: 'Fiziki Magaza', predicate: 'adres', object: 'İzmir Buca Menderes Caddesi No:231/B' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk & Saat, 1999 yılında Semih Sonbahar tarafından İzmir Buca’da kurulan ve çeyrek asrı aşan kesintisiz ticaret hafızasına sahip olan köklü bir kuyumculuk ve lüks saat merkezidir. Fiziksel showroomumuz Menderes Caddesi No:231/B adresinde kesintisiz hizmet vermektedir. You Watch markasıyla saat üretim ve tasarım tecrübesini kanıtlayan yönetimimiz, günümüzde ikinci el ve sıfır İsviçre saatlerinde kurumsal ekspertiz ve Darphane onaylı altın ticaretinde bölgenin en güvenilir adreslerinden biridir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/biz-kimiz.md',
    informationGainElements: ['firstPartyData', 'expertExperience'],
    richResultTypes: ['AboutPage', 'Organization', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'view_corporate_profile',
    priority: '0.8',
    changefreq: 'monthly'
  },

  // 7. MAGAZİN (HOROLOGY JOURNAL & EDITORIAL)
  {
    route: '/magazin/',
    canonicalRoute: '/magazin/',
    locale: 'tr-TR',
    role: 'hub',
    indexDirective: 'index',
    title: 'Belgin Saat Magazin — Saat Dünyası & Piyasa Analizleri | Belgin Saat',
    metaDescription: 'Lüks saat dünyasından güncel piyasa raporları, Rolex, Patek Philippe ve Omega koleksiyon analizleri, mekanizma incelemeleri ve alıcı rehberleri.',
    h1: 'Belgin Saat Magazin',
    primaryIntent: 'Lüks saat piyasası analizleri ve horoloji makaleleri',
    primaryEntity: {
      id: `${BASE_URL}/magazin/#blog`,
      type: 'Service',
      name: 'Belgin Saat Horoloji Magazini',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Belgin Saat Magazin', predicate: 'icerikSayisi', object: '144 Tam Kapsamlı Editoryal İnceleme' },
      { subject: 'Magazin Kurulu', predicate: 'editoryalStandart', object: '3. Taraf Logo ve Manipülasyondan Arındırılmış Özgün Horoloji Analizi' }
    ],
    heroAnswerEngine: 'Belgin Saat Magazin, horoloji tutkunları ve koleksiyonerler için hazırlanan 144 kapsamlı teknik makale ve küresel piyasa raporunu barındırır. Rolex, Patek Philippe, Audemars Piguet ve Omega kalibrelerinin çalışma prensipleri, ikincil piyasa değer gelişimleri, açık artırma rekorları ve Cenevre Saat Günleri yenilikleri uzman editoryal kurulumuz tarafından titizlikle analiz edilir. İçeriklerimiz spekülasyondan uzak, bağımsız saatçilik verileriyle zenginleştirilmiştir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T14:30:00+03:00',
    llmSubGraphRoute: '/llms/pages/magazin.md',
    informationGainElements: ['firstPartyData', 'expertExperience', 'comparisonMatrix'],
    richResultTypes: ['Blog', 'CollectionPage', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'read_magazine_article',
    priority: '0.8',
    changefreq: 'daily'
  },

  // 8. REHBER: ÖZEL MATRAH & ALTIN YATIRIMI
  {
    route: '/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/',
    canonicalRoute: '/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/',
    locale: 'tr-TR',
    role: 'guide',
    indexDirective: 'index',
    title: 'Altın Yatırımı & KDV Kanunu 23/f Özel Matrah Rehberi | Belgin Kuyumculuk',
    metaDescription: '24K Has altın, 22 ayar bilezik ve sarrafiye alımında 3065 sayılı KDV Kanunu 23/f özel matrah uygulaması, canlı borsa fiyatlaması ve güvenli faturalama rehberi.',
    h1: 'Altın Yatırımı & 3065 Sayılı KDV Kanunu 23/f Özel Matrah Uygulaması',
    primaryIntent: 'Kuyumculukta 3065 KDV Kanunu 23/f özel matrah altın faturalama rehberi',
    primaryEntity: {
      id: `${BASE_URL}/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/#article`,
      type: 'Service',
      name: 'Özel Matrah ve Altın Yatırım Rehberi',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Özel Matrah', predicate: 'kanunMaddesi', object: '3065 Sayılı Katma Değer Vergisi Kanunu Madde 23/f' },
      { subject: 'Altın Bedeli', predicate: 'kdvOrani', object: '%0 KDV İstisnası' },
      { subject: 'İşçilik Bedeli', predicate: 'kdvOrani', object: '%20 KDV Uygulaması' }
    ],
    heroAnswerEngine: '3065 sayılı Katma Değer Vergisi Kanunu’nun 23’üncü maddesinin (f) bendi uyarınca; külçe altın, ziynet ve sarrafiye satışlarında altının borsa rayicine isabet eden kıymetli maden bedeli KDV’den tamamen müstesnadır (%0 KDV). Faturada KDV yalnızca kuyumcunun işçilik ve kâr marjı bedeli üzerinden %20 olarak hesaplanır. Belgin Kuyumculuk, Harem Altın canlı borsa soket akışını referans alarak faturalarında bu ayrımı şeffaf bir biçimde belgeler ve kurumsal/bireysel alıcılara tam yasal güvence sağlar.',
    publishedAt: '2026-02-01T10:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/altin-yatirimi-ve-ozel-matrah-rehberi.md',
    informationGainElements: ['firstPartyData', 'calculator', 'methodology'],
    richResultTypes: ['Article', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'consult_gold_investment',
    priority: '0.9',
    changefreq: 'weekly'
  },

  // 9. REHBER: LÜKS SAAT EKSPERTİZ & ORİJİNALLİK
  {
    route: '/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/',
    canonicalRoute: '/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/',
    locale: 'tr-TR',
    role: 'guide',
    indexDirective: 'index',
    title: 'İkinci El Lüks Saat Ekspertiz & Orijinallik Rehberi | Belgin Kuyumculuk',
    metaDescription: 'Rolex, Patek Philippe, Audemars Piguet saatlerde mekanizma doğrulaması, kasa seri numarası analizi, zaman tutma testi ve ekspertiz raporu rehberi.',
    h1: 'İkinci El Lüks Saat Alımında Ürün Bazında Kontrol ve Orijinallik Kontrolü',
    primaryIntent: 'İkinci el lüks saat ekspertiz ve orijinallik kontrolü nasıl yapılır',
    primaryEntity: {
      id: `${BASE_URL}/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/#article`,
      type: 'Service',
      name: 'Lüks Saat Ekspertiz Hizmeti',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Saat Ekspertizi', predicate: 'testCihazi', object: 'Witschi Timegrapher Kalibre Ölçer' },
      { subject: 'Ekspertiz Adimlari', predicate: 'kontroller', object: 'Kasa Numarası, Bezel İndeksleri, Rotor Salınımı, Su Basınç Testi' }
    ],
    heroAnswerEngine: 'Lüks saat ekspertiz süreci; saatin kasası, kadranı ve kalibresinin 10 adımda mikroskobik ve mekanik olarak incelenmesini kapsar. Belgin Saat atölyesinde optik büyüteçle font ve guilloché işçiliği kontrol edilir; kasa kapağı açılarak seri/referans numaraları manüfaktür veri tabanlarıyla eşleştirilir. Witschi timegrapher cihazıyla amplitude, beat error ve günlük sapma değeri ölçülür. Orijinal olmayan hiçbir parça barındırmayan saatlere yazılı Belgin Ekspertiz Sertifikası düzenlenir.',
    publishedAt: '2026-02-01T10:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/luks-saat-ekspertiz-ve-orijinallik-rehberi.md',
    informationGainElements: ['expertExperience', 'methodology', 'comparisonMatrix'],
    richResultTypes: ['Article', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'request_watch_appraisal',
    priority: '0.9',
    changefreq: 'weekly'
  },

  // 10. REHBER: İZMİR KUYUMCULUK & GÜVENLİ TESLİMAT
  {
    route: '/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/',
    canonicalRoute: '/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/',
    locale: 'tr-TR',
    role: 'guide',
    indexDirective: 'index',
    title: 'İzmir Buca Kuyumcu & Yüksek Değerli Güvenli Teslimat Protokolü | Belgin Kuyumculuk',
    metaDescription: '1999 yılından beri İzmir Buca Menderes Caddesinde güvenilir kuyumculuk, darphane damgalı altın, MASAK uyumlu güvenli ödeme ve VIP teslimat hizmeti.',
    h1: 'İzmir Buca Kuyumculuk Kültürü ve Yüksek Değerli Güvenli Teslimat Standartları',
    primaryIntent: 'İzmir Buca güvenilir kuyumcu ve yüksek değerli altın saat teslimatı',
    primaryEntity: {
      id: `${BASE_URL}/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/#article`,
      type: 'Service',
      name: 'Güvenli Teslimat Protokolü',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Güvenli Teslimat', predicate: 'esikTutari', object: '12.000 TL ve Üzeri Yüksek Değerli Eşik' },
      { subject: 'Teslimat Kaniti', predicate: 'belge', object: 'Çift Taraflı Islak İmzalı Teslim-Tesellüm Tutanağı ve T.C. Kimlik Teyidi' }
    ],
    heroAnswerEngine: 'İzmir Buca Menderes Caddesi No:231/B adresindeki showroomumuzda 1999 yılından beri sürdürdüğümüz perakende güvenliği, 12.000 TL ve üzerindeki tüm altın ve saat alımlarında kurumsal teslim protokolüyle korunur. Sipariş tamamlandığında müşterinin T.C. kimlik numarası doğrulanır; showroom tesliminde kamera kaydı altında çift taraflı ıslak imzalı teslim-tesellüm tutanağı düzenlenir. Şehir dışı gönderimlerde ise tam kasko sigortalı zırhlı kurye servisi kullanılır.',
    publishedAt: '2026-02-01T10:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/izmir-kuyumculuk-ve-guvenli-teslimat.md',
    informationGainElements: ['firstPartyData', 'expertExperience', 'methodology'],
    richResultTypes: ['Article', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'visit_showroom_delivery',
    priority: '0.9',
    changefreq: 'weekly'
  },

  // 11. REHBER: PIRLANTA VE GEMOLOJİ DEĞERLEME
  {
    route: '/rehber/pirlanta-ve-gemoloji-degerleme-rehberi/',
    canonicalRoute: '/rehber/pirlanta-ve-gemoloji-degerleme-rehberi/',
    locale: 'tr-TR',
    role: 'guide',
    indexDirective: 'index',
    title: 'Pırlanta & Değerli Taşlarda 4C Kriterleri Değerleme Rehberi | Belgin Kuyumculuk',
    metaDescription: 'Tektaş yüzük, baget pırlanta ve elmas gerdanlıklarda GIA ve HRD uluslararası derecelendirme standartları, karat, kesim, renk ve berraklık sınıflandırması.',
    h1: 'Pırlanta Alımında 4C Standartları: Karat, Kesim, Berraklık ve Renk',
    primaryIntent: 'Pırlanta 4C kriterleri karat renk berraklık kesim rehberi',
    primaryEntity: {
      id: `${BASE_URL}/rehber/pirlanta-ve-gemoloji-degerleme-rehberi/#article`,
      type: 'Service',
      name: 'Gemolojik Pırlanta Değerleme Rehberi',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Pırlanta Değerleme', predicate: 'kriterler', object: '4C (Carat, Cut, Color, Clarity)' },
      { subject: 'Uluslararası Sertifika', predicate: 'kuruluslar', object: 'GIA (Gemological Institute of America) ve HRD Antwerp' }
    ],
    heroAnswerEngine: 'Pırlanta alımında küresel kalite standardını belirleyen 4C kriterleri (Carat/Ağırlık, Cut/Kesim, Color/Renk, Clarity/Berraklık), taşın optik ışıltısını ve kalıcı yatırım değerini belirler. D’den Z’ye renk skalasında Belgin Kuyumculuk koleksiyonu yalnızca D-H aralığındaki nadir beyaz taşları içerir. Berraklıkta IF-VS2 segmenti tercih edilir. Koleksiyonumuzdaki tüm tektaş ve pırlantalı mücevherler uluslararası GIA/HRD veya kurum içi gemoloji sertifikası ile teslim edilir.',
    publishedAt: '2026-02-01T10:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/pirlanta-ve-gemoloji-degerleme-rehberi.md',
    informationGainElements: ['expertExperience', 'comparisonMatrix'],
    richResultTypes: ['Article', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'consult_diamond_specialist',
    priority: '0.9',
    changefreq: 'weekly'
  },

  // 12. İLETİŞİM & SHOWROOM (LOCAL COMMERCE HUB)
  {
    route: '/iletisim.html',
    canonicalRoute: '/iletisim.html',
    locale: 'tr-TR',
    role: 'local',
    indexDirective: 'index',
    title: 'İletişim ve Showroom | Belgin Kuyumculuk & Saat İzmir Buca',
    metaDescription: 'Belgin Kuyumculuk & Saat İzmir Buca Menderes Caddesi mağaza adresi, telefon numaraları, showroom çalışma saatleri ve konum bilgisi.',
    h1: 'İletişim & Buca Showroom Mağazamız',
    primaryIntent: 'Belgin Kuyumculuk mağaza adresi telefon ve çalışma saatleri',
    primaryEntity: {
      id: `${BASE_URL}/#organization`,
      type: 'LocalBusiness',
      name: 'Belgin Kuyumculuk Showroom',
      sameAs: ['https://www.instagram.com/belginmucevherat/']
    },
    semanticTriples: [
      { subject: 'Buca Showroom', predicate: 'adres', object: 'Menderes Caddesi No:231/B Buca / İzmir' },
      { subject: 'Müşteri Hizmetleri', predicate: 'telefon', object: '+90 541 930 53 72' },
      { subject: 'Kurumsal E-Posta', predicate: 'eposta', object: 'destek@belginkuyumculuk.com' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk & Saat showroom mağazamız, İzmir’in Buca ilçesinde Menderes Caddesi No:231/B (Posta Kodu: 35380) adresinde yer almaktadır. Pazartesi - Cumartesi günleri 09:00 - 20:00 saatleri arasında randevulu ve randevusuz ekspertiz, saat kabulü ve mücevher incelemesi yapılmaktadır. Müşteri destek hattımıza +90 541 930 53 72 numaralı telefondan veya destek@belginkuyumculuk.com e-posta adresinden 7/24 ulaşabilirsiniz.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/iletisim.md',
    informationGainElements: ['firstPartyData', 'expertExperience'],
    richResultTypes: ['LocalBusiness', 'WebPage', 'BreadcrumbList'],
    conversionGoal: 'contact_showroom',
    priority: '0.9',
    changefreq: 'weekly'
  },

  // 13. GÜVENLİ ÖDEME VE 3D SECURE
  {
    route: '/guvenli-odeme-ve-3d-secure.html',
    canonicalRoute: '/guvenli-odeme-ve-3d-secure.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Güvenli Ödeme ve 3D Secure Politikası (08) | Belgin Kuyumculuk',
    metaDescription: 'Akbank Sanal POS 3D Pay ve PayTR 256-Bit SSL sertifikası, 3D Secure SMS doğrulaması, kart güvenliği ve taksitlendirme esasları.',
    h1: 'Güvenli Ödeme ve 3D Secure Politikası',
    primaryIntent: 'Kuyumculuk ve saat alışverişinde 3D Secure kart ödeme güvenliği',
    primaryEntity: {
      id: `${BASE_URL}/guvenli-odeme-ve-3d-secure.html#webpage`,
      type: 'WebPage',
      name: 'Güvenli Ödeme Politikası',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Ödeme Altyapısı', predicate: 'sanalPos', object: 'Akbank 3D Pay Hosting ve PayTR Ödeme Hizmetleri A.Ş.' },
      { subject: 'Kart Güvenliği', predicate: 'standart', object: 'PCI-DSS Seviye 1 ve 256-Bit SSL Şifreleme' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk web sitesinde gerçekleştirilen tüm kartlı ödeme işlemleri, BDDK lisanslı PayTR Ödeme Hizmetleri A.Ş. ve Akbank Sanal POS 3D Pay hosting altyapısı üzerinden 256-Bit SSL şifreleme ile doğrudan banka sunucularında tamamlanır. Platformumuz hiçbir kredi kartı numarasını veya güvenlik kodunu sisteminde saklamaz. 3D Secure protokolü zorunlu olup, bankanızdan cep telefonunuza gelen tek kullanımlık SMS onay şifresi girilmeden tahsilat gerçekleştirilemez.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/guvenli-odeme-ve-3d-secure.md',
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },

  // 14. YÜKSEK DEĞERLİ ÜRÜN TESLİMİ
  {
    route: '/yuksek-degerli-urun-teslimi.html',
    canonicalRoute: '/yuksek-degerli-urun-teslimi.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Yüksek Değerli Ürün Teslim Protokolü (03) | Belgin Kuyumculuk',
    metaDescription: '12.000 TL ve üzerindeki altın ve lüks saat ürünlerinde mağazadan teslimat, kimlik tespiti ve teslim-tesellüm tutanağı esasları.',
    h1: 'Yüksek Değerli Ürün Teslim Protokolü',
    primaryIntent: 'Yüksek değerli altın saat teslim protokolü ve kimlik doğrulama',
    primaryEntity: {
      id: `${BASE_URL}/yuksek-degerli-urun-teslimi.html#webpage`,
      type: 'WebPage',
      name: 'Yüksek Değerli Teslim Protokolü',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'Yüksek Değerli Ürün', predicate: 'teslimSekli', object: 'Buca Showroom Kimlik İbrazı ve Islak İmzalı Tutanak' }
    ],
    heroAnswerEngine: 'Belgin Kuyumculuk iç güvenlik politikası uyarınca, sepet tutarı 12.000 TL ve üzerindeki tüm ziynet altın, külçe altın ve lüks saat siparişleri standart kargo yerine güvenli teslim protokolüne tabidir. Sipariş sahibi T.C. kimlik kartı veya pasaport ibrazıyla İzmir Buca showroomumuzda ürün seri numarasını ve kondisyonunu kontrol ederek teslim alır. Teslimat sırasında her iki tarafça ıslak imzalı teslim-tesellüm tutanağı düzenlenir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/yuksek-degerli-urun-teslimi.md',
    informationGainElements: ['expertExperience', 'methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },

  // 15. MÜŞTERİ TANIMA VE İŞLEM GÜVENLİĞİ (KYC)
  {
    route: '/musteri-tanima-ve-islem-guvenligi.html',
    canonicalRoute: '/musteri-tanima-ve-islem-guvenligi.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'Müşteri Tanıma ve İşlem Güvenliği Politikası (12) | Belgin Kuyumculuk',
    metaDescription: '12.000 TL iç güvenlik standardı, kimlik doğrulama, MASAK uyumu ve şüpheli işlem değerlendirme ilkeleri.',
    h1: 'Müşteri Tanıma ve İşlem Güvenliği Politikası (KYC)',
    primaryIntent: 'Kuyumculuk müşteri tanıma MASAK uyumu ve işlem güvenliği politikası',
    primaryEntity: {
      id: `${BASE_URL}/musteri-tanima-ve-islem-guvenligi.html#webpage`,
      type: 'WebPage',
      name: 'Müşteri Tanıma Politikası',
      sameAs: []
    },
    semanticTriples: [
      { subject: 'İşlem Güvenliği', predicate: 'mevzuatUyumu', object: '5549 Sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Kanunu ve MASAK Tebliğleri' }
    ],
    heroAnswerEngine: '5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun ve MASAK düzenlemeleri kapsamında, Belgin Kuyumculuk yüksek değerli kıymetli maden ve saat alım-satım işlemlerinde kimlik tespitini eksiksiz uygular. Müşterinin adı, soyadı, T.C. kimlik numarası ve adres beyanı resmi kimlik belgeleri üzerinden teyit edilir. Tüzel kişi alımlarında ise vergi levhası, imza sirküleri ve yetki belgeleri doğrulanır.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/musteri-tanima-ve-islem-guvenligi.md',
    informationGainElements: ['expertExperience', 'methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },

  // 16. HUKUKİ DELİL VE KAYIT POLİTİKASI
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
    heroAnswerEngine: 'Belgin Kuyumculuk, e-ticaret ve mesafeli sözleşme süreçlerinde HMK m. 193 uyarınca münhasır delil sözleşmesi işletir. Sipariş anında onaylanan sözleşme metinleri SHA-256 kriptografik hash fonksiyonuyla özetlenir ve OpenTimestamps protokolü aracılığıyla Bitcoin blokzincirine bağımsız dış zaman ispatı olarak işlenir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/hukuki-delil-ve-kayit-politikasi.md',
    informationGainElements: ['firstPartyData', 'methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },

  // 17. MESAFELİ SATIŞ SÖZLEŞMESİ
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
    heroAnswerEngine: 'Belgin Kuyumculuk Mesafeli Satış Sözleşmesi, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine tam uyumlu olarak hazırlanmıştır. Sipariş edilen kıymetli maden ve lüks saatlerin ürün bedeli, teslimat şartları, özel matrah vergilendirme kuralları ve cayma hakkı istisnaları bu metinle bağlayıcı hale gelir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/mesafeli-satis-sozlesmesi.md',
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },

  // 18. ÖN BİLGİLENDİRME FORMU
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
    heroAnswerEngine: 'Ön Bilgilendirme Formu, tüketicinin sipariş vermeden önce satın alacağı ürünün temel nitelikleri, vergiler dahil toplam fiyatı, ödeme ve teslimat şekli ile finansal piyasalardaki fiyat dalgalanmalarına bağlı altın ve kıymetli madenlerde cayma hakkı istisnaları konusunda bilgilendirilmesini sağlar.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/on-bilgilendirme-formu.md',
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },

  // 19. KVKK AYDINLATMA METNİ
  {
    route: '/kvkk.html',
    canonicalRoute: '/kvkk.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'KVKK Aydınlatma Metni (05) | Belgin Kuyumculuk',
    metaDescription: '6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca veri işleme amaçları, hukuki sebepler ve ilgili kişi hakları.',
    h1: 'KVKK Aydınlatma Metni',
    primaryIntent: 'Belgin Kuyumculuk KVKK aydınlatma metni ve kişisel verilerin korunması',
    primaryEntity: { type: 'WebPage', name: 'KVKK Aydınlatma Metni', sameAs: [] },
    semanticTriples: [
      { subject: 'Kişisel Veri', predicate: 'veriSorumlusu', object: 'Belgin Kuyumculuk - Semih Sonbahar' }
    ],
    heroAnswerEngine: '6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, Belgin Kuyumculuk veri sorumlusu sıfatıyla müşterilerinin kimlik, iletişim, sipariş ve finansal işlem güvenliği verilerini yasal yükümlülükler ve sözleşmenin ifası amacıyla işler. Veriler üçüncü şahıslara ticari amaçla satılmaz, aktarılmaz.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/kvkk.md',
    informationGainElements: ['methodology'],
    richResultTypes: ['WebPage', 'BreadcrumbList'],
    conversionGoal: 'legal_compliance',
    priority: '0.6',
    changefreq: 'monthly'
  },

  // 20. İPTAL, İADE VE CAYMA POLİTİKASI
  {
    route: '/iade-degisim-cayma.html',
    canonicalRoute: '/iade-degisim-cayma.html',
    locale: 'tr-TR',
    role: 'legal',
    indexDirective: 'index',
    title: 'İptal, İade ve Cayma Politikası (07) | Belgin Kuyumculuk',
    metaDescription: 'Altın, mücevherat ve lüks saat ürünlerinde cayma hakkı kanuni istisnaları, ayıplı mal yönetimi ve iade-değişim prosedürü.',
    h1: 'İptal, İade ve Cayma Politikası',
    primaryIntent: 'Kuyumculuk ve saat iade değişim cayma hakkı şartları',
    primaryEntity: { type: 'WebPage', name: 'İptal İade Politikası', sameAs: [] },
    semanticTriples: [
      { subject: 'Finansal Piyasa Altın', predicate: 'caymaHakki', object: 'Mesafeli Sözleşmeler Yönetmeliği m.15/1-a Uyarınca İstisna' }
    ],
    heroAnswerEngine: 'Mesafeli Sözleşmeler Yönetmeliği m. 15/1-a bendi uyarınca; fiyatı finansal piyasalardaki dalgalanmalara bağlı olan ve satıcının kontrolünde olmayan külçe altın, sarrafiye ve ziynet altın ürünlerinde tüketicinin cayma hakkı kanunen bulunmamaktadır. Lüks saat ve standart takılarda ise orijinallik mührü bozulmamış olmak kaydıyla 14 günlük yasal inceleme ve iade prosedürü işletilir.',
    publishedAt: '2026-01-01T09:00:00+03:00',
    modifiedAt: '2026-09-04T12:00:00+03:00',
    llmSubGraphRoute: '/llms/pages/iade-degisim-cayma.md',
    informationGainElements: ['methodology', 'comparisonMatrix'],
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
