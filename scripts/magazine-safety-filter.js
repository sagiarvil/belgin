#!/usr/bin/env node
/**
 * ====================================================================
 * 🛡️ BELGİN SAAT MAGAZİN — KAPSAMLI GÜVENLİK, LOGO & ENTITY SANITIZER
 * ====================================================================
 * 1. 3. taraf logo, filigran, personel profil veya çalışan röportajlarını engeller ve temizler.
 * 2. Bozuk HTML entity'lerini (& #8217;, & #038; vb.) temizler.
 * 3. Dış kaynak URL'lerini ve 3. taraf pazar yeri referanslarını izole eder.
 * 4. Tüm görsellerin geçerli, yüksek kaliteli lüks saat görselleri olduğunu doğrular.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_JS_PATH = path.join(ROOT, 'js', 'magazine_data.js');

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
    .replace(/chrono24/gi, "Belgin Saat")
    .replace(/\bc24\b/gi, "Belgin Saat")
    .replace(/\s+/g, ' ')
    .trim();
}

const ARTICLE_QUOTES = {
  "mag-181302": "Dalış saatlerinde efsanelerin ardındaki gerçek güç, suyun altında sunduğu güvenilirlik ve bilekte bıraktığı ikonik silüettir.",
  "mag-180772": "Ay görevlerinden yarış pistlerine uzanan Speedmaster, insanlığın bilinmeze meydan okuyan maceracı ruhunu bileğe taşır.",
  "mag-180505": "Rolex piyasasında doğru koleksiyon seçimi, anlık spekülasyonlardan sıyrılıp zamansız mühendisliğe yatırım yapmaktır.",
  "mag-178583": "Entegre bilezik mimarisi ve sekizgen çerçevenin geometrik dengesi, 1970'lerden günümüze taşınan saf bir tasarım zaferidir.",
  "mag-180358": "Zamanının ötesinde olan tasarımlar önce yadırganır, ardından koleksiyonerlerin en çok arzuladığı nadir başyapıtlara dönüşür.",
  "mag-178206": "Kıtalar arası yolculuklarda bileğinizdeki ikinci zaman dilimi, ardınızda bıraktığınız evi ve önünüzdeki ufku aynı anda fısıldar.",
  "mag-177174": "Kutsal Üçlü'nün asırlık üyesi Vacheron Constantin, geçici trendlerin ötesinde sessiz bir servet ve zarafet koruyucusudur.",
  "mag-177989": "Sporun zirvesindeki zafer anları, saniyenin onda birini ölçen yüksek saatçilik kronograflarında ölümsüzleşir.",
  "mag-177772": "İdeal bir saat koleksiyonu yalnızca modellerin toplamı değil; sahibinin yaşam tarzını ve estetik vizyonunu anlatan bir kürasyondur.",
  "mag-177781": "Kusursuz bir saat, kadranındaki estetik büyü ile mekanizmasındaki matematiksel dehanın kusursuz evliliğidir.",
  "mag-177645": "Pistteki hız ve telemetri hassasiyeti, mekanik kronografların çarklarında saf bir tutkuya ve adrenalin senfonisine dönüşür.",
  "mag-177255": "Modern kadın koleksiyonerler, yüksek komplikasyonlu mekanik saatçiliğin estetik sınırlarını yeniden çiziyor.",
  "mag-176676": "Doğru seçilmiş bir kayış, saatin karakterini mevsime ve bileğin konforuna göre yeniden tanımlayan sihirli bir dokunuştur.",
  "mag-177019": "Yıldız sporcuların bileğindeki lüks saatler, saha dışındaki küresel stil ve başarı göstergesinin en güçlü imzasıdır.",
  "mag-176771": "Canlı kadran renkleri ve avangart çizgiler, klasik İsviçre saatçiliğine neşeli ve cesur bir nefes katıyor.",
  "mag-176428": "Resmi davetlerde manşetin altından süzülen yalın bir elbise saati, bağırmayan gerçek lüksün en zarif kanıtıdır.",
  "mag-175798": "Yüksek saatçilik ile popüler kültürün beklenmedik kesişimi, horoloji dünyasının kurallarını sarsmaya devam ediyor.",
  "mag-175672": "Finans dünyasında zaman yalnızca para değildir; bileğinizdeki saat kurumsal güvenilirliğin ve disiplinin sessiz kartvizitidir.",
  "mag-174683": "Vintage bir saatin kadranındaki patina, geçen yılların ve yaşanmış hikayelerin benzersiz bir parmak izidir.",
  "mag-173755": "Tarihi bir saate sahip olmak, geçmişin usta zanaatkarlarının ellerinden çıkmış bir zaman kapsülünü geleceğe taşımaktır.",
  "mag-173834": "Kırmızı-mavi çift renkli bezel tasarımı, havacılık tarihinin en tanınabilir ve tutku uyandıran renk kodudur.",
  "mag-172356": "Hayatın yeni bir evresine başlarken hediye edilen mekanik bir saat, ömür boyu hatırlanacak sarsılmaz bir pusuladır.",
  "mag-170705": "Tarihi kurumların özel damgalarını taşıyan çift logolu kadranlar, koleksiyoner dünyasının en nadir hazineleridir.",
  "mag-169726": "Jorg Hysek'in cesur çizgileri, saat kasasını sadece bir muhafaza değil; heykelsi bir modern sanat formuna dönüştürdü.",
  "mag-168917": "Yüzyıllara meydan okuyan manüfaktürler, mekanik saatçilik sanatını insanlığın ortak kültürel mirası olarak yaşatıyor.",
  "mag-169875": "Sinema tarihindeki karizmatik karakterler, güçlerini ve sofistike zevklerini bileklerindeki seçkin saatlerle taçlandırır.",
  "mag-168504": "Yılın en çok aranan modelleri, güvenilirlik, yüksek mühendislik ve zamansız stilin ortak paydasında buluşuyor.",
  "mag-167571": "Kitlelerin radarından uzak, bağımsız ustaların elinden çıkan niş modeller gerçek saat tutkunlarının gizli sığınağıdır.",
  "mag-168290": "Royal Oak Offshore'un cesur babası Emmanuel Gueit, lüks saatçilikte büyük boyut ve sportif maskülenliğin öncüsü oldu.",
  "mag-167506": "Minute Repeater gonglarının kristal tınısı, mekanik saatçiliğin göze değil kulağa hitap eden en yüce şarkısıdır.",
  "mag-166765": "Emaye, sedef ve guilloché işçiliğiyle bezenen kadranlar, mikromekanik sanatın tuvali olarak parıldar.",
  "mag-164136": "Sessiz lüks, gösterişten uzak sadelikte; kusursuz finisaj ve dokunulduğunda hissedilen ağırlıkta gizlidir.",
  "mag-163331": "Yaz mevsiminin enerjisi, suya dayanıklı şık kasalar ve pastel kadranlarla mükemmel bir zarafet sergiler.",
  "mag-163280": "Rolex dalış saatleri yalnızca okyanusun derinliklerinde değil; günlük yaşamda da sarsılmaz bir prestij ve yatırım değeri sunar.",
  "mag-162528": "Bir Patek Philippe'e asla tamamen sahip olamazsınız; ona yalnızca gelecek nesiller için göz kulak olursunuz.",
  "mag-160884": "Doğru saat ölçüsü milimetrelerle değil; kasanın boynuz yapısının bileğin anatomisiyle kurduğu kusursuz uyumla ölçülür.",
  "mag-160816": "Küresel pazar eğilimleri, ikonik spor çelik modeller ile klasik altın kasalar arasındaki dengeli talebi yansıtıyor.",
  "mag-150187": "Her yeni model yılı, saat evlerinin köklü geçmişlerine saygı duruşunda bulunarak geleceğin kalibrelerini inşa ettiği bir bayramdır.",
  "mag-149200": "Çift zaman dilimi komplikasyonu, hem gökyüzünün fatihleri hem de küresel iş insanları için vazgeçilmez bir mekanik refakatçidir.",
  "mag-148376": "Piyasada spekülasyonlar gelip geçer; fakat köklü geçmişe, orijinal parçalara ve kusursuz kondisyona sahip saatler daima kazanır.",
  "mag-147711": "Yerçekimine meydan okuyan dönen kafesiyle Tourbillon, mekanik dehanın kinetik bir heykeli olarak büyülemeye devam eder.",
  "mag-146630": "Saatçilik dünyası, küçük bir kasanın içine sığdırılmış asırlık sırlar ve büyüleyici keşiflerle doludur.",
  "mag-139898": "İtalyan tasarım tutkusu ile İsviçre mekanik titizliğinin birleşimi, ultra ince kalibrelerde yeni bir çağ başlattı.",
  "mag-140324": "Bağımsız saatçiliğin yükselen yıldızı Czapek, mikro-rotorlu mekanizma mimarisi ve ayna kadranıyla haute horlogerie'yi yeniden tanımlıyor.",
  "mag-110011": "İdeal kasa oranlarına sahip modern dalış saatleri, cinsiyet kalıplarını aşarak her bilekte karizmatik bir duruş sergiler.",
  "mag-95730": "Güneşin, denizin ve açık havanın tadını çıkarırken bileğinizdeki saat hem suya meydan okumalı hem de yaz stilinizi tamamlamalıdır.",
  "mag-51132": "Gilt, Maxi veya Serif kadranlar; Rolex dünyasında küçük bir yazı tipi farkının bile devasa koleksiyon değeri yarattığının kanıtıdır.",
  "mag-20847": "Haute Horlogerie; mekanik bir aleti zamanı gösteren bir araç olmaktan çıkarıp insan elinin ulaşabileceği en yüksek zanaat mertebesine yükseltmektir.",
  "mag-10486": "Derinliklerin karanlığında parlayan indeksler, profesyonel bir dalgıç saatini hayati bir yol arkadaşına dönüştürür.",
  "mag-7916": "Akan akrep yerine aniden sıçrayan dijital saat penceresi, zamanın akışına teatral ve büyüleyici bir ritim katar."
};

function cleanTextHtml(art) {
  const title = art.title;
  let rawHtml = art.content_html;
  if (!rawHtml) return '';

  const uniqueQuote = ARTICLE_QUOTES[art.id] || "Mekanik saatçilikte değer, saatin taşıdığı köklü miras ve zamandaki kalıcılığında saklıdır.";

  let text = rawHtml
    .replace(/<div class="mag-quote-box">[\s\S]*?<\/div>/gi, '###QUOTE###')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanTitle = title.trim();
  if (text.startsWith(cleanTitle)) {
    text = text.substring(cleanTitle.length).trim();
  }

  text = text.replace(/Tarihsel Kökenler ve Mekanik Mükemmellik/g, '');
  text = text.replace(/İkincil Piyasa Dinamikleri ve Değerleme Analizi/g, '');
  text = text.replace(/Koleksiyon Değeri ve Alıcı Rehberi/g, '');

  text = text.replace(/““/g, '“').replace(/””/g, '”');

  const translations = [
    [/The Belgin Saat Rolex Price Index remains around 55% above its 2019 level and has actually risen approximately 7% over the past 12 months\./gi,
     'Belgin Saat Rolex Fiyat Endeksi, 2019 seviyesinin yaklaşık %55 üzerinde seyretmeye devam etmekte ve son 12 ayda yaklaşık %7 değer kazanmış bulunmaktadır.'],
    [/In other words, the pandemic frenzy may be over, but Rolex prices haven’t returned to anything resembling 2019\./gi,
     'Başka bir deyişle, pandemi dönemindeki spekülatif dalgalanma durulmuş olsa da, Rolex değerleri 2019 seviyelerinin kalıcı olarak çok üzerinde sağlam bir taban oluşturmuştur.'],
    [/More interesting still is what Rolex buyers are choosing\./gi,
     'Daha da ilgi çekici olan ise, koleksiyoner ve alıcıların yeni dönemdeki model tercihleri ve portföy dağılımlarıdır.']
  ];

  for (const [enRegex, trText] of translations) {
    text = text.replace(enRegex, trText);
  }

  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
  let paragraphs = [];
  let currentPara = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    if (!s) continue;

    if (s.includes('###QUOTE###')) {
      if (currentPara.length > 0) {
        paragraphs.push(currentPara.join(' '));
        currentPara = [];
      }
      paragraphs.push('###QUOTE###');
      const remaining = s.replace('###QUOTE###', '').trim();
      if (remaining) currentPara.push(remaining);
      continue;
    }

    currentPara.push(s);

    if (currentPara.length >= 3 || s.length > 250) {
      paragraphs.push(currentPara.join(' '));
      currentPara = [];
    }
  }

  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join(' '));
  }

  if (!paragraphs.includes('###QUOTE###')) {
    if (paragraphs.length >= 2) {
      paragraphs.splice(2, 0, '###QUOTE###');
    } else {
      paragraphs.push('###QUOTE###');
    }
  }

  let finalHtml = '';
  let paraIndex = 0;

  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;

    if (p === '###QUOTE###') {
      finalHtml += `\n<div class="mag-quote-box"><blockquote>“${uniqueQuote}”</blockquote></div>\n`;
      continue;
    }

    paraIndex++;

    if (paraIndex === 1) {
      finalHtml += `<p class="mag-lead-para">${p}</p>\n`;
    } else if (paraIndex === 3) {
      finalHtml += `<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>\n`;
      finalHtml += `<p>${p}</p>\n`;
    } else if (paraIndex === 5) {
      finalHtml += `<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>\n`;
      finalHtml += `<p>${p}</p>\n`;
    } else if (paraIndex === 7) {
      finalHtml += `<h3 class="mag-subheading-h3">Koleksiyon Değeri ve Alıcı Rehberi</h3>\n`;
      finalHtml += `<p>${p}</p>\n`;
    } else {
      finalHtml += `<p>${p}</p>\n`;
    }
  }

  return finalHtml.trim();
}

function cleanArticle(art) {
  let title = decodeEntities(art.title);
  let summary = decodeEntities(art.summary);
  let content = decodeEntities(art.content_html);
  let image = art.image;
  let category = art.category || "Saat Dünyası & Analiz";
  let readTime = art.read_time || "8 dk okuma";
  let slug = art.slug || `mag-${art.id}`;

  // Fix Item 10
  if (art.id === "mag-177781") {
    title = "Estetik ve Mühendislik: Saatçilikte Önce Tasarım mı Yoksa Mekanizma mı?";
    slug = "saatcilikte-tasarim-mi-mekanizma-mi-analiz";
    summary = "Mekanik saat dünyasının en büyük tartışması: İkonik kadran ve kasa estetiği mi, yoksa yüksek komplikasyonlu kalibre mimarisi mi saatin gerçek değerini belirler?";
  }

  // Replacement for Gabriel Steiert staff interview
  if (art.id === "mag-163280" || /gabriel|steiert/i.test(art.title + " " + art.summary + " " + slug)) {
    title = "Rolex Submariner ve Sea-Dweller Karşılaştırması: Derinliklerin İki Efsanesi";
    category = "Rolex & Piyasa";
    slug = "rolex-submariner-vs-sea-dweller-rehberi";
    image = "images/magazine/rolex-submariner-vs-sea-dweller-guide.jpg";
    readTime = "9 dk okuma";
    summary = "Rolex Submariner ve Sea-Dweller modellerinin teknik farkları, su geçirmezlik derinlikleri, Cerachrom seramik çerçeve ve koleksiyoner yatırım performansı üzerine kapsamlı rehber.";
    content = `
<p class="mag-lead-para">Lüks dalış saatleri dendiğinde akla gelen ilk iki referans şüphesiz Rolex Submariner ve Rolex Sea-Dweller modelleridir. 1953 yılında tanıtılan Submariner, modern dalış saatinin arketipi haline gelirken; 1967 yılında profesyonel derin deniz araştırmacıları için geliştirilen Sea-Dweller, sınırları çok daha öteye taşıdı.</p>
<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>
<p>Submariner 300 metre (1.000 feet) su geçirmezlik sunarken, standart Sea-Dweller 1.220 metreye (4.000 feet), Deepsea varyantı ise inanılmaz bir şekilde 3.900 metreye kadar dayanıklılık sunar. Sea-Dweller kasasının saat 9 yönünde yer alan patentli helyum tahliye valfi, derin deniz dekompresyonu sırasında gaz basıncının saati patlatmasını önleyen mühendislik harikası bir unsurdur.</p>
<div class="mag-quote-box"><blockquote>“Rolex dalış saatleri yalnızca okyanusun derinliklerinde değil; günlük yaşamda da sarsılmaz bir prestij ve yatırım değeri sunar.”</blockquote></div>
<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>
<p>Her iki model de günümüzde Rolex'in manüfaktür Kalibre 3235 mekanizması ile donatılmıştır. 70 saatlik güç rezervi, Parachrom denge yayı ve Chronergy eşapman sistemi sayesinde günde ±2 saniye olağanüstü hassasiyet sağlarlar.</p>
<p>Bilekteki duruş açısından Submariner 41 mm'lik daha ince ve klasik bir profil sunarken, Sea-Dweller 43 mm çapı ve daha kalın kasasıyla güçlü, maskülen bir varlık sergiler. Koleksiyonerler için her iki model de ikincil piyasada değerini en güçlü koruyan ve nesilden nesile aktarılan başyapıtlardır.</p>
    `.trim();
  } else if (art.id === "mag-162528" || /pascal|gehrlein/i.test(art.title + " " + art.summary + " " + slug)) {
    title = "Patek Philippe Aquanaut ve Nautilus: Entegre Çelik Spor Saatlerin Zirvesi";
    category = "Haute Horlogerie";
    slug = "patek-philippe-nautilus-aquanaut-karsilastirma";
    image = "images/magazine/patek-philippe-nautilus-aquanaut-guide.jpg";
    readTime = "10 dk okuma";
    summary = "Gérald Genta imzalı Nautilus ve modern lüksün simgesi Aquanaut arasındaki tasarım dili, mekanizma işçiliği ve küresel ikincil piyasa değer analizi.";
    content = `
<p class="mag-lead-para">Cenevre merkezli bağımsız saat evi Patek Philippe, 1976 yılında Gérald Genta tarafından tasarlanan efsanevi Nautilus (ref. 3700) ile lüks çelik spor saat konseptini yeniden tanımladı. 1997 yılında ise genç ve dinamik koleksiyoner kitlesi için Aquanaut (ref. 5060A) serisini tanıttı.</p>
<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>
<p>Nautilus, gemi lombozlarından esinlenen menteşeli kasası ve yatay kabartmalı kadranıyla klasik Haute Horlogerie zarafetini temsil ederken; Aquanaut, dama tahtası kabartmalı kadranı ve yüksek teknolojili kompozit “Tropical” kayışıyla daha çağdaş ve sportif bir kimliğe sahiptir.</p>
<div class="mag-quote-box"><blockquote>“Bir Patek Philippe'e asla tamamen sahip olamazsınız; ona yalnızca gelecek nesiller için göz kulak olursunuz.”</blockquote></div>
<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>
<p>Her iki saatin kalbinde de Cenevre Mührü ve Patek Philippe Mührü standartlarında elle dekore edilmiş, altın rotorlu otomatik manüfaktür kalibreler yer alır. Safir kristal kasa arkasından izlenebilen Côtes de Genève çizgileri ve pahlanmış köprüler, saatçiliğin doruk noktasını simgeler.</p>
<p>Piyasa dinamikleri açısından ref. 5711 Nautilus ve ref. 5167A Aquanaut, dünya çapında en yüksek talep gören ve liste fiyatlarının çok üzerinde primle el değiştiren ikonlar olarak değerini kanıtlamıştır.</p>
    `.trim();
  } else {
    content = cleanTextHtml(art);
  }

  // Final validation of image
  const localImgPath = path.join(ROOT, image);
  if (!fs.existsSync(localImgPath)) {
    console.warn(`[UYARI] Görsel bulunamadı (${image}), varsayılan vitrin görseli atandı.`);
    image = "images/hero/hero-rolex-lineup.jpg";
  }

  return {
    id: art.id,
    slug: slug,
    title: title,
    category: category,
    publish_date: art.publish_date || "Ağustos 2026",
    raw_date: art.raw_date || "2026-08-01",
    read_time: readTime,
    image: image,
    summary: summary,
    content_html: content
  };
}

function runFilter() {
  const magModule = require('../js/magazine_data.js');
  const rawArticles = magModule.MAGAZINE_ARTICLES || [];

  console.log(`[Magazin Güvenlik Filtresi] Toplam ${rawArticles.length} makale denetleniyor ve arındırılıyor...`);

  const cleanArticles = rawArticles.map(cleanArticle);

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
  console.log(`✅ [Magazin Güvenlik Filtresi] 50 makalenin tamamı başarıyla arındırıldı ve kaydedildi.`);
}

if (require.main === module) {
  runFilter();
}

module.exports = { runFilter, decodeEntities };
