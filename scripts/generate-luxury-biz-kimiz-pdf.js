#!/usr/bin/env node
/**
 * ====================================================================
 * 👑 BELGİN SAAT — ULTRA-LUXURY LANDSCAPE (16:9) PRESENTATION MOTORU
 * ====================================================================
 * 1. Yatay 16:9 Widescreen (1920x1080) formatı ile kullanıcı ekranı kaydırmadan
 *    tüm sayfayı ilk ekranda (Above-the-Fold), devasa ve net yazılarla okur.
 * 2. 10 sayfalık master sunum metinleri, alıntıları, marka evreni ve görselleri
 *    tam sayfa yatay lüks editoryal dergi düzeninde işlenir.
 * 3. Google Chrome headless ile 10 adet sayfa görseli (page-1.jpg .. page-10.jpg)
 *    ve master A4 Landscape PDF (docs/belgin-saat-kurumsal-profil-2026.pdf) üretilir.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BIZ_IMG_DIR = path.join(ROOT, 'images', 'biz-kimiz');
const DOCS_DIR = path.join(ROOT, 'docs');
const SCRATCH_DIR = path.join(ROOT, 'scratch', 'biz-pdf-build');

fs.mkdirSync(BIZ_IMG_DIR, { recursive: true });
fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.mkdirSync(SCRATCH_DIR, { recursive: true });

function imgBase64(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    console.warn('Görsel bulunamadı:', relPath);
    return '';
  }
  const ext = path.extname(relPath).toLowerCase().replace('.', '');
  const mime = ext === 'webp' ? 'image/webp' : (ext === 'png' ? 'image/png' : 'image/jpeg');
  const b64 = fs.readFileSync(full).toString('base64');
  return `data:${mime};base64,${b64}`;
}

// Görsel Varlıkları
const imgRolexGMT = imgBase64('images/biz-kimiz/assets/media_1788290903882.jpg') || imgBase64('images/hero/hero-rolex-lineup.jpg');
const imgRichardMille = imgBase64('images/biz-kimiz/assets/media_1788290903881.jpg') || imgBase64('images/biz-kimiz/assets/media_1788285695715.jpg');
const imgPatekTiffany = imgBase64('images/biz-kimiz/assets/media_1788290903879.jpg') || imgBase64('images/magazine/patek-philippe-nautilus-aquanaut-guide.jpg');
const imgCelebrities = imgBase64('images/biz-kimiz/assets/media_1788290903879.webp') || imgBase64('images/biz-kimiz/assets/media_1788289518569.png');
const imgDaytonaZenith = imgBase64('images/biz-kimiz/assets/media_1788285087384.jpg') || imgRolexGMT;
const imgMissTourism = imgBase64('images/biz-kimiz/assets/media_1788288519572.png') || imgCelebrities;
const imgVintagePatek = imgBase64('images/biz-kimiz/assets/media_1788285619493.jpg') || imgRolexGMT;
const imgWatchHandover = imgBase64('images/biz-kimiz/assets/media_1788285695720.jpg') || imgRolexGMT;
const imgWatchBoxVIP = imgBase64('images/biz-kimiz/assets/media_1788285695721.jpg') || imgRolexGMT;

const PAGES = [
  // -------------------------------------------------------------
  // SAYFA 1: KAPAK — LÜKS SAAT ODAĞINDA GÜVEN, SEÇKİ VE GÖRÜNÜRLÜK
  // -------------------------------------------------------------
  {
    num: 1,
    title: 'Kapak & Profil',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="brand-header-row">
            <div class="brand-title-box">
              <span class="brand-name-serif">Belgin</span>
              <span class="brand-sub-sans">Saat &amp; Kuyumculuk &bull; Est. 1999</span>
            </div>
          </div>

          <div class="cover-main-hero">
            <h1 class="cover-headline">Belgin Saat &amp; <span class="highlight-gold">Kuyumculuk</span></h1>
            
            <div class="diamond-divider">💎 &bull; &bull; &bull;</div>

            <h2 class="cover-subtitle">Lüks saat odağında güven, seçki ve görünürlük</h2>

            <p class="cover-desc">
              Belgin Saat&amp;Kuyumculuk, seçkin saat kültürünü güven temelli ilişki anlayışıyla bir araya getirmektedir. YouWatch mirasıyla güçlenen görünürlük, kürasyon disipliniyle desteklenmekte; vitrin dışında da yaşayan bir saat evreni kurulmaktadır.
            </p>

            <div class="gold-quote-card">
              <span class="card-crown-icon">👑</span>
              <p class="card-quote-text">
                Seçilen her parça, prestij ile güven arasındaki dengeyi temsil etmektedir.
              </p>
            </div>
          </div>

          <div class="page-footer-row">
            <span>| KURUMSAL PROFİL</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right visual-cover-bg">
          <div class="cover-photo-composition">
            <img src="${imgRolexGMT}" alt="Rolex GMT-Master II Luxury Watch" class="main-cover-watch">
            <div class="cover-movement-box">
              <img src="${imgRichardMille}" alt="Haute Horlogerie Movement" class="cover-sub-watch">
            </div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 2: SAAT KÜLTÜRÜ VE MARKA HAFIZASI
  // -------------------------------------------------------------
  {
    num: 2,
    title: 'Saat Kültürü ve Marka Hafızası',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">02 | KURUMSAL PROFİL &bull; TİCARET HAFIZASI</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Saat Kültürü <span style="font-weight:400; font-family:'Cinzel', serif; font-size:42px;">ve</span> <span class="highlight-gold">Marka Hafızası</span></h1>
            
            <p class="page-lead-bold">
              Bizim için saat, bir ürün değil; zevkin, sürekliliğin ve güvenin kuşaktan kuşağa aktarılan bir kültürüdür.
            </p>
          </div>

          <div class="feature-items-grid">
            <div class="feature-item-card">
              <div class="f-icon-wrap">🔍</div>
              <div class="f-content">
                <h3 class="f-title">Seçki Anlayışımız</h3>
                <p class="f-desc">
                  Her markanın, modelin ve detayın kendi karakteri olduğuna inanıyoruz. Zamanın ötesinde değer taşıyan parçaları titizlikle seçerek koleksiyonumuzu oluşturuyoruz.
                </p>
              </div>
            </div>

            <div class="feature-item-card">
              <div class="f-icon-wrap">🤝</div>
              <div class="f-content">
                <h3 class="f-title">Uzun İlişki Hafızası</h3>
                <p class="f-desc">
                  Müşterilerimizle bağımız bir satış anıyla sınırlı değildir. Yıllara yayılan güven ilişkisi ortak bir hafızaya dönüşür; değerli saatlerin anlamını derinleştirir.
                </p>
              </div>
            </div>

            <div class="feature-item-card">
              <div class="f-icon-wrap">👤</div>
              <div class="f-content">
                <h3 class="f-title">Doğru Parçayı Eşleştirme</h3>
                <p class="f-desc">
                  Her koleksiyon sahibinin hikâyesi farklıdır. Doğru parçayı bulmak, yalnızca ürün bilgisiyle değil anlayış ve sezgiyle mümkündür.
                </p>
              </div>
            </div>
          </div>

          <div class="dark-teal-quote-box">
            <p class="teal-quote-text">
              “Bir saatin değeri, yalnızca zamanı göstermesinde değil; taşıdığı hikâyede, ustalığında ve bize hatırlattığı anlarda saklıdır.”
            </p>
          </div>

          <div class="page-footer-row">
            <span>Belgin Kuyumculuk &bull; Saat</span>
            <span>BELGİN SAAT &amp; KUYUMCULUK</span>
          </div>
        </div>

        <div class="split-visual-right visual-angled-bg">
          <div class="angled-photo-wrap">
            <img src="${imgRolexGMT}" alt="Rolex Dial Precision" class="angled-top-img">
            <img src="${imgDaytonaZenith}" alt="Swiss Watchmaking Cityscape" class="angled-bot-img">
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 3: YOUWATCH ETKİSİ
  // -------------------------------------------------------------
  {
    num: 3,
    title: 'YouWatch Etkisi',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">03 | KURUMSAL PROFİL &bull; MARKA MİRASI</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">YouWatch <span class="highlight-gold">Etkisi</span></h1>
            
            <p class="page-lead-bold">
              YouWatch geçmişiyle oluşan görünürlük, ürünün vitrin dışında da dolaşımda kalmasını sağlamaktadır.
            </p>

            <p class="body-p-regular" style="margin-top:8px;">
              Saatler spor, iş, sanat ve yaşam tarzı çevrelerinde görünürlük kazanmaktadır; hatırlanma, tavsiye ve güven birbirini beslemektedir.
            </p>
          </div>

          <div class="feature-items-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="feature-item-card">
              <div class="f-icon-wrap">👥</div>
              <div class="f-content">
                <h3 class="f-title">Görünürlük her ortamda, etki her temasda.</h3>
                <p class="f-desc">
                  YouWatch kültürü, saatleri yalnızca vitrinde değil; günlük hayatın içinde gerçek ve doğal anlarla görünür kılar.
                </p>
              </div>
            </div>

            <div class="feature-item-card">
              <div class="f-icon-wrap">🤝</div>
              <div class="f-content">
                <h3 class="f-title">Hatırlanır, önerilir, tercih edilir.</h3>
                <p class="f-desc">
                  Gerçek deneyimler, çevreye ilham olur, tavsiye doğurur; güven ve sadakat kalıcı değer yaratır.
                </p>
              </div>
            </div>
          </div>

          <div class="dark-teal-quote-box">
            <p class="teal-quote-text">
              “Gerçek hayatın içinde görülen her saat, yarınki tercihe dönüşür.”
            </p>
          </div>

          <div class="page-footer-row">
            <span>| KURUMSAL PROFİL</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="youwatch-mosaic-grid">
            <div class="mosaic-item"><img src="${imgCelebrities}" alt="Celebrity &amp; Athlete Lifestyle"></div>
            <div class="mosaic-item"><img src="${imgMissTourism}" alt="Miss Tourism Sponsorship"></div>
            <div class="mosaic-item"><img src="${imgRichardMille}" alt="Haute Horlogerie Movement"></div>
            <div class="mosaic-item"><img src="${imgRolexGMT}" alt="YouWatch Wrist Shot"></div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 4: SEÇKİN MARKA EVRENİ
  // -------------------------------------------------------------
  {
    num: 4,
    title: 'Seçkin Marka Evreni',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">04 | KURUMSAL PROFİL &bull; DÜNYA SAAT EVLERİ</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Seçkin Marka <span class="highlight-gold">Evreni</span></h1>
            
            <p class="page-lead-bold">
              Dünyanın en arzu edilen saat markaları ve özenle seçilmiş ikonlar etrafında şekillenen bir evren.
            </p>
          </div>

          <div class="brand-capsule-bar">
            <span>ROLEX</span> &bull; <span>PATEK PHILIPPE</span> &bull; <span>AUDEMARS PIGUET</span> &bull; <span>RICHARD MILLE</span> &bull; <span>CARTIER</span> &bull; <span>OMEGA</span> &bull; <span>HUBLOT</span> &bull; <span>TAG HEUER</span> &bull; <span>PANERAI</span> &bull; <span>BREITLING</span>
          </div>

          <div class="body-p-block" style="margin-top:12px;">
            <p>
              Belgin Saat&amp;Kuyumculuk'ta her bir seçki, prestij algısı ile uzun vadeli güven arasında denge kurularak şekillendirilir. Her marka; mirası, mühendisliği, estetiği ve değerini sürdürebilme kabiliyeti ile titizlikle değerlendirilir.
            </p>
            <p style="margin-top:8px;">
              Koleksiyon tutkusuyla yaşayanlardan stil ve imajına özen gösteren seçkin müşterilere kadar geniş bir yelpazede beklentilere kalıcı anlam katar.
            </p>
          </div>

          <div class="gold-quote-card">
            <span class="card-crown-icon">👑</span>
            <p class="card-quote-text">
              Zamana yön veren markalar. Seçici zevklere özel, kalıcı değerler.
            </p>
          </div>

          <div class="page-footer-row">
            <span>| KURUMSAL PROFİL</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="brand-watches-mosaic">
            <div class="b-card"><img src="${imgRichardMille}" alt="Richard Mille"></div>
            <div class="b-card"><img src="${imgRolexGMT}" alt="Rolex GMT Master II"></div>
            <div class="b-card"><img src="${imgPatekTiffany}" alt="Patek Philippe Tiffany"></div>
            <div class="b-card"><img src="${imgVintagePatek}" alt="Cartier Santos &amp; Patek"></div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 5: SEÇKİN MÜŞTERİ ÇEVRESİ
  // -------------------------------------------------------------
  {
    num: 5,
    title: 'Seçkin Müşteri Çevresi',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">05 | KURUMSAL PROFİL &bull; MÜŞTERİ AĞI</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Seçkin Müşteri <span class="highlight-gold">Çevresi</span></h1>
            
            <p class="page-lead-bold">
              Belgin Saat, futbolculardan sanatçılara, iş insanlarından lüks odaklı seçkin müşterilere kadar uzanan bir çevreyle doğal bir bağ kurar.
            </p>
          </div>

          <div class="body-p-block" style="margin-top:10px;">
            <p>
              Her bir saat, kişinin zevkini, duruşunu ve özgüvenini görünür kılan güçlü bir ifadedir. Tarz sahibi bu çevrelerde saat; yalnızca takılan bir ürün değil, kimliğin ve imajın ayrılmaz bir uzantısıdır.
            </p>
          </div>

          <div class="feature-item-card" style="margin-top:12px;">
            <div class="f-icon-wrap">👥</div>
            <div class="f-content">
              <p class="f-desc" style="font-size:22px; font-weight:700; color:var(--ink); line-height:1.45;">
                Tavsiye, hatıra ve ilişkilerin derinliği bu çevrelerde zamanla daha da güçlenir; bağlar kalıcı değere dönüşür.
              </p>
            </div>
          </div>

          <div class="dark-teal-quote-box">
            <p class="teal-quote-text">
              “Saat, yalnızca aksesuar değil; karakteri görünür kılan bir imzaya dönüşmektedir.”
            </p>
          </div>

          <div class="page-footer-row">
            <span>| KURUMSAL PROFİL</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="vip-clientele-mosaic">
            <div class="vip-photo-hero"><img src="${imgCelebrities}" alt="VIP Clientele Lounge"></div>
            <div class="vip-photo-dual">
              <img src="${imgWatchHandover}" alt="Business Lounge">
              <img src="${imgRolexGMT}" alt="Rolex Submariner Wrist">
            </div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 6: ÖZEL SİPARİŞ VE KAYNAK AĞI
  // -------------------------------------------------------------
  {
    num: 6,
    title: 'Özel Sipariş ve Kaynak Ağı',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">06 | KURUMSAL PROFİL &bull; GLOBAL TEDARİK</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Özel Sipariş <span style="font-weight:400; font-family:'Cinzel', serif; font-size:42px;">ve</span> <span class="highlight-gold">Kaynak Ağı</span></h1>
            
            <p class="page-lead-bold">
              Nadir bulunan veya profilinize özel parçalar; sabır, yaklaşım ve ilişki sermayesiyle, güvenilir kanallar aracılığıyla sizin için kaynağımızdan temin edilir.
            </p>
          </div>

          <div class="body-p-block" style="margin-top:10px;">
            <p>
              Her arayış, titiz bir değerlendirme ve kapsamlı bir ağ çalışmasıyla yürütülür. Doğru saat, doğru koşullarda, sizi yansıtan nitelikte ve tam zamanında ulaştırılır.
            </p>
          </div>

          <div class="gold-quote-card">
            <span class="card-crown-icon">💎</span>
            <p class="card-quote-text">
              Prestij kovalanmaz, özenle seçilir ve doğru zamanda ortaya çıkar.
            </p>
          </div>

          <div class="gold-line-card">
            <p style="font-size:20px; color:#2C3833; line-height:1.5; font-weight:600;">
              Zevk seviyeniz, özgünlük beklentiniz ve kime ait olduğunuz; bizim seçim yolculuğumuzun pusulasıdır.
            </p>
          </div>

          <div class="page-footer-row">
            <span>| KURUMSAL PROFİL</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="procure-visual-wrap">
            <img src="${imgDaytonaZenith}" alt="Geneva Luxury Watchmaking Bridge" class="procure-city-img">
            <img src="${imgPatekTiffany}" alt="Rolex Daytona Platinum Ice Blue Dial" class="procure-watch-img">
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 7: PORTFÖYÜ CANLI TUTAN DEĞER DÖNGÜSÜ
  // -------------------------------------------------------------
  {
    num: 7,
    title: 'Portföyü Canlı Tutan Değer Döngüsü',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">07 | KURUMSAL PROFİL &bull; DEĞER DÖNGÜSÜ</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Portföyü Canlı Tutan <span class="highlight-gold">Değer Döngüsü</span></h1>
            
            <p class="page-lead-bold">
              Belgin Saat’te her saat, sizi yansıtan bir arzu olarak başlar; güvene dayalı ilişkiler ağı içinde değerini koruyarak yoluna devam eder.
            </p>
          </div>

          <div class="body-p-block" style="margin-top:10px;">
            <p>
              Seçici alım, doğru zamanda satış ve değişim (trade-back) mantığıyla işleyen modelimiz; özel siparişler, koleksiyon yenilemeleri ve değer odaklı kararlarla portföyü sürekli canlı tutar.
            </p>
            <p style="margin-top:8px; font-weight:700; color:var(--ink); font-size:22px;">
              Bugün bir arzu nesnesi olarak sahip olursunuz, yarın güvenilir bir ağda dolaşan değerli bir varlığa dönüşür.
            </p>
          </div>

          <div class="feature-item-card" style="background:#FBF9F5; border:2px solid var(--gold);">
            <div class="f-icon-wrap">🤝</div>
            <div class="f-content">
              <h3 class="f-title" style="color:var(--teal); font-size:23px;">Kalıcı İlişkileri Destekler, Portföyü Daima Hareketli Kılar</h3>
              <p class="f-desc">
                Bu yaklaşım, uzun soluklu ve güvene dayalı ilişkileri güçlendirir. Portföyünüz her zaman dinamik ve size özel kalır.
              </p>
            </div>
          </div>

          <div class="page-footer-row">
            <span>| KURUMSAL PROFİL</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="portfolio-visual-stack">
            <img src="${imgVintagePatek}" alt="Patek Philippe Nautilus Rose Gold" class="nautilus-hero-img">
            <img src="${imgRichardMille}" alt="Haute Horlogerie Movement Rotor" class="rotor-hero-img">
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 8: KÜRASYON DİLİ
  // -------------------------------------------------------------
  {
    num: 8,
    title: 'Kürasyon Dili',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">08 | KURUMSAL PROFİL &bull; ESTETİK &amp; DETAY</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Kürasyon <span class="highlight-gold">Dili</span></h1>
            
            <p class="page-lead-bold">
              Her seçili saat, kalite, incelik ve sessiz prestij atmosferine katkı sağlar.
            </p>
          </div>

          <div class="body-p-block" style="margin-top:10px;">
            <p>
              Kürasyonumuzda yer alan her model; estetik, ustalık ve zamansız değer açısından özenle değerlendirilir. Amacımız yalnızca güzel saatler sunmak değil, iyi hissettiren bir bütün kurmaktır. Bu bütün detaylara verilen önemle oluşur, bakışları değil, zevki konuşur.
            </p>
          </div>

          <div class="gold-quote-card">
            <span class="card-crown-icon">👑</span>
            <p class="card-quote-text">
              Formlar, malzemeler, kadran dokuları, bezel tasarımları, bilezik yapıları ve bilekteki duruş birlikte ele alınır.
            </p>
          </div>

          <div class="body-p-block" style="margin-top:10px;">
            <p>
              Her unsurun birbiriyle kurduğu uyum, koleksiyonumuzun karakterini belirler. Seçim dilimiz; dengeli, rafine ve zamansız bir çizgide şekillenir.
            </p>
          </div>

          <div class="page-footer-row">
            <span>| KÜRASYON DİLİ</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="curation-mosaic-grid">
            <img src="${imgRolexGMT}" alt="Breitling Superocean Chronograph" class="curation-top-img">
            <img src="${imgPatekTiffany}" alt="Rolex Jubilee &amp; Blue Dial" class="curation-bot-img">
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 9: GÜVEN, ÖZGÜNLÜK VE TESLİM DİSİPLİNİ
  // -------------------------------------------------------------
  {
    num: 9,
    title: 'Güven, Özgünlük ve Teslim Disiplini',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">09 | KURUMSAL PROFİL &bull; GÜVEN PROTOKOLÜ</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Güven, Özgünlük <span style="font-weight:400; font-family:'Cinzel', serif; font-size:42px;">ve</span> <span class="highlight-gold">Teslim Disiplini</span></h1>
          </div>

          <div class="body-p-block" style="margin-top:10px;">
            <p>
              Belgin Saat&amp;Kuyumculuk, ürün seçiminden nihai teslim anına kadar condition, özgünlük, parça bütünlüğü, mekanik sağlık, kozmetik denge ve müşteri beklentisini birlikte değerlendirmektedir.
            </p>
            <p style="margin-top:8px;">
              Her parçanın geçmişini, bugününü ve yarın değerini aynı disiplinle ele alıyor; mekanik güvenilirliği ve uzun vadeli sağlamlığı önceliğimiz olarak görüyoruz.
            </p>
          </div>

          <div class="feature-item-card" style="border:2px solid var(--gold);">
            <div class="f-icon-wrap">🛡️</div>
            <div class="f-content">
              <p class="f-desc" style="font-size:22px; color:#1A2521; font-weight:700; line-height:1.5;">
                Karar süreci aceleye değil güvene dayanmakta; sunum, doğrulama ve teslim çizgisi kontrollü biçimde yürütülmektedir.
              </p>
            </div>
          </div>

          <div class="luxury-closing-callout">
            Kusursuz süreç, <span>kalıcı değer yaratır.</span>
          </div>

          <div class="page-footer-row">
            <span>| KURUMSAL PROFİL</span>
            <span>www.belginkuyumculuk.com</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="discipline-visual-stack">
            <img src="${imgVintagePatek}" alt="Cartier Tank Roman Dial" class="disc-card-img">
            <img src="${imgRichardMille}" alt="Skeleton Tourbillon Movement" class="disc-move-img">
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 10: GÜVEN VE KALİTE İLE TAMAMLANAN İZLENİM
  // -------------------------------------------------------------
  {
    num: 10,
    title: 'Güven ve Kalite ile Tamamlanan İzlenim',
    html: `
      <div class="page-container page-layout-split">
        <div class="split-content-left">
          <div class="top-nav-tag">10 | KURUMSAL PROFİL &bull; KAPANIŞ &amp; MİRAS</div>

          <div class="inner-header-block">
            <h1 class="page-main-title">Güven ve Kalite ile <span class="highlight-gold">Tamamlanan İzlenim</span></h1>
            
            <p class="page-lead-bold" style="margin-top:8px;">
              Belgin Saat&amp;Kuyumculuk, lüks saat dünyasında güveni, seçkinliği, görünürlüğü ve rafine hizmeti bir araya getirir.
            </p>
          </div>

          <div class="three-pillars-list">
            <div class="pillar-bullet">✦ Her ilişki kalıcı olmak üzere kurulur.</div>
            <div class="pillar-bullet">✦ Her seçim, özenle ve titizlikle yapılır.</div>
            <div class="pillar-bullet">✦ Her deneyim, ayrıcalıkla ve gizlilikle taşınır.</div>
          </div>

          <p class="body-p-regular">
            Zamanın ötesinde bir değer için, zarafetle şekillenen bir yolculukta sizlere eşlik etmekten gurur duyuyoruz.
          </p>

          <div class="gold-box-statement">
            <span class="card-crown-icon" style="display:block; margin-bottom:4px; font-size:32px;">👑</span>
            <strong>ZAMANIN DEĞERİNİ BİLENLER İÇİN, HER ANI ANLAMLI KILAN AYRICALIKLI BİR SEÇİM.</strong>
          </div>

          <div class="page-footer-row">
            <div class="bottom-brand-logo">
              <span style="font-family:'Cinzel', serif; font-size:26px; font-weight:800; color:var(--teal);">Belgin</span>
              <span style="font-size:12px; letter-spacing:2px; color:var(--gold-dark); text-transform:uppercase; margin-left:8px;">Kuyumculuk &bull; Saat</span>
            </div>
            <span>İzmir Buca VIP Showroom &bull; Menderes Cad. No:41/A</span>
          </div>
        </div>

        <div class="split-visual-right">
          <div class="quad-photo-grid">
            <div class="quad-item"><img src="${imgRolexGMT}" alt="Rolex Submariner Crown"></div>
            <div class="quad-item"><img src="${imgDaytonaZenith}" alt="Geneva Bridge Landscape"></div>
            <div class="quad-item"><img src="${imgRichardMille}" alt="Manufacture Rotor Movement"></div>
            <div class="quad-item"><img src="${imgVintagePatek}" alt="Cartier Santos on Wrist"></div>
          </div>
        </div>
      </div>
    `
  }
];

// Master High-Legibility Landscape (16:9 Widescreen) CSS Stylesheet
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --gold: #C2A768;
    --gold-bright: #D4AF37;
    --gold-dark: #8F763A;
    --teal: #082622;
    --teal-dark: #041B18;
    --ink: #141E1A;
    --paper: #FAF8F5;
    --paper-light: #FCFAF7;
    --muted: #2E3B36;
    --border: rgba(194, 167, 104, 0.45);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: var(--ink);
    background: #FFFFFF;
    -webkit-font-smoothing: antialiased;
  }

  .page-container {
    width: 1920px;
    height: 1080px;
    position: relative;
    overflow: hidden;
    background: var(--paper-light);
    page-break-after: always;
  }

  .page-layout-split {
    display: flex;
    width: 100%;
    height: 100%;
  }

  /* Sol Panel (Geniş Metin Alanı) */
  .split-content-left {
    width: 55%;
    height: 100%;
    padding: 48px 56px 36px 64px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--paper-light);
    position: relative;
    z-index: 2;
  }

  /* Sağ Panel (Görseller) */
  .split-visual-right {
    width: 45%;
    height: 100%;
    background: var(--teal);
    position: relative;
    overflow: hidden;
  }

  .brand-header-row {
    display: flex;
    align-items: center;
  }

  .brand-name-serif {
    font-family: 'Cinzel', serif;
    font-size: 36px;
    font-weight: 800;
    color: #35463E;
    letter-spacing: 0.5px;
  }

  .brand-sub-sans {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold-dark);
    margin-left: 12px;
  }

  .top-nav-tag {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--gold-dark);
    text-transform: uppercase;
  }

  .cover-headline {
    font-family: 'Cinzel', serif;
    font-size: 54px;
    font-weight: 800;
    line-height: 1.15;
    color: var(--teal);
    margin: 12px 0 8px;
  }

  .highlight-gold {
    color: var(--gold-dark);
  }

  .diamond-divider {
    font-size: 24px;
    margin: 8px 0;
    color: var(--gold);
  }

  .cover-subtitle {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.25;
    color: var(--teal);
    margin-bottom: 14px;
  }

  .cover-desc {
    font-size: 22px;
    line-height: 1.6;
    color: #2D3A35;
    font-weight: 500;
    margin-bottom: 18px;
  }

  .page-main-title {
    font-family: 'Cinzel', serif;
    font-size: 48px;
    font-weight: 800;
    line-height: 1.15;
    color: var(--teal);
    margin: 8px 0;
  }

  .page-lead-bold {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.45;
    color: var(--ink);
  }

  .body-p-regular {
    font-size: 21px;
    line-height: 1.55;
    color: #2D3A35;
    font-weight: 500;
  }

  .body-p-block p {
    font-size: 21px;
    line-height: 1.55;
    color: #2D3A35;
    font-weight: 500;
  }

  /* Kartlar & Izgaralar */
  .gold-quote-card {
    background: #FFFFFF;
    border: 1.5px solid var(--border);
    border-left: 5px solid var(--gold);
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.03);
  }

  .card-crown-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  .card-quote-text {
    font-size: 21px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.45;
  }

  .feature-items-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
    margin: 12px 0;
  }

  .feature-item-card {
    background: #FFFFFF;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 8px;
    padding: 14px 16px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    box-shadow: 0 3px 12px rgba(0,0,0,0.03);
  }

  .f-icon-wrap {
    font-size: 22px;
    flex-shrink: 0;
    background: #F7F4EE;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1.5px solid rgba(194, 167, 104, 0.5);
  }

  .f-title {
    font-size: 19px;
    font-weight: 800;
    color: var(--teal);
    margin-bottom: 4px;
  }

  .f-desc {
    font-size: 17px;
    line-height: 1.48;
    color: #2D3A35;
    font-weight: 500;
  }

  .dark-teal-quote-box {
    background: var(--teal);
    color: #FFFFFF;
    border-radius: 8px;
    padding: 14px 20px;
    border: 1.5px solid rgba(194, 167, 104, 0.4);
    box-shadow: 0 6px 20px rgba(8, 38, 34, 0.2);
  }

  .teal-quote-text {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 21px;
    line-height: 1.45;
    color: #F0F4F2;
    text-align: center;
  }

  .brand-capsule-bar {
    background: #FFFFFF;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: var(--teal);
    line-height: 1.5;
    margin-top: 10px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.03);
  }

  .gold-line-card {
    background: #FFFFFF;
    border: 1.5px solid var(--border);
    padding: 14px 18px;
    border-radius: 8px;
    margin-top: 10px;
  }

  .luxury-closing-callout {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 32px;
    font-weight: 700;
    color: var(--teal);
    line-height: 1.25;
    margin-top: 10px;
  }

  .luxury-closing-callout span {
    color: var(--gold-dark);
  }

  .three-pillars-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 10px 0;
  }

  .pillar-bullet {
    font-size: 21px;
    font-weight: 700;
    color: var(--teal);
    line-height: 1.4;
  }

  .gold-box-statement {
    background: linear-gradient(135deg, rgba(194, 167, 104, 0.2) 0%, rgba(194, 167, 104, 0.35) 100%);
    border: 2px solid var(--gold);
    border-radius: 8px;
    padding: 16px 20px;
    text-align: center;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--teal);
    line-height: 1.45;
  }

  .page-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid rgba(0,0,0,0.08);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 1.5px;
    color: #6C7C77;
    text-transform: uppercase;
  }

  /* Görseller (Sağ Kolon) */
  .visual-cover-bg {
    background: radial-gradient(circle at 60% 40%, #0C3831 0%, #051F1B 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cover-photo-composition {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .main-cover-watch {
    width: 100%;
    height: 70%;
    object-fit: cover;
    display: block;
  }

  .cover-movement-box {
    width: 100%;
    height: 30%;
    overflow: hidden;
  }

  .cover-sub-watch {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .angled-photo-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .angled-top-img {
    width: 100%;
    height: 60%;
    object-fit: cover;
  }

  .angled-bot-img {
    width: 100%;
    height: 40%;
    object-fit: cover;
  }

  .youwatch-mosaic-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    width: 100%;
    height: 100%;
    gap: 8px;
    padding: 8px;
    background: var(--teal-dark);
  }

  .mosaic-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }

  .brand-watches-mosaic {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    width: 100%;
    height: 100%;
    gap: 8px;
    padding: 8px;
    background: var(--teal-dark);
  }

  .b-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }

  .vip-clientele-mosaic {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: 8px;
    padding: 8px;
    background: var(--teal-dark);
  }

  .vip-photo-hero {
    height: 55%;
    overflow: hidden;
    border-radius: 4px;
  }
  .vip-photo-hero img { width:100%; height:100%; object-fit:cover; }

  .vip-photo-dual {
    height: 45%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .vip-photo-dual img { width:100%; height:100%; object-fit:cover; border-radius:4px; }

  .procure-visual-wrap {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .procure-city-img { width:100%; height:45%; object-fit:cover; }
  .procure-watch-img { width:100%; height:55%; object-fit:cover; }

  .portfolio-visual-stack {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .nautilus-hero-img { width:100%; height:60%; object-fit:cover; }
  .rotor-hero-img { width:100%; height:40%; object-fit:cover; }

  .curation-mosaic-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .curation-top-img { width:100%; height:55%; object-fit:cover; }
  .curation-bot-img { width:100%; height:45%; object-fit:cover; }

  .discipline-visual-stack {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  .disc-card-img { width:100%; height:50%; object-fit:cover; }
  .disc-move-img { width:100%; height:50%; object-fit:cover; }

  .quad-photo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    width: 100%;
    height: 100%;
    gap: 6px;
    padding: 6px;
    background: var(--teal-dark);
  }
  .quad-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }
`;

async function buildFolio() {
  console.log('🚀 [KURUMSAL PROFİL MOTORU — 16:9 LANDSCAPE] Başlatılıyor...');

  for (const page of PAGES) {
    const pageHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Belgin Saat Kurumsal Profil - Sayfa ${page.num}</title>
  <style>${STYLES}</style>
</head>
<body style="background:#fff; margin:0; padding:0;">
  ${page.html}
</body>
</html>`;

    const htmlFile = path.join(SCRATCH_DIR, `page-${page.num}.html`);
    fs.writeFileSync(htmlFile, pageHtml, 'utf8');

    const jpgDest = path.join(BIZ_IMG_DIR, `page-${page.num}.jpg`);

    const cmd = `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --window-size=1920,1080 --screenshot="${jpgDest}" "file://${htmlFile}"`;
    try {
      execSync(cmd, { stdio: 'pipe' });
      console.log(`✅ [SAYFA ${page.num}/10] Görseli başarıyla üretildi: images/biz-kimiz/page-${page.num}.jpg (${(fs.statSync(jpgDest).size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`❌ [SAYFA ${page.num}] render hatası:`, e.message);
    }
  }

  const masterHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Belgin Saat Kurumsal Profil 2026</title>
  <style>
    ${STYLES}
    @page {
      size: A4 landscape;
      margin: 0;
    }
    body {
      background: #fff;
    }
  </style>
</head>
<body>
  ${PAGES.map(p => p.html).join('\n')}
</body>
</html>`;

  const masterHtmlFile = path.join(SCRATCH_DIR, 'master-folio.html');
  fs.writeFileSync(masterHtmlFile, masterHtml, 'utf8');

  const pdfDest = path.join(DOCS_DIR, 'belgin-saat-kurumsal-profil-2026.pdf');
  const pdfCmd = `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfDest}" "file://${masterHtmlFile}"`;

  try {
    execSync(pdfCmd, { stdio: 'pipe' });
    console.log(`\n🎉 [MASTER PDF ÜRETİLDİ] docs/belgin-saat-kurumsal-profil-2026.pdf (${(fs.statSync(pdfDest).size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (e) {
    console.error('❌ PDF oluşturma hatası:', e.message);
  }

  console.log('\n=============================================================');
  console.log('👑 16:9 LANDSCAPE KURUMSAL PROFİL FOLİOSU VE 10 SAYFA TAMAMLANDI!');
  console.log('=============================================================');
}

buildFolio().catch(console.error);
