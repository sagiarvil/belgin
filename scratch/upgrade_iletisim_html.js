const fs = require('fs');

let iletisimHtml = fs.readFileSync('iletisim.html', 'utf8');

const mainStart = iletisimHtml.indexOf('<!-- 3. MAIN İLETİŞİM İÇERİĞİ -->');
const mainEnd = iletisimHtml.indexOf('<!-- 4. FOOTER (KURUMSAL FOOTER MİMARİSİ) -->');

const premiumMain = `<!-- 3. MAIN İLETİŞİM İÇERİĞİ -->
<main class="container-art section-art" style="max-width:1240px; margin:0 auto; padding:40px 20px 80px;">
  
  <!-- HERO HEADER -->
  <div style="text-align:center; max-width:820px; margin:0 auto 48px;">
    <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(194,167,104,0.12); border:1px solid rgba(194,167,104,0.35); padding:6px 18px; border-radius:30px; margin-bottom:16px;">
      <span style="font-size:14px;">🏛️</span>
      <span style="font-size:11.5px; letter-spacing:2.5px; text-transform:uppercase; font-weight:800; color:#5D4411;">EST. 1999 • 25 YILLIK KÖKLÜ İZMİR MİRASI</span>
    </div>
    <h1 style="font-family:var(--font-serif); font-size:42px; font-weight:700; color:var(--color-ink); margin-bottom:16px; line-height:1.25;">
      İzmir Buca Showroom & VIP Özel Ağırlama Salonu
    </h1>
    <p style="font-size:15.5px; color:#555; line-height:1.8;">
      25 yıldır Menderes Caddesi'ndeki değişmeyen adresimizde, lüks saatler, masif altın ve sertifikalı mücevher koleksiyonlarımızı özel VIP salonumuzda kahve ikramı eşliğinde güvenle inceleyebilirsiniz.
    </p>
  </div>

  <!-- 4'LÜ HIZLI İLETİŞİM & DANIŞMA KARTLARI -->
  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; margin-bottom:48px;">
    
    <!-- Kart 1: Showroom Adresi -->
    <div class="contact-feature-card">
      <div class="contact-feature-icon-wrap" style="background:#FAF6EE; color:#8C6D23;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <span class="contact-feature-badge">Fiziksel Showroom</span>
      <h3 class="contact-feature-title">Merkez Mağazamız</h3>
      <p class="contact-feature-desc">Menderes Caddesi No:231/B Buca / İzmir</p>
      <span class="contact-feature-sub">Şirinyer / Çarşı Meydanı Mevkii</span>
      <a class="contact-feature-link" href="https://maps.google.com/?q=Menderes+Caddesi+No+231/B+Buca+Izmir" target="_blank" rel="noopener">
        Google Haritalar'da Aç →
      </a>
    </div>

    <!-- Kart 2: VIP Canlı WhatsApp Danışmanı -->
    <div class="contact-feature-card" style="border-color:rgba(37,211,102,0.35); background:linear-gradient(180deg, #FFFFFF 0%, #F6FCF8 100%);">
      <div class="contact-feature-icon-wrap" style="background:#E8F8EE; color:#25D366;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
      </div>
      <span class="contact-feature-badge" style="background:#E8F8EE; color:#1F6B38; border-color:rgba(37,211,102,0.3);">7/24 Kesintisiz</span>
      <h3 class="contact-feature-title">VIP WhatsApp Danışma</h3>
      <p class="contact-feature-desc"><a href="https://wa.me/905419305372" target="_blank" rel="noopener" style="color:inherit; font-weight:700; text-decoration:none;">+90 541 930 53 72</a></p>
      <span class="contact-feature-sub">Anlık Ekspertiz, Takas & Fiyat Bilgisi</span>
      <a class="contact-feature-link" href="https://wa.me/905419305372?text=Merhaba,%20Showroom%20randevusu%20ve%20urunler%20hakkinda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener" style="color:#1F6B38;">
        WhatsApp'tan Mesaj Yazın →
      </a>
    </div>

    <!-- Kart 3: Telefon & Showroom Santral -->
    <div class="contact-feature-card">
      <div class="contact-feature-icon-wrap" style="background:var(--color-teal-soft); color:var(--color-teal);">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </div>
      <span class="contact-feature-badge">Müşteri Temsilcisi</span>
      <h3 class="contact-feature-title">Showroom & Santral</h3>
      <p class="contact-feature-desc"><a href="tel:+905398234141" style="color:inherit; font-weight:700; text-decoration:none;">+90 539 823 41 41</a></p>
      <span class="contact-feature-sub">Pazartesi – Cumartesi: 09:00 – 19:00</span>
      <a class="contact-feature-link" href="tel:+905398234141">
        Hemen Arayın →
      </a>
    </div>

    <!-- Kart 4: Kurumsal E-Posta -->
    <div class="contact-feature-card">
      <div class="contact-feature-icon-wrap" style="background:#F0F4F8; color:#1D4ED8;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      </div>
      <span class="contact-feature-badge">Resmi Yazışma</span>
      <h3 class="contact-feature-title">Kurumsal E-Posta</h3>
      <p class="contact-feature-desc"><a href="mailto:destek@belginkuyumculuk.com" style="color:inherit; font-weight:700; text-decoration:none; font-size:13.5px;">destek@belginkuyumculuk.com</a></p>
      <span class="contact-feature-sub">Muhasebe, Güvenlik & Destek</span>
      <a class="contact-feature-link" href="mailto:destek@belginkuyumculuk.com">
        E-Posta Gönderin →
      </a>
    </div>

  </div>

  <!-- ANA İKİLİ IZGARA: SOL FORM & SAĞ HARİTA/BİLGİLER -->
  <div class="contact-grid-wrapper" style="margin:0 0 60px;">
    
    <!-- SOL: VIP RANDEVU FORMU -->
    <div class="contact-form-card" style="padding:40px; border-radius:12px; border:1px solid rgba(194,167,104,0.3); background:#FFFFFF; box-shadow:0 10px 30px rgba(0,0,0,0.04);">
      <div style="margin-bottom:24px;">
        <span style="font-size:11px; letter-spacing:2px; text-transform:uppercase; font-weight:700; color:var(--color-teal); display:block; margin-bottom:4px;">Özel Ağırlama Talebi</span>
        <h2 style="font-family:var(--font-serif); font-size:28px; font-weight:700; color:var(--color-ink); margin-bottom:8px;">VIP Randevu & Danışmanlık</h2>
        <p style="font-size:13.5px; color:#666; line-height:1.6;">
          Özel VIP odamızda modelleri yakından incelemek veya takas/ekspertiz görüşmesi yapmak için randevunuzu oluşturun.
        </p>
      </div>

      <form onsubmit="event.preventDefault(); alert('Randevu talebiniz başarıyla alındı! VIP müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.'); this.reset();">
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
          <div>
            <label style="font-size:12.5px; font-weight:700; color:var(--color-ink); display:block; margin-bottom:6px;">Adınız Soyadınız *</label>
            <input type="text" required placeholder="Adınız Soyadınız" style="width:100%; padding:12px 14px; border:1px solid #D5D1C8; border-radius:6px; font-size:13.5px; outline:none; transition:border-color 0.2s;">
          </div>
          <div>
            <label style="font-size:12.5px; font-weight:700; color:var(--color-ink); display:block; margin-bottom:6px;">Telefon Numaranız *</label>
            <input type="tel" required placeholder="05XX XXX XX XX" style="width:100%; padding:12px 14px; border:1px solid #D5D1C8; border-radius:6px; font-size:13.5px; outline:none; transition:border-color 0.2s;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
          <div>
            <label style="font-size:12.5px; font-weight:700; color:var(--color-ink); display:block; margin-bottom:6px;">E-Posta Adresiniz</label>
            <input type="email" placeholder="ornek@alanadi.com" style="width:100%; padding:12px 14px; border:1px solid #D5D1C8; border-radius:6px; font-size:13.5px; outline:none;">
          </div>
          <div>
            <label style="font-size:12.5px; font-weight:700; color:var(--color-ink); display:block; margin-bottom:6px;">İlgi Alanınız / Hizmet *</label>
            <select style="width:100%; padding:12px 14px; border:1px solid #D5D1C8; border-radius:6px; font-size:13.5px; outline:none; background:#FFF;">
              <option>Lüks Saat Koleksiyonu İnceleme</option>
              <option>Masif Altın / Külçe & Sarrafiye Alımı</option>
              <option>Özel Tasarım Mücevher & Pırlanta</option>
              <option>Ürün Bazında Kontrol & Değerleme Talebi</option>
              <option>Showroom Sipariş Teslimatı</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:12.5px; font-weight:700; color:var(--color-ink); display:block; margin-bottom:6px;">Tercih Edilen Randevu Tarihi ve Saati</label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <input type="date" style="width:100%; padding:12px 14px; border:1px solid #D5D1C8; border-radius:6px; font-size:13.5px; outline:none;">
            <select style="width:100%; padding:12px 14px; border:1px solid #D5D1C8; border-radius:6px; font-size:13.5px; outline:none; background:#FFF;">
              <option>10:00 – 12:00 (Öğleden Önce)</option>
              <option>13:00 – 16:00 (Öğleden Sonra)</option>
              <option>16:00 – 18:30 (Akşamüstü)</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom:20px;">
          <label style="font-size:12.5px; font-weight:700; color:var(--color-ink); display:block; margin-bottom:6px;">Özel Notunuz veya İncelemek İstediğiniz Model</label>
          <textarea rows="3" placeholder="Görmek istediğiniz referans kodu veya özel taleplerinizi iletebilirsiniz..." style="width:100%; padding:12px 14px; border:1px solid #D5D1C8; border-radius:6px; font-size:13.5px; outline:none; line-height:1.5; resize:vertical;"></textarea>
        </div>

        <button type="submit" class="btn-art-buy" style="width:100%; padding:16px; font-size:15px; font-weight:700; border-radius:6px; background:var(--color-teal); color:#FFF; cursor:pointer; border:none; transition:all 0.25s;">
          VIP Randevuyu Onayla & Gönder
        </button>
        <span style="display:block; text-align:center; font-size:11.5px; color:#888; margin-top:10px;">
          🔒 Kişisel verileriniz KVKK standartlarında korunmakta olup 15 dakika içinde geri dönüş sağlanır.
        </span>
      </form>
    </div>

    <!-- SAĞ: HARİTA & SHOWROOM DETAYLARI -->
    <div style="display:flex; flex-direction:column; gap:24px;">
      
      <!-- Google Maps Embed -->
      <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.04);">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3126.8926941617467!2d27.1685324!3d38.3842187!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14bbd8b74c5d57b5%3A0x6b5c3e03d4a4d6f0!2sMenderes%20Cd.%20No%3A231%2C%20Buca%2F%C4%B0zmir!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str" 
          width="100%" 
          height="280" 
          style="border:0; display:block;" 
          allowfullscreen="" 
          loading="lazy" 
          referrerpolicy="no-referrer-when-downgrade"
          title="Belgin Kuyumculuk Showroom Konumu">
        </iframe>
        
        <div style="padding:20px 24px; background:#FAF9F6; border-top:1px solid #EAE6DF;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <strong style="font-size:14px; color:var(--color-ink); display:block;">Showroom Konum Bilgisi</strong>
              <span style="font-size:12.5px; color:#666;">Buca Çarşı / Şirinyer Ana Girişi</span>
            </div>
            <a href="https://maps.google.com/?q=Menderes+Caddesi+No+231/B+Buca+Izmir" target="_blank" rel="noopener" style="font-size:13px; font-weight:700; color:var(--color-teal); text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
              Google Maps'te Yol Tarifi Al →
            </a>
          </div>
        </div>
      </div>

      <!-- Ulaşım ve Konfor Bilgileri -->
      <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:12px; padding:28px; box-shadow:0 10px 30px rgba(0,0,0,0.04);">
        <h3 style="font-family:var(--font-serif); font-size:20px; font-weight:700; color:var(--color-ink); margin-bottom:16px;">
          Showroom Ulaşım & Ağırlama İmkanları
        </h3>
        
        <div style="display:flex; flex-direction:column; gap:14px;">
          <div style="display:flex; gap:12px; align-items:flex-start;">
            <span style="font-size:18px;">🚗</span>
            <div>
              <strong style="font-size:13px; color:var(--color-ink); display:block;">Özel Müşteri Otoparkı & Vale</strong>
              <span style="font-size:12.5px; color:#666;">Mağazamızın önünde VIP randevulu misafirlerimiz için ayrılmış özel otopark alanı mevcuttur.</span>
            </div>
          </div>

          <div style="display:flex; gap:12px; align-items:flex-start;">
            <span style="font-size:18px;">✈️</span>
            <div>
              <strong style="font-size:13px; color:var(--color-ink); display:block;">Havalimanı & Otoyol Yakınlığı</strong>
              <span style="font-size:12.5px; color:#666;">İzmir Adnan Menderes Havalimanı'na 15 dakika, Çevre Yolu Buca çıkışına 3 dakika mesafededir.</span>
            </div>
          </div>

          <div style="display:flex; gap:12px; align-items:flex-start;">
            <span style="font-size:18px;">☕</span>
            <div>
              <strong style="font-size:13px; color:var(--color-ink); display:block;">Özel VIP Lounge & İkram</strong>
              <span style="font-size:12.5px; color:#666;">Görüşmeleriniz tamamen izole, güvenlikli VIP odamızda ikramlar eşliğinde gerçekleşir.</span>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>

  <!-- 4'LÜ KURUMSAL GÜVENCE ŞERİDİ -->
  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; background:#FAF8F5; border:1px solid rgba(194,167,104,0.3); border-radius:12px; padding:24px 28px;">
    <div style="display:flex; gap:12px; align-items:center;">
      <span style="font-size:24px;">🏛️</span>
      <div>
        <strong style="font-size:13px; color:var(--color-ink); display:block;">25 Yıllık Fiziksel Mağaza</strong>
        <span style="font-size:11.5px; color:#666;">1999'dan beri aynı adreste kesintisiz güven</span>
      </div>
    </div>
    <div style="display:flex; gap:12px; align-items:center;">
      <span style="font-size:24px;">🛡️</span>
      <div>
        <strong style="font-size:13px; color:var(--color-ink); display:block;">12.000 TL+ Güvenli Teslimat</strong>
        <span style="font-size:11.5px; color:#666;">Yasal kimlik ve ıslak imza ile bizzat teslim</span>
      </div>
    </div>
    <div style="display:flex; gap:12px; align-items:center;">
      <span style="font-size:24px;">💳</span>
      <div>
        <strong style="font-size:13px; color:var(--color-ink); display:block;">BDDK Lisanslı 3D Secure</strong>
        <span style="font-size:11.5px; color:#666;">PayTR 256-Bit SSL korumalı tahsilat</span>
      </div>
    </div>
    <div style="display:flex; gap:12px; align-items:center;">
      <span style="font-size:24px;">⚖️</span>
      <div>
        <strong style="font-size:13px; color:var(--color-ink); display:block;">Oda Tescilli & MASAK Uyumlu</strong>
        <span style="font-size:11.5px; color:#666;">İzmir Kuyumcular Odası faal tescili</span>
      </div>
    </div>
  </div>

</main>\n\n`;

iletisimHtml = iletisimHtml.slice(0, mainStart) + premiumMain + iletisimHtml.slice(mainEnd);
fs.writeFileSync('iletisim.html', iletisimHtml, 'utf8');
console.log('iletisim.html updated to ultra-premium design.');
