/**
 * BELGİN KUYUMCULUK — PRODUCT MAPPING LAYER
 * 
 * İZKO ve Harem Altın ham ürün anahtarlarını kanonik PRODUCT_IDS ile eşleştirir.
 */

const { PRODUCT_IDS } = require('./types');

// İZKO API ve HTML Anahtarları -> Kanonik Ürün Eşleştirmesi
const IZKO_KEY_MAP = {
  'hasaltin': PRODUCT_IDS.HAS_24K,
  'gram': PRODUCT_IDS.GRAM_24K,
  'yirmiiki': PRODUCT_IDS.GOLD_22K,
  'onsekiz': PRODUCT_IDS.GOLD_18K,
  'ondort': PRODUCT_IDS.GOLD_14K,
  'sekizayar': PRODUCT_IDS.GOLD_8K,
  'yeniceyrek': PRODUCT_IDS.CEYREK_NEW,
  'eskiceyrek': PRODUCT_IDS.CEYREK_OLD,
  'yeniyarim': PRODUCT_IDS.YARIM_NEW,
  'eskiyarim': PRODUCT_IDS.YARIM_OLD,
  'yenitam': PRODUCT_IDS.ZIYNET_NEW,
  'eskitam': PRODUCT_IDS.ZIYNET_OLD,
  'ata': PRODUCT_IDS.ATA_NEW,
  'paketlihas': PRODUCT_IDS.PACKAGED_24K
};

// Harem Altın Canlı Borsa Kodları -> Kanonik Ürün Eşleştirmesi
const HAREM_KEY_MAP = {
  'ALTIN': PRODUCT_IDS.HAS_24K,
  'AYAR22': PRODUCT_IDS.GOLD_22K,
  'AYAR18': PRODUCT_IDS.GOLD_18K,
  'AYAR14': PRODUCT_IDS.GOLD_14K,
  'AYAR8': PRODUCT_IDS.GOLD_8K,
  'CEYREK_YENI': PRODUCT_IDS.CEYREK_NEW,
  'CEYREK_ESKI': PRODUCT_IDS.CEYREK_OLD,
  'YARIM_YENI': PRODUCT_IDS.YARIM_NEW,
  'YARIM_ESKI': PRODUCT_IDS.YARIM_OLD,
  'TEK_YENI': PRODUCT_IDS.ZIYNET_NEW,
  'TEK_ESKI': PRODUCT_IDS.ZIYNET_OLD,
  'ATA_YENI': PRODUCT_IDS.ATA_NEW,
  'ATA_ESKI': PRODUCT_IDS.ATA_OLD,
  'GREMESE_YENI': PRODUCT_IDS.GREMESE_NEW,
  'GREMESE_ESKI': PRODUCT_IDS.GREMESE_OLD,
  'ATA5_YENI': PRODUCT_IDS.ATA5_NEW,
  'ATA5_ESKI': PRODUCT_IDS.ATA5_OLD,
  'KULCEALTIN': PRODUCT_IDS.PACKAGED_24K,
  'USDTRY': PRODUCT_IDS.USDTRY,
  'EURTRY': PRODUCT_IDS.EURTRY
};

/**
 * Bir katalog ürününün (PRODUCTS[i]) adını inceleyerek kanonik ürün fiyatları
 * üzerinden nihai satış fiyatını hesaplar.
 * 
 * @param {Object} product data.js içindeki ürün nesnesi
 * @param {Object<string, number>} priceMap canonical productId -> Belgin sell price
 * @returns {number|null} Hesaplanmış hedef fiyat ya da null
 */
function resolveCatalogProductPrice(product, priceMap) {
  if (!product) return null;
  const isGoldItem = Boolean(product.isGold) ||
    product.category === 'gold' ||
    product.subCategory?.includes('Ziynet') ||
    product.subCategory?.includes('Külçe') ||
    product.subCategory?.includes('Bilezik');

  if (!isGoldItem) return null;

  const name = (product.name || '').toLowerCase();

  const pGram = priceMap[PRODUCT_IDS.GRAM_24K] || priceMap[PRODUCT_IDS.HAS_24K];
  const p22k = priceMap[PRODUCT_IDS.GOLD_22K];
  const p18k = priceMap[PRODUCT_IDS.GOLD_18K];
  const p14k = priceMap[PRODUCT_IDS.GOLD_14K];
  const pCeyrekYeni = priceMap[PRODUCT_IDS.CEYREK_NEW];
  const pCeyrekEski = priceMap[PRODUCT_IDS.CEYREK_OLD];
  const pYarimYeni = priceMap[PRODUCT_IDS.YARIM_NEW];
  const pYarimEski = priceMap[PRODUCT_IDS.YARIM_OLD];
  const pZiynetYeni = priceMap[PRODUCT_IDS.ZIYNET_NEW];
  const pZiynetEski = priceMap[PRODUCT_IDS.ZIYNET_OLD];
  const pAtaYeni = priceMap[PRODUCT_IDS.ATA_NEW];
  const pAtaEski = priceMap[PRODUCT_IDS.ATA_OLD] || pAtaYeni;

  // 1. Çeyrek Altın
  if (name.includes('çeyrek')) {
    if (name.includes('ata')) {
      return name.includes('eski')
        ? (pAtaEski ? Math.round(pAtaEski * 0.25) : null)
        : (pAtaYeni ? Math.round(pAtaYeni * 0.25) : null);
    }
    return name.includes('eski') ? (pCeyrekEski || null) : (pCeyrekYeni || null);
  }

  // 2. Yarım Altın
  if (name.includes('yarım')) {
    if (name.includes('ata')) {
      return name.includes('eski')
        ? (pAtaEski ? Math.round(pAtaEski * 0.5) : null)
        : (pAtaYeni ? Math.round(pAtaYeni * 0.5) : null);
    }
    return name.includes('eski') ? (pYarimEski || null) : (pYarimYeni || null);
  }

  // 3. Ata Altın (Tam, Beşli, 2.5'luk vb.)
  if (name.includes('ata')) {
    const isEski = name.includes('eski');
    const baseAta = isEski ? pAtaEski : pAtaYeni;
    if (!baseAta) return null;
    if (name.includes('beşli')) {
      return Math.round(5 * baseAta);
    }
    if (name.includes('2.5') || name.includes('gremse')) {
      return Math.round(2.5 * baseAta);
    }
    return Math.round(baseAta);
  }

  // 4. Ziynet / Tam Altın / Reşat
  if (name.includes('tam altın') || name.includes('ziynet') || name.includes('reşat')) {
    const isEski = name.includes('eski');
    const baseZiynet = isEski ? pZiynetEski : pZiynetYeni;
    if (!baseZiynet) return null;
    if (name.includes('beşli') || name.includes('5 tam')) {
      return Math.round(5 * baseZiynet);
    }
    if (name.includes('2.5') || name.includes('gremse')) {
      return Math.round(2.5 * baseZiynet);
    }
    if (name.includes('3 tam')) {
      return Math.round(3 * baseZiynet);
    }
    return Math.round(baseZiynet);
  }

  // 5. 22 Ayar Bilezikler
  if (name.includes('22 ayar') && name.includes('bilezik')) {
    if (!p22k) return null;
    const gramMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(?:gr|gram)/i);
    const gram = gramMatch ? parseFloat(gramMatch[1].replace(',', '.')) : 10;
    return Math.round(gram * p22k);
  }

  // 6. 14 Ayar Bilezikler
  if (name.includes('14 ayar') && name.includes('bilezik')) {
    if (!p14k) return null;
    const gramMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(?:gr|gram)/i);
    const gram = gramMatch ? parseFloat(gramMatch[1].replace(',', '.')) : 10;
    return Math.round(gram * p14k);
  }

  // 7. Külçe / Gram Altın
  if (name.includes('külçe') || name.includes('gram altın') || name.includes('has altın')) {
    if (!pGram) return null;
    const gramMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(?:gr|gram|kg|kilogram)/i);
    let gram = 1;
    if (name.includes('1 kg') || name.includes('1 kilogram')) gram = 1000;
    else if (gramMatch) gram = parseFloat(gramMatch[1].replace(',', '.'));
    return Math.round(gram * pGram);
  }

  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    IZKO_KEY_MAP,
    HAREM_KEY_MAP,
    resolveCatalogProductPrice
  };
}

if (typeof window !== 'undefined') {
  window.BelginProductMap = {
    IZKO_KEY_MAP,
    HAREM_KEY_MAP,
    resolveCatalogProductPrice
  };
}
