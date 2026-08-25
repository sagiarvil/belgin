// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE SPA ROUTER
// ==========================================================

const PAGE_TITLES = {
  home: "Belgin Kuyumculuk | Lüks Mücevher, Pırlanta & Saat",
  jewellery: "Mücevher Koleksiyonu | Belgin Kuyumculuk",
  watches: "Lüks Saatler & Yüksek Saatçilik | Belgin Kuyumculuk",
  collections: "Özel Koleksiyonlar & Haute Joaillerie | Belgin Kuyumculuk",
  product: "Ürün Detayı | Belgin Kuyumculuk",
  cart: "Mücevher Kasası & Sepetim | Belgin Kuyumculuk",
  checkout: "Güvenli Ödeme (PayTR) | Belgin Kuyumculuk",
  wishlist: "İstek Listem & Favoriler | Belgin Kuyumculuk",
  account: "VIP Müşteri Hesabı | Belgin Kuyumculuk",
  contact: "İletişim & Nişantaşı Mağazamız | Belgin Kuyumculuk",
  certificate: "Sertifika Doğrulama | Belgin Kuyumculuk",
  'payment-success': "Sipariş Onayı | Belgin Kuyumculuk",
  'payment-failed': "Ödeme Bildirimi | Belgin Kuyumculuk"
};

const Router = {
  currentPage: 'home',

  init() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-page]');
      if (link) {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        const filterVal = link.getAttribute('data-filter');
        this.navigate(page, true, { filter: filterVal });
      }
    });

    window.addEventListener('popstate', () => {
      const page = location.hash.replace('#', '') || 'home';
      this.navigate(page, false);
    });
  },

  navigate(page, pushState = true, options = {}) {
    if (!page) page = 'home';
    this.currentPage = page;

    // 1. Sayfa Görünürlüğü
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
    } else {
      const fallback = document.getElementById('page-home');
      if (fallback) fallback.classList.add('active');
      page = 'home';
    }

    // 2. Navigasyon Aktif Linkleri
    document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => a.classList.remove('active'));
    const navLinks = document.querySelectorAll(`[data-page="${page}"]`);
    navLinks.forEach(a => a.classList.add('active'));

    // 3. Menü & Dropdown Kapatma
    document.getElementById('navMobile')?.classList.remove('open');
    document.getElementById('cartDropdown')?.classList.remove('show');
    document.getElementById('searchOverlay')?.classList.remove('open');

    // 4. Sayfa Başlığı Güncelleme
    document.title = PAGE_TITLES[page] || PAGE_TITLES.home;

    // 5. Başa Kaydırma
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 6. History State
    if (pushState) {
      history.pushState(null, '', '#' + page);
    }

    // 7. Uygulama Yaşam Döngüsü
    if (typeof App !== 'undefined' && App.onPageChange) {
      App.onPageChange(page, options);
    }
  }
};
