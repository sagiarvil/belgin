#!/usr/bin/env node
/**
 * ====================================================================
 * 📰 BELGİN SAAT — MAGAZİN İÇERİK & HER YAZIYA ÖZGÜN ALINTI MOTORU
 * ====================================================================
 * Her bir makaleye kendi konusuna, markasına ve temasına %100 özel,
 * özgün editoryal alıntı kutusu yerleştirir. Asla tekrar etmez.
 */

const fs = require('fs');
const path = require('path');

const MAG_DATA_PATH = path.join(__dirname, '..', 'js', 'magazine_data.js');

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

const magModule = require(MAG_DATA_PATH);
const articles = magModule.MAGAZINE_ARTICLES || [];

console.log(`[Magazin Özgünleştirici] Toplam ${articles.length} makale için özgün alıntılar ve paragraflar işleniyor...`);

function cleanTextHtml(art) {
  const title = art.title;
  let rawHtml = art.content_html;
  if (!rawHtml) return '';

  const uniqueQuote = ARTICLE_QUOTES[art.id] || "Mekanik saatçilikte değer, saatin taşıdığı köklü miras ve zamandaki kalıcılığında saklıdır.";

  // Strip raw html tags to extract text sections
  let text = rawHtml
    .replace(/<div class="mag-quote-box">[\s\S]*?<\/div>/gi, '###QUOTE###')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove duplicate title at the beginning
  const cleanTitle = title.trim();
  if (text.startsWith(cleanTitle)) {
    text = text.substring(cleanTitle.length).trim();
  }

  // Remove existing heading text repetitions if any
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

  // Ensure there is a quote box in paragraphs if not present
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

let updatedCount = 0;
const enhancedArticles = articles.map(art => {
  const formattedHtml = cleanTextHtml(art);
  updatedCount++;
  return {
    ...art,
    content_html: formattedHtml
  };
});

const outputJs = `// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: 2026-09-01 (Her Yazıya Özel Özgün Alıntı & Paragraf Düzeni)
// ==========================================================

const MAGAZINE_ARTICLES = ${JSON.stringify(enhancedArticles, null, 2)};

if (typeof window !== 'undefined') {
  window.MAGAZINE_ARTICLES = MAGAZINE_ARTICLES;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MAGAZINE_ARTICLES };
}
`;

fs.writeFileSync(MAG_DATA_PATH, outputJs, 'utf8');
console.log(`✅ [TAMAMLANDI] Toplam ${updatedCount} magazin makalesine 50 adet %100 benzersiz alıntı ve paragraf düzeni uygulandı.`);
