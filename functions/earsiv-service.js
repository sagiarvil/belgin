/**
 * BELGIN KUYUMCULUK — GİB E-ARŞİV PORTAL ENTEGRASYON SERVİSİ
 * Kuyumculuk Özel Matrahı (KDV Kanunu 23/f - Has Altın %0 KDV + İşçilik %20 KDV)
 * SMS Onay Kodu ile Doğrulama ve İmzalama Modülü
 */

const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');

const GIB_PROD_URL = 'https://earsivportal.efatura.gov.tr/earsiv-services';
const GIB_TEST_URL = 'https://earsivportaltest.efatura.gov.tr/earsiv-services';

// 8 ADET 22 AYAR ALTIN SABİT ÜRÜN KATALOĞU VE LİNKLERİ
const VIP_22_CATALOG = Object.freeze([
  {
    id: '2734',
    name: '7 Gram 22 Ayar Ajda Altın Bilezik',
    reference: 'BLG-BLZ-110',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-110-2734/',
    basePrice: 45570,
    weight: 7.0,
    karat: 22
  },
  {
    id: '2669',
    name: 'Ata Tam Yeni 22 ayar',
    reference: 'BLG-ZYN-045',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-045-2669/',
    basePrice: 46107,
    weight: 7.216,
    karat: 22
  },
  {
    id: '2667',
    name: 'Ziynet Çeyrek Altın',
    reference: 'BLG-ZYN-043',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-043-2667/',
    basePrice: 11070,
    weight: 1.754,
    karat: 22
  },
  {
    id: '2670',
    name: 'Yarım Altın',
    reference: 'BLG-ZYN-046',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-046-2670/',
    basePrice: 22322,
    weight: 3.508,
    karat: 22
  },
  {
    id: '2668',
    name: 'Çeyrek Altın',
    reference: 'BLG-ZYN-044',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-044-2668/',
    basePrice: 11070,
    weight: 1.754,
    karat: 22
  },
  {
    id: '2741',
    name: '10 gr 22 Ayar Burma Altın Bilezik',
    reference: 'BLG-BLZ-117',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-117-2741/',
    basePrice: 65240,
    weight: 10.0,
    karat: 22
  },
  {
    id: '2748',
    name: '20 gr 22 Ayar Burma Altın Bilezik',
    reference: 'BLG-BLZ-124',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-124-2748/',
    basePrice: 130480,
    weight: 20.0,
    karat: 22
  },
  {
    id: '2753',
    name: '3\'lü Burma 25 gr 22 Ayar Altın Bilezik',
    reference: 'BLG-BLZ-129',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-129-2753/',
    basePrice: 163100,
    weight: 25.0,
    karat: 22
  }
]);

/**
 * /22 Kısayolu ve Akıllı Baremli 22 Ayar Özel Matrah Ayrıştırma Motoru
 * Web sitesindeki gerçek ürün fiyatlarına sadık kalır.
 * Fatura tutarı arttıkça katalogdaki 8 temel 22 ayar ürünümüzden (Ajda, Burma, Ata, Yarım, Çeyrek)
 * her seferinde dinamik ve çeşitli gerçek kuyumcu sepetleri oluşturur; kuruş farkını son üründe mikro fiyata yedirir.
 */
function calculateVip22Breakdown(totalAmount) {
  const total = Number(totalAmount) || 0;
  if (total <= 0) {
    throw new Error('Geçersiz fatura tutarı');
  }

  // %1.25 İşçilik ve %20 KDV Dahil
  const workmanshipTotal = Math.max(1, Math.round(total * 0.0125 * 100) / 100);
  const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
  const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
  const exactWorkmanshipGross = Math.round((workmanshipNet + workmanshipKdv) * 100) / 100;
  const goldNetPool = Math.round((total - exactWorkmanshipGross) * 100) / 100;

  // 8 Temel Ürünü Fiyat Kategorilerine Göre Dinamik Olarak Karıştır
  const bigs = VIP_22_CATALOG.filter(p => p.basePrice >= 100000).sort(() => 0.5 - Math.random());
  const meds = VIP_22_CATALOG.filter(p => p.basePrice >= 40000 && p.basePrice < 100000).sort(() => 0.5 - Math.random());
  const smalls = VIP_22_CATALOG.filter(p => p.basePrice < 40000).sort(() => 0.5 - Math.random());

  let rawBasket = [];
  let remainingPool = goldNetPool;

  if (goldNetPool < 30000) {
    // 1. BAREM (< 30.000 TL): 1 veya 2 adet küçük kalem (Çeyrek veya Yarım)
    const s1 = smalls[0];
    const q1 = Math.max(1, Math.round(goldNetPool / s1.basePrice));
    rawBasket.push({ prod: s1, qty: q1, unitPrice: s1.basePrice });
  } else if (goldNetPool < 100000) {
    // 2. BAREM (30.000 - 100.000 TL): 1 orta boy ürün + Çeyrek/Yarım
    const m1 = meds[0];
    const qM = Math.max(1, Math.floor((goldNetPool - 12000) / m1.basePrice));
    rawBasket.push({ prod: m1, qty: qM, unitPrice: m1.basePrice });
    remainingPool -= qM * m1.basePrice;

    if (remainingPool >= 20000 && Math.random() > 0.5) {
      const yarim = smalls.find(s => s.basePrice >= 20000);
      if (yarim && yarim.basePrice < remainingPool - 5000) {
        rawBasket.push({ prod: yarim, qty: 1, unitPrice: yarim.basePrice });
        remainingPool -= yarim.basePrice;
      }
    }

    const s1 = smalls.find(s => s.basePrice < 20000) || smalls[0];
    const qS = Math.max(1, Math.round(remainingPool / s1.basePrice));
    rawBasket.push({ prod: s1, qty: qS, unitPrice: s1.basePrice });
  } else if (goldNetPool < 250000) {
    // 3. BAREM (100.000 - 250.000 TL): Dinamik Karma (20gr Burma veya 1-2 Orta Boy + Yarım/Çeyrek)
    const useBig = Math.random() > 0.5 && bigs.some(b => b.basePrice <= goldNetPool * 0.65);
    if (useBig) {
      const b1 = bigs.find(b => b.basePrice <= goldNetPool * 0.65) || bigs[0];
      rawBasket.push({ prod: b1, qty: 1, unitPrice: b1.basePrice });
      remainingPool -= b1.basePrice;
    }

    const medCount = useBig ? 1 : (Math.random() > 0.5 ? 2 : 3);
    for (let i = 0; i < medCount && i < meds.length; i++) {
      const m = meds[i];
      const targetAmt = remainingPool * (i === 0 && !useBig ? 0.50 : 0.60);
      const q = Math.max(1, Math.floor(targetAmt / m.basePrice));
      if (q > 0 && q * m.basePrice < remainingPool - 5000) {
        rawBasket.push({ prod: m, qty: q, unitPrice: m.basePrice });
        remainingPool -= q * m.basePrice;
      }
    }

    if (remainingPool >= 20000 && Math.random() > 0.4) {
      const yarim = smalls.find(s => s.basePrice >= 20000);
      if (yarim && yarim.basePrice < remainingPool - 5000) {
        rawBasket.push({ prod: yarim, qty: 1, unitPrice: yarim.basePrice });
        remainingPool -= yarim.basePrice;
      }
    }

    const s1 = smalls.find(s => s.basePrice < 20000) || smalls[0];
    const qS = Math.max(1, Math.round(remainingPool / s1.basePrice));
    rawBasket.push({ prod: s1, qty: qS, unitPrice: s1.basePrice });
  } else {
    // 4. BAREM (>= 250.000 TL): 8 Ürünlük Havuzdan Zengin ve Çeşitlendirilmiş Sepet
    const availableBigs = [...bigs];
    const availableMeds = [...meds];
    const availableSmalls = [...smalls];

    const bigPickCount = goldNetPool >= 500000 ? 2 : (Math.random() > 0.3 ? 2 : 1);
    for (let i = 0; i < bigPickCount && availableBigs.length > 0; i++) {
      const b = availableBigs[i];
      const targetAmt = goldNetPool * (i === 0 ? 0.35 : 0.25);
      const q = Math.max(1, Math.floor(targetAmt / b.basePrice));
      if (q > 0 && q * b.basePrice < remainingPool - 30000) {
        rawBasket.push({ prod: b, qty: q, unitPrice: b.basePrice });
        remainingPool -= q * b.basePrice;
      }
    }

    const medPickCount = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < medPickCount && i < availableMeds.length; i++) {
      const m = availableMeds[i];
      const targetAmt = remainingPool * 0.45;
      const q = Math.max(1, Math.floor(targetAmt / m.basePrice));
      if (q > 0 && q * m.basePrice < remainingPool - 8000) {
        rawBasket.push({ prod: m, qty: q, unitPrice: m.basePrice });
        remainingPool -= q * m.basePrice;
      }
    }

    if (remainingPool >= 25000 && availableSmalls.some(s => s.basePrice >= 20000)) {
      const yarim = availableSmalls.find(s => s.basePrice >= 20000);
      const qY = Math.max(1, Math.floor((remainingPool - 10000) / yarim.basePrice));
      if (qY > 0) {
        rawBasket.push({ prod: yarim, qty: qY, unitPrice: yarim.basePrice });
        remainingPool -= qY * yarim.basePrice;
      }
    }

    const finalSmall = availableSmalls.find(s => s.basePrice < 20000) || availableSmalls[0];
    const qFinal = Math.max(1, Math.round(remainingPool / finalSmall.basePrice));
    rawBasket.push({ prod: finalSmall, qty: qFinal, unitPrice: finalSmall.basePrice });
  }

  // Satırları GİB e-Arşiv Standartlarına Göre Oluştur (Tüm farkı son ürüne mikro yedirerek %100 eşitlik sağla)
  const items = [];
  let calculatedGoldTotal = 0;

  for (let idx = 0; idx < rawBasket.length; idx++) {
    const bItem = rawBasket[idx];
    const isLast = idx === rawBasket.length - 1;

    if (!isLast) {
      const lineTotal = Math.round(bItem.qty * bItem.unitPrice * 100) / 100;
      calculatedGoldTotal = Math.round((calculatedGoldTotal + lineTotal) * 100) / 100;
      items.push({
        malHizmet: `${bItem.prod.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
        miktar: bItem.qty,
        birim: 'C62',
        birimFiyat: bItem.unitPrice.toFixed(2),
        fiyat: lineTotal.toFixed(2),
        iskontoArttirim: 'İskonto',
        iskontoOrani: 0,
        iskontoTutari: '0.00',
        iskontoNedeni: '',
        malHizmetTutari: lineTotal.toFixed(2),
        kdvOrani: 0,
        kdvTutari: '0.00',
        vergiOrani: 0,
        ozelMatrahNedeni: '351',
        ozelMatrahTutari: lineTotal.toFixed(2),
        tevkifatKodu: 0
      });
    } else {
      // Son ürün: Kalan tam farkı al
      const lastLineTotal = Math.round((goldNetPool - calculatedGoldTotal) * 100) / 100;
      const candidateUnit = Math.round((lastLineTotal / bItem.qty) * 100) / 100;
      const displayName = `${bItem.prod.name} (Kıymetli Maden Bedeli - Özel Matrah)`;

      if (Math.round(candidateUnit * bItem.qty * 100) === Math.round(lastLineTotal * 100)) {
        items.push({
          malHizmet: displayName,
          miktar: bItem.qty,
          birim: 'C62',
          birimFiyat: candidateUnit.toFixed(2),
          fiyat: lastLineTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: lastLineTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: lastLineTotal.toFixed(2),
          tevkifatKodu: 0
        });
      } else if (bItem.qty > 1) {
        const baseQty = bItem.qty - 1;
        const baseUnit = Math.floor((lastLineTotal / bItem.qty) * 100) / 100;
        const baseTotal = Math.round(baseQty * baseUnit * 100) / 100;
        const remTotal = Math.round((lastLineTotal - baseTotal) * 100) / 100;

        items.push({
          malHizmet: displayName,
          miktar: baseQty,
          birim: 'C62',
          birimFiyat: baseUnit.toFixed(2),
          fiyat: baseTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: baseTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: baseTotal.toFixed(2),
          tevkifatKodu: 0
        });

        items.push({
          malHizmet: displayName,
          miktar: 1,
          birim: 'C62',
          birimFiyat: remTotal.toFixed(2),
          fiyat: remTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: remTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: remTotal.toFixed(2),
          tevkifatKodu: 0
        });
      } else {
        items.push({
          malHizmet: displayName,
          miktar: 1,
          birim: 'C62',
          birimFiyat: lastLineTotal.toFixed(2),
          fiyat: lastLineTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: lastLineTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: lastLineTotal.toFixed(2),
          tevkifatKodu: 0
        });
      }
    }
  }

  // İşçilik Bedeli Satırı (%20 KDV dahil)
  items.push({
    malHizmet: 'İşçilik',
    miktar: 1,
    birim: 'C62',
    birimFiyat: workmanshipNet.toFixed(2),
    fiyat: workmanshipNet.toFixed(2),
    iskontoArttirim: 'İskonto',
    iskontoOrani: 0,
    iskontoTutari: '0.00',
    iskontoNedeni: '',
    malHizmetTutari: workmanshipNet.toFixed(2),
    kdvOrani: 20,
    kdvTutari: workmanshipKdv.toFixed(2),
    vergiOrani: 0,
    ozelMatrahNedeni: '',
    ozelMatrahTutari: 0,
    tevkifatKodu: 0
  });

  const totalMatrah = Math.round((goldNetPool + workmanshipNet) * 100) / 100;
  const finalGrandTotal = Math.round((totalMatrah + workmanshipKdv) * 100) / 100;

  return {
    isVip22: true,
    productName: items.filter(i => !i.malHizmet.includes('İşçilik')).map(i => `${i.malHizmet.split('(')[0].trim()} (x${i.miktar})`).join(' + '),
    hasGoldAmount: goldNetPool.toFixed(2),
    workmanshipNet: workmanshipNet.toFixed(2),
    workmanshipKdv: workmanshipKdv.toFixed(2),
    workmanshipTotal: exactWorkmanshipGross.toFixed(2),
    totalMatrah: totalMatrah.toFixed(2),
    totalKdv: workmanshipKdv.toFixed(2),
    grandTotal: finalGrandTotal.toFixed(2),
    items: items
  };
}

/**
 * Kuyumculuk Özel Matrah Ayrıştırma Motoru
 * Toplam tutarı Kıymetli Maden Bedeli (%0 KDV) ve İşçilik Bedeli (%20 KDV Dahil) olarak böler.
 * Faturada kuruş artıklarını ürüne yedirerek Fatura Tutarı = Sipariş Tutarı %100 eşitliğini garanti eder.
 */
function calculateJewelryInvoiceBreakdown(totalAmount, productName = 'Kuyumculuk Ürünü', options = {}) {
  const total = Number(totalAmount) || 0;
  if (total <= 0) {
    throw new Error('Geçersiz fatura tutarı');
  }

  const resolvedProductName = String(productName || 'Kuyumculuk Ürünü').trim();
  const is22 = options.isVip22 === true || resolvedProductName === '/22' || resolvedProductName.includes('/22');

  if (is22) {
    return calculateVip22Breakdown(total);
  }

  // Çoklu Kalem Desteği (Mağaza ve Sepet Kalemleri)
  if (Array.isArray(options.items) && options.items.length > 0) {
    let totalTaxableNet = 0;
    let totalKdv = 0;
    const taxableItems = [];
    const goldItems = [];

    options.items.forEach(it => {
      const itQty = Math.max(1, Number(it.qty || it.miktar || 1));
      const itPrice = Number(it.unitPrice || it.birimFiyat || 0);
      const itTotal = Math.round(Number(it.lineTotal || it.fiyat || it.malHizmetTutari || (itQty * itPrice)) * 100) / 100;
      const itName = String(it.name || it.malHizmet || it.title || 'Satış Kalemi').trim();
      
      const isWatch = (
        it.taxType === 'SAAT_STANDART' ||
        /\b(saat|watch|rolex|submariner|datejust|daytona|cartier|santos|patek|philippe|nautilus|audemars|piguet|royal oak|omega|speedmaster|seamaster|breitling|tag heuer|hublot|iwc|panerai|vacheron|seiko|tissot|longines|versace|calvin klein|michael kors|diesel|fossil|guess|welder|gc|citizen|orient|casio|chopard|zenith|montblanc)\b/i.test(itName) ||
        itName.toLowerCase().includes('saat') ||
        itName.toLowerCase().includes('rolex') ||
        itName.toLowerCase().includes('cartier') ||
        itName.toLowerCase().includes('patek') ||
        itName.toLowerCase().includes('audemars') ||
        itName.toLowerCase().includes('omega') ||
        itName.toLowerCase().includes('breitling') ||
        itName.toLowerCase().includes('tag heuer') ||
        itName.toLowerCase().includes('hublot') ||
        itName.toLowerCase().includes('iwc') ||
        itName.toLowerCase().includes('panerai') ||
        itName.toLowerCase().includes('vacheron') ||
        itName.toLowerCase().includes('seiko') ||
        itName.toLowerCase().includes('tissot') ||
        itName.toLowerCase().includes('longines')
      );

      let kdvRate = 0;
      if (isWatch) {
        kdvRate = 20;
      } else if (it.kdvRate !== undefined && it.kdvRate !== null && !isNaN(Number(it.kdvRate))) {
        kdvRate = Number(it.kdvRate);
      } else if (it.kdvOrani !== undefined && it.kdvOrani !== null && !isNaN(Number(it.kdvOrani))) {
        kdvRate = Number(it.kdvOrani);
      } else {
        kdvRate = (itName.toLowerCase().includes('işçilik')) ? 20 : 0;
      }

      if (kdvRate === 0) {
        goldItems.push({ name: itName, qty: itQty, unitPrice: itPrice, lineTotal: itTotal });
      } else {
        const netMatrah = Math.round((itTotal / (1 + (kdvRate / 100))) * 100) / 100;
        const kdvAmount = Math.round((itTotal - netMatrah) * 100) / 100;
        const unitNet = Math.round((netMatrah / itQty) * 100) / 100;
        totalTaxableNet = Math.round((totalTaxableNet + netMatrah) * 100) / 100;
        totalKdv = Math.round((totalKdv + kdvAmount) * 100) / 100;

        taxableItems.push({
          malHizmet: itName.toLowerCase().includes('işçilik') ? 'İşçilik' : itName,
          miktar: itQty,
          birim: 'C62',
          birimFiyat: unitNet.toFixed(2),
          fiyat: netMatrah.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: netMatrah.toFixed(2),
          kdvOrani: kdvRate,
          kdvTutari: kdvAmount.toFixed(2),
          vergiOrani: 0,
          ozelMatrahNedeni: '',
          ozelMatrahTutari: 0,
          tevkifatKodu: 0
        });
      }
    });

    // Eğer sipariş kuyumculuk ise ve hiç KDV'li işçilik satırı yoksa, standart %1.25 işçilik üret
    if (taxableItems.length === 0 && goldItems.length > 0) {
      const workmanshipTotal = Math.max(1, Math.round(total * 0.0125 * 100) / 100);
      const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
      const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
      totalTaxableNet = workmanshipNet;
      totalKdv = workmanshipKdv;

      taxableItems.push({
        malHizmet: 'İşçilik',
        miktar: 1,
        birim: 'C62',
        birimFiyat: workmanshipNet.toFixed(2),
        fiyat: workmanshipNet.toFixed(2),
        iskontoArttirim: 'İskonto',
        iskontoOrani: 0,
        iskontoTutari: '0.00',
        iskontoNedeni: '',
        malHizmetTutari: workmanshipNet.toFixed(2),
        kdvOrani: 20,
        kdvTutari: workmanshipKdv.toFixed(2),
        vergiOrani: 0,
        ozelMatrahNedeni: '',
        ozelMatrahTutari: 0,
        tevkifatKodu: 0
      });
    }

    const taxableGross = Math.round((totalTaxableNet + totalKdv) * 100) / 100;
    const requiredGoldTotal = Math.max(0, Math.round((total - taxableGross) * 100) / 100);

    const gibItems = [];
    let currentGoldSum = 0;

    if (goldItems.length > 0) {
      // İlk n-1 ürünü kendi fiyatıyla koy
      for (let i = 0; i < goldItems.length - 1; i++) {
        const gIt = goldItems[i];
        const lTotal = Math.round(gIt.qty * gIt.unitPrice * 100) / 100;
        currentGoldSum = Math.round((currentGoldSum + lTotal) * 100) / 100;
        const displayName = gIt.name.includes('Özel Matrah') ? gIt.name : `${gIt.name} (Kıymetli Maden Bedeli - Özel Matrah)`;

        gibItems.push({
          malHizmet: displayName,
          miktar: gIt.qty,
          birim: 'C62',
          birimFiyat: gIt.unitPrice.toFixed(2),
          fiyat: lTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: lTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: lTotal.toFixed(2),
          tevkifatKodu: 0
        });
      }

      // Son altın ürünü: Kalan tüm farkı (%100 eşit olacak şekilde) bu ürüne yedir
      const lastGold = goldItems[goldItems.length - 1];
      const lastLineTotal = Math.round((requiredGoldTotal - currentGoldSum) * 100) / 100;
      const displayName = lastGold.name.includes('Özel Matrah') ? lastGold.name : `${lastGold.name} (Kıymetli Maden Bedeli - Özel Matrah)`;

      const candidateUnit = Math.round((lastLineTotal / lastGold.qty) * 100) / 100;
      if (Math.round(candidateUnit * lastGold.qty * 100) === Math.round(lastLineTotal * 100)) {
        gibItems.push({
          malHizmet: displayName,
          miktar: lastGold.qty,
          birim: 'C62',
          birimFiyat: candidateUnit.toFixed(2),
          fiyat: lastLineTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: lastLineTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: lastLineTotal.toFixed(2),
          tevkifatKodu: 0
        });
      } else if (lastGold.qty > 1) {
        const baseQty = lastGold.qty - 1;
        const baseUnit = Math.floor((lastLineTotal / lastGold.qty) * 100) / 100;
        const baseTotal = Math.round(baseQty * baseUnit * 100) / 100;
        const remTotal = Math.round((lastLineTotal - baseTotal) * 100) / 100;

        items.push({
          malHizmet: displayName,
          miktar: baseQty,
          birim: 'C62',
          birimFiyat: baseUnit.toFixed(2),
          fiyat: baseTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: baseTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: baseTotal.toFixed(2),
          tevkifatKodu: 0
        });

        items.push({
          malHizmet: displayName,
          miktar: 1,
          birim: 'C62',
          birimFiyat: remTotal.toFixed(2),
          fiyat: remTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: remTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: remTotal.toFixed(2),
          tevkifatKodu: 0
        });
      } else {
        gibItems.push({
          malHizmet: displayName,
          miktar: 1,
          birim: 'C62',
          birimFiyat: lastLineTotal.toFixed(2),
          fiyat: lastLineTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: lastLineTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: lastLineTotal.toFixed(2),
          tevkifatKodu: 0
        });
      }
    }

    // KDV'li satırları ekle
    taxableItems.forEach(tIt => gibItems.push(tIt));

    const totalMatrah = Math.round((requiredGoldTotal + totalTaxableNet) * 100) / 100;
    const finalGrandTotal = Math.round((totalMatrah + totalKdv) * 100) / 100;

    return {
      productName: resolvedProductName,
      hasGoldAmount: requiredGoldTotal.toFixed(2),
      workmanshipNet: totalTaxableNet.toFixed(2),
      workmanshipKdv: totalKdv.toFixed(2),
      workmanshipTotal: taxableGross.toFixed(2),
      totalMatrah: totalMatrah.toFixed(2),
      totalKdv: totalKdv.toFixed(2),
      grandTotal: finalGrandTotal.toFixed(2),
      items: gibItems
    };
  }

  let hasGoldAmount = 0;
  let workmanshipTotal = 0; // KDV Dahil işçilik

  if (options.hasGoldAmount !== undefined && options.workmanshipAmount !== undefined) {
    hasGoldAmount = Number(options.hasGoldAmount) || 0;
    workmanshipTotal = Number(options.workmanshipAmount) || 0;
  } else {
    // Standart: %1.25 İşçilik, Kalan %98.75 Kıymetli Maden
    workmanshipTotal = Math.max(1, Math.round(total * 0.0125 * 100) / 100);
    hasGoldAmount = Math.round((total - workmanshipTotal) * 100) / 100;
  }

  // İşçilik KDV Ayrıştırması (%20 KDV)
  const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
  const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
  const exactWorkmanshipTotal = Math.round((workmanshipNet + workmanshipKdv) * 100) / 100;
  hasGoldAmount = Math.round((total - exactWorkmanshipTotal) * 100) / 100;

  // Toplam Matrah = Kıymetli Maden Bedeli (%0) + İşçilik Net Matrahı
  const totalMatrah = Math.round((hasGoldAmount + workmanshipNet) * 100) / 100;
  const totalKdv = workmanshipKdv;
  const grandTotal = Math.round((totalMatrah + totalKdv) * 100) / 100;

  return {
    productName: resolvedProductName,
    hasGoldAmount: hasGoldAmount.toFixed(2),
    workmanshipNet: workmanshipNet.toFixed(2),
    workmanshipKdv: workmanshipKdv.toFixed(2),
    workmanshipTotal: exactWorkmanshipTotal.toFixed(2),
    totalMatrah: totalMatrah.toFixed(2),
    totalKdv: totalKdv.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
    items: [
      {
        malHizmet: `${resolvedProductName} (Kıymetli Maden Bedeli - Özel Matrah)`,
        miktar: 1,
        birim: 'C62', // Adet
        birimFiyat: hasGoldAmount.toFixed(2),
        fiyat: hasGoldAmount.toFixed(2),
        iskontoArttirim: 'İskonto',
        iskontoOrani: 0,
        iskontoTutari: '0.00',
        iskontoNedeni: '',
        malHizmetTutari: hasGoldAmount.toFixed(2),
        kdvOrani: 0,
        kdvTutari: '0.00',
        vergiOrani: 0,
        ozelMatrahNedeni: '351', // Altından mamul eşya teslimleri (3065 sayılı KDV Kanunu 23/f)
        ozelMatrahTutari: hasGoldAmount.toFixed(2),
        tevkifatKodu: 0
      },
      {
        malHizmet: 'İşçilik',
        miktar: 1,
        birim: 'C62', // Adet
        birimFiyat: workmanshipNet.toFixed(2),
        fiyat: workmanshipNet.toFixed(2),
        iskontoArttirim: 'İskonto',
        iskontoOrani: 0,
        iskontoTutari: '0.00',
        iskontoNedeni: '',
        malHizmetTutari: workmanshipNet.toFixed(2),
        kdvOrani: 20,
        kdvTutari: workmanshipKdv.toFixed(2),
        vergiOrani: 0,
        ozelMatrahNedeni: '',
        ozelMatrahTutari: 0,
        tevkifatKodu: 0
      }
    ]
  };
}

const https = require('https');

// Singleton HTTP Agent: Socket ve IP tutarlılığını garanti eder
const gibAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 1,
  timeout: 30000
});

let cachedSessionToken = null;
let cachedCookie = '';
let cachedTokenExpiresAt = 0;

class EarsivPortalService {
  constructor(options = {}) {
    this.isTest = Boolean(options.isTest || process.env.GIB_IS_TEST === 'true');
    this.baseUrl = this.isTest ? GIB_TEST_URL : GIB_PROD_URL;
    this.userCode = options.userCode || process.env.GIB_USER_CODE || '77401902';
    this.password = options.password || process.env.GIB_PASSWORD || '627640';
    this.agent = gibAgent;
  }

  /**
   * Aktif / Önbellekteki GİB Tokenını Getir (Mükerrer Login Engelleme)
   */
  async getActiveToken() {
    const now = Date.now();
    if (cachedSessionToken && cachedTokenExpiresAt > now) {
      return { token: cachedSessionToken, cookie: cachedCookie };
    }
    const loginRes = await this.login();
    if (loginRes.token) {
      cachedSessionToken = loginRes.token;
      cachedCookie = loginRes.cookie || '';
      cachedTokenExpiresAt = now + 20 * 60 * 1000;
      return { token: cachedSessionToken, cookie: cachedCookie };
    }
    throw new Error('GİB token alınamadı.');
  }

  /**
   * GİB e-Arşiv Portalı Login Oturumu Aç
   */
  async login(userCode = this.userCode, password = this.password) {
    if (!userCode || !password) {
      return {
        success: true,
        isMock: true,
        token: 'MOCK_GIB_TOKEN_' + Date.now(),
        cookie: '',
        message: 'GİB Test Simülasyon Oturumu Açıldı'
      };
    }

    try {
      const payload = qs.stringify({
        assoscmd: this.isTest ? 'login' : 'anologin',
        rtype: 'json',
        userid: userCode,
        sifre: password,
        sifre2: password,
        parola: '1'
      });

      const res = await axios.post(`${this.baseUrl}/assos-login`, payload, {
        httpsAgent: this.agent,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'Referer': `${this.baseUrl}/intragiris.html`,
          'Origin': this.baseUrl.replace(/\/earsiv-services.*$/, ''),
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
      });

      const setCookie = res.headers['set-cookie'];
      let cookieStr = '';
      if (Array.isArray(setCookie)) {
        cookieStr = setCookie.map(c => c.split(';')[0]).join('; ');
      } else if (typeof setCookie === 'string') {
        cookieStr = setCookie.split(';')[0];
      }

      if (res.data && res.data.token) {
        cachedSessionToken = res.data.token;
        cachedCookie = cookieStr;
        cachedTokenExpiresAt = Date.now() + 20 * 60 * 1000;
        return {
          success: true,
          token: res.data.token,
          cookie: cookieStr,
          redirectUrl: res.data.redirectUrl || 'index.jsp'
        };
      }

      if (res.data && res.data.error) {
        const errorMsg = res.data.messages?.[0]?.text || res.data.error || 'GİB Giriş Başarısız';
        cachedSessionToken = null;
        cachedCookie = '';
        cachedTokenExpiresAt = 0;
        throw new Error(errorMsg);
      }

      throw new Error('GİB portalından oturum jetonu (token) alınamadı.');
    } catch (err) {
      cachedSessionToken = null;
      cachedCookie = '';
      cachedTokenExpiresAt = 0;
      console.error('[EarsivService] Login Hatası:', err.message);
      throw err;
    }
  }

  /**
   * GİB e-Arşiv Portalından Güvenli Çıkış Yap (Oturumu Kapat)
   */
  async logout(token = cachedSessionToken, cookie = cachedCookie) {
    if (!token || token.startsWith('MOCK_GIB_TOKEN')) {
      cachedSessionToken = null;
      cachedCookie = '';
      cachedTokenExpiresAt = 0;
      return { success: true };
    }

    try {
      const payloadAssos = qs.stringify({
        assoscmd: 'logout',
        rtype: 'json',
        token: token
      });

      const payloadDispatch = qs.stringify({
        cmd: 'logout',
        callid: crypto.randomUUID(),
        pageName: 'RG_KULLANICI_ISLEMLERI',
        token: token,
        jp: '{}'
      });

      const reqHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Referer': `${this.baseUrl}/index.jsp`
      };
      if (cookie) reqHeaders['Cookie'] = cookie;

      // Hem Assos Gateway hem de Portal Dispatch oturumunu aynı anda temizle
      await Promise.allSettled([
        axios.post(`${this.baseUrl}/assos-login`, payloadAssos, {
          httpsAgent: this.agent,
          headers: reqHeaders,
          timeout: 8000
        }),
        axios.post(`${this.baseUrl}/dispatch`, payloadDispatch, {
          httpsAgent: this.agent,
          headers: reqHeaders,
          timeout: 8000
        })
      ]);

      cachedSessionToken = null;
      cachedCookie = '';
      cachedTokenExpiresAt = 0;
      return { success: true };
    } catch (err) {
      cachedSessionToken = null;
      cachedCookie = '';
      cachedTokenExpiresAt = 0;
      return { success: false, error: err.message };
    }
  }

  /**
   * GİB e-Arşiv Taslak Fatura Oluştur
   */
  async createDraftInvoice(token, orderData, customBreakdown = null, options = {}) {
    if (!token) throw new Error('Oturum tokenı eksik');

    const invoiceUuid = crypto.randomUUID();
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const itemsSummary = (orderData.items && orderData.items.length > 0 && orderData.items[0]?.name)
      ? orderData.items.map(i => i.name || i.title).join(', ')
      : (orderData.productName || 'Kuyumculuk Ürünü');

    const resolvedTotal = Number(orderData.totalAmount || orderData.total || (orderData.payment && orderData.payment.amount) || (orderData.amountInKurus ? orderData.amountInKurus / 100 : 0) || 0);
    const breakdown = customBreakdown || calculateJewelryInvoiceBreakdown(resolvedTotal, itemsSummary);

    // Müşteri T.C. Kimlik No veya Vergi No kontrolü (Öncelik: customerIdentity, customer.identityNumber, customer.tckn, tc)
    const customerObj = (orderData && typeof orderData.customer === 'object' && orderData.customer !== null) ? orderData.customer : {};
    let vknTckn = String(orderData.customerIdentity || customerObj.identityNumber || customerObj.tckn || customerObj.vkn || customerObj.tc || customerObj.identity || '').replace(/\D/g, '');
    if (vknTckn.length !== 10 && vknTckn.length !== 11) {
      vknTckn = '11111111111'; // Nihai tüketici fallback
    }

    const rawCustName = String(orderData.customerName || customerObj.name || customerObj.fullName || 'Nihai Tüketici').trim();
    const nameParts = rawCustName.split(/\s+/);
    const aliciSoyadi = nameParts.length > 1 ? nameParts.pop() : '';
    const aliciAdi = nameParts.join(' ') || 'Sayın Müşteri';
    const customerAddress = orderData.customerAddress || customerObj.address || 'Menderes Cad. No:231/B Buca İzmir';
    const customerPhone = orderData.customerPhone || customerObj.phone || '';
    const customerEmail = orderData.customerEmail || customerObj.email || 'musteri@belginkuyumculuk.com';

    const invoicePayload = {
      belgeNumarasi: '',
      faturaTarihi: formattedDate,
      saat: formattedTime,
      paraBirimi: 'TRY',
      dovzTLkur: 0,
      faturaTipi: 'SATIS',
      hangiTip: '5000/30000',
      vknTckn: vknTckn,
      aliciUnvan: '',
      aliciAdi: aliciAdi,
      aliciSoyadi: aliciSoyadi,
      binaAdi: '',
      binaNo: '',
      kapiNo: '',
      kasabaKoy: '',
      vergiDairesi: '',
      ulke: 'Türkiye',
      bulvarcaddesokak: customerAddress,
      mahalleSemtIlce: 'Buca',
      sehir: 'İzmir',
      postaKodu: '',
      tel: customerPhone,
      fax: '',
      eposta: customerEmail,
      websitesi: 'https://www.belginkuyumculuk.com',
      iadeTable: [],
      ozelMatrahTutari: Number(breakdown.hasGoldAmount) || 0,
      vergiCesidi: 'SIFIR',
      malHizmetTable: breakdown.items.map(item => ({
        malHizmet: item.malHizmet,
        miktar: item.miktar || 1,
        birim: item.birim || 'C62',
        birimFiyat: Number(item.birimFiyat) || 0,
        fiyat: Number(item.fiyat) || 0,
        iskontoArttm: 'İskonto',
        iskontoOrani: 0,
        iskontoTutari: 0,
        iskontoNedeni: '',
        malHizmetTutari: Number(item.malHizmetTutari) || 0,
        kdvOrani: Number(item.kdvOrani) || 0,
        kdvTutari: Number(item.kdvTutari) || 0,
        vergiOrani: 0,
        ozelMatrahNedeni: item.ozelMatrahNedeni || (item.kdvOrani === 0 ? '351' : ''),
        ozelMatrahTutari: Number(item.ozelMatrahTutari) || (item.kdvOrani === 0 ? Number(item.fiyat) : 0),
        tevkifatKodu: 0
      })),
      matrah: Number(breakdown.totalMatrah) || 0,
      malhizmetToplamTutari: Number(breakdown.totalMatrah) || 0,
      toplamIskonto: 0,
      hesaplanankdv: Number(breakdown.totalKdv) || 0,
      vergilerToplami: Number(breakdown.totalKdv) || 0,
      vergilerDahilToplamTutar: Number(breakdown.grandTotal) || 0,
      toplamMasraflar: 0,
      odenecekTutar: Number(breakdown.grandTotal) || 0,
      not: `Sipariş No: ${orderData.orderId || ''} | 3065 sayılı KDV Kanununun 23/f maddesi uyarınca Özel Matrah uygulanmıştır. Belgin Kuyumculuk`,
      siparisNumarasi: '',
      siparisTarihi: '',
      irsaliyeNumarasi: '',
      irsaliyeTarihi: '',
      fisNo: '',
      fisTarihi: '',
      fisSaati: '',
      fisTipi: '',
      zRaporNo: '',
      okcSeriNo: '',
      tip: 'İskonto'
    };

    if (token.startsWith('MOCK_GIB_TOKEN')) {
      return {
        success: true,
        isMock: true,
        invoiceUuid,
        invoiceDate: formattedDate,
        invoiceTime: formattedTime,
        breakdown,
        invoicePayload,
        message: 'Taslak Fatura (GİB Test/Simülasyon Modunda) Başarıyla Oluşturuldu'
      };
    }

    try {
      const callid = crypto.randomUUID();
      const dispatchBody = qs.stringify({
        cmd: 'EARSIV_PORTAL_FATURA_OLUSTUR',
        callid: callid,
        pageName: 'RG_BASITFATURA',
        token: token,
        jp: JSON.stringify(invoicePayload)
      });

      const cookie = options.cookie || cachedCookie;
      const reqHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': `${this.baseUrl}/index.jsp`
      };
      if (cookie) reqHeaders['Cookie'] = cookie;

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        httpsAgent: this.agent,
        headers: reqHeaders,
        timeout: 20000
      });

      const responseText = String(res.data?.data || '');
      if (!responseText.includes('başarıyla')) {
        throw new Error(responseText || res.data?.messages?.[0]?.text || 'GİB Taslak Fatura oluşturulamadı.');
      }

      // GİB üzerinde oluşan gerçek ETTN ve Belge Numarasını RG_TASLAKLAR üzerinden çek
      let realEttn = invoiceUuid;
      let realBelgeNo = '';
      try {
        const listCall = await axios.post(`${this.baseUrl}/dispatch`, qs.stringify({
          cmd: 'EARSIV_PORTAL_TASLAKLARI_GETIR',
          callid: crypto.randomUUID(),
          pageName: 'RG_TASLAKLAR',
          token: token,
          jp: JSON.stringify({
            baslangic: formattedDate,
            bitis: formattedDate,
            hangiTip: '5000/30000'
          })
        }), {
          httpsAgent: this.agent,
          headers: reqHeaders,
          timeout: 15000
        });

        const list = listCall.data?.data;
        if (Array.isArray(list) && list.length > 0) {
          const match = list.find(d => d.aliciVknTckn === vknTckn) || list[list.length - 1];
          if (match) {
            realEttn = match.ettn || realEttn;
            realBelgeNo = match.belgeNumarasi || '';
          }
        }
      } catch (listErr) {
        console.warn('[EarsivService] Could not resolve ETTN from list:', listErr.message);
      }

      return {
        success: true,
        invoiceUuid: realEttn,
        invoiceNumber: realBelgeNo,
        invoiceDate: formattedDate,
        breakdown,
        result: responseText,
        message: 'Fatura taslağı GİB e-Arşiv sistemine başarıyla kaydedildi.'
      };
    } catch (err) {
      console.error('[EarsivService] Draft Invoice Error:', err.message);
      throw err;
    }
  }

  /**
   * GİB'den Cep Telefonuna SMS Onay Kodu Gönder
   */
  async sendSmsOtp(token, options = {}) {
    if (!token) throw new Error('Oturum tokenı eksik');

    if (token.startsWith('MOCK_GIB_TOKEN')) {
      return {
        success: true,
        isMock: true,
        message: 'SMS Doğrulama Kodu GİB sisteminde kayıtlı yetkili telefona gönderildi (Test Modunda: 123456 kullanabilirsiniz).'
      };
    }

    try {
      const cookie = options.cookie || cachedCookie;
      const reqHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': `${this.baseUrl}/index.jsp`
      };
      if (cookie) reqHeaders['Cookie'] = cookie;

      // 1. Önce GİB'den kayıtlı telefon numarasını çek
      let rawPhone = options.phone || '5419305272';
      try {
        const phoneDispatch = qs.stringify({
          cmd: 'EARSIV_PORTAL_TELEFONNO_SORGULA',
          callid: crypto.randomUUID(),
          pageName: 'RG_SMSONAY',
          token: token,
          jp: '{}'
        });
        const phoneRes = await axios.post(`${this.baseUrl}/dispatch`, phoneDispatch, {
          httpsAgent: this.agent,
          headers: reqHeaders,
          timeout: 10000
        });
        if (phoneRes.data?.data?.telefon || phoneRes.data?.data?.ceptel || phoneRes.data?.data?.telNo) {
          rawPhone = phoneRes.data.data.telefon || phoneRes.data.data.ceptel || phoneRes.data.data.telNo;
        }
      } catch (pErr) {
        console.warn('[EarsivService] Telefon sorgulama fallback:', pErr.message);
      }

      // Telefon numarasını standart 10 haneli (başında 0 olmadan: 5419305272) formata getir
      let ceptel = String(rawPhone).replace(/\D/g, '');
      if (ceptel.startsWith('90') && ceptel.length === 12) {
        ceptel = ceptel.slice(2);
      } else if (ceptel.startsWith('0') && ceptel.length === 11) {
        ceptel = ceptel.slice(1);
      }

      // 2. RG_SMSONAY ile gerçek SMS gönderimini tetikle
      const callid = crypto.randomUUID();
      const dispatchBody = qs.stringify({
        cmd: 'EARSIV_PORTAL_SMSSIFRE_GONDER',
        callid: callid,
        pageName: 'RG_SMSONAY',
        token: token,
        jp: JSON.stringify({
          SIFRE: '',
          CEPTEL: ceptel,
          KCEPTEL: false,
          TIP: ''
        })
      });

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        httpsAgent: this.agent,
        headers: reqHeaders,
        timeout: 15000
      });

      const oid = res.data?.data?.oid || res.data?.data?.OID || '';

      return {
        success: true,
        oid: oid,
        phone: ceptel,
        data: res.data,
        message: 'SMS Onay Kodu GİB yetkili cep telefonuna (' + ceptel + ') iletildi.'
      };
    } catch (err) {
      console.error('[EarsivService] Send SMS Error:', err.message);
      throw err;
    }
  }

  /**
   * Gelen SMS Kodunu Doğrula ve Faturayı İmzala (Onayla)
   */
  async verifySmsAndSign(token, smsCode, invoiceUuid, oid = '', options = {}) {
    if (!token || !smsCode || !invoiceUuid) {
      throw new Error('Eksik parametre: token, smsCode ve invoiceUuid zorunludur.');
    }

    const cleanSms = String(smsCode).trim();
    if (cleanSms.length < 4) {
      throw new Error('Geçersiz SMS onay kodu.');
    }

    if (token.startsWith('MOCK_GIB_TOKEN')) {
      const year = new Date().getFullYear();
      const mockInvoiceNo = `GIB${year}${Math.floor(100000000 + Math.random() * 900000000)}`;
      return {
        success: true,
        isMock: true,
        invoiceUuid,
        invoiceNumber: mockInvoiceNo,
        signedAt: new Date().toISOString(),
        message: `Fatura başarıyla imzalandı ve resmileşti. Belge No: ${mockInvoiceNo}`
      };
    }

    const cookie = options.cookie || cachedCookie;
    const reqHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': `${this.baseUrl}/index.jsp`
    };
    if (cookie) reqHeaders['Cookie'] = cookie;

    // GİB Resmi e-Arşiv SMS İmzalama Protokolü (Toplu & Tekil Destekli)
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    
    const uuidList = Array.isArray(invoiceUuid) ? invoiceUuid : [invoiceUuid];
    const dataArray = uuidList.map(item => {
      const ettn = typeof item === 'object' ? (item.ettn || item.invoiceUuid) : item;
      return {
        belgeTuru: 'FATURA',
        ettn: ettn,
        faturauuid: ettn,
        onayDurumu: 'Onaylanmadı',
        belgeTarihi: formattedDate
      };
    });

    const signPayload = {
      DATA: dataArray,
      SIFRE: cleanSms,
      OID: oid || '',
      OPR: 1
    };

    const signCommands = [
      {
        cmd: '0lhozfib5410mp',
        pageName: 'RG_SMSONAY',
        jp: signPayload
      },
      {
        cmd: '0lhozfib5410mp',
        pageName: 'RG_SMSONAY',
        jp: {
          DATA: dataArray.map(d => ({ belgeTuru: 'FATURA', ettn: d.ettn })),
          SIFRE: cleanSms,
          OID: oid || '',
          OPR: 1
        }
      },
      {
        cmd: 'EARSIV_PORTAL_SMSSIFRE_DOGRULA',
        pageName: 'RG_SMSONAY',
        jp: signPayload
      }
    ];

    let lastError = null;
    for (const item of signCommands) {
      try {
        const callid = crypto.randomUUID();
        const dispatchBody = qs.stringify({
          cmd: item.cmd,
          callid: callid,
          pageName: item.pageName,
          token: token,
          jp: JSON.stringify(item.jp)
        });

        const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
          httpsAgent: this.agent,
          headers: reqHeaders,
          timeout: 25000
        });

        const dataObj = res.data?.data;
        const rawResponseStr = JSON.stringify(res.data || '');
        const msgText = String(dataObj || res.data?.messages?.[0]?.text || '');
        const isAlreadySigned = rawResponseStr.includes('Onaylı faturalar tekrar onaylanamaz') || msgText.includes('Onaylı faturalar');

        if (msgText.includes('başarıyla') || msgText.includes('imzalanmıştır') || isAlreadySigned || (dataObj && (dataObj.sonuc === '1' || dataObj.sonuc === 1))) {
          let realBelgeNo = '';
          let officialHtml = '';

          try {
            const signedDetails = await this.getSignedInvoiceDetails(token, invoiceUuid, { cookie });
            if (signedDetails && signedDetails.belgeNumarasi) {
              realBelgeNo = signedDetails.belgeNumarasi;
            }
          } catch (_) {}

          try {
            officialHtml = await this.getInvoiceHtml(token, invoiceUuid, { cookie });
          } catch (_) {}

          return {
            success: true,
            invoiceUuid,
            invoiceNumber: realBelgeNo || options.invoiceNumber || dataObj?.faturaNo || dataObj?.belgeNo || '',
            officialHtml: officialHtml || null,
            signedAt: new Date().toISOString(),
            data: dataObj,
            message: isAlreadySigned 
              ? `Fatura daha önce GİB Portalında resmi olarak onaylanmıştır. Belge No: ${realBelgeNo || 'Onaylı Belge'}`
              : `Fatura GİB e-Arşiv Portalında resmi olarak imzalandı. Belge No: ${realBelgeNo || 'Onaylandı'}`
          };
        }

        if (res.data?.messages?.[0]?.text) {
          lastError = new Error(res.data.messages[0].text);
          continue;
        } else if (res.data?.data) {
          const errMsg = typeof res.data.data === 'object' 
            ? (res.data.data.msg || res.data.data.mesaj || res.data.data.text || JSON.stringify(res.data.data))
            : String(res.data.data);
          lastError = new Error(errMsg);
          continue;
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error('SMS kodu doğrulanamadı veya imzalama başarısız oldu.');
  }

  /**
   * İmzalanan Faturanın GİB Sistemindeki Resmi Belge Numarasını (Örn: GIB2026000000014) Sorgula
   */
  async getSignedInvoiceDetails(token, invoiceUuid, options = {}) {
    if (!token || !invoiceUuid) return null;
    if (token.startsWith('MOCK_GIB_TOKEN')) {
      return {
        belgeNumarasi: `GIB${new Date().getFullYear()}000000001`,
        ettn: invoiceUuid,
        onayDurumu: 'Onaylandı'
      };
    }

    try {
      const cookie = options.cookie || cachedCookie;
      const reqHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': `${this.baseUrl}/index.jsp`
      };
      if (cookie) reqHeaders['Cookie'] = cookie;

      const d = new Date();
      const formattedDate = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();

      const listCall = await axios.post(`${this.baseUrl}/dispatch`, qs.stringify({
        cmd: 'EARSIV_PORTAL_TASLAKLARI_GETIR',
        callid: crypto.randomUUID(),
        pageName: 'RG_TASLAKLAR',
        token: token,
        jp: JSON.stringify({
          baslangic: formattedDate,
          bitis: formattedDate,
          hangiTip: '5000/30000'
        })
      }), {
        httpsAgent: this.agent,
        headers: reqHeaders,
        timeout: 15000
      });

      const list = listCall.data?.data;
      if (Array.isArray(list) && list.length > 0) {
        const found = list.find(item => item.ettn === invoiceUuid || item.faturauuid === invoiceUuid);
        if (found) {
          return {
            belgeNumarasi: found.belgeNumarasi || found.faturaNo || '',
            ettn: found.ettn || invoiceUuid,
            alici: found.aliciUnvanAdSoyad || '',
            tarih: found.belgeTarihi || '',
            onayDurumu: found.onayDurumu || 'Onaylandı'
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('[EarsivService] getSignedInvoiceDetails error:', err.message);
      return null;
    }
  }

  /**
   * İmzalanmış Faturanın GİB Orijinal HTML Görünümünü Al
   */
  async getInvoiceHtml(token, invoiceUuid, options = {}) {
    if (!token || !invoiceUuid) throw new Error('Eksik parametre');
    if (token.startsWith('MOCK_GIB_TOKEN')) return null;

    try {
      const cookie = options.cookie || cachedCookie;
      const reqHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Referer': `${this.baseUrl}/index.jsp`
      };
      if (cookie) reqHeaders['Cookie'] = cookie;

      const callid = crypto.randomUUID();
      const dispatchBody = qs.stringify({
        cmd: 'EARSIV_PORTAL_FATURA_GOSTER',
        callid: callid,
        pageName: 'RG_TASLAKLAR',
        token: token,
        jp: JSON.stringify({ ettn: invoiceUuid, faturauuid: invoiceUuid, onayDurumu: 'Onaylandı' })
      });

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        httpsAgent: this.agent,
        headers: reqHeaders,
        timeout: 15000
      });

      const htmlContent = res.data?.data;
      if (typeof htmlContent === 'string' && htmlContent.includes('<html')) {
        return htmlContent;
      }
      return null;
    } catch (err) {
      console.warn('[EarsivService] View HTML Error:', err.message);
      return null;
    }
  }
}

module.exports = {
  EarsivPortalService,
  calculateJewelryInvoiceBreakdown,
  calculateVip22Breakdown,
  VIP_22_CATALOG
};
