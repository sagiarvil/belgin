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

// 5 ADET 22 AYAR ALTIN SABİT ÜRÜN KATALOĞU VE LİNKLERİ
const VIP_22_CATALOG = Object.freeze([
  {
    id: '2734',
    name: '7 Gram 22 Ayar Ajda Altın Bilezik',
    reference: 'BLG-BLZ-110',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-blz-110-2734/',
    basePrice: 51853,
    weight: 7.0,
    karat: 22
  },
  {
    id: '2669',
    name: 'Ata Tam Yeni 22 ayar',
    reference: 'BLG-ZYN-045',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-045-2669/',
    basePrice: 47400,
    weight: 7.216,
    karat: 22
  },
  {
    id: '2667',
    name: 'Ziynet Çeyrek Altın',
    reference: 'BLG-ZYN-043',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-043-2667/',
    basePrice: 11750,
    weight: 1.754,
    karat: 22
  },
  {
    id: '2670',
    name: 'Yarım Altın',
    reference: 'BLG-ZYN-046',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-046-2670/',
    basePrice: 23500,
    weight: 3.508,
    karat: 22
  },
  {
    id: '2668',
    name: 'Çeyrek Altın',
    reference: 'BLG-ZYN-044',
    url: 'https://www.belginkuyumculuk.com/urun/belgin-kuyumculuk-blg-zyn-044-2668/',
    basePrice: 11750,
    weight: 1.754,
    karat: 22
  }
]);

/**
 * /22 Kısayolu ve Otomatik 22 Ayar Özel Matrah Ayrıştırma Motoru
 * Toplam fiyata %1.5 işçilik (%20 KDV dahil) ekler, kalanı 5 üründen 1 veya 2 ürüne paylaştırır.
 * Fatura tutarı tam olarak sipariş tutarına eşittir.
 */
function calculateVip22Breakdown(totalAmount) {
  const total = Number(totalAmount) || 0;
  if (total <= 0) {
    throw new Error('Geçersiz fatura tutarı');
  }

  // %1.5 İşçilik ve %20 KDV Dahil
  const workmanshipTotal = Math.round(total * 0.015 * 100) / 100;
  const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
  const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
  const goldNetPool = Math.round((total - workmanshipTotal) * 100) / 100;

  const items = [];
  const catalog = [...VIP_22_CATALOG];
  const shuffled = catalog.sort(() => 0.5 - Math.random());

  if (total <= 200000) {
    // DURUM A: <= 200.000 TL -> Tek 22 Ayar Ürün
    const p1 = shuffled[0];
    const p1Price = p1.basePrice || 35000;
    const qty1 = Math.max(1, Math.round(goldNetPool / p1Price));
    const unitPrice1 = Math.round((goldNetPool / qty1) * 100) / 100;

    items.push({
      malHizmet: `${p1.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
      miktar: qty1,
      birim: 'C62',
      birimFiyat: unitPrice1.toFixed(2),
      fiyat: goldNetPool.toFixed(2),
      iskontoArttirim: 'İskonto',
      iskontoOrani: 0,
      iskontoTutari: '0.00',
      iskontoNedeni: '',
      malHizmetTutari: goldNetPool.toFixed(2),
      kdvOrani: 0,
      kdvTutari: '0.00',
      vergiOrani: 0,
      ozelMatrahNedeni: '351',
      ozelMatrahTutari: goldNetPool.toFixed(2),
      tevkifatKodu: 0
    });
  } else {
    // DURUM B: > 200.000 TL -> 2 Farklı 22 Ayar Ürün
    const p1 = shuffled[0];
    const p2 = shuffled[1];

    const ratio1 = (Math.floor(Math.random() * 16) + 55) / 100; // 0.55 .. 0.70
    const pool1 = Math.round(goldNetPool * ratio1 * 100) / 100;
    const pool2 = Math.round((goldNetPool - pool1) * 100) / 100;

    const p1Price = p1.basePrice || 35000;
    const qty1 = Math.max(1, Math.round(pool1 / p1Price));
    const unitPrice1 = Math.round((pool1 / qty1) * 100) / 100;

    const p2Price = p2.basePrice || 35000;
    const qty2 = Math.max(1, Math.round(pool2 / p2Price));
    const unitPrice2 = Math.round((pool2 / qty2) * 100) / 100;

    items.push({
      malHizmet: `${p1.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
      miktar: qty1,
      birim: 'C62',
      birimFiyat: unitPrice1.toFixed(2),
      fiyat: pool1.toFixed(2),
      iskontoArttirim: 'İskonto',
      iskontoOrani: 0,
      iskontoTutari: '0.00',
      iskontoNedeni: '',
      malHizmetTutari: pool1.toFixed(2),
      kdvOrani: 0,
      kdvTutari: '0.00',
      vergiOrani: 0,
      ozelMatrahNedeni: '351',
      ozelMatrahTutari: pool1.toFixed(2),
      tevkifatKodu: 0
    });

    items.push({
      malHizmet: `${p2.name} (Kıymetli Maden Bedeli - Özel Matrah)`,
      miktar: qty2,
      birim: 'C62',
      birimFiyat: unitPrice2.toFixed(2),
      fiyat: pool2.toFixed(2),
      iskontoArttirim: 'İskonto',
      iskontoOrani: 0,
      iskontoTutari: '0.00',
      iskontoNedeni: '',
      malHizmetTutari: pool2.toFixed(2),
      kdvOrani: 0,
      kdvTutari: '0.00',
      vergiOrani: 0,
      ozelMatrahNedeni: '351',
      ozelMatrahTutari: pool2.toFixed(2),
      tevkifatKodu: 0
    });
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

  return {
    isVip22: true,
    productName: items.filter(i => !i.malHizmet.includes('İşçilik')).map(i => `${i.malHizmet.split('(')[0].trim()} (x${i.miktar})`).join(' + '),
    hasGoldAmount: goldNetPool.toFixed(2),
    workmanshipNet: workmanshipNet.toFixed(2),
    workmanshipKdv: workmanshipKdv.toFixed(2),
    workmanshipTotal: workmanshipTotal.toFixed(2),
    totalMatrah: totalMatrah.toFixed(2),
    totalKdv: workmanshipKdv.toFixed(2),
    grandTotal: total.toFixed(2),
    items: items
  };
}

/**
 * Kuyumculuk Özel Matrah Ayrıştırma Motoru
 * Toplam tutarı Kıymetli Maden Bedeli (%0 KDV) ve İşçilik Bedeli (%20 KDV Dahil) olarak böler.
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

  // Çoklu Kalem Desteği (Örn: Mağaza Faturasında Saat, İşçilik ve/veya Altın Kalemleri)
  if (Array.isArray(options.items) && options.items.length > 0) {
    const gibItems = [];
    let totalHasGold = 0;
    let totalTaxableNet = 0;
    let totalKdv = 0;
    let computedGrandTotal = 0;

    options.items.forEach(it => {
      const itQty = Math.max(1, Number(it.qty || 1));
      const itPrice = Number(it.unitPrice || 0);
      const itTotal = Math.round(Number(it.lineTotal || (itQty * itPrice)) * 100) / 100;
      const itName = String(it.name || 'Satış Kalemi').trim();
      
      // Kullanıcı manuel KDV oranı girdiyse (0, 1, 10, 20 vb.) doğrudan kullan
      let kdvRate = 0;
      if (it.kdvRate !== undefined && it.kdvRate !== null && !isNaN(Number(it.kdvRate))) {
        kdvRate = Number(it.kdvRate);
      } else {
        kdvRate = (it.taxType === 'SAAT_STANDART' || itName.toLowerCase().includes('rolex') || itName.toLowerCase().includes('cartier') || itName.toLowerCase().includes('patek') || itName.toLowerCase().includes('saat') || itName.toLowerCase().includes('işçilik')) ? 20 : 0;
      }

      if (kdvRate === 0) {
        // %0 KDV Kıymetli Maden Bedeli (Özel Matrah - KDV Kanunu 23/f)
        totalHasGold += itTotal;
        computedGrandTotal += itTotal;

        const displayName = itName.includes('Özel Matrah') ? itName : `${itName} (Kıymetli Maden Bedeli - Özel Matrah)`;
        const unitMatrah = Math.round((itTotal / itQty) * 100) / 100;

        gibItems.push({
          malHizmet: displayName,
          miktar: itQty,
          birim: 'C62',
          birimFiyat: unitMatrah.toFixed(2),
          fiyat: itTotal.toFixed(2),
          iskontoArttirim: 'İskonto',
          iskontoOrani: 0,
          iskontoTutari: '0.00',
          iskontoNedeni: '',
          malHizmetTutari: itTotal.toFixed(2),
          kdvOrani: 0,
          kdvTutari: '0.00',
          vergiOrani: 0,
          ozelMatrahNedeni: '351',
          ozelMatrahTutari: itTotal.toFixed(2),
          tevkifatKodu: 0
        });
      } else {
        // KDV'ye Tabi Ürün (Saat, İşçilik, Pırlanta vb.)
        const netMatrah = Math.round((itTotal / (1 + (kdvRate / 100))) * 100) / 100;
        const kdvAmount = Math.round((itTotal - netMatrah) * 100) / 100;
        const unitNet = Math.round((netMatrah / itQty) * 100) / 100;

        totalTaxableNet += netMatrah;
        totalKdv += kdvAmount;
        computedGrandTotal += itTotal;

        gibItems.push({
          malHizmet: itName,
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

    const totalMatrah = Math.round((totalHasGold + totalTaxableNet) * 100) / 100;
    const finalGrandTotal = Math.round((totalMatrah + totalKdv) * 100) / 100;

    return {
      productName: resolvedProductName,
      hasGoldAmount: totalHasGold.toFixed(2),
      workmanshipNet: totalTaxableNet.toFixed(2),
      workmanshipKdv: totalKdv.toFixed(2),
      workmanshipTotal: (totalTaxableNet + totalKdv).toFixed(2),
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
    // Standart: %1 İşçilik, %99 Kıymetli Maden
    workmanshipTotal = Math.max(1, Math.round(total * 0.01 * 100) / 100);
    hasGoldAmount = Math.round((total - workmanshipTotal) * 100) / 100;
  }

  // İşçilik KDV Ayrıştırması (%20 KDV)
  const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
  const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;

  // Toplam Matrah = Kıymetli Maden Bedeli (%0) + İşçilik Net Matrahı
  const totalMatrah = Math.round((hasGoldAmount + workmanshipNet) * 100) / 100;
  const totalKdv = workmanshipKdv;
  const grandTotal = Math.round((hasGoldAmount + workmanshipTotal) * 100) / 100;

  return {
    productName: resolvedProductName,
    hasGoldAmount: hasGoldAmount.toFixed(2),
    workmanshipNet: workmanshipNet.toFixed(2),
    workmanshipKdv: workmanshipKdv.toFixed(2),
    workmanshipTotal: workmanshipTotal.toFixed(2),
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
        const msgText = String(dataObj || res.data?.messages?.[0]?.text || '');
        if (msgText.includes('başarıyla') || msgText.includes('imzalanmıştır') || (dataObj && (dataObj.sonuc === '1' || dataObj.sonuc === 1))) {
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
            message: `Fatura GİB e-Arşiv Portalında resmi olarak imzalandı. Belge No: ${realBelgeNo || 'Onaylandı'}`
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
