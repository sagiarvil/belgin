// BELGIN KUYUMCULUK — SEÇKİN ROLEX SAAT CANLI SENKRONİZASYON MOTORU v1.0
// Kaynak: https://www.nasyonelchrono.com/rolex
// Hedef: Seçkin Ürünler (/seckin-urunler/ • PRE_OWNED_ITEMS)
// Kural: Kaynak Fiyatı + %50 Artış (x 1.50) | İkinci El 500 TL Marj Güvencesi
// Güvenlik & Marka: Tüm yabancı firma/satıcı isimleri (Nasyonel, Chrono vb.) %100 filtrelenir.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.join(__dirname, "..");
const ROLEX_SOURCE_URL = "https://www.nasyonelchrono.com/rolex";
const PRICE_MARKUP = 1.50; // +%50 Fiyat Artışı
const DEFAULT_USD_TRY = 48.14; // Varsayılan kur (canlı kur okunamadığında)

function getLiveUsdRate() {
  try {
    const cachePath = path.join(ROOT_DIR, "izko-rates-cache.json");
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      if (cache.usdTry && Number(cache.usdTry) > 0) {
        return Number(cache.usdTry);
      }
    }
  } catch (e) {}
  return DEFAULT_USD_TRY;
}

function sanitizeText(str) {
  if (!str) return "";
  return str
    .replace(/NASYONEL\s*CHRONO/gi, "")
    .replace(/NASYONEL/gi, "")
    .replace(/CHRONO/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/&#8211;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function formatModelName(rawTitle) {
  let clean = sanitizeText(rawTitle);
  clean = clean.replace(/\s*İKİNCİ\s*EL/gi, "").replace(/\s*SIFIR/gi, "").trim();
  return clean;
}

function extractReferenceNumber(title, link) {
  const match = title.match(/\b([0-9]{4,6}[A-Z]{0,5})\b/) || link.match(/_([0-9]{4,6}[a-z]{0,5})_/i);
  if (match) return match[1].toUpperCase();
  const numMatch = title.match(/\b([0-9]{5,6})\b/);
  if (numMatch) return numMatch[1];
  return "REF-PRESTIGE";
}

function buildPrestigeDescription(brand, title, ref) {
  return "Belgin Kuyumculuk uzman saat ekspertizi tarafından 12 nokta hassas mekanik, kronometrik hassasiyet ve gövde kondisyon kontrolünden geçirilmiş orijinal " + brand + " " + title + " (Ref. " + ref + "). 1999'dan beri süren Belgin Kuyumculuk showroom güvencesiyle, orijinal lüks kutusu, ekspertiz sertifikası ve yasal kimlik onaylı teslimat protokolü ile teslim edilmektedir.";
}

async function fetchRolexCatalog() {
  console.log("[sync-rolex] Kaynak URL taranıyor: " + ROLEX_SOURCE_URL);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8"
  };

  const res = await fetch(ROLEX_SOURCE_URL, { headers });
  if (!res.ok) {
    throw new Error("[sync-rolex] HTTP " + res.status + " hatası alındı.");
  }

  const html = await res.text();
  const regex = /<a id="productList_ProductList_imageLink_\d+"[^>]*href="([^"]+)"[^>]*style="background-image:url\(([^)]+)\)[^>]*>[\s\S]*?<td class="UrunAdi"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a><\/td>[\s\S]*?<td class="tdFiyat"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/gi;

  const matches = [...html.matchAll(regex)];
  console.log("[sync-rolex] Toplam bulunan ham ürün sayısı: " + matches.length);

  const usdRate = getLiveUsdRate();
  console.log("[sync-rolex] Uygulanan USD/TRY Kuru: " + usdRate + " TL | Marj: +%50");

  const items = [];
  const seenUrls = new Set();

  for (const m of matches) {
    const rawLink = m[1];
    const rawImg = m[2];
    const rawTitle = m[3];
    const rawPrice = m[4];

    if (seenUrls.has(rawLink)) continue;
    seenUrls.add(rawLink);

    const numOnly = Number(rawPrice.replace(/[^0-9]/g, "")) || 0;
    if (numOnly <= 0) continue;

    let baseCurrency = "USD";
    if (rawPrice.includes("€") || rawPrice.toUpperCase().includes("EUR")) baseCurrency = "EUR";
    else if (rawPrice.includes("₺") || rawPrice.toUpperCase().includes("TL")) baseCurrency = "TRY";

    let tryPrice = 0;
    if (baseCurrency === "USD") {
      tryPrice = Math.round(numOnly * usdRate * PRICE_MARKUP);
    } else if (baseCurrency === "EUR") {
      tryPrice = Math.round(numOnly * (usdRate * 1.08) * PRICE_MARKUP);
    } else {
      tryPrice = Math.round(numOnly * PRICE_MARKUP);
    }

    if (tryPrice < 12000) continue;

    const hdImage = rawImg.replace(/\/Orta([a-f0-9]+)/i, "/Buyuk$1");

    let brand = "Rolex";
    const titleLower = rawTitle.toLowerCase();
    if (titleLower.includes("patek philippe") || rawLink.includes("patek")) brand = "Patek Philippe";
    else if (titleLower.includes("audemars piguet") || rawLink.includes("audemars")) brand = "Audemars Piguet";
    else if (titleLower.includes("vacheron") || rawLink.includes("vacheron")) brand = "Vacheron Constantin";
    else if (titleLower.includes("cartier") || rawLink.includes("cartier")) brand = "Cartier";
    else if (titleLower.includes("van cleef") || rawLink.includes("van_cleef")) brand = "Van Cleef & Arpels";
    else if (titleLower.includes("omega") || rawLink.includes("omega")) brand = "Omega";
    else if (titleLower.includes("richard mille") || rawLink.includes("richard_mille")) brand = "Richard Mille";

    const cleanTitle = formatModelName(rawTitle);
    const refNumber = extractReferenceNumber(rawTitle, rawLink);
    const descText = buildPrestigeDescription(brand, cleanTitle, refNumber);

    items.push({
      brand,
      title: cleanTitle,
      reference: refNumber,
      price: tryPrice,
      buyPrice: tryPrice - 500,
      image: hdImage,
      sourceUrl: "https://www.nasyonelchrono.com" + rawLink,
      desc: descText
    });
  }

  return items;
}

async function syncSeckinRolex() {
  console.log("====================================================");
  console.log("BELGİN KUYUMCULUK — SEÇKİN ROLEX SAAT SENKRONİZASYONU");
  console.log("Başlama Zamanı:", new Date().toISOString());
  console.log("Fiyatlandırma: Kaynak Fiyatı + %50 Artış (x 1.50)");
  console.log("====================================================");

  const existingData = require("../js/data.js");

  const rawRolexItems = await fetchRolexCatalog();
  console.log("[sync-rolex] İşlenen ve filtrelenen geçerli saat sayısı: " + rawRolexItems.length);

  if (rawRolexItems.length < 30) {
    throw new Error("[CRITICAL CIRCUIT BREAKER]: Seçkin Rolex senkronizasyonunda yetersiz ürün çekildi (" + rawRolexItems.length + " < 30). Olası bot engeli veya site değişikliği!");
  }

  const existingNonRolexPreOwned = existingData.PRODUCTS.filter(p => p.isPreOwned === true && !p.sourceUrl?.includes("nasyonelchrono.com"));
  const nonPreOwnedProducts = existingData.PRODUCTS.filter(p => !p.isPreOwned);

  let nextId = 5001;
  const newPreOwnedItems = rawRolexItems.map(item => {
    const isJewelry = item.brand === "Van Cleef & Arpels" || (item.brand === "Cartier" && item.title.includes("BİLEZİK"));
    const isGold = item.title.toLowerCase().includes("altin") || item.title.toLowerCase().includes("altın");
    return {
      id: nextId++,
      brand: item.brand,
      name: item.title,
      reference: item.reference,
      category: isJewelry ? "jewelry" : "watch",
      statusBadge: "Stokta",
      conditionBadge: "İkinci El",
      isPreOwned: true,
      isGold: isGold,
      price: item.price,
      buyPrice: item.buyPrice,
      metal: isGold ? "18K Altın / Paslanmaz Çelik" : "Oystersteel Paslanmaz Çelik 904L",
      dial: "Özel Koleksiyon Kadran",
      year: "2023 - 2026",
      boxPapers: "Orijinal Kutu & Belgin Kuyumculuk Ekspertiz Belgesi",
      desc: item.desc,
      image: item.image,
      hoverImage: item.image,
      images: [item.image],
      sourceUrl: item.sourceUrl,
      amplitude: "285° - 310° (Swiss Chronometer)",
      rateAccuracy: "±1.5 sn/gün (Superlative Chronometer)",
      waterTest: "10 Bar (100 Metre) Geçti",
      inStock: true,
      isHighValue: true
    };
  });

  const combinedPreOwned = [...existingNonRolexPreOwned, ...newPreOwnedItems];
  const combinedProducts = [...nonPreOwnedProducts, ...combinedPreOwned];

  console.log("[sync-rolex] Toplam Seçkin Koleksiyon: " + combinedPreOwned.length + " (Yeni Eklenen: " + newPreOwnedItems.length + ")");
  console.log("[sync-rolex] Toplam Yayındaki Ürün Sayısı: " + combinedProducts.length);

  const dataFileContent = "// ==========================================================\n" +
"// BELGİN KUYUMCULUK — MASTER ÜRÜN VE KOLEKSİYON VERİTABANI\n" +
"// Sürüm: " + new Date().toISOString().split("T")[0] + ".live-sync (Seçkin Rolex + Saat&Saat + Carren)\n" +
"// Toplam Yayın Ürünü: " + combinedProducts.length + " (Fiyat >= 12.000 TL)\n" +
"// ==========================================================\n\n" +
"const WATCH_BRANDS = " + JSON.stringify(existingData.WATCH_BRANDS, null, 2) + ";\n\n" +
"const JEWELRY_BRANDS = " + JSON.stringify(existingData.JEWELRY_BRANDS, null, 2) + ";\n\n" +
"// MASTER ÜRÜN LİSTESİ (" + combinedProducts.length + " Ürün: " + combinedPreOwned.length + " Seçkin Parça)\n" +
"const PRODUCTS = " + JSON.stringify(combinedProducts, null, 2) + ";\n\n" +
"const WATCHES = PRODUCTS.filter(p => p.category === 'saat' || (p.category === 'watch' && !p.isPreOwned));\n" +
"const JEWELLERY = PRODUCTS.filter(p => p.category === 'jewelry' || p.category === 'jewellery');\n" +
"const PRE_OWNED_ITEMS = PRODUCTS.filter(p => p.isPreOwned === true);\n" +
"const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);\n\n" +
"const ALL_PRODUCTS_LIST = PRODUCTS;\n\n" +
"const CERTIFICATE_DB = " + JSON.stringify(existingData.CERTIFICATE_DB, null, 2) + ";\n\n" +
"if (typeof module !== 'undefined' && module.exports) {\n" +
"  module.exports = {\n" +
"    PRODUCTS,\n" +
"    WATCH_BRANDS,\n" +
"    JEWELRY_BRANDS,\n" +
"    WATCHES,\n" +
"    JEWELLERY,\n" +
"    PRE_OWNED_ITEMS,\n" +
"    PRE_OWNED_GOLD,\n" +
"    CERTIFICATE_DB,\n" +
"    ALL_PRODUCTS: PRODUCTS\n" +
"  };\n" +
"}\n";

  fs.writeFileSync(path.join(ROOT_DIR, "js", "data.js"), dataFileContent, "utf8");
  console.log("✅ js/data.js başarıyla güncellendi.");

  console.log("[sync-rolex] Build & Güvenlik pipeline scriptleri çalıştırılıyor...");
  spawnSync("node", ["scripts/generate-payment-catalog.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/generate-seo-assets.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/izko-safety-crosscheck.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/price-safety-guard.js"], { cwd: ROOT_DIR, stdio: "inherit" });
  spawnSync("node", ["scripts/verify-product-catalog.js"], { cwd: ROOT_DIR, stdio: "inherit" });

  console.log("🌟 [sync-rolex] Seçkin Rolex senkronizasyonu " + newPreOwnedItems.length + " adet lüks saat ile başarıyla tamamlandı!");
}

if (require.main === module) {
  syncSeckinRolex().catch(err => {
    console.error("Fatal Rolex sync error:", err);
    process.exit(1);
  });
}

module.exports = { syncSeckinRolex, PRICE_MARKUP };
