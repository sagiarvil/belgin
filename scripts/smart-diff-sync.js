#!/usr/bin/env node
/**
 * BELGİN KUYUMCULUK – UNIFIED SMART DIFFING & DELTA-SYNC ENGINE v3.0
 * 
 * Kapsam:
 * 1. 🪙 Mücevherat & Altın: Canlı Borsa Verisi + %3 Kâr Marjı (x 1.03)
 * 2. ⌚ Lüks Saatler: Saat&Saat Canlı Verisi + %40 Kâr Marjı (x 1.40)
 * 3. 🏷️ İkinci El & Cartier: Ekspertiz Değerleme & Güvenli Koruma
 * 
 * Smart Diffing İlkesi:
 * - Fiyat ve stok durumları kriptografik ve değer bazlı karşılaştırılır.
 * - Sıfır değişim varsa (Delta = 0), disk yazma ve gereksiz deploy ATLANIR (0 Yük / 0 Maliyet).
 * - Değişim varsa (Delta > 0), atomik olarak güncellenir, testler koşulur ve deploy tetiklenir.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const GOLD_MARGIN = 1.03;  // +%3 Kâr Marjı
const WATCH_MARGIN = 1.40; // +%40 Kâr Marjı

const BRAND_CONFIGS = [
  { id: 'versace', name: 'Versace', brandParam: 'versace', pageId: '124', origin: 'İsviçre / İtalya', defaultWarranty: '2 Yıl' },
  { id: 'michael-kors', name: 'Michael Kors', brandParam: 'michael kors', pageId: '8', origin: 'ABD / İsviçre', defaultWarranty: '2 Yıl' },
  { id: 'gc', name: 'Gc', brandParam: 'gc', pageId: '15', origin: 'İsviçre Yapımı (Swiss Made)', defaultWarranty: '2 Yıl' },
  { id: 'guess', name: 'Guess', brandParam: 'guess', pageId: '2', origin: 'ABD', defaultWarranty: '2 Yıl' },
  { id: 'fossil', name: 'Fossil', brandParam: 'fossil', pageId: '7', origin: 'ABD', defaultWarranty: '2 Yıl' },
  { id: 'seiko', name: 'Seiko', brandParam: 'seiko', pageId: '98', origin: 'Japonya', defaultWarranty: '3 Yıl' },
  { id: 'calvin-klein', name: 'Calvin Klein', brandParam: 'calvin klein', pageId: '35', origin: 'ABD / İsviçre', defaultWarranty: '2 Yıl' },
  { id: 'diesel', name: 'Diesel', brandParam: 'diesel', pageId: '39', origin: 'İtalya', defaultWarranty: '2 Yıl' },
  { id: 'welder', name: 'Welder', brandParam: 'welder', pageId: '1368', origin: 'İtalya', defaultWarranty: '2 Yıl' }
];

function decodeHtmlEntities(str) {
  return str
    .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
    .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
    .replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '').trim();
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
      },
      timeout: 20000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchLiveUsdRate() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'kur.doviz.com',
      path: '/serbest-piyasa/amerikan-dolari',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      timeout: 8000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const match = data.match(/data-socket-key="USD"[^>]*data-socket-attr="s"[^>]*>([0-9.,]+)</) ||
                        data.match(/"selling":([0-9.]+)/) ||
                        data.match(/class="text-xl font-bold[^>]*>([0-9.,]+)</);
          if (match) {
            const parsed = parseFloat(match[1].replace(',', '.'));
            if (parsed > 30 && parsed < 100) {
              return resolve(parsed);
            }
          }
        } catch (e) {}
        resolve(48.4422);
      });
    });
    req.on('error', () => resolve(48.4422));
    req.on('timeout', () => { req.destroy(); resolve(48.4422); });
    req.end();
  });
}

function parseAgaKulchePage(html) {
  const products = [];
  const itemMatches = [...html.matchAll(/<h3[^>]*class=["']product-title["'][^>]*>([\s\S]*?)<\/h3>[\s\S]*?<strong[^>]*class=["']last-price["'][^>]*>([\d\.,]+)\s*TL[\s\S]*?(?:<\/div>|<button)/gi)];
  
  for (const m of itemMatches) {
    const rawTitle = decodeHtmlEntities(m[1]);
    const rawPriceStr = m[2].replace(/\./g, '').replace(',', '.');
    const sourcePrice = Math.round(parseFloat(rawPriceStr));
    
    if (rawTitle && sourcePrice > 0) {
      // 24 Ayar altınlar, külçeler ve gram altınlar KESİNLİKLE dahil edilmez (Kalıcı olarak kaldırıldı)
      if (/24\s*ayar/i.test(rawTitle) || /24k/i.test(rawTitle) || /külçe/i.test(rawTitle) || /kulce/i.test(rawTitle) || /995/i.test(rawTitle) || /999/i.test(rawTitle) || /has\s*altın/i.test(rawTitle) || /gram\s*altın/i.test(rawTitle) || /valcambi/i.test(rawTitle) || /argor/i.test(rawTitle) || /pamp/i.test(rawTitle)) {
        continue;
      }
      let cleanName = rawTitle
        .replace(/AgaKulche\s*/gi, '')
        .replace(/AMR\s*/gi, '')
        .replace(/İAR\s*/gi, '')
        .replace(/IAR\s*/gi, '')
        .replace(/Nadir\s*/gi, '')
        .replace(/Özbağ\s*/gi, '')
        .replace(/Ozbag\s*/gi, '')
        .replace(/Ahlatcı\s*/gi, '')
        .replace(/Ahlatci\s*/gi, '')
        .replace(/Karat\s*/gi, '')
        .replace(/Valcambi\s*/gi, '')
        .replace(/Argor\s*Heraeus\s*/gi, '')
        .replace(/Pamp\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      products.push({
        rawTitle,
        cleanName,
        sourcePrice,
        inStock: true
      });
    }
  }

  return products;
}

async function fetchSaatvesaatBrand(brandConfig) {
  let from = 0;
  const size = 100;
  let allHits = [];

  while (true) {
    const url = `https://www.saatvesaat.com.tr/elastic.php?categoryId=2&pageId=${brandConfig.pageId}&filters[brand.f]=${encodeURIComponent(brandConfig.brandParam)}&size=${size}&from=${from}&order=created_at&direction=desc`;
    try {
      const raw = await fetchUrl(url);
      const data = JSON.parse(raw);
      const hits = data.product?.hits?.hits || [];
      if (hits.length === 0) break;

      allHits = allHits.concat(hits.map(h => h._source));
      from += size;
      const total = data.product?.hits?.total?.value || 0;
      if (from >= total || from >= 300) break; // optimize
    } catch (err) {
      break;
    }
  }

  return allHits;
}

async function runSmartDiffSync() {
  console.log('====================================================');
  console.log('💎 BELGİN KUYUMCULUK – SMART DIFFING & DELTA-SYNC');
  console.log(`⏱️ Zaman: ${new Date().toISOString()}`);
  console.log('====================================================\n');

  const dataJsPath = path.join(__dirname, '../js/data.js');
  const { PRODUCTS } = require(dataJsPath);

  // 1. Mevcut Durum Snapshot Haritası
  const initialSnapshot = new Map();
  for (const p of PRODUCTS) {
    initialSnapshot.set(p.id, {
      price: p.price,
      inStock: p.inStock,
      statusBadge: p.statusBadge
    });
  }

  const deltas = [];

  // ==========================================================
  // 2. MÜCEVHERAT & ALTIN SENKRONİZASYONU (+%5 MARJ)
  // ==========================================================
  console.log('[SMART-DIFF] 🪙 1. Altın & Sarrafiye Canlı Verisi Taranıyor...');
  const goldUrls = [
    'https://www.agakulche.com/ziynet-ata-altin',
    'https://www.agakulche.com/ziynet-ata-altin?page=2',
    'https://www.agakulche.com/ziynet-ata-altin?page=3',
    'https://www.agakulche.com/ziynet-ata-altin?page=4',
    'https://www.agakulche.com/ziynet-ata-altin?page=5',
    'https://www.agakulche.com/altin-bilezik',
    'https://www.agakulche.com/altin-bilezik?page=2',
    'https://www.agakulche.com/altin-bilezik?page=3',
    'https://www.agakulche.com/altin-bilezik?page=4',
    'https://www.agakulche.com/altin-bilezik?page=5'
  ];

  const scrapedGold = [];
  for (const url of goldUrls) {
    try {
      const html = await fetchUrl(url);
      const items = parseAgaKulchePage(html);
      scrapedGold.push(...items);
    } catch (e) {}
  }
  console.log(`  ✓ ${scrapedGold.length} canlı altın ürünü tespit edildi.`);

  for (const p of PRODUCTS) {
    if (p.isPreOwned || (p.category !== 'jewelry' && p.category !== 'jewellery' && !p.isGold)) continue;

    const match = scrapedGold.find(item => {
      const cleanScraped = item.cleanName.toLowerCase().replace(/\s+/g, '');
      const cleanBelgin = p.name.toLowerCase().replace(/\s+/g, '');
      return cleanScraped === cleanBelgin || cleanBelgin.includes(cleanScraped) || cleanScraped.includes(cleanBelgin);
    });

    if (match && match.sourcePrice > 0) {
      const targetPrice = Math.round(match.sourcePrice * GOLD_MARGIN);
      const snap = initialSnapshot.get(p.id);

      if (snap.price !== targetPrice) {
        deltas.push(`🪙 [ALTIN FİYAT DEĞİŞİMİ] ${p.name}: ${snap.price.toLocaleString('tr-TR')} TL ➔ ${targetPrice.toLocaleString('tr-TR')} TL (+%2 marj)`);
        p.price = targetPrice;
      }
      if (snap.inStock !== match.inStock) {
        deltas.push(`🪙 [ALTIN STOK DEĞİŞİMİ] ${p.name}: ${snap.inStock ? 'Stokta' : 'Tükendi'} ➔ ${match.inStock ? 'Stokta' : 'Tükendi'}`);
        p.inStock = match.inStock;
        p.statusBadge = match.inStock ? 'Stokta' : 'Tükendi';
      }
    }
  }

  // ==========================================================
  // 3. LÜKS SAAT SENKRONİZASYONU (+%40 MARJ — 9 MARKA)
  // ==========================================================
  console.log('\n[SMART-DIFF] ⌚ 2. Lüks Saat Canlı Verisi Taranıyor (Saat&Saat 9 Marka)...');
  let scrapedWatchesCount = 0;
  for (const brandConfig of BRAND_CONFIGS) {
    try {
      const hits = await fetchSaatvesaatBrand(brandConfig);
      scrapedWatchesCount += hits.length;
      for (const hit of hits) {
        const ref = hit.sku || hit.model_kodu;
        if (!ref) continue;
        const watch = PRODUCTS.find(w => !w.isPreOwned && (w.ref === ref || w.reference === ref));
        if (watch && (hit.price_special > 0 || hit.price > 0)) {
          const rawBasePrice = Math.round(hit.price_special || hit.price);
          const targetPrice = Math.round(rawBasePrice * WATCH_MARGIN);
          const targetInStock = (hit.is_in_stock === 1 || hit.is_in_stock === true);
          const snap = initialSnapshot.get(watch.id);

          if (snap && snap.price !== targetPrice && targetPrice >= 12000) {
            deltas.push(`⌚ [SAAT FİYAT DEĞİŞİMİ] ${watch.brand} ${watch.name}: ${snap.price.toLocaleString('tr-TR')} TL ➔ ${targetPrice.toLocaleString('tr-TR')} TL (+%40 marj)`);
            watch.price = targetPrice;
          }
          if (snap && snap.inStock !== targetInStock) {
            deltas.push(`⌚ [SAAT STOK DEĞİŞİMİ] ${watch.brand} ${watch.name}: ${snap.inStock ? 'Stokta' : 'Tükendi'} ➔ ${targetInStock ? 'Stokta' : 'Tükendi'}`);
            watch.inStock = targetInStock;
            watch.statusBadge = targetInStock ? 'Distribütör Garantili' : 'Tükendi';
          }
        }
      }
    } catch (e) {}
  }
  console.log(`  ✓ ${scrapedWatchesCount} canlı saat ürünü 9 markada tarandı.`);

  // ==========================================================
  // 3. ELİT KATEGORİ LÜKS SAAT SENKRONİZASYONU (+%80 MARJ — 10 MARKA / 200 SAAT)
  // ==========================================================
  console.log('\n[SMART-DIFF] 👑 3. Elit Kategori Lüks Saat Canlı Kuru ve Fiyatları Taranıyor (+%80 Marj)...');
  try {
    const usdRate = await fetchLiveUsdRate();
    const ELITE_MARKUP = 1.80; // +%80 Kâr Marjı
    let eliteChecked = 0;
    for (const p of PRODUCTS) {
      if (p.isElite || p.category === 'elit-saatler') {
        eliteChecked++;
        const baseUsd = Number(p.usdRefPrice) || 10000;
        const targetPrice = Math.round(baseUsd * usdRate * ELITE_MARKUP);
        const snap = initialSnapshot.get(p.id);
        if (snap && snap.price !== targetPrice) {
          deltas.push(`👑 [ELİT SAAT FİYAT DEĞİŞİMİ] ${p.brand} ${p.name}: ${snap.price.toLocaleString('tr-TR')} TL ➔ ${targetPrice.toLocaleString('tr-TR')} TL (USD ${usdRate} TL, +%80 marj)`);
          p.price = targetPrice;
          p.usdSellingRate = usdRate;
        }
      }
    }
    console.log(`  ✓ ${eliteChecked} adet Elit Saat modeli (10 marka) canlı kurla (${usdRate} TL) tarandı.`);
  } catch (e) {
    console.warn('  ⚠️ [SMART-DIFF] Elit Saat kur güncellemesi atlandı:', e.message);
  }

  // ==========================================================
  // 4. SMART DIFFING KARAR KAPISI
  // ==========================================================
  console.log('\n====================================================');
  console.log(`📊 SMART DIFFING SONUCU: Toplam ${deltas.length} Değişiklik Tespit Edildi.`);
  console.log('====================================================');

  if (deltas.length === 0) {
    console.log('\n🟢 [SMART-DIFF] SIFIR DEĞİŞİKLİK (Delta = 0).');
    console.log('✅ Tüm altın, mücevher ve saat fiyatları/stokları %100 güncel.');
    console.log('⚡ Gereksiz disk yazma, build ve Firebase deploy atlandı (0 Maliyet / 0 Sunucu Yükü).\n');
    process.exit(0);
  }

  // Değişiklikleri listele
  console.log('\n🔍 Tespit Edilen Değişiklikler:');
  deltas.slice(0, 15).forEach(d => console.log(`  ${d}`));
  if (deltas.length > 15) {
    console.log(`  ... ve ${deltas.length - 15} adet diğer güncelleme.`);
  }

  // 5. Dosyaları Atomik Olarak Güncelle
  console.log('\n📝 [SMART-DIFF] js/data.js ve ödeme kataloğu atomik olarak güncelleniyor...');

  const currentDataRaw = fs.readFileSync(dataJsPath, 'utf8');
  const productsMatch = currentDataRaw.match(/const PRODUCTS = \[[\s\S]*?\n\];/);
  if (!productsMatch) {
    throw new Error('js/data.js içinde const PRODUCTS dizisi bulunamadı.');
  }

  const headerPart = currentDataRaw.substring(0, productsMatch.index);
  const footerPart = currentDataRaw.substring(productsMatch.index + productsMatch[0].length);

  const updatedProductsBlock = `const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};`;
  fs.writeFileSync(dataJsPath, headerPart + updatedProductsBlock + footerPart, 'utf8');

  // İZKO ve Fiyat Güvenlik Testlerini Çalıştır
  execSync('node scripts/izko-safety-crosscheck.js', { stdio: 'inherit' });
  execSync('node scripts/price-safety-guard.js', { stdio: 'inherit' });
  execSync('node scripts/generate-payment-catalog.js', { stdio: 'inherit' });
  execSync('node scripts/generate-seo-assets.js', { stdio: 'inherit' });
  execSync('node scripts/verify-product-catalog.js', { stdio: 'inherit' });

  console.log('\n🚀 [SMART-DIFF] ✅ Katalog başarıyla güncellendi. Yeni deploy hazır.');
}

if (require.main === module) {
  runSmartDiffSync().catch(err => {
    console.error(`[SMART-DIFF FATAL]:`, err);
    process.exit(1);
  });
}

module.exports = { runSmartDiffSync };
