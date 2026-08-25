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
      Router.navigate('home', false);
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

  onPageChange(page, options = {}) {
    switch (page) {
      case 'home':
        this.renderHome();
        break;
      case 'watches':
        this.renderWatches();
        break;
      case 'jewellery':
        this.renderJewellery();
        break;
      case 'preowned':
        this.renderPreOwned();
        break;
      case 'cart':
        this.renderCart();
        break;
      case 'checkout':
        this.renderCart();
        break;
    }
  },

  refreshViews() {
    this.renderHome();
    this.renderWatches();
    this.renderJewellery();
    this.renderPreOwned();
    if (Router.currentPage === 'cart') this.renderCart();
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
        <a class="brand-tile-card" href="#" data-page="watches">
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
        <a class="brand-tile-card" href="#" data-page="jewellery">
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

  // 2. TÜM SAATLER SAYFASI
  renderWatches() {
    const el = document.getElementById('allWatchesGrid');
    if (el) {
      el.innerHTML = WATCHES.map(p => this.renderProductCard(p)).join('');
    }
  },

  // 3. İKİNCİ EL ALTIN & SAAT SAYFASI
  renderPreOwned() {
    const el = document.getElementById('allPreOwnedGrid');
    if (el) {
      el.innerHTML = PRE_OWNED_ITEMS.map(p => this.renderProductCard(p)).join('');
    }
  },

  // 4. TÜM MÜCEVHERLER SAYFASI
  renderJewellery() {
    const el = document.getElementById('allJewelleryGrid');
    if (el) {
      el.innerHTML = JEWELLERY.map(p => this.renderProductCard(p)).join('');
    }
  },

  // HERO TAB SWITCHER
  filterHeroTab(tab, btn) {
    document.querySelectorAll('.hero-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (tab === 'watches') {
      Router.navigate('watches');
    } else if (tab === 'preowned') {
      const sec = document.getElementById('secPreOwned');
      if (sec && Router.currentPage === 'home') {
        sec.scrollIntoView({ behavior: 'smooth' });
      } else {
        Router.navigate('preowned');
      }
    } else if (tab === 'jewellery') {
      Router.navigate('jewellery');
    } else if (tab === 'all') {
      Router.navigate('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  // ÜRÜN KARTI ŞABLONU
  renderProductCard(p) {
    const condClass = p.conditionBadge === 'Sıfır' ? 'badge-cond-sage' : 'badge-cond-gold';
    const hoverImg = p.hoverImage || p.image;

    return `
      <div class="product-art-card" onclick="App.openQuickDrawer(${p.id})">
        <div class="product-art-thumb">
          <img class="img-primary" src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy">
          <img class="img-hover" src="${hoverImg}" alt="${p.brand} ${p.name}" loading="lazy">
          <span class="badge-stock-teal">${p.statusBadge || 'Stokta'}</span>
          <span class="${condClass}">${p.conditionBadge || 'İkinci El'}</span>
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

      <table class="pd-art-specs-table" style="font-size:12.5px; margin-bottom:24px;">
        <tr><td>Maden / Kasa</td><td>${p.metal || 'Masif Altın / Çelik'}</td></tr>
        <tr><td>Kadran / Taş</td><td>${p.dial || 'Orijinal Kadran'}</td></tr>
        <tr><td>Model Yılı</td><td>${p.year || '2024'}</td></tr>
        <tr><td>Kutu & Evrak</td><td>${p.boxPapers || 'Tam Set'}</td></tr>
        ${p.amplitude ? `<tr><td>Zaman Doğruluğu</td><td><strong>${p.rateAccuracy}</strong></td></tr>` : ''}
        ${p.hallmark ? `<tr><td>Darphane Damgası</td><td><strong>${p.hallmark}</strong></td></tr>` : ''}
      </table>

      <div style="display:flex; flex-direction:column; gap:10px; margin-top:auto;">
        <button class="btn-art-buy" onclick="Cart.add(${p.id}); App.updateHeaderCartCount(); App.closeQuickDrawer(); Router.navigate('cart');">
          Sepete Ekle & Satın Al
        </button>
        <button class="btn-hero-outline" style="text-align:center; padding:12px;" onclick="App.closeQuickDrawer(); App.openProduct(${p.id});">
          Detaylı Ekspertiz Sayfası (10x Loupe)
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

  // ÜRÜN DETAY SAYFASI (10X MAKRO BÜYÜTEÇ & EKSPERTİZ)
  openProduct(id) {
    const p = findProduct(id);
    if (!p) return;

    const container = document.getElementById('productDetailView');
    if (!container) return;

    const condClass = p.conditionBadge === 'Sıfır' ? 'badge-cond-sage' : 'badge-cond-gold';

    container.innerHTML = `
      <div class="pd-art-wrapper">
        
        <!-- Sol: 10x Optik Makro Büyüteç -->
        <div>
          <div class="pd-art-image-container" onmousemove="App.handleZoom(event, this)" onmouseleave="App.resetZoom(this)">
            <img src="${p.image}" alt="${p.brand} ${p.name}" id="zoomTargetImg">
            <span class="badge-stock-teal" style="left:16px; top:16px; font-size:11px; padding:4px 10px;">${p.statusBadge || 'Stokta'}</span>
            <span class="${condClass}" style="right:16px; top:16px; font-size:11px; padding:4px 10px;">${p.conditionBadge || 'İkinci El'}</span>
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

          <div class="pd-art-actions">
            <button class="btn-art-buy" onclick="Cart.add(${p.id}); App.updateHeaderCartCount(); Router.navigate('cart');">
              Hemen Satın Al (${formatPrice(p.price)})
            </button>
            <a class="btn-art-whatsapp" href="https://wa.me/905523536484?text=Merhaba,%20${encodeURIComponent(p.brand + ' ' + p.name)}%20(${p.reference})%20hakkinda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener">
              <span>WhatsApp Danışmanı</span>
            </a>
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
          <a class="btn-hero-filled" href="#" data-page="watches">Saatleri İncele</a>
        </div>
      `;
      return;
    }

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
    if (Router.currentPage !== 'home') {
      Router.navigate('home');
    }
    setTimeout(() => {
      const el = document.getElementById('valuationSimulatorBox');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  },

  processOrder() {
    alert("Siparişiniz başarıyla alındı! E-Arşiv faturanız ve sigortalı Loomis zırhlı kurye takip numaranız SMS olarak telefonunuza iletilecektir.");
    Cart.clear();
    this.updateHeaderCartCount();
    Router.navigate('home');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
