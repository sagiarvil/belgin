#!/usr/bin/env node

/**
 * BELGIN KUYUMCULUK — İZKO CANLI KUR OTOMASYONU
 * Kaynak: https://www.izko.org.tr/guncel-kur
 * 15 dakikada bir otomatik çalışır ve verileri günceller.
 */

const { fetchIzkoRates } = require('../functions/izko-scraper');
const fs = require('fs');
const path = require('path');

async function runSync() {
  console.log('[IZKO Automation] 15 dakikalık İZKO kur taraması başlatılıyor...');
  console.log('[IZKO Automation] Hedef: https://www.izko.org.tr/guncel-kur');

  try {
    const rates = await fetchIzkoRates();
    console.log('[IZKO Automation] Veri başarıyla çekildi:');
    console.log(`  - 24K Has Altın (Gram): ₺${rates.hasAltin?.toLocaleString('tr-TR')}`);
    console.log(`  - 22 Ayar Bilezik: ₺${rates.gramGold22k?.toLocaleString('tr-TR')}`);
    console.log(`  - Yeni Çeyrek Altın: ₺${rates.quarterGold?.toLocaleString('tr-TR')}`);
    console.log(`  - Ata Altın: ₺${rates.ataGold?.toLocaleString('tr-TR')}`);
    console.log(`  - Son Güncelleme: ${rates.lastUpdatedFormatted}`);

    // Önbellek dosyasını kaydet
    const cachePath = path.join(__dirname, '..', 'izko-rates-cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(rates, null, 2), 'utf8');
    console.log(`[IZKO Automation] Önbellek dosyası yazıldı: ${cachePath}`);
    return rates;
  } catch (error) {
    console.error('[IZKO Automation] Hata oluştu:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runSync()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runSync };
