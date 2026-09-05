#!/usr/bin/env node
/**
 * Belgin Kuyumculuk – 5 Dakikalık Canlı Fiyat ve Stok Senkronizasyon Motoru
 * 
 * Kurallar:
 * 1. Altın / Mücevherat (AgaKulche): Canlı fiyat üzerine +%2 kâr marjı (x 1.02)
 * 2. Stok Kontrolü: Kaynakta tükenen ürünler "Tükendi" durumuna geçer (fail-closed)
 * 3. Akıllı Delta: Yalnızca fiyat veya stok değiştiğinde katalog dosyalarını günceller
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GOLD_MARGIN = 1.02; // +%2 Kâr Marjı

function decodeHtmlEntities(str) {
  return str
    .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
    .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
    .replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '').trim();
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
      },
      timeout: 20000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function isMultiUnitGoldItem(name) {
  const n = (name || '').toLowerCase();
  const m = n.match(/(\d+)\s*adet/i);
  if (m && parseInt(m[1], 10) > 1) return true;
  if (/eski\s*\d+\s*adet/i.test(n) || /yeni\s*\d+\s*adet/i.test(n)) return true;
  if (/\b\d+\s*adet\s*(çeyrek|yarım|tam|ata|külçe|gram|gr)\b/i.test(n)) return true;
  return false;
}

function parseAgaKulchePage(html) {
  const products = [];
  
  // Product-item-details veya last-price bloklarını tara
  const itemMatches = [...html.matchAll(/<h3[^>]*class=["']product-title["'][^>]*>([\s\S]*?)<\/h3>[\s\S]*?<strong[^>]*class=["']last-price["'][^>]*>([\d\.,]+)\s*TL[\s\S]*?(?:<\/div>|<button)/gi)];
  
  for (const m of itemMatches) {
    const rawTitle = decodeHtmlEntities(m[1]);
    const rawPriceStr = m[2].replace(/\./g, '').replace(',', '.');
    const sourcePrice = Math.round(parseFloat(rawPriceStr));
    
    if (rawTitle && sourcePrice > 0) {
      // 1'den fazla adetli satışta olan altınları dahil etme (Yalnızca tekil ürünler listelenir)
      if (isMultiUnitGoldItem(rawTitle)) {
        continue;
      }

      // 24 Ayar altınlar, külçeler ve gram altınlar KESİNLİKLE dahil edilmez (Kalıcı olarak kaldırıldı)
      if (/24\s*ayar/i.test(rawTitle) || /24k/i.test(rawTitle) || /külçe/i.test(rawTitle) || /kulce/i.test(rawTitle) || /995/i.test(rawTitle) || /999/i.test(rawTitle) || /has\s*altın/i.test(rawTitle) || /gram\s*altın/i.test(rawTitle) || /valcambi/i.test(rawTitle) || /argor/i.test(rawTitle) || /pamp/i.test(rawTitle)) {
        continue;
      }

      // Temiz Başlık (Marka ve aracı isimleri arındırılmış)
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
        inStock: true // default
      });
    }
  }

  return products;
}

function normalizeName(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]/g, '');
}

async function syncAll() {
  console.log(`[SYNC-ENGINE] Canlı Fiyat & Stok Senkronizasyonu Başlatıldı: ${new Date().toISOString()}`);
  
  const categoryUrls = [
    // Ziynet & Ata Altın
    'https://www.agakulche.com/ziynet-ata-altin',
    'https://www.agakulche.com/ziynet-ata-altin?page=2',
    'https://www.agakulche.com/ziynet-ata-altin?page=3',
    'https://www.agakulche.com/ziynet-ata-altin?page=4',
    'https://www.agakulche.com/ziynet-ata-altin?page=5',
    // Altın Bilezik
    'https://www.agakulche.com/altin-bilezik',
    'https://www.agakulche.com/altin-bilezik?page=2',
    'https://www.agakulche.com/altin-bilezik?page=3',
    'https://www.agakulche.com/altin-bilezik?page=4',
    'https://www.agakulche.com/altin-bilezik?page=5'
  ];

  const scrapedItems = [];
  for (const url of categoryUrls) {
    try {
      const html = await fetchHtml(url);
      const items = parseAgaKulchePage(html);
      scrapedItems.push(...items);
      console.log(`  ✓ ${url} => ${items.length} tekil ürün başarıyla okundu.`);
    } catch (err) {
      console.warn(`  ⚠️ Sayfa okunamadı: ${url} (${err.message})`);
    }
  }

  console.log(`[SYNC-ENGINE] Toplam taranan canlı tekil ürün: ${scrapedItems.length}`);

  // Mevcut data.js yükle
  const dataJsPath = path.join(__dirname, '../js/data.js');
  const currentDataRaw = fs.readFileSync(dataJsPath, 'utf8');
  let { PRODUCTS } = require(dataJsPath);

  // Çok adetli altınları veritabanından tamamen temizle (Asla tekrar dahil edilmez)
  const initialCount = PRODUCTS.length;
  PRODUCTS = PRODUCTS.filter(p => {
    if (p.isGold || p.category === 'gold' || p.subCategory?.includes('Ziynet') || p.subCategory?.includes('Külçe')) {
      return !isMultiUnitGoldItem(p.name);
    }
    return true;
  });
  console.log(`[SYNC-ENGINE] Çok adetli altın filtresi: ${initialCount - PRODUCTS.length} adet çoklu ürün temizlendi.`);

  let updatedCount = 0;

  // Altın ürünlerini tam eşleşme ile güncelle ve +%2 marj uygula (Aga Külçe Canlı Fiyat x 1.02)
  for (const p of PRODUCTS) {
    if (p.isPreOwned || (p.category !== 'jewelry' && p.category !== 'jewellery' && !p.isGold)) continue;

    const normBelgin = normalizeName(p.name);
    const match = scrapedItems.find(item => normalizeName(item.cleanName) === normBelgin);

    if (match && match.sourcePrice > 0) {
      const newPriceWithMargin = Math.round(match.sourcePrice * GOLD_MARGIN);
      if (p.price !== newPriceWithMargin) {
        p.price = newPriceWithMargin;
        updatedCount++;
      }
      p.inStock = match.inStock;
      p.statusBadge = match.inStock ? 'Stokta' : 'Tükendi';
    }
  }

  console.log(`[SYNC-ENGINE] Güncellenen altın/mücevher ürün sayısı: ${updatedCount}`);

  // js/data.js Header ve Footer'ını dinamik ayrıştır
  const productsMatch = currentDataRaw.match(/const PRODUCTS = \[[\s\S]*?\n\];/);
  if (!productsMatch) {
    throw new Error('js/data.js içinde const PRODUCTS dizisi bulunamadı.');
  }

  const headerPart = currentDataRaw.substring(0, productsMatch.index);
  const footerPart = currentDataRaw.substring(productsMatch.index + productsMatch[0].length);

  const updatedProductsBlock = `const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};`;
  fs.writeFileSync(dataJsPath, headerPart + updatedProductsBlock + footerPart, 'utf8');
  console.log(`[SYNC-ENGINE] js/data.js başarıyla güncellendi (Kalan Tekil Ürün: ${PRODUCTS.length}).`);

  // Ödeme kataloğunu ve SEO varlıklarını doğrudan güncelle
  console.log(`[SYNC-ENGINE] Ödeme ve SEO katalogları senkronize ediliyor...`);
  execSync('node scripts/generate-payment-catalog.js', { stdio: 'inherit' });
  execSync('node scripts/generate-seo-assets.js', { stdio: 'inherit' });
  execSync('node scripts/verify-product-catalog.js', { stdio: 'inherit' });

  console.log(`[SYNC-ENGINE] ✅ Fiyat & Stok Senkronizasyonu Başarıyla Tamamlandı.`);
}

if (require.main === module) {
  syncAll().catch(err => {
    console.error(`[SYNC-ENGINE FATAL]:`, err);
    process.exit(1);
  });
}

module.exports = { syncAll };
