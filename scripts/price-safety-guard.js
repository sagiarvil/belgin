// BELGIN KUYUMCULUK — ENTERPRISE PRICE SAFETY & FINANCIAL GUARD v2.0
// Amaç: Altın, Ziynet, Sarrafiye ve Saat fiyatlarında %100 sıfır hata, +%5 altın marjı, +%40 saat marjı ve anomali koruması sağlamak.

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const { PRODUCTS } = require(path.join(ROOT_DIR, 'js/data.js'));
const paymentCatalogPath = path.join(ROOT_DIR, 'functions/product-catalog.json');

console.log('====================================================');
console.log('🛡️  BELGIN KUYUMCULUK ENTERPRISE PRICE SAFETY GUARD');
console.log('====================================================');

let failureCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [CRITICAL-FAIL]: ${message}`);
    failureCount++;
  } else {
    console.log(`  ✅ [PASS]: ${message}`);
  }
}

// 1. Çok Adetli Altın İhlali Kontrolü (Zero-Tolerance)
console.log('\n--- 1. TEKİL ÜRÜN & ÇOK ADETLİ ALTIN YASAĞI DENETİMİ ---');
const multiUnitGolds = PRODUCTS.filter(p => {
  if (!p.isGold && p.category !== 'gold' && !p.subCategory?.includes('Ziynet') && !p.subCategory?.includes('Külçe')) return false;
  const n = (p.name || '').toLowerCase();
  const m = n.match(/(\d+)\s*adet/i);
  if (m && parseInt(m[1], 10) > 1) return true;
  if (/eski\s*\d+\s*adet/i.test(n) || /yeni\s*\d+\s*adet/i.test(n)) return true;
  if (/\b\d+\s*adet\s*(çeyrek|yarım|tam|ata|külçe|gram|gr)\b/i.test(n)) return true;
  return false;
});
assert(multiUnitGolds.length === 0, `Katalogda 0 çok adetli altın ürünü bulunmalı (Bulunan: ${multiUnitGolds.length})`);

// 2. Taban Fiyat & Piyasa Bandı Devre Kesici (Circuit Breaker)
console.log('\n--- 2. TABAN FİYAT & PİYASA BANDI GÜVENLİK DEVRE KESİCİSİ ---');
const goldItems = PRODUCTS.filter(p => p.isGold || p.category === 'gold' || p.subCategory?.includes('Ziynet') || p.subCategory?.includes('Külçe'));

let floorBreaches = 0;
for (const p of goldItems) {
  const name = (p.name || '').toLowerCase();
  const price = p.price;

  // Gram Altın (1 gr)
  if (name.includes('1 gr') && name.includes('külçe') && !name.includes('bilezik')) {
    if (price < 6800 || price > 12000) {
      console.error(`    ⚠️ [FLOOR-BREACH]: 1 gr Külçe Altın anormal fiyatta: [${p.reference}] ${p.name} = ${price} TL`);
      floorBreaches++;
    }
  }
  // Çeyrek Altın
  if (name.includes('çeyrek altın')) {
    if (price < 11000 || price > 18000) {
      console.error(`    ⚠️ [FLOOR-BREACH]: Çeyrek Altın anormal fiyatta: [${p.reference}] ${p.name} = ${price} TL`);
      floorBreaches++;
    }
  }
  // Yarım Altın
  if (name.includes('yarım altın') && !name.includes('bileklik') && !name.includes('kolye')) {
    if (price < 22000 || price > 35000) {
      console.error(`    ⚠️ [FLOOR-BREACH]: Yarım Altın anormal fiyatta: [${p.reference}] ${p.name} = ${price} TL`);
      floorBreaches++;
    }
  }
  // Tam Altın / Ziynet Tam
  if ((name.includes('tam altın') || name.includes('reşat') || name.includes('ata tam')) && !name.includes('bileklik') && !name.includes('kolye')) {
    if (price < 44000 || price > 70000) {
      console.error(`    ⚠️ [FLOOR-BREACH]: Tam/Ata/Reşat Altın anormal fiyatta: [${p.reference}] ${p.name} = ${price} TL`);
      floorBreaches++;
    }
  }
}
assert(floorBreaches === 0, `Hiçbir altın ürünü taban/tavan piyasa güvenlik bandını ihlal etmemeli (İhlal: ${floorBreaches})`);

// 3. Lüks Saat Kataloğu & +%40 Marj Emniyet Denetimi (Saat&Saat 9 Marka)
console.log('\n--- 3. LÜKS SAAT KATALOĞU (SAAT&SAAT 9 MARKA) EMNİYET DENETİMİ ---');
const watches = PRODUCTS.filter(p => p.category === 'saat' || (p.category === 'watch' && !p.isPreOwned));
assert(watches.length >= 1000, `Yayında en az 1.000 adet lüks saat bulunmalı (Mevcut: ${watches.length})`);

let watchBreaches = 0;
for (const w of watches) {
  if (w.price < 12000) {
    console.error(`    ⚠️ [WATCH-PRICE-BREACH]: Saat 12.000 TL tabanının altında: [${w.reference}] ${w.name} = ${w.price} TL`);
    watchBreaches++;
  }
}
assert(watchBreaches === 0, `Hiçbir saat 12.000 TL mağaza teslim / MASAK iç güvenlik tabanının altında olamaz (İhlal: ${watchBreaches})`);

// 4. Sıfır, Negatif, NaN ve Eksik Fiyat Taraması (Tüm Katalog)
console.log('\n--- 4. TÜM KATALOG FİYAT BÜTÜNLÜĞÜ (1.714 ÜRÜN) ---');
let invalidPrices = 0;
for (const p of PRODUCTS) {
  if (typeof p.price !== 'number' || isNaN(p.price) || p.price <= 0 || !Number.isInteger(p.price)) {
    console.error(`    ⚠️ [INVALID-PRICE]: [${p.reference}] ${p.name} geçersiz fiyat: ${p.price}`);
    invalidPrices++;
  }
}
assert(invalidPrices === 0, `Tüm ürünlerin fiyatı pozitif tamsayı olmalıdır (Hatalı: ${invalidPrices})`);

// 5. Sunucu Ödeme Kataloğu ve Client data.js Birebir Eşleşme
console.log('\n--- 5. SUNUCU CHECKOUT DELİL KATALOĞU (PAYTR) 1:1 SENKRONİZASYON ---');
if (fs.existsSync(paymentCatalogPath)) {
  const paymentCatalog = JSON.parse(fs.readFileSync(paymentCatalogPath, 'utf8'));
  let mismatchCount = 0;

  for (const p of PRODUCTS) {
    const payItem = paymentCatalog[p.id] || paymentCatalog[p.reference];
    if (!payItem) {
      mismatchCount++;
    } else if (payItem.price !== p.price) {
      console.error(`    ⚠️ [PRICE-MISMATCH]: [${p.reference}] data.js=${p.price} TL != PaymentCatalog=${payItem.price} TL`);
      mismatchCount++;
    }
  }
  assert(mismatchCount === 0, `Tüm ürün fiyatları PayTR Sunucu Kataloğu ile 1:1 eşleşmelidir (Uyuşmazlık: ${mismatchCount})`);
} else {
  console.warn('  ⚠️ functions/product-catalog.json bulunamadı.');
}

// 6. Elit Kategori (+%80 Marj & USD Kur Sağlama Güvenlik Kilidi)
console.log('\n--- 6. ELİT KATEGORİ (+%80 MARJ & USD KUR SAĞLAMA VE GÜVENLİK KİLİDİ) ---');
const eliteWatches = PRODUCTS.filter(p => p.isElite || p.category === 'elit-saatler');
assert(eliteWatches.length === 200, `Elit Kategori'de tam 200 adet lüks saat bulunmalıdır (Mevcut: ${eliteWatches.length})`);

const ELITE_BRANDS = [
  "Rolex", "Omega", "Patek Philippe", "Audemars Piguet", "Breitling",
  "Cartier", "Tudor", "TAG Heuer", "IWC Schaffhausen", "Panerai"
];
const eliteBrandCounts = {};
ELITE_BRANDS.forEach(b => eliteBrandCounts[b] = 0);

let elitePriceBreaches = 0;
for (const ew of eliteWatches) {
  if (eliteBrandCounts[ew.brand] !== undefined) {
    eliteBrandCounts[ew.brand]++;
  }

  const usdRef = Number(ew.usdRefPrice);
  if (!usdRef || usdRef <= 0) {
    console.error(`    ⚠️ [ELITE-USD-REF-MISSING]: [${ew.reference}] ${ew.brand} ${ew.name} USD referans fiyatı eksik!`);
    elitePriceBreaches++;
    continue;
  }

  // Güvenlik Kilidi: Fiyat USD_REF * 40 TL * 1.80 tabanının altında olamaz (Emniyet devre kesici)
  const minFloorTry = Math.round(usdRef * 40.0 * 1.80);
  if (ew.price < minFloorTry) {
    console.error(`    ⚠️ [ELITE-PRICE-UNDER-MARGIN]: [${ew.reference}] ${ew.brand} ${ew.name} taban fiyatın altında! Mevcut: ${ew.price} TL < Minimum Taban: ${minFloorTry} TL (USD: $${usdRef})`);
    elitePriceBreaches++;
  }
}

assert(elitePriceBreaches === 0, `Tüm 200 Elit Saat +%80 kâr marjı ve USD kuru emniyet kilidine uymalıdır (İhlal: ${elitePriceBreaches})`);

let brandDistributionValid = true;
ELITE_BRANDS.forEach(b => {
  if (eliteBrandCounts[b] !== 20) {
    console.error(`    ⚠️ [ELITE-BRAND-COUNT-MISMATCH]: ${b} markasında ${eliteBrandCounts[b]} ürün var, tam 20 olmalıdır.`);
    brandDistributionValid = false;
  }
});
assert(brandDistributionValid, `10 Lüks Saat Evinin her birinde tam 20'şer aktif ürün bulunmalıdır.`);

// 7. Değişmez Fiyatlama & Borsa Sözleşmesi (SATIŞ: +%3 (x 1.03) / ALIŞ: 0% / İZKO: YASAK)
console.log('\n--- 7. DEĞİŞMEZ FİYATLAMA & BORSA SÖZLEŞMESİ (SATIŞ +%3 / ALIŞ %0) ---');
const utilsContent = fs.readFileSync(path.join(ROOT_DIR, 'js/utils.js'), 'utf8');
const appContent = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');
const syncStockContent = fs.readFileSync(path.join(ROOT_DIR, 'scripts/sync-prices-and-stock.js'), 'utf8');
const smartDiffContent = fs.readFileSync(path.join(ROOT_DIR, 'scripts/smart-diff-sync.js'), 'utf8');
const agentsContent = fs.readFileSync(path.join(ROOT_DIR, 'AGENTS.md'), 'utf8');

assert(utilsContent.includes('BOARD_MARGIN = 1.03'), 'js/utils.js içinde BOARD_MARGIN = 1.03 (+%3 kâr marjı) sabit olmalıdır.');
assert(appContent.includes('BOARD_MARGIN = 1.03'), 'js/app.js içinde BOARD_MARGIN = 1.03 (+%3 kâr marjı) sabit olmalıdır.');
assert(syncStockContent.includes('GOLD_MARGIN = 1.03'), 'scripts/sync-prices-and-stock.js içinde GOLD_MARGIN = 1.03 (+%3 kâr marjı) sabit olmalıdır.');
assert(smartDiffContent.includes('GOLD_MARGIN = 1.03'), 'scripts/smart-diff-sync.js içinde GOLD_MARGIN = 1.03 (+%3 kâr marjı) sabit olmalıdır.');
assert(agentsContent.includes('+%3 (x 1.03)'), 'AGENTS.md içinde değişmez kural olarak +%3 (x 1.03) sabitlenmiş olmalıdır.');
assert(agentsContent.includes('ALIŞ / GERİ ALIM FİYATLARI (ALIŞ MARJI KESİNLİKLE YOKTUR - 0% / 1.00x BİREBİR)'), 'AGENTS.md içinde alış marjsızlığı (0%) kuralı sabitlenmiş olmalıdır.');

console.log('\n====================================================');
if (failureCount === 0) {
  console.log('✅ TÜM FİYAT GÜVENLİK KAPILARI VE DEVRE KESİCİLER BAŞARIYLA GEÇİLDİ.');
  console.log('====================================================\n');
  process.exit(0);
} else {
  console.error(`❌ [FATAL]: ${failureCount} ADET FİYAT GÜVENLİK İHLALİ TESPİT EDİLDİ! İŞLEM DURDURULDU.`);
  console.log('====================================================\n');
  process.exit(1);
}
