// BELGIN KUYUMCULUK — İZKO RESMİ KUR ÇAPRAZ SAĞLAMA & OTOMATİK KORUMA MOTORU v1.0
// Kaynak: https://www.izko.org.tr/guncel-kur (İzmir Kuyumcular Odası Resmi Kurları)
// Kural: Sitemizdeki hiçbir altın ürünü İZKO resmi kurunun %5 altından satılamaz (Price >= IZKO * 0.95).
// İhlal durumunda ürün otomatik olarak yayından kaldırılır (inStock: false / delist).

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
            rates.has_altin_price = json.has_altin_price || rates.hasaltin || 7100;
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

function getExpectedIzkoFloor(product, izkoRates) {
  const name = (product.name || '').toLowerCase();
  const hasGram = izkoRates.has_altin_price; // 24K Has Altın Gramı

  // 1. Külçe Altın (Gram Bazlı)
  if (name.includes('külçe') && !name.includes('bilezik')) {
    if (name.includes('1 kg') || name.includes('1 kilogram')) return hasGram * 1000 * 0.95;
    if (name.includes('100 gr')) return hasGram * 100 * 0.95;
    if (name.includes('50 gr')) return hasGram * 50 * 0.95;
    if (name.includes('20 gr')) return hasGram * 20 * 0.95;
    if (name.includes('10 gr')) return hasGram * 10 * 0.95;
    if (name.includes('2,5 gr') || name.includes('2.5 gr')) return hasGram * 2.5 * 0.95;
    if (name.includes('5 gr')) return hasGram * 5 * 0.95;
    if (name.includes('1 gr')) return (izkoRates.paketlihas || hasGram) * 0.95;
  }

  // 2. Çeyrek Altın
  if (name.includes('çeyrek altın')) {
    const izkoRef = name.includes('eski') ? izkoRates.eskiceyrek : izkoRates.yeniceyrek;
    return (izkoRef || 11500) * 0.95;
  }

  // 3. Yarım Altın
  if (name.includes('yarım altın') && !name.includes('bileklik') && !name.includes('kolye')) {
    const izkoRef = name.includes('eski') ? izkoRates.eskiyarim : izkoRates.yeniyarim;
    return (izkoRef || 23000) * 0.95;
  }

  // 4. Tam Altın / Ziynet
  if (name.includes('tam altın') && !name.includes('bileklik') && !name.includes('kolye')) {
    const izkoRef = name.includes('eski') ? izkoRates.eskitam : izkoRates.yenitam;
    return (izkoRef || 46000) * 0.95;
  }

  // 5. Ata Altın
  if (name.includes('ata') && !name.includes('bilezik')) {
    return (izkoRates.ata || 47000) * 0.95;
  }

  // 6. 22 Ayar Bilezikler (Gramajına göre İZKO 22 Ayar Hurda/Satış katsayısı)
  if (name.includes('22 ayar') && name.includes('bilezik')) {
    const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
    const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
    const izko22k = izkoRates.yirmiiki || (hasGram * 0.925);
    return (gram * izko22k) * 0.95;
  }

  // 7. 14 Ayar Bilezikler
  if (name.includes('14 ayar') && name.includes('bilezik')) {
    const gramMatch = name.match(/(\d+)\s*(?:gr|gram)/i);
    const gram = gramMatch ? parseFloat(gramMatch[1]) : 10;
    const izko14k = izkoRates.ondort || (hasGram * 0.835);
    return (gram * izko14k) * 0.95;
  }

  return null;
}

async function verifyAndProtectWithIzko() {
  console.log('====================================================');
  console.log('🏛️  İZKO RESMİ KUR ÇAPRAZ SAĞLAMA & GÜVENLİK MOTORU');
  console.log('====================================================');
  
  let izkoRates;
  try {
    izkoRates = await fetchIzkoRates();
    console.log(`✓ İZKO Resmi Kurlar Başarıyla Çekildi:`);
    console.log(`   • 24K Has Altın: ₺${izkoRates.has_altin_price.toLocaleString('tr-TR')}`);
    console.log(`   • 1 gr Paketli Has: ₺${(izkoRates.paketlihas || 0).toLocaleString('tr-TR')}`);
    console.log(`   • Yeni Çeyrek Altın: ₺${(izkoRates.yeniceyrek || 0).toLocaleString('tr-TR')}`);
    console.log(`   • Yeni Yarım Altın: ₺${(izkoRates.yeniyarim || 0).toLocaleString('tr-TR')}`);
    console.log(`   • Yeni Tam Altın: ₺${(izkoRates.yenitam || 0).toLocaleString('tr-TR')}`);
    console.log(`   • Ata Altın: ₺${(izkoRates.ata || 0).toLocaleString('tr-TR')}`);
    console.log(`   • 22 Ayar Gram: ₺${(izkoRates.yirmiiki || 0).toLocaleString('tr-TR')}`);
  } catch (err) {
    console.warn(`⚠️ İZKO API bağlantı uyarısı: ${err.message}. Yerel güvenlik eşikleri devrede.`);
    izkoRates = {
      has_altin_price: 7100,
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

  let delistedCount = 0;
  let verifiedCount = 0;

  for (const p of PRODUCTS) {
    if (!p.isGold && p.category !== 'gold' && !p.subCategory?.includes('Ziynet') && !p.subCategory?.includes('Külçe') && !p.subCategory?.includes('Bilezik')) {
      continue;
    }

    const minFloorAllowed = getExpectedIzkoFloor(p, izkoRates);
    if (minFloorAllowed && p.price < minFloorAllowed) {
      console.error(`🚨 [İZKO GÜVENLİK İHLALİ]: [${p.reference}] ${p.name}`);
      console.error(`   -> Sitemizdeki Fiyat: ₺${p.price.toLocaleString('tr-TR')} | İZKO Taban (%5 Altı Eşiği): ₺${Math.round(minFloorAllowed).toLocaleString('tr-TR')}`);
      console.error(`   -> AKSİYON: ÜRÜN ANINDA YAYINDAN KALDIRILDI (STOK DIŞI YAPILDI).`);
      
      p.inStock = false;
      p.statusBadge = 'Tükendi';
      delistedCount++;
    } else {
      verifiedCount++;
    }
  }

  console.log(`\n--- İZKO ÇAPRAZ SAĞLAMA SONUCU ---`);
  console.log(`  ✅ Başarıyla Doğrulanan ve Güvenli Fiyatta Olan Ürün: ${verifiedCount}`);
  console.log(`  🛡️ İZKO Kuralı Nedeniyle Kaldırılan/Engellenen Ürün: ${delistedCount}`);

  if (delistedCount > 0) {
    const productsMatch = currentDataRaw.match(/const PRODUCTS = \[[\s\S]*?\n\];/);
    const headerPart = currentDataRaw.substring(0, productsMatch.index);
    const footerPart = currentDataRaw.substring(productsMatch.index + productsMatch[0].length);
    const updatedProductsBlock = `const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};`;
    fs.writeFileSync(dataJsPath, headerPart + updatedProductsBlock + footerPart, 'utf8');
    
    execSync('node scripts/generate-payment-catalog.js', { stdio: 'inherit' });
    execSync('node scripts/generate-seo-assets.js', { stdio: 'inherit' });
    console.log(`[İZKO-GUARD] Riskli ürünler katalogdan ve ödeme motorundan düşürüldü.`);
  }

  console.log('====================================================\n');
  return { delistedCount, verifiedCount };
}

if (require.main === module) {
  verifyAndProtectWithIzko().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { verifyAndProtectWithIzko, fetchIzkoRates };
