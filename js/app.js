// ==========================================================
// BELGIN — LÜKS SAAT & MÜCEVHERAT (EST. 1987)
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

    // Canlı Altın & Döviz Kurlarını Başlat
    if (typeof fetchLiveMarketRates === 'function') {
      fetchLiveMarketRates();
      setInterval(fetchLiveMarketRates, 45000);
    }

    // Header Dropdown Otomatik Kapanma Dinleyicisi
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-dropdown-menu a') || e.target.closest('.nav-sub-brand-item') || e.target.closest('.nav-dropdown-single-item')) {
        this.closeNavDropdowns();
      }
    });

    const hash = location.hash.replace('#', '');
    if (hash && document.getElementById('page-' + hash)) {
      Router.navigate(hash, false);
    } else {
      Router.navigate('ana-sayfa', false);
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
        this.renderWatches(options.filter || this.currentWatchBrand || 'all');
        break;
      case 'mucevherat':
        this.renderJewellery(options.filter || 'all');
        break;
      case 'ikinci-el':
        this.renderPreOwned(options.filter || this.currentPreOwnedCategory || 'all');
        break;
      case 'sepet':
        this.renderCart();
        break;
      case 'odeme':
        this.renderCart();
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
  PAGE_SIZE: 30,

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

    // Yeni Eklenen Saatler (Sayfa Başına 30 Ürün)
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

    // Yeni Eklenen Mücevherler
    const homeJewelryEl = document.getElementById('homeJewelryGrid');
    if (homeJewelryEl) {
      homeJewelryEl.innerHTML = JEWELLERY.map(p => this.renderProductCard(p)).join('');
    }

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

  // ANA SAYFA SAAT SAYFALAMA (EN FAZLA 30 ÜRÜN)
  renderHomeWatches(page = 1) {
    this.homeWatchPage = page;
    const el = document.getElementById('homeWatchesGrid');
    const pagEl = document.getElementById('homeWatchesPagination');
    if (!el) return;

    const total = WATCHES.length;
    const start = (page - 1) * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const pageItems = WATCHES.slice(start, end);

    el.innerHTML = pageItems.map(p => this.renderProductCard(p)).join('');

    if (pagEl) {
      pagEl.innerHTML = this.buildPaginationHtml(page, total, this.PAGE_SIZE, 'App.changeHomeWatchPage');
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

  // 2. TÜM SAATLER SAYFASI (12.000 TL ve Üzeri Saat Modelleri - 30 Ürün Sayfalama)
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
  renderPreOwned(filter = 'all') {
    this.currentPreOwnedCategory = filter;
    const el = document.getElementById('allPreOwnedGrid');
    if (!el) return;
    let items = PRE_OWNED_ITEMS;
    if (filter === 'jewelry') items = PRE_OWNED_ITEMS.filter(p => p.category === 'jewelry');
    else if (filter === 'watch') items = PRE_OWNED_ITEMS.filter(p => p.category === 'watch');
    else if (filter && filter !== 'all') {
      items = PRE_OWNED_ITEMS.filter(p => p.brand.toLowerCase().includes(filter.toLowerCase()) || p.category === filter);
    }
    el.innerHTML = items.map(p => this.renderProductCard(p)).join('');

    // Update filter pill UI
    document.querySelectorAll('.preowned-filter-btn').forEach(b => {
      b.classList.remove('active');
      const txt = b.textContent.trim().toLowerCase();
      if ((filter === 'all' || !filter) && txt.includes('tümü')) b.classList.add('active');
      else if (filter === 'jewelry' && txt.includes('mücevher')) b.classList.add('active');
      else if (filter === 'watch' && txt.includes('saat')) b.classList.add('active');
    });
  },

  filterPreOwnedCategory(cat = 'all', btn = null) {
    this.currentPreOwnedCategory = cat;
    if (Router.currentPage !== 'ikinci-el') {
      Router.navigate('ikinci-el', true, { filter: cat });
    } else {
      this.renderPreOwned(cat);
    }
    if (btn) {
      document.querySelectorAll('.preowned-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    setTimeout(() => {
      const target = document.querySelector('#page-ikinci-el .section-header-flex') || document.getElementById('allPreOwnedGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 60);
  },

  // 4. TÜM MÜCEVHERLER SAYFASI (Tüm ürünler İkinci El sayfasına taşındı)
  renderJewellery() {
    const el = document.getElementById('allJewelleryGrid');
    if (el) {
      el.innerHTML = `
        <div class="empty-category-notice" style="grid-column: 1 / -1; text-align: center; padding: 60px 24px; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; margin: 20px 0;">
          <div style="font-size: 36px; margin-bottom: 12px;">💎</div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 22px; color: var(--color-ink); margin-bottom: 8px;">Tüm Mücevherlerimiz İkinci El Koleksiyonumuzda</h3>
          <p style="color: var(--color-muted); max-width: 480px; margin: 0 auto 20px; font-size: 14px; line-height: 1.6;">24 parçalık Cartier Juste un Clou altın ve pırlantalı mücevher koleksiyonumuzun tamamı İkinci El vitrinimize taşınmıştır.</p>
          <a href="#" data-page="ikinci-el" onclick="setTimeout(() => { const btn = document.querySelectorAll('.preowned-filter-btn')[1]; if (btn) App.filterPreOwnedCategory('jewelry', btn); }, 100)" class="btn-action-vip" style="display: inline-flex; padding: 12px 28px;">İkinci El Mücevherleri İncele (24 Parça) →</a>
        </div>
      `;
    }
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

    return `
      <div class="product-art-card" onclick="App.openProduct(${p.id})">
        <div class="product-art-thumb">
          <img class="img-primary" src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy">
          <img class="img-hover" src="${hoverImg}" alt="${p.brand} ${p.name}" loading="lazy">
        </div>
        <div class="product-art-info">
          <h3 class="prod-brand-name">${p.brand}</h3>
          <p class="prod-model-name">${p.name}</p>
          <p class="prod-ref-size">${p.reference}</p>
          <div class="prod-price-tag">${formatPrice(p.price)}</div>
        </div>
      </div>
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

    panel.innerHTML = `
      <button class="drawer-close-btn" onclick="App.closeQuickDrawer()">×</button>
      
      <div style="background:var(--color-pedestal); border-radius:var(--radius-md); overflow:hidden; width:100%; padding-top:100%; position:relative; margin-bottom:20px;">
        <img src="${p.image}" alt="${p.brand} ${p.name}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; padding:16px;">
      </div>

      <span style="font-size:11px; letter-spacing:2px; color:var(--color-gold-dark); font-weight:700; text-transform:uppercase;">${p.brand}</span>
      <h3 style="font-family:var(--font-sans); font-size:24px; font-weight:700; color:var(--color-ink); margin:4px 0 6px;">${p.name}</h3>
      <p style="font-size:13px; color:var(--color-muted); margin-bottom:16px;">${p.reference}</p>
      
      <div style="font-family:var(--font-sans); font-size:26px; font-weight:800; color:var(--color-teal); font-variant-numeric:tabular-nums; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--color-border);">
        ${formatPrice(p.price)}
      </div>

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
      ` : ''}

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
  openProduct(id) {
    const p = findProduct(id);
    if (!p) return;

    const container = document.getElementById('productDetailView');
    if (!container) return;

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

    // Taksit Seçenekleri Matrisi
    const installments = [
      { name: 'Peşin Fiyatına', installments: [
        { month: 2, amount: Math.round(p.price / 2), total: p.price },
        { month: 3, amount: Math.round(p.price / 3), total: p.price }
      ]},
      { name: 'Vade Farklı Taksitler', installments: [
        { month: 6, amount: Math.round((p.price * 1.08) / 6), total: Math.round(p.price * 1.08) },
        { month: 9, amount: Math.round((p.price * 1.14) / 9), total: Math.round(p.price * 1.14) },
        { month: 12, amount: Math.round((p.price * 1.19) / 12), total: Math.round(p.price * 1.19) }
      ]}
    ];

    // İlgili Ürünler (Aynı markadan veya kategoriden 4 model)
    const allProds = typeof getAllProducts === 'function' ? getAllProducts() : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    const relatedProducts = allProds.filter(x => x.id !== p.id && (x.brand === p.brand || x.category === p.category)).slice(0, 4);

    container.innerHTML = `
      <div class="pdp-page-container">
        
        <!-- 1. Breadcrumbs -->
        <nav class="pdp-breadcrumbs" aria-label="Breadcrumb">
          <a href="#" data-page="ana-sayfa">Ana Sayfa</a>
          <span class="pdp-separator">/</span>
          <a href="#" data-page="saatler">Lüks Saatler</a>
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
              <span>Kategori: <strong>${p.subCategory || 'Lüks Saat'}</strong></span>
            </div>

            <!-- Fiyat Kutusu -->
            <div class="pdp-price-wrap">
              <div class="pdp-price-header">
                ${hasDiscount ? `<span class="pdp-old-price">${formatPrice(p.oldPrice)}</span>` : ''}
                <span class="pdp-current-price">${formatPrice(p.price)}</span>
                ${hasDiscount ? `<span class="pdp-discount-badge">-%${discountPercent} İNDİRİM</span>` : ''}
              </div>
              <div class="pdp-installment-banner">
                <span>💳 Vade farksız 3 taksit: <strong>3 x ${formatPrice(monthlyInstallment)}</strong></span>
                <span style="color:#888; font-weight:normal; font-size:12px;">(Tüm kartlara 12 taksit imkanı)</span>
              </div>
            </div>

            <!-- 5'li Hızlı Özet Teknik Çipler (Saat&Saat Standartı) -->
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
              <div class="pdp-spec-pill">
                <span class="pdp-spec-pill-icon">🎨</span>
                <div>
                  <span class="pdp-spec-pill-label">Kordon</span>
                  <span class="pdp-spec-pill-val">${specs['Kordon / Kayış'] || 'Paslanmaz Çelik'}</span>
                </div>
              </div>
            </div>

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
            <div class="pdp-trust-box">
              <div class="pdp-trust-item">
                <span class="pdp-trust-item-icon">🛡️</span>
                <div class="pdp-trust-item-text">
                  <strong>2 Yıl Distribütör Garantisi</strong>
                  <span>Orijinal kutusu, garanti belgesi ve faturalı teslimat.</span>
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

          </div>
        </div>

        <!-- 3. Alt Sekmeler (Detaylar, Teknik Özellikler, Taksit, Teslimat) -->
        <div class="pdp-tabs-container">
          <div class="pdp-tabs-nav" role="tablist">
            <button class="pdp-tab-btn active" onclick="App.switchPdpTab('tab-details', this)" role="tab">
              <span>📋 Ürün Detayları</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-specs', this)" role="tab">
              <span>⚙️ Teknik Özellikler Tablosu</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-installments', this)" role="tab">
              <span>💳 Taksit Seçenekleri</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-delivery', this)" role="tab">
              <span>🚚 Teslimat, Güvenlik & İade Koşulları</span>
            </button>
          </div>

          <!-- SEKME 1: Ürün Detayları -->
          <div id="tab-details" class="pdp-tab-pane active" role="tabpanel">
            <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14.5px;">
              <h2 style="font-size:20px; font-weight:700; color:var(--color-ink); margin-bottom:16px;">
                ${p.brand} ${p.name} Ürün Bilgisi ve Tasarım Detayları
              </h2>
              <p style="margin-bottom:16px;">
                ${p.description || p.desc}
              </p>
              <div style="background:#FBF9F5; border-left:4px solid var(--color-teal); padding:16px 20px; margin:20px 0; border-radius:0 6px 6px 0;">
                <strong style="color:var(--color-teal); display:block; margin-bottom:4px; font-size:14px;">Belgin Kuyumculuk & Saat Distribütörlük Taahhüdü:</strong>
                Sitemizde ve Buca showroomumuzda yer alan tüm <strong>${p.brand}</strong> saat modelleri %100 orijinal, resmi distribütör ithalatı ve 2 yıl garantilidir. Siparişiniz seri numarası kayıtlı garanti belgesi, orijinal kutusu ve kaşeli sertifikasıyla eksiksiz teslim edilmektedir.
              </div>
              <h3 style="font-size:16px; font-weight:700; color:var(--color-ink); margin:24px 0 10px;">Kutu İçeriği:</h3>
              <ul style="padding-left:20px; margin-bottom:16px; display:flex; flex-direction:column; gap:6px;">
                <li>Orijinal ${p.brand} Lüks Saat Kutusu ve Koruma Ambalajı</li>
                <li>Türkiye Distribütörü Onaylı ve Kaşeli Garanti Belgesi</li>
                <li>Türkçe Kullanım Kılavuzu ve Mekanizma Bakım Kartı</li>
                <li>Belgin Kuyumculuk Satış Faturası ve Yetkili Belgesi</li>
              </ul>
            </div>
          </div>

          <!-- SEKME 2: 6 Kategorili Teknik Özellikler Tablosu (Saat&Saat Standartı) -->
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
                  <div class="pdp-spec-key">Klips</span><span class="pdp-spec-value">Kelebek / Emniyetli Toka</span></div>
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

          <!-- SEKME 3: Taksit Seçenekleri Tablosu -->
          <div id="tab-installments" class="pdp-tab-pane" role="tabpanel">
            <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:24px; overflow-x:auto;">
              <p style="font-size:13.5px; color:var(--color-muted); margin-bottom:16px;">
                Tüm bankaların kredi kartlarına (Bonus, World, Axess, Maximum, CardFinans, Paraf, Advantage) peşin fiyatına veya vade farklı 12 aya varan taksit seçenekleri:
              </p>
              <table class="pdp-installment-table">
                <thead>
                  <tr>
                    <th>Taksit Sayısı</th>
                    <th>Aylık Taksit Tutarı</th>
                    <th>Toplam Tutar</th>
                    <th>Vade Farkı</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Tek Çekim (Peşin)</strong></td>
                    <td><strong>${formatPrice(p.price)}</strong></td>
                    <td>${formatPrice(p.price)}</td>
                    <td><span style="color:#15803D; font-weight:700;">Vade Farksız</span></td>
                  </tr>
                  <tr>
                    <td><strong>2 Taksit</strong></td>
                    <td><strong>${formatPrice(Math.round(p.price / 2))}</strong></td>
                    <td>${formatPrice(p.price)}</td>
                    <td><span style="color:#15803D; font-weight:700;">Vade Farksız</span></td>
                  </tr>
                  <tr style="background:#F4FAF6;">
                    <td><strong>3 Taksit (Tavsiye Edilen)</strong></td>
                    <td><strong style="color:var(--color-teal);">${formatPrice(Math.round(p.price / 3))}</strong></td>
                    <td>${formatPrice(p.price)}</td>
                    <td><span style="color:#15803D; font-weight:700;">Vade Farksız (0 TL)</span></td>
                  </tr>
                  <tr>
                    <td>6 Taksit</td>
                    <td>${formatPrice(Math.round((p.price * 1.08) / 6))}</td>
                    <td>${formatPrice(Math.round(p.price * 1.08))}</td>
                    <td>+%8 Banka Komisyonu</td>
                  </tr>
                  <tr>
                    <td>9 Taksit</td>
                    <td>${formatPrice(Math.round((p.price * 1.14) / 9))}</td>
                    <td>${formatPrice(Math.round(p.price * 1.14))}</td>
                    <td>+%14 Banka Komisyonu</td>
                  </tr>
                  <tr>
                    <td>12 Taksit</td>
                    <td>${formatPrice(Math.round((p.price * 1.19) / 12))}</td>
                    <td>${formatPrice(Math.round(p.price * 1.19))}</td>
                    <td>+%19 Banka Komisyonu</td>
                  </tr>
                </tbody>
              </table>
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
                <li>Teslimat sırasında sipariş sahibinin geçerli T.C. Kimlik Kartı veya Pasaportunu ibraz etmesi zorunludur.</li>
                <li>Ürün teslimi, ödemenin banka ve PayTR altyapısı üzerinden kesinleşmiş olarak onaylanmasının ardından gerçekleştirilir.</li>
                <li>Ürün, sipariş sahibi dışında üçüncü kişilere veya telefon/mesaj talimatıyla teslim edilmez.</li>
              </ul>

              <h3 style="font-size:18px; font-weight:700; color:var(--color-ink); margin:24px 0 14px;">
                ⚖️ Yasal Cayma, İade ve Değişim Koşulları (04)
              </h3>
              <p style="margin-bottom:12px;">
                6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca kanuni haklarınız tam güvence altındadır:
              </p>
              <ul style="padding-left:20px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">
                <li>Kişiselleştirme (gravür, özel kordon kısaltma) yapılmamış orijinal saat ürünlerinde yasal süreler dahilinde cayma hakkı kullanılabilir.</li>
                <li>Fiyatı uluslararası finansal piyasalardaki anlık dalgalanmalara bağlı olan masif altın ve ziynet ürünlerinde mevzuat gereği cayma hakkı istisnası geçerlidir.</li>
                <li>Ayıplı mala ilişkin tüketici kanunu hakları saklıdır.</li>
              </ul>
            </div>
          </div>

        </div>

        <!-- 4. İlgili Modeller & Benzer Marka Ürünleri (Related Products Slider) -->
        ${relatedProducts.length > 0 ? `
          <div style="margin-top:70px;">
            <div class="section-header-flex" style="margin-bottom:24px;">
              <div>
                <span style="font-size:11px; letter-spacing:2px; text-transform:uppercase; font-weight:700; color:var(--color-teal); display:block; margin-bottom:4px;">İlginizi Çekebilir</span>
                <h3 style="font-family:var(--font-sans); font-size:24px; font-weight:700; color:var(--color-ink);">Benzer ${p.brand} & Lüks Modeller</h3>
              </div>
              <a href="#" onclick="App.filterWatchesByBrand('${p.brand}', null)" style="font-size:13.5px; font-weight:700; color:var(--color-teal); text-decoration:none;">Tüm ${p.brand} Modellerini Gör →</a>
            </div>
            <div class="products-grid-4">
              ${relatedProducts.map(rel => this.renderProductCard(rel)).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;

    Router.navigate('urun', false);
    if (history.pushState) {
      history.pushState(null, '', '#urun-' + p.id);
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
    const q = prompt("Saat, Altın veya Mücevher Arayın (Örn: Rolex, Cartier, Altın, Tektaş):");
    if (!q || !q.trim()) return;

    const term = q.toLowerCase().trim();
    const found = PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.brand.toLowerCase().includes(term) ||
      p.reference.toLowerCase().includes(term) ||
      (p.metal && p.metal.toLowerCase().includes(term))
    );

    if (found.length > 0) {
      this.openProduct(found[0].id);
    } else {
      alert(`"${q}" ile eşleşen model bulunamadı.`);
    }
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
              <label><input type="checkbox" required checked> Ürünün ayar, gram, seri no ve taş bilgisi kimlik kartı ile doğrulandı.</label>
              <label><input type="checkbox" required checked> Kutu, uluslararası garanti belgesi ve ekspertiz sertifikası eksiksiz teslim edildi.</label>
              <label><input type="checkbox" required checked> Müşteri kimlik aslı kontrol edildi; sipariş sahibi ile teslim alan kişi eşleşti.</label>
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
            <input type="checkbox" checked disabled>
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

  processOrder() {
    const isHighVal = Cart.items.some(i => (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(i) : i.price > 12000));
    
    const orderAudit = {
      orderId: 'BLG-' + Math.floor(100000 + Math.random() * 900000),
      items: [...Cart.items],
      totalAmount: Cart.getTotal(),
      isHighValueSecureDelivery: isHighVal,
      termsAccepted: true,
      termsVersion: "2026.08.25.v1",
      termsAcceptedAt: new Date().toISOString(),
      kycProtocolAccepted: Boolean(document.getElementById('chkKyc')?.checked),
      handoverFormAccepted: Boolean(document.getElementById('chkHandover')?.checked),
      marketingConsent: Boolean(document.getElementById('chkMarketing')?.checked),
      marketingConsentChannels: document.getElementById('chkMarketing')?.checked ? ['SMS', 'EMAIL'] : [],
      privacyNoticeAcknowledged: true,
      optionalConsent: Boolean(document.getElementById('chkConsent')?.checked),
      deliveryProtocolVersion: "03_v1",
      kycStatus: "pendingVerification",
      deliveryFormStatus: "pendingStoreSignature"
    };

    localStorage.setItem('last_order_audit', JSON.stringify(orderAudit));

    alert(`Siparişiniz (#${orderAudit.orderId}) başarıyla alındı!\n\nE-Arşiv faturanız ve mağaza teslimat onay kodunuz SMS olarak telefonunuza iletilmiştir.\n12.000 TL üzeri ürününüzü Buca Showroom mağazamızdan kimlik ibrazı ve imza ile teslim alabilirsiniz.`);
    Cart.clear();
    this.updateHeaderCartCount();
    Router.navigate('ana-sayfa');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.initCookieConsent();
});
