/**
 * BELGIN KUYUMCULUK — GEÇMİŞ FATURA VE SİPARİŞ ÜRÜN ADI ONARIM MOTORU (DATA MIGRATION & HEALING)
 * Firestore ve yerel önbellekte bulunan eski sipariş/fatura kayıtlarındaki "(x1) + İşçilik (x1)" kalıntılarını
 * bit-for-bit temizler ve mevzuata uygun net ürün adına ("22 Ayar Bilezik") dönüştürür.
 */

const { cleanInvoiceProductName, getCleanInvoiceItemsSummary } = require('../functions/earsiv-service');

function isPureLabor(name) {
  if (!name || typeof name !== 'string') return false;
  return /^[,\+\s]*[iİıI][şs][çc][iİıI]l[iİıI]k(?:\s*\([xX]?\d+[^)]*\))?[,\+\s]*$/i.test(name.trim());
}

function healOrderRecord(order) {
  if (!order || typeof order !== 'object') return { changed: false, order };
  let changed = false;
  const updated = { ...order };

  // 1. productName onarımı
  if (updated.productName) {
    const cleaned = cleanInvoiceProductName(updated.productName);
    if (cleaned !== updated.productName) {
      updated.productName = cleaned;
      changed = true;
    }
  }

  // 2. title / vipTitle onarımı
  if (updated.title) {
    const cleaned = cleanInvoiceProductName(updated.title);
    if (cleaned !== updated.title) {
      updated.title = cleaned;
      changed = true;
    }
  }
  if (updated.vipTitle) {
    const cleaned = cleanInvoiceProductName(updated.vipTitle);
    if (cleaned !== updated.vipTitle) {
      updated.vipTitle = cleaned;
      changed = true;
    }
  }

  // 3. items listesindeki isim kirlilikleri
  if (Array.isArray(updated.items) && updated.items.length > 0) {
    let itemsChanged = false;
    const newItems = updated.items.map(it => {
      if (isPureLabor(it.name)) {
        if (it.name !== 'İşçilik' || it.malHizmet !== 'İşçilik') {
          itemsChanged = true;
          return { ...it, name: 'İşçilik', malHizmet: 'İşçilik' };
        }
        return it;
      }
      const cleaned = cleanInvoiceProductName(it.name);
      if (cleaned !== it.name) {
        itemsChanged = true;
        return { ...it, name: cleaned, malHizmet: cleaned };
      }
      return it;
    });

    if (itemsChanged) {
      updated.items = newItems;
      changed = true;
    }

    // itemsSummary'yi net ürün adına bağla
    const correctSummary = getCleanInvoiceItemsSummary(updated.items, updated.productName || '22 Ayar Bilezik');
    if (updated.productName !== correctSummary) {
      updated.productName = correctSummary;
      changed = true;
    }
  }

  // 4. breakdown / invoiceBreakdown nesnesi varsa içindeki productName ve items'ı onar
  ['breakdown', 'invoiceBreakdown', 'vip22Breakdown'].forEach(key => {
    if (updated[key] && typeof updated[key] === 'object') {
      const bd = { ...updated[key] };
      if (bd.productName) {
        const cleaned = cleanInvoiceProductName(bd.productName);
        if (cleaned !== bd.productName) {
          bd.productName = cleaned;
          changed = true;
        }
      }
      if (Array.isArray(bd.items)) {
        bd.items = bd.items.map(it => {
          if (isPureLabor(it.name)) {
            return { ...it, name: 'İşçilik', malHizmet: 'İşçilik' };
          }
          const cName = cleanInvoiceProductName(it.name);
          return { ...it, name: cName, malHizmet: cName };
        });
      }
      updated[key] = bd;
    }
  });

  return { changed, order: updated };
}

module.exports = { healOrderRecord, isPureLabor };

if (require.main === module) {
  const sampleCorrupted = {
    orderId: 'BLG-TEST-CORRUPT',
    productName: '22 Ayar Bilezik (x1) + İşçilik (x1)',
    title: '22 Ayar Bilezik (x1) + İşçilik (x1)',
    items: [
      { name: '22 Ayar Bilezik (x1) + İşçilik (x1)', qty: 1 },
      { name: 'İşçilik (x1)', qty: 1 }
    ],
    breakdown: {
      productName: '22 Ayar Bilezik (x1) + İşçilik (x1)',
      items: [
        { name: '22 Ayar Bilezik (x1) + İşçilik (x1)', malHizmet: '22 Ayar Bilezik (x1) + İşçilik (x1)' },
        { name: 'İşçilik', malHizmet: 'İşçilik' }
      ]
    }
  };

  const { changed, order } = healOrderRecord(sampleCorrupted);
  console.log('Migration Test Changed:', changed);
  console.log('Healed productName:', order.productName);
  console.log('Healed item 0:', order.items[0].name);
  console.log('Healed item 1:', order.items[1].name);
  console.log('Healed breakdown productName:', order.breakdown.productName);
}
