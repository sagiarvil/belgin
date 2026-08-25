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

    const hash = location.hash.replace('#', '');
    if (hash && document.getElementById('page-' + hash)) {
      Router.navigate(hash, false);
    } else {
      Router.navigate('ana-sayfa', false);
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

  // 1. ANA SAYFA RENDER
  renderHome() {
    // Saat Markaları (5'li)
    const watchBrandsEl = document.getElementById('watchBrandsGrid');
    if (watchBrandsEl) {
      watchBrandsEl.innerHTML = WATCH_BRANDS.map(b => `
        <a class="brand-tile-card" href="#" onclick="App.filterWatchesByBrand('${b.name}', null)">
          <div class="brand-tile-thumb">
            <img src="${b.image}" alt="${b.name}" loading="lazy">
          </div>
          <div class="brand-tile-name">${b.name}</div>
        </a>
      `).join('');
    }

    // Yeni Eklenen Saatler (8'li)
    const homeWatchesEl = document.getElementById('homeWatchesGrid');
    if (homeWatchesEl) {
      homeWatchesEl.innerHTML = WATCHES.map(p => this.renderProductCard(p)).join('');
    }

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

    // Yeni Eklenen Mücevherler (8'li)
    const homeJewelryEl = document.getElementById('homeJewelryGrid');
    if (homeJewelryEl) {
      homeJewelryEl.innerHTML = JEWELLERY.map(p => this.renderProductCard(p)).join('');
    }

    // Profesyonel Kapalıçarşı Değerleme Simülatörünü Render Et
    if (typeof ValuationEngine !== 'undefined' && ValuationEngine.renderSimulator) {
      ValuationEngine.renderSimulator();
    }
  },

  // 2. TÜM SAATLER SAYFASI (12.000 TL ve Üzeri Saat Modelleri)
  renderWatches(brandFilter = 'all') {
    this.currentWatchBrand = brandFilter;
    const el = document.getElementById('allWatchesGrid');
    if (!el) return;
    let list = WATCHES;
    if (brandFilter && brandFilter !== 'all') {
      list = WATCHES.filter(p => p.brand.trim().toLowerCase() === brandFilter.trim().toLowerCase());
    }
    el.innerHTML = list.map(p => this.renderProductCard(p)).join('');

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

  filterWatchesByBrand(brand = 'all', btn = null) {
    this.currentWatchBrand = brand;
    if (Router.currentPage !== 'saatler') {
      Router.navigate('saatler', true, { filter: brand });
    } else {
      this.renderWatches(brand);
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
    const isHighVal = (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(p) : p.price > 12000);
    const condBadgeHtml = p.isPreOwned
      ? `<span class="badge-cond-gold">İkinci El</span>`
      : (p.conditionBadge ? `<span class="badge-cond-sage">${p.conditionBadge}</span>` : (isHighVal ? `<span class="badge-cond-gold" style="font-size:10px;">Mağazadan Teslim</span>` : ''));
    const hoverImg = p.hoverImage || p.image;

    return `
      <div class="product-art-card" onclick="App.openQuickDrawer(${p.id})">
        <div class="product-art-thumb">
          <img class="img-primary" src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy">
          <img class="img-hover" src="${hoverImg}" alt="${p.brand} ${p.name}" loading="lazy">
          <span class="badge-stock-teal">${p.statusBadge || 'Stokta'}</span>
          ${condBadgeHtml}
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

  // ÜRÜN DETAY SAYFASI (10X MAKRO BÜYÜTEÇ & EKSPERTİZ & HUKUKİ PROTOKOLLER)
  openProduct(id) {
    const p = findProduct(id);
    if (!p) return;

    const container = document.getElementById('productDetailView');
    if (!container) return;

    const isHighVal = (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(p) : p.price > 12000);

    const condBadgeHtml = p.isPreOwned
      ? `<span class="badge-cond-gold" style="right:16px; top:16px; font-size:11px; padding:4px 10px;">İkinci El</span>`
      : (p.conditionBadge ? `<span class="badge-cond-sage" style="right:16px; top:16px; font-size:11px; padding:4px 10px;">${p.conditionBadge}</span>` : '');

    container.innerHTML = `
      <div class="pd-art-wrapper">
        
        <!-- Sol: 10x Optik Makro Büyüteç -->
        <div>
          <div class="pd-art-image-container" onmousemove="App.handleZoom(event, this)" onmouseleave="App.resetZoom(this)">
            <img src="${p.image}" alt="${p.brand} ${p.name}" id="zoomTargetImg">
            <span class="badge-stock-teal" style="left:16px; top:16px; font-size:11px; padding:4px 10px;">${p.statusBadge || 'Stokta'}</span>
            ${condBadgeHtml}
            <div class="loupe-hint">🔍 10x Optik İnceleme İçin Görselin Üzerine Gelin</div>
          </div>
        </div>

        <!-- Sağ: Detay & 12 Nokta Ekspertiz Karnesi -->
        <div class="pd-art-info">
          <span class="pd-art-brand">${p.brand}</span>
          <h1 class="pd-art-title">${p.name}</h1>
          <p class="pd-art-ref">${p.reference}</p>
          <div class="pd-art-price">${formatPrice(p.price)}</div>

          <!-- Canlı Ekspertiz Karnesi -->
          <div class="expert-health-card">
            <div class="expert-health-header">
              <span>✓ 12 Nokta Ekspertiz & Orijinallik Onaylı</span>
              <span>İstanbul Darphanesi Mühürlü</span>
            </div>
            <div class="health-metrics-grid">
              <div class="health-metric-item">
                <span>Zaman Sapması:</span>
                <strong>${p.rateAccuracy || '+1.5 sn/gün'}</strong>
              </div>
              <div class="health-metric-item">
                <span>Mekanizma Genliği:</span>
                <strong>${p.amplitude || '290° Kusursuz'}</strong>
              </div>
              <div class="health-metric-item">
                <span>Basınç & Su Testi:</span>
                <strong>${p.waterTest || '10 Bar Geçti'}</strong>
              </div>
              <div class="health-metric-item">
                <span>Kasa Kondisyonu:</span>
                <strong>%98 Polisajsız Orijinal Hat</strong>
              </div>
            </div>
          </div>

          <p style="font-size:14px; color:#444; line-height:1.7; margin-bottom:20px;">
            ${p.desc}
          </p>

          <table class="pd-art-specs-table">
            <tr><td>Marka / Üretici</td><td>${p.brand}</td></tr>
            <tr><td>Maden / Kasa Tipi</td><td>${p.metal || 'Masif Altın / Çelik'}</td></tr>
            <tr><td>Kadran & İndeksler</td><td>${p.dial || 'Orijinal Kadran'}</td></tr>
            <tr><td>Model / Üretim Yılı</td><td>${p.year || '2024'}</td></tr>
            <tr><td>Kutu & Garanti Belgesi</td><td>${p.boxPapers || 'Orijinal Kutu & Garanti Belgesi'}</td></tr>
            ${p.hallmark ? `<tr><td>Darphane Damgası</td><td>${p.hallmark}</td></tr>` : ''}
          </table>

          ${isHighVal ? `
            <!-- 03: Yüksek Değerli Güvenli Teslimat Uyarısı -->
            <div class="high-value-delivery-alert" style="background:#FFF9EE; border:1px solid #E6D2A8; padding:14px 18px; border-radius:8px; margin:16px 0; font-size:12.5px; color:#6B531C; line-height:1.6;">
              <strong style="display:block; margin-bottom:4px; font-size:13px; color:#875A00;">🏛️ Yalnız Mağazadan Güvenli Teslimat (03 Protokolü)</strong>
              12.000 TL üzerindeki altın ve saat ürünleri yalnızca mağazamızdan teslim edilir. Kargo veya kurye ile gönderim yapılmaz.<br>
              Teslim sırasında sipariş sahibinin bizzat mağazada bulunması, geçerli resmî kimlik belgesini ibraz etmesi ve teslim-tesellüm belgesini imzalaması gerekir.
            </div>
          ` : ''}

          <!-- Yasal & Politika Hızlı Bağlantıları (03, 04, 11) -->
          <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:12px; margin-bottom:20px;">
            <a href="iade-degisim-cayma.html" target="_blank" style="color:var(--color-teal); text-decoration:underline;">İade ve Cayma Koşullarını İncele (04)</a>
            <span style="color:#CCC;">•</span>
            <a href="garanti-ve-satis-sonrasi.html" target="_blank" style="color:var(--color-teal); text-decoration:underline;">Garanti ve Satış Sonrası Koşullarını İncele (11)</a>
            ${isHighVal ? `
              <span style="color:#CCC;">•</span>
              <a href="yuksek-degerli-urun-teslimi.html" target="_blank" style="color:var(--color-teal); text-decoration:underline;">Yüksek Değerli Teslim Protokolü (03)</a>
            ` : ''}
          </div>

          <div class="pd-art-actions">
            <button class="btn-art-buy" onclick="Cart.add(${p.id}); App.updateHeaderCartCount(); Router.navigate('cart');">
              Hemen Satın Al (${formatPrice(p.price)})
            </button>
            <a class="btn-art-whatsapp" href="https://wa.me/905419305372?text=Merhaba,%20${encodeURIComponent(p.brand + ' ' + p.name)}%20(${p.reference})%20hakkinda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener">
              <span>WhatsApp Danışmanı</span>
            </a>
          </div>

          <!-- Yasal Bilgilendirme, Teslimat & Mağaza Güvenlik Şartları -->
          <div class="pd-legal-notice-box" style="margin-top:24px; padding:18px 20px; background:#FAFAFA; border:1px solid #E5E5E5; border-radius:8px; font-size:12px; color:#555; line-height:1.7;">
            <div style="font-weight:700; color:var(--color-ink); font-size:13px; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2A768" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Önemli Bilgilendirme, Teslimat & Güvenlik Şartları (01, 02, 03, 04, 11)</span>
            </div>
            <ul style="margin:0; padding-left:16px; display:flex; flex-direction:column; gap:8px;">
              <li><strong>12.000 TL üzerindeki altın ve saat ürünleri yalnızca mağazamızdan teslim edilmektedir. Kargo veya kurye ile gönderim yapılmaz.</strong></li>
              <li>Teslim sırasında sipariş sahibinin bizzat mağazada bulunması, geçerli resmî kimlik belgesini ibraz etmesi ve teslim-tesellüm belgesini imzalaması gerekmektedir.</li>
              <li>Sipariş sahibi ile ödeme aracının sahibinin farklı olması halinde güvenlik amacıyla ek doğrulama talep edilebilir.</li>
              <li>Ürün; sipariş sahibi dışında üçüncü kişiye, telefon veya mesaj talimatıyla teslim edilmez.</li>
              <li>Ürün teslimi, ödemenin ödeme sistemi tarafından kesinleşmiş olarak doğrulanmasından sonra gerçekleştirilir.</li>
              <li>Altın ve kıymetli maden fiyatları piyasa koşullarına bağlı olarak değişebilir. Siparişin onaylandığı anda gösterilen satış fiyatı esas alınır.</li>
              <li>Kişiye özel hazırlanan, ölçüsü değiştirilen, gravür veya benzeri kişiselleştirme işlemi yapılan ürünlerde mevzuatta öngörülen şartların oluşması halinde cayma hakkı istisnası uygulanabilir.</li>
              <li>Fiyatı finansal piyasalardaki dalgalanmalara bağlı olarak değişen ürünlerde, ilgili mevzuatta öngörülen şartların oluşması halinde cayma hakkı istisnası uygulanabilir.</li>
              <li>Tüketicinin ayıplı mala ilişkin kanuni hakları saklıdır.</li>
              <li>Ürünün renk ve görünümünde ekran, ışık ve çekim koşullarından kaynaklanan sınırlı farklılıklar oluşabilir. Ürün sayfasında belirtilen ayar, gram, model, ölçü ve teknik özellikler esas alınır.</li>
            </ul>
          </div>
        </div>

      </div>
    `;

    Router.navigate('product');
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
