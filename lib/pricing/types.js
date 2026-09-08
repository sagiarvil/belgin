/**
 * BELGİN KUYUMCULUK — CANONICAL PRICING MODEL TYPES & CONSTANTS
 * 
 * Sürüm: 3.0.0 (İZKO Primary Sell / Harem Primary Buy & Fallback)
 */

// Section 8 Kanonik Ürün Kimlikleri (Mandate Sözleşmesi)
const CANONICAL_PRODUCT_IDS = {
  GRAM_ALTIN_HAS: 'GRAM_ALTIN_HAS',
  GRAM_ALTIN_22: 'GRAM_ALTIN_22',
  CEYREK_YENI: 'CEYREK_YENI',
  CEYREK_ESKI: 'CEYREK_ESKI',
  YARIM_YENI: 'YARIM_YENI',
  YARIM_ESKI: 'YARIM_ESKI',
  TAM_YENI: 'TAM_YENI',
  TAM_ESKI: 'TAM_ESKI',
  ATA_YENI: 'ATA_YENI',
  ATA_ESKI: 'ATA_ESKI',
  ATA_BESLI: 'ATA_BESLI',
  GREMESE: 'GREMESE',
  AYAR_22_BILEZIK: 'AYAR_22_BILEZIK',
  AYAR_18: 'AYAR_18',
  AYAR_14: 'AYAR_14'
};

const PRODUCT_IDS = {
  ...CANONICAL_PRODUCT_IDS,
  HAS_24K: 'GRAM_ALTIN_HAS',
  GRAM_24K: 'GRAM_ALTIN_HAS',
  GOLD_22K: 'AYAR_22_BILEZIK',
  GOLD_18K: 'AYAR_18',
  GOLD_14K: 'AYAR_14',
  GOLD_8K: 'GOLD_8K',
  CEYREK_NEW: 'CEYREK_YENI',
  CEYREK_OLD: 'CEYREK_ESKI',
  YARIM_NEW: 'YARIM_YENI',
  YARIM_OLD: 'YARIM_ESKI',
  ZIYNET_NEW: 'TAM_YENI',
  ZIYNET_OLD: 'TAM_ESKI',
  ATA_NEW: 'ATA_YENI',
  ATA_OLD: 'ATA_ESKI',
  GREMESE_NEW: 'GREMESE',
  GREMESE_OLD: 'GREMESE',
  ATA5_NEW: 'ATA_BESLI',
  ATA5_OLD: 'ATA_BESLI',
  PACKAGED_24K: 'PACKAGED_24K',
  USDTRY: 'USDTRY',
  EURTRY: 'EURTRY'
};

const PRODUCT_LABELS = {
  [PRODUCT_IDS.HAS_24K]: 'Has Altın (24 Ayar / gr)',
  [PRODUCT_IDS.GRAM_24K]: 'Gram Altın (24 Ayar)',
  [PRODUCT_IDS.GOLD_22K]: '22 Ayar Altın / Bilezik (gr)',
  [PRODUCT_IDS.GOLD_18K]: '18 Ayar Altın (gr)',
  [PRODUCT_IDS.GOLD_14K]: '14 Ayar Altın (gr)',
  [PRODUCT_IDS.GOLD_8K]: '8 Ayar Altın (gr)',
  [PRODUCT_IDS.CEYREK_NEW]: 'Yeni Çeyrek Altın',
  [PRODUCT_IDS.CEYREK_OLD]: 'Eski Çeyrek Altın',
  [PRODUCT_IDS.YARIM_NEW]: 'Yeni Yarım Altın',
  [PRODUCT_IDS.YARIM_OLD]: 'Eski Yarım Altın',
  [PRODUCT_IDS.ZIYNET_NEW]: 'Yeni Ziynet (Tam) Altın',
  [PRODUCT_IDS.ZIYNET_OLD]: 'Eski Ziynet (Tam) Altın',
  [PRODUCT_IDS.ATA_NEW]: 'Yeni Ata (Cumhuriyet) Altın',
  [PRODUCT_IDS.ATA_OLD]: 'Eski Ata (Cumhuriyet) Altın',
  [PRODUCT_IDS.GREMESE_NEW]: 'Yeni Gremse Altın',
  [PRODUCT_IDS.GREMESE_OLD]: 'Eski Gremse Altın',
  [PRODUCT_IDS.ATA5_NEW]: 'Yeni Ata Beşli Altın',
  [PRODUCT_IDS.ATA5_OLD]: 'Eski Ata Beşli Altın',
  [PRODUCT_IDS.PACKAGED_24K]: 'Paketli Has Altın',
  [PRODUCT_IDS.USDTRY]: 'Amerikan Doları (USD/TRY)',
  [PRODUCT_IDS.EURTRY]: 'Euro (EUR/TRY)'
};

const PRICE_SOURCES = {
  IZKO: 'IZKO',
  HAREM: 'HAREM'
};

const PRICE_STATUS = {
  LIVE: 'LIVE',
  STALE: 'STALE',
  FALLBACK: 'FALLBACK',
  UNAVAILABLE: 'UNAVAILABLE'
};

const TIMINGS = {
  LIVE_MAX_AGE_MS: 120_000,          // 0 - 120 saniye: LIVE
  FALLBACK_MAX_AGE_MS: 300_000,      // 120 - 300 saniye: STALE, >300 saniye: Fallback provider
  LAST_VALID_HARD_TTL_MS: 15 * 60 * 1000, // 15 dakika: Hard TTL bitimi -> UNAVAILABLE
  PROVIDER_TIMEOUT_MS: 5000,         // 5 saniye ağ zaman aşımı
  ANOMALY_THRESHOLD_PERCENT: 2.0     // %2 azami tekil sapma limiti
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CANONICAL_PRODUCT_IDS,
    PRODUCT_IDS,
    PRODUCT_LABELS,
    PRICE_SOURCES,
    PRICE_STATUS,
    TIMINGS
  };
}

if (typeof window !== 'undefined') {
  window.BelginPricingTypes = {
    CANONICAL_PRODUCT_IDS,
    PRODUCT_IDS,
    PRODUCT_LABELS,
    PRICE_SOURCES,
    PRICE_STATUS,
    TIMINGS
  };
}
