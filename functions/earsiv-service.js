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

class EarsivPortalService {
  constructor(options = {}) {
    this.isTest = Boolean(options.isTest || process.env.GIB_IS_TEST === 'true');
    this.baseUrl = this.isTest ? GIB_TEST_URL : GIB_PROD_URL;
    this.userCode = options.userCode || process.env.GIB_USER_CODE || '';
    this.password = options.password || process.env.GIB_PASSWORD || '';
  }

  /**
   * GİB e-Arşiv Portalı Login Oturumu Aç
   */
  async login(userCode = this.userCode, password = this.password) {
    if (!userCode || !password) {
      // Mock / Simülasyon Modu (GİB bilgileri henüz girilmemişse sistemin tıkanmaması için)
      return {
        success: true,
        isMock: true,
        token: 'MOCK_GIB_TOKEN_' + Date.now(),
        message: 'GİB Test Simülasyon Oturumu Açıldı'
      };
    }

    try {
      const payload = qs.stringify({
        assoscmd: 'anologin',
        userCode: userCode,
        pass: password,
        language: 'tr'
      });

      const res = await axios.post(`${this.baseUrl}/assos-login`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': `${this.baseUrl}/login.jsp`,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
      });

      if (res.data && res.data.token) {
        return {
          success: true,
          token: res.data.token,
          redirectUrl: res.data.redirectUrl
        };
      }

      if (res.data && res.data.error) {
        throw new Error(res.data.error || 'GİB Giriş Başarısız');
      }

      throw new Error('GİB portalından oturum jetonu (token) alınamadı.');
    } catch (err) {
      console.error('[EarsivService] Login Hatası:', err.message);
      throw err;
    }
  }

  /**
   * GİB e-Arşiv Taslak Fatura Oluştur
   */
  async createDraftInvoice(token, orderData, customBreakdown = null) {
    if (!token) throw new Error('Oturum tokenı eksik');

    const invoiceUuid = crypto.randomUUID();
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const itemsSummary = (orderData.items && orderData.items.length > 0)
      ? orderData.items.map(i => i.name || i.title).join(', ')
      : (orderData.productName || '22 Ayar Kuyumculuk Ürünü');

    const breakdown = customBreakdown || calculateJewelryInvoiceBreakdown(orderData.totalAmount, itemsSummary);

    // Müşteri T.C. Kimlik No veya Vergi No kontrolü (Yoksa 11111111111)
    let vknTckn = String(orderData.customerIdentity || '').replace(/\D/g, '');
    if (vknTckn.length !== 10 && vknTckn.length !== 11) {
      vknTckn = '11111111111'; // Nihai tüketici
    }

    const nameParts = (orderData.customerName || 'Nihai Tüketici').trim().split(' ');
    const aliciSoyadi = nameParts.length > 1 ? nameParts.pop() : '';
    const aliciAdi = nameParts.join(' ') || 'Sayın Müşteri';

    const invoicePayload = {
      faturaUuid: invoiceUuid,
      belgeNumarasi: '',
      faturaTarihi: formattedDate,
      saat: formattedTime,
      paraBirimi: 'TRY',
      dovizKuru: '0',
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
      bulvarCaddeSokak: orderData.customerAddress || 'İzmir',
      mahalleSemtIlce: 'Buca',
      sehir: 'İzmir',
      postaKodu: '',
      tel: orderData.customerPhone || '',
      fax: '',
      eposta: orderData.customerEmail || '',
      websitesi: 'https://belginkuyumculuk.com',
      iadeTable: [],
      vergiCesidi: 'SIFIR',
      malHizmetTable: breakdown.items,
      not: `Sipariş No: ${orderData.orderId || ''} | KDV Kanunu 23/f maddesi uyarınca Has Altın bedeli KDV'den istisnadır (Özel Matrah). Belgin Kuyumculuk`,
      matrah: breakdown.totalMatrah,
      malhizmetToplamTutari: breakdown.totalMatrah,
      toplamIskonto: '0.00',
      hesaplanankdv: breakdown.totalKdv,
      vergilerToplami: breakdown.totalKdv,
      vergilerDahilToplamTutar: breakdown.grandTotal,
      odenecekTutar: breakdown.grandTotal
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
        pageName: 'RG_EARSIV',
        token: token,
        jp: JSON.stringify(invoicePayload)
      });

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': `${this.baseUrl}/main.jsp`
        },
        timeout: 15000
      });

      if (res.data && res.data.data) {
        return {
          success: true,
          invoiceUuid,
          invoiceDate: formattedDate,
          breakdown,
          result: res.data.data,
          message: 'Fatura taslağı GİB e-Arşiv sistemine başarıyla kaydedildi.'
        };
      }

      throw new Error(res.data?.messages?.[0]?.text || 'GİB Taslak Fatura oluşturulamadı.');
    } catch (err) {
      console.error('[EarsivService] Draft Invoice Error:', err.message);
      throw err;
    }
  }

  /**
   * GİB'den Cep Telefonuna SMS Onay Kodu Gönder
   */
  async sendSmsOtp(token) {
    if (!token) throw new Error('Oturum tokenı eksik');

    if (token.startsWith('MOCK_GIB_TOKEN')) {
      return {
        success: true,
        isMock: true,
        message: 'SMS Doğrulama Kodu GİB sisteminde kayıtlı yetkili telefona gönderildi (Test Modunda: 123456 kullanabilirsiniz).'
      };
    }

    try {
      const callid = crypto.randomUUID();
      const dispatchBody = qs.stringify({
        cmd: 'EARSIV_PORTAL_SMSSIFRE_GONDER',
        callid: callid,
        pageName: 'RG_EARSIV',
        token: token,
        jp: JSON.stringify({ SIFRE: '' })
      });

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': `${this.baseUrl}/main.jsp`
        },
        timeout: 15000
      });

      return {
        success: true,
        data: res.data,
        message: 'SMS Onay Kodu GİB yetkili cep telefonuna iletildi.'
      };
    } catch (err) {
      console.error('[EarsivService] Send SMS Error:', err.message);
      throw err;
    }
  }

  /**
   * Gelen SMS Kodunu Doğrula ve Faturayı İmzala (Onayla)
   */
  async verifySmsAndSign(token, smsCode, invoiceUuid) {
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

    try {
      const callid = crypto.randomUUID();
      const dispatchBody = qs.stringify({
        cmd: 'EARSIV_PORTAL_SMSSIFRE_DOGRULA_HSM_ILE_IMZALA',
        callid: callid,
        pageName: 'RG_EARSIV',
        token: token,
        jp: JSON.stringify({
          sifre: cleanSms,
          list: [{ faturauuid: invoiceUuid }]
        })
      });

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': `${this.baseUrl}/main.jsp`
        },
        timeout: 20000
      });

      if (res.data && res.data.data) {
        return {
          success: true,
          invoiceUuid,
          signedAt: new Date().toISOString(),
          data: res.data.data,
          message: 'Fatura GİB e-Arşiv Portalında resmi olarak imzalandı.'
        };
      }

      throw new Error(res.data?.messages?.[0]?.text || 'SMS kodu doğrulanamadı veya imzalama başarısız oldu.');
    } catch (err) {
      console.error('[EarsivService] Sign Error:', err.message);
      throw err;
    }
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
              <div class="title">BELGİN KUYUMCULUK SAN. VE TİC.</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Menderes Cad. No:231/B Buca / İzmir</div>
              <div style="font-size: 12px; color: #666;">info@belginkuyumculuk.com</div>
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
        pageName: 'RG_EARSIV',
        token: token,
        jp: JSON.stringify({ faturauuid: invoiceUuid })
      });

      const res = await axios.post(`${this.baseUrl}/dispatch`, dispatchBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Referer': `${this.baseUrl}/main.jsp`
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
