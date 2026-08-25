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
  hasAltin: 7083,
  gramGold24k: 7083,
  gramGold22k: 6660,
  gramGold18k: 6380,
  gramGold14k: 5920,
  gramGold8k: 3430,
  quarterGold: 11700,
  oldQuarterGold: 11540,
  halfGold: 23420,
  fullGold: 46540,
  ataGold: 47150,
  packagedGold: 7197.17,
  usdTry: 48.08,
  eurTry: 56.19,
  changeGram: "+0.23%",
  change22k: "+0.23%",
  changeQuarter: "+0.23%",
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
 * İZMİR KUYUMCULAR ODASI (İZKO) RESMİ CANLI KUR ÇEKİCİ
 * URL: https://www.izko.org.tr/guncel-kur -> API: https://www.izko.org.tr/api/web/v1/gold-prices
 */
async function fetchLiveMarketRates() {
  let izkoSuccess = false;

  try {
    const res = await fetch('https://www.izko.org.tr/api/web/v1/gold-prices');
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        json.data.forEach(item => {
          const price = parseFloat(item.sell_price || item.buy_price) || 0;
          if (price > 0) {
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

        if (json.data[0] && json.data[0].percent_change) {
          const chg = '+' + json.data[0].percent_change + '%';
          LIVE_MARKET_DATA.changeGram = chg;
          LIVE_MARKET_DATA.change22k = chg;
          LIVE_MARKET_DATA.changeQuarter = chg;
        }

        LIVE_MARKET_DATA.lastUpdated = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        izkoSuccess = true;
      }
    }
  } catch (err) {
    console.warn('İZKO direkt API çağrısı proxy/CORS durumuna göre yedeklendi:', err.message);
  }

  // Canlı Döviz Kurlarını Çek (USD/TRY, EUR/TRY)
  try {
    const dRes = await fetch('https://finans.truncgil.com/v3/today.json');
    if (dRes.ok) {
      const dData = await dRes.json();
      if (dData && dData.USD) {
        const usd = parseFloat(String(dData.USD.Selling || dData.USD.Buying || 0).replace(/\./g, '').replace(',', '.'));
        const eur = parseFloat(String(dData.EUR.Selling || dData.EUR.Buying || 0).replace(/\./g, '').replace(',', '.'));
        if (usd > 0) {
          LIVE_MARKET_DATA.usdTry = +usd.toFixed(2);
          EXCHANGE_RATES.USD = 1 / usd;
        }
        if (eur > 0) {
          LIVE_MARKET_DATA.eurTry = +eur.toFixed(2);
          EXCHANGE_RATES.EUR = 1 / eur;
        }

        // Eğer İZKO API ilk adımda tarayıcı CORS kısıtına takılırsa Truncgil altın fiyatlarıyla anında doldur
        if (!izkoSuccess && dData['gram-altin']) {
          const g24 = parseFloat(String(dData['gram-altin'].Selling).replace(/\./g, '').replace(',', '.'));
          const g22 = parseFloat(String(dData['22-ayar-bilezik'].Selling).replace(/\./g, '').replace(',', '.'));
          const qtr = parseFloat(String(dData['ceyrek-altin'].Selling).replace(/\./g, '').replace(',', '.'));
          if (g24 > 0) LIVE_MARKET_DATA.gramGold24k = Math.round(g24);
          if (g22 > 0) LIVE_MARKET_DATA.gramGold22k = Math.round(g22);
          if (qtr > 0) LIVE_MARKET_DATA.quarterGold = Math.round(qtr);
          LIVE_MARKET_DATA.hasAltin = LIVE_MARKET_DATA.gramGold24k;
        }
      }
    }
  } catch (e) {}

  // DOM Ticker ve Değerleme Motorunu Canlı Verilerle Yenile
  updateMarketTickerDOM();
  updateShowroomStatus();

  if (typeof ValuationEngine !== 'undefined' && ValuationEngine.calculateGold) {
    ValuationEngine.calculateGold();
  }
}

/**
 * Ticker DOM Güncellemesi
 */
function updateMarketTickerDOM() {
  const elements = [
    { id: 'liveGramGold', val: '₺' + Number(LIVE_MARKET_DATA.gramGold24k).toLocaleString('tr-TR'), chg: 'liveGramChange', chgVal: '▲ ' + LIVE_MARKET_DATA.changeGram },
    { id: 'live22KGold', val: '₺' + Number(LIVE_MARKET_DATA.gramGold22k).toLocaleString('tr-TR'), chg: 'live22KChange', chgVal: '▲ ' + LIVE_MARKET_DATA.change22k },
    { id: 'liveQuarterGold', val: '₺' + Number(LIVE_MARKET_DATA.quarterGold).toLocaleString('tr-TR'), chg: 'liveQuarterChange', chgVal: '▲ ' + LIVE_MARKET_DATA.changeQuarter },
    { id: 'liveAtaGold', val: '₺' + Number(LIVE_MARKET_DATA.ataGold).toLocaleString('tr-TR') },
    { id: 'liveUsdTry', val: '₺' + Number(LIVE_MARKET_DATA.usdTry).toFixed(2) },
    { id: 'liveEurTry', val: '₺' + Number(LIVE_MARKET_DATA.eurTry).toFixed(2) },
    
    // Marquee 2. Döngü
    { id: 'liveGramGold2', val: '₺' + Number(LIVE_MARKET_DATA.gramGold24k).toLocaleString('tr-TR'), chg: 'liveGramChange2', chgVal: '▲ ' + LIVE_MARKET_DATA.changeGram },
    { id: 'live22KGold2', val: '₺' + Number(LIVE_MARKET_DATA.gramGold22k).toLocaleString('tr-TR'), chg: 'live22KChange2', chgVal: '▲ ' + LIVE_MARKET_DATA.change22k },
    { id: 'liveQuarterGold2', val: '₺' + Number(LIVE_MARKET_DATA.quarterGold).toLocaleString('tr-TR'), chg: 'liveQuarterChange2', chgVal: '▲ ' + LIVE_MARKET_DATA.changeQuarter },
    { id: 'liveAtaGold2', val: '₺' + Number(LIVE_MARKET_DATA.ataGold).toLocaleString('tr-TR') },
    { id: 'liveUsdTry2', val: '₺' + Number(LIVE_MARKET_DATA.usdTry).toFixed(2) },
    { id: 'liveEurTry2', val: '₺' + Number(LIVE_MARKET_DATA.eurTry).toFixed(2) }
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
  const installments = [
    { count: 1, rate: 0.00, name: "Tek Çekim" },
    { count: 3, rate: 0.035, name: "3 Taksit" },
    { count: 6, rate: 0.068, name: "6 Taksit" },
    { count: 9, rate: 0.098, name: "9 Taksit" },
    { count: 12, rate: 0.125, name: "12 Taksit" }
  ];

  return installments.map(inst => {
    const totalWithInterest = amount * (1 + inst.rate);
    const monthly = totalWithInterest / inst.count;
    return {
      count: inst.count,
      name: inst.name,
      monthlyPrice: formatPrice(monthly),
      totalPrice: formatPrice(totalWithInterest)
    };
  });
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

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initMarqueeTouchSupport);
}
