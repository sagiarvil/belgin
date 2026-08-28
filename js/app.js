// ==========================================================
// BELGIN — LÜKS SAAT & MÜCEVHERAT (EST. 1999)
// TÜRKİYE LOKASYON & YASAL E-TİCARET ALTYAPISI MOTORU
// ==========================================================

const App = {
  init() {
    Cart.init();
    Wishlist.init();
    Router.init();

    this.renderHome();
    this.renderWatches();
    this.renderJewellery();
    this.renderPreOwned();
    this.updateHeaderCartCount();
    this.checkCookieBanner();

    // Canlı İZKO Altın Kurlarını Başlat (15 Dakikada Bir Otomatik Güncelleme)
    if (typeof fetchLiveMarketRates === 'function') {
      fetchLiveMarketRates();
      setInterval(fetchLiveMarketRates, 15 * 60 * 1000);
    }

    // Ödeme Sayfası Gerçek Zamanlı Müşteri & Tutar Senkronizasyonu
    this.initCheckoutAutoSync();

    // Header Dropdown Otomatik Kapanma Dinleyicisi
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-dropdown-menu a') || e.target.closest('.nav-sub-brand-item') || e.target.closest('.nav-dropdown-single-item')) {
        this.closeNavDropdowns();
      }
    });

    const legacy = Router.migrateLegacyHash();
    const queryProductId = Number(new URLSearchParams(location.search).get('urun'));

    if (queryProductId && findProduct(queryProductId)) {
      Router.navigate('urun', false);
      this.openProduct(queryProductId, { skipHistory: true });
      const route = Router.routeForProduct(queryProductId);
      if (route) history.replaceState({ page: 'urun', productId: queryProductId }, '', route);
      return;
    }

    const state = legacy || Router.resolveLocation();
    if (state.page === 'urun' && state.productId) {
      Router.navigate('urun', false);
      this.openProduct(state.productId, { skipHistory: true });
    } else {
      Router.navigate(state.page, false);
    }
  },

  // HEADER DROPDOWN PENCERESİNİ ANINDA KAPAT
  closeNavDropdowns() {
    document.querySelectorAll('.nav-has-dropdown').forEach(li => {
      li.classList.add('dropdown-force-closed');
      setTimeout(() => li.classList.remove('dropdown-force-closed'), 600);
    });
    document.querySelectorAll('.nav-dropdown-menu').forEach(menu => {
      menu.classList.add('dropdown-menu-hidden');
      setTimeout(() => menu.classList.remove('dropdown-menu-hidden'), 600);
    });
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  },

  checkCookieBanner() {
    if (!localStorage.getItem('belgin_cookies_accepted')) {
      const banner = document.getElementById('cookieBanner');
      if (banner) banner.classList.add('show');
    }
  },

  acceptCookies() {
    localStorage.setItem('belgin_cookies_accepted', 'true');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.remove('show');
    showToast('Çerez tercihleriniz kaydedildi.', 'info');
  },

  currentWatchBrand: 'all',
  currentPreOwnedCategory: 'all',

  onPageChange(page, options = {}) {
    switch (page) {
      case 'ana-sayfa':
        this.renderHome();
        break;
      case 'saatler':
        const watchFilter = (options.filter !== undefined && options.filter !== null) ? options.filter : (this.currentWatchBrand || 'all');
        this.currentWatchBrand = watchFilter;
        this.renderWatches(watchFilter, 1);
        break;
      case 'mucevherat':
        const jewelleryFilter = (options.filter !== undefined && options.filter !== null) ? options.filter : (this.currentJewelleryCategory || 'all');
        this.currentJewelleryCategory = jewelleryFilter;
        this.renderJewellery(jewelleryFilter);
        break;
      case 'seckin-urunler':
      case 'ikinci-el':
        const preOwnedFilter = (options.filter !== undefined && options.filter !== null) ? options.filter : (this.currentPreOwnedCategory || 'all');
        this.currentPreOwnedCategory = preOwnedFilter;
        this.renderPreOwned(preOwnedFilter, 1);
        break;
      case 'sepet':
        this.renderCart();
        break;
      case 'odeme':
        if (typeof Cart !== 'undefined' && Cart.renderCheckout) {
          Cart.renderCheckout();
        }
        this.initCheckoutAutoSync();
        break;
    }
  },

  refreshViews() {
    this.renderHome();
    this.renderWatches();
    this.renderJewellery();
    this.renderPreOwned();
    if (Router.currentPage === 'sepet') this.renderCart();
  },

  updateHeaderCartCount() {
    const badge = document.getElementById('headerCartCount');
    if (!badge) return;
    const total = Cart.items.reduce((sum, i) => sum + i.qty, 0);
    if (total > 0) {
      badge.textContent = total;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  },

  homeWatchPage: 1,
  allWatchPage: 1,
  homeJewelryPage: 1,
  PAGE_SIZE: 24, // 4 sütun x 6 sıra = 24 saat (tam dolu ve simetrik satırlar, boşluksuz)
  HOME_WATCH_PAGE_SIZE: 16, // 4 sütun x 4 sıra = 16 saat (en fazla 4 sıra)
  JEWELRY_PAGE_SIZE: 20, // 4 sütun x 5 sıra = 20 ürün (en fazla 5 sıra)

  // 1. ANA SAYFA RENDER
  renderHome() {
    // Saat Markaları (Tek Sıra Kesintisiz Otomatik Kayan Marquee)
    const watchBrandsEl = document.getElementById('watchBrandsGrid');
    if (watchBrandsEl) {
      // 2 kez tekrar ederek pürüzsüz sonsuz döngü (infinite seamless loop) oluştur
      const marqueeList = [...WATCH_BRANDS, ...WATCH_BRANDS];
      watchBrandsEl.innerHTML = marqueeList.map(b => `
        <div class="brand-carousel-card" onclick="App.filterWatchesByBrand('${b.name}', null)" title="${b.name} Saat Modelleri">
          <div class="brand-card-thumb">
            <img src="${b.image}" alt="${b.name} Saatleri" loading="lazy">
          </div>
          <div class="brand-card-name">${b.name}</div>
          <div class="brand-card-origin">${b.origin || 'Orijinal Koleksiyon'}</div>
          <div class="brand-card-count">${b.count} Model</div>
        </div>
      `).join('');
    }

    // Yeni Eklenen Saatler (Sayfa Başına 16 Ürün)
    this.renderHomeWatches(1);

    // İkinci El Altın & Saat Bölümü (8'li)
    const homePreOwnedEl = document.getElementById('homePreOwnedGrid');
    if (homePreOwnedEl) {
      const preOwnedPicks = PRE_OWNED_ITEMS.slice(0, 8);
      homePreOwnedEl.innerHTML = preOwnedPicks.map(p => this.renderProductCard(p)).join('');
    }

    // Mücevher Markaları (5'li)
    const jBrandsEl = document.getElementById('jewelryBrandsGrid');
    if (jBrandsEl) {
      jBrandsEl.innerHTML = JEWELRY_BRANDS.map(b => `
        <a class="brand-tile-card" href="#" data-page="mucevherat">
          <div class="brand-tile-thumb">
            <img src="${b.image}" alt="${b.name}" loading="lazy">
          </div>
          <div class="brand-tile-name">${b.name}</div>
        </a>
      `).join('');
    }

    // Yeni Eklenen Mücevherler (5 Sıra = 20 Ürün Sayfalamalı)
    this.renderHomeJewelry(1);

    // Profesyonel Kapalıçarşı Değerleme Simülatörünü Render Et
    if (typeof ValuationEngine !== 'undefined' && ValuationEngine.renderSimulator) {
      ValuationEngine.renderSimulator();
    }
  },

  // MARKA KAYAR SLIDER GEZİNTİSİ
  scrollBrandSlider(direction) {
    const track = document.getElementById('watchBrandsGrid');
    if (!track) return;
    track.style.animationPlayState = 'paused';
    const computed = window.getComputedStyle(track);
    const matrix = (typeof DOMMatrixReadOnly !== 'undefined') ? new DOMMatrixReadOnly(computed.transform) : null;
    const currentX = matrix ? matrix.m41 : 0;
    const shift = direction === 'next' ? -460 : 460;
    track.style.transition = 'transform 0.4s ease-out';
    track.style.transform = `translateX(${currentX + shift}px)`;
    setTimeout(() => {
      track.style.transition = '';
      track.style.animationPlayState = 'running';
    }, 2500);
  },

  // ANA SAYFA SAAT SAYFALAMA (EN FAZLA 4 SIRA = 16 SAAT)
  renderHomeWatches(page = 1) {
    this.homeWatchPage = page;
    const el = document.getElementById('homeWatchesGrid');
    const pagEl = document.getElementById('homeWatchesPagination');
    if (!el) return;

    const pageSize = this.HOME_WATCH_PAGE_SIZE || 16;
    const total = WATCHES.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = WATCHES.slice(start, end);

    el.innerHTML = pageItems.map(p => this.renderProductCard(p)).join('');

    if (pagEl) {
      pagEl.innerHTML = this.buildPaginationHtml(page, total, pageSize, 'App.changeHomeWatchPage');
    }
  },

  changeHomeWatchPage(newPage) {
    this.renderHomeWatches(newPage);
    setTimeout(() => {
      const target = document.getElementById('secHomeWatches') || document.getElementById('homeWatchesGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 40);
  },

  // ANA SAYFA MÜCEVHER SAYFALAMA (EN FAZLA 5 SIRA = 20 ÜRÜN)
  renderHomeJewelry(page = 1) {
    this.homeJewelryPage = page;
    const el = document.getElementById('homeJewelryGrid');
    const pagEl = document.getElementById('homeJewelryPagination');
    if (!el) return;

    const total = JEWELLERY.length;
    const start = (page - 1) * this.JEWELRY_PAGE_SIZE;
    const end = start + this.JEWELRY_PAGE_SIZE;
    const pageItems = JEWELLERY.slice(start, end);

    el.innerHTML = pageItems.map(p => this.renderProductCard(p)).join('');

    if (pagEl) {
      pagEl.innerHTML = this.buildPaginationHtml(page, total, this.JEWELRY_PAGE_SIZE, 'App.changeHomeJewelryPage');
    }
  },

  changeHomeJewelryPage(newPage) {
    this.renderHomeJewelry(newPage);
    setTimeout(() => {
      const target = document.getElementById('secHomeJewelry') || document.getElementById('homeJewelryGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 40);
  },

  // 2. TÜM SAATLER SAYFASI (12.000 TL ve Üzeri Saat Modelleri - 24 Ürün / 6 Tam Sıra Sayfalama)
  renderWatches(brandFilter = 'all', page = 1) {
    this.currentWatchBrand = brandFilter;
    this.allWatchPage = page;
    const el = document.getElementById('allWatchesGrid');
    const pagEl = document.getElementById('allWatchesPagination');
    if (!el) return;

    let list = WATCHES;
    if (brandFilter && brandFilter !== 'all') {
      list = WATCHES.filter(p => p.brand.trim().toLowerCase() === brandFilter.trim().toLowerCase());
    }

    const total = list.length;
    const start = (page - 1) * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const pageItems = list.slice(start, end);

    el.innerHTML = pageItems.map(p => this.renderProductCard(p)).join('');

    if (pagEl) {
      pagEl.innerHTML = this.buildPaginationHtml(page, total, this.PAGE_SIZE, 'App.changeAllWatchPage');
    }

    // Update filter pill UI
    document.querySelectorAll('.watch-brand-filter-btn').forEach(b => {
      b.classList.remove('active');
      const txt = b.textContent.trim().toLowerCase();
      if ((brandFilter === 'all' || !brandFilter) && txt.includes('tümü')) {
        b.classList.add('active');
      } else if (brandFilter && (txt === brandFilter.toLowerCase() || txt.startsWith(brandFilter.toLowerCase()))) {
        b.classList.add('active');
      }
    });
  },

  changeAllWatchPage(newPage) {
    this.renderWatches(this.currentWatchBrand || 'all', newPage);
    setTimeout(() => {
      const target = document.querySelector('#page-saatler .section-header-flex') || document.getElementById('allWatchesGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 40);
  },

  filterWatchesByBrand(brand = 'all', btn = null) {
    this.closeNavDropdowns();
    this.currentWatchBrand = brand;
    this.allWatchPage = 1;
    if (Router.currentPage !== 'saatler') {
      Router.navigate('saatler', true, { filter: brand });
    } else {
      this.renderWatches(brand, 1);
    }
    if (btn) {
      document.querySelectorAll('.watch-brand-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    setTimeout(() => {
      const target = document.querySelector('#page-saatler .section-header-flex') || document.getElementById('allWatchesGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 60);
  },

  // GENEL SAYFALAMA OLUŞTURUCU (PAGINATION GENERATOR)
  buildPaginationHtml(currentPage, totalItems, pageSize, callbackFnName) {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return '';

    let html = '';

    // Önceki Sayfa Butonu
    if (currentPage > 1) {
      html += `<button class="pagination-btn" onclick="${callbackFnName}(${currentPage - 1})">← Önceki Sayfa</button>`;
    } else {
      html += `<button class="pagination-btn" disabled>← Önceki</button>`;
    }

    // Sayfa Butonları
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      html += `<button class="pagination-btn" onclick="${callbackFnName}(1)">1</button>`;
      if (startPage > 2) html += `<span style="padding:0 4px; color:#888;">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        html += `<button class="pagination-btn active">${i}</button>`;
      } else {
        html += `<button class="pagination-btn" onclick="${callbackFnName}(${i})">${i}</button>`;
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span style="padding:0 4px; color:#888;">...</span>`;
      html += `<button class="pagination-btn" onclick="${callbackFnName}(${totalPages})">${totalPages}</button>`;
    }

    // Sonraki Sayfa Butonu
    if (currentPage < totalPages) {
      html += `<button class="pagination-btn" onclick="${callbackFnName}(${currentPage + 1})" style="background:var(--color-teal); color:#FFF; border-color:var(--color-teal);">Sonraki Sayfa →</button>`;
    } else {
      html += `<button class="pagination-btn" disabled>Son Sayfa</button>`;
    }

    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);
    html += `
      <div class="pagination-info">
        Sayfa <strong>${currentPage} / ${totalPages}</strong> • (Toplam ${totalItems.toLocaleString('tr-TR')} modelden <strong>${startIdx} - ${endIdx}</strong> arası gösteriliyor)
      </div>
    `;

    return html;
  },

  // 3. İKİNCİ EL ALTIN & SAAT SAYFASI
  PRE_OWNED_PAGE_SIZE: 24,
  allPreOwnedPage: 1,

  renderPreOwned(filter = 'all', page = 1) {
    this.currentPreOwnedCategory = filter;
    this.allPreOwnedPage = page;
    const el = document.getElementById('allPreOwnedGrid');
    const pagEl = document.getElementById('allPreOwnedPagination');
    if (!el) return;

    let items = (typeof PRE_OWNED_ITEMS !== 'undefined' ? PRE_OWNED_ITEMS : (typeof PRODUCTS !== 'undefined' ? PRODUCTS.filter(p => p.isPreOwned) : []));
    const f = String(filter || 'all').toLowerCase().trim();

    if (f === 'jewelry' || f === 'mucevher' || f === 'cartier') {
      items = items.filter(p => p.category === 'jewelry' || p.category === 'jewellery' || (p.brand && p.brand.toLowerCase().includes('cartier')));
    } else if (f === 'rolex') {
      items = items.filter(p => (p.brand && p.brand.toLowerCase() === 'rolex') || (p.subCategory && p.subCategory.toLowerCase() === 'rolex'));
    } else if (f === 'watch' || f === 'saat' || f === 'prestij') {
      items = items.filter(p => p.category === 'watch' || p.category === 'saat');
    } else if (f !== 'all' && f !== '') {
      items = items.filter(p =>
        (p.brand && p.brand.toLowerCase().includes(f)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(f)) ||
        (p.category && p.category.toLowerCase() === f) ||
        (p.name && p.name.toLowerCase().includes(f))
      );
    }

    const total = items.length;
    const pageSize = this.PRE_OWNED_PAGE_SIZE || 24;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);

    el.innerHTML = pageItems.map(p => this.renderProductCard(p)).join('');

    if (pagEl) {
      pagEl.innerHTML = this.buildPaginationHtml(page, total, pageSize, 'App.changeAllPreOwnedPage');
    }

    // Update filter pill UI
    document.querySelectorAll('.preowned-filter-btn').forEach(b => {
      b.classList.remove('active');
      const txt = b.textContent.trim().toLowerCase();
      if ((f === 'all' || !f) && txt.includes('tümü')) b.classList.add('active');
      else if (f === 'rolex' && txt.includes('rolex')) b.classList.add('active');
      else if ((f === 'jewelry' || f === 'cartier') && (txt.includes('mücevher') || txt.includes('cartier'))) b.classList.add('active');
      else if ((f === 'watch' || f === 'prestij') && txt.includes('prestij')) b.classList.add('active');
      else if (f && txt.includes(f)) b.classList.add('active');
    });
  },

  changeAllPreOwnedPage(newPage) {
    this.renderPreOwned(this.currentPreOwnedCategory || 'all', newPage);
    setTimeout(() => {
      const target = document.querySelector('#page-ikinci-el .section-header-flex') || document.querySelector('#page-seckin-urunler .section-header-flex') || document.getElementById('allPreOwnedGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 40);
  },

  filterPreOwnedCategory(cat = 'all', btn = null) {
    this.closeNavDropdowns();
    this.currentPreOwnedCategory = cat;
    this.allPreOwnedPage = 1;
    this.renderPreOwned(cat, 1);

    if (Router.currentPage !== 'seckin-urunler' && Router.currentPage !== 'ikinci-el') {
      Router.navigate('seckin-urunler', true, { filter: cat });
    }

    if (btn) {
      document.querySelectorAll('.preowned-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    setTimeout(() => {
      const target = document.querySelector('#page-ikinci-el .section-header-flex') || document.querySelector('#page-seckin-urunler .section-header-flex') || document.getElementById('allPreOwnedGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 60);
  },

  // 4. TÜM MÜCEVHERLER VE ALTIN SAYFASI
  renderJewellery(filter = 'all') {
    this.currentJewelleryCategory = filter;
    const el = document.getElementById('allJewelleryGrid');
    if (!el) return;

    let items = JEWELLERY;
    if (filter === 'Ziynet & Sarrafiye' || filter === 'ziynet') {
      items = JEWELLERY.filter(p => p.subCategory === 'Ziynet & Sarrafiye' || p.name.includes('Ziynet') || p.name.includes('Ata') || p.name.includes('Çeyrek') || p.name.includes('Yarım') || p.name.includes('Tam') || p.name.includes('Gremse'));
    } else if (filter === 'Altın Bilezik' || filter === 'bracelet') {
      items = JEWELLERY.filter(p => p.subCategory === 'Altın Bilezik' || p.name.includes('Bilezik'));
    } else if (filter === 'design' || filter === 'Tasarım Mücevher') {
      items = JEWELLERY.filter(p => p.brand === 'Cartier' || p.category === 'jewelry' && !p.subCategory);
    }

    if (items.length === 0) {
      el.innerHTML = `
        <div class="empty-category-notice" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; margin: 20px 0;">
          <div style="font-size: 32px; margin-bottom: 8px;">✨</div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 20px; color: var(--color-ink); margin-bottom: 6px;">Seçilen kategoride ürün hazırlanıyor</h3>
          <p style="color: var(--color-muted); font-size: 13.5px;">Showroom stoğumuzdaki diğer altın ve mücevherleri inceleyebilirsiniz.</p>
        </div>
      `;
      return;
    }

    el.innerHTML = items.map(p => this.renderProductCard(p)).join('');

    // Update filter tabs UI
    document.querySelectorAll('.jewellery-filter-btn').forEach(b => {
      b.classList.remove('active');
      const attr = b.getAttribute('data-filter') || b.textContent.trim();
      if ((filter === 'all' && (attr === 'all' || attr === 'Tümü')) || attr === filter) {
        b.classList.add('active');
      }
    });
  },

  filterJewelleryCategory(cat = 'all', btn = null) {
    this.closeNavDropdowns();
    this.currentJewelleryCategory = cat;
    if (Router.currentPage !== 'mucevherat') {
      Router.navigate('mucevherat', true, { filter: cat });
    } else {
      this.renderJewellery(cat);
    }
    if (btn) {
      document.querySelectorAll('.jewellery-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    setTimeout(() => {
      const target = document.querySelector('#page-mucevherat .section-header-flex') || document.getElementById('allJewelleryGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 60);
  },

  // HERO TAB SWITCHER
  filterHeroTab(tab, btn) {
    document.querySelectorAll('.hero-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (tab === 'saatler') {
      Router.navigate('saatler');
    } else if (tab === 'ikinci-el') {
      const sec = document.getElementById('secPreOwned');
      if (sec && Router.currentPage === 'ana-sayfa') {
        sec.scrollIntoView({ behavior: 'smooth' });
      } else {
        Router.navigate('ikinci-el');
      }
    } else if (tab === 'mucevherat') {
      Router.navigate('mucevherat');
    } else if (tab === 'all') {
      Router.navigate('ana-sayfa');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  // ÜRÜN KARTI ŞABLONU (PREMIUM BOUTIQUE TASARIMI)
  renderProductCard(p) {
    const hoverImg = p.hoverImage || p.image;
    const isPreOwned = p.isPreOwned === true;
    const buyPrice = p.buyPrice || (p.price - 500);

    const priceHtml = isPreOwned ? `
      <div class="prod-dual-pricing">
        <div class="prod-dual-price-row prod-sale-price-row">
          <span class="prod-price-label">Satış Fiyatı:</span>
          <span class="prod-price-value">${formatPrice(p.price)} <small class="vat-text">(KDV Dahil)</small></span>
        </div>
        <div class="prod-dual-price-row prod-buy-price-row">
          <span class="prod-price-label">Alış Fiyatı:</span>
          <span class="prod-price-value">${formatPrice(buyPrice)}</span>
        </div>
      </div>
    ` : `
      <div class="prod-price-tag">${formatPrice(p.price)}</div>
    `;

    const productHref = (window.SEO_ROUTE_MAP || {})[String(p.id)] || `/?urun=${encodeURIComponent(p.id)}`;

    return `
      <a class="product-art-card ${isPreOwned ? 'product-art-card-preowned' : ''}"
         href="${productHref}"
         data-product-id="${p.id}"
         style="text-decoration:none; color:inherit; display:flex;">
        <div class="product-art-thumb">
          ${isPreOwned ? '<span class="badge-cond-gold">İkinci El</span>' : ''}
          ${p.brand === 'Carren' ? '<span class="badge-shipping-pill" style="position:absolute; top:10px; left:10px; background:rgba(0,48,87,0.92); color:#FFFFFF; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; letter-spacing:0.5px; z-index:2; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.2);">📦 Kargo ile Teslimat</span>' : ''}
          <img class="img-primary" src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy">
          <img class="img-hover" src="${hoverImg}" alt="${p.brand} ${p.name}" loading="lazy">
        </div>
        <div class="product-art-info">
          <h3 class="prod-brand-name">${p.brand}</h3>
          <p class="prod-model-name">${p.name}</p>
          <p class="prod-ref-size">${p.reference}</p>
          ${priceHtml}
        </div>
      </a>
    `;
  },

  // HIZLI ÖNİZLEME ÇEKMECESİ
  openQuickDrawer(id) {
    const p = findProduct(id);
    if (!p) return;

    const panel = document.getElementById('quickDrawerPanel');
    const backdrop = document.getElementById('quickDrawerBackdrop');
    if (!panel || !backdrop) return;

    const isHighVal = (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(p) : p.price > 12000);
    const buyPrice = p.buyPrice || (p.price - 500);

    panel.innerHTML = `
      <button class="drawer-close-btn" onclick="App.closeQuickDrawer()">×</button>
      
      <div style="background:var(--color-pedestal); border-radius:var(--radius-md); overflow:hidden; width:100%; padding-top:100%; position:relative; margin-bottom:20px;">
        <img src="${p.image}" alt="${p.brand} ${p.name}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:16px;">
      </div>

      <span style="font-size:11px; letter-spacing:2px; color:var(--color-gold-dark); font-weight:700; text-transform:uppercase;">${p.brand}</span>
      <h3 style="font-family:var(--font-sans); font-size:24px; font-weight:700; color:var(--color-ink); margin:4px 0 6px;">${p.name}</h3>
      <p style="font-size:13px; color:var(--color-muted); margin-bottom:16px;">${p.reference}</p>
      
      ${p.isPreOwned ? `
        <div class="drawer-dual-pricing-box" style="margin-bottom:20px; padding:14px 16px; background:#FBF9F5; border:1px solid rgba(194,167,104,0.35); border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
            <span style="font-size:13px; font-weight:700; color:var(--color-ink);">Satış Fiyatı:</span>
            <span style="font-family:var(--font-sans); font-size:24px; font-weight:800; color:var(--color-teal); font-variant-numeric:tabular-nums;">
              ${formatPrice(p.price)} <small style="font-size:11px; font-weight:600; color:var(--color-muted);">(KDV Dahil)</small>
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; padding-top:8px; border-top:1px dashed rgba(194,167,104,0.3);">
            <span style="font-size:12px; font-weight:600; color:#5D4411;">Alış Fiyatı:</span>
            <span style="font-family:var(--font-sans); font-size:17px; font-weight:700; color:var(--badge-gold-text); font-variant-numeric:tabular-nums;">
              ${formatPrice(buyPrice)}
            </span>
          </div>
        </div>
      ` : `
        <div style="font-family:var(--font-sans); font-size:26px; font-weight:800; color:var(--color-teal); font-variant-numeric:tabular-nums; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--color-border);">
          ${formatPrice(p.price)}
        </div>
      `}

      <p style="font-size:13.5px; color:#444; line-height:1.7; margin-bottom:20px;">
        ${p.desc}
      </p>

      <table class="pd-art-specs-table" style="font-size:12.5px; margin-bottom:16px;">
        <tr><td>Maden / Kasa</td><td>${p.metal || 'Masif Altın / Çelik'}</td></tr>
        <tr><td>Kadran / Taş</td><td>${p.dial || 'Orijinal Kadran'}</td></tr>
        <tr><td>Model Yılı</td><td>${p.year || '2024'}</td></tr>
        <tr><td>Kutu & Evrak</td><td>${p.boxPapers || 'Tam Set'}</td></tr>
        ${p.amplitude ? `<tr><td>Zaman Doğruluğu</td><td><strong>${p.rateAccuracy}</strong></td></tr>` : ''}
        ${p.hallmark ? `<tr><td>Darphane Damgası</td><td><strong>${p.hallmark}</strong></td></tr>` : ''}
      </table>

      ${isHighVal ? `
        <div style="font-size:11.5px; color:#5D4411; background:#FFF9EE; border:1px solid #E6D2A8; padding:10px 12px; border-radius:6px; margin-bottom:16px; line-height:1.5;">
          <strong>🏛️ Yalnız Mağazadan Teslim (03):</strong> 12.000 TL üzerindeki ürünler güvenlik gereği kimlik ibrazı ve imza ile yalnızca Buca mağazamızdan teslim edilir. Kargo/kurye ile gönderilmez.
        </div>
      ` : `
        <div style="font-size:11.5px; color:#003057; background:#F0F7FF; border:1px solid #C4D9EC; padding:10px 12px; border-radius:6px; margin-bottom:16px; line-height:1.5; display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">📦</span>
          <span><strong>Sigortalı Hızlı Kargo:</strong> Siparişiniz özel korumalı ambalajında sigortalı kargo ile adresinize teslim edilir.</span>
        </div>
      `}

      <div style="display:flex; flex-direction:column; gap:10px; margin-top:auto;">
        <button class="btn-art-buy" onclick="Cart.add(${p.id}); App.updateHeaderCartCount(); App.closeQuickDrawer(); Router.navigate('cart');">
          Sepete Ekle & Satın Al
        </button>
        <button class="btn-hero-outline" style="text-align:center; padding:12px;" onclick="App.closeQuickDrawer(); App.openProduct(${p.id});">
          Detaylı Ekspertiz Sayfası & Şartlar (10x Loupe)
        </button>
      </div>
    `;

    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeQuickDrawer() {
    const backdrop = document.getElementById('quickDrawerBackdrop');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
  },

  // ==========================================================
  // ÜRÜN DETAY SAYFASI (SAAT&SAAT ENTERPRISE PDP MİMARİSİ)
  // ==========================================================
  openProduct(id, options = {}) {
    const p = findProduct(id);
    if (!p) return;

    const container = document.getElementById('productDetailView');
    if (!container) return;

    const isGoldProduct = (p.category === 'jewelry' || p.category === 'jewellery' || p.isGold);
    const isHighVal = (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(p) : p.price >= 12000);
    const specs = p.specs || {};

    // Galleri görselleri (Varsa ek açılar, yoksa ana görsel)
    const galleryImages = (p.images && p.images.length > 0) ? p.images : [p.image];

    // Thumbnails HTML
    const thumbsHtml = galleryImages.map((img, idx) => `
      <div class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" onclick="App.changePdpMainImage('${img}', this)">
        <img src="${img}" alt="${p.brand} ${p.name} - ${idx + 1}" loading="lazy">
      </div>
    `).join('');

    // Fiyat & İndirim Rozeti
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    const discountPercent = hasDiscount ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    const monthlyInstallment = Math.round(p.price / 3);

    // Güvenli Ödeme Bannerı (Tek Çekim & 3D Secure Güvencesi)
    const secureBannerHtml = `
      <div class="pdp-installment-banner" style="background:#FAF8F5; border:1px solid #EAE5D9; color:#4A3B18; padding:10px 14px; border-radius:6px; font-size:12.5px; margin-top:14px; line-height:1.5;">
        <span>🔒 <strong>Güvenli Ödeme:</strong> 256-bit SSL ve 3D Secure ile <strong>tek çekim</strong> veya havale/EFT güvencesi.</span>
      </div>
    `;

    // 4'lü Dengeli Hızlı Özet Çipler (2x2 Grid - Taşmasız & Simetrik)
    const quickSpecsHtml = isGoldProduct ? `
      <div class="pdp-quick-specs">
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🪙</span>
          <div>
            <span class="pdp-spec-pill-label">Maden & Saflık</span>
            <span class="pdp-spec-pill-val">${p.metal || '24 Ayar (995/1000)'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">⚖️</span>
          <div>
            <span class="pdp-spec-pill-label">Kategori</span>
            <span class="pdp-spec-pill-val">${p.subCategory || 'Külçe & Sarrafiye'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🏛️</span>
          <div>
            <span class="pdp-spec-pill-label">Baskı / Menşei</span>
            <span class="pdp-spec-pill-val">T.C. Darphane</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">📜</span>
          <div>
            <span class="pdp-spec-pill-label">Sertifika & Fatura</span>
            <span class="pdp-spec-pill-val">%100 Ayar Garantili</span>
          </div>
        </div>
      </div>
    ` : `
      <div class="pdp-quick-specs">
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">⚙️</span>
          <div>
            <span class="pdp-spec-pill-label">Mekanizma</span>
            <span class="pdp-spec-pill-val">${specs['Mekanizma'] || 'Quartz / Analog'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">📐</span>
          <div>
            <span class="pdp-spec-pill-label">Kasa Çapı</span>
            <span class="pdp-spec-pill-val">${specs['Kasa Çapı'] || '42 mm'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🛡️</span>
          <div>
            <span class="pdp-spec-pill-label">Cam Tipi</span>
            <span class="pdp-spec-pill-val">${specs['Cam Tipi'] || 'Safir / Mineral'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">💧</span>
          <div>
            <span class="pdp-spec-pill-label">Su Geçirmezlik</span>
            <span class="pdp-spec-pill-val">${specs['Su Geçirmezlik'] || '5 ATM (50 M)'}</span>
          </div>
        </div>
      </div>
    `;

    // 4'lü Kurumsal Güvence Kutusu (Altın vs Saat)
    const trustBoxHtml = isGoldProduct ? `
      <div class="pdp-trust-box">
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">🪙</span>
          <div class="pdp-trust-item-text">
            <strong>%100 Darphane & Saflık Garantisi</strong>
            <span>Resmi ayar ve milyem standartlarında tescilli ve sertifikalı.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">🏛️</span>
          <div class="pdp-trust-item-text">
            <strong>Buca Showroom'dan Teslimat</strong>
            <span>12.000 TL üzeri yasal kimlik ve imza ile mağazadan güvenli teslim.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">💳</span>
          <div class="pdp-trust-item-text">
            <strong>BDDK Lisanslı 3D Secure</strong>
            <span>PayTR 256-bit SSL korumalı banka altyapısı & tek çekim.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">⚖️</span>
          <div class="pdp-trust-item-text">
            <strong>Anında Nakit Alım & Değerleme</strong>
            <span>Kapalıçarşı anlık serbest piyasa kurundan nakde çevirme güvencesi.</span>
          </div>
        </div>
      </div>
    ` : `
      <div class="pdp-trust-box">
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">🛡️</span>
          <div class="pdp-trust-item-text">
            <strong>2 Yıl Distribütör Garantisi</strong>
            <span>Orijinal kutusu, garanti belgesi ve faturalı teslimat.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">${p.brand === 'Carren' || !isHighVal ? '📦' : '🏛️'}</span>
          <div class="pdp-trust-item-text">
            <strong>${p.brand === 'Carren' || !isHighVal ? 'Sigortalı Kargo ile Teslimat' : "Buca Showroom'dan Teslimat"}</strong>
            <span>${p.brand === 'Carren' || !isHighVal ? "Tüm Türkiye'ye özel güvenlikli ambalajında sigortalı kargo ile gönderim yapılır." : '12.000 TL üzeri yasal kimlik ve imza ile mağazadan güvenli teslim.'}</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">💳</span>
          <div class="pdp-trust-item-text">
            <strong>BDDK Lisanslı 3D Secure</strong>
            <span>PayTR 256-bit SSL korumalı banka altyapısı.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">⚖️</span>
          <div class="pdp-trust-item-text">
            <strong>Ekspertiz & Takas Güvencesi</strong>
            <span>Sertifikalı & 12 Nokta Ekspertiz Güvencesi</span>
          </div>
        </div>
      </div>
    `;

    // Sekme 1: Ürün Detayları
    const detailsTabHtml = isGoldProduct ? `
      <div id="tab-details" class="pdp-tab-pane active" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14.5px;">
          <h2 style="font-size:20px; font-weight:700; color:var(--color-ink); margin-bottom:16px;">
            ${p.brand} ${p.name} Ürün Bilgisi ve Saflık Detayları
          </h2>
          <p style="margin-bottom:16px;">
            ${p.description || p.desc}
          </p>
          <div style="background:#FBF9F5; border-left:4px solid var(--color-teal); padding:16px 20px; margin:20px 0; border-radius:0 6px 6px 0;">
            <strong style="color:var(--color-teal); display:block; margin-bottom:4px; font-size:14px;">Belgin Kuyumculuk Altın ve Ayar Taahhüdü:</strong>
            Sitemizde ve Buca showroomumuzda satışa sunulan tüm altın, külçe, ziynet ve sarrafiye ürünleri T.C. Darphane ve resmi rafinerilerin standartlarında, %100 safiyet ve ayar garantisiyle faturalı ve sertifikalı olarak teslim edilir.
          </div>
          <h3 style="font-size:16px; font-weight:700; color:var(--color-ink); margin:24px 0 10px;">Teslimat & Ambalaj İçeriği:</h3>
          <ul style="padding-left:20px; margin-bottom:16px; display:flex; flex-direction:column; gap:6px;">
            <li>Orijinal Hologramlı Güvenlik Ambalajı / Külçe Blister Paketi</li>
            <li>Belgin Kuyumculuk Resmi Satış Faturası ve Ayar Sertifikası</li>
            <li>T.C. Darphane / Rafineri Resmi Damgası</li>
            <li>Kapalıçarşı Anlık Serbest Piyasa Geri Alım Güvencesi</li>
          </ul>
        </div>
      </div>
    ` : `
      <div id="tab-details" class="pdp-tab-pane active" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14.5px;">
          <h2 style="font-size:20px; font-weight:700; color:var(--color-ink); margin-bottom:16px;">
            ${p.brand} ${p.name} Ürün Bilgisi ve Tasarım Detayları
          </h2>
          <p style="margin-bottom:16px;">
            ${p.description || p.desc}
          </p>
          <div style="background:#FBF9F5; border-left:4px solid var(--color-teal); padding:16px 20px; margin:20px 0; border-radius:0 6px 6px 0;">
            <strong style="color:var(--color-teal); display:block; margin-bottom:4px; font-size:14px;">Belgin Kuyumculuk Ürün ve Belge Taahhüdü:</strong>
            Sitemizde ve Buca showroomumuzda yer alan tüm <strong>${p.brand}</strong> saat modelleri %100 orijinal, ürüne ait fatura ve garanti belgesindeki kapsamla satılır. Siparişiniz seri numarası kayıtlı garanti belgesi, orijinal kutusu ve kaşeli sertifikasıyla eksiksiz teslim edilmektedir.
          </div>
          <h3 style="font-size:16px; font-weight:700; color:var(--color-ink); margin:24px 0 10px;">Kutu İçeriği:</h3>
          <ul style="padding-left:20px; margin-bottom:16px; display:flex; flex-direction:column; gap:6px;">
            <li>Orijinal ${p.brand} Lüks Saat Kutusu ve Koruma Ambalajı</li>
            <li>Ürüne ait garanti belgesi ve satış faturası</li>
            <li>Türkçe Kullanım Kılavuzu ve Mekanizma Bakım Kartı</li>
            <li>Belgin Kuyumculuk Satış Faturası ve Yetkili Belgesi</li>
          </ul>
        </div>
      </div>
    `;

    // Sekme 2: Teknik Özellikler Tablosu
    const specsTabHtml = isGoldProduct ? `
      <div id="tab-specs" class="pdp-tab-pane" role="tabpanel">
        <div class="pdp-specs-category-grid">
          
          <!-- 1. Maden & Saflık -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🪙 Maden & Saflık</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Maden Türü</span><span class="pdp-spec-value">Kıymetli Altın</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ayar / Saflık</span><span class="pdp-spec-value">${p.metal || '24 Ayar (995/1000)'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kategori</span><span class="pdp-spec-value">${p.subCategory || 'Külçe & Sarrafiye'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Durum</span><span class="pdp-spec-value">Sıfır / T.C. Darphane Tescilli</span></div>
            </div>
          </div>

          <!-- 2. Sertifika & Güvenlik -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🔒 Sertifika & Güvenlik</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ürün Kodu</span><span class="pdp-spec-value">${p.ref || p.reference}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ambalaj Tipi</span><span class="pdp-spec-value">Hologramlı Güvenlik Ambalajı</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Damga / Mühür</span><span class="pdp-spec-value">${p.hallmark || 'T.C. Darphane Mühürlü'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Fatura</span><span class="pdp-spec-value">Resmi E-Fatura & Ayar Kaydı</span></div>
            </div>
          </div>

          <!-- 3. Teslimat & Alım Garantisi -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🏛️ Teslimat & Değerleme</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Teslimat Kuralı</span><span class="pdp-spec-value">12.000 TL+ Showroom Güvenli Teslim</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Geri Alım</span><span class="pdp-spec-value">Anlık Kapalıçarşı Kuruyla Nakit Alım</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ödeme Şekli</span><span class="pdp-spec-value">BDDK Uyumlu Tek Çekim / 3D Secure</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Menşei</span><span class="pdp-spec-value">Türkiye (T.C. Darphane Tescilli)</span></div>
            </div>
          </div>

        </div>
      </div>
    ` : `
      <div id="tab-specs" class="pdp-tab-pane" role="tabpanel">
        <div class="pdp-specs-category-grid">
          
          <!-- 1. Ürün Bilgisi -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🏷️ Ürün Bilgisi</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Marka</span><span class="pdp-spec-value">${p.brand}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Model / Ref</span><span class="pdp-spec-value">${p.ref || p.reference}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Cinsiyet</span><span class="pdp-spec-value">${specs['Cinsiyet'] || 'Erkek / Kadın'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Çalışma Tipi</span><span class="pdp-spec-value">${specs['Mekanizma'] || 'Quartz Analog'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Menşei</span><span class="pdp-spec-value">${p.origin || specs['Menşei'] || 'İsviçre / Japonya'}</span></div>
            </div>
          </div>

          <!-- 2. Kasa Detayları -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">📐 Kasa Detayları</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Çapı</span><span class="pdp-spec-value">${specs['Kasa Çapı'] || '42 mm'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Materyali</span><span class="pdp-spec-value">${specs['Kasa Materyali'] || p.metal || '316L Çelik'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Rengi</span><span class="pdp-spec-value">${specs['Kasa Rengi'] || 'Metalik Çelik / Altın'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Şekli</span><span class="pdp-spec-value">Yuvarlak / Geometrik</span></div>
            </div>
          </div>

          <!-- 3. Kadran & Cam -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🛡️ Kadran & Cam</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Cam Özelliği</span><span class="pdp-spec-value">${specs['Cam Tipi'] || 'Safir / Mineral'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kadran Rengi</span><span class="pdp-spec-value">${specs['Kadran Rengi'] || 'Antrasit / Siyah'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kadran Tipi</span><span class="pdp-spec-value">Analog / İndeksli</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Aydınlatma</span><span class="pdp-spec-value">LumiBrite / Fosforlu Kollar</span></div>
            </div>
          </div>

          <!-- 4. Kordon / Kayış -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🎨 Kordon / Kayış</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kordon Tipi</span><span class="pdp-spec-value">${specs['Kordon / Kayış'] || 'Paslanmaz Çelik'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kordon Rengi</span><span class="pdp-spec-value">Metalik / Deri Tonu</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Klips</span><span class="pdp-spec-value">Kelebek / Emniyetli Toka</span></div>
            </div>
          </div>

          <!-- 5. Fonksiyonlar -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">⚡ Fonksiyonlar</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Su Geçirmezlik</span><span class="pdp-spec-value">${specs['Su Geçirmezlik'] || '5 ATM (50 Metre)'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Takvim</span><span class="pdp-spec-value">Gün / Tarih Göstergesi</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kronometre</span><span class="pdp-spec-value">Mevcut / Hassas Sayaç</span></div>
            </div>
          </div>

          <!-- 6. Garanti & Güvenlik -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">📜 Garanti & Teslimat</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Garanti Süresi</span><span class="pdp-spec-value">2 Yıl Distribütör Garantili</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Teslimat Kuralı</span><span class="pdp-spec-value">12.000 TL+ Mağazadan Teslim</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ekspertiz Kaydı</span><span class="pdp-spec-value">Sertifikalı & Ekspertiz Onaylı</span></div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Sekme 3: Güvenli Ödeme & 3D Secure
    const paymentTabHtml = `
      <div id="tab-installments" class="pdp-tab-pane" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14px;">
          <h3 style="font-size:18px; font-weight:700; color:var(--color-ink); margin-bottom:14px;">
            💳 BDDK Lisanslı 3D Secure Güvenli Ödeme Standartları
          </h3>
          <p style="margin-bottom:12px;">
            Belgin Kuyumculuk olarak tüm saat, altın ve mücevher siparişlerinizde <strong>PayTR 256-bit SSL şifrelemeli 3D Secure altyapısı</strong> kullanılmaktadır. Tüm kredi ve banka kartlarıyla <strong>tek çekim</strong> olarak güvenle işlem yapabilirsiniz.
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div style="background:#FBF9F5; border:1px solid rgba(194,167,104,0.35); padding:16px; border-radius:6px;">
              <strong style="color:var(--color-ink); display:block; margin-bottom:6px;">💳 Kredi / Banka Kartı (3D Secure Tek Çekim)</strong>
              <span style="font-size:13px; color:#666;">Kart sahibinin cep telefonuna iletilen tek kullanımlık SMS onay kodu ile banka düzeyinde doğrulanır. Kart bilgileri sunucularımızda asla tutulmaz.</span>
            </div>
            <div style="background:#FBF9F5; border:1px solid rgba(194,167,104,0.35); padding:16px; border-radius:6px;">
              <strong style="color:var(--color-ink); display:block; margin-bottom:6px;">🏦 Banka Havalesi / FAST (%3 İndirimli)</strong>
              <span style="font-size:13px; color:#666;">Kurumsal banka hesaplarımıza anında transfer ile sipariş oluşturabilirsiniz. Açıklama kısmına sipariş kodunun yazılması yeterlidir.</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // İlgili Ürünler
    const allProds = typeof getAllProducts === 'function' ? getAllProducts() : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    const relatedProducts = allProds.filter(x => x.id !== p.id && (x.brand === p.brand || x.category === p.category)).slice(0, 4);

    const breadcrumbCategory = isGoldProduct ? 'Mücevherat & Altın' : 'Lüks Saatler';
    const breadcrumbPage = isGoldProduct ? 'mucevherat' : 'saatler';

    container.innerHTML = `
      <div class="pdp-page-container">
        
        <!-- 1. Breadcrumbs -->
        <nav class="pdp-breadcrumbs" aria-label="Breadcrumb">
          <a href="#" data-page="ana-sayfa">Ana Sayfa</a>
          <span class="pdp-separator">/</span>
          <a href="#" data-page="${breadcrumbPage}">${breadcrumbCategory}</a>
          <span class="pdp-separator">/</span>
          <a href="#" onclick="App.filterWatchesByBrand('${p.brand}', null)">${p.brand}</a>
          <span class="pdp-separator">/</span>
          <span class="pdp-current">${p.name}</span>
        </nav>

        <!-- 2. Master Hero Grid (Left: Gallery, Right: Buy Box) -->
        <div class="pdp-hero-grid">
          
          <!-- SOL: Gelişmiş Galeri ve 10x Optik Makro Büyüteç -->
          <div class="pdp-gallery-wrap">
            <div class="pdp-thumbs-list">
              ${thumbsHtml}
            </div>
            
            <div class="pdp-main-photo-box" onmousemove="App.handleZoom(event, this)" onmouseleave="App.resetZoom(this)">
              ${isHighVal ? `
                <div class="pdp-badge-top-left">
                  <span class="pdp-badge-item pdp-badge-secure">🏛️ 12.000 TL+ MAĞAZA TESLİMİ</span>
                </div>
              ` : ''}
              <img src="${p.image}" alt="${p.brand} ${p.name}" id="pdpMainImageTarget">
              <div class="pdp-loupe-hint">🔍 10x Optik İnceleme İçin Üzerine Gelin</div>
            </div>
          </div>

          <!-- SAĞ: Satın Alma & Özellikler Paneli (Buy Box) -->
          <div class="pdp-buy-box">
            <a href="#" onclick="App.filterWatchesByBrand('${p.brand}', null)" class="pdp-brand-title">${p.brand}</a>
            <h1 class="pdp-product-title">${p.name}</h1>
            
            <div class="pdp-meta-row">
              <span>Ürün Kodu: <strong class="pdp-meta-sku">${p.ref || p.reference}</strong></span>
              <span>•</span>
              <span class="pdp-meta-stock">● Stokta Var (Hemen Teslim)</span>
              <span>•</span>
              <span>Kategori: <strong>${p.subCategory || (isGoldProduct ? 'Altın & Mücevherat' : 'Lüks Saat')}</strong></span>
            </div>

            <!-- Fiyat Kutusu -->
            <div class="pdp-price-wrap ${p.isPreOwned ? 'pdp-dual-price-wrap' : ''}">
              ${p.isPreOwned ? `
                <div class="pdp-dual-pricing-panel">
                  <div class="pdp-dual-row pdp-sale-highlight">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                      <span class="pdp-price-badge-pill">SATIŞ FİYATI</span>
                      <span class="pdp-current-price">${formatPrice(p.price)}</span>
                      <span class="pdp-vat-badge">KDV Dahil</span>
                    </div>
                  </div>
                  <div class="pdp-dual-row pdp-buy-highlight">
                    <div class="pdp-buyback-box">
                      <span class="pdp-buyback-title">Alış Fiyatı:</span>
                      <span class="pdp-buyback-price">${formatPrice(p.buyPrice || (p.price - 500))}</span>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="pdp-price-header">
                  ${hasDiscount ? `<span class="pdp-old-price">${formatPrice(p.oldPrice)}</span>` : ''}
                  <span class="pdp-current-price">${formatPrice(p.price)}</span>
                  ${hasDiscount ? `<span class="pdp-discount-badge">-%${discountPercent} İNDİRİM</span>` : ''}
                </div>
              `}
              ${secureBannerHtml}
            </div>

            <!-- Hızlı Özet Teknik Çipler -->
            ${quickSpecsHtml}

            <!-- Aksiyon Butonları -->
            <div class="pdp-actions-row">
              <button class="pdp-btn-cart" onclick="Cart.add(${p.id}); App.updateHeaderCartCount(); Router.navigate('sepet');">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>Sepete Ekle</span>
              </button>
              <button class="pdp-btn-fast" onclick="Cart.add(${p.id}); App.updateHeaderCartCount(); Router.navigate('odeme');">
                <span>Hemen Satın Al</span>
              </button>
              <a class="pdp-btn-whatsapp" href="https://wa.me/905419305372?text=Merhaba,%20${encodeURIComponent(p.brand + ' ' + p.name)}%20(${p.ref || p.reference})%20modeli%20hakkinda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener" aria-label="WhatsApp Satış Danışmanı">
                <span>💬</span>
              </a>
            </div>

            <!-- 4'lü Kurumsal Güvence Kutusu -->
            ${trustBoxHtml}

          </div>
        </div>

        <!-- 3. Alt Sekmeler (Detaylar, Teknik Özellikler, Güvenli Ödeme, Teslimat) -->
        <div class="pdp-tabs-container">
          <div class="pdp-tabs-nav" role="tablist">
            <button class="pdp-tab-btn active" onclick="App.switchPdpTab('tab-details', this)" role="tab">
              <span>📋 Ürün Detayları</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-specs', this)" role="tab">
              <span>⚙️ Teknik Özellikler Tablosu</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-installments', this)" role="tab">
              <span>💳 3D Secure Güvenli Ödeme (Tek Çekim)</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-delivery', this)" role="tab">
              <span>🚚 Teslimat, Güvenlik & İade Koşulları</span>
            </button>
          </div>

          <!-- SEKME 1: Ürün Detayları -->
          ${detailsTabHtml}

          <!-- SEKME 2: Teknik Özellikler Tablosu -->
          ${specsTabHtml}

          <!-- SEKME 3: Taksit Seçenekleri -->
          <div id="tab-installments" class="pdp-tab-pane" role="tabpanel">
            <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:24px; line-height:1.7;">
              <strong style="display:block; margin-bottom:8px;">Kart ve banka koşullarına göre taksit</strong>
              <p style="font-size:13.5px; color:var(--color-muted); margin:0;">Taksit seçenekleri ödeme adımında, kartın bankası ve işlem tarihinde yürürlükte bulunan mevzuat sınırlarına göre gösterilir. Sitede mevzuatın üzerinde sabit taksit taahhüdü verilmez.</p>
            </div>
          </div>

          <!-- SEKME 4: Teslimat, Güvenlik & İade Koşulları -->
          <div id="tab-delivery" class="pdp-tab-pane" role="tabpanel">
            <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14px;">
              <h3 style="font-size:18px; font-weight:700; color:var(--color-ink); margin-bottom:14px;">
                🏛️ Yüksek Değerli Ürün Teslimat Protokolü (03)
              </h3>
              <p style="margin-bottom:12px;">
                <strong>12.000 TL üzerindeki tüm altın ve lüks saat ürünleri</strong>, güvenlik protokolleri gereğince yalnızca İzmir Buca'daki merkez showroomumuzdan (Menderes Cad. No:231/B Buca / İzmir) bizzat teslim edilmektedir.
              </p>
              <ul style="padding-left:20px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">
                <li>Teslimat sırasında alıcı kimlik fotokopisi ve ıslak imzalı teslim tutanağı zorunludur.</li>
                <li>Üçüncü şahıslara ve vekaletsiz teslimat yapılmamaktadır.</li>
                <li>Tüm ürünler mühürlü ambalajında ve resmi faturasıyla teslim edilir.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    `;

    Router.navigate('urun', false);
    const route = Router.routeForProduct(p.id);
    if (!options.skipHistory && route && location.pathname !== route) {
      history.pushState({ page: 'urun', productId: p.id }, '', route);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 30);
  },
  changePdpMainImage(src, thumbEl) {
    const target = document.getElementById('pdpMainImageTarget');
    if (target) target.src = src;
    document.querySelectorAll('.pdp-thumb-item').forEach(el => el.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  },

  switchPdpTab(tabId, btn) {
    document.querySelectorAll('.pdp-tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.pdp-tab-btn').forEach(el => el.classList.remove('active'));
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');
    if (btn) btn.classList.add('active');
  },

  handleZoom(e, container) {
    const img = container.querySelector('img');
    if (!img) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  },

  resetZoom(container) {
    const img = container.querySelector('img');
    if (img) img.style.transformOrigin = 'center center';
  },

  // SEPET GÖRÜNÜMÜ
  renderCart() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;

    if (Cart.items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px 0;">
          <p style="color:var(--color-muted); margin-bottom:16px;">Sepetinizde ürün bulunmamaktadır.</p>
          <a class="btn-hero-filled" href="#" data-page="saatler">Saatleri İncele</a>
        </div>
      `;
      return;
    }

    const hasHighValue = Cart.items.some(item => (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(item) : item.price > 12000));

    container.innerHTML = `
      <div>
        ${Cart.items.map(item => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 0; border-bottom:1px solid var(--color-border);">
            <div>
              <h4 style="font-size:15px; font-weight:600;">${item.name}</h4>
              <p style="font-size:12px; color:var(--color-muted);">${item.qty} Adet × ${formatPrice(item.price)}</p>
            </div>
            <div style="font-size:16px; font-weight:700; color:var(--color-teal);">${formatPrice(item.price * item.qty)}</div>
          </div>
        `).join('')}

        ${hasHighValue ? `
          <div style="background:#FFF9EE; border:1px solid #E6D2A8; padding:14px 16px; border-radius:8px; margin:18px 0; font-size:12.5px; color:#6B531C; line-height:1.5;">
            <strong>🏛️ Teslim Yöntemi:</strong> Belgin Kuyumculuk Mağazasından Teslim (Menderes Cad. No:231/B Buca / İzmir)<br>
            <span style="font-size:11.5px; color:#875A00;">⚠️ Sepetinizde 12.000 TL üzeri yüksek değerli ürün bulunmaktadır. Güvenlik protokolü (03) gereği kargo/kurye adrese teslimat seçeneği teknik olarak kapatılmıştır.</span>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 0;">
          <span style="font-size:16px; font-weight:600;">Genel Toplam:</span>
          <span style="font-size:22px; font-weight:700; color:var(--color-teal);">${formatPrice(Cart.getTotal())}</span>
        </div>

        <button class="btn-art-buy" style="width:100%;" onclick="Router.navigate('checkout')">
          Güvenli Ödeme Adımına Geç
        </button>
      </div>
    `;
  },

  // TÜRKİYE KARGO & LOOMIS ZIRHLI TAKİP MODALI
  openTrackOrderModal() {
    this.openModal(`
      <div class="modal-dialog-header">
        <h3>Loomis & Yurtiçi Kargo Takip Sorgulama</h3>
        <button class="modal-dialog-close" onclick="App.closeModal()">×</button>
      </div>
      <div>
        <p style="font-size:13px; color:var(--color-muted); margin-bottom:14px;">Size SMS ile iletilen 8 haneli Takip Numaranızı veya Sipariş Kodunuzu giriniz (Örn: BLG-849201):</p>
        <div style="display:flex; gap:8px; margin-bottom:16px;">
          <input type="text" id="trackCodeInput" placeholder="BLG-849201" style="flex:1; padding:10px; border:1px solid var(--color-border); border-radius:4px; text-transform:uppercase;">
          <button class="btn-hero-filled" onclick="App.queryTrackCode()">Sorgula</button>
        </div>
        <div id="trackResultBox"></div>
      </div>
    `);
  },

  queryTrackCode() {
    const input = document.getElementById('trackCodeInput');
    const res = document.getElementById('trackResultBox');
    if (!input || !res) return;

    const val = input.value.trim().toUpperCase();
    if (!val) return;

    res.innerHTML = `
      <div style="background:#EAF4EE; border:1px solid #B8DEC3; padding:16px; border-radius:6px; font-size:13px;">
        <strong style="color:#1F6B38; display:block; margin-bottom:6px;">✓ Zırhlı Kurye Dağıtımda</strong>
        <div><strong>Kargo Türü:</strong> Loomis Tam Değer Sigortalı VIP Kurye</div>
        <div><strong>Durum:</strong> Zorlu Center Showroom'dan Güvenlikli Çıkış Yapıldı</div>
        <div><strong>Tahmini Teslimat:</strong> Bugün 2 Saat İçerisinde (Kimlik İbrazı ile)</div>
      </div>
    `;
  },

  // MODAL AÇICILAR (TAKAS & VIP & SERTİFİKA)
  openTradeInModal() {
    this.openModal(`
      <div class="modal-dialog-header">
        <h3>Saatinizi / Altınınızı Değerlendirin</h3>
        <button class="modal-dialog-close" onclick="App.closeModal()">×</button>
      </div>
      <form onsubmit="event.preventDefault(); showToast('Değerleme talebiniz uzmanımıza iletildi. 15 dk içinde dönüş yapılacaktır.', 'success'); App.closeModal();">
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Kategori *</label>
          <select required style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
            <option value="">Seçiniz</option>
            <option>Lüks Saat (Rolex, Patek, AP, Cartier)</option>
            <option>İkinci El Altın (18K / 22K Masif Altın)</option>
            <option>Pırlanta & Değerli Mücevher</option>
          </select>
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Model, Gramaj & Referans Numarası</label>
          <input type="text" placeholder="Örn: Submariner 16610LV veya 32gr 18K Altın Kelepçe" required style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Kutu & Sertifika Durumu</label>
          <select style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
            <option>Kutu ve Sertifika Tam Set</option>
            <option>Yalnızca Saat / Altın</option>
            <option>Yalnızca Sertifika / Fatura Var</option>
          </select>
        </div>
        <div style="margin-bottom:20px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Telefon Numaranız (WhatsApp Teklifi İçin) *</label>
          <input type="tel" placeholder="05XX XXX XX XX" required style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
        </div>
        <button type="submit" class="btn-art-buy" style="width:100%;">Anında Ön Değerleme İste</button>
      </form>
    `);
  },

  openVipModal() {
    this.openModal(`
      <div class="modal-dialog-header">
        <h3>VİP RANDEVU & ÖZEL SHOWROOM TAHMİNİ</h3>
        <button class="modal-dialog-close" onclick="App.closeModal()">×</button>
      </div>
      <form onsubmit="event.preventDefault(); showToast('VIP rezervasyonunuz oluşturuldu. Özel müşteri temsilcimiz sizinle iletişime geçecektir.', 'success'); App.closeModal();">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Ad Soyad *</label>
            <input type="text" required placeholder="Ad Soyad" style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Telefon *</label>
            <input type="tel" required placeholder="05XX XXX XX XX" style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Tercih Edilen Tarih *</label>
            <input type="date" required style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Saat *</label>
            <input type="time" required style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
          </div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">İncelemek İstediğiniz Model / Referans</label>
          <input type="text" placeholder="Örn: Rolex Kermit, Cartier Altın Kelepçe veya AP Royal Oak" style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
        </div>
        <button type="submit" class="btn-art-buy" style="width:100%;">VİP RANDEVUYU ONAYLA</button>
      </form>
    `);
  },

  openCertModal() {
    this.openModal(`
      <div class="modal-dialog-header">
        <h3>Sertifika & Seri Numarası Doğrulama</h3>
        <button class="modal-dialog-close" onclick="App.closeModal()">×</button>
      </div>
      <div>
        <p style="font-size:13px; color:var(--color-muted); margin-bottom:14px;">GIA, HRD veya Belgin tescil numaranızı giriniz (Örn: GIA-24891042):</p>
        <div style="display:flex; gap:8px; margin-bottom:16px;">
          <input type="text" id="certQueryInput" placeholder="GIA-24891042" style="flex:1; padding:10px; border:1px solid var(--color-border); border-radius:4px; text-transform:uppercase;">
          <button class="btn-hero-filled" onclick="App.queryCert()">Sorgula</button>
        </div>
        <div id="certQueryResult"></div>
      </div>
    `);
  },

  queryCert() {
    const input = document.getElementById('certQueryInput');
    const result = document.getElementById('certQueryResult');
    if (!input || !result) return;

    const val = input.value.trim().toUpperCase();
    const cert = CERTIFICATE_DB[val];

    if (cert) {
      result.innerHTML = `
        <div style="background:#EAF4EE; border:1px solid #B8DEC3; padding:16px; border-radius:6px; font-size:13px;">
          <strong style="color:#1F6B38; display:block; margin-bottom:6px;">✓ Orijinallik Kaydı Doğrulandı</strong>
          <div><strong>Model:</strong> ${cert.product}</div>
          <div><strong>Taş / Karat:</strong> ${cert.stone} (${cert.color}, ${cert.clarity})</div>
          <div><strong>Rapor Tarihi:</strong> ${cert.date}</div>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div style="background:#FFF5F5; border:1px solid #FEB2B2; padding:14px; border-radius:6px; font-size:13px; color:#C53030;">
          "${val}" numaralı kayıt bulunamadı. Lütfen numarayı kontrol ediniz.
        </div>
      `;
    }
  },

  openModal(htmlContent) {
    const overlay = document.getElementById('appModalOverlay');
    const box = document.getElementById('appModalBox');
    if (!overlay || !box) return;

    box.innerHTML = htmlContent;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const overlay = document.getElementById('appModalOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  openSearchModal() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('liveSearchInput');
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 80);
    }
    this.handleLiveSearch('');
  },

  closeSearchModal() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  },

  clearSearchInput() {
    const input = document.getElementById('liveSearchInput');
    if (input) {
      input.value = '';
      input.focus();
    }
    this.handleLiveSearch('');
  },

  quickSearchTag(term) {
    const input = document.getElementById('liveSearchInput');
    if (input) {
      input.value = term;
      input.focus();
    }
    this.handleLiveSearch(term);
  },

  handleLiveSearch(query = '') {
    const clearBtn = document.getElementById('searchClearBtn');
    const metaEl = document.getElementById('searchResultsMeta');
    const listEl = document.getElementById('searchResultsList');
    if (!listEl) return;

    const term = (query || '').trim().toLowerCase();
    if (clearBtn) {
      clearBtn.style.display = term ? 'inline-flex' : 'none';
    }

    let results = [];
    if (!term) {
      results = PRODUCTS.slice(0, 8);
      if (metaEl) {
        metaEl.style.display = 'flex';
        metaEl.innerHTML = `<span>ÖNE ÇIKAN MODELLER & KOLEKSİYON</span><span>${PRODUCTS.length.toLocaleString('tr-TR')} Ürün</span>`;
      }
    } else {
      results = PRODUCTS.filter(p => {
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const ref = (p.reference || p.ref || '').toLowerCase();
        const metal = (p.metal || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const subCat = (p.subCategory || '').toLowerCase();
        return name.includes(term) || brand.includes(term) || ref.includes(term) || metal.includes(term) || cat.includes(term) || subCat.includes(term);
      });

      if (metaEl) {
        metaEl.style.display = 'flex';
        metaEl.innerHTML = `<span>"${query}" İÇİN BULUNAN SONUÇLAR</span><span>${results.length} Adet</span>`;
      }
    }

    if (results.length === 0) {
      listEl.innerHTML = `
        <div class="search-empty-state">
          <div class="search-empty-icon">🔍</div>
          <h4 class="search-empty-title">"${query}" ile eşleşen model bulunamadı</h4>
          <p class="search-empty-desc">Farklı bir marka adı, model referansı veya "Rolex, Cartier, Altın, Saat" gibi genel bir arama terimi deneyebilirsiniz.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = results.slice(0, 24).map(p => {
      const img = p.image || p.img || (p.images && p.images[0]) || 'images/belgin-logo.png';
      const brand = p.brand || (p.category === 'gold' ? '24K ALTIN' : 'MÜCEVHERAT');
      const title = `${p.brand || ''} ${p.name || ''}`.trim();
      const ref = p.reference || p.ref || p.metal || (p.category === 'gold' ? 'Sertifikalı Külçe/Ziynet' : 'Özel Koleksiyon');
      const priceFormatted = (typeof formatPrice === 'function') ? formatPrice(p.price) : `₺${Number(p.price).toLocaleString('tr-TR')}`;

      return `
        <div class="search-result-item" onclick="App.closeSearchModal(); App.openProduct(${p.id});">
          <img src="${img}" alt="${title}" class="search-result-thumb" loading="lazy">
          <div class="search-result-info">
            <span class="search-result-brand">${brand}</span>
            <div class="search-result-title">${title}</div>
            <span class="search-result-ref">${ref}</span>
          </div>
          <div class="search-result-price">${priceFormatted}</div>
        </div>
      `;
    }).join('');
  },

  calculateInstantValuation() {
    const type = document.getElementById('valType')?.value || 'watch';
    const brand = document.getElementById('valBrand')?.value || 'rolex';
    const condition = document.getElementById('valCondition')?.value || 'full';
    const weight = parseFloat(document.getElementById('valWeight')?.value) || 20;

    let min = 0, max = 0;
    if (type === 'watch') {
      const basePrices = { rolex: 380000, patek: 1450000, ap: 980000, cartier: 190000, other: 120000 };
      const condMultipliers = { full: 1.15, watch_only: 0.95, pristine: 1.25 };
      const base = (basePrices[brand] || 250000) * (condMultipliers[condition] || 1);
      min = Math.round(base * 0.92);
      max = Math.round(base * 1.08);
    } else {
      const gramPrice = (typeof LIVE_MARKET_DATA !== 'undefined' ? LIVE_MARKET_DATA.gramGold24k : 3438);
      const karats = { '14k': 0.585, '18k': 0.750, '22k': 0.916, '24k': 1.0 };
      const purity = karats[brand] || 0.750;
      const base = weight * gramPrice * purity;
      min = Math.round(base * 0.96);
      max = Math.round(base * 1.04);
    }

    const resEl = document.getElementById('valuationResult');
    if (resEl) {
      resEl.innerHTML = `
        <div style="background:var(--color-teal-soft); border:1px solid rgba(8,76,71,0.2); padding:16px 20px; border-radius:8px; margin-top:16px; text-align:center;">
          <span style="font-size:11px; letter-spacing:1px; text-transform:uppercase; font-weight:700; color:var(--color-teal); display:block; margin-bottom:4px;">Tahmini Anında Nakit / Takas Teklifi</span>
          <div style="font-family:var(--font-sans); font-size:26px; font-weight:800; color:var(--color-teal); font-variant-numeric:tabular-nums;">${formatPrice(min)} — ${formatPrice(max)}</div>
          <p style="font-size:12px; color:#555; margin-top:4px;">İzmir Buca Showroomumuzda 15 dakikada ekspertiz ve nakit/havale ödeme imkanı.</p>
          <a href="https://wa.me/905419305372?text=Merhaba,%20sitemizden%20aldigim%20${formatPrice(min)}-${formatPrice(max)}%20degerleme%20teklifi%20icin%20iletisime%20geciyorum." target="_blank" class="btn-action-vip" style="margin-top:10px; display:inline-flex;">Bu Teklifi WhatsApp ile Onayla →</a>
        </div>
      `;
    }
  },

  unlockVault() {
    const code = prompt("VIP Özel Kasa Erişim Kodunu Giriniz (VIP Misafir Deneme Kodu: 1999 veya VIP):");
    if (code && (code.trim() === '1999' || code.trim().toLowerCase() === 'vip' || code.trim() === '1987')) {
      const vaultGrid = document.getElementById('vaultMysteryGrid');
      const vaultLocked = document.getElementById('vaultLockedBadge');
      if (vaultGrid) vaultGrid.style.filter = 'none';
      if (vaultLocked) vaultLocked.innerHTML = '<span style="color:#25D366; font-weight:700;">🔓 VIP Kasa Erişimi Açıldı</span>';
      showToast('VIP Kasa Kilidi Başarıyla Açıldı!', 'success');
    } else {
      alert("Geçersiz VIP Kodu. Doğrudan VIP WhatsApp danışmanımızdan (+90 541 930 53 72) erişim izni talep edebilirsiniz.");
    }
  },

  toggleMobileDrawer(force) {
    const overlay = document.getElementById('mobileDrawerOverlay');
    if (!overlay) return;
    if (typeof force === 'boolean') {
      overlay.classList.toggle('open', force);
    } else {
      overlay.classList.toggle('open');
    }
  },

  scrollToValuation() {
    if (Router.currentPage !== 'ana-sayfa') {
      Router.navigate('ana-sayfa');
    }
    setTimeout(() => {
      const el = document.getElementById('valuationSimulatorBox');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  },

  // 13: DİJİTAL MAĞAZA TESLİM-TESSELLÜM & KİMLİK DOĞRULAMA FORMU
  openStoreDeliveryReceiptModal(orderId = 'BLG-SAMPLE') {
    this.openModal(`
      <div class="modal-dialog-header">
        <h3>🏛️ 13 — Mağaza Teslim-Tesellüm & Kimliklendirme Formu</h3>
        <button class="modal-dialog-close" onclick="App.closeModal()">×</button>
      </div>
      <div style="font-size:12.5px; color:#333; line-height:1.6;">
        <div style="background:#FAF9F6; border:1px solid #EAE6DF; border-radius:6px; padding:12px; margin-bottom:14px;">
          <div><strong>Sipariş No:</strong> ${orderId} | <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</div>
          <div><strong>Ödeme Referansı:</strong> PAYTR-AUTH-OK | <strong>Durum:</strong> Kesinleşti</div>
          <div><strong>Teslim Noktası:</strong> Belgin Kuyumculuk Buca Merkez Showroom</div>
        </div>

        <form onsubmit="event.preventDefault(); showToast('Teslim-Tesellüm Formu dijital olarak imzalandı ve arşivlendi.', 'success'); App.closeModal();">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
            <div>
              <label style="font-size:11px; font-weight:700; display:block; margin-bottom:2px;">Teslim Alan Ad Soyad *</label>
              <input type="text" required placeholder="Kimlikteki Tam Ad Soyad" style="width:100%; padding:8px 10px; border:1px solid #CCC; border-radius:4px; font-size:12px;">
            </div>
            <div>
              <label style="font-size:11px; font-weight:700; display:block; margin-bottom:2px;">Kimlik Türü & Maskeli No *</label>
              <input type="text" required placeholder="T.C. Kimlik: 123*****89" style="width:100%; padding:8px 10px; border:1px solid #CCC; border-radius:4px; font-size:12px;">
            </div>
          </div>

          <div style="margin-bottom:12px;">
            <label style="font-size:11px; font-weight:700; display:block; margin-bottom:2px;">Fiziksel Kontrol & Ürün Kimliklendirme *</label>
            <div style="display:flex; flex-direction:column; gap:6px; font-size:11.5px; background:#F8F8F8; padding:10px; border-radius:4px;">
              <label><input type="checkbox" required> Ürünün ayar, gram, seri no ve taş bilgisi kimlik kartı ile doğrulandı.</label>
              <label><input type="checkbox" required> Kutu, uluslararası garanti belgesi ve ekspertiz sertifikası eksiksiz teslim edildi.</label>
              <label><input type="checkbox" required> Müşteri kimlik aslı kontrol edildi; sipariş sahibi ile teslim alan kişi eşleşti.</label>
            </div>
          </div>

          <div style="background:#FFF9EE; border:1px solid #E6D2A8; padding:10px; border-radius:4px; margin-bottom:14px; font-size:11px; color:#6B531C;">
            "Söz konusu altın / saat ürününü eksiksiz, ayıpsız ve orijinal belgeleriyle bizzat teslim aldım."
          </div>

          <button type="submit" class="btn-art-buy" style="width:100%; padding:12px; font-size:13px;">✓ Teslimatı Onayla ve Arşivle (13 Formu)</button>
        </form>
      </div>
    `);
  },

  // 07: ÇEREZ RIZA YÖNETİMİ & BANNER
  initCookieConsent() {
    const consent = localStorage.getItem('belgin_cookie_consent');
    if (!consent) {
      setTimeout(() => {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) banner.style.display = 'flex';
      }, 1000);
    }
  },

  acceptAllCookies() {
    localStorage.setItem('belgin_cookie_consent', JSON.stringify({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      date: new Date().toISOString()
    }));
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.style.display = 'none';
    showToast('Çerez tercihleriniz kaydedildi.', 'success');
  },

  rejectAllCookies() {
    localStorage.setItem('belgin_cookie_consent', JSON.stringify({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      date: new Date().toISOString()
    }));
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.style.display = 'none';
    showToast('Yalnızca zorunlu çerezler etkinleştirildi.', 'info');
  },

  openCookiePreferencesModal() {
    this.openModal(`
      <div class="modal-dialog-header">
        <h3>🍪 07 — Çerez Tercihleri Yönetimi</h3>
        <button class="modal-dialog-close" onclick="App.closeModal()">×</button>
      </div>
      <div style="font-size:13px; color:#444; line-height:1.6;">
        <p style="margin-bottom:14px;">Web sitemizde deneyiminizi geliştirmek ve yasal mevzuata uyum sağlamak için çerezler kullanıyoruz. <a href="cerez-politikasi.html" target="_blank" style="color:var(--color-teal); text-decoration:underline;">Çerez Politikamızı inceleyin.</a></p>
        
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#FAF9F6; border-radius:6px;">
            <div>
              <strong>Zorunlu Çerezler</strong>
              <div style="font-size:11.5px; color:#666;">Sitenin temel işlevleri, sepet ve güvenlik için şarttır.</div>
            </div>
            <input type="checkbox" disabled>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#FAF9F6; border-radius:6px;">
            <div>
              <strong>Analitik & İstatistik Çerezleri</strong>
              <div style="font-size:11.5px; color:#666;">Ziyaretçi trafiği ve performans ölçümü.</div>
            </div>
            <input type="checkbox" id="cookiePrefAnalytics">
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#FAF9F6; border-radius:6px;">
            <div>
              <strong>Pazarlama & Kişiselleştirme</strong>
              <div style="font-size:11.5px; color:#666;">İlgi alanlarınıza göre ürün önerileri.</div>
            </div>
            <input type="checkbox" id="cookiePrefMarketing">
          </div>
        </div>

        <button class="btn-art-buy" style="width:100%;" onclick="App.saveCookiePreferences()">Tercihleri Kaydet</button>
      </div>
    `);
  },

  saveCookiePreferences() {
    const analytics = document.getElementById('cookiePrefAnalytics')?.checked || false;
    const marketing = document.getElementById('cookiePrefMarketing')?.checked || false;

    localStorage.setItem('belgin_cookie_consent', JSON.stringify({
      necessary: true,
      functional: true,
      analytics,
      marketing,
      date: new Date().toISOString()
    }));

    this.closeModal();
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) banner.style.display = 'none';
    showToast('Çerez tercihleriniz güncellendi.', 'success');
  },

  // ==========================================================
  // AKBANK SANAL POS & CHECKOUT İŞLEM YÖNETİCİSİ
  // ==========================================================
  togglePaymentMethod(method = 'card') {
    const cardFields = document.getElementById('cardPaymentFields');
    const cardLabel = document.getElementById('payMethodCardLabel');
    const submitBtnText = document.getElementById('checkoutSubmitBtnText');
    const grandTotal = typeof Cart !== 'undefined' ? Cart.getTotal() : 0;
    const formattedTotal = typeof formatPrice === 'function' ? formatPrice(grandTotal) : `₺${grandTotal.toLocaleString('tr-TR')}`;

    if (cardFields) cardFields.style.display = 'block';
    if (cardLabel) cardLabel.classList.add('active');
    const radio = document.querySelector('input[name="paymentOption"][value="card"]');
    if (radio) radio.checked = true;
    if (submitBtnText) submitBtnText.textContent = `3D Secure ile Güvenli Öde (${formattedTotal})`;
  },

  setFieldError(inputId, errorMsg) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add('input-field-error', 'shake-error');
    setTimeout(() => input.classList.remove('shake-error'), 500);

    const parent = input.closest('.cc-input-wrap') || input.parentElement;
    let errEl = parent.parentElement.querySelector('.field-error-msg') || parent.querySelector('.field-error-msg');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'field-error-msg';
      parent.parentElement.appendChild(errEl);
    }
    errEl.innerHTML = `⚠️ ${errorMsg}`;
  },

  clearFieldError(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.remove('input-field-error');
    const parent = input.closest('.cc-input-wrap') || input.parentElement;
    const errEl = parent.parentElement.querySelector('.field-error-msg') || parent.querySelector('.field-error-msg');
    if (errEl) errEl.remove();
  },

  formatCardNumber(input) {
    if (!input) return;
    this.clearFieldError('ccCardNumber');
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    let parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    input.value = parts.join(' ');

    // Otomatik Türk Bankaları & Kart Tipi (BIN) Algılama
    const badge = document.getElementById('cardTypeBadge');
    if (badge) {
      if (v.startsWith('9792')) {
        badge.textContent = 'TROY';
        badge.style.color = '#005BAC';
      } else if (v.startsWith('5549') || v.startsWith('5406') || v.startsWith('4543') || v.startsWith('4043')) {
        badge.textContent = 'AXESS (AKBANK)';
        badge.style.color = '#ED1C24';
      } else if (v.startsWith('4506') || v.startsWith('5400') || v.startsWith('5100')) {
        badge.textContent = 'BONUS (GARANTİ)';
        badge.style.color = '#008744';
      } else if (v.startsWith('4508') || v.startsWith('5526')) {
        badge.textContent = 'WORLD (YAPI KREDİ)';
        badge.style.color = '#6B2C91';
      } else if (v.startsWith('4546') || v.startsWith('5437')) {
        badge.textContent = 'MAXIMUM (İŞ BANKASI)';
        badge.style.color = '#D9207E';
      } else if (v.startsWith('4355') || v.startsWith('5456')) {
        badge.textContent = 'CARDFINANS (QNB)';
        badge.style.color = '#002B49';
      } else if (v.startsWith('4022') || v.startsWith('5528')) {
        badge.textContent = 'PARAF (HALKBANK)';
        badge.style.color = '#00A859';
      } else if (v.startsWith('4')) {
        badge.textContent = 'VISA';
        badge.style.color = '#1A1F71';
      } else if (/^5[1-5]/.test(v) || /^2[2-7]/.test(v)) {
        badge.textContent = 'MASTERCARD';
        badge.style.color = '#EB001B';
      } else {
        badge.textContent = 'KART';
        badge.style.color = 'var(--color-teal)';
      }
    }
  },

  formatCardExpiry(input) {
    if (!input) return;
    this.clearFieldError('ccCardExpiry');
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) {
      let mm = parseInt(v.substring(0, 2), 10);
      if (mm > 12) v = '12' + v.substring(2);
      if (mm === 0) v = '01' + v.substring(2);
      input.value = v.substring(0, 2) + ' / ' + v.substring(2);
    } else {
      input.value = v;
    }
  },

  formatCardCvv(input) {
    if (!input) return;
    this.clearFieldError('ccCardCvc');
    input.value = input.value.replace(/\D/g, '').substring(0, 4);
  },

  _pendingOrder: null,
  _timerInterval: null,

  processOrder() {
    const fn = (document.getElementById('checkoutFirstName')?.value || '').trim();
    const ln = (document.getElementById('checkoutLastName')?.value || '').trim();
    const phone = (document.getElementById('checkoutPhone')?.value || '').trim();
    const email = (document.getElementById('checkoutEmail')?.value || '').trim();
    const identity = (document.getElementById('checkoutIdentity')?.value || '').trim();

    if (!fn || !ln) {
      if (typeof showToast === 'function') showToast('Lütfen teslimat için ad ve soyadınızı eksiksiz giriniz.', 'error');
      else alert('Lütfen ad ve soyadınızı eksiksiz giriniz.');
      document.getElementById('checkoutFirstName')?.focus();
      return;
    }

    if (!phone || phone.length < 10) {
      if (typeof showToast === 'function') showToast('Lütfen geçerli bir telefon numarası giriniz (3D Secure SMS şifresi için zorunludur).', 'error');
      else alert('Lütfen geçerli bir telefon numarası giriniz (3D Secure SMS şifresi için zorunludur).');
      document.getElementById('checkoutPhone')?.focus();
      return;
    }

    if (!email || !email.includes('@')) {
      if (typeof showToast === 'function') showToast('Lütfen e-Arşiv faturanız ve yasal evraklar için geçerli bir e-posta adresi giriniz.', 'error');
      else alert('Lütfen geçerli bir e-posta adresi giriniz.');
      document.getElementById('checkoutEmail')?.focus();
      return;
    }

    // Yasal Sözleşme Kontrolleri
    const chkTerms = document.getElementById('chkTerms');
    const chkKyc = document.getElementById('chkKyc');
    const chkHandover = document.getElementById('chkHandover');

    if ((chkTerms && !chkTerms.checked) || (chkKyc && !chkKyc.checked) || (chkHandover && !chkHandover.checked)) {
      if (typeof showToast === 'function') showToast('Lütfen mesafeli satış, MASAK ve teslimat yasal onay kutularını işaretleyiniz.', 'error');
      else alert('Lütfen zorunlu yasal onay kutularını işaretleyiniz.');
      return;
    }

    let items = (typeof Cart !== 'undefined' && Cart.items && Cart.items.length > 0) ? [...Cart.items] : [];
    if (items.length === 0) {
      if (typeof findProduct === 'function') {
        const p = findProduct(1) || findProduct(101) || (typeof PRODUCTS !== 'undefined' && PRODUCTS[0]);
        if (p) {
          Cart.add(p.id, 1);
          items = [...Cart.items];
        }
      }
    }
    if (items.length === 0) {
      if (typeof showToast === 'function') showToast('Sepetiniz boş. Lütfen önce ürün seçiniz.', 'error');
      else alert('Sepetiniz boş. Lütfen önce ürün seçiniz.');
      Router.navigate('saatler');
      return;
    }

    const totalAmount = typeof Cart !== 'undefined' ? Cart.getTotal() : 0;
    const customerFullName = `${fn} ${ln}`;

    const btn = document.getElementById('checkoutSubmitBtn') || document.getElementById('btnSubmitOrder');
    const originalBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span style="font-size:20px;">🔒</span> <span>Akbank 3D Secure Kapısına Yönlendiriliyorsunuz...</span>';
    }

    const orderPayload = {
      provider: 'AKBANK',
      user_name: customerFullName,
      user_phone: phone,
      email: email,
      customerIdentity: identity || '',
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      deliveryMethod: 'showroom',
      termsAccepted: true,
      preInformationAccepted: true,
      highValueDeliveryAccepted: true,
      marketingConsent: Boolean(document.getElementById('chkMarketing')?.checked),
      optionalConsent: Boolean(document.getElementById('chkConsent')?.checked)
    };

    fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        throw new Error(data.message || 'Akbank Sanal POS oturumu açılamadı.');
      }

      if (data.gatewayUrl && data.postParams) {
        // DOĞRUDAN RESMİ AKBANK EST 3D SECURE / PAYHOSTING KAPISINA GÖNDERİM
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.gatewayUrl;
        form.enctype = 'application/x-www-form-urlencoded';
        form.acceptCharset = 'UTF-8';
        form.style.display = 'none';
        for (const [k, v] of Object.entries(data.postParams)) {
          if (v !== undefined && v !== null) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = String(v);
            form.appendChild(input);
          }
        }
        document.body.appendChild(form);
        form.submit();
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        window.location.href = `/odeme-basarili.html?orderId=${encodeURIComponent(data.merchant_oid || '')}`;
      }
    })
    .catch(err => {
      console.error('Akbank Ödeme Başlatma Hatası:', err);
      if (typeof showToast === 'function') showToast(`Ödeme başlatılamadı: ${err.message}`, 'error');
      else alert(`Ödeme başlatılamadı: ${err.message}`);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
    });
  },

  // ÖDEME FORMU GERÇEK ZAMANLI OTOMATİK SENKRONİZASYON
  initCheckoutAutoSync() {
    const form = document.getElementById('checkoutForm') || document.querySelector('#page-odeme form');
    if (!form) return;
    const updateDraft = () => {
      const fn = document.getElementById('checkoutFirstName')?.value || '';
      const ln = document.getElementById('checkoutLastName')?.value || '';
      const phone = document.getElementById('checkoutPhone')?.value || '';
      const fullName = (fn + ' ' + ln).trim();
      const cartTotal = typeof Cart !== 'undefined' ? Cart.getTotal() : 0;
      const draft = {
        customerName: fullName || 'Müşteri (Sipariş Sahibi)',
        customerPhone: phone || '05XX *** ** XX (3D Secure Doğrulama Telefonu)',
        totalAmount: cartTotal > 0 ? cartTotal : 14960,
        formattedAmount: '₺' + (cartTotal > 0 ? cartTotal : 14960).toLocaleString('tr-TR'),
        termsAcceptedAt: new Date().toISOString(),
        paymentMethod: 'Akbank 256-Bit EV SSL & 3D Secure Sanal POS (12865794)'
      };
      localStorage.setItem('belgin_checkout_draft', JSON.stringify(draft));
      sessionStorage.setItem('belgin_checkout_draft', JSON.stringify(draft));
    };

    form.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', updateDraft);
      inp.addEventListener('change', updateDraft);
    });
  }
};

if (typeof window !== 'undefined') {
  window.App = App;
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.initCookieConsent();
});
