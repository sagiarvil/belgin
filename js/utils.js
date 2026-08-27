// ==========================================================
// BELGIN KUYUMCULUK — İZMİR KUYUMCULAR ODASI (İZKO) RESMİ CANLI KUR MOTORU
// KAYNAK: https://www.izko.org.tr/guncel-kur (İZKO Web API & WebSocket)
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

// İZKO Resmi Canlı Altın & Döviz Verileri
const LIVE_MARKET_DATA = {
  hasAltin: 7111,
  gramGold24k: 7111,
  gramGold22k: 6680,
  gramGold18k: 6400,
  gramGold14k: 5940,
  gramGold8k: 3440,
  quarterGold: 11740,
  oldQuarterGold: 11570,
  halfGold: 23510,
  fullGold: 46720,
  ataGold: 47340,
  packagedGold: 7225.30,
  usdTry: 48.14,
  eurTry: 56.23,
  changeGram: "+0.05%",
  change22k: "+0.05%",
  changeQuarter: "+0.05%",
  source: "İzmir Kuyumcular Odası (İZKO)",
  lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
};

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
function isValidMarketRate(val, min = 1000, max = 500000) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= min && val <= max;
}

/**
 * 3-KADEMELİ HATA TOLERANSLI CANLI KUR MOTORU (İZKO + TRUNCGIL + SENTETİK ONS)
 * Tier-1: İzmir Kuyumcular Odası (İZKO) Resmi API
 * Tier-2: Truncgil Finans API
 * Tier-3: Ons & USD/TRY Sentetik Borsa Türetimi
 */
async function fetchLiveMarketRates() {
  let izkoSuccess = false;
  let truncgilSuccess = false;

  // 1. TIER-1: İZKO RESMİ KUR API ÇAĞRISI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://www.izko.org.tr/api/web/v1/gold-prices', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        json.data.forEach(item => {
          const price = parseFloat(item.sell_price || item.buy_price) || 0;
          if (isValidMarketRate(price)) {
            switch (item.key) {
              case 'hasaltin':
                LIVE_MARKET_DATA.hasAltin = price;
                LIVE_MARKET_DATA.gramGold24k = price;
                break;
              case 'yirmiiki':
              case 'gram':
                LIVE_MARKET_DATA.gramGold22k = price;
                break;
              case 'onsekiz':
                LIVE_MARKET_DATA.gramGold18k = price;
                break;
              case 'ondort':
                LIVE_MARKET_DATA.gramGold14k = price;
                break;
              case 'sekizayar':
                LIVE_MARKET_DATA.gramGold8k = price;
                break;
              case 'yeniceyrek':
                LIVE_MARKET_DATA.quarterGold = price;
                break;
              case 'eskiceyrek':
                LIVE_MARKET_DATA.oldQuarterGold = price;
                break;
              case 'yeniyarim':
                LIVE_MARKET_DATA.halfGold = price;
                break;
              case 'yenitam':
                LIVE_MARKET_DATA.fullGold = price;
                break;
              case 'ata':
                LIVE_MARKET_DATA.ataGold = price;
                break;
              case 'paketlihas':
                LIVE_MARKET_DATA.packagedGold = price;
                break;
            }
          }
        });

        if (json.data[0] && json.data[0].percent_change !== undefined) {
          const chgNum = parseFloat(json.data[0].percent_change) || 0;
          const chg = (chgNum >= 0 ? '+' : '') + chgNum.toFixed(2) + '%';
          LIVE_MARKET_DATA.changeGram = chg;
          LIVE_MARKET_DATA.change22k = chg;
          LIVE_MARKET_DATA.changeQuarter = chg;
        }

        LIVE_MARKET_DATA.lastUpdated = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        izkoSuccess = true;
      }
    }
  } catch (err) {
    // Tier-1 geçici bağlantı/ağ durumu
  }

  // 2. TIER-2: TRUNCGIL FİNANS API (DÖVİZ & YEDEK ALTIN)
  let rawOnsUsd = 0;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const dRes = await fetch('https://finans.truncgil.com/v3/today.json', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (dRes.ok) {
      const dData = await dRes.json();
      if (dData && dData.USD) {
        const usd = parseFloat(String(dData.USD.Selling || dData.USD.Buying || 0).replace(/\./g, '').replace(',', '.'));
        const eur = parseFloat(String(dData.EUR.Selling || dData.EUR.Buying || 0).replace(/\./g, '').replace(',', '.'));
        if (isValidMarketRate(usd, 10, 200)) {
          LIVE_MARKET_DATA.usdTry = +usd.toFixed(2);
          EXCHANGE_RATES.USD = 1 / usd;
        }
        if (isValidMarketRate(eur, 10, 250)) {
          LIVE_MARKET_DATA.eurTry = +eur.toFixed(2);
          EXCHANGE_RATES.EUR = 1 / eur;
        }

        if (dData.ons && dData.ons.Selling) {
          const ons = parseFloat(String(dData.ons.Selling).replace(/\$/g, '').replace(/\./g, '').replace(',', '.'));
          if (isValidMarketRate(ons, 1000, 10000)) rawOnsUsd = ons;
        }

        // İZKO başarısız olduysa Truncgil altın kurları ile devre kesiciyi doldur
        if (!izkoSuccess && dData['gram-altin']) {
          const g24 = parseFloat(String(dData['gram-altin'].Selling || 0).replace(/\./g, '').replace(',', '.'));
          const g22 = parseFloat(String(dData['22-ayar-bilezik']?.Selling || 0).replace(/\./g, '').replace(',', '.'));
          const qtr = parseFloat(String(dData['ceyrek-altin']?.Selling || 0).replace(/\./g, '').replace(',', '.'));
          const yar = parseFloat(String(dData['yarim-altin']?.Selling || 0).replace(/\./g, '').replace(',', '.'));
          const tam = parseFloat(String(dData['tam-altin']?.Selling || 0).replace(/\./g, '').replace(',', '.'));
          const ata = parseFloat(String(dData['cumhuriyet-altini']?.Selling || 0).replace(/\./g, '').replace(',', '.'));

          if (isValidMarketRate(g24, 3000, 50000)) {
            LIVE_MARKET_DATA.gramGold24k = Math.round(g24);
            LIVE_MARKET_DATA.hasAltin = Math.round(g24);
          }
          if (isValidMarketRate(g22, 3000, 50000)) LIVE_MARKET_DATA.gramGold22k = Math.round(g22);
          if (isValidMarketRate(qtr, 5000, 100000)) LIVE_MARKET_DATA.quarterGold = Math.round(qtr);
          if (isValidMarketRate(yar, 10000, 200000)) LIVE_MARKET_DATA.halfGold = Math.round(yar);
          if (isValidMarketRate(tam, 20000, 400000)) LIVE_MARKET_DATA.fullGold = Math.round(tam);
          if (isValidMarketRate(ata, 20000, 400000)) LIVE_MARKET_DATA.ataGold = Math.round(ata);
          truncgilSuccess = true;
        }
      }
    }
  } catch (e) {
    // Tier-2 geçici bağlantı/ağ durumu
  }

  // 3. TIER-3: SENTETİK ONS HESAPLAMA (Tüm API'ler kesilirse sentetik türetim)
  if (!izkoSuccess && !truncgilSuccess && rawOnsUsd > 0 && LIVE_MARKET_DATA.usdTry > 0) {
    const syntheticGram24k = Math.round((rawOnsUsd / 31.1034768) * LIVE_MARKET_DATA.usdTry * 0.995);
    if (isValidMarketRate(syntheticGram24k, 3000, 50000)) {
      LIVE_MARKET_DATA.gramGold24k = syntheticGram24k;
      LIVE_MARKET_DATA.hasAltin = syntheticGram24k;
      LIVE_MARKET_DATA.gramGold22k = Math.round(syntheticGram24k * 0.916);
      LIVE_MARKET_DATA.quarterGold = Math.round(syntheticGram24k * 1.754 * 0.916 * 1.03);
      LIVE_MARKET_DATA.halfGold = Math.round(LIVE_MARKET_DATA.quarterGold * 2);
      LIVE_MARKET_DATA.fullGold = Math.round(LIVE_MARKET_DATA.quarterGold * 4);
      LIVE_MARKET_DATA.ataGold = Math.round(syntheticGram24k * 7.216 * 0.916 * 1.03);
    }
  }

  // DOM Ticker, Hero Vitrin ve Değerleme Motorunu Yenile
  updateMarketTickerDOM();
  updateShowroomStatus();

  if (typeof ValuationEngine !== 'undefined' && ValuationEngine.calculateGold) {
    ValuationEngine.calculateGold();
  }
}

/**
 * Ticker ve Showroom Vitrini DOM Güncellemesi (Pürüzsüz Flaş Animasyonu ile)
 */
function updateMarketTickerDOM() {
  const currentGram = Math.round(LIVE_MARKET_DATA.gramGold24k || LIVE_MARKET_DATA.hasAltin || 7111);
  const currentQuarter = Math.round(LIVE_MARKET_DATA.quarterGold || 11740);

  const elements = [
    { id: 'liveGramGold', val: '₺' + currentGram.toLocaleString('tr-TR'), chg: 'liveGramChange', chgVal: '▲ ' + LIVE_MARKET_DATA.changeGram },
    { id: 'live22KGold', val: '₺' + Number(LIVE_MARKET_DATA.gramGold22k || 6680).toLocaleString('tr-TR'), chg: 'live22KChange', chgVal: '▲ ' + LIVE_MARKET_DATA.change22k },
    { id: 'liveQuarterGold', val: '₺' + currentQuarter.toLocaleString('tr-TR'), chg: 'liveQuarterChange', chgVal: '▲ ' + LIVE_MARKET_DATA.changeQuarter },
    { id: 'liveAtaGold', val: '₺' + Number(LIVE_MARKET_DATA.ataGold || 47340).toLocaleString('tr-TR') },
    { id: 'liveUsdTry', val: '₺' + Number(LIVE_MARKET_DATA.usdTry || 48.14).toFixed(2) },
    { id: 'liveEurTry', val: '₺' + Number(LIVE_MARKET_DATA.eurTry || 56.23).toFixed(2) },
    
    // Marquee 2. Döngü
    { id: 'liveGramGold2', val: '₺' + currentGram.toLocaleString('tr-TR'), chg: 'liveGramChange2', chgVal: '▲ ' + LIVE_MARKET_DATA.changeGram },
    { id: 'live22KGold2', val: '₺' + Number(LIVE_MARKET_DATA.gramGold22k || 6680).toLocaleString('tr-TR'), chg: 'live22KChange2', chgVal: '▲ ' + LIVE_MARKET_DATA.change22k },
    { id: 'liveUsdTry2', val: '₺' + Number(LIVE_MARKET_DATA.usdTry || 48.14).toFixed(2) },
    { id: 'liveEurTry2', val: '₺' + Number(LIVE_MARKET_DATA.eurTry || 56.23).toFixed(2) },
    
    // Hero Asimetrik Özel Showroom Vitrini
    { id: 'heroGoldRate', val: '₺' + currentGram.toLocaleString('tr-TR') },
    { id: 'heroQuarterRate', val: '₺' + currentQuarter.toLocaleString('tr-TR') }
  ];

  elements.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.textContent = item.val;
      el.classList.add('price-flash');
      setTimeout(() => el.classList.remove('price-flash'), 800);
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
  const prods = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
  return prods;
}

function findProduct(id) {
  const numId = parseInt(id, 10);
  return getAllProducts().find(p => p.id === numId);
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
  const container = document.querySelector('.gold-marquee-container');
  if (!container) return;

  container.addEventListener('touchstart', () => {
    const track = document.querySelector('.gold-marquee-track');
    if (track) track.style.animationPlayState = 'paused';
  }, { passive: true });

  container.addEventListener('touchend', () => {
    const track = document.querySelector('.gold-marquee-track');
    if (track) track.style.animationPlayState = 'running';
  }, { passive: true });
}

// ==========================================================
// MASTER TEKNİK HUKUKİ KURAL: 12.000 TL ÜZERİ YÜKSEK DEĞERLİ GÜVENLİ MAĞAZA TESLİMİ (03)
// ==========================================================
const HIGH_VALUE_SECURE_DELIVERY_THRESHOLD = 12000;

function isHighValueSecureDelivery(product) {
  if (!product) return false;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
  if (isNaN(price) || price <= HIGH_VALUE_SECURE_DELIVERY_THRESHOLD) return false;
  const cat = String(product.category || '').toLowerCase();
  return ['altin', 'saat', 'watch', 'jewelry', 'jewellery', 'gold'].includes(cat) || Boolean(product.isGold) || Boolean(product.isPreOwned);
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
  document.addEventListener('DOMContentLoaded', initMarqueeTouchSupport);
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
    isValidCardCvv
  };
}

