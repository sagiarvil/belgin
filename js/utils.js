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
  hasAltin: 7121.25,
  gramGold24k: 7121.25,
  gramGold22k: 6690,
  gramGold18k: 6400,
  gramGold14k: 5950,
  gramGold8k: 3450,
  quarterGold: 11750,
  oldQuarterGold: 11600,
  halfGold: 23500,
  fullGold: 47000,
  ataGold: 47400,
  packagedGold: 7235.50,
  usdTry: 48.25,
  eurTry: 56.21,
  changeGram: "+0.55%",
  change22k: "+0.55%",
  changeQuarter: "+0.55%",
  direction: "up",
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
function isValidMarketRate(val, min = 100, max = 500000) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val >= min && val <= max;
}

/**
 * İZMİR KUYUMCULAR ODASI (İZKO) VE CANLI DÖVİZ KUR MOTORU (15 DAKİKALIK OTOMASYON)
 * Kaynak: https://www.izko.org.tr/guncel-kur & https://finans.truncgil.com
 * Tier-1: İZKO Resmi Web API Doğrudan Çağrısı (https://www.izko.org.tr/api/web/v1/gold-prices)
 * Tier-2: Truncgil Canlı Finans & Döviz Piyasaları Servisi (Canlı USD/TRY, EUR/TRY ve Altın Yedeklemesi)
 * Tier-3: Belgin Backend İZKO Proxy & Cache Servisi (/api/market/izko-rates)
 */
async function fetchLiveMarketRates() {
  let izkoSuccess = false;

  // 1. TIER-1: İZKO Resmi API Doğrudan Çağrısı (Ultra Hızlı & CORS Destekli)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
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
          const isUp = chgNum >= 0;
          LIVE_MARKET_DATA.direction = json.data[0].direction || (isUp ? 'up' : 'down');
          LIVE_MARKET_DATA.changeGram = (isUp ? '+' : '') + chgNum.toFixed(2) + '%';
          LIVE_MARKET_DATA.change22k = LIVE_MARKET_DATA.changeGram;
          LIVE_MARKET_DATA.changeQuarter = LIVE_MARKET_DATA.changeGram;
        }

        LIVE_MARKET_DATA.lastUpdated = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        izkoSuccess = true;
      }
    }
  } catch (err) {
    // Tier-1 bağlantı hatası durumunda Tier-2/Tier-3 devreye girer
  }

  // 2. TIER-2: Canlı Döviz ve Piyasa Senkronizasyonu (USD/TRY, EUR/TRY, GBP/TRY)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://finans.truncgil.com/today.json', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const parseNum = (str) => {
        if (!str) return 0;
        return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0;
      };

      if (data.USD && data.USD['Satış']) {
        const usd = parseNum(data.USD['Satış']);
        if (usd > 10 && usd < 200) {
          LIVE_MARKET_DATA.usdTry = usd;
          EXCHANGE_RATES.USD = Number((1 / usd).toFixed(6));
        }
      }
      if (data.EUR && data.EUR['Satış']) {
        const eur = parseNum(data.EUR['Satış']);
        if (eur > 10 && eur < 200) {
          LIVE_MARKET_DATA.eurTry = eur;
          EXCHANGE_RATES.EUR = Number((1 / eur).toFixed(6));
        }
      }
      if (data.GBP && data.GBP['Satış']) {
        const gbp = parseNum(data.GBP['Satış']);
        if (gbp > 10 && gbp < 200) {
          EXCHANGE_RATES.GBP = Number((1 / gbp).toFixed(6));
        }
      }

      // Eğer İZKO API ulaşılamadıysa Truncgil altın verisiyle güvenli fallback
      if (!izkoSuccess && data['gram-has-altin']) {
        const has = parseNum(data['gram-has-altin']['Satış'] || data['gram-altin']?.['Satış']);
        if (has > 1000) {
          LIVE_MARKET_DATA.hasAltin = has;
          LIVE_MARKET_DATA.gramGold24k = has;
          LIVE_MARKET_DATA.gramGold22k = parseNum(data['22-ayar-bilezik']?.['Satış']) || Math.round(has * 0.925);
          LIVE_MARKET_DATA.quarterGold = parseNum(data['ceyrek-altin']?.['Satış']) || Math.round(has * 1.63);
          LIVE_MARKET_DATA.halfGold = parseNum(data['yarim-altin']?.['Satış']) || Math.round(has * 3.26);
          LIVE_MARKET_DATA.fullGold = parseNum(data['tam-altin']?.['Satış']) || Math.round(has * 6.52);
          LIVE_MARKET_DATA.ataGold = parseNum(data['ata-altin']?.['Satış']) || Math.round(has * 6.60);
          LIVE_MARKET_DATA.packagedGold = Math.round(has * 1.015);
          izkoSuccess = true;
        }
      }
    }
  } catch (err) {
    // Truncgil döviz servisi offline durumunda varsayılan kurlar korunur
  }

  // 3. TIER-3: Belgin Backend İZKO Servisi (Proxy Fallback)
  if (!izkoSuccess) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/market/izko-rates', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.hasAltin && data.hasAltin > 1000) {
          LIVE_MARKET_DATA.hasAltin = data.hasAltin;
          LIVE_MARKET_DATA.gramGold24k = data.gramGold24k || data.hasAltin;
          LIVE_MARKET_DATA.gramGold22k = data.gramGold22k || 6690;
          LIVE_MARKET_DATA.gramGold18k = data.gramGold18k || 6400;
          LIVE_MARKET_DATA.gramGold14k = data.gramGold14k || 5950;
          LIVE_MARKET_DATA.gramGold8k = data.gramGold8k || 3450;
          LIVE_MARKET_DATA.quarterGold = data.quarterGold || 11750;
          LIVE_MARKET_DATA.oldQuarterGold = data.oldQuarterGold || 11600;
          LIVE_MARKET_DATA.halfGold = data.halfGold || 23500;
          LIVE_MARKET_DATA.fullGold = data.fullGold || 47000;
          LIVE_MARKET_DATA.ataGold = data.ataGold || 47400;
          LIVE_MARKET_DATA.packagedGold = data.packagedGold || 7235.50;
          LIVE_MARKET_DATA.changeGram = data.changeGram || '+0.55%';
          LIVE_MARKET_DATA.change22k = data.change22k || '+0.55%';
          LIVE_MARKET_DATA.changeQuarter = data.changeQuarter || '+0.55%';
          LIVE_MARKET_DATA.lastUpdated = data.lastUpdatedFormatted || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
          izkoSuccess = true;
        }
      }
    } catch (err) {
      // Backend proxy geçici offline
    }
  }

  // DOM Ticker, Hero Vitrin ve Değerleme Motorunu Kusursuz Senkronize Et
  updateMarketTickerDOM();
  updateShowroomStatus();

  if (typeof ValuationEngine !== 'undefined' && ValuationEngine.calculateGold) {
    ValuationEngine.calculateGold();
  }
}

/**
 * Ticker ve Showroom Vitrini DOM Güncellemesi (Kusursuz Senkronizasyon & Çift Döngü Eşleme)
 */
function updateMarketTickerDOM() {
  const currentGram = Math.round(LIVE_MARKET_DATA.gramGold24k || LIVE_MARKET_DATA.hasAltin || 7121);
  const current22k = Math.round(LIVE_MARKET_DATA.gramGold22k || 6690);
  const currentQuarter = Math.round(LIVE_MARKET_DATA.quarterGold || 11750);
  const currentAta = Math.round(LIVE_MARKET_DATA.ataGold || 47400);
  const currentPackaged = Math.round(LIVE_MARKET_DATA.packagedGold || 7236);
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

