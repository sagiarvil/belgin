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

/**
 * Kuyumculuk Özel Matrah Ayrıştırma Motoru
 * Toplam tutarı Has Altın Bedeli (%0 KDV) ve İşçilik Bedeli (%20 KDV Dahil) olarak böler.
 * Varsayılan: Toplamın %99'u Has Altın, %1'i İşçilik (veya parametre olarak verilen tutarlar)
 */
function calculateJewelryInvoiceBreakdown(totalAmount, productName = 'Kuyumculuk Ürünü', options = {}) {
  const total = Number(totalAmount) || 0;
  if (total <= 0) {
    throw new Error('Geçersiz fatura tutarı');
  }

  let hasGoldAmount = 0;
  let workmanshipTotal = 0; // KDV Dahil işçilik

  if (options.hasGoldAmount !== undefined && options.workmanshipAmount !== undefined) {
    hasGoldAmount = Number(options.hasGoldAmount) || 0;
    workmanshipTotal = Number(options.workmanshipAmount) || 0;
  } else {
    // 100.000 TL için 99.000 TL Has, 1.000 TL İşçilik kuralı
    workmanshipTotal = Math.max(1, Math.round(total * 0.01 * 100) / 100);
    hasGoldAmount = Math.round((total - workmanshipTotal) * 100) / 100;
  }

  // İşçilik KDV Ayrıştırması (%20 KDV)
  // workmanshipTotal = workmanshipNet * 1.20
  const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
  const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;

  // Toplam Matrah = Has Altın Bedeli (%0) + İşçilik Net Matrahı
  const totalMatrah = Math.round((hasGoldAmount + workmanshipNet) * 100) / 100;
  const totalKdv = workmanshipKdv;
  const grandTotal = Math.round((hasGoldAmount + workmanshipTotal) * 100) / 100;

  return {
    productName,
    hasGoldAmount: hasGoldAmount.toFixed(2),
    workmanshipNet: workmanshipNet.toFixed(2),
    workmanshipKdv: workmanshipKdv.toFixed(2),
    workmanshipTotal: workmanshipTotal.toFixed(2),
    totalMatrah: totalMatrah.toFixed(2),
    totalKdv: totalKdv.toFixed(2),
    grandTotal: grandTotal.toFixed(2),
    items: [
      {
        malHizmet: `${productName} (Has Altın Bedeli - Özel Matrah)`,
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
        malHizmet: 'Kuyumculuk İşçilik Bedeli',
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

    const itemsSummary = (orderData.items && orderData.items.length > 0)
      ? orderData.items.map(i => i.name || i.title).join(', ')
      : (orderData.productName || '22 Ayar Kuyumculuk Ürünü');

    const resolvedTotal = Number(orderData.totalAmount || orderData.total || (orderData.payment && orderData.payment.amount) || (orderData.amountInKurus ? orderData.amountInKurus / 100 : 0) || 0);
    const breakdown = customBreakdown || calculateJewelryInvoiceBreakdown(resolvedTotal, itemsSummary);

    // Müşteri T.C. Kimlik No veya Vergi No kontrolü (Yoksa 11111111111)
    let vknTckn = String(orderData.customerIdentity || '').replace(/\D/g, '');
    if (vknTckn.length !== 10 && vknTckn.length !== 11) {
      vknTckn = '11111111111'; // Nihai tüketici
    }

    const nameParts = (orderData.customerName || 'Nihai Tüketici').trim().split(' ');
    const aliciSoyadi = nameParts.length > 1 ? nameParts.pop() : '';
    const aliciAdi = nameParts.join(' ') || 'Sayın Müşteri';

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
      bulvarcaddesokak: orderData.customerAddress || 'Menderes Cad. No:231/B Buca İzmir',
      mahalleSemtIlce: 'Buca',
      sehir: 'İzmir',
      postaKodu: '',
      tel: orderData.customerPhone || '',
      fax: '',
      eposta: orderData.customerEmail || 'musteri@belginkuyumculuk.com',
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
          return {
            success: true,
            invoiceUuid,
            invoiceNumber: options.invoiceNumber || dataObj?.faturaNo || dataObj?.belgeNo || '',
            signedAt: new Date().toISOString(),
            data: dataObj,
            message: 'Fatura GİB e-Arşiv Portalında resmi olarak imzalandı ve onaylandı.'
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
   * İmzalanmış Faturanın HTML Görünümünü Al
   */
  async getInvoiceHtml(token, invoiceUuid) {
    if (!token || !invoiceUuid) throw new Error('Eksik parametre');

    if (token.startsWith('MOCK_GIB_TOKEN')) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>GİB e-Arşiv Fatura Görüntüleme</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #084C47; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .title { color: #084C47; font-size: 20px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
            .table th { background: #084C47; color: white; }
            .badge { background: #E8F5E9; color: #2E7D32; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">BELGİN KUYUMCULUK - SEMİH SONBAHAR</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Menderes Cad. No:231/B Efeler Mah. Buca / İzmir</div>
              <div style="font-size: 12px; color: #666;">destek@belginkuyumculuk.com | 0 (541) 930 52 72</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">e-Arşiv Fatura (Resmi İmzalı)</span>
              <div style="font-size: 12px; margin-top: 6px; font-weight: bold;">UUID: ${invoiceUuid}</div>
              <div style="font-size: 12px; color: #666;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
            </div>
          </div>
          <p><strong>Fatura Türü:</strong> Özel Matrah (KDV Kanunu 23/f - Altından mamul eşya teslimi)</p>
          <p>Bu belge Gelir İdaresi Başkanlığı e-Arşiv Portal sistemi üzerinden elektronik olarak imzalanmıştır.</p>
        </body>
        </html>
      `;
    }

    try {
      const callid = crypto.randomUUID();
      const dispatchBody = qs.stringify({
        cmd: 'EARSIV_PORTAL_FATURA_GOSTER',
        callid: callid,
        pageName: 'RG_TASLAKLAR',
        token: token,
        jp: JSON.stringify({ ettn: invoiceUuid, faturauuid: invoiceUuid, onayDurumu: 'Onaylandı' })
      });

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'Referer': `${this.baseUrl}/index.jsp`
        },
        timeout: 15000
      });

      return res.data?.data || '<p>Fatura içeriği alınamadı.</p>';
    } catch (err) {
      console.error('[EarsivService] View HTML Error:', err.message);
      throw err;
    }
  }
}

module.exports = {
  EarsivPortalService,
  calculateJewelryInvoiceBreakdown
};
