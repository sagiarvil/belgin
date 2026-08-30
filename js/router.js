// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE SPA & PATH ROUTER
// ==========================================================

const PAGE_TITLES = {
  'ana-sayfa': "Belgin Kuyumculuk | Lüks Mücevher, Pırlanta & Saat",
  'mucevherat': "Mücevher Koleksiyonu | Belgin Kuyumculuk",
  'saatler': "Lüks Saatler & Yüksek Saatçilik | Belgin Kuyumculuk",
  'seckin-urunler': "Seçkin Ürünler & Altın | Belgin Kuyumculuk",
  'ikinci-el': "Seçkin Ürünler & Altın | Belgin Kuyumculuk",
  'hikayemiz': "Hikayemiz & Tarihçe | Belgin Kuyumculuk",
  'koleksiyonlar': "Özel Koleksiyonlar & Haute Joaillerie | Belgin Kuyumculuk",
  'urun': "Ürün Detayı | Belgin Kuyumculuk",
  'sepet': "Mücevher Kasası & Sepetim | Belgin Kuyumculuk",
  'odeme': "Güvenli Ödeme | Belgin Kuyumculuk",
  'favoriler': "İstek Listem & Favoriler | Belgin Kuyumculuk",
  'hesabim': "VIP Müşteri Hesabı | Belgin Kuyumculuk",
  'iletisim': "İletişim & Buca Showroom Mağazamız | Belgin Kuyumculuk",
  'canli-fiyatlar': "Canlı Altın & Piyasa Fiyatları | Belgin Kuyumculuk",
  'sertifika': "Sertifika Doğrulama | Belgin Kuyumculuk",
  'basarili-odeme': "Sipariş Onayı | Belgin Kuyumculuk",
  'basarisiz-odeme': "Ödeme Bildirimi | Belgin Kuyumculuk"
};

const Router = {
  currentPage: 'ana-sayfa',

  resolveLocation() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/') return { page: 'ana-sayfa' };
    if (path === '/canli-fiyatlar' || path === '/canlipiyasalar') return { page: 'canli-fiyatlar' };
    if (path === '/saatler') return { page: 'saatler' };
    if (path === '/mucevherat') return { page: 'mucevherat' };
    if (path === '/seckin-urunler' || path === '/ikinci-el') return { page: 'seckin-urunler' };
    if (path === '/sepet' || path === '/cart') return { page: 'sepet' };
    if (path === '/odeme' || path === '/checkout') return { page: 'odeme' };
    if (path.startsWith('/urun/')) {
      const match = Object.entries(window.SEO_ROUTE_MAP || {}).find(([,route]) => route.replace(/\/+$/, '') === path);
      if (match) return { page: 'urun', productId: Number(match[0]) };
    }
    return { page: 'ana-sayfa' };
  },

  routeForPage(page) {
    return (window.SEO_CATEGORY_ROUTES || {})[page] || (page === 'ana-sayfa' ? '/' : `/${page}/`);
  },

  routeForProduct(id) {
    return (window.SEO_ROUTE_MAP || {})[String(id)] || null;
  },

  migrateLegacyHash() {
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return null;
    if (hash === 'canli-fiyatlar' || hash === 'canlipiyasalar') return { page: 'canli-fiyatlar' };
    if (hash === 'odeme' || hash === 'checkout') return { page: 'odeme' };
    if (hash === 'sepet' || hash === 'cart') return { page: 'sepet' };
    const m = hash.match(/^(?:urun|product)-(\d+)$/);
    if (m) {
      const id = Number(m[1]);
      const route = this.routeForProduct(id);
      if (route) {
        history.replaceState({page:'urun', productId:id}, '', route);
        return {page:'urun', productId:id};
      }
    }
    const old = {
      'canli-fiyatlar': '/canli-fiyatlar/',
      'canlipiyasalar': '/canli-fiyatlar/',
      'saatler': '/saatler/',
      'watches': '/saatler/',
      'mucevherat': '/mucevherat/',
      'jewellery': '/mucevherat/',
      'seckin-urunler': '/seckin-urunler/',
      'ikinci-el': '/seckin-urunler/',
      'preowned': '/seckin-urunler/',
      'odeme': '#odeme',
      'sepet': '#sepet'
    };
    if (old[hash]) {
      history.replaceState({page:hash}, '', old[hash]);
      return {page:hash};
    }
    return null;
  },

  init() {
    document.addEventListener('click', (e) => {
      // 1. Ürün kartı linkleri (data-product-id)
      const productLink = e.target.closest('a[data-product-id]');
      if (productLink) {
        e.preventDefault();
        const id = Number(productLink.dataset.productId);
        const route = this.routeForProduct(id);
        this.navigate('urun', false);
        if (typeof App !== 'undefined' && App.openProduct) {
          App.openProduct(id, { skipHistory: true });
        }
        if (route) history.pushState({ page: 'urun', productId: id }, '', route);
        return;
      }

      // 2. data-page navigasyon linkleri
      const link = e.target.closest('[data-page]');
      if (link) {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        const filterVal = link.getAttribute('data-filter');
        this.navigate(page, true, { filter: filterVal });
        return;
      }

      // 3. Prevent default jump for href="#"
      const hrefHash = e.target.closest('a[href="#"]');
      if (hrefHash && !hrefHash.getAttribute('data-page') && !hrefHash.getAttribute('onclick')) {
        e.preventDefault();
      }
    });

    window.addEventListener('popstate', () => {
      const state = this.resolveLocation();
      if (state.page === 'urun' && state.productId) {
        this.navigate('urun', false);
        if (typeof App !== 'undefined' && App.openProduct) {
          App.openProduct(state.productId, { skipHistory: true });
        }
        return;
      }
      this.navigate(state.page, false);
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
        this.navigate('urun', false);
        App.openProduct(id, { skipHistory: !pushState });
        return;
      }
    }
    
    // Geçici uyumluluk (Eski İngilizce data-page çağrılarını otomatik Türkçeye çevir)
    const pageMapping = {
      'home': 'ana-sayfa',
      'watches': 'saatler',
      'jewellery': 'mucevherat',
      'preowned': 'seckin-urunler',
      'ikinci-el': 'seckin-urunler',
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
    document.body.classList.toggle('page-canli-fiyatlar', page === 'canli-fiyatlar');
    document.body.classList.toggle('page-is-canli-fiyatlar', page === 'canli-fiyatlar');

    // 1. Sayfa Görünürlüğü
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    let target = document.getElementById('page-' + page);
    if (!target && page === 'seckin-urunler') {
      target = document.getElementById('page-ikinci-el') || document.getElementById('page-seckin-urunler');
    }
    if (!target && page === 'iletisim') {
      target = document.getElementById('page-contact');
    }
    if (target) {
      target.classList.add('active');
    } else {
      const fallback = document.getElementById('page-ana-sayfa');
      if (fallback) {
        fallback.classList.add('active');
        page = 'ana-sayfa';
      } else {
        // Hedef sayfa bu HTML şablonunda yer almıyor (Örn: canli-fiyatlar sayfasındayken logoya tıklandı)
        const targetUrl = this.routeForPage(page);
        window.location.href = targetUrl;
        return;
      }
    }

    // 2. Navigasyon Aktif Linkleri
    document.querySelectorAll('.nav-links a, .nav-desktop a, .mobile-drawer-nav a, .mobile-bottom-dock a').forEach(a => a.classList.remove('active'));
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
    if (pushState && page !== 'urun') {
      const categoryRoute = (window.SEO_CATEGORY_ROUTES || {})[page];
      if (categoryRoute) {
        history.pushState({ page }, '', categoryRoute);
      } else if (page === 'ana-sayfa') {
        history.pushState({ page }, '', '/');
      } else {
        history.pushState({ page }, '', '#' + page);
      }
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
