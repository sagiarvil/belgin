// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE SPA & PATH ROUTER
// ==========================================================

const PAGE_TITLES = {
  'ana-sayfa': "Belgin Saat | Lüks Saat & Prestij Koleksiyonu",
  'elit-kategori': "Elit Kategori — Lüks Saat Evleri (Haute Horlogerie) | Belgin Saat",
  'elit-saatler': "Elit Kategori — Lüks Saat Evleri (Haute Horlogerie) | Belgin Saat",
  'markalar': "Saat Markaları Dizini — Tüm Markalar | Belgin Saat",
  'biz-kimiz': "Biz Kimiz — Kurumsal Profil & Ticaret Hafızası | Belgin Saat",
  'magazin': "Belgin Saat Magazin — Saat Dünyası & Piyasa Analizleri | Belgin Saat",
  'mucevherat': "Koleksiyon | Belgin Saat",
  'saatler': "Lüks Saatler & Yüksek Saatçilik | Belgin Saat",
  'hikayemiz': "Hikayemiz & Mirasımız | Belgin Saat",
  'koleksiyonlar': "Özel Saat Koleksiyonları | Belgin Saat",
  'urun': "Ürün Detayı | Belgin Saat",
  'sepet': "Alışveriş Sepetim | Belgin Saat",
  'odeme': "Güvenli Ödeme | Belgin Saat",
  'favoriler': "İstek Listem & Favoriler | Belgin Saat",
  'hesabim': "VIP Müşteri Hesabı | Belgin Saat",
  'iletisim': "İletişim & Buca Showroom | Belgin Saat",
  'canli-fiyatlar': "Piyasa Bilgileri | Belgin Saat",
  'sertifika': "Sertifika Doğrulama | Belgin Saat",
  'basarili-odeme': "Sipariş Onayı | Belgin Saat",
  'basarisiz-odeme': "Ödeme Bildirimi | Belgin Saat"
};

const Router = {
  currentPage: 'ana-sayfa',

  // Mücevherat ve Canlı Fiyatlar daha önce HTML'de korunup yalnızca görünürlük
  // katmanında kapatılmıştı. Route yeniden aktif edildiğinde mevcut markup'ı
  // değiştirmeden desktop/mobile navigasyonu ve ilgili SPA sayfalarını açar.
  activateCommerceNavigation() {
    const show = (el) => {
      if (el && el.style) el.style.removeProperty('display');
    };

    document.querySelectorAll('.nav-desktop [data-page="mucevherat"], .nav-desktop [data-page="canli-fiyatlar"]').forEach((link) => {
      show(link.closest('li'));
    });

    document.querySelectorAll('.mobile-drawer-nav [data-page="canli-fiyatlar"], .mobile-bottom-dock [data-page="mucevherat"]').forEach(show);

    document.querySelectorAll('.mobile-drawer-nav [data-page="mucevherat"]').forEach((link) => {
      let node = link.parentElement;
      while (node && !node.classList.contains('mobile-drawer-nav')) {
        if (node.style && node.style.getPropertyValue('display') === 'none') {
          show(node);
          break;
        }
        node = node.parentElement;
      }
    });

    ['page-mucevherat', 'page-canli-fiyatlar'].forEach((id) => {
      show(document.getElementById(id));
    });
  },

  resolveLocation() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/' || path === '/index.html' || path === '/index.php') return { page: 'ana-sayfa' };
    if (path === '/elit-kategori' || path === '/elit-saatler') {
      const brand = new URLSearchParams(location.search).get('marka');
      return { page: 'elit-kategori', filter: brand || 'all' };
    }
    if (path === '/markalar' || path === '/saat-markalari') return { page: 'markalar' };
    if (path === '/biz-kimiz' || path === '/kurumsal-profil' || path === '/hakkimizda') return { page: 'biz-kimiz' };
    if (path === '/magazin' || path === '/magazine' || path === '/saat-magazin') {
      const cat = new URLSearchParams(location.search).get('kategori') || new URLSearchParams(location.search).get('category') || new URLSearchParams(location.search).get('filter');
      return { page: 'magazin', filter: cat || 'all' };
    }
    if (path === '/canli-fiyatlar' || path === '/canlipiyasalar') return { page: 'canli-fiyatlar' };
    if (path === '/mucevherat') return { page: 'mucevherat' };
    if (path === '/saatler') {
      const brand = new URLSearchParams(location.search).get('marka');
      return { page: 'saatler', filter: brand || 'all' };
    }
    if (path === '/seckin-urunler' || path === '/ikinci-el') return { page: 'elit-kategori', filter: 'all' };
    if (path === '/sepet' || path === '/cart') return { page: 'sepet' };
    if (path === '/odeme' || path === '/checkout') return { page: 'odeme' };
    if (path.startsWith('/urun/')) {
      const match = Object.entries(window.SEO_ROUTE_MAP || {}).find(([,route]) => route.replace(/\/+$/, '') === path);
      if (match) {
        const rawId = match[0];
        const numId = parseInt(rawId, 10);
        const productId = (!isNaN(numId) && String(numId) === rawId) ? numId : rawId;
        return { page: 'urun', productId };
      }
      const idMatch = path.match(/-(\d+)\/?$/);
      if (idMatch) return { page: 'urun', productId: Number(idMatch[1]) };
      const slugMatch = path.replace(/^\/urun\//, '').replace(/\/$/, '');
      if (slugMatch) return { page: 'urun', productId: slugMatch };
    }
    return { page: 'ana-sayfa' };
  },

  routeForPage(page) {
    if (page === 'canli-fiyatlar') return '/canli-fiyatlar/';
    if (page === 'mucevherat') return '/mucevherat/';
    return (window.SEO_CATEGORY_ROUTES || {})[page] || (page === 'ana-sayfa' ? '/' : `/${page}/`);
  },

  routeForProduct(id) {
    return (window.SEO_ROUTE_MAP || {})[String(id)] || null;
  },

  migrateLegacyHash() {
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return null;
    if (hash === 'ana-sayfa' || hash === 'home') {
      history.replaceState({page:'ana-sayfa'}, '', '/');
      return { page: 'ana-sayfa' };
    }
    if (hash === 'canli-fiyatlar' || hash === 'canlipiyasalar') {
      window.location.replace('/canli-fiyatlar/');
      return { page: 'canli-fiyatlar' };
    }
    if (hash === 'mucevherat' || hash === 'jewellery') {
      window.location.replace('/mucevherat/');
      return { page: 'mucevherat' };
    }
    if (hash === 'odeme' || hash === 'checkout') return { page: 'odeme' };
    if (hash === 'sepet' || hash === 'cart') return { page: 'sepet' };
    const m = hash.match(/^(?:urun|product)-(.+)$/);
    if (m) {
      const rawId = m[1];
      const numId = parseInt(rawId, 10);
      const id = (!isNaN(numId) && String(numId) === rawId) ? numId : rawId;
      const route = this.routeForProduct(id);
      if (route) {
        history.replaceState({page:'urun', productId:id}, '', route);
        return {page:'urun', productId:id};
      }
    }
    const old = {
      'ana-sayfa': '/',
      'home': '/',
      'canli-fiyatlar': '/canli-fiyatlar/',
      'canlipiyasalar': '/canli-fiyatlar/',
      'saatler': '/saatler/',
      'watches': '/saatler/',
      'mucevherat': '/mucevherat/',
      'jewellery': '/mucevherat/',
      'seckin-urunler': '/elit-kategori/',
      'ikinci-el': '/elit-kategori/',
      'preowned': '/elit-kategori/',
      'markalar': '/markalar/',
      'biz-kimiz': '/biz-kimiz/',
      'kurumsal-profil': '/biz-kimiz/',
      'magazin': '/magazin/',
      'magazine': '/magazin/',
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
    const initialHash = (location.hash || '').replace(/^#/, '');
    if (initialHash === 'canli-fiyatlar' || initialHash === 'canlipiyasalar') {
      window.location.replace('/canli-fiyatlar/');
      return;
    }
    if (initialHash === 'mucevherat' || initialHash === 'jewellery') {
      window.location.replace('/mucevherat/');
      return;
    }

    this.activateCommerceNavigation();

    window.goToHome = function(e) {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
      }
      if (typeof App !== 'undefined') {
        if (App.closeNavDropdowns) App.closeNavDropdowns();
        if (App.closeQuickDrawer) App.closeQuickDrawer();
        if (App.closeSearchModal) App.closeSearchModal();
        if (App.toggleMobileDrawer) App.toggleMobileDrawer(false);
      }
      document.body.style.overflow = '';
      const homePage = document.getElementById('page-ana-sayfa');
      if (homePage && typeof Router !== 'undefined' && typeof Router.navigate === 'function') {
        Router.navigate('ana-sayfa', true);
      } else {
        window.location.href = '/';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return false;
    };

    document.addEventListener('click', (e) => {
      // 1. Logo tıklaması (Doğrudan ana sayfaya güvenli yönlendirme)
      const logoLink = e.target.closest('.brand-logo-link, .logo-area-main, .footer-brand-logo-wrap, [data-page="ana-sayfa"], a[href="/"]');
      if (logoLink && (logoLink.getAttribute('href') === '/' || logoLink.getAttribute('data-page') === 'ana-sayfa' || logoLink.classList.contains('brand-logo-link') || logoLink.classList.contains('footer-brand-logo-wrap') || logoLink.classList.contains('logo-area-main'))) {
        return window.goToHome(e);
      }

      // 2. Ürün kartı linkleri (data-product-id)
      const productLink = e.target.closest('a[data-product-id]');
      if (productLink) {
        e.preventDefault();
        const rawId = productLink.dataset.productId || productLink.getAttribute('data-product-id');
        const numId = parseInt(rawId, 10);
        const id = (rawId && !isNaN(numId) && String(numId) === rawId) ? numId : rawId;
        if (id && typeof App !== 'undefined' && App.openProduct) {
          App.openProduct(id, { skipHistory: false });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 3. data-page navigasyon linkleri
      const link = e.target.closest('[data-page]');
      if (link) {
        const page = link.getAttribute('data-page');
        const filterVal = link.getAttribute('data-filter');
        if (page === 'canli-fiyatlar') {
          window.location.href = '/canli-fiyatlar/';
          return;
        }
        if (page === 'mucevherat' && (!filterVal || filterVal === 'all')) {
          window.location.href = '/mucevherat/';
          return;
        }
        if (page === 'magazin' && !document.getElementById('page-magazin')) {
          const filterParam = filterVal && filterVal !== 'all' ? `?kategori=${encodeURIComponent(filterVal)}` : '';
          window.location.href = '/magazin/' + filterParam;
          return;
        }
        e.preventDefault();
        this.navigate(page, true, { filter: filterVal });
        return;
      }

      // 4. Prevent default jump for href="#"
      const hrefHash = e.target.closest('a[href="#"]');
      if (hrefHash && !hrefHash.getAttribute('data-page') && !hrefHash.getAttribute('onclick')) {
        e.preventDefault();
      }
    });

    window.addEventListener('hashchange', () => {
      const hash = location.hash.replace(/^#/, '');
      if (hash === 'canli-fiyatlar' || hash === 'canlipiyasalar') {
        window.location.replace('/canli-fiyatlar/');
      } else if (hash === 'mucevherat' || hash === 'jewellery') {
        window.location.replace('/mucevherat/');
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
      this.navigate(state.page, false, { filter: state.filter });
    });
  },

  navigate(page, pushState = true, options = {}) {
    if (!page) page = 'ana-sayfa';
    if (page === 'canli-fiyatlar') {
      window.location.href = '/canli-fiyatlar/';
      return;
    }

    if (typeof App !== 'undefined') {
      if (App.closeNavDropdowns) App.closeNavDropdowns();
      if (App.closeQuickDrawer) App.closeQuickDrawer();
      if (App.closeSearchModal) App.closeSearchModal();
      if (App.toggleMobileDrawer) App.toggleMobileDrawer(false);
    }
    document.body.style.overflow = '';

    if (page.startsWith('urun-') || page.startsWith('product-')) {
      const rawId = page.replace('urun-', '').replace('product-', '');
      const numId = parseInt(rawId, 10);
      const id = (!isNaN(numId) && String(numId) === rawId) ? numId : rawId;
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
      'ikinci-el': 'elit-kategori',
      'seckin-urunler': 'elit-kategori',
      'story': 'biz-kimiz',
      'hikayemiz': 'biz-kimiz',
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
    if (page === 'hikayemiz') {
      page = 'biz-kimiz';
    }

    this.activateCommerceNavigation();
    this.currentPage = page;
    document.body.classList.toggle('page-canli-fiyatlar', page === 'canli-fiyatlar');
    document.body.classList.toggle('page-is-canli-fiyatlar', page === 'canli-fiyatlar');

    // 1. Sayfa Görünürlüğü
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    let target = document.getElementById('page-' + page);
    if (!target && page === 'iletisim') {
      target = document.getElementById('page-contact');
    }
    if (page === 'mucevherat' && !target) {
      const filter = options.filter && options.filter !== 'all' ? `?kategori=${encodeURIComponent(options.filter)}` : '';
      window.location.href = '/mucevherat/' + filter;
      return;
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
    document.getElementById('quickDrawerBackdrop')?.classList.remove('open');

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
    if ((page === 'ana-sayfa' && !options.filter) || page === 'urun' || page === 'canli-fiyatlar') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } else {
      setTimeout(() => {
        const pageEl = document.getElementById('page-' + page) || target;
        if (pageEl) {
          const targetSection = pageEl.querySelector('.products-grid-4') || pageEl.querySelector('.magazine-grid') || pageEl.querySelector('#magazineArticlesGrid') || pageEl.querySelector('.section-header-flex') || pageEl;
          Router.scrollToTarget(targetSection);
        }
      }, 80);
    }

    // 7. History State
    if (pushState && page !== 'urun') {
      const categoryRoute = (window.SEO_CATEGORY_ROUTES || {})[page] || (page === 'canli-fiyatlar' ? '/canli-fiyatlar/' : (page === 'mucevherat' ? '/mucevherat/' : (page === 'magazin' ? '/magazin/' : null)));
      if (categoryRoute) {
        const filter = options.filter && options.filter !== 'all' ? String(options.filter) : null;
        const route = page === 'elit-kategori' && filter
          ? `${categoryRoute}?marka=${encodeURIComponent(filter)}`
          : ((page === 'mucevherat' || page === 'magazin') && filter ? `${categoryRoute}?kategori=${encodeURIComponent(filter)}` : categoryRoute);
        history.pushState({ page, filter: filter || 'all' }, '', route);
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
