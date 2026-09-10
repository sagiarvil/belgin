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

/// 22 AYAR BİLEZİK — /22 KISAYOLU İÇİN TEK VE DEĞİŞMEZ ÜRÜN

/**
 * Fatura Ürün Adı Temizleyici ve Standardizasyon Motoru
 * '(x1) + İşçilik (x1)', '(x1)', '+ İşçilik' gibi satır kirliliklerini kalıcı olarak arındırır.
 * Faturada ürün adının münhasıran ve net olarak görünmesini sağlar.
 */

function isLaborItemName(name) {
  if (!name || typeof name !== 'string') return false;
  return /[iİıI][şs][çc][iİıI]l[iİıI]k/i.test(name);
}

function cleanInvoiceProductName(name, fallback = '22 Ayar Bilezik') {
  if (!name || typeof name !== 'string') return fallback;
  let clean = name.trim();
  if (!clean || clean === '/22' || clean === '22' || clean === '#22') return fallback;

  // 1. '+ İşçilik...' veya ', İşçilik...' uzantılarını kaldır
  clean = clean.replace(/[+,]\s*[iİıI][şs][çc][iİıI]l[iİıI]k[^\+,]*/gi, '');
  // 2. 'İşçilik (x1)' veya bağımsız 'İşçilik' kaldır
  clean = clean.replace(/[iİıI][şs][çc][iİıI]l[iİıI]k\s*\([xX]?\d+[^)]*\)/gi, '');
  clean = clean.replace(/(?:^|\s)[iİıI][şs][çc][iİıI]l[iİıI]k(?:\s|$)/gi, ' ');

  // 3. '(x1)', '(x2)', 'x1' gibi adet takılarını kaldır
  clean = clean.replace(/\s*\([xX]\d+(\.\d+)?\)/gi, '');
  clean = clean.replace(/\s*[xX]\d+\b/gi, '');

  // 4. Parantez içindeki özel matrah ibarelerini temizle
  clean = clean.replace(/\s*\(Kıymetli Maden Bedeli\s*-\s*Özel Matrah\)/gi, '');
  clean = clean.replace(/\s*\(Özel Matrah\s*351\)/gi, '');
  clean = clean.replace(/\s*\(Özel Matrah\)/gi, '');

  // 5. Kenar işaretlerini ve fazla boşlukları temizle
  clean = clean.replace(/^[\s,\+\-]+|[\s,\+\-]+$/g, '').replace(/\s+/g, ' ').trim();

  // Eğer geriye sadece geçersiz bir metin kaldıysa fallback dön
  if (!clean || /^[iİıI][şs][çc][iİıI]l[iİıI]k$/i.test(clean)) {
    return fallback;
  }
  return clean;
}

function getCleanInvoiceItemsSummary(items, fallback = '22 Ayar Bilezik') {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  const isLabor = (name) => /[iİıI][şs][çc][iİıI]l[iİıI]k/i.test(String(name || ''));
  const realItems = items.filter(i => !isLabor(i.name) && !isLabor(i.malHizmet) && !isLabor(i.title));
  const targetItems = realItems.length > 0 ? realItems : items;
  const names = targetItems
    .map(i => cleanInvoiceProductName(i.name || i.malHizmet || i.title))
    .filter(name => Boolean(name) && !isLabor(name));
  return names.length > 0 ? names.join(', ') : fallback;
}

const VIP_22_CATALOG = Object.freeze([
  {
    id: '22-ayar-bilezik',
    name: '22 Ayar Bilezik',
    reference: 'BLG-BLZ-22K',
    url: 'https://www.belginkuyumculuk.com/urun/22-ayar-bilezik/',
    basePrice: 65000,
    karat: 22,
    priceKey: 'gramGold22k'
  }
]);

/**
 * /22 Kısayolu ve 22 Ayar Bilezik Özel Matrah Ayrıştırma Motoru
 * VIP link ve siparişlerde /22 kısayolu kullanıldığında istisnasız ve yalnızca "22 Ayar Bilezik" üretir.
 * Toplam tutarı Kıymetli Maden Bedeli (%0 KDV Özel Matrah) ve %1.25 İşçilik Bedeli (%20 KDV) olarak ayrıştırır.
 */
function calculateVip22Breakdown(totalAmount, customProductName = '') {
  const total = Number(totalAmount) || 0;
  if (total <= 0) {
    throw new Error('Geçersiz fatura tutarı');
  }

  const cleanProdName = cleanInvoiceProductName(customProductName, '22 Ayar Bilezik');
  const malHizmetDesc = cleanProdName;

  // %1.25 İşçilik ve %20 KDV Dahil
  const workmanshipTotal = Math.max(1, Math.round(total * 0.0125 * 100) / 100);
  const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
  const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
  const exactWorkmanshipGross = Math.round((workmanshipNet + workmanshipKdv) * 100) / 100;
  const goldNetPool = Math.round((total - exactWorkmanshipGross) * 100) / 100;

  const items = [
    {
      id: '22-ayar-bilezik',
      name: cleanProdName,
      malHizmet: malHizmetDesc,
      miktar: 1,
      qty: 1,
      birim: 'C62',
      birimFiyat: goldNetPool.toFixed(2),
      unitPrice: goldNetPool,
      fiyat: goldNetPool.toFixed(2),
      lineTotal: goldNetPool,
      iskontoArttirim: 'İskonto',
      iskontoOrani: 0,
      iskontoTutari: '0.00',
      iskontoNedeni: '',
      malHizmetTutari: goldNetPool.toFixed(2),
      kdvOrani: 0,
      kdvRate: 0,
      kdvTutari: '0.00',
      vatAmount: 0,
      vergiOrani: 0,
      ozelMatrahNedeni: '351',
      ozelMatrahTutari: goldNetPool.toFixed(2),
      tevkifatKodu: 0
    },
    {
      id: 'WORKMANSHIP-22K',
      name: 'İşçilik',
      malHizmet: 'İşçilik',
      miktar: 1,
      qty: 1,
      birim: 'C62',
      birimFiyat: workmanshipNet.toFixed(2),
      unitPrice: workmanshipNet,
      fiyat: workmanshipNet.toFixed(2),
      lineTotal: workmanshipNet,
      iskontoArttirim: 'İskonto',
      iskontoOrani: 0,
      iskontoTutari: '0.00',
      iskontoNedeni: '',
      malHizmetTutari: workmanshipNet.toFixed(2),
      kdvOrani: 20,
      kdvRate: 20,
      kdvTutari: workmanshipKdv.toFixed(2),
      vatAmount: workmanshipKdv,
      vergiOrani: 0,
      ozelMatrahNedeni: '',
      ozelMatrahTutari: 0,
      tevkifatKodu: 0
    }
  ];

  const totalMatrah = Math.round((goldNetPool + workmanshipNet) * 100) / 100;
  const finalGrandTotal = Math.round((totalMatrah + workmanshipKdv) * 100) / 100;

  return {
    isVip22: true,
    tag: '/22',
    productName: cleanProdName,
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

  const resolvedProductName = cleanInvoiceProductName(productName, 'Kuyumculuk Ürünü');
  const is22 = (options.isVip22 === true || resolvedProductName === '/22' || resolvedProductName.includes('/22')) && (!options.items || options.items.length === 0);

  if (is22) {
    return calculateVip22Breakdown(total, resolvedProductName);
  }

  // Çoklu Kalem Desteği (Mağaza ve Sepet Kalemleri)
  if (Array.isArray(options.items) && options.items.length > 0) {
    let totalTaxableNet = 0;
    let totalKdv = 0;
    const taxableItems = [];
    const goldItems = [];

    options.items.forEach(it => {
      const itQty = Math.max(1, Number(it.qty || it.quantity || it.miktar || 1));
      let itPrice = Number(it.unitPrice || it.birimFiyat || it.price || 0);
      let itTotal = Math.round(Number(it.lineTotal || it.fiyat || it.malHizmetTutari || it.total || (itQty * itPrice)) * 100) / 100;
      const itName = String(it.name || it.malHizmet || it.title || 'Satış Kalemi').trim();

      if (itPrice === 0 && itTotal > 0) {
        itPrice = Math.round((itTotal / itQty) * 100) / 100;
      }
      if (itTotal === 0 && itPrice > 0) {
        itTotal = Math.round((itPrice * itQty) * 100) / 100;
      }
      if (itPrice === 0 && itTotal === 0) {
        const matched = VIP_22_CATALOG.find(c => itName.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(itName.toLowerCase()));
        if (matched) {
          itPrice = matched.basePrice;
          itTotal = Math.round(itPrice * itQty * 100) / 100;
        }
      }
      
      const itNameLower = itName.toLowerCase();
      const isWatch = (it.taxType === 'SAAT_STANDART') || (
        !itNameLower.includes('altın') &&
        !itNameLower.includes('ziynet') &&
        !itNameLower.includes('bilezik') &&
        !itNameLower.includes('özel matrah') &&
        !itNameLower.includes('kuyumculuk') &&
        !itNameLower.includes('mücevherat') &&
        (
          /\b(rolex|submariner|datejust|daytona|cartier|santos|patek|philippe|nautilus|audemars|piguet|royal oak|omega|speedmaster|seamaster|breitling|tag heuer|hublot|iwc|panerai|vacheron|seiko|tissot|longines|versace|calvin klein|michael kors|diesel|fossil|guess|welder|gc|citizen|orient|casio|chopard|zenith|montblanc)\b/i.test(itName) ||
          itNameLower.includes('kol saati') ||
          itNameLower.startsWith('saat ') ||
          itNameLower.endsWith(' saat') ||
          itNameLower === 'saat'
        )
      );

      let kdvRate = 0;
      if (isWatch) {
        kdvRate = 20;
      } else if (it.kdvRate !== undefined && it.kdvRate !== null && !isNaN(Number(it.kdvRate))) {
        kdvRate = Number(it.kdvRate);
      } else if (it.kdvOrani !== undefined && it.kdvOrani !== null && !isNaN(Number(it.kdvOrani))) {
        kdvRate = Number(it.kdvOrani);
      } else {
        kdvRate = isLaborItemName(itName) ? 20 : 0;
      }

      if (kdvRate === 0) {
        goldItems.push({ name: itName, qty: itQty, unitPrice: itPrice, lineTotal: itTotal });
      } else {
        let netMatrah = 0;
        let kdvAmount = 0;
        const explicitKdv = Number(it.kdvAmount || it.kdvTutari || it.vatAmount || 0);

        if (explicitKdv > 0 && Math.abs(Math.round(itTotal * (kdvRate / 100) * 100) / 100 - explicitKdv) <= 0.05) {
          // itTotal zaten KDV hariç Net Matrah olarak iletilmiş (çifte 1.20 bölmesini önle)
          netMatrah = itTotal;
          kdvAmount = explicitKdv;
        } else {
          // itTotal KDV dahil brüt tutar olarak iletilmiş, KDV'yi ayrıştır
          netMatrah = Math.round((itTotal / (1 + (kdvRate / 100))) * 100) / 100;
          kdvAmount = Math.round((itTotal - netMatrah) * 100) / 100;
        }

        const unitNet = Math.round((netMatrah / itQty) * 100) / 100;
        totalTaxableNet = Math.round((totalTaxableNet + netMatrah) * 100) / 100;
        totalKdv = Math.round((totalKdv + kdvAmount) * 100) / 100;

        taxableItems.push({
          name: isLaborItemName(itName) ? 'İşçilik' : itName,
          malHizmet: isLaborItemName(itName) ? 'İşçilik' : itName,
          miktar: itQty,
          qty: itQty,
          birim: 'C62',
          birimFiyat: unitNet.toFixed(2),
          unitPrice: unitNet,
          fiyat: netMatrah.toFixed(2),
          lineTotal: netMatrah,
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: netMatrah.toFixed(2),
          kdvOrani: kdvRate,
          kdvRate: kdvRate,
          kdvTutari: kdvAmount.toFixed(2),
          vatAmount: kdvAmount,
          vergiOrani: 0,
          ozelMatrahNedeni: '',
          ozelMatrahTutari: 0,
          tevkifatKodu: 0
        });
      }
    });

    // Eğer sipariş e-ticaret kuyumculuk ise ve hiç KDV'li işçilik satırı yoksa, standart %1.25 işçilik üret (Mağaza ve serbest faturalarda kullanıcının belirlediği kalemler aynen korunur)
    if (!options.isStoreManual && !options.exactItems && !options.skipAutoLabor && taxableItems.length === 0 && goldItems.length > 0) {
      const workmanshipTotal = Math.max(1, Math.round(total * 0.0125 * 100) / 100);
      const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
      const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
      totalTaxableNet = workmanshipNet;
      totalKdv = workmanshipKdv;

      taxableItems.push({
        name: 'İşçilik',
        malHizmet: 'İşçilik',
        miktar: 1,
        qty: 1,
        birim: 'C62',
        birimFiyat: workmanshipNet.toFixed(2),
        unitPrice: workmanshipNet,
        fiyat: workmanshipNet.toFixed(2),
        lineTotal: workmanshipNet,
        iskontoArttirim: 'İskonto',
        iskontoOrani: 0,
        iskontoTutari: '0.00',
        iskontoNedeni: '',
        malHizmetTutari: workmanshipNet.toFixed(2),
        kdvOrani: 20,
        kdvRate: 20,
        kdvTutari: workmanshipKdv.toFixed(2),
        vatAmount: workmanshipKdv,
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
    const rawGoldSum = goldItems.reduce((acc, g) => acc + g.lineTotal, 0);

    if (goldItems.length > 0) {
      for (let i = 0; i < goldItems.length; i++) {
        const gIt = goldItems[i];
        const isLast = i === goldItems.length - 1;
        let lTotal = 0;

        if (rawGoldSum > 0 && Math.abs(rawGoldSum - requiredGoldTotal) > 0.01) {
          lTotal = isLast 
            ? Math.round((requiredGoldTotal - currentGoldSum) * 100) / 100 
            : Math.round((requiredGoldTotal * (gIt.lineTotal / rawGoldSum)) * 100) / 100;
        } else if (rawGoldSum === 0) {
          lTotal = isLast 
            ? Math.round((requiredGoldTotal - currentGoldSum) * 100) / 100 
            : Math.round((requiredGoldTotal / goldItems.length) * 100) / 100;
        } else {
          lTotal = isLast 
            ? Math.round((requiredGoldTotal - currentGoldSum) * 100) / 100 
            : gIt.lineTotal;
        }

        currentGoldSum = Math.round((currentGoldSum + lTotal) * 100) / 100;
        const uPrice = Math.round((lTotal / gIt.qty) * 100) / 100;
        const displayName = cleanInvoiceProductName(gIt.name);

        gibItems.push({
          name: displayName,
          malHizmet: displayName,
          miktar: gIt.qty,
          qty: gIt.qty,
          birim: 'C62',
          birimFiyat: uPrice.toFixed(2),
          unitPrice: uPrice,
          fiyat: lTotal.toFixed(2),
          lineTotal: lTotal,
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: lTotal.toFixed(2),
          kdvOrani: 0,
          kdvRate: 0,
          kdvTutari: '0.00',
          vatAmount: 0,
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: lTotal.toFixed(2),
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
  } else if (options.isStoreManual || options.exactItems || options.skipAutoLabor) {
    hasGoldAmount = total;
    workmanshipTotal = 0;
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

  const resItems = [
    {
      name: resolvedProductName,
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
    }
  ];

  if (workmanshipTotal > 0) {
    resItems.push({
      name: 'İşçilik',
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
    });
  }

  return {
    productName: resolvedProductName,
    hasGoldAmount: hasGoldAmount.toFixed(2),
    workmanshipNet: workmanshipNet.toFixed(2),
    workmanshipKdv: workmanshipKdv.toFixed(2),
    workmanshipTotal: exactWorkmanshipTotal.toFixed(2),
    totalMatrah: totalMatrah.toFixed(2),
    totalKdv: totalKdv.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
    items: resItems
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
      ? getCleanInvoiceItemsSummary(orderData.items, cleanInvoiceProductName(orderData.productName))
      : cleanInvoiceProductName(orderData.productName || '22 Ayar Bilezik');

    const resolvedTotal = Number(orderData.totalAmount || orderData.total || (orderData.payment && orderData.payment.amount) || (orderData.amountInKurus ? orderData.amountInKurus / 100 : 0) || 0);
    const breakdown = customBreakdown || calculateJewelryInvoiceBreakdown(resolvedTotal, itemsSummary);

    // Müşteri T.C. Kimlik No veya Vergi No kontrolü (Öncelik: customerIdentity, customer.identityNumber, customer.tckn, tc, vkn, taxNumber)
    const customerObj = (orderData && typeof orderData.customer === 'object' && orderData.customer !== null) ? orderData.customer : {};
    let vknTckn = String(orderData.customerIdentity || customerObj.identityNumber || customerObj.tckn || customerObj.vkn || customerObj.tc || customerObj.identity || orderData.vkn || orderData.taxNumber || '').replace(/\D/g, '');
    if (vknTckn.length !== 10 && vknTckn.length !== 11) {
      vknTckn = '11111111111'; // Nihai tüketici fallback
    }

    const isCompanyVkn = (vknTckn.length === 10);
    const companyTitle = String(orderData.companyName || customerObj.companyName || orderData.unvan || customerObj.unvan || orderData.company || '').trim();
    const rawCustName = String(orderData.customerName || customerObj.name || customerObj.fullName || (isCompanyVkn ? companyTitle : '') || 'Nihai Tüketici').trim();
    const taxOffice = String(orderData.taxOffice || customerObj.taxOffice || orderData.vergiDairesi || customerObj.vergiDairesi || '').trim();

    let aliciUnvan = '';
    let aliciAdi = '';
    let aliciSoyadi = '';

    if (isCompanyVkn) {
      // 10 Haneli VKN = Kurumsal / Şirket Faturası
      // GİB e-Arşiv sisteminde 10 haneli VKN için aliciUnvan zorunludur. aliciAdi ve aliciSoyadi boş olmalıdır.
      aliciUnvan = (companyTitle || rawCustName || 'Kurumsal Müşteri').trim();
      if (!aliciUnvan || aliciUnvan === 'Nihai Tüketici') {
        aliciUnvan = 'Kurumsal Müşteri';
      }
      aliciAdi = '';
      aliciSoyadi = '';
    } else {
      // 11 Haneli TCKN = Bireysel veya Şahıs İşletmesi
      if (companyTitle) {
        aliciUnvan = companyTitle;
      }
      const nameParts = rawCustName.split(/\s+/);
      aliciSoyadi = nameParts.length > 1 ? nameParts.pop() : '';
      aliciAdi = nameParts.join(' ') || 'Sayın Müşteri';
    }

    const rawAddress = String(orderData.customerAddress || customerObj.address || '').trim();
    const customerAddress = (rawAddress && rawAddress !== '—' && !rawAddress.includes('Yok')) ? rawAddress : 'Menderes Cad. No:231/B Buca İzmir';
    const customerPhone = orderData.customerPhone || customerObj.phone || '';
    const customerEmail = orderData.customerEmail || customerObj.email || '';
    let customerWebsite = String(orderData.customerWebsite || customerObj.website || '').trim();
    if (customerWebsite.toLowerCase().includes('belginkuyumculuk.com')) {
      customerWebsite = '';
    }

    // İl ve İlçe Çıkarımı (Konya gibi şehirlerin Buca/İzmir olarak basılmasını engeller)
    const citiesList = [
      'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan',
      'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis',
      'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce',
      'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane',
      'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük',
      'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis',
      'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
      'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
      'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van',
      'Yalova', 'Yozgat', 'Zonguldak'
    ];

    let resolvedCity = orderData.city || customerObj.city || '';
    let resolvedDistrict = orderData.district || customerObj.district || '';

    if (!resolvedCity && customerAddress) {
      const upperAddr = customerAddress.toLocaleUpperCase('tr-TR');
      for (const c of citiesList) {
        const cUpper = c.toLocaleUpperCase('tr-TR');
        const reg = new RegExp(`(?:[/\\s,-]|^)${cUpper}(?:[/\\s,-]|$)`, 'i');
        if (reg.test(upperAddr)) {
          resolvedCity = c;
          break;
        }
      }
    }

    if (resolvedCity && !resolvedDistrict && customerAddress) {
      const cUpper = resolvedCity.toLocaleUpperCase('tr-TR');
      const slashReg = new RegExp(`([A-ZÇĞİÖŞÜa-zçğıöşü]+)\\s*[/\\\\]\\s*${cUpper}`, 'i');
      const m = customerAddress.match(slashReg);
      if (m && m[1]) {
        const rawDist = m[1].trim();
        resolvedDistrict = rawDist.charAt(0).toLocaleUpperCase('tr-TR') + rawDist.slice(1).toLocaleLowerCase('tr-TR');
      }
    }

    if (!resolvedCity) resolvedCity = 'İzmir';
    if (!resolvedDistrict) resolvedDistrict = (resolvedCity === 'İzmir' ? 'Buca' : 'Merkez');

    const invoicePayload = {
      belgeNumarasi: '',
      faturaTarihi: formattedDate,
      saat: formattedTime,
      paraBirimi: 'TRY',
      dovzTLkur: 0,
      faturaTipi: 'SATIS',
      hangiTip: '5000/30000',
      vknTckn: vknTckn,
      aliciUnvan: aliciUnvan,
      aliciAdi: aliciAdi,
      aliciSoyadi: aliciSoyadi,
      binaAdi: '',
      binaNo: '',
      kapiNo: '',
      kasabaKoy: '',
      vergiDairesi: taxOffice,
      ulke: 'Türkiye',
      bulvarcaddesokak: customerAddress,
      mahalleSemtIlce: resolvedDistrict,
      sehir: resolvedCity,
      postaKodu: '',
      tel: customerPhone,
      fax: '',
      eposta: customerEmail,
      websitesi: customerWebsite,
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

    // Sert Değişmez Güvenlik Katmanı: 10 haneli VKN durumunda aliciUnvan ASLA boş olamaz, ad/soyad boş olmalıdır.
    if (String(invoicePayload.vknTckn || '').replace(/\D/g, '').length === 10) {
      if (!invoicePayload.aliciUnvan || !invoicePayload.aliciUnvan.trim() || invoicePayload.aliciUnvan === 'Nihai Tüketici') {
        invoicePayload.aliciUnvan = 'Kurumsal Müşteri';
      }
      invoicePayload.aliciAdi = '';
      invoicePayload.aliciSoyadi = '';
    }

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
      const mockInvoiceNo = `GIB${year}${crypto.randomInt ? crypto.randomInt(100000000, 1000000000) : (Date.now() % 900000000 + 100000000)}`;
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

  /**
   * GİB e-Arşiv Portalından Faturayı İptal Et / Sil
   */
  async cancelInvoice(token, { invoiceUuid, invoiceNumber = '', reason = 'Hatalı Fatura / İptal Talebi', options = {} }) {
    if (!token) throw new Error('Oturum tokenı zorunludur.');
    if (!invoiceUuid) throw new Error('İptal edilecek fatura UUID (ETTN) zorunludur.');
    if (!reason || String(reason).trim().length === 0) throw new Error('İptal gerekçesi yazılması zorunludur.');

    if (token.startsWith('MOCK_GIB_TOKEN')) {
      return {
        success: true,
        message: 'Mock GİB ortamında fatura başarıyla iptal edildi.',
        invoiceUuid,
        invoiceNumber,
        reason
      };
    }

    const cookie = options.cookie || cachedCookie;
    const reqHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Referer': `${this.baseUrl}/index.jsp`
    };
    if (cookie) reqHeaders['Cookie'] = cookie;

    let gibResponse = null;

    // 1. Düzenlenen / İmzalanan Belgeler için İptal Talebi Gönder
    try {
      const cancelCall = await axios.post(`${this.baseUrl}/dispatch`, qs.stringify({
        cmd: 'EARSIV_PORTAL_IPTAL_TALEBI_OLUSTUR',
        callid: crypto.randomUUID(),
        pageName: 'RG_IPTALTALEPLERI',
        token: token,
        jp: JSON.stringify({
          faturano: invoiceNumber || '',
          ettin: invoiceUuid,
          gerekce: String(reason).trim(),
          aciklama: String(reason).trim()
        })
      }), {
        httpsAgent: this.agent,
        headers: reqHeaders,
        timeout: 15000
      });
      gibResponse = cancelCall.data;
    } catch (e1) {
      console.warn('[EarsivService] İptal Talebi call warn:', e1.message);
    }

    // 2. Taslak silme / temizleme komutu gönder (EARSIV_PORTAL_FATURA_SIL)
    try {
      const deleteCall = await axios.post(`${this.baseUrl}/dispatch`, qs.stringify({
        cmd: 'EARSIV_PORTAL_FATURA_SIL',
        callid: crypto.randomUUID(),
        pageName: 'RG_TASLAKLAR',
        token: token,
        jp: JSON.stringify({
          silinecekler: [invoiceUuid],
          aciklama: String(reason).trim()
        })
      }), {
        httpsAgent: this.agent,
        headers: reqHeaders,
        timeout: 15000
      });
      if (!gibResponse) gibResponse = deleteCall.data;
    } catch (e2) {
      console.warn('[EarsivService] Taslak Silme call warn:', e2.message);
    }

    return {
      success: true,
      message: 'Fatura iptal talebi GİB e-Arşiv sistemine iletildi.',
      invoiceUuid,
      invoiceNumber,
      reason: String(reason).trim(),
      gibData: gibResponse?.data || null
    };
  }
}

module.exports = {
  EarsivPortalService,
  calculateJewelryInvoiceBreakdown,
  calculateVip22Breakdown,
  cleanInvoiceProductName,
  getCleanInvoiceItemsSummary,
  VIP_22_CATALOG
};
