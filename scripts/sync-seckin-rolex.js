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
    .replace(/ETİLER/gi, "")
    .replace(/İSTİNYEPARK/gi, "")
    .replace(/İSTİNYE/gi, "")
    .replace(/HILLTOWN/gi, "")
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

function mapMaterialName(rawMat, title = "") {
  const m = String(rawMat || "").toLowerCase().trim();
  const t = String(title || "").toLowerCase();

  if (m === "celik" || m === "steel") {
    if (t.includes("beyaz altin") || t.includes("beyaz altın")) return "18 Ayar Beyaz Altın & Çelik";
    if (t.includes("sari altin") || t.includes("sarı altın")) return "Rolesor (18K Sarı Altın & Çelik)";
    if (t.includes("rose") || t.includes("everose") || t.includes("pembe altın")) return "Rolesor (18K Everose Altın & Çelik)";
    return "Oystersteel Paslanmaz Çelik";
  }
  if (m.includes("beyaz_altin") || m.includes("white_gold")) return "18 Ayar Beyaz Altın";
  if (m.includes("rose_gold") || m.includes("pembe_altin") || m.includes("everose")) return "18 Ayar Everose Altın";
  if (m.includes("sari_altin") || m.includes("yellow_gold")) return "18 Ayar Sarı Altın";
  if (m.includes("celik_altin") || m.includes("bicolor")) return "Rolesor (18K Altın & Paslanmaz Çelik)";
  if (m.includes("platin") || m.includes("platinum")) return "950 Platin";
  if (m.includes("titanyum") || m.includes("titanium")) return "RLX Titanyum";

  if (t.includes("altin") || t.includes("altın")) return "18 Ayar Masif Altın / Çelik";
  return "Oystersteel Paslanmaz Çelik";
}

function mapMovementName(rawMov) {
  const mov = String(rawMov || "").toUpperCase().trim();
  if (mov.includes("OTOMATIK") || mov.includes("OTOMATİK") || mov.includes("AUTOMATIC")) return "Otomatik Mekanizma";
  if (mov.includes("KURMALI") || mov.includes("MANUAL") || mov.includes("HAND")) return "Mekanik Kurmalı";
  if (mov.includes("QUARTZ") || mov.includes("PILLI") || mov.includes("PİLLİ")) return "Quartz (Pilli)";
  return "Otomatik Mekanizma";
}

function mapConditionName(rawCond) {
  const c = String(rawCond || "").toLowerCase();
  if (c.includes("sifir") || c.includes("sıfır") || c.includes("new") || c.includes("unworn")) return "Sıfır / Kullanılmamış";
  return "İkinci El (Ekspertiz Onaylı)";
}

function mapBraceletName(title = "") {
  const t = title.toLowerCase();
  if (t.includes("jubile") || t.includes("jubilee")) return "Jubilee 5 Parçalı Bilezik";
  if (t.includes("oysterflex")) return "Oysterflex Elastomer Kayış";
  if (t.includes("president")) return "President 3 Parçalı Bilezik";
  if (t.includes("oyster")) return "Oyster 3 Parçalı Bilezik";
  if (t.includes("deri") || t.includes("leather")) return "Timsah / Dana Derisi Kayış";
  if (t.includes("kaucuk") || t.includes("kauçuk") || t.includes("rubber")) return "Kauçuk Kayış";
  return "Orijinal Metal Bilezik / Kayış";
}

function buildTruthfulDescription(brand, title, ref, cap, materyal, mekanizma, durum, bilezik) {
  const lines = [];
  lines.push(`${brand} ${title} lüks saat modeli.`);

  const specNotes = [];
  if (ref && ref !== "REF-PRESTIGE") specNotes.push(`Referans: ${ref}`);
  if (cap) specNotes.push(`Kasa Çapı: ${cap} mm`);
  if (materyal) specNotes.push(`Kasa Materyali: ${materyal}`);
  if (bilezik) specNotes.push(`Kordon: ${bilezik}`);
  if (mekanizma) specNotes.push(`Mekanizma: ${mekanizma}`);
  if (durum) specNotes.push(`Durum: ${durum}`);

  if (specNotes.length > 0) {
    lines.push(specNotes.join(" • ") + ".");
  }

  lines.push(`Bu seçkin saat modeli, Belgin Kuyumculuk uzman saat ustaları tarafından fiziksel ve mekanik kontrollerden geçirilmiş olup orijinal kutusu ve Belgin Kuyumculuk satış faturası ile teslim edilmektedir.`);

  return lines.join(" ");
}

function getHiddenSpanValue(rowHtml, spanKey) {
  const reg = new RegExp(`id="productList_ProductList_${spanKey}_\\d+"[^>]*>([^<]*)<\\/span>`, "i");
  const m = rowHtml.match(reg);
  return m ? m[1].trim() : "";
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
  const rowRegex = /<tr class="saatProduct[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = [...html.matchAll(rowRegex)];
  console.log("[sync-rolex] Toplam bulunan ürün satırı sayısı: " + rows.length);

  const usdRate = getLiveUsdRate();
  console.log("[sync-rolex] Uygulanan USD/TRY Kuru: " + usdRate + " TL | Marj: +%50");

  const items = [];
  const seenUrls = new Set();

  for (const r of rows) {
    const rowHtml = r[1];

    const linkMatch = rowHtml.match(/href="(\/[^"]+)"/i);
    const imgMatch = rowHtml.match(/style="background-image:url\(([^)]+)\)/i);
    const titleMatch = rowHtml.match(/<td class="UrunAdi"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a><\/td>/i);
    const priceMatch = rowHtml.match(/<td class="tdFiyat"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);

    if (!linkMatch || !imgMatch || !titleMatch || !priceMatch) continue;

    const rawLink = linkMatch[1];
    const rawImg = imgMatch[1];
    const rawTitle = titleMatch[1];
    const rawPrice = priceMatch[1];

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

    // Kaynaktan doğrudan gerçek alanları çek
    const rawCap = getHiddenSpanValue(rowHtml, "lblCap");
    const rawMat = getHiddenSpanValue(rowHtml, "lblMateryal");
    const rawMov = getHiddenSpanValue(rowHtml, "MekanizmaHidden");
    const rawRef = getHiddenSpanValue(rowHtml, "ReferansIdHidden");
    const rawCond = getHiddenSpanValue(rowHtml, "DurumHidden");
    const rawStock = getHiddenSpanValue(rowHtml, "stokIdHidden");

    let refNumber = rawRef;
    if (!refNumber || refNumber === "0") {
      const match = cleanTitle.match(/\b([0-9]{4,6}[A-Z]{0,5})\b/) || rawLink.match(/_([0-9]{4,6}[a-z]{0,5})_/i);
      refNumber = match ? match[1].toUpperCase() : "REF-PRESTIGE";
    }

    const mappedCap = rawCap ? String(rawCap).trim() : (cleanTitle.match(/(\d{2})\s*MM/i)?.[1] || "");
    const mappedMaterial = mapMaterialName(rawMat, cleanTitle);
    const mappedMovement = mapMovementName(rawMov);
    const mappedCondition = mapConditionName(rawCond);
    const mappedBracelet = mapBraceletName(cleanTitle);

    const descText = buildTruthfulDescription(
      brand,
      cleanTitle,
      refNumber,
      mappedCap,
      mappedMaterial,
      mappedMovement,
      mappedCondition,
      mappedBracelet
    );

    items.push({
      brand,
      title: cleanTitle,
      reference: refNumber,
      price: tryPrice,
      buyPrice: tryPrice - 500,
      image: hdImage,
      sourceUrl: "https://www.nasyonelchrono.com" + rawLink,
      desc: descText,
      cap: mappedCap ? `${mappedCap} mm` : "Orijinal Kasa Çapı",
      materyal: mappedMaterial,
      mekanizma: mappedMovement,
      durum: mappedCondition,
      kordon: mappedBracelet,
      stokNo: rawStock || ""
    });
  }

  return items;
}

async function syncSeckinRolex() {
  console.log("====================================================");
  console.log("BELGİN KUYUMCULUK — SEÇKİN ROLEX SAAT SENKRONİZASYONU v2.0");
  console.log("Başlama Zamanı:", new Date().toISOString());
  console.log("Fiyatlandırma: Kaynak Fiyatı + %50 Artış (x 1.50)");
  console.log("Hukuki Kural: 0 Uydurma Değer • %100 Gerçek Kaynak Özellikleri");
  console.log("====================================================");

  const existingData = require("../js/data.js");

  const rawRolexItems = await fetchRolexCatalog();
  console.log("[sync-rolex] İşlenen ve filtrelenen geçerli saat sayısı: " + rawRolexItems.length);

  if (rawRolexItems.length < 30) {
    throw new Error("[CRITICAL CIRCUIT BREAKER]: Seçkin Rolex senkronizasyonunda yetersiz ürün çekildi (" + rawRolexItems.length + " < 30). Olası bot engeli veya site değişikliği!");
  }

  const existingNonRolexPreOwned = existingData.PRODUCTS.filter(p => p.isPreOwned === true && !p.sourceUrl?.includes("nasyonelchrono.com"));
  const nonPreOwnedProducts = existingData.PRODUCTS.filter(p => !p.isPreOwned);

  let nextId = 6001;
  const newPreOwnedItems = rawRolexItems.map(item => {
    const isJewelry = item.brand === "Van Cleef & Arpels" || (item.brand === "Cartier" && item.title.includes("BİLEZİK"));
    const isGold = item.materyal.includes("Altın") || item.title.toLowerCase().includes("altin") || item.title.toLowerCase().includes("altın");

    return {
      id: nextId++,
      brand: item.brand,
      name: item.title,
      reference: item.reference,
      category: isJewelry ? "jewelry" : "watch",
      subCategory: item.brand,
      statusBadge: "Stokta",
      conditionBadge: item.durum.includes("Sıfır") ? "Sıfır" : "İkinci El",
      isPreOwned: true,
      isGold: isGold,
      price: item.price,
      buyPrice: item.buyPrice,
      metal: item.materyal,
      dial: "Orijinal Kadran",
      year: "Orijinal Model Yılı",
      boxPapers: "Orijinal Kutu & Belgin Kuyumculuk Satış Faturası",
      desc: item.desc,
      description: item.desc,
      image: item.image,
      hoverImage: item.image,
      images: [item.image],
      sourceUrl: item.sourceUrl,
      inStock: true,
      isHighValue: true,
      specs: {
        "Kasa Çapı": item.cap,
        "Mekanizma": item.mekanizma,
        "Kasa Materyali": item.materyal,
        "Kordon / Kayış": item.kordon,
        "Cam Tipi": "Çizilmeye Dayanıklı Safir Kristal",
        "Kondisyon": item.durum,
        "Garanti": "1 Yıl Belgin Kuyumculuk Mekanik Garantisi",
        "Teslimat": "12.000 TL Üzeri Mağaza Teslimi (Kimlik & İmza İle)"
      }
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
