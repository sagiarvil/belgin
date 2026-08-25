// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE SPA ROUTER
// ==========================================================

const PAGE_TITLES = {
  'ana-sayfa': "Belgin Kuyumculuk | Lüks Mücevher, Pırlanta & Saat",
  'mucevherat': "Mücevher Koleksiyonu | Belgin Kuyumculuk",
  'saatler': "Lüks Saatler & Yüksek Saatçilik | Belgin Kuyumculuk",
  'ikinci-el': "Ekspertizli İkinci El & Altın | Belgin Kuyumculuk",
  'hikayemiz': "Hikayemiz & Tarihçe | Belgin Kuyumculuk",
  'koleksiyonlar': "Özel Koleksiyonlar & Haute Joaillerie | Belgin Kuyumculuk",
  'urun': "Ürün Detayı | Belgin Kuyumculuk",
  'sepet': "Mücevher Kasası & Sepetim | Belgin Kuyumculuk",
  'odeme': "Güvenli Ödeme (PayTR) | Belgin Kuyumculuk",
  'favoriler': "İstek Listem & Favoriler | Belgin Kuyumculuk",
  'hesabim': "VIP Müşteri Hesabı | Belgin Kuyumculuk",
  'iletisim': "İletişim & Nişantaşı Mağazamız | Belgin Kuyumculuk",
  'sertifika': "Sertifika Doğrulama | Belgin Kuyumculuk",
  'basarili-odeme': "Sipariş Onayı | Belgin Kuyumculuk",
  'basarisiz-odeme': "Ödeme Bildirimi | Belgin Kuyumculuk"
};

const Router = {
  currentPage: 'ana-sayfa',

  init() {
    document.addEventListener('click', (e) => {
      // Prevent default jump for any href="#" links
      const hrefHash = e.target.closest('a[href="#"]');
      if (hrefHash && !hrefHash.getAttribute('data-page')) {
        e.preventDefault();
      }
      
      const link = e.target.closest('[data-page]');
      if (link) {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        const filterVal = link.getAttribute('data-filter');
        this.navigate(page, true, { filter: filterVal });
      }
    });

    window.addEventListener('popstate', () => {
      const page = location.hash.replace('#', '') || 'ana-sayfa';
      this.navigate(page, false);
    });
  },

  navigate(page, pushState = true, options = {}) {
    if (!page) page = 'ana-sayfa';

    if (typeof App !== 'undefined' && App.closeNavDropdowns) {
      App.closeNavDropdowns();
    }

    if (page.startsWith('urun-') || page.startsWith('product-')) {
      const id = parseInt(page.replace('urun-', '').replace('product-', ''));
      if (typeof App !== 'undefined' && App.openProduct) {
        this.navigate('urun', pushState);
        App.openProduct(id);
        if (pushState) {
          history.replaceState(null, '', '#urun-' + id);
        }
        return;
      }
    }
    
    // Geçici uyumluluk (Eski İngilizce data-page çağrılarını otomatik Türkçeye çevir)
    const pageMapping = {
      'home': 'ana-sayfa',
      'watches': 'saatler',
      'jewellery': 'mucevherat',
      'preowned': 'ikinci-el',
      'story': 'hikayemiz',
      'cart': 'sepet',
      'checkout': 'odeme',
      'wishlist': 'favoriler',
      'account': 'hesabim',
      'contact': 'iletisim',
      'certificate': 'sertifika',
      'payment-success': 'basarili-odeme',
      'payment-failed': 'basarisiz-odeme'
    };
    if (pageMapping[page]) {
      page = pageMapping[page];
    }

    this.currentPage = page;

    // 1. Sayfa Görünürlüğü
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    let target = document.getElementById('page-' + page);
    if (!target && page === 'iletisim') {
      target = document.getElementById('page-contact');
    }
    if (target) {
      target.classList.add('active');
    } else {
      const fallback = document.getElementById('page-ana-sayfa');
      if (fallback) fallback.classList.add('active');
      page = 'ana-sayfa';
    }

    // 2. Navigasyon Aktif Linkleri
    document.querySelectorAll('.nav-links a, .nav-desktop a, .mobile-drawer-nav a').forEach(a => a.classList.remove('active'));
    const navLinks = document.querySelectorAll(`[data-page="${page}"]`);
    navLinks.forEach(a => a.classList.add('active'));

    // 3. Menü & Dropdown Kapatma
    document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
    document.getElementById('cartDropdown')?.classList.remove('show');
    document.getElementById('searchOverlay')?.classList.remove('open');

    // 4. Sayfa Başlığı & Gelişmiş Meta ve Şema Güncelleme
    if (typeof SeoManager !== 'undefined') {
      SeoManager.update(page, options);
    } else {
      document.title = PAGE_TITLES[page] || PAGE_TITLES['ana-sayfa'];
    }

    // 5. Uygulama Yaşam Döngüsü
    if (typeof App !== 'undefined' && App.onPageChange) {
      App.onPageChange(page, options);
    }

    // 6. İlgili Sayfa / Ürün Başına Akıllı Kaydırma (Smart Smooth Scroll)
    if ((page === 'ana-sayfa' && !options.filter) || page === 'urun') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const pageEl = document.getElementById('page-' + page) || target;
        if (pageEl) {
          const targetSection = pageEl.querySelector('.products-grid-4') || pageEl.querySelector('.section-header-flex') || pageEl;
          Router.scrollToTarget(targetSection);
        }
      }, 80);
    }

    // 7. History State
    if (pushState) {
      history.pushState(null, '', '#' + page);
    }
  },

  scrollToTarget(el) {
    if (!el) return;
    setTimeout(() => {
      const header = document.querySelector('.header');
      const ticker = document.querySelector('.gold-ticker-strip');
      const headerHeight = (header ? header.offsetHeight : 64) + (ticker ? ticker.offsetHeight : 32) + 16;
      
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: Math.max(0, Math.round(offsetPosition)),
        behavior: 'smooth'
      });
    }, 40);
  }
};
