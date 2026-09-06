// --- UNIVERSAL TURKISH SEARCH ENGINE (STANDARDIZED WITH PHONETIC & TRANSLITERATION) ---
const PHONETIC_BRAND_MAP = {
  "maykil": "michael kors",
  "maykıl": "michael kors",
  "maykel": "michael kors",
  "micheal": "michael kors",
  "michal": "michael kors",
  "maykılkors": "michael kors",
  "maykıl kors": "michael kors",
  "maykilkors": "michael kors",
  "roleks": "rolex",
  "rolx": "rolex",
  "rolexs": "rolex",
  "kartye": "cartier",
  "kartiye": "cartier",
  "karter": "cartier",
  "cartye": "cartier",
  "seyko": "seiko",
  "seko": "seiko",
  "sayko": "seiko",
  "versase": "versace",
  "vercase": "versace",
  "versace": "versace",
  "tisso": "tissot",
  "tisot": "tissot",
  "tisott": "tissot",
  "tomi": "tommy hilfiger",
  "tomy": "tommy hilfiger",
  "tomi hilfigir": "tommy hilfiger",
  "tommy": "tommy hilfiger",
  "patek filip": "patek philippe",
  "filip": "philippe",
  "patek": "patek philippe",
  "kasyo": "casio",
  "kassio": "casio",
  "casio": "casio",
  "fosil": "fossil",
  "fossil": "fossil",
  "svac": "swatch",
  "svoc": "swatch",
  "swoc": "swatch",
  "swatch": "swatch",
  "lonjin": "longines",
  "lonjines": "longines",
  "longines": "longines",
  "hublo": "hublot",
  "ublo": "hublot",
  "hublot": "hublot",
  "piyaje": "piaget",
  "piaget": "piaget",
  "sanel": "chanel",
  "şanel": "chanel",
  "chanel": "chanel",
  "guci": "gucci",
  "gucci": "gucci",
  "bulgari": "bvlgari",
  "bvlgari": "bvlgari",
  "kelvin": "calvin klein",
  "kalvin": "calvin klein",
  "calvin": "calvin klein",
  "dizel": "diesel",
  "disel": "diesel",
  "diesel": "diesel",
  "armani": "emporio armani",
  "emporyo": "emporio armani",
  "emporio": "emporio armani",
  "ges": "guess",
  "guess": "guess",
  "lakost": "lacoste",
  "lakoste": "lacoste",
  "lacoste": "lacoste",
  "svarovski": "swarovski",
  "swarovski": "swarovski",
  "zenit": "zenith",
  "zenith": "zenith",
  "velder": "welder",
  "welder": "welder",
  "submarner": "submariner",
  "submariner": "submariner",
  "altin": "altın",
  "bilezik": "bilezik",
  "yuzuk": "yüzük",
  "kolye": "kolye",
  "kupe": "küpe",
  "tektas": "tektaş",
  "pirlanta": "pırlanta"
};

function normalizeTr(text) {
  if (!text) return "";
  return text.trim().toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/â/g, "a")
    .replace(/î/g, "i").replace(/û/g, "u").replace(/\\s+/g, " ");
}

function levenshteinDist(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

const STOP_WORDS_SET = new Set(["nasil", "nedir", "ne", "icin", "kadar", "olan", "mi", "fiyat", "fiyati", "almak", "istiyorum", "secilir"]);

function runBelginSearch(items, query) {
  const qNorm = normalizeTr(query);
  if (!qNorm) return { results: [], didYouMean: null, suggested: [] };
  
  const aliasExpansion = PHONETIC_BRAND_MAP[qNorm] || PHONETIC_BRAND_MAP[query.toLowerCase()] || "";
  const effectiveQueries = [qNorm];
  if (aliasExpansion) {
    effectiveQueries.push(normalizeTr(aliasExpansion));
  }
  
  const allTokens = new Set();
  effectiveQueries.forEach(eq => {
    eq.split(/[^a-z0-9]+/i).filter(t => !STOP_WORDS_SET.has(t) && t.length > 1).forEach(t => allTokens.add(t));
  });
  
  const tokens = Array.from(allTokens);
  const scored = [];
  const allWords = new Set();
  
  for (const p of items) {
    const brandNorm = normalizeTr(p.brand || "");
    const nameNorm = normalizeTr(p.name || "");
    const titleNorm = brandNorm + " " + nameNorm;
    const detailsNorm = normalizeTr((p.reference || "") + " " + (p.metal || "") + " " + (p.category || "") + " " + (p.subCategory || ""));
    const combined = titleNorm + " " + detailsNorm;
    
    brandNorm.split(" ").forEach(w => w.length >= 3 && allWords.add(w));
    nameNorm.split(" ").forEach(w => w.length >= 3 && allWords.add(w));
    
    let score = 0;
    for (const eq of effectiveQueries) {
      if (titleNorm === eq) score += 200;
      else if (titleNorm.startsWith(eq)) score += 120;
      else if (titleNorm.includes(eq)) score += 90;
      else if (brandNorm.includes(eq)) score += 100;
      else if (combined.includes(eq)) score += 50;
    }
    
    for (const t of tokens) {
      if (t.length < 2) continue;
      if (brandNorm === t) score += 90;
      else if (brandNorm.includes(t)) score += 70;
      else if (titleNorm.includes(t)) score += 40;
      else if (combined.includes(t)) score += 20;
      
      for (const w of titleNorm.split(" ")) {
        if (w.length >= 3 && t.length >= 3) {
          const d = levenshteinDist(t, w);
          const maxL = Math.max(t.length, w.length);
          if (d <= 2 && d / maxL <= 0.35) {
            score += 45 - d * 15;
          }
        }
      }
    }
    
    if (score >= 12) {
      scored.push({ p, score });
    }
  }
  
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, 24).map(s => s.p);
  
  let didYouMean = null;
  if (aliasExpansion) {
    didYouMean = aliasExpansion;
  } else if (results.length === 0 || (scored[0] && scored[0].score < 50)) {
    let bestDist = Infinity;
    let bestWord = null;
    for (const w of allWords) {
      const d = levenshteinDist(qNorm, w);
      if (d > 0 && d <= 2 && d < bestDist) {
        bestDist = d;
        bestWord = w;
      }
    }
    if (bestWord) didYouMean = bestWord;
  }
  
  const suggested = results.length === 0 && scored.length > 0 ? scored.slice(0, 6).map(s => s.p) : [];
  return { results, didYouMean, suggested };
}

const App = {
  isJewelleryProduct(p) {
    if (!p) return false;
    const cat = String(p.category || '').toLowerCase();
    const brand = String(p.brand || '').toLowerCase();
    const name = String(p.name || '').toLowerCase();
    const subCat = String(p.subCategory || '').toLowerCase();
    if (cat === 'elit-saatler' || cat === 'saat' || cat === 'watch' || cat === 'watches') return false;
    if (brand && ['rolex', 'omega', 'patek philippe', 'audemars piguet', 'breitling', 'cartier', 'tudor', 'tag heuer', 'iwc schaffhausen', 'panerai', 'tissot', 'longines', 'frederique constant', 'rado', 'alpina', 'bell & ross', 'swatch', 'casio', 'carren', 'versace', 'calvin klein', 'michael kors', 'gc', 'guess', 'welder'].includes(brand)) return false;
    return cat === 'jewelry' || cat === 'jewellery' || cat === 'mucevherat' || cat === 'altin' || cat === 'gold'
      || brand.includes('belgin kuyumculuk')
      || p.isGold === true
      || subCat.includes('altın') || subCat.includes('ziynet') || subCat.includes('külçe')
      || /altın|altin|külçe|kulce|bilezik|çeyrek|ceyrek|yarım\s+altın|tam\s+altın|ata\s+altın|reşat|resat|ziynet|sarrafiye|gremse/i.test(name);
  },

  goToHome(e) {
    if (typeof window.goToHome === 'function') {
      return window.goToHome(e);
    }
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (typeof Router !== 'undefined' && typeof Router.navigate === 'function') {
      Router.navigate('ana-sayfa', true);
    } else {
      window.location.href = '/';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    return false;
  },

  init() {
    if (this._initialized) return;
    this._initialized = true;

    Cart.init();
    Wishlist.init();
    Router.init();

    this.renderHome();
    this.renderEliteWatches();
    this.renderWatches();
    this.renderJewellery();
    this.renderPreOwned();
    this.renderMagazineGrid('all', 1);
    this.renderFlipbook();
    this.initHeroRotator();
    this.updateHeaderCartCount();
    this.checkCookieBanner();

    // Canlı İZKO Altın Kurlarını & Harem Altın Soketini Başlat
    if (typeof fetchLiveMarketRates === 'function') {
      fetchLiveMarketRates();
      setInterval(fetchLiveMarketRates, 15 * 60 * 1000);
    }
    if (typeof initHaremAltinSocket === 'function') {
      initHaremAltinSocket();
    }
    // Canlı Saat & Tarih Sayacı (1 Saniyede Bir Kesintisiz Akan Saat)
    setInterval(() => {
      this.updateLiveClock();
    }, 1000);

    // Ödeme Sayfası Gerçek Zamanlı Müşteri & Tutar Senkronizasyonu
    this.initCheckoutAutoSync();

    // Header Dropdown Otomatik Kapanma Dinleyicisi
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-dropdown-menu a') || e.target.closest('.nav-sub-brand-item') || e.target.closest('.nav-dropdown-single-item')) {
        this.closeNavDropdowns();
      }
    });

    const legacy = Router.migrateLegacyHash();
    const rawQueryId = new URLSearchParams(location.search).get('urun');
    const numQueryId = parseInt(rawQueryId, 10);
    const queryProductId = (rawQueryId && !isNaN(numQueryId) && String(numQueryId) === rawQueryId) ? numQueryId : rawQueryId;

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
      Router.navigate(state.page, false, { filter: state.filter });
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

  currentEliteBrand: 'all',
  allEliteWatchPage: 1,
  currentWatchBrand: 'all',
  currentPreOwnedCategory: 'all',
  currentLiveRatesCategory: 'all',

  onPageChange(page, options = {}) {
    switch (page) {
      case 'ana-sayfa':
        this.renderHome();
        break;
      case 'elit-kategori':
      case 'elit-saatler':
        const eliteFilter = (options.filter !== undefined && options.filter !== null) ? options.filter : (this.currentEliteBrand || 'all');
        this.currentEliteBrand = eliteFilter;
        this.renderEliteWatches(eliteFilter, 1);
        break;
      case 'canli-fiyatlar':
        this.renderLivePricesPage();
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
        Router.navigate('elit-kategori', true, { filter: options.filter || 'all' });
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
      case 'magazin':
        const magFilter = (options.filter !== undefined && options.filter !== null) ? options.filter : (this.currentMagazineFilter || 'all');
        this.currentMagazineFilter = magFilter;
        this.filterMagazineCategory(magFilter, null);
        break;
    }
  },

  refreshViews() {
    this.renderHome();
    this.renderEliteWatches();
    this.renderWatches();
    this.renderJewellery();
    if (Router.currentPage === 'canli-fiyatlar') this.renderLivePricesPage();
    if (Router.currentPage === 'sepet') this.renderCart();
  },

  updateHeaderCartCount() {
    const badge = document.getElementById('headerCartCount');
    const mobileBadge = document.getElementById('mobileCartBadge');
    const total = (typeof Cart !== 'undefined' && Cart.items) ? Cart.items.reduce((sum, i) => sum + i.qty, 0) : 0;
    
    if (badge) {
      if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
    if (mobileBadge) {
      if (total > 0) {
        mobileBadge.textContent = total;
        mobileBadge.style.display = 'inline-flex';
      } else {
        mobileBadge.style.display = 'none';
      }
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
    // Saat Markaları (Tek Sıra Kesintisiz Otomatik Kayan Marquee - Kesintisiz Stabil Döngü)
    const watchBrandsEl = document.getElementById('watchBrandsGrid');
    if (watchBrandsEl) {
      const marqueeList = [...WATCH_BRANDS, ...WATCH_BRANDS];
      watchBrandsEl.innerHTML = marqueeList.map(b => `
        <div class="brand-carousel-card" onclick="App.filterWatchesByBrand('${b.name}', null)" title="${b.name} Saat Modelleri">
          <img src="${b.image}" alt="${b.name}" class="brand-carousel-logo" width="220" height="100" decoding="async">
        </div>
      `).join('');
    }

    // Elit Kategori — Haute Horlogerie Vitrini (10 Marka & 200 Model)
    this.renderHomeEliteWatches('all');

    // Yeni Eklenen Saatler (Sayfa Başına 16 Ürün)
    this.renderHomeWatches(1);

    // Canlı Fiyatlar Tabelası DOM Güncellemesi
    this.updateLivePricesTableDOM();

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
    const computed = window.getComputedStyle(track);
    const matrix = (typeof DOMMatrixReadOnly !== 'undefined') ? new DOMMatrixReadOnly(computed.transform) : null;
    const currentX = matrix ? matrix.m41 : 0;
    const isMobile = window.innerWidth <= 768;
    const shift = direction === 'next' ? (isMobile ? -240 : -440) : (isMobile ? 240 : 440);
    track.style.animationPlayState = 'paused';
    track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(${currentX + shift}px)`;
    setTimeout(() => {
      track.style.transition = '';
      track.style.transform = '';
      track.style.animationPlayState = 'running';
    }, 1200);
  },

  // ANA SAYFA ELİT KATEGORİ VİTRİNİ (8'li veya 12'li Seçkin Vitrin)
  renderHomeEliteWatches(brandFilter = 'all') {
    const el = document.getElementById('homeEliteWatchesGrid');
    if (!el) return;

    let list = (typeof ELITE_WATCHES !== 'undefined' ? ELITE_WATCHES : PRODUCTS.filter(p => p.isElite || p.category === 'elit-saatler'));
    if (brandFilter && brandFilter !== 'all') {
      list = list.filter(p => p.brand.trim().toLowerCase() === brandFilter.trim().toLowerCase());
    }

    const picks = list.slice(0, 12);
    el.innerHTML = picks.map(p => this.renderProductCard(p)).join('');
  },

  filterHomeEliteWatches(brand = 'all', btn = null) {
    this.renderHomeEliteWatches(brand);
    if (btn) {
      const parent = btn.closest('.mobile-quick-filter-bar') || document;
      parent.querySelectorAll('.mobile-filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  },

  // ANA SAYFA SAAT SAYFALAMA (EN FAZLA 4 SIRA = 16 SAAT)
  renderHomeWatches(page = 1) {
    this.homeWatchPage = page;
    const el = document.getElementById('homeWatchesGrid');
    const pagEl = document.getElementById('homeWatchesPagination');
    if (!el) return;

    const list = this.getAllWatchList();
    const pageSize = this.HOME_WATCH_PAGE_SIZE || 16;
    const total = list.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = list.slice(start, end);

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

    const jewelleryList = (typeof JEWELLERY !== 'undefined' && Array.isArray(JEWELLERY))
      ? JEWELLERY
      : (typeof PRODUCTS !== 'undefined' ? PRODUCTS.filter(p => (p.category === 'jewelry' || p.category === 'jewellery') && !p.isPreOwned) : []);
    const total = jewelleryList.length;
    const start = (page - 1) * this.JEWELRY_PAGE_SIZE;
    const end = start + this.JEWELRY_PAGE_SIZE;
    const pageItems = jewelleryList.slice(start, end);

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

  // EVRENSEL SAAT FİLTRELEME & ARAMA MOTORU (UNIVERSAL FILTER ENGINE)
  universalFilterState: {
    elite: { query: '', brand: 'all', priceRange: 'all', sortBy: 'default', page: 1 },
    watches: { query: '', brand: 'all', priceRange: 'all', sortBy: 'default', page: 1 }
  },

  isEliteBrand(brand) {
    if (!brand) return false;
    const b = brand.trim().toLowerCase();
    const eliteBrands = [
      'rolex', 'omega', 'patek philippe', 'patek', 'audemars piguet', 'ap',
      'breitling', 'cartier', 'tudor', 'tag heuer', 'iwc', 'iwc schaffhausen', 'panerai'
    ];
    return eliteBrands.includes(b);
  },

  getAllWatchList() {
    if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
      return PRODUCTS.filter(p => !p.isElite && p.category !== 'elit-saatler' && (p.isWatch || p.category === 'saat' || p.category === 'watch'));
    }
    return typeof WATCHES !== 'undefined' ? WATCHES : [];
  },

  getEliteWatchList() {
    if (typeof ELITE_WATCHES !== 'undefined' && Array.isArray(ELITE_WATCHES)) {
      return ELITE_WATCHES;
    }
    if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) {
      return PRODUCTS.filter(p => p.isElite || p.category === 'elit-saatler');
    }
    return [];
  },

  getFilteredWatches(context = 'elite') {
    const isElite = context === 'elite';
    let list = isElite ? this.getEliteWatchList() : this.getAllWatchList();
    const st = this.universalFilterState[context] || { query: '', brand: 'all', priceRange: 'all', sortBy: 'default' };

    // 1. Arama Metni Filtresi (Model, Marka, Referans, Açıklama)
    if (st.query && st.query.trim()) {
      const q = st.query.trim().toLocaleLowerCase('tr-TR');
      list = list.filter(p => {
        const name = (p.name || '').toLocaleLowerCase('tr-TR');
        const brand = (p.brand || '').toLocaleLowerCase('tr-TR');
        const ref = (p.reference || '').toLocaleLowerCase('tr-TR');
        const desc = (p.description || p.desc || '').toLocaleLowerCase('tr-TR');
        return name.includes(q) || brand.includes(q) || ref.includes(q) || desc.includes(q);
      });
    }

    // 2. Marka Filtresi
    if (st.brand && st.brand !== 'all') {
      list = list.filter(p => (p.brand || '').trim().toLocaleLowerCase('tr-TR') === st.brand.trim().toLocaleLowerCase('tr-TR'));
    }

    // 3. Fiyat Aralığı Filtresi
    if (st.priceRange && st.priceRange !== 'all') {
      if (st.priceRange === 'under50k') {
        list = list.filter(p => (p.price || 0) < 50000);
      } else if (st.priceRange === '50k-100k') {
        list = list.filter(p => (p.price || 0) >= 50000 && (p.price || 0) < 100000);
      } else if (st.priceRange === '100k-250k') {
        list = list.filter(p => (p.price || 0) >= 100000 && (p.price || 0) < 250000);
      } else if (st.priceRange === 'under250k') {
        list = list.filter(p => (p.price || 0) < 250000);
      } else if (st.priceRange === 'under500k') {
        list = list.filter(p => (p.price || 0) < 500000);
      } else if (st.priceRange === '250k-500k' || st.priceRange === '500k-1m') {
        if (st.priceRange === '250k-500k') list = list.filter(p => (p.price || 0) >= 250000 && (p.price || 0) < 500000);
        else list = list.filter(p => (p.price || 0) >= 500000 && (p.price || 0) < 1000000);
      } else if (st.priceRange === '1m-2m') {
        list = list.filter(p => (p.price || 0) >= 1000000 && (p.price || 0) < 2000000);
      } else if (st.priceRange === 'over250k') {
        list = list.filter(p => (p.price || 0) >= 250000);
      } else if (st.priceRange === 'over1m' || st.priceRange === 'over2m') {
        if (st.priceRange === 'over1m') list = list.filter(p => (p.price || 0) >= 1000000);
        else list = list.filter(p => (p.price || 0) >= 2000000);
      }
    }

    // 4. Sıralama
    if (st.sortBy === 'price-asc') {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (st.sortBy === 'price-desc') {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (st.sortBy === 'name-asc') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
    }

    return list;
  },

  onUniversalSearchInput(val, context = 'elite') {
    if (!this.universalFilterState[context]) this.universalFilterState[context] = {};
    this.universalFilterState[context].query = val;
    this.universalFilterState[context].page = 1;

    // Toggle clear button
    const clearBtnId = context === 'elite' ? 'uvSearchClearElite' : 'uvSearchClearWatches';
    const clearBtn = document.getElementById(clearBtnId);
    if (clearBtn) clearBtn.style.display = val.trim().length > 0 ? 'flex' : 'none';

    clearTimeout(this._uvSearchTimer);
    this._uvSearchTimer = setTimeout(() => {
      this.renderUniversalWatches(context, 1);
    }, 180);
  },

  clearUniversalSearch(context = 'elite') {
    const inputId = context === 'elite' ? 'uvSearchInputElite' : 'uvSearchInputWatches';
    const input = document.getElementById(inputId);
    if (input) input.value = '';
    this.onUniversalSearchInput('', context);
  },

  onUniversalBrandChange(brand, context = 'elite') {
    if (!this.universalFilterState[context]) this.universalFilterState[context] = {};
    this.universalFilterState[context].brand = brand;
    this.universalFilterState[context].page = 1;
    this.syncUniversalPills(brand, context);
    this.renderUniversalWatches(context, 1);
  },

  onUniversalPriceChange(priceRange, context = 'elite') {
    if (!this.universalFilterState[context]) this.universalFilterState[context] = {};
    this.universalFilterState[context].priceRange = priceRange;
    this.universalFilterState[context].page = 1;
    this.renderUniversalWatches(context, 1);
  },

  onUniversalSortChange(sortBy, context = 'elite') {
    if (!this.universalFilterState[context]) this.universalFilterState[context] = {};
    this.universalFilterState[context].sortBy = sortBy;
    this.universalFilterState[context].page = 1;
    this.renderUniversalWatches(context, 1);
  },

  setUniversalPillBrand(brand, context = 'elite', btn = null) {
    if (!this.universalFilterState[context]) this.universalFilterState[context] = {};
    this.universalFilterState[context].brand = brand;
    this.universalFilterState[context].page = 1;

    // Sync select dropdown
    const selectId = context === 'elite' ? 'uvBrandSelectElite' : 'uvBrandSelectWatches';
    const select = document.getElementById(selectId);
    if (select) select.value = brand;

    this.syncUniversalPills(brand, context);
    this.renderUniversalWatches(context, 1);
  },

  syncUniversalPills(brand, context = 'elite') {
    const rowId = context === 'elite' ? 'uvPillsRowElite' : 'uvPillsRowWatches';
    const row = document.getElementById(rowId);
    if (!row) return;

    row.querySelectorAll('.uv-pill-btn').forEach(btn => {
      btn.classList.remove('active');
      const pBrand = btn.getAttribute('data-pill-brand');
      if (pBrand && pBrand.toLowerCase() === brand.toLowerCase()) {
        btn.classList.add('active');
      }
    });
  },

  resetUniversalFilters(context = 'elite') {
    this.universalFilterState[context] = { query: '', brand: 'all', priceRange: 'all', sortBy: 'default', page: 1 };

    const searchInput = document.getElementById(context === 'elite' ? 'uvSearchInputElite' : 'uvSearchInputWatches');
    if (searchInput) searchInput.value = '';

    const clearBtn = document.getElementById(context === 'elite' ? 'uvSearchClearElite' : 'uvSearchClearWatches');
    if (clearBtn) clearBtn.style.display = 'none';

    const brandSelect = document.getElementById(context === 'elite' ? 'uvBrandSelectElite' : 'uvBrandSelectWatches');
    if (brandSelect) brandSelect.value = 'all';

    const priceSelect = document.getElementById(context === 'elite' ? 'uvPriceSelectElite' : 'uvPriceSelectWatches');
    if (priceSelect) priceSelect.value = 'all';

    const sortSelect = document.getElementById(context === 'elite' ? 'uvSortSelectElite' : 'uvSortSelectWatches');
    if (sortSelect) sortSelect.value = 'default';

    this.syncUniversalPills('all', context);
    this.renderUniversalWatches(context, 1);
  },

  renderUniversalWatches(context = 'elite', page = 1) {
    const isElite = context === 'elite';
    const gridId = isElite ? 'allEliteWatchesGrid' : 'allWatchesGrid';
    const pagId = isElite ? 'allEliteWatchesPagination' : 'allWatchesPagination';
    const countBadgeId = isElite ? 'eliteWatchesCountBadge' : 'watchesCountBadge';
    const resetBtnId = isElite ? 'uvResetBtnElite' : 'uvResetBtnWatches';

    const grid = document.getElementById(gridId);
    const pagEl = document.getElementById(pagId);
    if (!grid) return;

    const filtered = this.getFilteredWatches(context);
    const total = filtered.length;
    const pageSize = this.PAGE_SIZE || 24;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const curPage = Math.min(Math.max(1, page), totalPages);

    if (!this.universalFilterState[context]) this.universalFilterState[context] = {};
    this.universalFilterState[context].page = curPage;

    const start = (curPage - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);

    if (total === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px; background:#FAF8F5; border:1px solid rgba(194,167,104,0.3); border-radius:12px;">
          <div style="font-size:36px; margin-bottom:12px;">🔍</div>
          <h3 style="font-family:var(--font-sans); font-size:18px; font-weight:700; color:var(--color-ink); margin-bottom:6px;">Aramanıza Uygun Saat Bulunamadı</h3>
          <p style="color:var(--color-muted); font-size:13.5px; max-width:440px; margin:0 auto 16px;">Farklı bir marka, model veya fiyat aralığı seçerek tekrar deneyebilirsiniz.</p>
          <button class="btn btn-secondary" onclick="App.resetUniversalFilters('${context}')" style="padding:8px 20px; font-size:13px;">Filtreleri Sıfırla ✕</button>
        </div>
      `;
    } else {
      grid.innerHTML = pageItems.map(p => this.renderProductCard(p)).join('');
    }

    if (pagEl) {
      const callbackName = isElite ? 'App.changeAllEliteWatchPage' : 'App.changeAllWatchPage';
      pagEl.innerHTML = this.buildPaginationHtml(curPage, total, pageSize, callbackName);
    }

    // Update count badge
    const countBadge = document.getElementById(countBadgeId);
    if (countBadge) {
      countBadge.innerHTML = `⏱️ <strong>${total.toLocaleString('tr-TR')}</strong> Model Listeleniyor`;
    }

    // Update reset button visibility
    const st = this.universalFilterState[context];
    const isFiltered = (st.query && st.query.trim().length > 0) || (st.brand && st.brand !== 'all') || (st.priceRange && st.priceRange !== 'all') || (st.sortBy && st.sortBy !== 'default');
    const resetBtn = document.getElementById(resetBtnId);
    if (resetBtn) {
      resetBtn.style.display = isFiltered ? 'inline-flex' : 'none';
    }
  },

  // 0. ELİT KATEGORİ SAYFASI (10 Prestij Marka & 200 Doğrulanmış Model)
  renderEliteWatches(brandFilter = 'all', page = 1) {
    if (!this.universalFilterState.elite) this.universalFilterState.elite = {};
    if (brandFilter && brandFilter !== 'all') {
      this.universalFilterState.elite.brand = brandFilter;
      const select = document.getElementById('uvBrandSelectElite');
      if (select) select.value = brandFilter;
      this.syncUniversalPills(brandFilter, 'elite');
    }
    this.renderUniversalWatches('elite', page);
  },

  changeAllEliteWatchPage(newPage) {
    this.renderUniversalWatches('elite', newPage);
    setTimeout(() => {
      const target = document.getElementById('universalFilterElite') || document.getElementById('allEliteWatchesGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 40);
  },

  filterEliteWatchesByBrand(brand = 'all', btn = null) {
    this.closeNavDropdowns();
    if (brand && brand !== 'all' && !this.isEliteBrand(brand)) {
      return this.filterWatchesByBrand(brand, btn);
    }
    if (!this.universalFilterState.elite) this.universalFilterState.elite = {};
    this.universalFilterState.elite.brand = brand;
    this.universalFilterState.elite.page = 1;
    if (Router.currentPage !== 'elit-kategori') {
      Router.navigate('elit-kategori', true, { filter: brand });
    } else {
      this.setUniversalPillBrand(brand, 'elite', btn);
      const select = document.getElementById('uvBrandSelectElite');
      if (select) select.value = brand;
      this.renderUniversalWatches('elite', 1);
    }
    setTimeout(() => {
      const target = document.getElementById('universalFilterElite') || document.getElementById('allEliteWatchesGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 60);
  },

  // 2. TÜM SAATLER SAYFASI (1.925 Saat Modeli)
  renderWatches(brandFilter = 'all', page = 1) {
    if (!this.universalFilterState.watches) this.universalFilterState.watches = {};
    if (brandFilter && brandFilter !== 'all') {
      this.universalFilterState.watches.brand = brandFilter;
      const select = document.getElementById('uvBrandSelectWatches');
      if (select) select.value = brandFilter;
      this.syncUniversalPills(brandFilter, 'watches');
    }
    this.renderUniversalWatches('watches', page);
  },

  changeAllWatchPage(newPage) {
    this.renderUniversalWatches('watches', newPage);
    setTimeout(() => {
      const target = document.getElementById('universalFilterWatches') || document.getElementById('allWatchesGrid');
      if (target && typeof Router !== 'undefined' && Router.scrollToTarget) {
        Router.scrollToTarget(target);
      }
    }, 40);
  },

  filterWatchesByBrand(brand = 'all', btn = null) {
    this.closeNavDropdowns();
    if (brand && brand !== 'all' && this.isEliteBrand(brand)) {
      return this.filterEliteWatchesByBrand(brand, btn);
    }
    if (!this.universalFilterState.watches) this.universalFilterState.watches = {};
    this.universalFilterState.watches.brand = brand;
    this.universalFilterState.watches.page = 1;
    if (Router.currentPage !== 'saatler') {
      Router.navigate('saatler', true, { filter: brand });
    } else {
      this.setUniversalPillBrand(brand, 'watches', btn);
      const select = document.getElementById('uvBrandSelectWatches');
      if (select) select.value = brand;
      this.renderUniversalWatches('watches', 1);
    }
    setTimeout(() => {
      const target = document.getElementById('universalFilterWatches') || document.getElementById('allWatchesGrid');
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

  // 3. SEÇKİN ÜRÜNLER (ELİT KATEGORİYE YÖNLENDİRİLDİ)
  renderPreOwned(filter = 'all', page = 1) {
    this.renderEliteWatches(filter === 'rolex' ? 'Rolex' : (filter === 'watch' ? 'all' : filter), page);
  },

  changeAllPreOwnedPage(newPage) {
    this.changeAllEliteWatchPage(newPage);
  },

  filterPreOwnedCategory(cat = 'all', btn = null) {
    const brandMap = {
      'rolex': 'Rolex',
      'patek': 'Patek Philippe',
      'cartier': 'Cartier',
      'all': 'all'
    };
    this.filterEliteWatchesByBrand(brandMap[cat.toLowerCase()] || 'all', btn);
  },

  // 4. TÜM MÜCEVHERLER VE ALTIN SAYFASI
  renderJewellery(filter = 'all') {
    this.currentJewelleryCategory = filter;
    const el = document.getElementById('allJewelleryGrid');
    const jewelleryList = (typeof JEWELLERY !== 'undefined' && Array.isArray(JEWELLERY))
      ? JEWELLERY
      : (typeof PRODUCTS !== 'undefined' ? PRODUCTS.filter(p => (p.category === 'jewelry' || p.category === 'jewellery') && !p.isPreOwned) : []);
    let items = jewelleryList;
    if (filter === 'Ziynet & Sarrafiye' || filter === 'ziynet') {
      items = jewelleryList.filter(p => p.subCategory === 'Ziynet & Sarrafiye' || p.name.includes('Ziynet') || p.name.includes('Ata') || p.name.includes('Çeyrek') || p.name.includes('Yarım') || p.name.includes('Tam') || p.name.includes('Gremse'));
    } else if (filter === 'Altın Bilezik' || filter === 'bracelet') {
      items = jewelleryList.filter(p => p.subCategory === 'Altın Bilezik' || p.name.includes('Bilezik'));
    } else if (filter === 'design' || filter === 'Tasarım Mücevher') {
      items = jewelleryList.filter(p => p.brand === 'Cartier' || p.category === 'jewelry' && !p.subCategory);
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
          <span class="prod-price-value" data-product-price-id="${p.id}">${formatPrice(p.price)} <small class="vat-text">(KDV Dahil)</small></span>
        </div>
        <div class="prod-dual-price-row prod-buy-price-row">
          <span class="prod-price-label">Alış Fiyatı:</span>
          <span class="prod-price-value">${formatPrice(buyPrice)}</span>
        </div>
      </div>
    ` : `
      <div class="prod-price-tag" data-product-price-id="${p.id}">${formatPrice(p.price)}</div>
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
          ${this.isJewelleryProduct(p) ? '<span class="badge-shipping-pill" style="position:absolute; top:10px; left:10px; background:#B91C1C; color:#FFFFFF; padding:5px 9px; border-radius:4px; font-size:10.5px; font-weight:800; letter-spacing:0.5px; z-index:2; box-shadow:0 2px 8px rgba(185,28,28,0.4); border:1px solid rgba(255,255,255,0.4);">🔒 KREDİ KARTINA KAPALIDIR</span>' : ''}
          <img class="img-primary" src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy">
        </div>
        <div class="product-art-info">
          <h3 class="prod-brand-name">${p.brand}</h3>
          <p class="prod-model-name">${p.name}</p>
          <p class="prod-ref-size">${p.reference}</p>
          ${priceHtml}
          ${this.isJewelleryProduct(p) ? '<div style="font-size:11.5px; font-weight:700; color:#B91C1C; margin-top:5px; display:flex; align-items:center; gap:4px;"><span>🏛️ Yalnızca Havale / EFT &amp; Showroom</span></div>' : ''}
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

      ${this.isJewelleryProduct(p) ? `
        <div style="font-size:12px; color:#2B261D; background:#FFFDF7; border:1.5px solid #C2A768; padding:10px 12px; border-radius:6px; margin-bottom:14px; line-height:1.55;">
          <strong style="color:var(--color-teal); display:block; margin-bottom:3px; font-weight:800;">🛡️ KURUMSAL BİLGİLENDİRME</strong>
          Mevzuat ve şirket politikalarımız gereğince Altın ve Mücevherat ürünlerinde <strong>KREDİ KARTI ile online satış yapılmamaktadır</strong>. Siparişlerinizi kurumsal <strong>Banka Havalesi / EFT / FAST</strong> yöntemiyle verebilirsiniz.
        </div>
      ` : (isHighVal ? `
        <div style="font-size:11.5px; color:#5D4411; background:#FFF9EE; border:1px solid #E6D2A8; padding:10px 12px; border-radius:6px; margin-bottom:16px; line-height:1.5;">
          <strong>🏛️ Yalnız Mağazadan Teslim (03):</strong> 12.000 TL üzerindeki ürünler güvenlik gereği kimlik ibrazı ve imza ile yalnızca Buca mağazamızdan teslim edilir. Kargo/kurye ile gönderilmez.
        </div>
      ` : `
        <div style="font-size:11.5px; color:#003057; background:#F0F7FF; border:1px solid #C4D9EC; padding:10px 12px; border-radius:6px; margin-bottom:16px; line-height:1.5; display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">📦</span>
          <span><strong>Sigortalı Hızlı Kargo:</strong> Siparişiniz özel korumalı ambalajında sigortalı kargo ile adresinize teslim edilir.</span>
        </div>
      `)}

      <div style="display:flex; flex-direction:column; gap:10px; margin-top:auto;">
        ${this.isJewelleryProduct(p) ? `
        <button class="btn-art-buy" onclick="App.closeQuickDrawer(); App.openWireOrderModal('${p.id}');" style="background:linear-gradient(135deg, #006039 0%, #004D2C 100%) !important; color:#fff !important; font-weight:800; box-shadow:0 4px 14px rgba(0,96,57,0.35) !important;">
          🏛️ Havale / EFT ile Sipariş Ver
        </button>
        <a href="https://wa.me/905419305372?text=Merhaba%2C%20${encodeURIComponent(p.brand + ' ' + p.name)}%20(${p.ref || p.reference})%20hakk%C4%B1nda%20sipari%C5%9F%20vermek%20istiyorum." target="_blank" class="btn-hero-outline" style="text-align:center; padding:12px; text-decoration:none; display:block; color:#25D366; border-color:#25D366; font-weight:700;">
          💬 WhatsApp ile Sipariş Hattı
        </a>
        ` : `
        <button class="btn-art-buy" onclick="Cart.add('${p.id}'); App.updateHeaderCartCount(); App.closeQuickDrawer(); Router.navigate('cart');">
          Sepete Ekle &amp; Satın Al
        </button>
        `}
        <button class="btn-hero-outline" style="text-align:center; padding:12px;" onclick="App.closeQuickDrawer(); App.openProduct('${p.id}');">
          Detaylı Ekspertiz Sayfası &amp; Şartlar (10x Loupe)
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

  // ALTIN & MÜCEVHERAT KURUMSAL HAVALE / EFT SİPARİŞ MODALI
  openWireOrderModal(productId) {
    const p = typeof findProduct === 'function' ? findProduct(productId) : null;
    if (!p) return;
    let modal = document.getElementById('wireOrderModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'wireOrderModal';
      modal.style.cssText = 'position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); padding:16px;';
      modal.addEventListener('click', (e) => {
        if (e.target === modal) App.closeWireOrderModal();
      });
      document.body.appendChild(modal);
    }
    const formattedPrice = typeof formatPrice === 'function' ? formatPrice(p.price) : `₺${Number(p.price).toLocaleString('tr-TR')}`;
    const refCode = p.reference || p.ref || p.id;
    const waText = encodeURIComponent(`Merhaba, Belgin Kuyumculuk ${p.brand || 'Belgin'} ${p.name} (Ref: ${refCode}) modeli için Havale/EFT ve Showroom teslim siparişi oluşturmak istiyorum. Güncel Tutar: ${formattedPrice}`);
    modal.innerHTML = `
      <div style="background:#FFFFFF; max-width:520px; width:100%; border-radius:14px; border:2px solid #C2A768; box-shadow:0 20px 50px rgba(0,0,0,0.4); overflow:hidden; position:relative; font-family:var(--font-sans, sans-serif); animation:fadeInScale 0.2s ease-out;">
        <div style="background:linear-gradient(135deg, #05332F 0%, #0A4D46 100%); color:#FFFFFF; padding:18px 22px; display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #C2A768;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:22px;">🏛️</span>
            <div>
              <h3 style="margin:0; font-size:15px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; color:#E8D8A8;">Kurumsal Havale / EFT Siparişi</h3>
              <span style="font-size:11px; opacity:0.85; display:block; margin-top:2px;">Belgin Kuyumculuk · Buca Showroom</span>
            </div>
          </div>
          <button onclick="App.closeWireOrderModal()" style="background:rgba(255,255,255,0.15); border:none; color:#FFFFFF; font-size:22px; cursor:pointer; line-height:1; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center;" aria-label="Kapat">&times;</button>
        </div>

        <div style="padding:20px; max-height:82vh; overflow-y:auto;">
          <!-- Ürün Kartı Özeti -->
          <div style="display:flex; gap:14px; align-items:center; background:#FBF9F5; border:1px solid #EAE5D9; border-radius:10px; padding:12px 14px; margin-bottom:14px;">
            <img src="${p.image}" alt="${p.name}" style="width:64px; height:64px; object-fit:contain; border-radius:6px; background:#fff; border:1px solid #EAE5D9; padding:4px;">
            <div style="flex:1;">
              <span style="font-size:10.5px; color:#C2A768; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">${p.brand || 'Belgin Kuyumculuk'}</span>
              <strong style="display:block; font-size:13.5px; color:#1F2937; margin-bottom:2px; line-height:1.3;">${p.name}</strong>
              <span style="font-size:11.5px; color:#6B7280;">Ref: ${refCode}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:10px; color:#6B7280; display:block; text-transform:uppercase; font-weight:600;">Satış Tutarı</span>
              <strong style="font-size:17px; font-weight:800; color:#05332F;">${formattedPrice}</strong>
            </div>
          </div>

          <!-- Kırmızı & Altın Vurgulu Kesin Uyarı -->
          <div style="background:#FFFDF7; border:1.5px solid #C2A768; border-left:5px solid #B91C1C; border-radius:8px; padding:14px 16px; margin-bottom:14px;">
            <strong style="color:#B91C1C; font-size:12.5px; font-weight:800; display:block; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.3px;">
              🛡️ KURUMSAL SATIŞ VE ÖDEME BİLDİRİMİ
            </strong>
            <p style="font-size:12.5px; font-weight:600; color:#1F2937; line-height:1.55; margin:0 0 4px;">
              Mevzuat ve şirket politikalarımız gereğince <span style="color:#B91C1C;">Altın ve Mücevherat ürünlerinde KREDİ KARTI ile satış yapılmamaktadır</span>.
            </p>
            <p style="font-size:12px; color:#4B5563; line-height:1.5; margin:0;">
              Siparişinizi resmi kurumsal banka hesabımıza <strong>Havale / EFT / FAST</strong> yöntemiyle güvenle gerçekleştirebilir veya <strong>İzmir Buca showroom</strong> mağazamızda bizzat teslim alabilirsiniz.
            </p>
          </div>

          <!-- Kurumsal Banka Bilgileri -->
          <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:14px 16px; font-size:12px; color:#374151; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1px dashed #E5E7EB; padding-bottom:6px;">
              <span style="color:#6B7280;">Firma Unvanı:</span>
              <strong style="color:#111827;">BELGİN KUYUMCULUK - SEMİH SONBAHAR</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1px dashed #E5E7EB; padding-bottom:6px;">
              <span style="color:#6B7280;">Banka:</span>
              <strong style="color:#111827;">Kuveyt Türk Katılım Bankası</strong>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#6B7280;">Showroom:</span>
              <span style="color:#111827; font-weight:600;">Menderes Cad. No:231/B Buca / İzmir</span>
            </div>
          </div>

          <!-- Sipariş Butonları -->
          <div style="display:flex; flex-direction:column; gap:10px;">
            <a href="https://wa.me/905419305372?text=${waText}" target="_blank" rel="noopener" style="background:#25D366; color:#FFFFFF; font-weight:800; font-size:14.5px; padding:14px; border-radius:10px; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 14px rgba(37,211,102,0.35);">
              <span>💬 WhatsApp ile Siparişi Oluştur</span>
            </a>
            <button onclick="App.closeWireOrderModal()" style="background:#F3F4F6; color:#374151; font-weight:700; font-size:13px; padding:12px; border-radius:8px; border:1px solid #D1D5DB; cursor:pointer;">
              Pencereyi Kapat
            </button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  closeWireOrderModal() {
    const modal = document.getElementById('wireOrderModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  },

  // ==========================================================
  // ÜRÜN DETAY SAYFASI (SAAT&SAAT ENTERPRISE PDP MİMARİSİ)
  // ==========================================================
  openProduct(id, options = {}) {
    const p = findProduct(id);
    if (!p) return;
    window.currentOpenProductId = p.id;

    const container = document.getElementById('productDetailView');
    if (!container) return;

    const isGoldProduct = this.isJewelleryProduct(p);
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

    // Güvenli Ödeme Bannerı (Havale/EFT vs Tek Çekim 3D Secure)
    const secureBannerHtml = isGoldProduct ? `
      <div class="pdp-installment-banner" style="background:#FFFDF7; border:1.5px solid #C2A768; color:#3D2F12; padding:12px 14px; border-radius:6px; font-size:12.5px; margin-top:14px; line-height:1.55;">
        <span>🏛️ <strong>Ödeme &amp; Teslimat:</strong> Altın ve Mücevherat ürünlerinde <strong>yalnızca kurumsal Banka Havalesi / EFT / FAST</strong> ve İzmir Buca showroom mağazadan teslimat geçerlidir. Kredi kartı ile satış yapılmamaktadır.</span>
      </div>
    ` : `
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
          <span class="pdp-trust-item-icon">🏦</span>
          <div class="pdp-trust-item-text">
            <strong>Kurumsal Havale / EFT & FAST</strong>
            <span>Kredi kartı geçerli değildir. Kurumsal hesap güvencesiyle transfer.</span>
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
            <span>Sertifikalı & Ürün Bazında Kontrol Güvencesi</span>
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
            <li>Ürüne ait resmi garanti belgesi ve seri numaralı sertifikası</li>
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
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ödeme Şekli</span><span class="pdp-spec-value">Kurumsal Havale / EFT &amp; Showroom (Kredi Kartına Kapalı)</span></div>
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
    const isEliteWatch = (p.isElite || p.category === 'elit-saatler');
    const relatedProducts = allProds.filter(x => x.id !== p.id && (isEliteWatch ? (x.isElite || x.category === 'elit-saatler') : (!x.isElite && x.category !== 'elit-saatler')) && (x.brand === p.brand || x.category === p.category)).slice(0, 4);

    const breadcrumbCategory = isGoldProduct ? 'Mücevherat & Altın' : (isEliteWatch ? '👑 Elit Kategori' : 'Lüks Saatler');
    const breadcrumbPage = isGoldProduct ? 'ana-sayfa' : (isEliteWatch ? 'elit-kategori' : 'saatler');
    const brandFilterCall = isEliteWatch ? `App.filterEliteWatchesByBrand('${p.brand}', null)` : `App.filterWatchesByBrand('${p.brand}', null)`;

    container.innerHTML = `
      <div class="pdp-page-container">
        
        <!-- 1. Breadcrumbs -->
        <nav class="pdp-breadcrumbs" aria-label="Breadcrumb">
          <a href="#" data-page="ana-sayfa">Ana Sayfa</a>
          <span class="pdp-separator">/</span>
          <a href="#" data-page="${breadcrumbPage}">${breadcrumbCategory}</a>
          <span class="pdp-separator">/</span>
          <a href="#" onclick="${brandFilterCall}; return false;">${p.brand}</a>
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
            
            <div class="pdp-main-photo-box" id="pdpMainPhotoBox"
                 onmouseenter="App.initDesktopLoupe(this)"
                 onmousemove="App.handleDesktopLoupe(event, this)" 
                 onwheel="App.handleDesktopLoupeWheel(event, this)"
                 onmouseleave="App.resetDesktopLoupe(this)"
                 ontouchstart="App.handleMobileTouchLoupeStart(event, this)"
                 ontouchmove="App.handleMobileTouchLoupeMove(event, this)"
                 ontouchend="App.handleMobileTouchLoupeEnd(event, this)"
                 onclick="App.handlePhotoBoxClick(event)">
              ${isHighVal ? `
                <div class="pdp-badge-top-left">
                  <span class="pdp-badge-item pdp-badge-secure">🏛️ 12.000 TL+ MAĞAZA TESLİMİ</span>
                </div>
              ` : ''}
              <img src="${p.image}" alt="${p.brand} ${p.name}" id="pdpMainImageTarget" draggable="false">
              <div class="pdp-horlogerie-loupe" id="pdpHorlogerieLoupe">
                <span class="pdp-loupe-mag-badge" id="pdpLoupeMagBadge">3.5× MAKRO</span>
              </div>
              <div class="pdp-loupe-hint">
                <span class="pdp-hint-desktop">🔍 Optik Büyüteç İçin Gezdirin (Tekerlekle Yakınlaştır)</span>
                <span class="pdp-hint-mobile">🔍 Canlı Dokunmatik Büyüteç (Büyütmek İçin Kaydırın)</span>
              </div>
            </div>
          </div>

          <!-- SAĞ: Satın Alma & Özellikler Paneli (Buy Box) -->
          <div class="pdp-buy-box">
            <a href="#" onclick="${brandFilterCall}; return false;" class="pdp-brand-title">${p.brand}</a>
            <h1 class="pdp-product-title">${p.name}</h1>
            
            <div class="pdp-meta-row">
              <span>Ürün Kodu: <strong class="pdp-meta-sku">${p.ref || p.reference}</strong></span>
              <span>•</span>
              <span class="pdp-meta-stock">📦 Özel Sipariş ile Temin Edilir</span>
              <span>•</span>
              <span>Kategori: <strong>${p.subCategory || (isGoldProduct ? 'Altın & Mücevherat' : 'Lüks Saat')}</strong></span>
            </div>

            <!-- Özel Sipariş Temin Bilgisi -->
            <div class="pdp-special-procure-notice" style="display:flex; align-items:flex-start; gap:12px; background:rgba(194, 167, 104, 0.08); border:1px solid rgba(194, 167, 104, 0.35); border-radius:8px; padding:12px 16px; margin:14px 0 18px; font-size:13.5px; line-height:1.55; color:var(--color-ink);">
              <span style="font-size:20px; line-height:1; flex-shrink:0;">📦</span>
              <div>
                <strong style="color:var(--color-gold-dark); display:block; margin-bottom:3px; font-size:14px; font-weight:700;">Özel Sipariş ile Temin Edilir</strong>
                <span style="color:#555; display:block;">Ürün, talebiniz üzerine özel olarak temin edilir. Güncel temin süresi için bizimle iletişime geçebilirsiniz.</span>
              </div>
            </div>

            ${isGoldProduct ? `
            <!-- KURUMSAL BİLGİLENDİRME (KREDİ KARTI KAPALI) -->
            <div class="pdp-no-cc-notice" style="display:flex; align-items:flex-start; gap:14px; background:#FFFDF7; border:2px solid #C2A768; border-left:6px solid #B91C1C; border-radius:10px; padding:16px 20px; margin:0 0 16px; box-shadow:0 4px 14px rgba(194,167,104,0.15);">
              <span style="font-size:24px; line-height:1.2; flex-shrink:0;">🛡️</span>
              <div>
                <strong style="color:#B91C1C; display:block; margin-bottom:4px; font-size:13.5px; font-weight:800; letter-spacing:0.4px; text-transform:uppercase;">
                  Kurumsal Satış ve Ödeme Bildirimi
                </strong>
                <p style="font-size:13.5px; font-weight:700; color:#1F2937; line-height:1.55; margin:0 0 4px;">
                  Mevzuat ve şirket politikalarımız gereğince <span style="color:#B91C1C;">Altın ve Mücevherat ürünlerinde KREDİ KARTI ile satış yapılmamaktadır</span>.
                </p>
                <p style="font-size:12.5px; color:#4B5563; line-height:1.5; margin:0;">
                  Tüm altın, ziynet ve bilezik siparişlerinizi kurumsal <strong>Banka Havalesi / EFT / FAST</strong> yöntemiyle güvenle gerçekleştirebilir veya <strong>İzmir Buca showroom</strong> mağazamızda bizzat teslim alabilirsiniz.
                </p>
              </div>
            </div>
            ` : ''}

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
                  <span class="pdp-current-price" data-product-price-id="${p.id}">${formatPrice(p.price)}</span>
                  ${hasDiscount ? `<span class="pdp-discount-badge">-%${discountPercent} İNDİRİM</span>` : ''}
                </div>
              `}
              ${secureBannerHtml}
            </div>

            <!-- Hızlı Özet Teknik Çipler -->
            ${quickSpecsHtml}

            <!-- Aksiyon Butonları -->
            <div class="pdp-actions-row">
              ${isGoldProduct ? `
              <button class="pdp-btn-fast pdp-btn-wire" onclick="App.openWireOrderModal('${p.id}');" style="background:linear-gradient(135deg, #006039 0%, #004D2C 100%) !important; color:#fff !important; font-weight:800; padding:15px 28px; border-radius:10px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(0,96,57,0.35); font-size:14.5px;">
                <span>🏛️ Kurumsal Havale / EFT ile Sipariş Ver</span>
              </button>
              <a class="pdp-btn-whatsapp pdp-btn-whatsapp-labeled" href="https://wa.me/905419305372?text=Merhaba,%20${encodeURIComponent(p.brand + ' ' + p.name)}%20(${p.ref || p.reference})%20hakkinda%20Havale/EFT%20ve%20Showroom%20siparis%20bilgisi%20almak%20istiyorum." target="_blank" rel="noopener" style="background:#25D366; color:#fff; font-weight:700; padding:14px 22px; border-radius:10px; text-decoration:none; display:inline-flex; align-items:center; gap:8px; font-size:14px; box-shadow:0 4px 14px rgba(37,211,102,0.3);" aria-label="WhatsApp Satış Danışmanı">
                <span>💬 WhatsApp ile Sipariş</span>
              </a>
              ` : `
              <button class="pdp-btn-cart" onclick="Cart.add('${p.id}'); App.updateHeaderCartCount(); Router.navigate('sepet');">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>Sepete Ekle</span>
              </button>
              <button class="pdp-btn-fast" onclick="Cart.add('${p.id}'); App.updateHeaderCartCount(); Router.navigate('odeme');">
                <span>Hemen Satın Al</span>
              </button>
              <a class="pdp-btn-whatsapp" href="https://wa.me/905419305372?text=Merhaba,%20${encodeURIComponent(p.brand + ' ' + p.name)}%20(${p.ref || p.reference})%20hakkinda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener" aria-label="WhatsApp Satış Danışmanı">
                <span>💬</span>
              </a>
              `}
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
              <span>${isGoldProduct ? '🏛️ Havale/EFT & Showroom Ödeme' : '💳 3D Secure Güvenli Ödeme (Tek Çekim)'}</span>
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

  // ==========================================================
  // HAUTE HORLOGERIE & JEWELLERY PRECISION ZOOM CONTROLLER
  // ==========================================================
  _desktopLoupeFactor: 3.5,

  _touchLoupeState: {
    startX: 0,
    startY: 0,
    startTime: 0,
    hasMoved: false
  },
  _touchLoupeTimer: null,

  _zoomModalState: {
    scale: 1,
    posX: 0,
    posY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    initialDistance: 0,
    initialScale: 1,
    lastTap: 0,
    currentSrc: '',
    currentBrand: '',
    currentName: '',
    currentRef: '',
    isGold: false
  },

  _modalKeyHandler: null,

  initDesktopLoupe(container) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const img = container.querySelector('#pdpMainImageTarget') || container.querySelector('img');
    const loupe = container.querySelector('#pdpHorlogerieLoupe') || container.querySelector('.pdp-horlogerie-loupe');
    if (!img || !loupe) return;
    loupe.style.backgroundImage = `url("${img.src}")`;
    this._updateLoupeBadge(container);
  },

  _updateLoupeBadge(container) {
    const badge = container.querySelector('#pdpLoupeMagBadge') || container.querySelector('.pdp-loupe-mag-badge');
    if (badge) {
      badge.textContent = `${this._desktopLoupeFactor.toFixed(1)}× MAKRO`;
    }
  },

  handleDesktopLoupeWheel(e, container) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.3 : -0.3;
    this._desktopLoupeFactor = Math.max(2.0, Math.min(6.0, Number((this._desktopLoupeFactor + delta).toFixed(1))));
    this._updateLoupeBadge(container);
    this.handleDesktopLoupe(e, container);
  },

  handleDesktopLoupe(e, container) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const img = container.querySelector('#pdpMainImageTarget') || container.querySelector('img');
    const loupe = container.querySelector('#pdpHorlogerieLoupe') || container.querySelector('.pdp-horlogerie-loupe');
    const hint = container.querySelector('.pdp-loupe-hint');
    if (!img || !loupe) return;

    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Check bounds
    if (cursorX < 0 || cursorY < 0 || cursorX > rect.width || cursorY > rect.height) {
      this.resetDesktopLoupe(container);
      return;
    }

    const zoomFactor = this._desktopLoupeFactor || 3.5;
    const loupeRadius = 110; // 220px / 2

    loupe.classList.remove('touch-mode');
    loupe.classList.add('active');
    loupe.style.left = `${cursorX}px`;
    loupe.style.top = `${cursorY}px`;
    loupe.style.backgroundSize = `${rect.width * zoomFactor}px ${rect.height * zoomFactor}px`;
    loupe.style.backgroundPosition = `-${cursorX * zoomFactor - loupeRadius}px -${cursorY * zoomFactor - loupeRadius}px`;

    if (hint) hint.style.opacity = '0.2';
  },

  // Mobile Precision Touch Loupe (Offset above finger)
  handleMobileTouchLoupeStart(e, container) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const img = container.querySelector('#pdpMainImageTarget') || container.querySelector('img');
    const loupe = container.querySelector('#pdpHorlogerieLoupe') || container.querySelector('.pdp-horlogerie-loupe');
    if (!img || !loupe) return;

    loupe.style.backgroundImage = `url("${img.src}")`;
    this._updateLoupeBadge(container);

    this._touchLoupeState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      hasMoved: false
    };

    clearTimeout(this._touchLoupeTimer);
    this._touchLoupeTimer = setTimeout(() => {
      this.handleMobileTouchLoupeMove(e, container);
    }, 150);
  },

  handleMobileTouchLoupeMove(e, container) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    const cursorX = touch.clientX - rect.left;
    const cursorY = touch.clientY - rect.top;

    const deltaX = Math.abs(touch.clientX - this._touchLoupeState.startX);
    const deltaY = Math.abs(touch.clientY - this._touchLoupeState.startY);
    if (deltaX > 5 || deltaY > 5) {
      this._touchLoupeState.hasMoved = true;
      clearTimeout(this._touchLoupeTimer);
    }

    if (cursorX < -15 || cursorY < -15 || cursorX > rect.width + 15 || cursorY > rect.height + 15) {
      this.resetDesktopLoupe(container);
      return;
    }

    if (this._touchLoupeState.hasMoved || Date.now() - this._touchLoupeState.startTime > 150) {
      if (e.cancelable) e.preventDefault();
    }

    const img = container.querySelector('#pdpMainImageTarget') || container.querySelector('img');
    const loupe = container.querySelector('#pdpHorlogerieLoupe') || container.querySelector('.pdp-horlogerie-loupe');
    const hint = container.querySelector('.pdp-loupe-hint');
    if (!img || !loupe) return;

    const zoomFactor = this._desktopLoupeFactor || 3.5;
    const loupeRadius = 90; // 180px / 2

    loupe.classList.add('touch-mode');
    loupe.classList.add('active');
    loupe.style.left = `${cursorX}px`;
    loupe.style.top = `${cursorY}px`;
    loupe.style.backgroundSize = `${rect.width * zoomFactor}px ${rect.height * zoomFactor}px`;
    loupe.style.backgroundPosition = `-${cursorX * zoomFactor - loupeRadius}px -${cursorY * zoomFactor - loupeRadius}px`;

    if (hint) hint.style.opacity = '0.15';
  },

  handleMobileTouchLoupeEnd(e, container) {
    clearTimeout(this._touchLoupeTimer);
    const duration = Date.now() - this._touchLoupeState.startTime;
    const hasMoved = this._touchLoupeState.hasMoved;

    this.resetDesktopLoupe(container);

    if (duration < 280 && !hasMoved) {
      this.handlePhotoBoxClick(e);
    }
  },

  resetDesktopLoupe(container) {
    const loupe = container.querySelector('#pdpHorlogerieLoupe') || container.querySelector('.pdp-horlogerie-loupe');
    const hint = container.querySelector('.pdp-loupe-hint');
    if (loupe) {
      loupe.classList.remove('active');
      loupe.classList.remove('touch-mode');
    }
    if (hint) hint.style.opacity = '1';
  },

  handleZoom(e, container) {
    this.handleDesktopLoupe(e, container);
  },

  resetZoom(container) {
    this.resetDesktopLoupe(container);
  },

  handlePhotoBoxClick(e) {
    const img = document.getElementById('pdpMainImageTarget');
    if (!img) return;
    const brandEl = document.querySelector('.pdp-brand-title');
    const titleEl = document.querySelector('.pdp-product-title');
    const refEl = document.querySelector('.pdp-meta-sku');

    const brand = brandEl ? brandEl.textContent.trim() : 'Belgin Kuyumculuk';
    const name = titleEl ? titleEl.textContent.trim() : 'Lüks Koleksiyon';
    const ref = refEl ? refEl.textContent.trim() : '';

    this.openMobileZoomModal(img.src, brand, name, ref);
  },

  openMobileZoomModal(src, brand = '', name = '', ref = '') {
    const isGold = (brand + ' ' + name).toLowerCase().includes('altın') || 
                   (brand + ' ' + name).toLowerCase().includes('bilezik') || 
                   (brand + ' ' + name).toLowerCase().includes('çeyrek') || 
                   (brand + ' ' + name).toLowerCase().includes('ziynet') || 
                   (brand + ' ' + name).toLowerCase().includes('pırlanta');

    this._zoomModalState = {
      scale: 1,
      posX: 0,
      posY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      initialDistance: 0,
      initialScale: 1,
      lastTap: 0,
      currentSrc: src,
      currentBrand: brand,
      currentName: name,
      currentRef: ref,
      isGold: isGold
    };

    let modal = document.getElementById('pdpMobileZoomModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pdpMobileZoomModal';
      modal.className = 'pdp-mobile-zoom-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Haute Horlogerie & High Jewellery Precision Studio');
      document.body.appendChild(modal);
    }

    const preset1Label = '1× Genel';
    const preset2Label = isGold ? '2.5× Taş & Kesim' : '2.5× Kadran';
    const preset3Label = isGold ? '5× Mıhlama & Damga' : '5× Bezel & Kasa';
    const preset4Label = '8× Ultra Makro';

    modal.innerHTML = `
      <div class="pdp-zoom-header">
        <div class="pdp-zoom-brand-info">
          <div class="pdp-zoom-brand-row">
            <span class="pdp-zoom-brand">${brand || 'BELGIN KUYUMCULUK'}</span>
            <span class="pdp-zoom-live-pill">${isGold ? 'GEMOLOGY 10X' : 'HAUTE HORLOGERIE'}</span>
          </div>
          <span class="pdp-zoom-title">${name || 'Lüks Koleksiyon'} ${ref ? '(' + ref + ')' : ''}</span>
        </div>

        <div class="pdp-zoom-presets-row">
          <button class="pdp-zoom-preset-btn active" id="zoomPreset1" onclick="App.setPresetZoom(1, this)">${preset1Label}</button>
          <button class="pdp-zoom-preset-btn" id="zoomPreset2" onclick="App.setPresetZoom(2.5, this)">${preset2Label}</button>
          <button class="pdp-zoom-preset-btn" id="zoomPreset3" onclick="App.setPresetZoom(5, this)">${preset3Label}</button>
          <button class="pdp-zoom-preset-btn" id="zoomPreset4" onclick="App.setPresetZoom(8, this)">${preset4Label}</button>
        </div>

        <button class="pdp-zoom-close-btn" onclick="App.closeMobileZoomModal()" aria-label="Büyüteci Kapat">✕</button>
      </div>

      <div class="pdp-zoom-stage" id="pdpZoomStage">
        <div class="pdp-zoom-image-wrap" id="pdpZoomImageWrap">
          <img src="${src}" alt="${brand} ${name}" id="pdpZoomTargetImg" draggable="false">
        </div>

        <!-- Mini-Map Navigation Radar (Viewport Radar) -->
        <div class="pdp-zoom-radar-container" id="pdpZoomRadar" onclick="App.handleRadarClick(event)" title="Navigasyon Radarı">
          <img src="${src}" alt="Radar" class="pdp-zoom-radar-thumb" draggable="false">
          <div class="pdp-zoom-radar-viewfinder" id="pdpZoomRadarViewfinder"></div>
        </div>
      </div>

      <div class="pdp-zoom-footer-bar">
        <div class="pdp-zoom-instructions">
          <span class="pdp-zoom-readout-badge" id="pdpZoomReadout">1.0× ODAK</span>
          <span>🔍 Sürükle • Çift Tıkla • Tekerlek / Pinch ile Büyüt</span>
        </div>
        <div class="pdp-zoom-controls-group">
          <button class="pdp-zoom-ctrl-btn" onclick="App.zoomModalIn()">+ Yakınlaştır</button>
          <button class="pdp-zoom-ctrl-btn" onclick="App.zoomModalOut()">- Uzaklaştır</button>
          <button class="pdp-zoom-ctrl-btn" onclick="App.zoomModalReset()">1× Sıfırla</button>
        </div>
      </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.initZoomModalGestures();
    this.updateRadarViewfinder();

    // Keyboard controls
    if (this._modalKeyHandler) {
      window.removeEventListener('keydown', this._modalKeyHandler);
    }
    this._modalKeyHandler = (e) => {
      if (e.key === 'Escape') App.closeMobileZoomModal();
      else if (e.key === '+' || e.key === '=') App.zoomModalIn();
      else if (e.key === '-' || e.key === '_') App.zoomModalOut();
      else if (e.key === '0') App.zoomModalReset();
    };
    window.addEventListener('keydown', this._modalKeyHandler);
  },

  closeMobileZoomModal() {
    const modal = document.getElementById('pdpMobileZoomModal');
    if (modal) {
      modal.classList.remove('open');
      this._zoomModalState.scale = 1;
      this._zoomModalState.posX = 0;
      this._zoomModalState.posY = 0;
    }
    if (this._modalKeyHandler) {
      window.removeEventListener('keydown', this._modalKeyHandler);
      this._modalKeyHandler = null;
    }
    document.body.style.overflow = '';
  },

  setPresetZoom(targetScale, btnEl) {
    const s = this._zoomModalState;
    s.scale = targetScale;
    if (targetScale === 1) {
      s.posX = 0;
      s.posY = 0;
    }
    document.querySelectorAll('.pdp-zoom-preset-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    this.applyModalZoomTransform(true);
  },

  zoomModalIn() {
    const s = this._zoomModalState;
    s.scale = Math.min(8, Number((s.scale + 1).toFixed(2)));
    this._syncPresetButtonState();
    this.applyModalZoomTransform(true);
  },

  zoomModalOut() {
    const s = this._zoomModalState;
    s.scale = Math.max(1, Number((s.scale - 1).toFixed(2)));
    if (s.scale === 1) {
      s.posX = 0;
      s.posY = 0;
    }
    this._syncPresetButtonState();
    this.applyModalZoomTransform(true);
  },

  zoomModalReset() {
    const s = this._zoomModalState;
    s.scale = 1;
    s.posX = 0;
    s.posY = 0;
    document.querySelectorAll('.pdp-zoom-preset-btn').forEach((b, idx) => {
      b.classList.toggle('active', idx === 0);
    });
    this.applyModalZoomTransform(true);
  },

  _syncPresetButtonState() {
    const s = this._zoomModalState;
    document.querySelectorAll('.pdp-zoom-preset-btn').forEach((b, idx) => {
      if (idx === 0 && s.scale === 1) b.classList.add('active');
      else if (idx === 1 && s.scale >= 2 && s.scale < 4) b.classList.add('active');
      else if (idx === 2 && s.scale >= 4 && s.scale < 7) b.classList.add('active');
      else if (idx === 3 && s.scale >= 7) b.classList.add('active');
      else b.classList.remove('active');
    });
  },

  applyModalZoomTransform(animate = false) {
    const wrap = document.getElementById('pdpZoomImageWrap');
    if (!wrap) return;
    const s = this._zoomModalState;
    wrap.style.transition = animate ? 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    wrap.style.transform = `translate3d(${s.posX}px, ${s.posY}px, 0) scale(${s.scale})`;

    const readout = document.getElementById('pdpZoomReadout');
    if (readout) {
      readout.textContent = `${s.scale.toFixed(1)}× ODAK`;
    }

    this.updateRadarViewfinder();
  },

  updateRadarViewfinder() {
    const vf = document.getElementById('pdpZoomRadarViewfinder');
    const radar = document.getElementById('pdpZoomRadar');
    if (!vf || !radar) return;
    const s = this._zoomModalState;

    if (s.scale <= 1) {
      vf.style.display = 'none';
      return;
    }
    vf.style.display = 'block';

    const radarW = radar.clientWidth || 110;
    const radarH = radar.clientHeight || 110;
    const vfW = Math.max(16, radarW / s.scale);
    const vfH = Math.max(16, radarH / s.scale);

    const maxStageOffset = (s.scale - 1) * 280;
    const normX = maxStageOffset > 0 ? (s.posX / maxStageOffset) : 0;
    const normY = maxStageOffset > 0 ? (s.posY / maxStageOffset) : 0;

    const maxRadarOffset = (radarW - vfW) / 2;
    const vfLeft = (radarW - vfW) / 2 - (normX * maxRadarOffset);
    const vfTop = (radarH - vfH) / 2 - (normY * maxRadarOffset);

    vf.style.width = `${vfW}px`;
    vf.style.height = `${vfH}px`;
    vf.style.left = `${Math.max(0, Math.min(radarW - vfW, vfLeft))}px`;
    vf.style.top = `${Math.max(0, Math.min(radarH - vfH, vfTop))}px`;
  },

  handleRadarClick(e) {
    const radar = document.getElementById('pdpZoomRadar');
    if (!radar) return;
    const s = this._zoomModalState;
    if (s.scale <= 1) {
      s.scale = 3.5;
    }
    const rect = radar.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;

    const maxStageOffset = (s.scale - 1) * 280;
    s.posX = -(clickX / (rect.width / 2)) * maxStageOffset;
    s.posY = -(clickY / (rect.height / 2)) * maxStageOffset;
    this._syncPresetButtonState();
    this.applyModalZoomTransform(true);
  },

  initZoomModalGestures() {
    const stage = document.getElementById('pdpZoomStage');
    if (!stage) return;
    const self = this;
    const s = self._zoomModalState;

    let touchStartDist = 0;
    let initialTouchX = 0;
    let initialTouchY = 0;
    let initialPosX = 0;
    let initialPosY = 0;

    // Desktop Mouse Drag & Wheel Zoom
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseStartY = 0;
    let mouseStartPosX = 0;
    let mouseStartPosY = 0;

    stage.onmousedown = (e) => {
      if (e.target.closest('#pdpZoomRadar')) return;
      isMouseDown = true;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
      mouseStartPosX = s.posX;
      mouseStartPosY = s.posY;
      stage.classList.add('dragging');
    };

    window.onmousemove = (e) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - mouseStartX;
      const deltaY = e.clientY - mouseStartY;
      const maxOffset = (s.scale - 1) * 280;
      s.posX = Math.max(-maxOffset, Math.min(maxOffset, mouseStartPosX + deltaX));
      s.posY = Math.max(-maxOffset, Math.min(maxOffset, mouseStartPosY + deltaY));
      self.applyModalZoomTransform(false);
    };

    window.onmouseup = () => {
      if (isMouseDown) {
        isMouseDown = false;
        stage.classList.remove('dragging');
      }
    };

    stage.onwheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.5 : -0.5;
      s.scale = Math.max(1, Math.min(8, Number((s.scale + delta).toFixed(2))));
      if (s.scale === 1) {
        s.posX = 0;
        s.posY = 0;
      }
      self._syncPresetButtonState();
      self.applyModalZoomTransform(false);
    };

    // Helper for touch distance
    function getDistance(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        // Double tap detect
        const now = Date.now();
        if (now - s.lastTap < 300) {
          e.preventDefault();
          if (s.scale > 1.5) {
            s.scale = 1;
            s.posX = 0;
            s.posY = 0;
          } else if (s.scale === 1) {
            s.scale = 3.0;
          } else {
            s.scale = 6.0;
          }
          self._syncPresetButtonState();
          self.applyModalZoomTransform(true);
          s.lastTap = 0;
          return;
        }
        s.lastTap = now;

        // Single touch drag init
        if (s.scale > 1) {
          s.isDragging = true;
          initialTouchX = e.touches[0].clientX;
          initialTouchY = e.touches[0].clientY;
          initialPosX = s.posX;
          initialPosY = s.posY;
        }
      } else if (e.touches.length === 2) {
        // Pinch init
        s.isDragging = false;
        touchStartDist = getDistance(e.touches[0], e.touches[1]);
        s.initialScale = s.scale;
      }
    }, { passive: false });

    stage.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && s.isDragging && s.scale > 1) {
        const deltaX = e.touches[0].clientX - initialTouchX;
        const deltaY = e.touches[0].clientY - initialTouchY;
        const maxOffset = (s.scale - 1) * 280;
        s.posX = Math.max(-maxOffset, Math.min(maxOffset, initialPosX + deltaX));
        s.posY = Math.max(-maxOffset, Math.min(maxOffset, initialPosY + deltaY));
        self.applyModalZoomTransform(false);
      } else if (e.touches.length === 2 && touchStartDist > 0) {
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        const factor = currentDist / touchStartDist;
        s.scale = Math.max(1, Math.min(8, s.initialScale * factor));
        self._syncPresetButtonState();
        self.applyModalZoomTransform(false);
      }
    }, { passive: false });

    stage.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        s.isDragging = false;
        touchStartDist = 0;
        if (s.scale <= 1.05) {
          s.scale = 1;
          s.posX = 0;
          s.posY = 0;
          self._syncPresetButtonState();
          self.applyModalZoomTransform(true);
        }
      } else if (e.touches.length === 1 && s.scale > 1) {
        s.isDragging = true;
        initialTouchX = e.touches[0].clientX;
        initialTouchY = e.touches[0].clientY;
        initialPosX = s.posX;
        initialPosY = s.posY;
      }
    }, { passive: true });
  },

  // SEPET GÖRÜNÜMÜ
  // SEPET GÖRÜNÜMÜ
  renderCart() {
    const container = document.getElementById('cartItemsList') || document.getElementById('cartContent');
    if (!container) return;

    if (Cart.items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:56px 16px; color:var(--color-muted);">
          <div style="font-size:52px; margin-bottom:14px;">🛍️</div>
          <h3 style="font-size:20px; font-weight:700; color:var(--color-ink); margin-bottom:8px; font-family:var(--font-sans);">Sepetinizde Henüz Ürün Yok</h3>
          <p style="font-size:14px; color:var(--color-muted); margin-bottom:24px; max-width:400px; margin-left:auto; margin-right:auto;">Lüks saat ve mücevher koleksiyonlarımızı keşfetmeye hemen başlayın.</p>
          <a class="btn-hero-filled" href="#" data-page="saatler" style="display:inline-block; padding:12px 28px; font-weight:700; border-radius:6px;">Koleksiyonu Keşfet</a>
        </div>
      `;
      return;
    }

    const subtotal = Cart.getSubtotal();
    const discount = Cart.getDiscountAmount();
    const grandTotal = Cart.getTotal();
    const hasHighValue = Cart.items.some(item => (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(item) : item.price > 12000));
    const hasJewellery = Cart.items.some(item => {
      const p = (typeof findProduct === 'function' ? findProduct(item.id) : null) || item;
      return this.isJewelleryProduct(p);
    });

    container.innerHTML = `
      <div class="cart-items-wrapper" style="display:flex; flex-direction:column; gap:14px;">
        <div style="border-bottom:1.5px solid #EAE5D9; padding-bottom:10px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; font-weight:800; color:var(--color-ink); text-transform:uppercase; letter-spacing:0.5px;">Ürünler (${Cart.getCount()} Adet)</span>
          <button type="button" style="background:none; border:none; color:#DC2626; font-size:12px; font-weight:700; cursor:pointer; text-decoration:underline;" onclick="if(confirm('Sepetteki tüm ürünleri temizlemek istediğinize emin misiniz?')){ Cart.clear(); App.renderCart(); }">Tümünü Temizle</button>
        </div>

        ${Cart.items.map(item => {
          const itemKey = item.itemKey || item.id;
          const itemPrice = Number(item.price || 0);
          const linePrice = itemPrice * (Number(item.qty) || 1);
          return `
            <div class="cart-item-card" style="display:flex; justify-content:space-between; align-items:center; padding:16px; border:1px solid #EAE5D9; border-radius:10px; background:#FAFAFA; gap:14px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:14px; min-width:240px; flex:1;">
                <div style="width:68px; height:68px; border-radius:8px; overflow:hidden; border:1px solid #E2DCCF; background:#FFF; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                  <img src="${item.image || 'images/logo.png'}" alt="${item.name}" style="width:100%; height:100%; object-fit:contain;">
                </div>
                <div>
                  <h4 style="font-size:14.5px; font-weight:700; color:var(--color-ink); margin:0 0 4px; line-height:1.3;">${item.name}</h4>
                  <div style="font-size:12.5px; color:var(--color-muted); font-weight:600;">${formatPrice(itemPrice)} / adet</div>
                  ${item.ringSize ? `<div style="font-size:11px; color:var(--color-gold-dark); font-weight:700; margin-top:2px;">Ölçü: ${item.ringSize}</div>` : ''}
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
                <!-- Miktar Kontrolü (Artır / Azalt) -->
                <div style="display:inline-flex; align-items:center; border:1.5px solid #CBD5E1; border-radius:6px; background:#FFF; overflow:hidden;">
                  <button type="button" style="background:none; border:none; width:34px; height:34px; font-size:18px; font-weight:800; color:#334155; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="Cart.updateQty('${itemKey}', -1)">−</button>
                  <span style="min-width:34px; text-align:center; font-size:13.5px; font-weight:800; color:#0F172A; font-family:monospace;">${item.qty}</span>
                  <button type="button" style="background:none; border:none; width:34px; height:34px; font-size:18px; font-weight:800; color:#334155; cursor:pointer; display:flex; align-items:center; justify-content:center;" onclick="Cart.updateQty('${itemKey}', 1)">+</button>
                </div>

                <!-- Satır Tutarı -->
                <div style="font-size:16px; font-weight:800; color:var(--color-teal); min-width:110px; text-align:right;">
                  ${formatPrice(linePrice)}
                </div>

                <!-- Silme Butonu -->
                <button type="button" style="background:#FEE2E2; border:1px solid #FCA5A5; color:#DC2626; width:34px; height:34px; border-radius:6px; cursor:pointer; font-size:15px; font-weight:800; display:flex; align-items:center; justify-content:center;" onclick="Cart.remove('${itemKey}')" title="Ürünü Sepetten Kaldır">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('')}

        <!-- Hediye Paketi & VIP Hizmet -->
        <div style="background:#FFFDF7; border:1px solid #FDE68A; border-radius:8px; padding:14px; margin-top:6px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px; font-weight:700; color:#854D0E;">
            <input type="checkbox" ${Cart.giftWrap ? 'checked' : ''} onchange="Cart.toggleGiftWrap(this.checked)" style="accent-color:#D97706; width:16px; height:16px;">
            <span>🎁 Özel Belgin Lüks Kadife Hediye Paketi ve Mühürlü Kart İstiyorum (Ücretsiz VIP Hizmet)</span>
          </label>
        </div>

        ${hasHighValue ? `
          <div style="background:#FFF9EE; border:1px solid #E6D2A8; padding:14px 16px; border-radius:8px; margin-top:6px; font-size:12.5px; color:#6B531C; line-height:1.5;">
            <strong>🏛️ Yüksek Değerli Teslimat:</strong> Belgin Kuyumculuk Mağazasından Bizzat Teslim (Menderes Cad. No:231/B Buca / İzmir)<br>
            <span style="font-size:11.5px; color:#875A00;">Sepetinizde 12.000 TL üzeri yüksek değerli ürün bulunmaktadır. Güvenlik protokolü gereği mağazadan randevulu teslimat yapılmaktadır.</span>
          </div>
        ` : ''}

        ${hasJewellery ? `
          <div class="cart-jewellery-notice" style="background:#FFFDF7; border:1.5px solid #C2A768; border-radius:8px; padding:14px 16px; margin-top:6px; font-size:12.5px; color:#2B261D; line-height:1.55; box-shadow:0 2px 8px rgba(194,167,104,0.08);">
            <strong style="color:var(--color-teal); display:block; margin-bottom:4px; font-weight:800; text-transform:uppercase; letter-spacing:0.3px;">🛡️ Kurumsal Satış ve Ödeme Politikası</strong>
            Mevzuat ve şirket politikalarımız gereğince <strong>Altın ve Mücevherat ürünlerinde web sitemiz üzerinden KREDİ KARTI ile online satış yapılmamaktadır</strong>. Siparişlerinizi kurumsal <strong>Banka Havalesi / EFT / FAST</strong> yöntemiyle güvenle gerçekleştirebilir veya İzmir Buca showroom mağazamızda teslim alabilirsiniz.
          </div>
        ` : ''}

        <!-- Fiyat Özeti -->
        <div style="background:#FFF; border:1px solid #EAE5D9; border-radius:10px; padding:20px; margin-top:10px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13.5px; color:var(--color-muted);">
            <span>Ara Toplam (KDV Dahil)</span>
            <span style="font-weight:700; color:var(--color-ink);">${formatPrice(subtotal)}</span>
          </div>
          ${Cart.coupon && discount > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13.5px; color:var(--color-gold-dark);">
              <span>VIP İndirim (${Cart.coupon.code})</span>
              <span style="font-weight:700;">- ${formatPrice(discount)}</span>
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; margin-bottom:14px; font-size:13.5px; color:#15803D;">
            <span>Zırhlı / Sigortalı Teslimat</span>
            <span style="font-weight:700;">Ücretsiz VIP Hizmet</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1.5px solid #EAE5D9; padding-top:14px; margin-bottom:18px;">
            <span style="font-size:16px; font-weight:800; color:var(--color-ink);">Genel Toplam:</span>
            <span style="font-size:24px; font-weight:800; color:var(--color-teal);">${formatPrice(grandTotal)}</span>
          </div>

          <button type="button" class="btn-art-buy" style="width:100%; padding:15px; font-size:15px; font-weight:800; border-radius:8px; cursor:pointer;" onclick="Router.navigate('odeme')">
            ${hasJewellery ? `Havale / EFT Sipariş Adımına Geç (${formatPrice(grandTotal)})` : `🔒 Güvenli Ödeme Adımına Geç (${formatPrice(grandTotal)})`}
          </button>
        </div>
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
        <h3>Lüks Saatinizi Değerlendirin</h3>
        <button class="modal-dialog-close" onclick="App.closeModal()">×</button>
      </div>
      <form onsubmit="event.preventDefault(); showToast('Değerleme talebiniz uzman saat ekspertiz ekibimize iletildi. 15 dk içinde dönüş yapılacaktır.', 'success'); App.closeModal();">
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Marka & Kategori *</label>
          <select required style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
            <option value="">Seçiniz</option>
            <option>Rolex</option>
            <option>Patek Philippe</option>
            <option>Audemars Piguet</option>
            <option>Cartier</option>
            <option>Omega & TAG Heuer</option>
            <option>Diğer Lüks & Prestij Saatler</option>
          </select>
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Model & Referans Numarası *</label>
          <input type="text" placeholder="Örn: Submariner 16610LV veya Royal Oak 15500ST" required style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
        </div>
        <div style="margin-bottom:14px;">
          <label style="font-size:12px; font-weight:600; display:block; margin-bottom:4px;">Kutu & Sertifika Durumu</label>
          <select style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
            <option>Kutu ve Sertifika Tam Set</option>
            <option>Yalnızca Saat (Belgesiz)</option>
            <option>Yalnızca Sertifika / Garanti Kartı Var</option>
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
          <input type="text" placeholder="Örn: Rolex Kermit, Cartier Tank veya AP Royal Oak" style="width:100%; padding:10px; border:1px solid var(--color-border); border-radius:4px;">
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

  handleLiveSearch(query = "") {
    const clearBtn = document.getElementById("searchClearBtn");
    const metaEl = document.getElementById("searchResultsMeta");
    const listEl = document.getElementById("searchResultsList");
    if (!listEl) return;

    const term = (query || "").trim();
    if (clearBtn) {
      clearBtn.style.display = term ? "inline-flex" : "none";
    }

    let results = [];
    let didYouMean = null;
    let suggested = [];

    if (!term) {
      results = PRODUCTS.slice(0, 8);
      if (metaEl) {
        metaEl.style.display = "flex";
        metaEl.innerHTML = "<span>ÖNE ÇIKAN MODELLER & KOLEKSİYON</span><span>" + PRODUCTS.length.toLocaleString("tr-TR") + " Ürün</span>";
      }
    } else {
      const res = runBelginSearch(PRODUCTS, term);
      results = res.results;
      didYouMean = res.didYouMean;
      suggested = res.suggested;

      if (metaEl) {
        metaEl.style.display = "flex";
        if (results.length > 0) {
          metaEl.innerHTML = "<span>\"" + term + "\" İÇİN BULUNAN SONUÇLAR</span><span>" + results.length + " Adet</span>";
        } else if (suggested.length > 0) {
          metaEl.innerHTML = "<span>EN YAKIN İLGİLİ MODELLER</span><span>" + suggested.length + " Adet</span>";
        } else {
          metaEl.innerHTML = "<span>SONUÇ BULUNAMADI</span><span>0 Adet</span>";
        }
      }
    }

    const displayItems = results.length > 0 ? results : suggested;

    if (displayItems.length === 0) {
      listEl.innerHTML = "<div class=\"search-empty-state\">" +
        "<div class=\"search-empty-icon\">🔍</div>" +
        "<h4 class=\"search-empty-title\">\"" + term + "\" ile eşleşen model bulunamadı</h4>" +
        (didYouMean ? "<div style=\"margin: 12px 0;\"><button type=\"button\" onclick=\"const inp=document.getElementById('searchInput'); if(inp){ inp.value='" + didYouMean + "'; App.handleLiveSearch('" + didYouMean + "'); }\" style=\"background:#f4f4f5;border:1px solid #d4d4d8;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-weight:bold;color:#18181b;\">Bunu mu demek istediniz: <span style=\"text-decoration:underline;\">" + didYouMean + "</span> (Uygula ↵)</button></div>" : "") +
        "<p class=\"search-empty-desc\">Farklı bir marka adı, model referansı veya \"Rolex, Cartier, Altın, Saat\" gibi genel bir arama terimi deneyebilirsiniz.</p>" +
        "</div>";
      return;
    }

    const dymBanner = didYouMean && results.length > 0 ? "<div style=\"grid-column: 1/-1; margin-bottom: 8px;\">" +
      "<button type=\"button\" onclick=\"const inp=document.getElementById('searchInput'); if(inp){ inp.value='" + didYouMean + "'; App.handleLiveSearch('" + didYouMean + "'); }\" style=\"background:#ecfdf5;border:1px solid #a7f3d0;padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-weight:bold;color:#065f46;\">" +
      "Bunu mu demek istediniz: <span style=\"text-decoration:underline;\">" + didYouMean + "</span> (Uygula ↵)" +
      "</button></div>" : "";

    listEl.innerHTML = dymBanner + displayItems.slice(0, 24).map(p => {
      const img = p.image || p.img || (p.images && p.images[0]) || "images/belgin-logo.png";
      const brand = p.brand || (p.category === "gold" ? "24K ALTIN" : "MÜCEVHERAT");
      const title = ((p.brand || "") + " " + (p.name || "")).trim();
      const ref = p.reference || p.ref || p.metal || (p.category === "gold" ? "Sertifikalı Külçe/Ziynet" : "Özel Koleksiyon");
      const priceFormatted = (typeof formatPrice === "function") ? formatPrice(p.price) : ("₺" + Number(p.price).toLocaleString("tr-TR"));

      return "<div class=\"search-result-item\" onclick=\"App.closeSearchModal(); App.openProduct('" + p.id + "');\">" +
        "<img src=\"" + img + "\" alt=\"" + title + "\" class=\"search-result-thumb\" loading=\"lazy\">" +
        "<div class=\"search-result-info\">" +
        "<span class=\"search-result-brand\">" + brand + "</span>" +
        "<div class=\"search-result-title\">" + title + "</div>" +
        "<span class=\"search-result-ref\">" + ref + "</span>" +
        "</div>" +
        "<div class=\"search-result-price\">" + priceFormatted + "</div>" +
        "</div>";
    }).join("");
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

  // ==========================================================
  // CANLI PİYASALAR & ALTIN FİYATLARI (HAREM ALTIN & İZKO)
  // ==========================================================
  LIVE_MARKETS_CATALOG: [
    // 1. Sarrafiye & Ziynet
    { code: 'CEYREK_YENI', name: 'Yeni Çeyrek Altın', category: 'sarrafiye', karats: '22 Ayar • 1.75 gr', icon: '🪙', fallbackKey: 'quarterGold', buyRatio: 0.985 },
    { code: 'CEYREK_ESKI', name: 'Eski Çeyrek Altın', category: 'sarrafiye', karats: '22 Ayar • 1.75 gr', icon: '🪙', fallbackKey: 'oldQuarterGold', buyRatio: 0.985 },
    { code: 'YARIM_YENI', name: 'Yeni Yarım Altın', category: 'sarrafiye', karats: '22 Ayar • 3.50 gr', icon: '🪙', fallbackKey: 'halfGold', buyRatio: 0.985 },
    { code: 'YARIM_ESKI', name: 'Eski Yarım Altın', category: 'sarrafiye', karats: '22 Ayar • 3.50 gr', icon: '🪙', fallbackKey: 'oldHalfGold', buyRatio: 0.985 },
    { code: 'TEK_YENI', name: 'Yeni Tam / Ziynet Altın', category: 'sarrafiye', karats: '22 Ayar • 7.00 gr', icon: '🪙', fallbackKey: 'fullGold', buyRatio: 0.985 },
    { code: 'TEK_ESKI', name: 'Eski Tam Altın', category: 'sarrafiye', karats: '22 Ayar • 7.00 gr', icon: '🪙', fallbackKey: 'oldFullGold', buyRatio: 0.985 },
    { code: 'ATA_YENI', name: 'Yeni Ata / Cumhuriyet Lira', category: 'sarrafiye', karats: '22 Ayar • 7.21 gr', icon: '🏅', fallbackKey: 'ataGold', buyRatio: 0.985 },
    { code: 'ATA_ESKI', name: 'Eski Ata Lira', category: 'sarrafiye', karats: '22 Ayar • 7.21 gr', icon: '🏅', fallbackKey: 'oldAtaGold', buyRatio: 0.985 },
    { code: 'GREMESE_YENI', name: 'Yeni Gremse Altın (10\'luk)', category: 'sarrafiye', karats: '22 Ayar • 17.54 gr', icon: '👑', fallbackKey: 'gremeseGold', buyRatio: 0.985 },
    { code: 'GREMESE_ESKI', name: 'Eski Gremse Altın', category: 'sarrafiye', karats: '22 Ayar • 17.54 gr', icon: '👑', fallbackKey: 'oldGremeseGold', buyRatio: 0.985 },
    { code: 'ATA5_YENI', name: 'Yeni 5\'li Ata Altını', category: 'sarrafiye', karats: '22 Ayar • 36.08 gr', icon: '🏆', fallbackKey: 'ata5Gold', buyRatio: 0.985 },
    { code: 'ATA5_ESKI', name: 'Eski 5\'li Ata Altını', category: 'sarrafiye', karats: '22 Ayar • 36.08 gr', icon: '🏆', fallbackKey: 'oldAta5Gold', buyRatio: 0.985 },

    // 2. Külçe & Ayar Bazlı Masif Altın
    { code: 'ALTIN', name: '24 Ayar Has Altın (Gram / TL)', category: 'kulce', karats: '24 Ayar • %99.5 Saf', icon: '✨', fallbackKey: 'gramGold24k', buyRatio: 0.99 },
    { code: 'KULCEALTIN', name: '1 gr Paketli Has Külçe Altın', category: 'kulce', karats: '24 Ayar • Darphane/IAR', icon: '📦', fallbackKey: 'packagedGold', buyRatio: 0.985 },
    { code: 'AYAR22', name: '22 Ayar Bilezik / Hurda (Gram)', category: 'kulce', karats: '22 Ayar • %91.6 Milyem', icon: '💫', fallbackKey: 'gramGold22k', buyRatio: 0.96 },
    { code: 'AYAR18', name: '18 Ayar Mücevher Altını (Gram)', category: 'kulce', karats: '18 Ayar • %75.0 Milyem', icon: '💍', fallbackKey: 'gramGold18k', buyRatio: 0.95 },
    { code: 'AYAR14', name: '14 Ayar Takı Altını (Gram)', category: 'kulce', karats: '14 Ayar • %58.5 Milyem', icon: '⭐', fallbackKey: 'gramGold14k', buyRatio: 0.94 },
    { code: 'AYAR8', name: '8 Ayar Takı Altını (Gram)', category: 'kulce', karats: '8 Ayar • %33.3 Milyem', icon: '🔸', fallbackKey: 'gramGold8k', buyRatio: 0.92 },
    { code: 'ONS', name: 'ONS Altın (XAU / USD)', category: 'kulce', karats: 'Uluslararası Spot Altın', icon: '🌍', isUsd: true, fallbackKey: 'ons', buyRatio: 0.998 },
    { code: 'USDKG', name: 'Külçe Altın (USD / KG)', category: 'kulce', karats: '1 Kilogram Külçe (USD)', icon: '💵', isUsd: true, fallbackVal: 93450, buyRatio: 0.997 },
    { code: 'EURKG', name: 'Külçe Altın (EUR / KG)', category: 'kulce', karats: '1 Kilogram Külçe (EUR)', icon: '💶', isEur: true, fallbackVal: 89200, buyRatio: 0.997 },

    // 3. Kıymetli Madenler & Döviz
    { code: 'USDTRY', name: 'Amerikan Doları (USD / TRY)', category: 'doviz', karats: 'Serbest Piyasa Döviz', icon: '💵', isCurrency: true, fallbackKey: 'usdTry', buyRatio: 0.995 },
    { code: 'EURTRY', name: 'Euro (EUR / TRY)', category: 'doviz', karats: 'Serbest Piyasa Döviz', icon: '💶', isCurrency: true, fallbackKey: 'eurTry', buyRatio: 0.995 },
    { code: 'GBPTRY', name: 'İngiliz Sterlini (GBP / TRY)', category: 'doviz', karats: 'Serbest Piyasa Döviz', icon: '💷', isCurrency: true, fallbackKey: 'gbpTry', buyRatio: 0.994 },
    { code: 'GUMUSTRY', name: 'Gümüş (Gram / TRY)', category: 'doviz', karats: 'Saf Külçe Gümüş (999)', icon: '🥈', fallbackKey: 'silverTry', buyRatio: 0.96 },
    { code: 'GUMUSUSD', name: 'Gümüş ONS (XAG / USD)', category: 'doviz', karats: 'Spot Gümüş ONS', icon: '🪙', isUsd: true, fallbackKey: 'silverUsd', buyRatio: 0.99 },
    { code: 'PLATIN', name: 'Platin ONS (XPT / USD)', category: 'doviz', karats: 'Spot Platin ONS', icon: '⚪', isUsd: true, fallbackVal: 980, buyRatio: 0.99 },
    { code: 'PALADYUM', name: 'Paladyum ONS (XPD / USD)', category: 'doviz', karats: 'Spot Paladyum ONS', icon: '🔘', isUsd: true, fallbackVal: 1020, buyRatio: 0.99 }
  ],

  updateLiveClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateDotStr = now.toLocaleDateString('tr-TR');

    const clockEls = document.querySelectorAll('#exactLiveTime, #livePageClock, .live-js-clock');
    const dateEls = document.querySelectorAll('#exactLiveDate, #livePageDate, .live-js-date');

    clockEls.forEach(el => { el.textContent = timeStr; });
    dateEls.forEach(el => { el.textContent = dateDotStr; });
  },

  setLiveRatesCategory(category) {
    this.currentLiveRatesCategory = category || 'all';
    this.updateLivePricesTableDOM();
  },

  renderLivePricesPage() {
    const container = document.getElementById('page-canli-fiyatlar');
    if (!container) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateDotStr = now.toLocaleDateString('tr-TR');

    container.innerHTML = `
      <div class="page-canli-fiyatlar-wrapper">
        <div class="container-art" style="max-width: 100%; width: 100%; height: 100%; padding: 0; margin: 0;">
          
          <!-- BİREBİR DİJİTAL KUYUMCU TABELASI (#fff200) -->
          <div class="board-exact-frame">
            
            <!-- Üst Kırmızı Başlık Metni -->
            <div class="board-exact-top-bar">
              Belgin Kuyumculuk Canlı Satış Fiyatlarıdır.
            </div>

            <!-- Birebir Tablo -->
            <table class="board-exact-table">
              <thead>
                <tr>
                  <th style="width: 38%;">ALTIN</th>
                  <th style="width: 31%;">SATIŞ</th>
                  <th style="width: 31%;">HOŞGELDİNİZ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                <td class="td-label">22 AYAR</td>
                <td class="td-price"><span class="price-num" id="live_22k">6.646</span></td>
                <td class="td-right-message" rowspan="5">
                  <div class="right-message-inner">
                    <div class="right-title">BELGİN</div>
                    <div class="right-title">KUYUMCULUK</div>
                    <div class="right-sub">CANLI</div>
                    <div class="right-sub">SATIŞ</div>
                    <div class="right-sub">FİYATLARIDIR!</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="td-label">18 AYAR</td>
                <td class="td-price"><span class="price-num" id="live_18k">5.319</span></td>
              </tr>
              <tr>
                <td class="td-label">14 AYAR</td>
                <td class="td-price"><span class="price-num" id="live_14k">5.125</span></td>
              </tr>
              <tr>
                <td class="td-label">GRAM ALTIN</td>
                <td class="td-price"><span class="price-num" id="live_gram">7.092</span></td>
              </tr>
              <tr>
                <td class="td-label">CUMHURİYET</td>
                <td class="td-price"><span class="price-num" id="live_cumhuriyet">47.005</span></td>
              </tr>
              <tr class="tr-sarrafiye-header">
                <td style="background-color:#fff200; border: 2px solid #000;"></td>
                <th style="border: 2px solid #000;">YENİ</th>
                <th style="border: 2px solid #000;">ESKİ</th>
              </tr>
              <tr>
                <td class="td-label">ÇEYREK</td>
                <td class="td-price"><span class="price-num" id="live_ceyrek_yeni">11.601</span></td>
                <td class="td-price"><span class="price-num" id="live_ceyrek_eski">11.388</span></td>
              </tr>
              <tr>
                <td class="td-label">YARIM</td>
                <td class="td-price"><span class="price-num" id="live_yarim_yeni">23.173</span></td>
                <td class="td-price"><span class="price-num" id="live_yarim_eski">22.740</span></td>
              </tr>
              <tr>
                <td class="td-label">ZİYNET</td>
                <td class="td-price"><span class="price-num" id="live_ziynet_yeni">46.189</span></td>
                <td class="td-price"><span class="price-num" id="live_ziynet_eski">45.551</span></td>
              </tr>
              <tr>
                <td class="td-has-label">HAS ALTIN:</td>
                <td colspan="2" style="text-align: center; border: 2px solid #000;">
                  <span class="has-red-box"><span class="price-num" id="live_has_altin">7.091,96</span></span>
                </td>
              </tr>
              </tbody>
            </table>

          </div>

        </div>
      </div>
    `;

    this.updateLivePricesTableDOM();
  },

  _prevBoardValues: {},
  _activeAnimationTimers: {},

  updateLivePricesTableDOM() {
    const formatIntOrDec = (val, dec = 0) => {
      if (!val || isNaN(val)) return '--';
      return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };

    const rawItems = LIVE_MARKET_DATA.items || {};
    const BOARD_MARGIN = 1.03; // Sarı Tabela Canlı Satış Kâr Marjı (+%3)

    const baseHas = parseFloat(rawItems.ALTIN?.satis) || LIVE_MARKET_DATA.hasAltin || LIVE_MARKET_DATA.gramGold24k || 6885.40;
    const baseGram = parseFloat(rawItems.ALTIN?.satis) || LIVE_MARKET_DATA.gramGold24k || baseHas;
    const base22k = parseFloat(rawItems.AYAR22?.satis) || LIVE_MARKET_DATA.gramGold22k || Math.round(baseHas * 0.937);
    const base18k = parseFloat(rawItems.AYAR18?.satis) || LIVE_MARKET_DATA.gramGold18k || Math.round(baseHas * 0.750);
    const base14k = parseFloat(rawItems.AYAR14?.satis) || LIVE_MARKET_DATA.gramGold14k || Math.round(baseHas * 0.722);
    const baseAta = parseFloat(rawItems.ATA_YENI?.satis) || LIVE_MARKET_DATA.ataGold || 45636;
    
    const baseCeyrekYeni = parseFloat(rawItems.CEYREK_YENI?.satis) || LIVE_MARKET_DATA.quarterGold || 11263;
    const baseCeyrekEski = parseFloat(rawItems.CEYREK_ESKI?.satis) || LIVE_MARKET_DATA.oldQuarterGold || 11056;
    const baseYarimYeni = parseFloat(rawItems.YARIM_YENI?.satis) || LIVE_MARKET_DATA.halfGold || 22498;
    const baseYarimEski = parseFloat(rawItems.YARIM_ESKI?.satis) || LIVE_MARKET_DATA.oldHalfGold || 22078;
    const baseZiynetYeni = parseFloat(rawItems.TEK_YENI?.satis) || LIVE_MARKET_DATA.fullGold || 44844;
    const baseZiynetEski = parseFloat(rawItems.TEK_ESKI?.satis) || LIVE_MARKET_DATA.oldFullGold || 44224;

    const pHas = Number((baseHas * BOARD_MARGIN).toFixed(2));
    const pGram = Math.round(baseGram * BOARD_MARGIN);
    const p22k = Math.round(base22k * BOARD_MARGIN);
    const p18k = Math.round(base18k * BOARD_MARGIN);
    const p14k = Math.round(base14k * BOARD_MARGIN);
    const pAta = Math.round(baseAta * BOARD_MARGIN);
    const pCeyrekYeni = Math.round(baseCeyrekYeni * BOARD_MARGIN);
    const pCeyrekEski = Math.round(baseCeyrekEski * BOARD_MARGIN);
    const pYarimYeni = Math.round(baseYarimYeni * BOARD_MARGIN);
    const pYarimEski = Math.round(baseYarimEski * BOARD_MARGIN);
    const pZiynetYeni = Math.round(baseZiynetYeni * BOARD_MARGIN);
    const pZiynetEski = Math.round(baseZiynetEski * BOARD_MARGIN);

    const setPriceCell = (id, text, numVal) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const prev = this._prevBoardValues[id];
      el.textContent = text;

      // SADECE değeri gerçekten değişen hücreyi 5 saniye boyunca yaylandır / yanıp söndür
      if (prev !== undefined && prev !== numVal) {
        if (this._activeAnimationTimers[id]) {
          clearTimeout(this._activeAnimationTimers[id]);
        }
        el.classList.remove('price-changed-active');
        void el.offsetWidth; // Reflow tetikle
        el.classList.add('price-changed-active');

        this._activeAnimationTimers[id] = setTimeout(() => {
          el.classList.remove('price-changed-active');
          delete this._activeAnimationTimers[id];
        }, 5000); // 5 saniye boyunca aktif kalır
      }
      this._prevBoardValues[id] = numVal;
    };

    setPriceCell('live_22k', formatIntOrDec(p22k, 0), p22k);
    setPriceCell('live_18k', formatIntOrDec(p18k, 0), p18k);
    setPriceCell('live_14k', formatIntOrDec(p14k, 0), p14k);
    setPriceCell('live_gram', formatIntOrDec(pGram, 0), pGram);
    setPriceCell('live_cumhuriyet', formatIntOrDec(pAta, 0), pAta);

    setPriceCell('live_ceyrek_yeni', formatIntOrDec(pCeyrekYeni, 0), pCeyrekYeni);
    setPriceCell('live_ceyrek_eski', formatIntOrDec(pCeyrekEski, 0), pCeyrekEski);
    setPriceCell('live_yarim_yeni', formatIntOrDec(pYarimYeni, 0), pYarimYeni);
    setPriceCell('live_yarim_eski', formatIntOrDec(pYarimEski, 0), pYarimEski);
    setPriceCell('live_ziynet_yeni', formatIntOrDec(pZiynetYeni, 0), pZiynetYeni);
    setPriceCell('live_ziynet_eski', formatIntOrDec(pZiynetEski, 0), pZiynetEski);
    setPriceCell('live_has_altin', formatIntOrDec(pHas, 2), pHas);
  },

  onLivePricesUpdated() {
    this.updateLiveClock();
    this.updateLivePricesTableDOM();
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
    this.syncCheckoutPaymentUI();
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

  renderCheckoutDeliveryOptions() {
    const container = document.getElementById('checkoutDeliveryContent');
    if (!container) return;

    let items = (typeof Cart !== 'undefined' && Cart.items && Cart.items.length > 0) ? [...Cart.items] : [];
    // Saatler kategorisindeki tüm sıfır saatler için ücretsiz kargo serbesttir (Seçkin Ürünler ve Altın HARİÇ)
    const isCargoEligible = items.length > 0 && items.every(item => {
      const p = (typeof findProduct === 'function' ? findProduct(item.id) : null) || item;
      const cat = String(p.category || item.category || '').toLowerCase();
      const isPreOwned = p.isPreOwned === true || cat === 'seckin-urunler' || cat === 'ikinci-el' || cat === 'luxury';
      const isGold = Boolean(p.isGold) || Boolean(item.isGold) || ['altin', 'gold', 'mucevherat', 'jewelry', 'jewellery'].includes(cat);
      const isWatch = (cat === 'saat' || cat === 'watch');
      return isWatch && !isPreOwned && !isGold;
    });

    if (isCargoEligible) {
      container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <!-- 1. Seçenek: Ücretsiz Sigortalı Kargo (Varsayılan) -->
          <label style="border:1.5px solid #084C47; background:#F2F8F7; padding:12px 14px; border-radius:8px; display:flex; align-items:flex-start; justify-content:space-between; cursor:pointer; gap:10px;">
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <input type="radio" name="shippingMethod" value="carrier" checked onchange="App.onDeliveryMethodChange('carrier')" style="margin-top:3px; accent-color:var(--color-teal); width:16px; height:16px;">
              <div>
                <strong style="font-size:13px; color:var(--color-teal); display:flex; align-items:center; gap:6px;">
                  <span>📦 Ücretsiz Sigortalı Kargo ile Adrese Teslim</span>
                  <span style="font-size:10.5px; background:#E8F5E9; color:#1B5E20; padding:1px 6px; border-radius:4px; font-weight:700; border:1px solid #A5D6A7;">ÜCRETSİZ</span>
                </strong>
                <span style="font-size:11.5px; color:#444; display:block; margin-top:2px;">Türkiye geneli sigortalı ve takip numaralı ücretsiz kargo gönderimi.</span>
              </div>
            </div>
          </label>

          <!-- 2. Seçenek: Showroom Mağazadan Teslim -->
          <label style="border:1px solid #D8D2C5; background:#FAFAFA; padding:12px 14px; border-radius:8px; display:flex; align-items:flex-start; justify-content:space-between; cursor:pointer; gap:10px;">
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <input type="radio" name="shippingMethod" value="showroom" onchange="App.onDeliveryMethodChange('showroom')" style="margin-top:3px; accent-color:var(--color-teal); width:16px; height:16px;">
              <div>
                <strong style="font-size:13px; color:#222; display:block;">🏛️ İzmir Buca Showroom Mağazadan Teslimat</strong>
                <span style="font-size:11.5px; color:#666; display:block; margin-top:2px;">Menderes Cad. No:231/B Buca / İzmir</span>
              </div>
            </div>
          </label>

          <!-- Kargo Gönderi Adresi Alanları -->
          <div id="shippingAddressFields" style="margin-top:6px; background:#F8FAFA; border:1px solid #CBE5E2; padding:14px 16px; border-radius:8px;">
            <h4 style="margin:0 0 10px; font-size:12.5px; font-weight:800; color:var(--color-teal); display:flex; align-items:center; gap:6px;">
              <span>📍 Kargo Teslimat & Gönderi Adresi</span>
            </h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
              <div>
                <label style="font-size:11.5px; font-weight:700; display:block; margin-bottom:4px; color:#333;">İl / Şehir *</label>
                <input type="text" id="checkoutCity" required placeholder="Örn: İzmir, İstanbul, Ankara" style="width:100%; padding:9px 12px; border:1.5px solid #D8D2C5; border-radius:6px; font-family:inherit; font-size:13px; background:#FFF; box-sizing:border-box;">
              </div>
              <div>
                <label style="font-size:11.5px; font-weight:700; display:block; margin-bottom:4px; color:#333;">İlçe *</label>
                <input type="text" id="checkoutDistrict" required placeholder="Örn: Buca, Kadıköy, Çankaya" style="width:100%; padding:9px 12px; border:1.5px solid #D8D2C5; border-radius:6px; font-family:inherit; font-size:13px; background:#FFF; box-sizing:border-box;">
              </div>
            </div>
            <div>
              <label style="font-size:11.5px; font-weight:700; display:block; margin-bottom:4px; color:#333;">Açık Teslimat Adresi (Cadde, Mahalle, Sokak, No, Daire) *</label>
              <textarea id="checkoutAddress" required rows="2" placeholder="Kargonuzun ulaştırılacağı açık adresi eksiksiz yazınız..." style="width:100%; padding:9px 12px; border:1.5px solid #D8D2C5; border-radius:6px; font-family:inherit; font-size:13px; background:#FFF; box-sizing:border-box; resize:vertical;"></textarea>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="border:1px solid #CBE5E2; background:#F4FAF9; padding:12px 14px; border-radius:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
          <div>
            <strong style="font-size:13px; color:var(--color-ink); display:block; margin-bottom:2px;">İzmir Buca Showroom Mağazadan Teslimat</strong>
            <span style="font-size:11.5px; color:#555;">Menderes Cad. No:231/B Buca / İzmir · 12.000 TL+ MASAK Kimlik İbraz Protokolü</span>
          </div>
          <input type="radio" name="shippingMethod" value="showroom" checked style="accent-color:var(--color-teal); width:16px; height:16px;">
        </div>
      `;
    }
  },

  onDeliveryMethodChange(method) {
    const addressBox = document.getElementById('shippingAddressFields');
    if (!addressBox) return;
    if (method === 'carrier' || method === 'cargo') {
      addressBox.style.display = 'block';
    } else {
      addressBox.style.display = 'none';
    }
  },

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

    // Teslimat Yöntemi ve Kargo Adresi Doğrulaması
    const shippingRadio = document.querySelector('input[name="shippingMethod"]:checked');
    const selectedMethod = shippingRadio ? shippingRadio.value : 'showroom';
    let customerAddress = 'Showroom / Mağazadan Teslim';

    if (selectedMethod === 'carrier' || selectedMethod === 'cargo') {
      const city = (document.getElementById('checkoutCity')?.value || '').trim();
      const district = (document.getElementById('checkoutDistrict')?.value || '').trim();
      const address = (document.getElementById('checkoutAddress')?.value || '').trim();

      if (!city || !district || !address || address.length < 8) {
        if (typeof showToast === 'function') showToast('Lütfen ücretsiz kargo için teslimat ili, ilçesi ve açık adresinizi eksiksiz giriniz.', 'error');
        else alert('Lütfen teslimat adresinizi eksiksiz giriniz.');
        document.getElementById('checkoutAddress')?.focus();
        return;
      }
      customerAddress = `${address}, ${district} / ${city}`;
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

    let items = (typeof Cart !== 'undefined' && Cart.items) ? Cart.items.filter(i => i && i.id && i.id !== 'undefined') : [];
    if (items.length === 0) {
      if (typeof showToast === 'function') showToast('Sepetiniz boş. Lütfen önce ürün seçiniz.', 'error');
      else alert('Sepetiniz boş. Lütfen önce ürün seçiniz.');
      Router.navigate('saatler');
      return;
    }

    const customerFullName = `${fn} ${ln}`;

    const hasJewellery = items.some(item => {
      const p = (typeof findProduct === 'function' ? findProduct(item.id) : null) || item;
      return this.isJewelleryProduct(p);
    });

    if (hasJewellery) {
      // ALTIN & MÜCEVHERAT: KREDİ KARTI KESİNLİKLE KAPALIDIR. KURUMSAL HAVALE / EFT PROTOKOLÜ ÇALIŞTIRILIR.
      const orderId = 'BLG-HV-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
      const grandTotal = typeof Cart !== 'undefined' ? Cart.getTotal() : 0;
      const formattedTotal = typeof formatPrice === 'function' ? formatPrice(grandTotal) : `₺${grandTotal.toLocaleString('tr-TR')}`;

      const orderDraft = {
        orderId,
        paymentMethod: 'HAVALE_EFT',
        customerName: customerFullName,
        customerPhone: phone,
        customerEmail: email,
        customerIdentity: identity || '',
        customerAddress: customerAddress,
        deliveryMethod: selectedMethod === 'showroom' ? 'showroom' : 'carrier',
        items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        totalAmount: grandTotal,
        formattedTotal,
        createdAt: new Date().toISOString()
      };
      try {
        localStorage.setItem('belgin_last_order', JSON.stringify(orderDraft));
        sessionStorage.setItem('belgin_last_order', JSON.stringify(orderDraft));
      } catch (_) {}

      if (typeof Cart !== 'undefined') {
        Cart.clear();
      }
      this.updateHeaderCartCount();

      this.openWireOrderSuccessModal(orderDraft);
      return;
    }

    const rawCardNum = (document.getElementById('checkoutCardNumber')?.value || '').replace(/\D/g, '');
    const rawCardExp = (document.getElementById('checkoutCardExpiry')?.value || '').trim();
    const rawCardCvc = (document.getElementById('checkoutCardCvc')?.value || '').replace(/\D/g, '');
    const cardHolder = (document.getElementById('checkoutCardHolder')?.value || customerFullName).trim().toLocaleUpperCase('tr-TR');

    if (document.getElementById('checkoutCardNumber')) {
      if (!rawCardNum || rawCardNum.length < 15) {
        if (typeof showToast === 'function') showToast('Lütfen geçerli 16 haneli kart numaranızı giriniz.', 'error');
        else alert('Lütfen geçerli 16 haneli kart numaranızı giriniz.');
        document.getElementById('checkoutCardNumber')?.focus();
        return;
      }
      if (!rawCardExp.includes('/') || rawCardExp.length < 4) {
        if (typeof showToast === 'function') showToast('Lütfen kartınızın son kullanma tarihini AA/YY formatında giriniz (Örn: 08/28).', 'error');
        else alert('Lütfen kartınızın son kullanma tarihini AA/YY formatında giriniz (Örn: 08/28).');
        document.getElementById('checkoutCardExpiry')?.focus();
        return;
      }
      if (!rawCardCvc || rawCardCvc.length < 3) {
        if (typeof showToast === 'function') showToast('Lütfen kartınızın arkasındaki 3 haneli güvenlik kodunu (CVV) giriniz.', 'error');
        else alert('Lütfen kartınızın arkasındaki 3 haneli güvenlik kodunu (CVV) giriniz.');
        document.getElementById('checkoutCardCvc')?.focus();
        return;
      }
    }

    const btn = document.getElementById('checkoutSubmitBtn') || document.getElementById('btnSubmitOrder');
    const originalBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span style="font-size:20px;">🔒</span> <span>Kuveyt Türk 3D Secure Kapısına Yönlendiriliyorsunuz...</span>';
    }

    const orderPayload = {
      provider: 'KUVEYTTURK',
      user_name: customerFullName,
      user_phone: phone,
      email: email,
      customerIdentity: identity || '',
      customerAddress: customerAddress,
      cardHolder: cardHolder,
      cardNumber: rawCardNum,
      cardExpiry: rawCardExp,
      cardCvc: rawCardCvc,
      items: items.map(i => ({ id: i.id, qty: i.qty })),
      deliveryMethod: selectedMethod === 'showroom' ? 'showroom' : 'carrier',
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
        throw new Error(data.message || 'Kuveyt Türk Sanal POS oturumu açılamadı.');
      }

      // 1. KUVEYT TÜRK 3D SECURE SMS AKIŞI (Banka SMS Şifresi Ekranı)
      if (data.formHtml || data.paymentType === 'HTML_FORM') {
        const rawHtml = data.formHtml || '';
        document.open();
        document.write(rawHtml);
        document.close();

        setTimeout(() => {
          try {
            const targetForm = document.threeDSServerWebFlowStartForm ||
                               document.downloadForm ||
                               document.getElementById('threeDSServerWebFlowStartForm') ||
                               document.getElementById('kt3dForm') ||
                               (document.forms && document.forms[0]);
            if (targetForm) {
              HTMLFormElement.prototype.submit.call(targetForm);
            }
          } catch (_) {
            try {
              const subBtn = document.querySelector('input[type="submit"], button[type="submit"]');
              if (subBtn && typeof subBtn.click === 'function') subBtn.click();
            } catch (__) {}
          }
        }, 50);
        return;
      }

      if (data.gatewayUrl && data.postParams) {
        // DOĞRUDAN RESMİ KUVEYT TÜRK 3D SECURE KAPISINA GÖNDERİM
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
        HTMLFormElement.prototype.submit.call(form);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        window.location.href = `/odeme-basarili.html?orderId=${encodeURIComponent(data.merchant_oid || '')}`;
      }
    })
    .catch(err => {
      console.error('Kuveyt Türk Ödeme Başlatma Hatası:', err);
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
    this.renderCheckoutDeliveryOptions();
    this.syncCheckoutPaymentUI();
    const form = document.getElementById('checkoutForm') || document.querySelector('#page-odeme form');
    if (!form) return;

    // Kart Girdi Formatlayıcıları
    const cardNum = document.getElementById('checkoutCardNumber');
    const cardExp = document.getElementById('checkoutCardExpiry');
    const cardCvc = document.getElementById('checkoutCardCvc');
    const cardHolder = document.getElementById('checkoutCardHolder');

    if (cardNum && !cardNum.dataset.bound) {
      cardNum.dataset.bound = 'true';
      cardNum.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
        let formatted = v.match(/.{1,4}/g)?.join(' ') || v;
        e.target.value = formatted;
      });
    }

    if (cardExp && !cardExp.dataset.bound) {
      cardExp.dataset.bound = 'true';
      cardExp.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 2) {
          e.target.value = v.slice(0, 2) + '/' + v.slice(2);
        } else {
          e.target.value = v;
        }
      });
    }

    if (cardCvc && !cardCvc.dataset.bound) {
      cardCvc.dataset.bound = 'true';
      cardCvc.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
      });
    }

    const updateDraft = () => {
      const fn = document.getElementById('checkoutFirstName')?.value || '';
      const ln = document.getElementById('checkoutLastName')?.value || '';
      const phone = document.getElementById('checkoutPhone')?.value || '';
      const fullName = (fn + ' ' + ln).trim();
      if (cardHolder && !cardHolder.dataset.manual && fullName) {
        cardHolder.value = fullName.toLocaleUpperCase('tr-TR');
      }
      const cartTotal = typeof Cart !== 'undefined' ? Cart.getTotal() : 0;
      const draft = {
        customerName: fullName || 'Müşteri (Sipariş Sahibi)',
        customerPhone: phone || '05XX *** ** XX (3D Secure Doğrulama Telefonu)',
        totalAmount: cartTotal > 0 ? cartTotal : 14960,
        formattedAmount: '₺' + (cartTotal > 0 ? cartTotal : 14960).toLocaleString('tr-TR'),
        termsAcceptedAt: new Date().toISOString(),
        paymentMethod: 'Kuveyt Türk 256-Bit EV SSL & 3D Secure Sanal POS (892543)'
      };
      localStorage.setItem('belgin_checkout_draft', JSON.stringify(draft));
      sessionStorage.setItem('belgin_checkout_draft', JSON.stringify(draft));
    };

    form.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('input', updateDraft);
      inp.addEventListener('change', updateDraft);
    });
  },

  syncCheckoutPaymentUI() {
    const items = (typeof Cart !== 'undefined' && Cart.items) ? Cart.items : [];
    const hasJewellery = items.some(item => {
      const p = (typeof findProduct === 'function' ? findProduct(item.id) : null) || item;
      return this.isJewelleryProduct(p);
    });

    const cardFields = document.getElementById('cardPaymentFields');
    let noticeBox = document.getElementById('jewelleryCheckoutNotice');
    const submitBtnText = document.getElementById('checkoutSubmitBtnText');
    const submitBtn = document.getElementById('checkoutSubmitBtn');
    const grandTotal = typeof Cart !== 'undefined' ? Cart.getTotal() : 0;
    const formattedTotal = typeof formatPrice === 'function' ? formatPrice(grandTotal) : `₺${grandTotal.toLocaleString('tr-TR')}`;

    if (hasJewellery) {
      if (cardFields) cardFields.style.display = 'none';
      if (!noticeBox && cardFields && cardFields.parentNode) {
        noticeBox = document.createElement('div');
        noticeBox.id = 'jewelleryCheckoutNotice';
        noticeBox.style.cssText = 'background:#FFFDF7; border:1.5px solid #C2A768; border-radius:12px; padding:18px 20px; box-shadow:0 4px 16px rgba(194,167,104,0.12); margin-bottom:12px;';
        noticeBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; border-bottom:1px solid #F0ECE4; padding-bottom:8px;">
            <span style="font-size:22px;">🛡️</span>
            <div>
              <h3 style="font-size:13px; font-weight:800; color:var(--color-teal); text-transform:uppercase; letter-spacing:0.4px; margin:0;">
                3. Kurumsal Banka Havalesi / EFT / FAST
              </h3>
              <span style="font-size:11px; color:#666;">Altın ve Mücevherat Güvenli Sipariş Protokolü</span>
            </div>
          </div>
          <div style="font-size:13px; color:#2B261D; line-height:1.6; margin-bottom:14px;">
            <p style="margin:0 0 8px;">
              Mevzuat ve şirket politikalarımız gereğince <strong>Altın ve Mücevherat ürünlerinde web sitemiz üzerinden KREDİ KARTI ile online satış yapılmamaktadır</strong>.
            </p>
            <p style="margin:0;">
              Siparişinizi oluşturduktan sonra verilecek sipariş referans numarası ile ödemenizi kurumsal <strong>Banka Havalesi / EFT / FAST</strong> üzerinden tamamlayabilir veya İzmir Buca showroom mağazamızda teslim alabilirsiniz.
            </p>
          </div>
          <div style="background:#FBF9F5; border:1px solid #EAE5D9; border-radius:8px; padding:12px 14px; font-size:12px; color:#333; line-height:1.6;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#666;">Yetkili Kurum:</span>
              <strong style="color:var(--color-ink);">Belgin Kuyumculuk ve Saat</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="color:#666;">Ödeme Türü:</span>
              <strong style="color:var(--color-teal);">Banka Havalesi / EFT / FAST</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:#666;">Teslimat &amp; Destek:</span>
              <span style="color:#444;">Buca Showroom &amp; Sigortalı Teslimat</span>
            </div>
          </div>
        `;
        cardFields.parentNode.insertBefore(noticeBox, cardFields);
      } else if (noticeBox) {
        noticeBox.style.display = 'block';
      }

      if (submitBtnText) {
        submitBtnText.textContent = `Havale / EFT ile Siparişi Onayla (${formattedTotal})`;
      }
      if (submitBtn) {
        const iconSpan = submitBtn.querySelector('.btn-checkout-icon');
        if (iconSpan) iconSpan.textContent = '🏛️';
      }
    } else {
      if (cardFields) cardFields.style.display = 'block';
      if (noticeBox) noticeBox.style.display = 'none';
      if (submitBtnText) {
        submitBtnText.textContent = `3D Secure ile Güvenli Öde (${formattedTotal})`;
      }
      if (submitBtn) {
        const iconSpan = submitBtn.querySelector('.btn-checkout-icon');
        if (iconSpan) iconSpan.textContent = '🔒';
      }
    }
  },

  openWireOrderSuccessModal(orderDraft) {
    const waText = encodeURIComponent(`Merhaba, ${orderDraft.orderId} numaralı altın/mücevher siparişim için havale/EFT ödeme teyidi yapmak istiyorum. Sipariş Tutarı: ${orderDraft.formattedTotal}`);
    const modalHtml = `
      <div class="modal-dialog-header">
        <h3 style="display:flex; align-items:center; gap:8px; color:var(--color-teal); font-size:16px;">
          <span>🏛️</span>
          <span>Siparişiniz Başarıyla Alındı</span>
        </h3>
        <button class="modal-dialog-close" onclick="App.closeModal(); Router.navigate('ana-sayfa');">×</button>
      </div>
      <div style="padding:4px 0 10px;">
        <div style="background:#FFFDF7; border:1.5px solid #C2A768; border-radius:10px; padding:16px; margin-bottom:16px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #F0ECE4; padding-bottom:8px;">
            <span style="font-size:12px; color:#666; font-weight:700;">SİPARİŞ REFERANS NUMARASI:</span>
            <span style="font-family:monospace; font-weight:800; font-size:15px; color:var(--color-teal); background:#E6F4F1; padding:3px 8px; border-radius:4px;">${orderDraft.orderId}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:13px; color:#555;">Toplam Sipariş Tutarı:</span>
            <strong style="font-size:18px; color:var(--color-ink);">${orderDraft.formattedTotal}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:13px; color:#555;">Teslimat Şekli:</span>
            <strong style="font-size:12.5px; color:#222;">${orderDraft.deliveryMethod === 'showroom' ? 'İzmir Buca Showroom Teslimat' : 'Sigortalı Adrese Teslim'}</strong>
          </div>
        </div>

        <div style="background:#FBF9F5; border:1px solid #EAE5D9; border-radius:8px; padding:14px; margin-bottom:18px; text-align:left; font-size:12.5px; color:#333; line-height:1.6;">
          <strong style="color:var(--color-teal); display:block; margin-bottom:6px; font-size:13px;">🏦 Kurumsal Havale / EFT / FAST Bilgilendirmesi:</strong>
          <p style="margin:0 0 6px;">
            Mevzuat ve şirket politikalarımız gereğince Altın ve Mücevherat ürünlerinde kredi kartı ile online satış yapılmamaktadır. Sipariş tutarınızı kurumsal banka hesaplarımıza açıklama alanına <strong>${orderDraft.orderId}</strong> yazarak transfer edebilirsiniz.
          </p>
          <p style="margin:0; font-size:11.5px; color:#666;">
            📍 Buca Showroom: Menderes Cad. No:231/B Buca / İzmir · Tel: +90 232 448 83 23
          </p>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <a href="https://wa.me/905419305372?text=${waText}" target="_blank" rel="noopener" class="btn-action-vip" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:13px; font-size:14px; text-decoration:none;">
            <span>💬 WhatsApp İle Havale / EFT Bilgisi Al & Dekont İlet</span>
          </a>
          <button type="button" class="btn-hero-outline" style="padding:11px; text-align:center;" onclick="App.closeModal(); Router.navigate('ana-sayfa');">
            Alışverişe Devam Et
          </button>
        </div>
      </div>
    `;
    this.openModal(modalHtml);
  },

  // ==========================================================
  // 📸 HERO MULTI-SLIDE AMBIENT ROTATOR
  // ==========================================================
  currentHeroSlide: 0,
  heroRotatorTimer: null,

  initHeroRotator() {
    const slides = document.querySelectorAll('.hero-slide');
    if (!slides || slides.length <= 1) return;
    if (this.heroRotatorTimer) clearInterval(this.heroRotatorTimer);
    this.heroRotatorTimer = setInterval(() => {
      this.nextHeroSlide();
    }, 5500);
  },

  setHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const contentSlides = document.querySelectorAll('.hero-content-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides || slides.length === 0) return;
    this.currentHeroSlide = (index + slides.length) % slides.length;
    slides.forEach((s, idx) => {
      s.classList.toggle('active', idx === this.currentHeroSlide);
    });
    contentSlides.forEach((cs, idx) => {
      cs.classList.toggle('active', idx === this.currentHeroSlide);
    });
    dots.forEach((d, idx) => {
      d.classList.toggle('active', idx === this.currentHeroSlide);
    });
  },

  nextHeroSlide() {
    this.setHeroSlide(this.currentHeroSlide + 1);
  },

  // ==========================================================
  // 📰 BELGİN SAAT MAGAZİN — EDİTORYAL DERGİ & PİYASA YAYINLARI
  // ==========================================================
  currentMagazineFilter: 'all',
  currentMagazinePage: 1,
  magazinePageSize: 9,

  filterMagazineCategory(category, btn) {
    this.currentMagazineFilter = category;
    this.currentMagazinePage = 1;
    if (btn) {
      document.querySelectorAll('.mag-filter-pill, .mag-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    } else {
      document.querySelectorAll('.mag-filter-pill, .mag-tab-btn').forEach(b => {
        const txt = (b.textContent || '').trim().toLowerCase();
        const catLow = String(category).trim().toLowerCase();
        if (category === 'all' && (txt.includes('tümü') || txt.includes('all'))) {
          b.classList.add('active');
        } else if (category !== 'all' && (txt.includes(catLow) || catLow.includes(txt.replace(/^[^\wçğıöşüa-z]+/i, '').trim()))) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
    this.renderMagazineGrid(category, 1);
  },

  renderMagazineGrid(category = 'all', page = 1) {
    const grid = document.getElementById('magazineArticlesGrid');
    const pagination = document.getElementById('magazinePagination');
    if (!grid) return;

    let articles = (typeof window.MAGAZINE_ARTICLES !== 'undefined') ? [...window.MAGAZINE_ARTICLES] : [];
    if (!articles || articles.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--color-muted);">Henüz magazin içeriği yüklenmedi.</div>';
      return;
    }

    // En son yazılan/yayınlanan makaleler her zaman en başta (descending) sıralansın
    articles.sort((a, b) => {
      const dateA = a.raw_date || '';
      const dateB = b.raw_date || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      return (b.id || '').localeCompare(a.id || '');
    });

    // Dinamik filtre sekmesi sayacı (146+ makale için canlı otomatik senkronizasyon)
    const allTabBtn = document.querySelector('#magazineFilterTabs .mag-filter-pill[onclick*="\'all\'"]') ||
                     document.querySelector('#magazineFilterTabs .mag-filter-pill:first-child');
    if (allTabBtn) {
      allTabBtn.textContent = `⭐ Tümü (${articles.length})`;
    }

    let filtered = articles;
    if (category && category !== 'all') {
      filtered = articles.filter(a => a.category === category || (a.title && a.title.toLowerCase().includes(category.toLowerCase())));
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / this.magazinePageSize) || 1;
    this.currentMagazinePage = Math.min(Math.max(1, page), totalPages);

    const start = (this.currentMagazinePage - 1) * this.magazinePageSize;
    const pageArticles = filtered.slice(start, start + this.magazinePageSize);

    grid.innerHTML = pageArticles.map(art => {
      const readTime = art.read_time || '8 dk okuma';
      const imgSrc = art.image || '/images/hero/hero-rolex-lineup.jpg';
      return `
        <article class="magazine-card" onclick="App.openMagazineArticle('${art.id}')" data-article-id="${art.id}">
          <div class="mag-card-media">
            <img src="${imgSrc}" alt="${typeof escapeHtml === 'function' ? escapeHtml(art.title) : art.title}" loading="lazy" decoding="async" onerror="this.src='/images/hero/hero-rolex-lineup.jpg'">
          </div>
          <div class="mag-card-body">
            <div class="mag-card-meta-top" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span class="mag-tag-pill">${typeof escapeHtml === 'function' ? escapeHtml(art.category) : art.category}</span>
              <span class="mag-read-time">⏱️ ${typeof escapeHtml === 'function' ? escapeHtml(readTime) : readTime}</span>
            </div>
            <h3 class="mag-card-title">${typeof escapeHtml === 'function' ? escapeHtml(art.title) : art.title}</h3>
            <p class="mag-card-excerpt">${typeof escapeHtml === 'function' ? escapeHtml(art.summary) : art.summary}</p>
            <div class="mag-card-meta">
              <div class="mag-card-author-row">
                <span class="mag-author-icon">✍️</span>
                <span class="mag-author-name">Belgin Saat Editoryal</span>
              </div>
              <span class="mag-card-date">📅 ${typeof escapeHtml === 'function' ? escapeHtml(art.publish_date) : art.publish_date}</span>
            </div>
            <div class="mag-card-action-bar">
              <span class="mag-read-link">Makaleyi Oku →</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Sayfalama (Premium Maison Pagination)
    if (pagination) {
      if (totalPages <= 1) {
        pagination.innerHTML = '';
      } else {
        const cur = this.currentMagazinePage;
        const prevDisabled = cur <= 1 ? 'disabled' : '';
        const nextDisabled = cur >= totalPages ? 'disabled' : '';
        
        let pagesHtml = '';
        for (let p = 1; p <= totalPages; p++) {
          const isActive = p === cur;
          pagesHtml += `
            <button class="mag-pag-btn ${isActive ? 'active' : ''}" 
                    onclick="App.renderMagazineGrid('${this.currentMagazineFilter}', ${p}); document.getElementById('page-magazin')?.scrollIntoView({behavior:'smooth', block:'start'});"
                    aria-label="Sayfa ${p}" 
                    ${isActive ? 'aria-current="page"' : ''}>
              ${p}
            </button>
          `;
        }

        pagination.innerHTML = `
          <div class="mag-pagination-outer">
            <div class="mag-pagination-pill">
              <button class="mag-pag-nav-btn mag-pag-prev" ${prevDisabled} 
                      onclick="App.renderMagazineGrid('${this.currentMagazineFilter}', ${cur - 1}); document.getElementById('page-magazin')?.scrollIntoView({behavior:'smooth', block:'start'});"
                      aria-label="Önceki Sayfa">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                <span>Önceki</span>
              </button>
              
              <div class="mag-pag-numbers">
                ${pagesHtml}
              </div>

              <button class="mag-pag-nav-btn mag-pag-next" ${nextDisabled} 
                      onclick="App.renderMagazineGrid('${this.currentMagazineFilter}', ${cur + 1}); document.getElementById('page-magazin')?.scrollIntoView({behavior:'smooth', block:'start'});"
                      aria-label="Sonraki Sayfa">
                <span>Sonraki</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <div class="mag-pag-info-text">
              Sayfa <strong>${cur}</strong> / <strong>${totalPages}</strong> &bull; Toplam <strong>${total}</strong> Makale
            </div>
          </div>
        `;
      }
    }
  },

  openMagazineArticle(articleId) {
    const articles = (typeof window.MAGAZINE_ARTICLES !== 'undefined') ? window.MAGAZINE_ARTICLES : [];
    const art = articles.find(a => a.id === articleId || a.slug === articleId);
    if (!art) return;

    const modal = document.getElementById('magazineArticleModal');
    const content = document.getElementById('magazineModalContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="mag-modal-hero">
        <img src="${art.image}" alt="${typeof escapeHtml === 'function' ? escapeHtml(art.title) : art.title}" onerror="this.src='/images/hero/hero-rolex-lineup.jpg'">
      </div>
      <div class="mag-modal-content-wrap">
        <span class="mag-modal-badge">${typeof escapeHtml === 'function' ? escapeHtml(art.category) : art.category}</span>
        <h1 class="mag-modal-title">${typeof escapeHtml === 'function' ? escapeHtml(art.title) : art.title}</h1>
        <div class="mag-modal-meta-row">
          <span>✍️ Belgin Saat Editoryal Masası</span>
          <span>📅 ${typeof escapeHtml === 'function' ? escapeHtml(art.publish_date) : art.publish_date}</span>
          <span>⏱️ ${typeof escapeHtml === 'function' ? escapeHtml(art.read_time || '8 dk okuma') : (art.read_time || '8 dk okuma')}</span>
        </div>
        <div class="mag-modal-body">
          ${art.content_html}
        </div>
        <div class="mag-modal-footer-cta">
          <div>
            <div style="font-weight:700; color:var(--color-ink); font-size:14px;">Belgin Saat Koleksiyonunu İnceleyin</div>
            <div style="font-size:12px; color:var(--color-muted);">Tüm modeller İzmir Buca showroomumuzda ve online vitrinimizde.</div>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a href="/elit-kategori/" onclick="App.closeMagazineModal(); Router.navigate('elit-kategori'); return false;" class="btn btn-secondary" style="padding:8px 14px; font-size:12px;">👑 Elit Saatler</a>
            <a href="/saatler/" onclick="App.closeMagazineModal(); Router.navigate('saatler'); return false;" class="btn btn-primary" style="padding:8px 14px; font-size:12px;">⌚ Tüm Koleksiyon</a>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  closeMagazineModal() {
    const modal = document.getElementById('magazineArticleModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  },

  // ==========================================================
  // 📖 BİZ KİMİZ — LUXURY FLIPBOOK & FOLIO ENGINE
  // ==========================================================
  currentFlipbookPage: 1,
  totalFlipbookPages: 10,
  flipbookSpreadMode: false,

  setFlipbookPage(page) {
    if (page < 1) page = 1;
    if (page > this.totalFlipbookPages) page = this.totalFlipbookPages;
    this.currentFlipbookPage = page;
    this.renderFlipbook();
  },

  nextFlipbookPage() {
    const step = this.flipbookSpreadMode ? 2 : 1;
    this.setFlipbookPage(this.currentFlipbookPage + step);
  },

  prevFlipbookPage() {
    const step = this.flipbookSpreadMode ? 2 : 1;
    this.setFlipbookPage(this.currentFlipbookPage - step);
  },

  setFlipbookMode(isSpread) {
    this.flipbookSpreadMode = isSpread;
    document.querySelectorAll('.folio-pill-btn, .flipbook-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === (isSpread ? 'spread' : 'single'));
    });
    this.renderFlipbook();
  },

  flipbookZoomed: false,
  toggleFlipbookZoom() {
    this.flipbookZoomed = !this.flipbookZoomed;
    const stage = document.getElementById('flipbookStage');
    const card = document.getElementById('bizKimizFolioCard');
    const btn = document.getElementById('flipbookZoomBtn');
    const btnTop = document.getElementById('flipbookZoomBtnTop');
    const btnTopText = document.getElementById('flipbookZoomBtnTopText');

    if (stage) stage.classList.toggle('zoom-large', this.flipbookZoomed);
    if (card) card.classList.toggle('zoom-expanded', this.flipbookZoomed);
    if (btnTop) btnTop.classList.toggle('active', this.flipbookZoomed);

    if (btn) {
      btn.textContent = this.flipbookZoomed ? '↩️ Geri Dön (İlk Görünüm)' : '🔍 Genişlet (%130)';
    }
    if (btnTopText) {
      btnTopText.textContent = this.flipbookZoomed ? 'Geri Dön (İlk Görünüm)' : 'Genişlet (%130)';
    }

    if (!this.flipbookZoomed && card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  toggleFlipbookFullscreen() {
    const card = document.getElementById('bizKimizFolioCard') || document.querySelector('.flipbook-container');
    if (!card) return;
    if (!document.fullscreenElement) {
      if (card.requestFullscreen) {
        card.requestFullscreen();
      } else if (card.webkitRequestFullscreen) {
        card.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  },

  renderFlipbook() {
    const wrap = document.getElementById('flipbookPageWrap');
    const stage = document.getElementById('flipbookStage');
    const counter = document.getElementById('flipbookCounter');
    const thumbs = document.querySelectorAll('.flipbook-thumb-item');
    if (!wrap || !stage) return;

    stage.classList.toggle('spread', this.flipbookSpreadMode);

    if (this.flipbookSpreadMode) {
      const leftPage = this.currentFlipbookPage % 2 === 0 ? this.currentFlipbookPage - 1 : this.currentFlipbookPage;
      const rightPage = leftPage + 1;
      
      let html = `<img src="/images/biz-kimiz/page-${leftPage}.jpg" class="flipbook-page-img" alt="Sayfa ${leftPage}">`;
      if (rightPage <= this.totalFlipbookPages) {
        html += `<img src="/images/biz-kimiz/page-${rightPage}.jpg" class="flipbook-page-img" alt="Sayfa ${rightPage}">`;
      }
      wrap.innerHTML = html;
      if (counter) counter.textContent = `Sayfa ${leftPage}${rightPage <= this.totalFlipbookPages ? '-' + rightPage : ''} / ${this.totalFlipbookPages}`;
    } else {
      wrap.innerHTML = `<img src="/images/biz-kimiz/page-${this.currentFlipbookPage}.jpg" class="flipbook-page-img" alt="Sayfa ${this.currentFlipbookPage}">`;
      if (counter) counter.textContent = `Sayfa ${this.currentFlipbookPage} / ${this.totalFlipbookPages}`;
    }

    // Update active thumb
    thumbs.forEach((t, idx) => {
      const pNum = idx + 1;
      t.classList.toggle('active', pNum === this.currentFlipbookPage || (this.flipbookSpreadMode && (pNum === this.currentFlipbookPage || pNum === this.currentFlipbookPage + 1)));
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
