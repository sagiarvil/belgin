// BELGIN KUYUMCULUK — İZKO RESMİ KUR SAĞLAMA & OTOMATİK +%5 FİYAT GÜVENCE MOTORU v2.0
// Kaynak: https://www.izko.org.tr/guncel-kur (İzmir Kuyumcular Odası Resmi Kurları)
// Kural: Ürünler asla kaldırılmaz; İZKO resmi kurunun üzerine her zaman en az +%5 eklenerek güvenceli fiyattan yayında tutulur.

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const dataJsPath = path.join(ROOT_DIR, 'js/data.js');

function fetchIzkoRates() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://www.izko.org.tr/api/web/v1/gold-prices', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json'
      },
      timeout: 10000
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (json && json.success && Array.isArray(json.data)) {
            const rates = {};
            json.data.forEach(item => {
              rates[item.key] = item.sell_price;
            });
            rates.has_altin_price = json.has_altin_price || rates.hasaltin || 7104.88;
            resolve(rates);
          } else {
            reject(new Error('İZKO API formatı geçersiz'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('İZKO API zaman aşımı (timeout)'));
    });
  });
}

function getIzkoReferenceBase(product, izkoRates) {
  const name = (product.name || '').toLowerCase();
  const hasGram = izkoRates.has_altin_price || 7104.88;

  // 1. Külçe Altın (Gram Bazlı)
  if (name.includes('külçe') && !name.includes('bilezik')) {
    if (name.includes('1 kg') || name.includes('1 kilogram')) return hasGram * 1000;
    if (name.includes('100 gr')) return hasGram * 100;
    if (name.includes('50 gr')) return hasGram * 50;
    if (name.includes('20 gr')) return hasGram * 20;
    if (name.includes('10 gr')) return hasGram * 10;
    if (name.includes('2,5 gr') || name.includes('2.5 gr')) return hasGram * 2.5;
    if (name.includes('5 gr')) return hasGram * 5;
    if (name.includes('1 gr')) return izkoRates.paketlihas || hasGram;
  }

  // 2. Çeyrek Altın
  if (name.includes('çeyrek altın')) {
    return name.includes('eski') ? (izkoRates.eskiceyrek || 11560) : (izkoRates.yeniceyrek || 11730);
  }

  // 3. Yarım Altın
  if (name.includes('yarım altın') && !name.includes('bileklik') && !name.includes('kolye')) {
    return name.includes('eski') ? (izkoRates.eskiyarim || 23050) : (izkoRates.yeniyarim || 23490);
  }

  // 4. Tam Altın / Ziynet / Reşat
  if ((name.includes('tam altın') || name.includes('reşat')) && !name.includes('bileklik') && !name.includes('kolye')) {
    return name.includes('eski') ? (izkoRates.eskitam || 45900) : (izkoRates.yenitam || 46680);
  }

  // 5. Ata Altın
  if (name.includes('ata') && !name.includes('bilezik')) {
    return izkoRates.ata || 47300;
  }

  // 6. 22 Ayar Bilezikler (Gramajına göre İZKO 22 Ayar Resmi Satış Fiyatı)
  if (name.includes('22 ayar') && name.includes('bilezik')) {
    const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
    const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
    const izko22k = izkoRates.yirmiiki || (hasGram * 0.925);
    return gram * izko22k;
  }

  // 7. 14 Ayar Bilezikler (Gramajına göre İZKO 14 Ayar Resmi Satış Fiyatı)
  if (name.includes('14 ayar') && name.includes('bilezik')) {
    const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
    const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
    const izko14k = izkoRates.ondort || (hasGram * 0.835);
    return gram * izko14k;
  }

  return null;
}

async function verifyAndProtectWithIzko() {
  console.log('====================================================');
  console.log('🏛️  İZKO RESMİ KUR SAĞLAMA & OTOMATİK +%5 FİYAT GÜVENCESİ');
  console.log('====================================================');
  
  let izkoRates;
  try {
    izkoRates = await fetchIzkoRates();
    console.log(`✓ İZKO Resmi Kurlar Başarıyla Okundu (https://www.izko.org.tr/guncel-kur):`);
    console.log(`   • 24K Has Altın: ₺${izkoRates.has_altin_price.toLocaleString('tr-TR')}`);
    console.log(`   • 1 gr Paketli Has: ₺${(izkoRates.paketlihas || 0).toLocaleString('tr-TR')}`);
    console.log(`   • Yeni Çeyrek: ₺${(izkoRates.yeniceyrek || 0).toLocaleString('tr-TR')} (Sağlama +%5 Hedef: ₺${Math.round(izkoRates.yeniceyrek * 1.05).toLocaleString('tr-TR')})`);
    console.log(`   • Yeni Yarım: ₺${(izkoRates.yeniyarim || 0).toLocaleString('tr-TR')} (Sağlama +%5 Hedef: ₺${Math.round(izkoRates.yeniyarim * 1.05).toLocaleString('tr-TR')})`);
    console.log(`   • Yeni Tam: ₺${(izkoRates.yenitam || 0).toLocaleString('tr-TR')} (Sağlama +%5 Hedef: ₺${Math.round(izkoRates.yenitam * 1.05).toLocaleString('tr-TR')})`);
    console.log(`   • Ata Altın: ₺${(izkoRates.ata || 0).toLocaleString('tr-TR')} (Sağlama +%5 Hedef: ₺${Math.round(izkoRates.ata * 1.05).toLocaleString('tr-TR')})`);
  } catch (err) {
    console.warn(`⚠️ İZKO API bağlantı uyarısı: ${err.message}. Yerel güvenlik eşikleri devrede.`);
    izkoRates = {
      has_altin_price: 7104.88,
      paketlihas: 7219,
      yeniceyrek: 11730,
      eskiceyrek: 11560,
      yeniyarim: 23490,
      eskiyarim: 23050,
      yenitam: 46680,
      eskitam: 45900,
      ata: 47300,
      yirmiiki: 6680,
      ondort: 5940
    };
  }

  const currentDataRaw = fs.readFileSync(dataJsPath, 'utf8');
  const { PRODUCTS } = require(dataJsPath);

  let adjustedCount = 0;
  let inStockCount = 0;

  for (const p of PRODUCTS) {
    if (!p.isGold && p.category !== 'gold' && !p.subCategory?.includes('Ziynet') && !p.subCategory?.includes('Külçe') && !p.subCategory?.includes('Bilezik')) {
      continue;
    }

    const izkoRefBase = getIzkoReferenceBase(p, izkoRates);
    if (izkoRefBase) {
      const minSafePrice = Math.round(izkoRefBase * 1.05); // İZKO + %5 Marjı

      if (p.price < minSafePrice) {
        console.log(`  -> 🛡️ [İZKO +%5 GÜVENCE FİYATI UYGULANDI]: [${p.reference}] ${p.name}`);
        console.log(`     Eski Fiyat: ₺${p.price.toLocaleString('tr-TR')} => Yeni Güvenli Fiyat: ₺${minSafePrice.toLocaleString('tr-TR')}`);
        p.price = minSafePrice;
        adjustedCount++;
      }
      // Ürün asla kaldırılmaz, her zaman satışta ve yayında tutulur
      p.inStock = true;
      p.statusBadge = 'Stokta';
      inStockCount++;
    }
  }

  console.log(`\n--- İZKO SAĞLAMA & YAYINLAMA SONUCU ---`);
  console.log(`  ✅ Güvenceli Fiyatla Satışta Olan Toplam Altın Ürün: ${inStockCount}`);
  console.log(`  📈 İZKO +%5 Kuralı ile Fiyatı Yukarı Güncellenen Ürün: ${adjustedCount}`);

  // js/data.js Header ve Footer'ını koruyarak serialize et
  const productsMatch = currentDataRaw.match(/const PRODUCTS = \[[\s\S]*?\n\];/);
  const headerPart = currentDataRaw.substring(0, productsMatch.index);
  const footerPart = currentDataRaw.substring(productsMatch.index + productsMatch[0].length);
  const updatedProductsBlock = `const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};`;
  fs.writeFileSync(dataJsPath, headerPart + updatedProductsBlock + footerPart, 'utf8');
  
  execSync('node scripts/generate-payment-catalog.js', { stdio: 'inherit' });
  execSync('node scripts/generate-seo-assets.js', { stdio: 'inherit' });
  console.log(`[İZKO-GUARD] Tüm ürünler İZKO +%5 güvencesiyle yayına alındı.`);

  console.log('====================================================\n');
  return { adjustedCount, inStockCount };
}

if (require.main === module) {
  verifyAndProtectWithIzko().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { verifyAndProtectWithIzko, fetchIzkoRates };
