// BELGIN KUYUMCULUK — CARREN BRAND LIVE CATALOG SYNCHRONIZER & ENGINE v1.0
// Kaynak: https://carren.com.tr/index.php/urun-kategori/erkek/ & https://carren.com.tr/index.php/urun-kategori/kadin/
// Kural: Standart Tek Fiyat (19.000 TL) | Stokta Olmayanlar Elenir | Erkek & Kadın Saat Ayrımı | 2 Yıl Garanti

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const CARREN_FIXED_PRICE = 19000; // Standart tek fiyat (TL)

const CATEGORY_SOURCES = [
  {
    url: "https://carren.com.tr/index.php/urun-kategori/erkek/",
    gender: "Erkek",
    subCategory: "Erkek Saat"
  },
  {
    url: "https://carren.com.tr/index.php/urun-kategori/kadin/",
    gender: "Kadın",
    subCategory: "Kadın Saat"
  }
];

function cleanHtmlText(str) {
  if (!str) return "";
  return str
    .replace(/&#8211;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function buildCarrenDescription(modelName, gender, refCode) {
  return `Carren ${modelName} ${gender} Kol Saati (${refCode}), üstün işçilik ve modern tasarım estetiğini bir araya getiren özel koleksiyon saat modelidir. 316L paslanmaz çelik kasa yapısı, çizilmeye dayanıklı mineral kristal camı ve hassas Japon pilli (quartz) mekanizması ile uzun ömürlü kullanım sunar. Orijinal Carren kutusu, garanti belgesi ve Belgin Kuyumculuk uzmanlık sertifikası ile 2 yıl distribütör garantili olarak güvenle teslim edilmektedir.`;
}

async function fetchCategoryWatches(catSource) {
  let page = 1;
  const items = [];
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };

  while (true) {
    const pageUrl = page === 1 ? catSource.url : `${catSource.url}?product-page=${page}`;
    console.log(`[sync-carren] Sayfa taranıyor: ${pageUrl}`);
    
    let res;
    try {
      res = await fetch(pageUrl, { headers });
    } catch (err) {
      console.error(`[sync-carren] Ağ hatası (${pageUrl}):`, err.message);
      break;
    }

    if (!res.ok) {
      console.log(`[sync-carren] Sayfa ${page} HTTP ${res.status} ile bitti.`);
      break;
    }

    const html = await res.text();
    const productMatches = [...html.matchAll(/<li class="product type-product ([^"]+)">([\s\S]*?)<\/li>/g)];
    if (productMatches.length === 0) {
      console.log(`[sync-carren] Sayfa ${page} üzerinde ürün bulunamadı, tarama sonlandırıldı.`);
      break;
    }

    let pageInStock = 0;
    for (const m of productMatches) {
      const classes = m[1];
      const cardHtml = m[2];
      
      // Stok kontrolü: Stokta olmayanları atla
      const isOutOfStock = classes.includes("outofstock") || cardHtml.includes("wcosm_soldout");
      if (isOutOfStock) {
        continue;
      }

      const rawLink = cardHtml.match(/href="([^"]+)"/)?.[1] || "";
      const rawTitle = cardHtml.match(/<h2[^>]*class="woocommerce-loop-product__title"[^>]*>([\s\S]*?)<\/h2>/)?.[1] || "";
      const title = cleanHtmlText(rawTitle);
      const rawImg = cardHtml.match(/<img[^>]+src="([^"]+)"/)?.[1] || "";
      
      // Yüksek çözünürlüklü görsel yolunu normalize et (900x900 veya orijinal)
      let hdImage = rawImg;
      if (hdImage.includes("-300x300.") || hdImage.includes("-100x100.") || hdImage.includes("-150x150.")) {
        hdImage = hdImage.replace(/-[0-9]+x[0-9]+\./, ".");
      }

      const refMatch = rawLink.match(/\/urun\/([^\/]+)\//)?.[1]?.toUpperCase() || title;
      const ref = cleanHtmlText(refMatch.replace(/-/g, " "));

      if (title && hdImage) {
        items.push({
          title,
          ref: ref || title,
          sourceUrl: rawLink,
          image: hdImage,
          gender: catSource.gender,
          subCategory: catSource.subCategory
        });
        pageInStock++;
      }
    }

    console.log(`[sync-carren] Sayfa ${page}: Toplam ${productMatches.length} üründen ${pageInStock} adet stokta olan alındı.`);

    const hasNext = html.includes(`product-page=${page + 1}`);
    if (!hasNext) break;
    page++;
  }

  return items;
}

async function syncCarrenWatches() {
  console.log("====================================================");
  console.log("BELGİN KUYUMCULUK — CARREN CANLI KATALOG SENKRONİZASYONU");
  console.log("Başlama Zamanı:", new Date().toISOString());
  console.log(`Standart Tek Fiyat Kuralı: ${CARREN_FIXED_PRICE.toLocaleString("tr-TR")} TL`);
  console.log("====================================================");

  const existingData = require("../js/data.js");

  const collected = [];
  const seenRefs = new Set();

  for (const catSource of CATEGORY_SOURCES) {
    console.log(`\n[sync-carren] ${catSource.gender} kategorisi taranıyor (${catSource.url})...`);
    const rawList = await fetchCategoryWatches(catSource);
    
    for (const item of rawList) {
      const uniqueKey = `${item.ref.toLowerCase()}_${item.gender.toLowerCase()}`;
      if (!seenRefs.has(uniqueKey)) {
        seenRefs.add(uniqueKey);
        collected.push(item);
      }
    }
  }

  console.log(`\n[sync-carren] Toplam filtrelenmiş stoktaki Carren saat sayısı: ${collected.length}`);

  if (collected.length < 50) {
    throw new Error(`[CRITICAL CIRCUIT BREAKER]: Carren saat senkronizasyonunda yetersiz saat çekildi (${collected.length} < 50). Olası bot engeli veya site değişikliği!`);
  }

  // Mevcut Carren olmayan ürünleri ve diğer saatleri koru
  const existingNonCarrenProducts = existingData.PRODUCTS.filter(p => p.brand !== "Carren");
  
  let nextId = 20001;
  const existingCarrenIds = existingData.PRODUCTS.filter(p => p.brand === "Carren").map(p => p.id);
  if (existingCarrenIds.length > 0) {
    nextId = Math.min(...existingCarrenIds);
  }

  const carrenProducts = collected.map(item => {
    const desc = buildCarrenDescription(item.title, item.gender, item.ref);
    const watchItem = {
      id: nextId++,
      name: `Carren ${item.title} ${item.gender} Kol Saati`,
      brand: "Carren",
      ref: item.ref,
      reference: item.ref,
      price: CARREN_FIXED_PRICE,
      category: "saat",
      subCategory: item.subCategory,
      metal: "316L Paslanmaz Çelik",
      origin: "Türkiye / İsviçre Tasarım",
      image: item.image,
      hoverImage: item.image,
      images: [item.image],
      sourceUrl: item.sourceUrl || "https://carren.com.tr",
      statusBadge: "Distribütör Garantili",
      conditionBadge: "Sıfır",
      isPreOwned: false,
      isGold: false,
      stock: 1,
      inStock: true,
      isNew: true,
      isHighValue: true,
      description: desc,
      desc: desc,
      specs: {
        "Kasa Çapı": "42 mm",
        "Mekanizma": "Pilli (Quartz)",
        "Cam Tipi": "Mineral Kristal",
        "Su Geçirmezlik": "3 ATM",
        "Kordon / Kayış": "316L Paslanmaz Çelik / Deri",
        "Kasa Materyali": "316L Paslanmaz Çelik",
        "Cinsiyet": item.gender,
        "Menşei": "Türkiye / İsviçre Tasarım",
        "Garanti": "2 Yıl Distribütör Garantili",
        "Teslimat": "12.000 TL Üzeri Mağaza Teslimi (Kimlik & İmza İle)"
      }
    };
    return watchItem;
  });

  // Watch Brands güncelle
  const brandCoverImage = carrenProducts[0]?.image || "";
  const carrenBrandSummary = {
    id: "carren",
    name: "Carren",
    count: carrenProducts.length,
    origin: "Türkiye / İsviçre Tasarım",
    image: brandCoverImage
  };

  const updatedWatchBrands = existingData.WATCH_BRANDS.filter(b => b.id !== "carren");
  updatedWatchBrands.push(carrenBrandSummary);

  // Tüm ürünleri birleştir
  const combinedProducts = [...existingNonCarrenProducts, ...carrenProducts];

  console.log(`[sync-carren] Toplam Yayındaki Ürün Sayısı: ${combinedProducts.length} (Carren: ${carrenProducts.length})`);

  // js/data.js dosyasını güncelle
  const dataFileContent = `// ==========================================================
// BELGİN KUYUMCULUK — MASTER ÜRÜN VE KOLEKSİYON VERİTABANI
// Sürüm: ${new Date().toISOString().split("T")[0]}.live-sync (Carren & Saat&Saat Canlı Senkronizasyon)
// Toplam Yayın Ürünü: ${combinedProducts.length} (Fiyat >= 12.000 TL)
// ==========================================================

const WATCH_BRANDS = ${JSON.stringify(updatedWatchBrands, null, 2)};

const JEWELRY_BRANDS = ${JSON.stringify(existingData.JEWELRY_BRANDS, null, 2)};

// MASTER ÜRÜN LİSTESİ (${combinedProducts.length} Ürün)
const PRODUCTS = ${JSON.stringify(combinedProducts, null, 2)};

const WATCHES = PRODUCTS.filter(p => p.category === "saat" || (p.category === "watch" && !p.isPreOwned));
const JEWELLERY = PRODUCTS.filter(p => p.category === "jewelry" || p.category === "jewellery");
const PRE_OWNED_ITEMS = PRODUCTS.filter(p => p.isPreOwned === true);
const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);

const ALL_PRODUCTS_LIST = PRODUCTS;

const CERTIFICATE_DB = ${JSON.stringify(existingData.CERTIFICATE_DB, null, 2)};

if (typeof module !== "undefined" && module.exports) {
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

  fs.writeFileSync(path.join(ROOT_DIR, "js", "data.js"), dataFileContent, "utf8");
  console.log("✅ js/data.js başarıyla güncellendi.");

  // Pipeline scriptlerini çalıştır
  console.log("[sync-carren] Build & Güvenlik pipeline scriptleri çalıştırılıyor...");
  spawnSync("node", ["scripts/generate-payment-catalog.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/generate-seo-assets.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/izko-safety-crosscheck.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/price-safety-guard.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/verify-product-catalog.js"], { cwd: ROOT_DIR, stdio: "inherit" });

  console.log(`🌟 [sync-carren] Carren senkronizasyonu ${carrenProducts.length} adet stoklu saat ile başarıyla tamamlandı!`);
}

if (require.main === module) {
  syncCarrenWatches().catch(err => {
    console.error("Fatal Carren sync error:", err);
    process.exit(1);
  });
}

module.exports = { syncCarrenWatches, CARREN_FIXED_PRICE };
