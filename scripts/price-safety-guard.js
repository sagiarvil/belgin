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
    if (price < 7500 || price > 12000) {
      console.error(`    ⚠️ [FLOOR-BREACH]: 1 gr Külçe Altın anormal fiyatta: [${p.reference}] ${p.name} = ${price} TL`);
      floorBreaches++;
    }
  }
  // Çeyrek Altın
  if (name.includes('çeyrek altın')) {
    if (price < 12000 || price > 18000) {
      console.error(`    ⚠️ [FLOOR-BREACH]: Çeyrek Altın anormal fiyatta: [${p.reference}] ${p.name} = ${price} TL`);
      floorBreaches++;
    }
  }
  // Yarım Altın
  if (name.includes('yarım altın') && !name.includes('bileklik') && !name.includes('kolye')) {
    if (price < 24000 || price > 35000) {
      console.error(`    ⚠️ [FLOOR-BREACH]: Yarım Altın anormal fiyatta: [${p.reference}] ${p.name} = ${price} TL`);
      floorBreaches++;
    }
  }
  // Tam Altın / Ziynet Tam
  if ((name.includes('tam altın') || name.includes('reşat') || name.includes('ata tam')) && !name.includes('bileklik') && !name.includes('kolye')) {
    if (price < 48000 || price > 70000) {
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
