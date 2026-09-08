// ==========================================================
// BELGIN KUYUMCULUK — HAREM ALTIN CANLI BORSA VE PİYASA MOTORU
// KAYNAK: https://canlipiyasalar.haremaltin.com/ (WebSocket: wss://hrmsocketonly.haremaltin.com)
// KURAL: Canlı gelen satış fiyatları üzerine her zaman +%0,5 (x 1.005) marj uygulanır. Alış fiyatlarına marj eklenmez (x 1.000).
// ==========================================================

let CURRENT_CURRENCY = 'TRY';
let EXCHANGE_RATES = {
  TRY: 1,
  USD: 0.0208,
  EUR: 0.0178,
  GBP: 0.0152
};

const CURRENCY_SYMBOLS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

// Detaylı Canlı Piyasa Veri Havuzu (Harem Altın Canlı Akışı)
const LIVE_MARKET_DATA = {
  hasAltin: 6805.26,
  gramGold24k: 6805.26,
  gramGold22k: 6377.39,
  gramGold18k: 5101.40,
  gramGold14k: 4922.95,
  gramGold8k: 2842.00,
  quarterGold: 11132.00,
  oldQuarterGold: 10926.00,
  halfGold: 22240.00,
  oldHalfGold: 21819.00,
  fullGold: 44318.00,
  oldFullGold: 43705.00,
  ataGold: 45100.00,
  oldAtaGold: 44998.00,
  gremeseGold: 110420.00,
  oldGremeseGold: 109331.00,
  ata5Gold: 227322.00,
  oldAta5Gold: 225621.00,
  packagedGold: 6805.26,
  silverTry: 104.50,
  silverUsd: 38.80,
  ons: 2905.40,
  usdTry: 48.40,
  eurTry: 56.14,
  gbpTry: 65.40,
  changeGram: "+0.55%",
  change22k: "+0.55%",
  changeQuarter: "+0.55%",
  direction: "up",
  source: "Harem Altın Canlı Borsa Akışı",
  socketConnected: false,
  lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  lastUpdatedDate: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
  lastUpdatedTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  // Tüm canlı kalemlerin detaylı sözlüğü
  items: {},
  // İZKO Canlı Kur Referansı (Primary Sell Kaynağı)
  izkoRates: null,
  izkoLastFetched: 0,
  izkoStatus: 'IDLE'
};

/**
 * İZKO Canlı Satış Kurlarını İstemci Tarafında Güvenle Çeker
 * 1. Tier: /izko-rates-cache.json (Hosting / CDN Önbelleği)
 * 2. Tier: https://www.izko.org.tr/api/web/v1/gold-prices (Resmi Açık API)
 */
async function fetchClientIzkoRates() {
  const now = Date.now();
  if (LIVE_MARKET_DATA.izkoLastFetched && (now - LIVE_MARKET_DATA.izkoLastFetched) < 45000) {
    return LIVE_MARKET_DATA.izkoRates;
  }

  // 1. Tier: Hosting / CDN Önbelleği
  try {
    const res = await fetch('/izko-rates-cache.json?t=' + now, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && (data.quarterGold > 1000 || data.hasAltin > 1000)) {
        LIVE_MARKET_DATA.izkoRates = data;
        LIVE_MARKET_DATA.izkoLastFetched = now;
        LIVE_MARKET_DATA.izkoStatus = 'LIVE';
        triggerPriceDomUpdates();
        return data;
      }
    }
  } catch (e) {}

  // 2. Tier: Cloud Functions API (/api/market/izko-rates)
  try {
    const res = await fetch('/api/market/izko-rates', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && (data.quarterGold > 1000 || data.hasAltin > 1000)) {
        LIVE_MARKET_DATA.izkoRates = data;
        LIVE_MARKET_DATA.izkoLastFetched = now;
        LIVE_MARKET_DATA.izkoStatus = 'LIVE';
        triggerPriceDomUpdates();
        return data;
      }
    }
  } catch (e) {}

  // 3. Tier: İZKO Resmi API (CORS açık)
  if (typeof fetch !== 'undefined') {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;
      const res = await fetch('https://www.izko.org.tr/api/web/v1/gold-prices', {
        signal: controller ? controller.signal : undefined,
        headers: { 'Accept': 'application/json' }
      });
      if (timer) clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          const rates = { success: true };
          json.data.forEach(item => {
            const price = parseFloat(item.sell_price) || 0;
            if (price > 0) {
              if (item.key === 'hasaltin') { rates.hasAltin = price; rates.gramGold24k = price; }
              else if (item.key === 'yirmiiki') rates.gramGold22k = price;
              else if (item.key === 'gram') rates.gram = price;
              else if (item.key === 'onsekiz') rates.gramGold18k = price;
              else if (item.key === 'ondort') rates.gramGold14k = price;
              else if (item.key === 'sekizayar') rates.gramGold8k = price;
              else if (item.key === 'yeniceyrek') rates.quarterGold = price;
              else if (item.key === 'eskiceyrek') rates.oldQuarterGold = price;
              else if (item.key === 'yeniyarim') rates.halfGold = price;
              else if (item.key === 'eskiyarim') rates.oldHalfGold = price;
              else if (item.key === 'yenitam') rates.fullGold = price;
              else if (item.key === 'eskitam') rates.oldFullGold = price;
              else if (item.key === 'ata') rates.ataGold = price;
              else if (item.key === 'paketlihas') rates.packagedGold = price;
            }
          });
          if (rates.quarterGold > 1000 || rates.hasAltin > 1000) {
            LIVE_MARKET_DATA.izkoRates = rates;
            LIVE_MARKET_DATA.izkoLastFetched = now;
            LIVE_MARKET_DATA.izkoStatus = 'LIVE';
            triggerPriceDomUpdates();
            return rates;
          }
        }
      }
    } catch (e) {}
  }

  return LIVE_MARKET_DATA.izkoRates;
}

/**
 * Türkçe Tarih ve Saat Yardımcıları
 */
function getLiveDateString() {
  const now = new Date();
  return now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

function getLiveTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Türkçe Para Formatlayıcı
 */
function formatPrice(priceTRY, currency = CURRENT_CURRENCY) {
  if (priceTRY === null || priceTRY === undefined || isNaN(priceTRY)) return '₺0';
  
  const curr = currency || CURRENT_CURRENCY || 'TRY';
  const rate = EXCHANGE_RATES[curr] || 1;
  const symbol = CURRENCY_SYMBOLS[curr] || '₺';
  const converted = Math.round(Number(priceTRY) * rate);

  return symbol + converted.toLocaleString(curr === 'TRY' ? 'tr-TR' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function setCurrency(curr) {
  if (EXCHANGE_RATES[curr]) {
    CURRENT_CURRENCY = curr;
    if (typeof App !== 'undefined' && App.refreshViews) {
      App.refreshViews();
    }
  }
}

/**
 * Sanity Validator & Circuit Breaker for Financial Market Rates
 */
function isValidMarketRate(val, min = 1, max = 2000000) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= min && val <= max;
}

/**
 * Harem Altın'dan Gelen Sayı / String Verilerini Güvenle Parse Etme
 */
function parseMarketNumber(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).trim().replace(/\s+/g, '');
  if (str.includes(',') && str.includes('.')) {
    // 1.234,56 formatı
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }
  return parseFloat(str) || 0;
}

/**
 * HAREM ALTIN CANLI SOKET VE VERİ GÜNCELLEME İŞLEYİCİSİ
 * Kaynak: https://canlipiyasalar.haremaltin.com/
 */
function handleHaremAltinPriceUpdate(payload) {
  if (!payload) return;
  const rawData = payload.data || payload;
  if (typeof rawData !== 'object') return;

  const now = new Date();
  LIVE_MARKET_DATA.lastUpdatedDate = getLiveDateString();
  LIVE_MARKET_DATA.lastUpdatedTime = getLiveTimeString();
  LIVE_MARKET_DATA.lastUpdated = LIVE_MARKET_DATA.lastUpdatedTime;
  LIVE_MARKET_DATA.source = "Harem Altın Canlı Borsa Akışı";

  // Gelen tüm kalemleri `LIVE_MARKET_DATA.items` içine işle
  for (const [code, valObj] of Object.entries(rawData)) {
    if (!valObj || typeof valObj !== 'object') continue;

    const alis = parseMarketNumber(valObj.alis || valObj.buy_price);
    const satis = parseMarketNumber(valObj.satis || valObj.sell_price);
    const dusuk = parseMarketNumber(valObj.dusuk || valObj.low);
    const yuksek = parseMarketNumber(valObj.yuksek || valObj.high);
    const kapanis = parseMarketNumber(valObj.kapanis || valObj.close);
    const fark = parseMarketNumber(valObj.percentChange || valObj.fark || valObj.change);

    const alisDir = valObj.dir?.alis_dir || (fark >= 0 ? 'up' : 'down');
    const satisDir = valObj.dir?.satis_dir || (fark >= 0 ? 'up' : 'down');

    LIVE_MARKET_DATA.items[code] = {
      code,
      alis,
      satis,
      dusuk: dusuk || alis,
      yuksek: yuksek || satis,
      kapanis: kapanis || satis,
      fark: fark || 0,
      alisDir,
      satisDir,
      tarih: valObj.tarih || LIVE_MARKET_DATA.lastUpdatedTime
    };

    // Ana referans alanlarını satış fiyatına (satis) göre güncelle
    if (satis > 0) {
      switch (code) {
        case 'ALTIN':
          LIVE_MARKET_DATA.hasAltin = satis;
          LIVE_MARKET_DATA.gramGold24k = satis;
          if (fark) LIVE_MARKET_DATA.changeGram = (fark >= 0 ? '+' : '') + fark.toFixed(2) + '%';
          LIVE_MARKET_DATA.direction = satisDir;
          break;
        case 'AYAR22':
          LIVE_MARKET_DATA.gramGold22k = satis;
          if (fark) LIVE_MARKET_DATA.change22k = (fark >= 0 ? '+' : '') + fark.toFixed(2) + '%';
          break;
        case 'AYAR18':
          LIVE_MARKET_DATA.gramGold18k = satis;
          break;
        case 'AYAR14':
          LIVE_MARKET_DATA.gramGold14k = satis;
          break;
        case 'AYAR8':
          LIVE_MARKET_DATA.gramGold8k = satis;
          break;
        case 'KULCEALTIN':
          LIVE_MARKET_DATA.packagedGold = satis;
          break;
        case 'CEYREK_YENI':
          LIVE_MARKET_DATA.quarterGold = satis;
          if (fark) LIVE_MARKET_DATA.changeQuarter = (fark >= 0 ? '+' : '') + fark.toFixed(2) + '%';
          break;
        case 'CEYREK_ESKI':
          LIVE_MARKET_DATA.oldQuarterGold = satis;
          break;
        case 'YARIM_YENI':
          LIVE_MARKET_DATA.halfGold = satis;
          break;
        case 'YARIM_ESKI':
          LIVE_MARKET_DATA.oldHalfGold = satis;
          break;
        case 'TEK_YENI':
          LIVE_MARKET_DATA.fullGold = satis;
          break;
        case 'TEK_ESKI':
          LIVE_MARKET_DATA.oldFullGold = satis;
          break;
        case 'ATA_YENI':
          LIVE_MARKET_DATA.ataGold = satis;
          break;
        case 'ATA_ESKI':
          LIVE_MARKET_DATA.oldAtaGold = satis;
          break;
        case 'GREMESE_YENI':
          LIVE_MARKET_DATA.gremeseGold = satis;
          break;
        case 'GREMESE_ESKI':
          LIVE_MARKET_DATA.oldGremeseGold = satis;
          break;
        case 'ATA5_YENI':
          LIVE_MARKET_DATA.ata5Gold = satis;
          break;
        case 'ATA5_ESKI':
          LIVE_MARKET_DATA.oldAta5Gold = satis;
          break;
        case 'GUMUSTRY':
          LIVE_MARKET_DATA.silverTry = satis;
          break;
        case 'GUMUSUSD':
        case 'XAGUSD':
          LIVE_MARKET_DATA.silverUsd = satis;
          break;
        case 'ONS':
          LIVE_MARKET_DATA.ons = satis;
          break;
        case 'USDTRY':
          LIVE_MARKET_DATA.usdTry = satis;
          EXCHANGE_RATES.USD = Number((1 / satis).toFixed(6));
          break;
        case 'EURTRY':
          LIVE_MARKET_DATA.eurTry = satis;
          EXCHANGE_RATES.EUR = Number((1 / satis).toFixed(6));
          break;
        case 'GBPTRY':
          LIVE_MARKET_DATA.gbpTry = satis;
          EXCHANGE_RATES.GBP = Number((1 / satis).toFixed(6));
          break;
      }
    }
  }

  // DOM ve Fiyat Güncelleme Tetikleyicileri (Throttled via requestAnimationFrame)
  triggerPriceDomUpdates();
}

let _priceDomUpdatePending = false;
function triggerPriceDomUpdates() {
  if (typeof PriceUpdateAutomator !== 'undefined' && typeof PriceUpdateAutomator.scheduleUpdate === 'function') {
    PriceUpdateAutomator.scheduleUpdate();
    return;
  }
  if (_priceDomUpdatePending) return;
  _priceDomUpdatePending = true;

  const runUpdates = () => {
    _priceDomUpdatePending = false;
    updateMarketTickerDOM();
    updateDynamicGoldProductPrices();

    if (typeof ValuationEngine !== 'undefined' && ValuationEngine.calculateGold) {
      ValuationEngine.calculateGold();
    }

    if (typeof App !== 'undefined' && typeof App.onLivePricesUpdated === 'function') {
      App.onLivePricesUpdated();
    } else if (typeof updateLivePricesTableDOM === 'function') {
      updateLivePricesTableDOM();
    }
  };

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(runUpdates);
  } else {
    setTimeout(runUpdates, 50);
  }
}

/**
 * HAREM ALTIN WEBSOCKET BAĞLANTI YÖNETİCİSİ (CANLI PİYASALAR ANLIK AKIŞ)
 * Kaynak: https://canlipiyasalar.haremaltin.com/ (wss://hrmsocketonly.haremaltin.com)
 */
let _haremSocket = null;
let _haremNativeWs = null;
let _isSocketConnecting = false;

function initHaremAltinSocket() {
  if (typeof io !== 'undefined') {
    if (_haremSocket && _haremSocket.connected) {
      return;
    }
    if (_isSocketConnecting) {
      return;
    }
    _isSocketConnecting = true;

    try {
      if (!_haremSocket) {
        _haremSocket = io('wss://hrmsocketonly.haremaltin.com', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 3000,
          reconnectionAttempts: Infinity,
          timeout: 10000
        });

        _haremSocket.on('connect', () => {
          _isSocketConnecting = false;
          LIVE_MARKET_DATA.socketConnected = true;
          LIVE_MARKET_DATA.source = 'Harem Altın (Canlı WebSocket)';
          updateMarketTickerDOM();
          if (typeof App !== 'undefined' && typeof App.updateLivePricesTableDOM === 'function') {
            App.updateLivePricesTableDOM();
          }
        });

        _haremSocket.on('price_changed', (data) => {
          handleHaremAltinPriceUpdate(data);
        });

        _haremSocket.on('disconnect', () => {
          LIVE_MARKET_DATA.socketConnected = false;
        });

        _haremSocket.on('connect_error', () => {
          _isSocketConnecting = false;
          LIVE_MARKET_DATA.socketConnected = false;
          initNativeHaremWebSocket();
        });
      } else if (!_haremSocket.connected) {
        _haremSocket.connect();
      }
      return;
    } catch (err) {
      _isSocketConnecting = false;
      console.warn('[HaremAltin Socket] Socket.IO bağlantısı kurulamadı, native ws deneniyor:', err.message);
    }
  }

  initNativeHaremWebSocket();
}

function initNativeHaremWebSocket() {
  if (_haremNativeWs && (_haremNativeWs.readyState === WebSocket.OPEN || _haremNativeWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    _haremNativeWs = new WebSocket('wss://hrmsocketonly.haremaltin.com/socket.io/?EIO=4&transport=websocket');
    
    _haremNativeWs.onopen = () => {
      _haremNativeWs.send('40'); // Socket.io Connect Packet
      LIVE_MARKET_DATA.socketConnected = true;
      LIVE_MARKET_DATA.source = 'Harem Altın (Canlı WebSocket)';
      updateMarketTickerDOM();
      if (typeof App !== 'undefined' && typeof App.updateLivePricesTableDOM === 'function') {
        App.updateLivePricesTableDOM();
      }
    };

    _haremNativeWs.onmessage = (evt) => {
      const msg = evt.data;
      if (typeof msg === 'string') {
        if (msg.startsWith('42')) {
          try {
            const jsonStr = msg.substring(2);
            const parsed = JSON.parse(jsonStr);
            if (parsed && parsed[0] === 'price_changed' && parsed[1]) {
              handleHaremAltinPriceUpdate(parsed[1]);
            }
          } catch (e) {}
        } else if (msg === '2') {
          _haremNativeWs.send('3'); // Heartbeat Ping/Pong
        }
      }
    };

    _haremNativeWs.onclose = () => {
      LIVE_MARKET_DATA.socketConnected = false;
      setTimeout(initNativeHaremWebSocket, 3000);
    };

    _haremNativeWs.onerror = () => {
      LIVE_MARKET_DATA.socketConnected = false;
    };
  } catch (err) {
    console.warn('[HaremAltin Native WS] Bağlantı hatası:', err);
  }
}

/**
 * HAREM ALTIN CANLI SOKET SAĞLIK VE BAĞLANTI DENETLEYİCİSİ
 * Bağlantı koptuğunda otomatik olarak Harem Altın soketini yeniden bağlar
 */
async function fetchLiveMarketRates() {
  if (!LIVE_MARKET_DATA.socketConnected) {
    initHaremAltinSocket();
  }
}

// ==========================================================
// CANLI FİYAT VE ÜRÜN OTOMASYON MOTORU (PriceUpdateAutomator)
// - requestAnimationFrame Throttling (Gereksiz render birleştirme)
// - _cachedGoldProducts İzolasyonu (2.125 ürün yerine yalnızca altın/mücevher)
// - _productByIdMap ile O(1) Anlık Erişim
// - Otomatik DOM Element & Link Takibi (Tüm güncelleme alan linkler ve kartlar)
// ==========================================================

let _cachedGoldProducts = null;
let _productByIdMap = null;

const PriceUpdateAutomator = {
  _productByIdMap: null,
  _productBySlugMap: null,
  _productByRefMap: null,
  _cachedGoldProducts: null,
  _goldProductIds: null,
  _cachedAllProducts: null,
  _isScheduled: false,
  _isExecuting: false,
  _observer: null,
  _lastProductsLength: 0,

  initIndices() {
    if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return;
    if (this._productByIdMap && this._lastProductsLength === PRODUCTS.length) return;

    this._productByIdMap = new Map();
    this._productBySlugMap = new Map();
    this._productByRefMap = new Map();
    this._goldProductIds = new Set();
    this._cachedGoldProducts = [];
    this._lastProductsLength = PRODUCTS.length;

    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i];
      if (!p) continue;

      this._productByIdMap.set(p.id, p);
      this._productByIdMap.set(String(p.id), p);

      if (p.slug) this._productBySlugMap.set(p.slug, p);
      if (p.reference) this._productByRefMap.set(String(p.reference).toLowerCase(), p);
      if (p.ref) this._productByRefMap.set(String(p.ref).toLowerCase(), p);

      const isGold = Boolean(
        !p.isElite && p.category !== 'elit-saatler' && (
          p.category === 'gold' ||
          p.subCategory?.includes('Ziynet') ||
          p.subCategory?.includes('Külçe') ||
          p.subCategory?.includes('Sarrafiye') ||
          ((p.name || '').toLowerCase().includes('çeyrek')) ||
          ((p.name || '').toLowerCase().includes('yarım')) ||
          ((p.name || '').toLowerCase().includes('tam altın')) ||
          ((p.name || '').toLowerCase().includes('ziynet')) ||
          ((p.name || '').toLowerCase().includes('ata')) ||
          ((p.name || '').toLowerCase().includes('22 ayar') && (p.name || '').toLowerCase().includes('bilezik')) ||
          ((p.name || '').toLowerCase().includes('14 ayar') && (p.name || '').toLowerCase().includes('bilezik')) ||
          ((p.name || '').toLowerCase().includes('külçe')) ||
          ((p.name || '').toLowerCase().includes('gram altın'))
        )
      );

      if (isGold) {
        this._cachedGoldProducts.push(p);
        this._goldProductIds.add(p.id);
        this._goldProductIds.add(String(p.id));
      }
    }

    _cachedGoldProducts = this._cachedGoldProducts;
    _productByIdMap = this._productByIdMap;
  },

  getProductById(id) {
    if (id === undefined || id === null || id === '') return null;
    this.initIndices();
    if (!this._productByIdMap) return null;
    return this._productByIdMap.get(id) || this._productByIdMap.get(String(id)) || null;
  },

  findProduct(id) {
    if (id === undefined || id === null || id === '') return undefined;
    this.initIndices();
    if (!this._productByIdMap) return undefined;

    const strId = String(id).trim();
    let p = this._productByIdMap.get(strId);
    if (p) return p;

    const numId = parseInt(strId, 10);
    if (!isNaN(numId)) {
      p = this._productByIdMap.get(numId);
      if (p) return p;
    }

    p = this._productBySlugMap.get(strId);
    if (p) return p;

    p = this._productByRefMap.get(strId.toLowerCase());
    if (p) return p;

    return undefined;
  },

  getGoldProducts() {
    this.initIndices();
    return this._cachedGoldProducts || [];
  },

  isGoldProduct(id) {
    this.initIndices();
    return this._goldProductIds ? (this._goldProductIds.has(id) || this._goldProductIds.has(String(id))) : false;
  },

  scheduleUpdate() {
    if (this._isScheduled) return;
    this._isScheduled = true;

    const runBatch = () => {
      this._isScheduled = false;
      this.executeUpdates();
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(runBatch);
    } else {
      setTimeout(runBatch, 50);
    }
  },

  executeUpdates() {
    if (this._isExecuting) return;
    this._isExecuting = true;
    try {
      updateMarketTickerDOM();
      updateDynamicGoldProductPrices();

      if (typeof ValuationEngine !== 'undefined' && ValuationEngine.calculateGold) {
        ValuationEngine.calculateGold();
      }

      if (typeof App !== 'undefined' && typeof App.onLivePricesUpdated === 'function') {
        App.onLivePricesUpdated();
      } else if (typeof updateLivePricesTableDOM === 'function') {
        updateLivePricesTableDOM();
      }
    } finally {
      this._isExecuting = false;
    }
  },

  startObserver() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (this._observer || typeof MutationObserver === 'undefined') return;

    this._observer = new MutationObserver((mutations) => {
      if (this._isExecuting) return;
      let shouldUpdate = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              if (
                node.hasAttribute?.('data-product-price-id') ||
                node.hasAttribute?.('data-product-id') ||
                node.querySelector?.('[data-product-price-id], [data-product-id]')
              ) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
        if (shouldUpdate) break;
      }
      if (shouldUpdate) {
        this.scheduleUpdate();
      }
    });

    try {
      this._observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    } catch (e) {
      // sessiz geç
    }
  }
};

function getProductById(id) {
  return PriceUpdateAutomator.getProductById(id);
}

function getGoldProducts() {
  return PriceUpdateAutomator.getGoldProducts();
}

/**
 * TÜM ALTIN ÜRÜNLERİNİN FİYATINI SARI TABELA İLE %100 BİREBİR SENKRONİZE ET
 * Kaynak: Primary = İZKO normal Satış | Fallback = Harem Altın Canlı Satış
 * Kural: Müşteri Satış Fiyatı İZKO normal Satış (marjsız 1.00x), Alış Fiyatı Harem Alış (marjsız 1.00x)
 */
function updateDynamicGoldProductPrices() {
  if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return;

  const rawItems = LIVE_MARKET_DATA.items || {};
  const izko = LIVE_MARKET_DATA.izkoRates || {};
  const BOARD_MARGIN = 1.0; // Sıfır Marj (1.00x) — İZKO Primary Satış / Harem Fallback Satış

  const baseHas = izko.hasAltin || parseFloat(rawItems.ALTIN?.satis) || LIVE_MARKET_DATA.hasAltin || LIVE_MARKET_DATA.gramGold24k || 6826.16;
  const baseGram = izko.gramGold24k || izko.gram || izko.hasAltin || parseFloat(rawItems.ALTIN?.satis) || LIVE_MARKET_DATA.gramGold24k || baseHas;
  const base22k = izko.gramGold22k || parseFloat(rawItems.AYAR22?.satis) || LIVE_MARKET_DATA.gramGold22k || Math.round(baseHas * 0.937);
  const base18k = izko.gramGold18k || parseFloat(rawItems.AYAR18?.satis) || LIVE_MARKET_DATA.gramGold18k || Math.round(baseHas * 0.750);
  const base14k = izko.gramGold14k || parseFloat(rawItems.AYAR14?.satis) || LIVE_MARKET_DATA.gramGold14k || Math.round(baseHas * 0.722);
  const baseAtaYeni = izko.ataGold || parseFloat(rawItems.ATA_YENI?.satis) || LIVE_MARKET_DATA.ataGold || 45450;
  const baseAtaEski = parseFloat(rawItems.ATA_ESKI?.satis) || izko.ataGold || LIVE_MARKET_DATA.oldAtaGold || 45159;

  const baseCeyrekYeni = izko.quarterGold || parseFloat(rawItems.CEYREK_YENI?.satis) || LIVE_MARKET_DATA.quarterGold || 11300;
  const baseCeyrekEski = izko.oldQuarterGold || parseFloat(rawItems.CEYREK_ESKI?.satis) || LIVE_MARKET_DATA.oldQuarterGold || 11100;
  const baseYarimYeni = izko.halfGold || parseFloat(rawItems.YARIM_YENI?.satis) || LIVE_MARKET_DATA.halfGold || 22600;
  const baseYarimEski = izko.oldHalfGold || parseFloat(rawItems.YARIM_ESKI?.satis) || LIVE_MARKET_DATA.oldHalfGold || 22200;
  const baseZiynetYeni = izko.fullGold || parseFloat(rawItems.TEK_YENI?.satis) || LIVE_MARKET_DATA.fullGold || 45200;
  const baseZiynetEski = izko.oldFullGold || parseFloat(rawItems.TEK_ESKI?.satis) || LIVE_MARKET_DATA.oldFullGold || 44400;

  // İZKO Primary Satış ve Harem Fallback ile %100 Birebir Eşleşen Nihai Satış Fiyatları (Marj: 1.00x)
  const pGram = Math.round(baseGram * BOARD_MARGIN);
  const p22k = Math.round(base22k * BOARD_MARGIN);
  const p18k = Math.round(base18k * BOARD_MARGIN);
  const p14k = Math.round(base14k * BOARD_MARGIN);
  const pCeyrekYeni = Math.round(baseCeyrekYeni * BOARD_MARGIN);
  const pCeyrekEski = Math.round(baseCeyrekEski * BOARD_MARGIN);
  const pYarimYeni = Math.round(baseYarimYeni * BOARD_MARGIN);
  const pYarimEski = Math.round(baseYarimEski * BOARD_MARGIN);
  const pZiynetYeni = Math.round(baseZiynetYeni * BOARD_MARGIN);
  const pZiynetEski = Math.round(baseZiynetEski * BOARD_MARGIN);
  const pAtaYeni = Math.round(baseAtaYeni * BOARD_MARGIN);
  const pAtaEski = Math.round(baseAtaEski * BOARD_MARGIN);

  const changedMap = new Map();
  const goldProducts = getGoldProducts();

  for (const p of goldProducts) {
    const name = (p.name || '').toLowerCase();
    let exactTargetPrice = null;

    // 1. Çeyrek Altın
    if (name.includes('çeyrek')) {
      if (name.includes('ata')) {
        exactTargetPrice = name.includes('eski') ? Math.round(pAtaEski * 0.25) : Math.round(pAtaYeni * 0.25);
      } else {
        exactTargetPrice = name.includes('eski') ? pCeyrekEski : pCeyrekYeni;
      }
    }
    // 2. Yarım Altın
    else if (name.includes('yarım')) {
      if (name.includes('ata')) {
        exactTargetPrice = name.includes('eski') ? Math.round(pAtaEski * 0.5) : Math.round(pAtaYeni * 0.5);
      } else {
        exactTargetPrice = name.includes('eski') ? pYarimEski : pYarimYeni;
      }
    }
    // 3. Ziynet / Tam Altın / Reşat / Beşli / Gremse
    else if (name.includes('tam altın') || name.includes('ziynet') || name.includes('reşat')) {
      const isEski = name.includes('eski');
      if (name.includes('beşli') || name.includes('5 tam')) {
        exactTargetPrice = 5 * (isEski ? pZiynetEski : pZiynetYeni);
      } else if (name.includes('2.5') || name.includes('gremse')) {
        exactTargetPrice = Math.round(2.5 * (isEski ? pZiynetEski : pZiynetYeni));
      } else if (name.includes('3 tam')) {
        exactTargetPrice = 3 * pZiynetYeni;
      } else {
        exactTargetPrice = isEski ? pZiynetEski : pZiynetYeni;
      }
    }
    // 4. Ata Altın
    else if (name.includes('ata')) {
      const isEski = name.includes('eski');
      if (name.includes('beşli')) {
        exactTargetPrice = 5 * (isEski ? pAtaEski : pAtaYeni);
      } else if (name.includes('2.5') || name.includes('gremse')) {
        exactTargetPrice = Math.round(2.5 * (isEski ? pAtaEski : pAtaYeni));
      } else {
        exactTargetPrice = isEski ? pAtaEski : pAtaYeni;
      }
    }
    // 5. 22 Ayar Bilezikler
    else if (name.includes('22 ayar') && name.includes('bilezik')) {
      const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
      const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
      exactTargetPrice = Math.round(gram * p22k);
    }
    // 6. 14 Ayar Bilezikler
    else if (name.includes('14 ayar') && name.includes('bilezik')) {
      const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
      const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
      exactTargetPrice = Math.round(gram * p14k);
    }
    // 7. Külçe / Gram Altın
    else if (name.includes('külçe') || name.includes('gram altın') || name.includes('has altın')) {
      const gramMatch = name.match(/(\d+)\s*(?:gr|gram|kg|kilogram)/i);
      let gram = 1;
      if (name.includes('1 kg') || name.includes('1 kilogram')) gram = 1000;
      else if (gramMatch) gram = parseFloat(gramMatch[1]);
      exactTargetPrice = Math.round(gram * pGram);
    }

    if (exactTargetPrice && exactTargetPrice > 0) {
      if (p.price !== exactTargetPrice) {
        p.price = exactTargetPrice;
        changedMap.set(p.id, exactTargetPrice);
      }
    }
  }

  // DOM üzerindeki yalnızca değişen altın ürünlerinin fiyat alanlarını nokta atışı yenile
  if (changedMap.size > 0 && typeof document !== 'undefined') {
    for (const [prodId, newPrice] of changedMap.entries()) {
      const formatted = typeof formatPrice === 'function' ? formatPrice(newPrice) : '₺' + newPrice.toLocaleString('tr-TR');
      const elements = document.querySelectorAll(`[data-product-price-id="${prodId}"]`);
      elements.forEach(el => {
        const vat = el.querySelector?.('.vat-text');
        if (vat) {
          el.innerHTML = `${formatted} <small class="vat-text">${vat.textContent}</small>`;
        } else {
          el.textContent = formatted;
        }
      });
    }

    // 2. PDP (Ürün Detay Sayfası) aktif ve açık ürün değişenler arasında ise
    if (window.currentOpenProductId && changedMap.has(window.currentOpenProductId)) {
      const pdpPrice = document.querySelector('.pdp-current-price');
      if (pdpPrice) {
        const pVal = changedMap.get(window.currentOpenProductId);
        pdpPrice.textContent = typeof formatPrice === 'function' ? formatPrice(pVal) : '₺' + pVal.toLocaleString('tr-TR');
      }
    }

    // 3. Sepetteki altın ürünlerinin fiyatlarını senkronize et
    if (typeof Cart !== 'undefined' && Array.isArray(Cart.items)) {
      let cartChanged = false;
      Cart.items.forEach(ci => {
        if (changedMap.has(ci.id)) {
          ci.price = changedMap.get(ci.id);
          cartChanged = true;
        }
      });
      if (cartChanged && typeof Cart.updateUI === 'function') {
        Cart.updateUI();
      }
    }
  }
}


/**
 * Ticker ve Showroom Vitrini DOM Güncellemesi (Primary: İZKO normal Satış / Fallback: Harem)
 */
function updateMarketTickerDOM() {
  const rawItems = LIVE_MARKET_DATA.items || {};
  const izko = LIVE_MARKET_DATA.izkoRates || {};
  const BOARD_MARGIN = 1.0; // Sıfır Marj (1.00x) — İZKO Primary Satış / Harem Fallback Satış

  const baseHas = izko.hasAltin || parseFloat(rawItems.ALTIN?.satis) || LIVE_MARKET_DATA.hasAltin || LIVE_MARKET_DATA.gramGold24k || 6826.16;
  const baseGram = izko.gramGold24k || izko.gram || izko.hasAltin || parseFloat(rawItems.ALTIN?.satis) || LIVE_MARKET_DATA.gramGold24k || baseHas;
  const base22k = izko.gramGold22k || parseFloat(rawItems.AYAR22?.satis) || LIVE_MARKET_DATA.gramGold22k || Math.round(baseHas * 0.937);
  const baseAtaYeni = izko.ataGold || parseFloat(rawItems.ATA_YENI?.satis) || LIVE_MARKET_DATA.ataGold || 45450;
  const baseCeyrekYeni = izko.quarterGold || parseFloat(rawItems.CEYREK_YENI?.satis) || LIVE_MARKET_DATA.quarterGold || 11300;
  const basePackaged = izko.packagedGold || parseFloat(rawItems.KULCEALTIN?.satis) || LIVE_MARKET_DATA.packagedGold || baseHas;

  const currentGram = Math.round(baseGram * BOARD_MARGIN);
  const current22k = Math.round(base22k * BOARD_MARGIN);
  const currentQuarter = Math.round(baseCeyrekYeni * BOARD_MARGIN);
  const currentAta = Math.round(baseAtaYeni * BOARD_MARGIN);
  const currentPackaged = Math.round(basePackaged * BOARD_MARGIN);
  const currentUsd = Number(LIVE_MARKET_DATA.usdTry || 48.25).toFixed(2);
  const currentEur = Number(LIVE_MARKET_DATA.eurTry || 56.21).toFixed(2);

  const formatChange = (valStr) => {
    if (!valStr) return '▲ %0.55';
    const clean = String(valStr).replace(/[^\d.,-]/g, '').replace(',', '.');
    const num = parseFloat(clean) || 0;
    const isNeg = num < 0 || String(valStr).includes('-');
    const arrow = isNeg ? '▼' : '▲';
    return `${arrow} %${Math.abs(num).toFixed(2)}`;
  };

  const chgGram = formatChange(LIVE_MARKET_DATA.changeGram);
  const chg22k = formatChange(LIVE_MARKET_DATA.change22k);
  const chgQuarter = formatChange(LIVE_MARKET_DATA.changeQuarter);

  const elements = [
    // 1. Döngü (Loop 1)
    { id: 'liveGramGold', val: '₺' + currentGram.toLocaleString('tr-TR'), chg: 'liveGramChange', chgVal: chgGram },
    { id: 'live22KGold', val: '₺' + current22k.toLocaleString('tr-TR'), chg: 'live22KChange', chgVal: chg22k },
    { id: 'liveQuarterGold', val: '₺' + currentQuarter.toLocaleString('tr-TR'), chg: 'liveQuarterChange', chgVal: chgQuarter },
    { id: 'liveAtaGold', val: '₺' + currentAta.toLocaleString('tr-TR') },
    { id: 'livePackagedGold', val: '₺' + currentPackaged.toLocaleString('tr-TR') },
    { id: 'liveUsdTry', val: '₺' + currentUsd },
    { id: 'liveEurTry', val: '₺' + currentEur },
    
    // 2. Kesintisiz Marquee Döngüsü (Loop 2 — 1. Döngü ile %100 Birebir Eşleşme)
    { id: 'liveGramGold2', val: '₺' + currentGram.toLocaleString('tr-TR'), chg: 'liveGramChange2', chgVal: chgGram },
    { id: 'live22KGold2', val: '₺' + current22k.toLocaleString('tr-TR'), chg: 'live22KChange2', chgVal: chg22k },
    { id: 'liveQuarterGold2', val: '₺' + currentQuarter.toLocaleString('tr-TR'), chg: 'liveQuarterChange2', chgVal: chgQuarter },
    { id: 'liveAtaGold2', val: '₺' + currentAta.toLocaleString('tr-TR') },
    { id: 'livePackagedGold2', val: '₺' + currentPackaged.toLocaleString('tr-TR') },
    { id: 'liveUsdTry2', val: '₺' + currentUsd },
    { id: 'liveEurTry2', val: '₺' + currentEur },
    
    // Hero & Showroom Özel Vitrinleri
    { id: 'heroGoldRate', val: '₺' + currentGram.toLocaleString('tr-TR') },
    { id: 'heroQuarterRate', val: '₺' + currentQuarter.toLocaleString('tr-TR') }
  ];

  elements.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      if (el.textContent !== item.val) {
        el.textContent = item.val;
        el.classList.add('price-flash');
        setTimeout(() => el.classList.remove('price-flash'), 800);
      }
    }
    if (item.chg) {
      const chgEl = document.getElementById(item.chg);
      if (chgEl) chgEl.textContent = item.chgVal;
    }
  });
}

/**
 * İzmir Buca Showroom Çalışma Durumu:
 * Pazartesi - Cumartesi: 09:00 - 19:00
 * Pazar: Kapalı
 */
function updateShowroomStatus() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const turkeyTime = new Date(utc + (3600000 * 3));
  
  const day = turkeyTime.getDay(); // 0 = Pazar, 1 = Pzt, ..., 6 = Cmt
  const hour = turkeyTime.getHours();
  const minute = turkeyTime.getMinutes();
  const timeDecimal = hour + (minute / 60);

  const statusPill = document.getElementById('showroomStatusPill');
  if (!statusPill) return;

  if (day === 0) {
    statusPill.className = 'showroom-status-pill closed';
    statusPill.innerHTML = `
      <span class="status-live-dot" style="background:#E53935; box-shadow:0 0 8px #E53935;"></span>
      <span style="color:#E53935;">İzmir Buca Showroom: Pazar Kapalı (Hafta İçi 09:00 - 19:00)</span>
    `;
  } else if (timeDecimal >= 9 && timeDecimal < 19) {
    statusPill.className = 'showroom-status-pill open';
    statusPill.innerHTML = `
      <span class="status-live-dot" style="background:#25D366; box-shadow:0 0 8px #25D366;"></span>
      <span style="color:#25D366;">İzmir Buca Showroom Açık (09:00 - 19:00 • Pzr Kapalı)</span>
    `;
  } else {
    statusPill.className = 'showroom-status-pill soon';
    statusPill.innerHTML = `
      <span class="status-live-dot" style="background:#F59E0B; box-shadow:0 0 8px #F59E0B;"></span>
      <span style="color:#F59E0B;">İzmir Buca Showroom Kapalı (Açılış: 09:00 • Pzr Kapalı)</span>
    `;
  }
}

/**
 * Lüks Bildirim Sistemi (Toast)
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function getAllProducts() {
  if (typeof PriceUpdateAutomator !== 'undefined' && PriceUpdateAutomator._cachedAllProducts && PriceUpdateAutomator._lastProductsLength === (typeof PRODUCTS !== 'undefined' ? PRODUCTS.length : 0)) {
    return PriceUpdateAutomator._cachedAllProducts;
  }
  const prods = typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS) ? PRODUCTS : [];
  const elite = typeof ELITE_WATCHES !== 'undefined' && Array.isArray(ELITE_WATCHES) ? ELITE_WATCHES : [];
  const watches = typeof WATCHES !== 'undefined' && Array.isArray(WATCHES) ? WATCHES : [];

  const map = new Map();
  prods.forEach(p => { if (p && p.id !== undefined) map.set(String(p.id), p); });
  elite.forEach(p => { if (p && p.id !== undefined && !map.has(String(p.id))) map.set(String(p.id), p); });
  watches.forEach(p => { if (p && p.id !== undefined && !map.has(String(p.id))) map.set(String(p.id), p); });
  const all = Array.from(map.values());
  if (typeof PriceUpdateAutomator !== 'undefined') {
    PriceUpdateAutomator._cachedAllProducts = all;
  }
  return all;
}

function findProduct(id) {
  if (typeof PriceUpdateAutomator !== 'undefined' && typeof PriceUpdateAutomator.findProduct === 'function') {
    const res = PriceUpdateAutomator.findProduct(id);
    if (res) return res;
  }
  if (id === undefined || id === null || id === '') return undefined;
  const strId = String(id).trim();
  const numId = parseInt(strId, 10);
  const prods = getAllProducts();
  return prods.find(p =>
    String(p.id) === strId ||
    (!isNaN(numId) && Number(p.id) === numId) ||
    p.slug === strId ||
    (p.reference && String(p.reference).toLowerCase() === strId.toLowerCase())
  );
}

function debounce(fn, ms = 250) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function calculateInstallments(amount) {
  return [
    {
      count: 1,
      name: "Tek Çekim",
      monthlyPrice: formatPrice(amount),
      totalPrice: formatPrice(amount)
    }
  ];
}

/**
 * iOS & Mac Safari Marquee Dokunmatik Destek
 */
function initMarqueeTouchSupport() {
  const tracks = document.querySelectorAll('.gold-marquee-track, .brands-carousel-track');
  tracks.forEach(track => {
    track.style.animationPlayState = 'running';
  });
}

// ==========================================================
// MASTER TEKNİK HUKUKİ KURAL: 12.000 TL ÜZERİ YÜKSEK DEĞERLİ GÜVENLİ MAĞAZA TESLİMİ (03)
// ==========================================================
const HIGH_VALUE_SECURE_DELIVERY_THRESHOLD = 12000;

function isHighValueSecureDelivery(product) {
  if (!product) return false;
  if (product.deliveryMethod === 'cargo') return false;

  const cat = String(product.category || '').toLowerCase();
  const metal = String(product.metal || '').toLowerCase();
  const isPreOwned = product.isPreOwned === true || cat === 'seckin-urunler' || cat === 'ikinci-el' || cat === 'luxury';
  const isGold = Boolean(product.isGold) || cat === 'altin' || cat === 'gold' || cat === 'mucevherat' || cat === 'jewelry' || cat === 'jewellery' || metal.includes('altın') || /au\s?\d{3}/i.test(metal);

  // 1. Seçkin Ürünler (2. El Lüks Saatler) ve Altın/Mücevherat için Mağazadan Teslim Zorunludur
  if (isPreOwned || isGold) return true;

  // 2. Saatler kategorisindeki sıfır saatler kargo ile gönderilebilir
  if (cat === 'saat' || cat === 'watch') return false;

  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
  return !isNaN(price) && price > HIGH_VALUE_SECURE_DELIVERY_THRESHOLD;
}

// ==========================================================
// BANKA KART DOĞRULAMA MOTORU (LUHN ALGORİTMASI & SKT & CVV)
// ==========================================================
function isValidLuhn(cardNumber) {
  if (!cardNumber) return false;
  const digits = String(cardNumber).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isValidCardExpiry(expiryStr) {
  if (!expiryStr) return false;
  const clean = String(expiryStr).trim();
  const parts = clean.split('/');
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0].trim(), 10);
  let year = parseInt(parts[1].trim(), 10);
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return false;
  if (year < 100) year += 2000;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (year > currentYear + 25) return false;
  return true;
}

function isValidCardCvv(cvv) {
  if (!cvv) return false;
  const clean = String(cvv).replace(/\D/g, '');
  return clean.length === 3 || clean.length === 4;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initMarqueeTouchSupport();
    if (typeof PriceUpdateAutomator !== 'undefined') {
      PriceUpdateAutomator.startObserver();
    }
    if (typeof fetchClientIzkoRates === 'function') {
      fetchClientIzkoRates();
      setInterval(fetchClientIzkoRates, 60000);
    }
  });
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (typeof PriceUpdateAutomator !== 'undefined') {
      PriceUpdateAutomator.startObserver();
    }
    if (typeof fetchClientIzkoRates === 'function' && !LIVE_MARKET_DATA.izkoLastFetched) {
      fetchClientIzkoRates();
    }
  }
}

if (typeof window !== 'undefined') {
  window.PriceUpdateAutomator = PriceUpdateAutomator;
  window.getProductById = getProductById;
  window.getGoldProducts = getGoldProducts;
  window.findProduct = findProduct;
  window.triggerPriceDomUpdates = triggerPriceDomUpdates;
  window.updateDynamicGoldProductPrices = updateDynamicGoldProductPrices;
  window.fetchClientIzkoRates = fetchClientIzkoRates;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CURRENT_CURRENCY,
    EXCHANGE_RATES,
    CURRENCY_SYMBOLS,
    LIVE_MARKET_DATA,
    formatPrice,
    HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
    isHighValueSecureDelivery,
    isValidLuhn,
    isValidCardExpiry,
    isValidCardCvv,
    PriceUpdateAutomator,
    getProductById,
    getGoldProducts,
    findProduct,
    triggerPriceDomUpdates,
    updateDynamicGoldProductPrices,
    fetchClientIzkoRates
  };
}

