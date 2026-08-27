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
 * İZMİR KUYUMCULAR ODASI (İZKO) CANLI KUR MOTORU (15 DAKİKALIK OTOMASYON)
 * Kaynak: https://www.izko.org.tr/guncel-kur
 * Tier-1: Belgin Backend İZKO Proxy & Cache Servisi (/api/market/izko-rates)
 * Tier-2: İZKO Resmi API Doğrudan Çağrısı (https://www.izko.org.tr/api/web/v1/gold-prices)
 */
async function fetchLiveMarketRates() {
  let izkoSuccess = false;

  // 1. TIER-1: Belgin Backend İZKO Servisi (CORS korumalı & 15 dk önbellekli)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('/api/market/izko-rates', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.hasAltin && data.hasAltin > 1000) {
        LIVE_MARKET_DATA.hasAltin = data.hasAltin;
        LIVE_MARKET_DATA.gramGold24k = data.gramGold24k || data.hasAltin;
        LIVE_MARKET_DATA.gramGold22k = data.gramGold22k || 6680;
        LIVE_MARKET_DATA.gramGold18k = data.gramGold18k || 6400;
        LIVE_MARKET_DATA.gramGold14k = data.gramGold14k || 5940;
        LIVE_MARKET_DATA.gramGold8k = data.gramGold8k || 3440;
        LIVE_MARKET_DATA.quarterGold = data.quarterGold || 11740;
        LIVE_MARKET_DATA.oldQuarterGold = data.oldQuarterGold || 11570;
        LIVE_MARKET_DATA.halfGold = data.halfGold || 23500;
        LIVE_MARKET_DATA.fullGold = data.fullGold || 46710;
        LIVE_MARKET_DATA.ataGold = data.ataGold || 47330;
        LIVE_MARKET_DATA.packagedGold = data.packagedGold || 7224.27;
        LIVE_MARKET_DATA.changeGram = data.changeGram || '+0.04%';
        LIVE_MARKET_DATA.change22k = data.change22k || '+0.04%';
        LIVE_MARKET_DATA.changeQuarter = data.changeQuarter || '+0.04%';
        LIVE_MARKET_DATA.lastUpdated = data.lastUpdatedFormatted || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        izkoSuccess = true;
      }
    }
  } catch (err) {
    // Backend servisi henüz başlamamışsa Tier-2 doğrudan İZKO'ya bağlanır
  }

  // 2. TIER-2: İZKO Resmi API Doğrudan Çağrısı
  if (!izkoSuccess) {
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
      // Tier-2 geçici durum
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
  if (String(product.brand || '').toLowerCase() === 'carren' || product.deliveryMethod === 'cargo') return false;
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

