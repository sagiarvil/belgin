#!/usr/bin/env node
/**
 * ====================================================================
 * 👑 BELGİN SAAT — ULTRA-LUXURY KURUMSAL PROFİL PDF & FLIPBOOK MOTORU
 * ====================================================================
 * Bu motor:
 * 1. Şirket cirosu/hacim gibi gizli ticari rakamları (15-30 Mn vb.) tamamen kaldırır.
 * 2. Kullanıcının yüklediği lüks saat görsellerini ve magazin görsellerini harmanlar.
 * 3. Prestij, güven inşası, köklü miras (Est. 1999) ve Haute Horlogerie dilinde
 *    10 sayfalık nefes kesici bir kurumsal folio üretir.
 * 4. Google Chrome headless ile hem 10 adet sayfa görselini (page-1.jpg .. page-10.jpg)
 *    hem de 10 sayfalık master PDF'i (docs/belgin-saat-kurumsal-profil-2026.pdf) derler.
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

// Convert images to base64 for reliable standalone offline rendering
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

const imgDaytonaIce = imgBase64('images/biz-kimiz/assets/media_1788290903882.jpg');
const imgZenithSport = imgBase64('images/biz-kimiz/assets/media_1788290903881.jpg');
const imgTudorSuit = imgBase64('images/biz-kimiz/assets/media_1788290903879.jpg');
const imgTrioWatches = imgBase64('images/biz-kimiz/assets/media_1788290903879.webp');
const imgCartierWrist = imgBase64('images/biz-kimiz/assets/media_1788285695721.jpg') || imgBase64('images/hero/hero-geneva-sunset.jpg');
const imgRolexSub = imgBase64('images/magazine/rolex-submariner-vs-sea-dweller-guide.jpg');
const imgPatekNautilus = imgBase64('images/magazine/patek-philippe-nautilus-aquanaut-guide.jpg');
const imgMaisonHero = imgBase64('images/hero/hero-rolex-lineup.jpg');
const imgGeneva = imgBase64('images/hero/hero-geneva-sunset.jpg');

const PAGES = [
  // -------------------------------------------------------------
  // SAYFA 1: KAPAK (COVER OF EXCELLENCE)
  // -------------------------------------------------------------
  {
    num: 1,
    title: 'Kapak',
    html: `
      <div class="page-container dark-cover">
        <div class="cover-gold-border">
          <div class="cover-header">
            <div class="brand-crest">👑</div>
            <div class="brand-title">BELGİN SAAT</div>
            <div class="brand-subtitle">HAUTE HORLOGERIE &bull; İZMİR BUCA &bull; EST. 1999</div>
          </div>

          <div class="cover-hero-img-wrap">
            <img src="${imgDaytonaIce}" class="cover-hero-img" alt="Rolex Daytona Platinum">
            <div class="cover-hero-overlay"></div>
          </div>

          <div class="cover-content">
            <div class="cover-badge">KURUMSAL TİCARET VE LÜKS SAAT PROFİLİ</div>
            <h1 class="cover-heading">Zamanın ve Değerin<br><span class="gold-text">Çeyrek Asırlık Mirası</span></h1>
            <p class="cover-desc">
              1999'dan bu yana kuyumculuk ve lüks saat dünyasında sarsılmaz güven, mutlak şeffaflık ve kurumsal uzmanlıkla inşa edilen seçkin ticaret hafızası.
            </p>
          </div>

          <div class="cover-footer">
            <div class="cover-meta-item">
              <span class="lbl">MERKEZ SHOWROOM</span>
              <span class="val">Menderes Cad. No:41/A Buca / İzmir</span>
            </div>
            <div class="cover-meta-item">
              <span class="lbl">DİJİTAL FOLİO</span>
              <span class="val">2026 Resmî Kurumsal Sürüm</span>
            </div>
            <div class="cover-meta-item">
              <span class="lbl">HUKUKİ STATÜ</span>
              <span class="val">Semih Sonbahar &bull; Kayıtlı Mülk</span>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 2: YÖNETİCİ ÖZETİ & TEMEL DEĞERLER (EXECUTIVE SUMMARY)
  // -------------------------------------------------------------
  {
    num: 2,
    title: 'Yönetici Özeti & İlkeler',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 01 &bull; YÖNETİCİ ÖZETİ</span>
            <h2 class="sec-title">Mükemmellik, Mutlak Gizlilik ve Kurumsal Güven</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">02</span>
          </div>
        </div>

        <div class="page-grid-2col" style="margin-top:24px;">
          <div class="col-text">
            <p class="lead-p">
              Lüks saat ve kıymetli maden ticareti, yalnızca sermaye ile değil; <strong>yılların biriktirdiği piyasa hafızası, kusursuz ekspertiz kabiliyeti ve yüksek gizlilik disiplini</strong> ile icra edilir.
            </p>
            <p>
              Belgin Saat & Kuyumculuk; 1999 yılında İzmir Buca'da temelleri atılan, çeyrek asrı aşkın köklü ticaret hafızasıyla Türkiye'nin ve dünyanın en prestijli saat evlerinin (Rolex, Patek Philippe, Audemars Piguet, Omega, Cartier vb.) nadide parçalarını seçkin koleksiyonerlerle buluşturan bağımsız bir lüks saat otoritesidir.
            </p>
            <div class="quote-card">
              <div class="quote-mark">“</div>
              <p>Yüksek değerli bir saat ticaretinde karar katalogdan önce karşılıklı güvenle başlar. Biz tek seferlik bir satış değil; nesiller boyu sürecek bir koleksiyon ortaklığı inşa ederiz.”</p>
            </div>
          </div>

          <div class="col-visual">
            <div class="visual-img-card">
              <img src="${imgZenithSport}" class="visual-img" alt="Zenith Chronomaster Sport">
              <div class="img-caption">Haute Horlogerie Standardında Mikroskobik Mekanizma ve Kondisyon İncelemesi</div>
            </div>
          </div>
        </div>

        <div class="three-pillars-strip">
          <div class="pillar-box">
            <span class="pillar-icon">🏛️</span>
            <h4>Köklü Miras</h4>
            <p>1999'dan beri aynı adreste, kendi mülkümüzde kesintisiz fiziksel varlık ve itibar.</p>
          </div>
          <div class="pillar-box">
            <span class="pillar-icon">🔍</span>
            <h4>Kusursuz Ekspertiz</h4>
            <p>Her referans için fabrikasyon toleranslarında optik, mekanik ve seri kontrolü.</p>
          </div>
          <div class="pillar-box">
            <span class="pillar-icon">🔒</span>
            <h4>Mutlak Gizlilik</h4>
            <p>VIP müşterilerimiz için en üst düzeyde kişisel veri ve işlem mahremiyeti disiplini.</p>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 3: 20+ YILLIK TİCARET HAFIZASI (HERITAGE & PEDIGREE)
  // -------------------------------------------------------------
  {
    num: 3,
    title: '20+ Yıllık Ticaret Hafızası',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 02 &bull; TİCARET HAFIZASI</span>
            <h2 class="sec-title">20+ Yılın Biriktirdiği Şey: Ürün Değil, Güven</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">03</span>
          </div>
        </div>

        <div class="page-grid-2col" style="margin-top:20px;">
          <div class="col-visual">
            <div class="visual-img-card">
              <img src="${imgTudorSuit}" class="visual-img" alt="Tudor Black Bay Luxury Wristshot">
              <div class="img-caption">Seçkin İş Dünyası ve Koleksiyonerlerin Bileğinde Yaşayan Prestij</div>
            </div>
          </div>

          <div class="col-text">
            <p class="lead-p">
              Çeyrek asırlık ticaret hafızası; dalgalanan piyasalarda doğru referansı, doğru kondisyonda ve adil değerle tespit edebilme gücüdür.
            </p>
            
            <div class="feature-item">
              <div class="feat-icon">💎</div>
              <div>
                <h5>Ürün Hafızası</h5>
                <p>Nadir referansların üretim yılları, kalibre revizyonları, kasa polisaj geçmişi ve ikincil piyasa likidite analizi.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feat-icon">🤝</div>
              <div>
                <h5>Müşteri Hafızası</h5>
                <p>Koleksiyonerlerimizin zevklerini, aradıkları özel kasa materyallerini ve portföy hedeflerini yakından takip eden kişisel danışmanlık.</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feat-icon">📈</div>
              <div>
                <h5>Piyasa Hafızası</h5>
                <p>Cenevre, Londra, Dubai ve Hong Kong borsa dinamikleriyle tam senkronize küresel değerleme doğruluğu.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="banner-gold-box">
          <div class="gold-icon">📍</div>
          <div class="gold-text-wrap">
            <strong>Fiziksel Güvenin Adresi:</strong> İzmir Buca Menderes Caddesi'ndeki kendi mülkümüz olan showroomumuzda, randevulu VIP ağırlama odamızda her işlem yüz yüze, güvenle ve şeffaflıkla sonuçlandırılır.
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 4: MARKA KURMA & ÖLÇEKLEME GÜCÜ (YOU WATCH CASE STUDY)
  // -------------------------------------------------------------
  {
    num: 4,
    title: 'Marka Kurma ve Dağıtım Gücü',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 03 &bull; TİCARİ VİZYON</span>
            <h2 class="sec-title">Marka Kurma, Ölçekleme ve Global Devir Tecrübesi</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">04</span>
          </div>
        </div>

        <div class="page-grid-2col" style="margin-top:20px;">
          <div class="col-text">
            <p class="lead-p">
              Belgin Saat'in kurucusu Semih Sonbahar, sıfırdan kurup ulusal bir fenomene dönüştürdüğü <strong>You Watch</strong> markası ile Türkiye'nin en büyük perakende ve dağıtım başarılarından birine imza atmıştır.
            </p>
            <p>
              Türkiye genelinde <strong>yaklaşık 600 satış noktasına</strong> ulaşan devasa bayi ağı, <strong>Beymen, Vakko, Boyner ve ÇiçekSepeti</strong> gibi ülkenin en prestijli mağaza zincirlerinde tescillenen marka değeri; kurumsal ölçekleme kabiliyetimizin en somut kanıtıdır.
            </p>
            <p>
              Marka, pandemi öncesi dönemde <strong>Hollandalı uluslararası bir yatırım grubuna</strong> başarılı bir operasyonla devredilerek döngüsünü tamamlamıştır. Bu kurumsal miras, bugün lüks saat segmentindeki yüksek operasyonel disiplinimizin temelidir.
            </p>
          </div>

          <div class="col-visual">
            <div class="visual-img-card">
              <img src="${imgTrioWatches}" class="visual-img" alt="Panerai Omega Breitling Luxury Trio">
              <div class="img-caption">Küresel Saat Markaları Portföy Yönetimi &amp; Güçlü Dağıtım Ağı</div>
            </div>
          </div>
        </div>

        <div class="stats-row-4">
          <div class="stat-mini">
            <span class="s-num">~600</span>
            <span class="s-lbl">Geçmiş Satış Noktası</span>
          </div>
          <div class="stat-mini">
            <span class="s-num">81</span>
            <span class="s-lbl">İlde Dağıtım Gücü</span>
          </div>
          <div class="stat-mini">
            <span class="s-num">4+</span>
            <span class="s-lbl">Dev Perakende Zinciri</span>
          </div>
          <div class="stat-mini">
            <span class="s-num">Global</span>
            <span class="s-lbl">Marka Devir Başarısı</span>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 5: SEÇKİN MÜŞTERİ AĞI (EXCLUSIVE CLIENT NETWORK)
  // -------------------------------------------------------------
  {
    num: 5,
    title: 'Seçkin Müşteri Ekosistemi',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 04 &bull; ORGANİK AĞ</span>
            <h2 class="sec-title">Seçkin Çevrelerde Organik ve Güven Temelli Dolaşım</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">05</span>
          </div>
        </div>

        <div class="page-grid-2col" style="margin-top:20px;">
          <div class="col-visual">
            <div class="visual-img-card">
              <img src="${imgCartierWrist}" class="visual-img" alt="Cartier Santos Luxury Wristshot">
              <div class="img-caption">İş İnsanları ve Sanat Dünyasının Tercih Ettiği Ebedi İkonlar</div>
            </div>
          </div>

          <div class="col-text">
            <p class="lead-p">
              Lüks saat ticaretinde müşteri portföyünün kalitesi, fiyat kadar belirleyici bir avantaj sağlar.
            </p>
            <p>
              Belgin Saat; <strong>iş dünyasının liderleri, üst düzey yöneticiler, sporcular, sanatçılar ve kıdemli saat koleksiyonerlerinden</strong> oluşan seçkin bir müşteri ekosistemine sahiptir.
            </p>
            <p>
              Bu organik ağ, reklam kampanyalarıyla değil; yalnızca <strong>başarıyla tamamlanan işlemler, şeffaf ekspertiz raporları ve tavsiye zinciri</strong> ile büyümüştür. Portföyümüzdeki müşteriler hem sürekli alıcı hem de güvenilir satıcı olarak döngüde yer alır.
            </p>
            
            <div class="vip-benefit-card">
              <div class="vip-badge">💎 VIP PROTOKOLÜ</div>
              <p>Müşterilerimizin kimlik bilgileri, koleksiyon içerikleri ve finansal işlem detayları en üst düzey kurumsal sır prensibiyle korunmaktadır.</p>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 6: DÜNYA MARKALARINA DOĞRUDAN ERİŞİM (THE 10 MAISONS)
  // -------------------------------------------------------------
  {
    num: 6,
    title: 'Lüks Saat Markaları Evreni',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 05 &bull; MARKA PORTFÖYÜ</span>
            <h2 class="sec-title">Dünya Saat Evlerine Doğrudan Erişim ve Portföy</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">06</span>
          </div>
        </div>

        <p class="lead-p" style="margin-top:16px;">
          İsviçre ve Alman Haute Horlogerie dünyasının en prestijli 10 lüks saat evine ait ikonik ve nadir modeller Belgin Saat güvencesiyle temin edilmektedir.
        </p>

        <div class="brand-showcase-grid">
          <div class="brand-card-item"><strong>👑 Rolex</strong><span>Daytona, Submariner, GMT-Master II, Day-Date</span></div>
          <div class="brand-card-item"><strong>🏛️ Patek Philippe</strong><span>Nautilus, Aquanaut, Calatrava, Grand Complications</span></div>
          <div class="brand-card-item"><strong>⚡ Audemars Piguet</strong><span>Royal Oak, Offshore, Concept, Code 11.59</span></div>
          <div class="brand-card-item"><strong>🚀 Omega</strong><span>Speedmaster Moonwatch, Seamaster, Aqua Terra</span></div>
          <div class="brand-card-item"><strong>💎 Cartier</strong><span>Santos, Tank Must, Ballon Bleu, Panthère</span></div>
          <div class="brand-card-item"><strong>🛡️ Tudor</strong><span>Black Bay 58, Pelagos FXD, Chrono Panda</span></div>
          <div class="brand-card-item"><strong>🧭 Panerai</strong><span>Luminor Marina, Submersible, Radiomir</span></div>
          <div class="brand-card-item"><strong>✈️ IWC Schaffhausen</strong><span>Big Pilot, Portugieser Chrono, Ingenieur</span></div>
          <div class="brand-card-item"><strong>🏎️ TAG Heuer</strong><span>Monaco Steve McQueen, Carrera Glassbox</span></div>
          <div class="brand-card-item"><strong>🛩️ Breitling</strong><span>Navitimer B01, Chronomat, Superocean Heritage</span></div>
        </div>

        <div class="split-gallery-2">
          <div class="gal-img-wrap"><img src="${imgRolexSub}" alt="Rolex Submariner"><span>Rolex Submariner &amp; Sea-Dweller Serisi</span></div>
          <div class="gal-img-wrap"><img src="${imgPatekNautilus}" alt="Patek Philippe Nautilus"><span>Patek Philippe Nautilus &amp; Aquanaut Serisi</span></div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 7: 4 KADEMELİ MUTLAK GÜVEN PROTOKOLÜ (VERIFICATION GATE)
  // -------------------------------------------------------------
  {
    num: 7,
    title: '4 Kademeli Güven Protokolü',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 06 &bull; EKSPERTİZ &amp; GÜVENLİK</span>
            <h2 class="sec-title">4 Kademeli Kusursuz Orijinallik ve Güven Protokolü</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">07</span>
          </div>
        </div>

        <p class="lead-p" style="margin-top:16px;">
          Belgin Saat bünyesinde el değiştiren her saat, istisnasız 4 aşamalı kurumsal güvenlik ve ekspertiz süzgecinden geçirilir:
        </p>

        <div class="protocol-steps-list">
          <div class="proto-step">
            <div class="proto-badge">1</div>
            <div class="proto-body">
              <h4>Kaynak &amp; Menşei Doğrulaması</h4>
              <p>Saatin orijinal evrakları, garanti kartı seri numarası, uluslararası veri tabanları ve çalıntı/kayıp kaydı çapraz sorgulanır.</p>
            </div>
          </div>

          <div class="proto-step">
            <div class="proto-badge">2</div>
            <div class="proto-body">
              <h4>Mikroskobik Optik &amp; Mekanizma Ekspertizi</h4>
              <p>Kasa polisaj durumu, orijinal bileşenler, kadran fontları, lazer taç mühürleri ve manüfaktür kalibrenin mikro düzeyde incelenmesi.</p>
            </div>
          </div>

          <div class="proto-step">
            <div class="proto-badge">3</div>
            <div class="proto-body">
              <h4>Zaman Tutuş &amp; Su Geçirmezlik Testi</h4>
              <p>Elektronik timegrapher cihazı ile günlük sapma oranı (± saniye/gün), genlik (amplitude), vuruş hatası ve basınç izolasyon testi.</p>
            </div>
          </div>

          <div class="proto-step">
            <div class="proto-badge">4</div>
            <div class="proto-body">
              <h4>Hukuki Sözleşme &amp; Güvenli Teslim</h4>
              <p>Resmî e-fatura, seri numaralı teslim tutanağı ve İzmir Buca VIP Showroom'da elden şahsi teslim protokolü.</p>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 8: YÜKSEK LİKİDİTE & PORTFÖY DÖNGÜSÜ (LIQUIDITY ENGINE)
  // -------------------------------------------------------------
  {
    num: 8,
    title: 'Yüksek Likidite ve Portföy Döngüsü',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 07 &bull; PORTFÖY EKONOMİSİ</span>
            <h2 class="sec-title">Yatırımı Değere, Zamanı Likiditeye Dönüştüren Model</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">08</span>
          </div>
        </div>

        <div class="page-grid-2col" style="margin-top:20px;">
          <div class="col-text">
            <p class="lead-p">
              Lüks saat koleksiyonerliği durağan bir hobi değil; yaşayan, evrilen ve değer üreten bir portföy yönetimidir.
            </p>
            
            <div class="liq-card">
              <h4>💵 Anında Nakit Likiditesi</h4>
              <p>Koleksiyonunuzdaki yüksek değerli parçalar için güncel küresel pazar değerinde anında nakit alım garantisi ve aynı gün ödeme.</p>
            </div>

            <div class="liq-card">
              <h4>🔄 Şeffaf Takas &amp; Model Yükseltme</h4>
              <p>Mevcut saatinizi değerinde sayarak hayalinizdeki yeni referansa adil marj farkıyla geçiş yapabilme imkânı.</p>
            </div>

            <div class="liq-card">
              <h4>🎯 Özel Sipariş &amp; Tahsis</h4>
              <p>Dünya çapında bekleme listesi bulunan nadir referansların hızlı ve güvenli tedarik ağı.</p>
            </div>
          </div>

          <div class="col-visual">
            <div class="visual-img-card">
              <img src="${imgMaisonHero}" class="visual-img" alt="Rolex Lineup Luxury Watch Showcase">
              <div class="img-caption">Koleksiyon Değerinizi Koruyan ve Büyüten Stratejik Portföy Yönetimi</div>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 9: HUKUKİ UYUM & MALİ ŞEFFAFLIK (LEGAL & COMPLIANCE)
  // -------------------------------------------------------------
  {
    num: 9,
    title: 'Hukuki Güvence ve Şeffaflık',
    html: `
      <div class="page-container">
        <div class="page-header">
          <div class="page-header-left">
            <span class="sec-tag">BÖLÜM 08 &bull; HUKUKİ ŞEFFAFLIK</span>
            <h2 class="sec-title">Kurumsal Güvence, Faturalı Ticaret ve Tam Mevzuat Uyumu</h2>
          </div>
          <div class="page-header-right">
            <span class="page-num">09</span>
          </div>
        </div>

        <p class="lead-p" style="margin-top:16px;">
          Belgin Saat bünyesinde gerçekleşen her ticari işlem, Türkiye Cumhuriyeti kanunlarına ve MASAK finansal güvenlik düzenlemelerine 100% uygun yürütülür.
        </p>

        <div class="compliance-grid-3">
          <div class="comp-box">
            <span class="comp-icon">📑</span>
            <h4>Resmî e-Fatura</h4>
            <p>Her satış için 3065 sayılı KDV Kanunu özel matrah düzenlemesine uygun resmî fatura tanzimi.</p>
          </div>
          <div class="comp-box">
            <span class="comp-icon">🛡️</span>
            <h4>BKM &amp; 3D Secure 2.0</h4>
            <p>Banka düzeyinde 256-bit EV SSL ve Akbank Sanal POS 3D Secure altyapısıyla güvenli tahsilat.</p>
          </div>
          <div class="comp-box">
            <span class="comp-icon">⚖️</span>
            <h4>Hukuki Delil Zinciri</h4>
            <p>Sözleşmeler, kimlik doğrulama ve Bitcoin OpenTimestamps dijital zaman damgasıyla değişmez delil kaydı.</p>
          </div>
        </div>

        <div class="compliance-quote">
          <strong>Kurumsal Güvence Bildirgesi:</strong> Belgin Saat (Semih Sonbahar) vergi mükellefiyeti, kayıtlı mülkü ve çeyrek asırlık ticari itibarı ile tüm müşterilerine yüzde yüz yasal, şeffaf ve denetlenebilir bir ticaret ortamı taahhüt eder.
        </div>
      </div>
    `
  },

  // -------------------------------------------------------------
  // SAYFA 10: SHOWROOM & VIP RANDEVU (VISIT & CONTACT)
  // -------------------------------------------------------------
  {
    num: 10,
    title: 'VIP Randevu ve İletişim',
    html: `
      <div class="page-container dark-cover" style="padding-top:40px;">
        <div class="cover-gold-border" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="cover-header" style="margin-bottom:20px;">
              <div class="brand-crest">👑</div>
              <div class="brand-title" style="font-size:24px;">BELGİN SAAT</div>
              <div class="brand-subtitle">HAUTE HORLOGERIE &bull; İZMİR BUCA &bull; EST. 1999</div>
            </div>

            <div class="contact-card-box">
              <h2 style="font-family:'Cinzel', serif; font-size:24px; color:var(--gold); margin:0 0 10px 0; text-align:center;">İzmir Buca VIP Showroom</h2>
              <p style="text-align:center; font-size:13.5px; color:#ccc; line-height:1.6; margin-bottom:24px;">
                Sizi ve koleksiyonunuzu, yüksek güvenlikli ve konforlu VIP ağırlama salonumuzda kahve eşliğinde ağırlamaktan onur duyarız.
              </p>

              <div class="contact-info-list">
                <div class="c-row">
                  <span class="c-icon">📍</span>
                  <div><strong>Showroom Adresi:</strong> Menderes Caddesi No:41/A Buca / İzmir (Kendi Mülkümüz)</div>
                </div>
                <div class="c-row">
                  <span class="c-icon">📞</span>
                  <div><strong>Telefon &amp; WhatsApp VIP:</strong> +90 532 230 95 53</div>
                </div>
                <div class="c-row">
                  <span class="c-icon">✉️</span>
                  <div><strong>Kurumsal E-Posta:</strong> iletisim@belginkuyumculuk.com &bull; destek@belginkuyumculuk.com</div>
                </div>
                <div class="c-row">
                  <span class="c-icon">🌐</span>
                  <div><strong>Resmî Web Platformu:</strong> https://www.belginkuyumculuk.com</div>
                </div>
              </div>
            </div>
          </div>

          <div style="text-align:center; padding:20px 0 10px 0; border-top:1px solid rgba(212,175,55,0.3);">
            <p style="font-size:12px; color:var(--gold); letter-spacing:1px; margin:0; text-transform:uppercase;">
              “Zaman Geçer, Gerçek Değer ve Asil Miras Kalır.”
            </p>
            <p style="font-size:10.5px; color:#888; margin:6px 0 0 0;">
              &copy; 2026 Belgin Saat &bull; Semih Sonbahar &bull; Tüm Hakları Saklıdır.
            </p>
          </div>
        </div>
      </div>
    `
  }
];

// Common CSS Stylesheet for PDF & Images
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  :root {
    --gold: #d4af37;
    --gold-bright: #f3e5ab;
    --gold-dark: #aa820a;
    --navy-deep: #071118;
    --navy-card: #0d1e29;
    --ink: #111a24;
    --text-muted: #5a6b7c;
    --paper: #ffffff;
    --cream: #faf8f5;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--ink);
    background: #eef2f5;
    -webkit-font-smoothing: antialiased;
  }

  .page-container {
    width: 1240px;
    height: 1754px;
    padding: 60px 70px;
    background: var(--paper);
    position: relative;
    overflow: hidden;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* DARK LUXURY COVER */
  .dark-cover {
    background: radial-gradient(circle at center, #0f2432 0%, #060e14 100%);
    color: #fff;
  }

  .cover-gold-border {
    border: 2px solid rgba(212, 175, 55, 0.4);
    height: 100%;
    padding: 40px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .cover-header { text-align: center; }
  .brand-crest { font-size: 38px; margin-bottom: 8px; filter: drop-shadow(0 2px 8px rgba(212,175,55,0.4)); }
  .brand-title { font-family: 'Cinzel', serif; font-size: 34px; font-weight: 800; letter-spacing: 4px; color: #fff; }
  .brand-subtitle { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: var(--gold); margin-top: 6px; }

  .cover-hero-img-wrap {
    width: 100%;
    height: 640px;
    margin: 20px 0;
    position: relative;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }
  .cover-hero-img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
  .cover-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(6,14,20,0.85) 0%, transparent 50%, rgba(6,14,20,0.5) 100%);
  }

  .cover-content { text-align: center; padding: 0 30px; }
  .cover-badge {
    display: inline-block;
    padding: 6px 18px;
    background: rgba(212,175,55,0.15);
    border: 1px solid var(--gold);
    color: var(--gold-bright);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    border-radius: 50px;
    margin-bottom: 14px;
  }
  .cover-heading {
    font-family: 'Cinzel', serif;
    font-size: 38px;
    font-weight: 700;
    line-height: 1.25;
    color: #fff;
    margin-bottom: 14px;
  }
  .gold-text { color: var(--gold); }
  .cover-desc {
    font-size: 14px;
    line-height: 1.7;
    color: #b0c4de;
    max-width: 800px;
    margin: 0 auto;
  }

  .cover-footer {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(212, 175, 55, 0.3);
    text-align: center;
  }
  .cover-meta-item .lbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; color: var(--gold); text-transform: uppercase; }
  .cover-meta-item .val { display: block; font-size: 12px; font-weight: 600; color: #fff; margin-top: 4px; }

  /* PAGE HEADER */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 18px;
    border-bottom: 2px solid #e2e8f0;
  }
  .sec-tag { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: var(--gold-dark); text-transform: uppercase; }
  .sec-title { font-family: 'Cinzel', serif; font-size: 26px; font-weight: 700; color: var(--ink); margin-top: 4px; }
  .page-num { font-family: 'Cinzel', serif; font-size: 28px; font-weight: 800; color: #cbd5e1; }

  .page-grid-2col {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 40px;
    align-items: center;
    flex: 1;
  }
  .lead-p { font-size: 16px; font-weight: 500; line-height: 1.7; color: var(--ink); margin-bottom: 16px; }
  p { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 14px; }

  .quote-card {
    background: var(--cream);
    border-left: 4px solid var(--gold);
    padding: 20px 24px;
    border-radius: 0 8px 8px 0;
    margin: 20px 0;
    position: relative;
  }
  .quote-mark { font-family: 'Cinzel', serif; font-size: 48px; color: var(--gold); position: absolute; top: -10px; right: 16px; opacity: 0.3; }
  .quote-card p { font-style: italic; font-size: 14px; line-height: 1.65; color: #334155; margin: 0; }

  .visual-img-card {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    background: #fff;
  }
  .visual-img { width: 100%; height: 520px; object-fit: cover; display: block; }
  .img-caption { padding: 12px 16px; font-size: 11.5px; color: #64748b; background: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9; }

  .three-pillars-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e2e8f0;
  }
  .pillar-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }
  .pillar-icon { font-size: 26px; margin-bottom: 8px; display: block; }
  .pillar-box h4 { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
  .pillar-box p { font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; }

  /* FEATURE ITEMS */
  .feature-item {
    display: flex;
    gap: 16px;
    margin-bottom: 18px;
  }
  .feat-icon { font-size: 24px; line-height: 1; margin-top: 2px; }
  .feature-item h5 { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .feature-item p { font-size: 13px; color: #64748b; line-height: 1.55; margin: 0; }

  .banner-gold-box {
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, #fbf7ee 0%, #f5ecd8 100%);
    border: 1px solid rgba(212,175,55,0.4);
    border-radius: 8px;
    padding: 16px 20px;
    margin-top: 20px;
  }
  .gold-icon { font-size: 28px; }
  .gold-text-wrap { font-size: 13px; line-height: 1.6; color: #614805; }

  .stats-row-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
  }
  .stat-mini {
    background: #0f1d27;
    color: #fff;
    padding: 16px;
    border-radius: 8px;
    text-align: center;
    border-bottom: 3px solid var(--gold);
  }
  .stat-mini .s-num { display: block; font-family: 'Cinzel', serif; font-size: 24px; font-weight: 800; color: var(--gold-bright); }
  .stat-mini .s-lbl { display: block; font-size: 11px; font-weight: 600; color: #cbd5e1; margin-top: 4px; }

  .vip-benefit-card {
    background: #f1f5f9;
    border-left: 3px solid #0f1d27;
    padding: 16px;
    border-radius: 0 6px 6px 0;
    margin-top: 16px;
  }
  .vip-badge { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: var(--navy-deep); margin-bottom: 4px; }
  .vip-benefit-card p { font-size: 12.5px; color: #475569; margin: 0; line-height: 1.55; }

  /* BRAND SHOWCASE */
  .brand-showcase-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin: 20px 0;
  }
  .brand-card-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 14px 18px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .brand-card-item strong { font-size: 14px; color: var(--ink); }
  .brand-card-item span { font-size: 11.5px; color: #64748b; }

  .split-gallery-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 10px;
  }
  .gal-img-wrap {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    border: 1px solid #e2e8f0;
    background: #fff;
  }
  .gal-img-wrap img { width: 100%; height: 260px; object-fit: cover; display: block; }
  .gal-img-wrap span { display: block; padding: 10px; font-size: 11.5px; text-align: center; color: #475569; background: #f8fafc; font-weight: 600; }

  /* PROTOCOL STEPS */
  .protocol-steps-list { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
  .proto-step {
    display: flex;
    gap: 20px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px 24px;
    align-items: center;
  }
  .proto-badge {
    width: 46px;
    height: 46px;
    background: #0f1d27;
    color: var(--gold-bright);
    font-family: 'Cinzel', serif;
    font-size: 20px;
    font-weight: 800;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2px solid var(--gold);
  }
  .proto-body h4 { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .proto-body p { font-size: 13px; color: #64748b; line-height: 1.55; margin: 0; }

  /* LIQUIDITY CARDS */
  .liq-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid var(--gold);
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 14px;
  }
  .liq-card h4 { font-size: 14.5px; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
  .liq-card p { font-size: 13px; color: #64748b; line-height: 1.55; margin: 0; }

  /* COMPLIANCE GRID */
  .compliance-grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin: 24px 0;
  }
  .comp-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 24px 20px;
    border-radius: 8px;
    text-align: center;
  }
  .comp-icon { font-size: 32px; margin-bottom: 12px; display: block; }
  .comp-box h4 { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
  .comp-box p { font-size: 12.5px; color: #64748b; line-height: 1.6; margin: 0; }

  .compliance-quote {
    background: #eef7ee;
    border: 1px solid #c2e2c2;
    padding: 20px 24px;
    border-radius: 8px;
    font-size: 13.5px;
    color: #1b5e20;
    line-height: 1.65;
  }

  /* CONTACT PAGE */
  .contact-card-box {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: 10px;
    padding: 40px;
    margin: 30px auto;
    max-width: 900px;
  }
  .contact-info-list { display: flex; flex-direction: column; gap: 20px; }
  .c-row {
    display: flex;
    gap: 16px;
    align-items: center;
    font-size: 14.5px;
    color: #e2e8f0;
  }
  .c-icon { font-size: 24px; }
  .c-row strong { color: var(--gold-bright); }
`;

async function buildFolio() {
  console.log('🚀 [KURUMSAL PROFİL MOTORU] Başlatılıyor...');

  // 1. Generate individual HTML files for each page
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

    // Render 1240x1754 High-Res JPG with Google Chrome
    const cmd = `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --window-size=1240,1754 --screenshot="${jpgDest}" "file://${htmlFile}"`;
    try {
      execSync(cmd, { stdio: 'pipe' });
      console.log(`✅ [SAYFA ${page.num}/10] Görseli başarıyla üretildi: images/biz-kimiz/page-${page.num}.jpg (${(fs.statSync(jpgDest).size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`❌ [SAYFA ${page.num}] render hatası:`, e.message);
    }
  }

  // 2. Generate Master 10-Page Combined Document for PDF Print
  const masterHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Belgin Saat Kurumsal Profil 2026</title>
  <style>
    ${STYLES}
    @page {
      size: A4 portrait;
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
  console.log('👑 KURUMSAL PROFİL FOLİOSU VE 10 SAYFA GÖRSELİ TAMAMLANDI!');
  console.log('=============================================================');
}

buildFolio().catch(console.error);
