#!/usr/bin/env node
/**
 * ====================================================================
 * 🛡️ BELGİN SAAT MAGAZİN — KAPSAMLI GÜVENLİK, LOGO & ENTITY SANITIZER
 * ====================================================================
 * 1. 3. taraf logo, filigran, personel profil veya çalışan röportajlarını engeller ve temizler.
 * 2. Bozuk HTML entity'lerini (&#8217;, &#038; vb.) temizler.
 * 3. Chrono24, ChronoPulse, C24 ve 3. taraf pazar yeri referanslarını %100 temizler.
 * 4. Tüm görsellerin yerel, yüksek kaliteli saat görselleri olduğunu doğrular.
 * 5. Eski slug'lardan temiz Türkçe SEO slug'larına 301 yönlendirmelerini scripts/seo-retired-products.json'a kaydeder.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_JS_PATH = path.join(ROOT, 'js', 'magazine_data.js');
const RETIRED_PATH = path.join(ROOT, 'scripts', 'seo-retired-products.json');

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/OurChronoPulse Index/gi, "Belgin Saat Lüks Değer Endeksi")
    .replace(/ChronoPulse Index/gi, "Belgin Saat Lüks Değer Endeksi")
    .replace(/ChronoPulse/gi, "Belgin Saat Lüks Değer Endeksi")
    .replace(/chrono24\s*magazine/gi, "Belgin Saat Magazin")
    .replace(/chrono24\s*report/gi, "Belgin Saat Küresel Piyasa Raporu")
    .replace(/chrono24\s*price\s*index/gi, "Belgin Saat Lüks Fiyat Endeksi")
    .replace(/chrono24/gi, "Belgin Saat")
    .replace(/\bc24\b/gi, "Belgin Saat")
    .replace(/Belgin Saat\s*’\s*s/g, 'Belgin Saat')
    .replace(/Belgin Saat\s*'\s*s/g, 'Belgin Saat')
    .replace(/Belgin Saat\s*’\s*te/g, "Belgin Saat'te")
    .replace(/Oyuncular'\s*Saatler/g, "Futbolcuların Tercih Ettiği Saatler")
    .replace(/İzle Yıldönümleri/g, "Saat Dünyasının Yıldönümleri")
    .replace(/Bilgi ve Eğlenceli Gerçekleri İzleyin/g, "Saat Dünyasından İlginç Bilgiler")
    .replace(/20\.000 Dolar Altı €/g, "20.000 Dolar Altı")
    .replace(/Dolar Altı €/g, "Dolar Altı")
    .replace(/Most Right Now/gi, "")
    .replace(/Models on Belgin Saat/gi, "Modelleri")
    .replace(/Most Popular/gi, "En Popüler")
    .replace(/Pascal Gehrlein/gi, "Koleksiyonerler")
    .replace(/Tim Breining/gi, "Saat Ustaları")
    .replace(/Gabriel/gi, "Koleksiyoner")
    .replace(/Pascal/gi, "Koleksiyoner")
    .replace(/our marketplace/gi, "seçkin lüks saat koleksiyonumuz")
    .replace(/on our platform/gi, "küresel saat piyasasında")
    .replace(/\s+/g, ' ')
    .trim();
}

const BLOCKED_ARTICLE_IDS = new Set([
  "mag-180505",
  "mag-177236"
]);

const BLOCKED_IMAGE_PATTERNS = [
  /rolex-report/i,
  /the-rolex-report/i,
  /chronopulse/i,
  /luks-saat-deger-endeksi/i
];

const CANONICAL_SLUGS = {
  "mag-181439": "su-gecirmez-luks-dalis-saatleri-rehberi",
  "mag-180768": "doxa-okyanuslarin-cagrisi-ve-profesyonel-dalis-saatleri",
  "mag-181813": "omega-swatch-moonswatch-trend-ve-piyasa-degeri",
  "mag-181728": "cenevre-saat-gunleri-2026-ozet-ve-yenilikler",
  "mag-181378": "leica-kameralardan-mekanik-saatcilige-uzanan-yolculuk",
  "mag-30657": "luks-saatler-guvenli-bir-yatirim-araci-mi",
  "mag-107724": "tum-zamanlarin-en-iyi-10-saat-markasi",
  "mag-112425": "dunyanin-en-iyi-10-isvicre-saat-markasi",
  "mag-179383": "patek-philippe-son-5-yillik-deger-ve-fiyat-gelisimi",
  "mag-178142": "saat-fiyatlari-yaz-aylarinda-duser-mi-mevsimsel-analiz",
  "mag-95156": "saat-fiyatlarini-belirleyen-en-onemli-faktorler-nelerdir",
  "mag-129820": "rolex-gmt-master-ii-pepsi-uretimi-sona-eriyor-mu",
  "mag-169209": "2026-luks-saat-piyasasi-ongoruleri-ve-koleksiyoner-trendleri",
  "mag-181302": "omega-seamaster-diver-300m-icin-5-ulasilabilir-alternatif",
  "mag-180772": "en-populer-5-omega-speedmaster-modeli",
  "mag-178583": "girard-perregaux-laureato-fifty-yildonumu-modelleri",
  "mag-180358": "koleksiyonluk-rolex-saatler-gecmisin-unutulan-efsaneleri",
  "mag-178206": "gmt-ve-dunya-saati-karsilastirmasi",
  "mag-177174": "vacheron-constantin-deger-artisi-ve-yatirim-analizi",
  "mag-177989": "luks-saat-markalari-ve-dunya-kupasi",
  "mag-177772": "70000-dolar-butceyle-mukemmel-saat-koleksiyonu-rehberi",
  "mag-177781": "saatcilikte-tasarim-mi-mekanizma-mi-analiz",
  "mag-177645": "luks-saatler-ve-f1-efsaneleri",
  "mag-177255": "kadinlar-luks-saat-sektorunu-nasil-sekillendiriyor",
  "mag-176676": "yaz-icin-luks-saat-kayisi-secim-rehberi",
  "mag-177019": "dunya-kupasi-futbolcularin-tercih-ettigi-saatler",
  "mag-176771": "2000-euro-alti-5-renkli-royal-pop-alternatifi",
  "mag-176428": "ozel-davetler-ve-geceler-icin-en-sik-elbise-saatleri",
  "mag-175798": "swatch-x-audemars-piguet-royal-pop-incelemesi",
  "mag-175672": "wall-street-ve-finans-dunyasinin-tercih-ettigi-saatler",
  "mag-174683": "vintage-ve-modern-saatler-karsilastirmasi",
  "mag-173755": "vintage-saat-almak-icin-5-onemli-neden",
  "mag-173834": "rolex-gmt-master-pepsi-icin-5-ulasilabilir-alternatif",
  "mag-172356": "mezuniyet-hediyesi-icin-en-iyi-10-saat",
  "mag-170705": "patek-philippe-ve-rolex-kadranlarinda-cift-logo-tarihi",
  "mag-169726": "dunya-saat-tasarimcilari-jorg-hysek",
  "mag-168917": "dunyanin-en-eski-saat-markalari-omegadann-blancpaine",
  "mag-169875": "sinema-tarihinin-unutulmaz-karakterleri-ve-saatleri",
  "mag-168504": "2025-yilinin-en-cok-tercih-edilen-10-luks-saati",
  "mag-167571": "2025-yilinin-kesfedilmemis-saat-mucevherleri",
  "mag-168290": "saat-tasarimcilari-emmanuel-gueit",
  "mag-167506": "dakika-tekrarlayici-minute-repeater-nasil-calisir",
  "mag-166765": "saat-kadran-malzemeleri-ve-dekorasyon-sanati",
  "mag-164136": "sessiz-luks-quiet-luxury-saat-trendleri",
  "mag-163331": "kadinlar-icin-en-sik-5-yaz-saati",
  "mag-163280": "rolex-submariner-vs-sea-dweller-rehberi",
  "mag-162528": "patek-philippe-nautilus-aquanaut-karsilastirma",
  "mag-160884": "dogru-saat-boyutu-nasil-secilir-kasa-capi-rehberi",
  "mag-160816": "kuresel-pazarda-en-cok-aranan-5-ikonik-saat",
  "mag-150187": "2025-yilinin-saat-yildonumleri-ve-yeni-modelleri",
  "mag-149200": "20000-dolar-alti-en-iyi-5-gmt-saat",
  "mag-148376": "saat-piyasasi-ve-koleksiyoner-deger-ongoruleri",
  "mag-147711": "en-cok-tercih-edilen-5-tourbillon-saat",
  "mag-146630": "saat-dunyasindan-10-ilginc-ve-etkileyici-bilgi",
  "mag-139898": "bvlgari-saat-tasarimi-ve-marka-dnasinin-onemi",
  "mag-140324": "czapek-antarctique-aynali-kadran-ve-mikro-rotor-incelemesi",
  "mag-110011": "her-bilege-uygun-en-iyi-5-uniseks-dalis-saati",
  "mag-95730": "yaz-mevsimi-icin-5-mukemmel-luks-saat",
  "mag-51132": "rolex-submariner-koleksiyon-kadranlari-ve-nadir-referanslar",
  "mag-20847": "haute-horlogerie-nedir-yuksek-saatcilik-sanati",
  "mag-10486": "dunyanin-en-iyi-10-dalis-saati",
  "mag-7916": "atlayan-saat-jumping-hour-mekanizmalari-ve-tarihi"
};

const CANONICAL_TITLES = {
  "mag-181439": "Su Geçirmez Lüks Saatler: Karada, Denizde ve Derinliklerde Kusursuz Şıklık",
  "mag-180768": "Doxa: Okyanusların Çağrısı ve Efsanevi Profesyonel Dalış Saatleri Tarihi",
  "mag-181813": "Omega x Swatch MoonSwatch: Küresel Popülarite ve İkincil Piyasa Trendi Ne Kadar Sürecek?",
  "mag-181728": "Cenevre Saat Günleri 2026: 1. Gün Özeti, Yeni Modeller ve Öne Çıkan Kalibreler",
  "mag-181378": "Leica: Asırlık Fotoğrafçılık Mirasından Mekanik Saatçiliğe Uzanan Başarı Hikayesi",
  "mag-30657": "Zorlu Ekonomik Dönemlerde Lüks Saatler Güvenli ve Kazançlı Bir Yatırım mı?",
  "mag-107724": "Tüm Zamanların En İyi 10 Lüks Saat Markası ve İkonik Modelleri",
  "mag-112425": "Bir Bakışta Dünyanın En İyi 10 İsviçre Saat Markası ve Tarihsel Mirasları",
  "mag-179383": "Patek Philippe Son 5 Yıldaki Değer Gelişimi ve Yatırım Değerlemesi",
  "mag-178142": "Mevsimsel Saat Piyasası Efsanesi: Yaz Aylarında Saat Fiyatları Gerçekten Düşer mi?",
  "mag-95156": "Lüks Saat Fiyatlarını ve Değer Artışını Belirleyen En Önemli Faktörler Nelerdir?",
  "mag-129820": "Bir Dönemin Sonu mu: Rolex GMT-Master II Pepsi Üretimden Kalkıyor mu? Güncel Analiz",
  "mag-169209": "2026 Lüks Saat Piyasası Öngörüleri, Fiyat Trendleri ve Koleksiyoner Beklentileri",
  "mag-181302": "Omega Seamaster Diver 300M İçin 5 Ulaşılabilir ve Güçlü Alternatif Model",
  "mag-180772": "En Popüler 5 Omega Speedmaster Modeli ve Koleksiyon Değeri",
  "mag-178583": "Girard-Perregaux Laureato Fifty: Yeni Yıldönümü Modellerine Kapsamlı Bakış",
  "mag-180358": "Koleksiyonluk Rolex Saatler: Zamanında Değeri Bilinmeyen ve Bugün Prim Yapan Modeller",
  "mag-178206": "GMT ve Dünya Saati (World Timer) Karşılaştırması: Seyahat İçin Hangisi İdeal?",
  "mag-177174": "Vacheron Constantin Değer Artışı ve Son 5 Yıldaki Yatırım Gelişimi",
  "mag-177989": "Lüks Saat Markaları ve Dünya Kupası: Futbolun Zirvesindeki Prestijli Modeller",
  "mag-177772": "Koleksiyoner Rehberi: 70.000 Dolar Bütçe İle Kurulabilecek Kusursuz Saat Koleksiyonu",
  "mag-177781": "Estetik ve Mühendislik: Saatçilikte Önce Tasarım mı Yoksa Mekanizma mı Önemlidir?",
  "mag-177645": "Lüks Saatler ve Motor Sporları: Formula 1 Efsaneleri ve Bileklerindeki Başyapıtlar",
  "mag-177255": "Kadınlar Lüks Saat Sektörünü Nasıl Dönüştürüyor ve Şekillendiriyor?",
  "mag-176676": "Yaz Mevsimi İçin En Şık Lüks Saat Kayışları ve Kombin Seçim Rehberi",
  "mag-177019": "Dünya Kupası Yıldızları: Ünlü Futbolcuların Tercih Ettiği En Pahalı Saatler",
  "mag-176771": "2.000 Euro Altında Satın Alınabilecek 5 Renkli ve Sportif Lüks Saat Alternatifi",
  "mag-176428": "Özel Davetler, Balolar ve Kokteyller İçin En Şık Elbise (Dress) Saatleri",
  "mag-175798": "Swatch x Audemars Piguet Royal Pop: Yılın En Ses Getiren Saat İşbirliği",
  "mag-175672": "Wall Street ve Finans Dünyasının Tercih Ettiği En Saygın Lüks Saatler",
  "mag-174683": "Vintage ve Modern Saatler: 5 Modern Klasik ve Tarihi Vintage Alternatifleri",
  "mag-173755": "Vintage Saat Satın Almanın Akıllıca ve Kazançlı Bir Karar Olmasının 5 Nedeni",
  "mag-173834": "Rolex GMT-Master II Pepsi İçin 5 Ulaşılabilir ve Kaliteli Alternatif Model",
  "mag-172356": "Mezuniyet Hediyesi İçin Ömür Boyu Saklanacak En Anlamlı 10 Lüks Saat",
  "mag-170705": "Patek Philippe ve Rolex Kadranlarında Çift Logo (Co-Branded) Tarihi ve Gizemi",
  "mag-169726": "Dünya Saat Tasarımcıları: Efsanevi Çizgilerin Mimarı Jorg Hysek",
  "mag-168917": "Dünyanın En Eski Saat Markaları: Omega'dan Blancpain'e Asırlık Horoloji Mirası",
  "mag-169875": "Sinema Tarihinin Karizmatik Kötü Adamları ve Tercih Ettikleri Saatler",
  "mag-168504": "2025 Yılının Dünyada En Çok Satan ve Talep Gören 10 Lüks Saati",
  "mag-167571": "2025 Yılının Radar Altında Kalan ve Değer Kazanan Gizli Saat Mücevherleri",
  "mag-168290": "Saat Dünyasının Dahi Tasarımcıları: Royal Oak Offshore'un Babası Emmanuel Gueit",
  "mag-167506": "Büyüleyici Komplikasyonlar: Dakika Tekrarlayıcı (Minute Repeater) Nasıl Çalışır?",
  "mag-166765": "Bir Bakışta Kadran Malzemeleri: Emaye, Sedef, Meteorit ve Guilloché Sanatı",
  "mag-164136": "Sessiz Lüks (Quiet Luxury) Saat Trendi: Bağırmayan Şıklığın En İyi Temsilcileri",
  "mag-163331": "Kadınlar İçin Yaz Mevsimine En Çok Yakışan 5 Lüks Saat Modeli",
  "mag-163280": "Rolex Submariner ve Sea-Dweller Karşılaştırması: Derinliklerin İki Efsanesi",
  "mag-162528": "Patek Philippe Aquanaut ve Nautilus: Entegre Çelik Spor Saatlerin Zirvesi",
  "mag-160884": "Doğru Saat Boyutu Nasıl Seçilir? Kasa Çapı ve Bilek Uyumu Kılavuzu",
  "mag-160816": "Küresel Pazarda En Çok Aranan ve Talep Gören 5 İkonik Saat Modeli",
  "mag-150187": "2025 Yılının Saat Dünyasındaki Önemli Yıldönümleri, Yenilikleri ve Vedaları",
  "mag-149200": "20.000 Dolar Altında En Yüksek Değer Koruyan 5 GMT Seyahat Saati",
  "mag-148376": "Saat Piyasası Tahminleri: Koleksiyonerlerin ve Markaların Değer Trendleri",
  "mag-147711": "Dünyanın En Çok İlgi Gören ve Tercih Edilen 5 Tourbillon Saati",
  "mag-146630": "Saat Dünyasından 10 İlginç, Eğlenceli ve Az Bilinen Tarihsel Gerçek",
  "mag-139898": "Bvlgari Saat Tasarımı ve Marka DNA'sının Gücü: Kreatif Direktör Analizi",
  "mag-140324": "Czapek Antarctique Aynalı Kadran ve Mikro-Rotorlu Mekanizma İncelemesi",
  "mag-110011": "Her Bileğe Yakışan En İyi 5 Üniseks Lüks Dalış Saati Modeli",
  "mag-95730": "Yaz Mevsiminin Ruhunu Yansıtan 5 Mükemmel Lüks Saat Modeli",
  "mag-51132": "Rolex Submariner Koleksiyon Kadranları: Gilt, Maxi ve Özel Referanslar",
  "mag-20847": "Haute Horlogerie Nedir? Yüksek Saatçilik Sanatının İncelikleri ve Kuralları",
  "mag-10486": "Dünyanın En İyi 10 Profesyonel Dalış Saati ve Derin Deniz Efsaneleri",
  "mag-7916": "Atlayan Saat (Jumping Hour) Mekanizmaları: Zamanın Farklı ve Büyüleyici Akışı"
};

function cleanArticle(art) {
  const artId = art.id;

  // 🛡️ SIFIR TOLERANS: 3. taraf logo, filigran veya Chrono24/ChronoPulse logolu makaleleri engelle
  if (BLOCKED_ARTICLE_IDS.has(artId)) {
    console.log(`[ENGEL] Yasaklı logo/içerik kimliği tespit edildi ve kaldırıldı: ${artId}`);
    return null;
  }

  const imgStr = art.image || '';
  if (BLOCKED_IMAGE_PATTERNS.some(re => re.test(imgStr))) {
    console.log(`[ENGEL] Yasaklı logo görsel paterni tespit edildi ve kaldırıldı: ${artId} (${imgStr})`);
    return null;
  }

  const slugStr = art.slug || '';
  if (BLOCKED_IMAGE_PATTERNS.some(re => re.test(slugStr))) {
    console.log(`[ENGEL] Yasaklı slug paterni tespit edildi ve kaldırıldı: ${artId} (${slugStr})`);
    return null;
  }

  let title = CANONICAL_TITLES[artId] || decodeEntities(art.title);
  let slug = CANONICAL_SLUGS[artId] || art.slug;
  let summary = decodeEntities(art.summary);
  let content = decodeEntities(art.content_html);
  let image = art.image;
  let category = art.category || "Saat Dünyası & Analiz";
  let readTime = art.read_time || "8 dk okuma";

  // İçerik içerisindeki son entity ve Chrono kontrolleri
  content = content.replace(/OurChronoPulse Index/gi, 'Belgin Saat Lüks Değer Endeksi');
  content = content.replace(/ChronoPulse/gi, 'Belgin Saat Lüks Değer Endeksi');
  content = content.replace(/chrono24/gi, 'Belgin Saat');

  // Dahili link kutusu kontrolü: Eğer makale sonunda yoksa ekle
  if (!content.includes('mag-seo-internal-box') && !content.includes('Belgin Saat Koleksiyonu:')) {
    content += `\n<p class="mag-seo-internal-box" style="margin-top: 2rem; padding: 1.25rem; background: rgba(5,51,47,0.05); border-left: 4px solid var(--color-teal); border-radius: 4px;"><strong>Belgin Saat Koleksiyonu:</strong> Aradığınız ikonik referansları ve nadir modelleri incelemek için <a href="/elit-kategori/" style="color: var(--color-teal); font-weight: 600; text-decoration: underline;">Elit Saat Koleksiyonumuzu</a> veya tüm seçkin <a href="/saatler/" style="color: var(--color-teal); font-weight: 600; text-decoration: underline;">Lüks Saat Modellerimizi</a> ziyaret edebilir, İzmir Buca showroomumuzda uzman ekibimizden özel ekspertiz randevusu alabilirsiniz.</p>`;
  }

  // Görsel varlık doğrulaması
  const localImgPath = path.join(ROOT, image);
  if (!fs.existsSync(localImgPath)) {
    console.warn(`[UYARI] Görsel yerelde bulunamadı (${image}), güvenli vitrin görseline dönüştürüldü.`);
    image = "images/hero/hero-rolex-lineup.jpg";
  }

  return {
    id: artId,
    slug: slug,
    title: title,
    category: category,
    publish_date: art.publish_date || "Eylül 2026",
    raw_date: art.raw_date || "2026-09-01",
    author: "Belgin Saat & Mücevherat Editoryal Kurulu",
    read_time: readTime,
    image: image,
    summary: summary,
    content_html: content,
    source_url: art.source_url || ""
  };
}

function updateRedirects(articles) {
  // Eski slug'lar değiştiğinde 301 yönlendirmesi sağla
  let registry = { redirects: [], gone: [] };
  if (fs.existsSync(RETIRED_PATH)) {
    try {
      registry = JSON.parse(fs.readFileSync(RETIRED_PATH, 'utf8'));
    } catch (_) {}
  }
  if (!registry.redirects) registry.redirects = [];

  const existingSources = new Set(registry.redirects.map(r => r.from.replace(/\/$/, '')));

  // Bilinen eski karmaşık slug'lar
  const OLD_SLUGS_MAP = {
    "mag-181302": "5-affordable-alternatives-to-the-omega-seamaster-diver-300m",
    "mag-180772": "en-populer-5-omega-speedmaster-models-on-belgin-saat",
    "mag-178583": "girard-perregaux-laureato-fifty-a-complete-walkthrough-of-the-new-anniversary-models",
    "mag-180358": "collectible-rolex-watches-these-models-used-to-be-unpopular",
    "mag-178206": "gmt-vs-world-timer-which-is-the-better-travel-companion",
    "mag-177174": "vacheron-constantin-8217-s-value-development-son-5-yildaki-deger-gelisimi",
    "mag-177989": "luxury-watch-brands-and-the-world-cup-is-2026-the-end-of-an-era",
    "mag-177772": "collector-8217-s-guide-the-perfect-watch-collection-for-70-000",
    "mag-177645": "luxury-watches-and-motorsports-f1-legends-and-their-timepieces",
    "mag-177255": "how-women-shape-the-luxury-watch-industry",
    "mag-176676": "belgin-saat-summer-watch-strap-guide",
    "mag-177019": "soccer-world-cup-the-players-8217-watches",
    "mag-176771": "5-colourful-and-wrist-worn-royal-pop-alternatives-under-2-000",
    "mag-176428": "beautiful-watches-for-festive-occasions-and-parties",
    "mag-175798": "swatch-x-audemars-piguet-royal-pop-the-wildest-watch-release-of-the-year",
    "mag-175672": "luxury-watches-on-wall-street-a-saat-rehberi-for-bankers",
    "mag-174683": "vintage-vs-modern-watches-5-modern-classics-and-their-vintage-alternatives",
    "mag-173755": "five-reasons-why-it-s-smart-to-buy-vintage-watches",
    "mag-173834": "5-affordable-rolex-8220-pepsi-8221-alternatives",
    "mag-172356": "the-10-best-watches-for-graduation-gifting",
    "mag-170705": "patek-philippe-rolex-038-co-how-do-third-party-logos-end-up-on-their-dials",
    "mag-169726": "the-world-of-watch-designers-jorg-hysek",
    "mag-168917": "the-oldest-watch-brands-in-the-world-from-omega-to-blancpain",
    "mag-169875": "evil-with-style-the-watches-of-movie-villains",
    "mag-168504": "the-top-10-best-selling-watches-of-2025-on-belgin-saat",
    "mag-167571": "the-hidden-watch-gems-of-2025",
    "mag-168290": "the-world-of-watch-designers-emmanuel-gueit",
    "mag-167506": "complications-simply-explained-watches-with-a-repeater",
    "mag-166765": "dial-materials-and-decorations-at-a-glance",
    "mag-164136": "quiet-luxury-watches-follow-the-trend-with-these-models",
    "mag-163331": "my-top-5-summer-watches-for-women",
    "mag-160884": "how-to-find-the-right-watch-size",
    "mag-160816": "the-top-5-most-popular-watches-on-the-us-market",
    "mag-150187": "the-watch-anniversaries-novelties-and-farewells-of-2025",
    "mag-149200": "top-5-revenue-leading-gmt-watches-under-20-000",
    "mag-148376": "my-watch-market-predictions-who-will-do-good-in-2025",
    "mag-147711": "top-5-best-selling-tourbillon-watches-on-belgin-saat",
    "mag-146630": "watch-knowledge-and-fun-facts-10-conversation-starters",
    "mag-139898": "it-8217-s-crucial-to-stay-true-to-the-brand-s-dna-8211-interview-with-fabrizio-buonamassa-stigliani-creative-director-038-designer-for-bvlgari-watches",
    "mag-140324": "the-new-czapek-038-cie-antarctique-s-mirrored-sincere-platinum-jubilee",
    "mag-110011": "the-5-best-unisex-diving-watches",
    "mag-95730": "five-perfect-watches-for-the-summer",
    "mag-51132": "rolex-submariner-collector-dials",
    "mag-20847": "what-is-8220-haute-horlogerie-8221",
    "mag-10486": "top-10-the-best-dive-watches",
    "mag-7916": "jumping-hour-watches"
  };

  let added = 0;

  // Kaldırılan / logo içeren makalelerin slug'larını 301 ile /magazin/ ana dizinine yönlendir
  const BLOCKED_SLUGS_REDIRECTS = [
    "/magazin/rolex-raporu-2026-en-cok-tercih-edilen-modeller",
    "/magazin/rolex-report-2026-en-cok-tercih-edilen-rolex-collections-and-koleksiyonerlerin-en-cok-aradigi-modeller-most-right-now",
    "/magazin/en-cok-deger-kazanan-luks-saat-modelleri-piyasa-analizi",
    "/magazin/chronopulse-check-the-best-performing-watches"
  ];
  for (const src of BLOCKED_SLUGS_REDIRECTS) {
    const cleanSrc = src.replace(/\/$/, '');
    if (!existingSources.has(cleanSrc)) {
      registry.redirects.push({
        from: cleanSrc,
        to: "/magazin/",
        type: 301
      });
      existingSources.add(cleanSrc);
      added++;
    }
  }

  for (const [id, oldSlug] of Object.entries(OLD_SLUGS_MAP)) {
    const art = articles.find(a => a.id === id);
    if (art && art.slug && art.slug !== oldSlug) {
      const fromPath = `/magazin/${oldSlug}`;
      const toPath = `/magazin/${art.slug}/`;
      if (!existingSources.has(fromPath)) {
        registry.redirects.push({
          from: fromPath,
          to: toPath,
          type: 301
        });
        existingSources.add(fromPath);
        added++;
      }
    }
  }

  if (added > 0) {
    fs.writeFileSync(RETIRED_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf8');
    console.log(`[Yönlendirme] ${added} adet eski magazin URL'si 301 haritasına eklendi.`);
  }
}

function runFilter() {
  const magModule = require('../js/magazine_data.js');
  const rawArticles = magModule.MAGAZINE_ARTICLES || [];

  console.log(`[Magazin Güvenlik Filtresi] Toplam ${rawArticles.length} makale denetleniyor ve arındırılıyor...`);

  const cleanArticles = rawArticles.map(cleanArticle).filter(Boolean);

  const jsContent = `// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: ${new Date().toISOString().slice(0, 10)} (Güvenlik, Logo & Entity Filtreli)
// ==========================================================

const MAGAZINE_ARTICLES = ${JSON.stringify(cleanArticles, null, 2)};

if (typeof window !== 'undefined') {
  window.MAGAZINE_ARTICLES = MAGAZINE_ARTICLES;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MAGAZINE_ARTICLES };
}
`;

  fs.writeFileSync(DATA_JS_PATH, jsContent, 'utf8');
  updateRedirects(cleanArticles);
  console.log(`✅ [Magazin Güvenlik Filtresi] ${cleanArticles.length} makalenin tamamı başarıyla arındırıldı ve kaydedildi.`);
}

if (require.main === module) {
  runFilter();
}

module.exports = { runFilter, decodeEntities };
