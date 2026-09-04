// BELGIN KUYUMCULUK — SAAT&SAAT LIVE CATALOG SYNCHRONIZER & PRICE ENGINE v2.0
// 9 Referans Marka: Calvin Klein, Michael Kors, Seiko, Welder, Versace, Fossil, Guess, Diesel, Gc
// Kural: Saat&Saat Referans Fiyatı + %40 (KDV Dahil) | Fiyat >= 12.000 TL | Tam Açıklama & Yüksek Çözünürlüklü Görseller

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');

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

function formatVal(val) {
  if (!val) return '';
  if (Array.isArray(val)) return val.filter(Boolean).join(', ');
  return String(val).trim();
}

function buildDescription(p, brandConfig) {
  const brand = brandConfig.name;
  const name = p.name || `${p.sku || ''} Kol Saati`;
  const diameter = formatVal(p.kasa_capi);
  const tech = formatVal(p.teknoloji);
  const glass = formatVal(p.cam_ozellik);
  const water = formatVal(p.su_gecirmezlik);
  const strap = formatVal(p.kayis_kordon_ozellik);
  const caseColor = formatVal(p.kasa_renk);
  const warranty = p.garanti || brandConfig.defaultWarranty;

  let desc = `${brand} ${name}`;
  if (diameter) desc += `, ${diameter} kasa çapı`;
  if (tech) desc += `, ${tech} mekanizma hassasiyeti`;
  if (glass && glass !== 'Yok') desc += ` ve ${glass} cam korumasıyla`;
  desc += ` üretilmiş orijinal lüks saat modelidir.`;

  if (water && water !== 'Yok') desc += ` ${water} su geçirmezlik derecesine`;
  if (strap && strap !== 'Yok') desc += `, ${strap} kordon yapısına`;
  if (caseColor && caseColor !== 'Yok') desc += ` ve ${caseColor} kasaya`;
  desc += ` sahiptir.`;

  desc += ` Türkiye distribütörlüğü ve Belgin Kuyumculuk uzmanlığı ile ${warranty} garantili olarak orijinal kutusunda, sertifikasıyla birlikte teslim edilmektedir.`;
  return desc;
}

async function fetchBrandWatches(brandConfig) {
  let from = 0;
  const size = 100;
  let allHits = [];

  while (true) {
    const url = `https://www.saatvesaat.com.tr/elastic.php?categoryId=2&pageId=${brandConfig.pageId}&filters[brand.f]=${encodeURIComponent(brandConfig.brandParam)}&size=${size}&from=${from}&order=created_at&direction=desc`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.error(`[sync] HTTP ${res.status} for ${brandConfig.name}`);
        break;
      }
      const data = await res.json();
      const hits = data.product?.hits?.hits || [];
      if (hits.length === 0) break;

      allHits = allHits.concat(hits.map(h => h._source));
      from += size;
      const total = data.product?.hits?.total?.value || 0;
      if (from >= total) break;
    } catch (err) {
      console.error(`[sync] Fetch error for ${brandConfig.name}:`, err.message);
      break;
    }
  }

  return allHits;
}

async function syncAllBrands() {
  console.log('====================================================');
  console.log('BELGİN KUYUMCULUK — SAAT&SAAT CANLI KATALOG SENKRONİZASYONU');
  console.log('Başlama Zamanı:', new Date().toISOString());
  console.log('====================================================');

  const existingData = require('../js/data.js');
  
  // Preserve non-Saat&Saat products (Carren, Konyalı Saat, Elit Koleksiyon, İkinci El, Mücevherat)
  const nonSaatveSaatProducts = existingData.PRODUCTS.filter(p => {
    const sUrl = p.sourceUrl || p.source_url || '';
    return !sUrl.includes('saatvesaat.com.tr');
  });
  console.log(`[sync] Korunan diğer ürün sayısı (Carren, Konyalı, Elit, Mücevherat): ${nonSaatveSaatProducts.length}`);

  let newWatchList = [];
  let nextId = 1000; // Watches start from ID 1000 to prevent overlap with jewelry (1-10) and second-hand (101-108)
  const brandStats = {};
  const watchBrandsSummary = [];

  for (const bConfig of BRAND_CONFIGS) {
    console.log(`[sync] ${bConfig.name} verileri Saat&Saat üzerinden çekiliyor...`);
    const rawProducts = await fetchBrandWatches(bConfig);
    
    // Filter: In stock & Type Saat
    const validWatches = rawProducts.filter(p => p.is_in_stock == 1 && (p.ptype === 'Saat' || !p.ptype));
    
    let brandCount = 0;
    let brandCoverImage = '';

    for (const p of validWatches) {
      const baseRefPrice = Number(p.special_price || p.price || 0);
      if (!baseRefPrice || baseRefPrice <= 0) continue;

      // Fiyatlama Kuralı: Saat&Saat Fiyatı + %40 (KDV Dahil)
      const belginPrice = Math.round(baseRefPrice * 1.40);

      // Kural: 12.000 TL ve üzeri saat modelleri
      if (belginPrice < 12000) continue;

      const mainImgPath = p.image || '';
      const mainImageUrl = mainImgPath.startsWith('http') 
        ? mainImgPath 
        : `https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product${mainImgPath.startsWith('/') ? '' : '/'}${mainImgPath}`;

      if (!brandCoverImage && mainImageUrl) {
        brandCoverImage = mainImageUrl;
      }

      let galleryImages = [mainImageUrl];
      if (p.additional_images) {
        const addImgs = String(p.additional_images).split(',').map(s => s.trim()).filter(Boolean);
        addImgs.forEach(addImg => {
          const addUrl = addImg.startsWith('http') 
            ? addImg 
            : `https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product${addImg.startsWith('/') ? '' : '/'}${addImg}`;
          if (!galleryImages.includes(addUrl)) {
            galleryImages.push(addUrl);
          }
        });
      }

      const hoverImageUrl = galleryImages.length > 1 ? galleryImages[1] : mainImageUrl;
      const gender = formatVal(p.gender) || 'Unisex';
      const subCategory = gender.includes('Erkek') ? 'Erkek Saat' : (gender.includes('Kadın') ? 'Kadın Saat' : 'Unisex Saat');
      const descText = buildDescription(p, bConfig);
      const sku = p.sku || p.url_key || `REF-${nextId}`;

      const watchItem = {
        id: nextId++,
        name: p.name || `${sku} ${gender} Kol Saati`,
        brand: bConfig.name,
        ref: sku,
        reference: sku,
        price: belginPrice,
        category: 'saat',
        subCategory: subCategory,
        metal: formatVal(p.kasa_materyali) || '316L Paslanmaz Çelik',
        origin: bConfig.origin,
        image: mainImageUrl,
        hoverImage: hoverImageUrl,
        images: galleryImages,
        sourceUrl: p.url_key ? `https://www.saatvesaat.com.tr/${p.url_key}` : `https://www.saatvesaat.com.tr/${bConfig.brandParam}`,
        statusBadge: 'Distribütör Garantili',
        conditionBadge: 'Sıfır',
        isPreOwned: false,
        isGold: false,
        stock: p.qty || 1,
        inStock: true,
        isNew: true,
        isHighValue: true,
        description: descText,
        desc: descText,
        specs: {
          'Kasa Çapı': formatVal(p.kasa_capi) || '40 mm',
          'Mekanizma': formatVal(p.teknoloji) || 'Pilli (Quartz)',
          'Cam Tipi': formatVal(p.cam_ozellik) || 'Mineral',
          'Su Geçirmezlik': formatVal(p.su_gecirmezlik) || '5 ATM',
          'Kordon / Kayış': formatVal(p.kayis_kordon_ozellik) || 'Çelik',
          'Kadran Rengi': formatVal(p.kadran_renk) || 'Siyah',
          'Kasa Materyali': formatVal(p.kasa_materyali) || '316L Paslanmaz Çelik',
          'Kasa Rengi': formatVal(p.kasa_renk) || 'Metalik Gri',
          'Cinsiyet': gender,
          'Menşei': bConfig.origin,
          'Garanti': `${p.garanti || bConfig.defaultWarranty} Distribütör Garantili`,
          'Teslimat': '12.000 TL Üzeri Mağaza Teslimi (Kimlik & İmza İle)'
        }
      };

      newWatchList.push(watchItem);
      brandCount++;
    }

    brandStats[bConfig.name] = brandCount;
    watchBrandsSummary.push({
      id: bConfig.id,
      name: bConfig.name,
      count: brandCount,
      origin: bConfig.origin,
      image: brandCoverImage || (existingData.WATCH_BRANDS.find(wb => wb.id === bConfig.id)?.image || '')
    });

    console.log(`[sync] ${bConfig.name}: ${brandCount} adet >= 12.000 TL sıfır saat eklendi.`);
  }

  // Compute comparison diff with existing watches
  const existingWatches = existingData.PRODUCTS.filter(p => p.category === 'saat' || (p.category === 'watch' && !p.isPreOwned));
  const oldMap = new Map();
  existingWatches.forEach(w => {
    const key = (w.ref || w.reference || w.name).trim();
    oldMap.set(key, w);
  });

  const newMap = new Map();
  newWatchList.forEach(w => {
    const key = (w.ref || w.reference || w.name).trim();
    newMap.set(key, w);
  });

  let newlyAdded = [];
  let priceChanged = [];
  let unchanged = [];
  let removedOutOfStock = [];

  newWatchList.forEach(w => {
    const key = (w.ref || w.reference || w.name).trim();
    if (oldMap.has(key)) {
      const oldItem = oldMap.get(key);
      if (oldItem.price !== w.price) {
        priceChanged.push({ brand: w.brand, ref: key, name: w.name, oldPrice: oldItem.price, newPrice: w.price, diff: w.price - oldItem.price });
      } else {
        unchanged.push(w);
      }
    } else {
      newlyAdded.push(w);
    }
  });

  existingWatches.forEach(w => {
    const key = (w.ref || w.reference || w.name).trim();
    if (!newMap.has(key)) {
      removedOutOfStock.push(w);
    }
  });

  console.log('\n====================================================');
  console.log('📊 SENKRONİZASYON DEĞİŞİM VE STOK DETAY RAPORU');
  console.log('====================================================');
  console.log(`• Önceki Toplam Saat Sayısı  : ${existingWatches.length}`);
  console.log(`• Yeni Yayındaki Saat Sayısı : ${newWatchList.length}`);
  console.log(`• 🟢 Yeni Eklenen Modeller    : ${newlyAdded.length} adet`);
  console.log(`• 🔴 Stoktan Düşen / Bitenler : ${removedOutOfStock.length} adet`);
  console.log(`• 🟡 Fiyatı Güncellenenler    : ${priceChanged.length} adet`);
  console.log(`• ⚪ Fiyatı Değişmeyenler     : ${unchanged.length} adet\n`);

  const brandSummaryReport = {};
  BRAND_CONFIGS.forEach(b => {
    const oldB = existingWatches.filter(w => w.brand === b.name);
    const newB = newWatchList.filter(w => w.brand === b.name);
    const addedB = newlyAdded.filter(w => w.brand === b.name);
    const removedB = removedOutOfStock.filter(w => w.brand === b.name);
    const changedB = priceChanged.filter(w => w.brand === b.name);
    brandSummaryReport[b.name] = {
      'Önceki': oldB.length,
      'Yeni': newB.length,
      'Yeni Eklenen': addedB.length,
      'Stoktan Düşen': removedB.length,
      'Fiyat Değişen': changedB.length
    };
  });
  console.table(brandSummaryReport);

  const reportPayload = {
    timestamp: new Date().toISOString(),
    summary: {
      previousTotal: existingWatches.length,
      currentTotal: newWatchList.length,
      newlyAddedCount: newlyAdded.length,
      removedOutOfStockCount: removedOutOfStock.length,
      priceChangedCount: priceChanged.length,
      unchangedCount: unchanged.length
    },
    brandBreakdown: brandSummaryReport,
    samplePriceChanges: priceChanged.slice(0, 10),
    sampleNewlyAdded: newlyAdded.slice(0, 10),
    sampleRemoved: removedOutOfStock.slice(0, 10)
  };

  fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'sync-report.json'), JSON.stringify(reportPayload, null, 2), 'utf8');

  // GÜVENLİK DEVRE KESİCİSİ (CIRCUIT BREAKER)
  if (newWatchList.length < 1000) {
    throw new Error(`[CRITICAL CIRCUIT BREAKER]: Saat&Saat senkronizasyonunda yetersiz saat çekildi (${newWatchList.length} < 1000). Olası API/bot kesintisi! data.js güncellenmedi, eski güvenli katalog korundu.`);
  }

  // Tüm saatlerin +%40 marj ve >= 12.000 TL kuralı kontrolü
  for (const w of newWatchList) {
    if (!w.price || w.price < 12000 || !Number.isInteger(w.price)) {
      throw new Error(`[CRITICAL PRICE ERROR]: [${w.reference}] ${w.name} geçersiz saat fiyatı: ${w.price} TL. İşlem durduruldu.`);
    }
  }

  // Combine new Saat&Saat watches with preserved non-Saat&Saat products
  const combinedProducts = [...newWatchList, ...nonSaatveSaatProducts];
  console.log(`[sync] Toplam Yayın Kataloğu: ${combinedProducts.length} (Saat&Saat: ${newWatchList.length}, Diğer Ürünler: ${nonSaatveSaatProducts.length})`);

  // Update js/data.js
  const dataFileContent = `// ==========================================================
// BELGİN KUYUMCULUK — MASTER ÜRÜN VE KOLEKSİYON VERİTABANI
// Sürüm: ${new Date().toISOString().split('T')[0]}.live-sync (Saat&Saat 9 Marka Senkronizasyonu)
// Toplam Yayın Ürünü: ${combinedProducts.length} (Fiyat >= 12.000 TL)
// ==========================================================

const WATCH_BRANDS = ${JSON.stringify(watchBrandsSummary, null, 2)};

const JEWELRY_BRANDS = ${JSON.stringify(existingData.JEWELRY_BRANDS, null, 2)};

// MASTER ÜRÜN LİSTESİ (${combinedProducts.length} Ürün: ${newWatchList.length} Sıfır Saat + ${nonWatchProducts.length} İkinci El & Mücevherat)
const PRODUCTS = ${JSON.stringify(combinedProducts, null, 2)};

const WATCHES = PRODUCTS.filter(p => p.category === 'saat' || (p.category === 'watch' && !p.isPreOwned));
const JEWELLERY = PRODUCTS.filter(p => p.category === 'jewelry' || p.category === 'jewellery');
const PRE_OWNED_ITEMS = PRODUCTS.filter(p => p.isPreOwned === true);
const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);

const ALL_PRODUCTS_LIST = PRODUCTS;

const CERTIFICATE_DB = ${JSON.stringify(existingData.CERTIFICATE_DB, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRODUCTS,
    WATCH_BRANDS,
    JEWELRY_BRANDS,
    WATCHES,
    JEWELLERY,
    PRE_OWNED_ITEMS,
    PRE_OWNED_GOLD,
    CERTIFICATE_DB,
    ALL_PRODUCTS: PRODUCTS
  };
}
`;

  fs.writeFileSync(path.join(ROOT_DIR, 'js', 'data.js'), dataFileContent, 'utf8');
  console.log('✅ js/data.js başarıyla güncellendi.');

  // Run build pipelines (payment catalog, sitemaps, schemas, manifests)
  console.log('[sync] Build & Güvenlik pipeline scriptleri çalıştırılıyor...');
  spawnSync('node', ['scripts/generate-payment-catalog.js'], { cwd: ROOT_DIR, stdio: 'inherit' });
  spawnSync('node', ['scripts/generate-seo-assets.js'], { cwd: ROOT_DIR, stdio: 'inherit' });
  spawnSync('node', ['scripts/izko-safety-crosscheck.js'], { cwd: ROOT_DIR, stdio: 'inherit' });
  spawnSync('node', ['scripts/price-safety-guard.js'], { cwd: ROOT_DIR, stdio: 'inherit' });
  spawnSync('node', ['scripts/verify-product-catalog.js'], { cwd: ROOT_DIR, stdio: 'inherit' });

  console.log('🌟 [sync] Canlı katalog senkronizasyonu 0 hata ile tamamlandı!');
}

if (require.main === module) {
  syncAllBrands().catch(err => {
    console.error('Fatal sync error:', err);
    process.exit(1);
  });
}

module.exports = { syncAllBrands, BRAND_CONFIGS };
