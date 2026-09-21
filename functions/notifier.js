/**
 * BELGIN KUYUMCULUK — MOBİL PUSH BİLDİRİM MOTORU (NTFY.SH)
 * Kuveyt Türk Sanal POS ve PayTR başarılı işlemlerinde iPhone / Android telefonlara
 * anında sesli ve detaylı bildirim gönderir.
 */

const axios = require('axios');

const DEFAULT_NTFY_TOPIC = process.env.NTFY_TOPIC || 'belgin_kasa_2026';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8759848876:AAHH1s5PPMkSqKOCg4oBTTzWgx8B1_Kp5qA';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '912259513';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(amount || 0));
}

function formatDate(date) {
  return (date ? new Date(date) : new Date()).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

/**
 * Telegram Bot Bildirimi Gönderir
 */
async function sendTelegramNotification(order, botToken = TELEGRAM_BOT_TOKEN, chatId = TELEGRAM_CHAT_ID, options = {}) {
  if (!botToken || !chatId) {
    return { success: false, skipped: true, reason: 'TELEGRAM_CONFIG_MISSING' };
  }

  const adminUrl = order.source === "SAATCHI" ? "https://saatchi.watch/admin" : "https://www.belginkuyumculuk.com/admin.html";

  // Test ve Mock Koruması (Yalnızca açık test ortamları veya TEST- prefixli kukla siparişler)
  if (!options.isExplicitTest && (process.env.NODE_ENV === 'test' || options.isTest === true || order.isTest === true)) {
    return { success: true, skipped: true, reason: 'TEST_ENV_SUPPRESSED' };
  }

  const orderId = order.orderId || 'BLG-' + Date.now();
  const upperId = String(orderId).toUpperCase();
  if (!options.isExplicitTest && (upperId.startsWith('TEST-') || upperId.startsWith('MOCK-') || upperId.includes('DUMMY') || upperId.includes('SAMPLE') || upperId.includes('MAIL-FAIL'))) {
    return { success: true, skipped: true, reason: 'TEST_ORDER_SUPPRESSED' };
  }

  const amount = Number(order.totalAmount || order.total || (order.payment && order.payment.amount) || 0);
  const formattedAmount = formatCurrency(amount);
  const customerName = (order.customer && order.customer.name) ||
    order.customerName ||
    (order.customer && `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()) ||
    order.name ||
    order.cardHolderName ||
    order.cardHolder ||
    (order.billingAddress && order.billingAddress.name) ||
    (order.shippingAddress && order.shippingAddress.name) ||
    'Müşteri';
  const upperCustomerName = String(customerName).toLocaleUpperCase('tr-TR');
  const customerPhone = (order.customer && order.customer.phone) || order.customerPhone || '—';
  const customerIdentity = (order.customer && (order.customer.identityNumber || order.customer.identity)) || order.customerIdentity || '—';
  const rawPhone = String(customerPhone).replace(/\D/g, '');
  const provider = (order.payment && order.payment.provider) || order.provider || 'KUVEYTTURK';
  const isShowroom = order.deliveryMethod === 'showroom' || order.highValueSecureDelivery === true;
  const deliveryText = isShowroom ? '🏛️ Showroom (Mağaza Teslim)' : '📦 Adrese Sigortalı Kargo';
  const timeStr = formatDate(order.paidAt || order.createdAt);

  const htmlMessage = [
    `🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢`,
    `<b>ÖDEME OK</b>`,
    `🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢`,
    `🟢 <b>MÜŞTERİ: ${escapeHtml(upperCustomerName)}</b>`,
    `🟢 <b>TUTAR: ${escapeHtml(formattedAmount)} TL</b>`,
    `🟢 POS / Banka: ${escapeHtml(provider)} (3D Secure)`,
    `🟢 Tarih: ${escapeHtml(timeStr)}`
  ].join('\n');



  const inlineKeyboard = [
    [
      { text: '📊 Yönetim Panelini Aç', url: adminUrl }
    ]
  ];

  if (rawPhone && rawPhone.length >= 10) {
    const waPhone = rawPhone.startsWith('90') ? rawPhone : (rawPhone.startsWith('0') ? '9' + rawPhone : '90' + rawPhone);
    inlineKeyboard[0].push({ text: '💬 WhatsApp ile Ulaş', url: `https://wa.me/${waPhone}` });
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: htmlMessage,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    }, { timeout: 8000 });

    console.log(`[Notifier] Telegram Bildirimi iletildi -> ChatId: ${chatId}, OrderId: ${orderId}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error('[Notifier] Telegram Bildirim hatası (HTML), düz metin deneniyor:', error.response?.data || error.message);
    try {
      const plainText = htmlMessage.replace(/<[^>]*>?/gm, '');
      const fbRes = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: plainText,
        reply_markup: { inline_keyboard: inlineKeyboard },
      }, { timeout: 6000 });
      return { success: true, status: fbRes.status, fallbackPlain: true };
    } catch (fbErr) {
      return { success: false, error: fbErr.message };
    }
  }
}

// Mükerrer bildirim engelleme önbelleği (OrderId -> timestamp)
const recentNotifiedOrders = new Map();
const NOTIFY_DEDUPE_MS = 15 * 60 * 1000; // 15 dakika içinde aynı sipariş için tekrar bildirim atılmaz

/**
 * Başarılı Kredi Kartı Ödemesi İçin Hem NTFY Hem Telegram Bildirimi Gönderir
 */
async function sendPaymentPushNotification(order, options = {}) {
  const adminUrl = order.source === "SAATCHI" ? "https://saatchi.watch/admin" : "https://www.belginkuyumculuk.com/admin.html";
  if (!order || typeof order !== 'object') {
    return { success: false, skipped: true, reason: 'INVALID_ORDER_DATA' };
  }

  const isExplicitTest = options.isExplicitTest === true;

  // 1. Ortam ve Test Koruması: Test, Mock, Suite çalıştırmalarında veya test ortamında ASLA push atılmaz
  if (!isExplicitTest && (process.env.NODE_ENV === 'test' || options.isTest === true || order.isTest === true || order.testMode === true)) {
    return { success: true, skipped: true, reason: 'TEST_ENV_SUPPRESSED' };
  }

  const orderId = String(order.orderId || '').trim();
  const upperOrderId = orderId.toUpperCase();

  // Test ve mock sipariş ID kalıpları kontrolü
  if (!isExplicitTest && (
    upperOrderId.includes('TEST') ||
    upperOrderId.includes('MOCK') ||
    upperOrderId.includes('SAMPLE') ||
    upperOrderId.includes('PARALLEL') ||
    upperOrderId.includes('MAIL-FAIL') ||
    upperOrderId.includes('MISMATCH') ||
    upperOrderId.includes('REPLAY') ||
    upperOrderId.includes('N8N') ||
    upperOrderId.includes('DEMO') ||
    upperOrderId.includes('DEV') ||
    upperOrderId.includes('FAKE')
  )) {
    console.log(`[Notifier] Test/Mock sipariş tespit edildi (${orderId}), push bildirim engellendi.`);
    return { success: true, skipped: true, reason: 'TEST_ORDER_SUPPRESSED' };
  }

  const amount = Number(order.totalAmount || order.total || (order.payment && order.payment.amount) || 0);

  // Yalnızca başarılı, ödenmiş ve pozitif tutarlı siparişler bildirilir
  const isPaid = (
    order.isPaid === true ||
    order.paymentStatus === 'PAID' ||
    order.status === 'PAID' ||
    order.status === 'COMPLETED' ||
    (order.payment && order.payment.status === 'PAID')
  ) && (
    order.status !== 'FAILED' &&
    order.paymentStatus !== 'FAILED' &&
    order.status !== 'CANCELLED' &&
    order.status !== 'PAYMENT_SESSION_READY' &&
    order.status !== 'PAYMENT_PENDING' &&
    order.status !== 'CREATED' &&
    order.status !== 'pending' &&
    order.paymentStatus !== 'PENDING'
  );

  if (!isExplicitTest && (!isPaid || amount <= 0)) {
    return { success: false, skipped: true, reason: 'NOT_A_PAID_ORDER' };
  }

  // Mükerrer bildirim kontrolü
  const now = Date.now();
  if (orderId && recentNotifiedOrders.has(orderId)) {
    const lastNotified = recentNotifiedOrders.get(orderId);
    if (now - lastNotified < NOTIFY_DEDUPE_MS) {
      console.log(`[Notifier] Sipariş ${orderId} yakın zamanda zaten bildirildi, mükerrer bildirim atlandı.`);
      return { success: true, skipped: true, reason: 'ALREADY_NOTIFIED_RECENTLY' };
    }
  }
  if (orderId) {
    recentNotifiedOrders.set(orderId, now);
    // Eski kayıtları temizle
    if (recentNotifiedOrders.size > 200) {
      for (const [id, ts] of recentNotifiedOrders.entries()) {
        if (now - ts > NOTIFY_DEDUPE_MS) recentNotifiedOrders.delete(id);
      }
    }
  }

  const topic = String(options.topic || process.env.NTFY_TOPIC || DEFAULT_NTFY_TOPIC).trim();
  const formattedAmount = formatCurrency(amount);
  const customerName = (order.customer && order.customer.name) ||
    order.customerName ||
    (order.customer && `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()) ||
    order.name ||
    order.cardHolderName ||
    order.cardHolder ||
    (order.billingAddress && order.billingAddress.name) ||
    (order.shippingAddress && order.shippingAddress.name) ||
    'Müşteri';
  const upperCustomerName = String(customerName).toLocaleUpperCase('tr-TR');
  const customerPhone = (order.customer && order.customer.phone) || order.customerPhone || '—';
  const provider = (order.payment && order.payment.provider) || order.provider || 'KUVEYTTURK';
  const isShowroom = order.deliveryMethod === 'showroom' || order.highValueSecureDelivery === true;
  const deliveryText = isShowroom ? '🏛️ Showroom (Mağaza Teslim)' : '📦 Adrese Sigortalı Kargo';
  const timeStr = formatDate(order.paidAt || order.createdAt);

  let itemsSummary = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsSummary = order.items.map(i => `• ${i.qty || 1}x ${i.name || i.title || 'Lüks Koleksiyon Ürünü'}`).join('\n');
  }

  // 1. NTFY Gönderimi
  const customerIdentity = (order.customer && (order.customer.identityNumber || order.customer.identity)) || order.customerIdentity || '—';
  
  const ntfyMessage = [
    `🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢`,
    `𝗢̈𝗗𝗘𝗠𝗘 𝗢𝗞`,
    `🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢`,
    `🟢 𝗠𝗨̈𝗦̧𝗧𝗘𝗥𝗜̇: ${upperCustomerName}`,
    `🟢 𝗧𝗨𝗧𝗔𝗥: ${formattedAmount} TL`,
    `🟢 POS / Banka: ${provider} (3D Secure)`,
    `🟢 Tarih: ${timeStr}`
  ].join('\n');

  const payload = {
    topic: topic,
    title: `✅ TAHSİL - ÖDEME OK`,
    message: ntfyMessage,
    markdown: true,
    priority: 5,
    tags: ['moneybag', 'credit_card', 'bell', 'gem'],
    click: adminUrl,
    actions: [
      {
        action: 'view',
        label: '📊 Yönetim Panelini Aç',
        url: adminUrl,
        clear: true,
      },
    ],
  };

  const results = { ntfy: null, telegram: null };

  try {
    const ntfyRes = await axios.post('https://ntfy.sh', payload, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: 6000,
    });
    results.ntfy = { success: true, status: ntfyRes.status };
  } catch (error) {
    console.error('[Notifier] NTFY Hatası:', error.response?.data || error.message);
    results.ntfy = { success: false, error: error.message };
  }

  // 2. Telegram Gönderimi
  const botToken = options.telegramBotToken || TELEGRAM_BOT_TOKEN;
  const chatId = options.telegramChatId || TELEGRAM_CHAT_ID;
  if (botToken && chatId) {
    results.telegram = await sendTelegramNotification(order, botToken, chatId, options);
  }

  return { success: true, results };
}

// BKM / ISO 8583 RESMİ HATA SÖZLÜĞÜ (TELEGRAM PUSH FARKINDALIK MOTORU)
const NOTIFIER_ERROR_MAP = Object.freeze({
  '01': 'Kartı Veren Bankayı Arayınız (Referral - Banka Onayı Gerekli)',
  '02': 'Kartı Veren Bankayı Arayınız (Özel Durum / Kısıtlı Kart)',
  '03': 'Geçersiz Üye İşyeri Numarası (Invalid Merchant)',
  '04': 'Karta El Koyunuz (Pick Up Card)',
  '05': 'İşlem Onaylanmadı (Do Not Honor - Kart Bankası Reddi / Limit veya Güvenlik)',
  '12': 'Geçersiz İşlem Türü (Invalid Transaction)',
  '13': 'Geçersiz Tutar (Invalid Amount)',
  '14': 'Geçersiz Kart Numarası / Hatalı Kart Bilgisi (No Such Card)',
  '15': 'Geçersiz Kart Veren Banka (No Such Issuer)',
  '30': 'Mesaj Formatı Hatası (Format Error)',
  '34': 'Sahtekarlık Şüphesi / Güvenlik Blokajı (Suspected Fraud)',
  '41': 'Kayıp Kart Nedeniyle Reddedildi (Lost Card)',
  '43': 'Çalıntı Kart Nedeniyle Reddedildi (Stolen Card)',
  '51': 'Yetersiz Bakiye / Kart Limiti Yetersiz (Insufficient Funds)',
  '54': 'Son Kullanma Tarihi Geçmiş Kart (Expired Card)',
  '57': 'Kart Sahibine Bu İşlem İzni Verilmemiş (Not Permitted to Cardholder / e-Ticarete Kapalı)',
  '58': 'Terminale Bu İşlem İzni Verilmemiş (Not Permitted to Terminal)',
  '61': 'Para Çekme / Harcama Tutarı Sınırı Aşıldı (Withdrawal Limit Exceeded)',
  '62': 'Kısıtlı Kart / Güvenlik Sebebiyle Kısıtlanmış (Restricted Card)',
  '65': 'Günlük İşlem Sayısı Limiti Aşıldı (Activity Count Limit Exceeded)',
  '75': 'İzin Verilen PIN / SMS Deneme Sayısı Aşıldı (PIN Tries Exceeded)',
  '82': 'Hatalı CVV / Güvenlik Kodu Hatalı Girildi (Incorrect CVV)',
  '91': 'Kartı Veren Banka Hizmet Dışı / Yanıt Vermiyor (Issuer Unavailable)',
  '96': 'Sistem Arızası / Geçici Banka İletişim Hatası (System Malfunction)',
  '99': 'Genel Red / İşlem Banka Tarafından Tamamlanamadı',
  '3DS_VERIFICATION_FAILED': '3D Secure SMS Doğrulaması Başarısız / SMS Kodu Hatalı veya Süresi Doldu',
  'PROVISION_FAILED': 'Banka Provizyon İşlemini Onaylamadı',
  'PROVISION_NETWORK_ERROR': 'Banka Provizyon Ağ Bağlantısı Zaman Aşımına Uğradı',
  'CALLBACK_VERIFICATION_FAILED': 'Güvenlik Kontrolü / Hash İmzası Doğrulanamadı',
  'ORDER_ID_MISSING': 'Sipariş Numarası Eşleşmedi',
  'MR15': 'Ziraat Katılım Üye İşyeri Kuralı Reddi / Limit veya Güvenlik',
  'V013': 'Ziraat Katılım: İşlem Banka Kayıtlarında Bulunamadı / Provizyon Yok',
  'V001': 'Ziraat Katılım: Geçersiz veya Bulunamayan İşlem Kaydı',
  'BANK_INQUIRY_FAILED': 'Ziraat Katılım Banka Ödeme Sorgusu Onaylanmadı',
  'BANK_INQUIRY_TIMEOUT': 'Ziraat Katılım Sorgu Zaman Aşımına Uğradı',
  'PAYMENT_SESSION_FAILED': 'POS Ödeme Oturumu Başlatılamadı (Banka Ağ Hatası)',
  'VIP_TOKEN_INVALID': 'VIP Ödeme Linki Güvenlik İmzası Geçersiz',
  'VIP_TOKEN_EXPIRED': 'VIP Ödeme Linkinin Süresi Doldu'
});

/**
 * Başarısız / Reddedilen POS İşlemleri İçin Telegram ve NTFY Farkındalık Bildirimi
 * Bot: @Belgin_kasa_pos_bot
 */
async function sendPaymentFailureNotification(order, options = {}) {
  const adminUrl = order.source === "SAATCHI" ? "https://saatchi.watch/admin" : "https://www.belginkuyumculuk.com/admin.html";
  if (!order || typeof order !== 'object') {
    return { success: false, skipped: true, reason: 'INVALID_ORDER_DATA' };
  }

  const isExplicitTest = options.isExplicitTest === true;
  if (!isExplicitTest && (process.env.NODE_ENV === 'test' || options.isTest === true || order.isTest === true)) {
    return { success: true, skipped: true, reason: 'TEST_ENV_SUPPRESSED' };
  }

  const orderId = String(order.orderId || '').trim();
  const upperOrderId = orderId.toUpperCase();
  if (!isExplicitTest && (
    upperOrderId.startsWith('TEST-') ||
    upperOrderId.startsWith('MOCK-') ||
    upperOrderId.includes('DUMMY') ||
    upperOrderId.includes('SAMPLE') ||
    upperOrderId.includes('PARALLEL') ||
    upperOrderId.includes('MAIL-FAIL')
  )) {
    console.log(`[Notifier] Test sipariş tespit edildi (${orderId}), red bildirimi engellendi.`);
    return { success: true, skipped: true, reason: 'TEST_ORDER_SUPPRESSED' };
  }

  // Mükerrer bildirim engelleme (Son 3 dakika içinde aynı sipariş reddi tekrar bildirilmez)
  const dedupeKey = `FAIL_${orderId}`;
  const now = Date.now();
  if (orderId && recentNotifiedOrders.has(dedupeKey)) {
    const lastNotified = recentNotifiedOrders.get(dedupeKey);
    if (now - lastNotified < 3 * 60 * 1000) {
      return { success: true, skipped: true, reason: 'ALREADY_NOTIFIED_RECENTLY' };
    }
  }
  if (orderId) recentNotifiedOrders.set(dedupeKey, now);

  const amount = Number(order.totalAmount || order.total || (order.payment && order.payment.amount) || 0);
  const formattedAmount = formatCurrency(amount);
  const customerName = (order.customer && order.customer.name) ||
    order.customerName ||
    (order.customer && `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()) ||
    order.name ||
    order.cardHolderName ||
    order.cardHolder ||
    (order.billingAddress && order.billingAddress.name) ||
    (order.shippingAddress && order.shippingAddress.name) ||
    'Müşteri';
  const customerPhone = (order.customer && order.customer.phone) || order.customerPhone || '—';
  const customerIdentity = (order.customer && (order.customer.identityNumber || order.customer.identity)) || order.customerIdentity || '—';
  const rawPhone = String(customerPhone).replace(/\D/g, '');
  const provider = (order.payment && order.payment.provider) || order.provider || 'KUVEYTTURK';
  const isVip = Boolean(order.isVipPayment || order.isVip22 || order.tag === '/22' || String(orderId).startsWith('VIP-'));
  const timeStr = formatDate(order.failedAt || order.updatedAt || new Date());

  const rawCode = String(order.failReasonCode || order.failReason || 'BANK_REJECT').trim();
  const rawMsg = String(order.failReasonMsg || order.failMessage || 'Banka işlemi onaylamadı.').trim();
  const stage = order.failStage || ((rawCode === '3DS_VERIFICATION_FAILED' || rawMsg.toLowerCase().includes('3d') || rawMsg.toLowerCase().includes('sms')) ? '3D_SECURE' : 'PROVISION');

  let officialMeaning = NOTIFIER_ERROR_MAP[rawCode] || null;
  if (!officialMeaning && rawCode) {
    const match = rawCode.match(/\b(0[1-5]|1[2-5]|3[04]|4[13]|5[1478]|6[125]|75|82|9[169])\b/);
    if (match && NOTIFIER_ERROR_MAP[match[1]]) officialMeaning = NOTIFIER_ERROR_MAP[match[1]];
  }
  if (!officialMeaning) officialMeaning = 'Banka güvenlik veya hesap kuralı gereğince onay vermedi.';

  const stageLabel = stage === '3D_SECURE'
    ? '📱 3D Secure SMS Aşaması'
    : (stage === 'PROVISION' ? '🏦 Banka Provizyon Aşaması' : '🌐 Banka İletişim Aşaması');

  let advice = 'Müşteriyle iletişime geçilerek kart limiti, e-ticaret izni veya alternatif ödeme yöntemi önerilebilir.';
  if (rawCode === '51') {
    advice = 'Müşterinin kart limiti veya hesap bakiyesi yetersizdir. Kart limitini yükseltmesi veya başka kart kullanması önerilmelidir.';
  } else if (rawCode === '3DS_VERIFICATION_FAILED') {
    advice = 'Müşteri bankadan gelen SMS şifresini yanlış girdi veya süresi doldu. Tekrar denemesi sağlanabilir.';
  } else if (rawCode === '57') {
    advice = 'Kart internet alışverişine (e-ticaret) veya kuyum sektörüne kapalıdır. Bankasını arayıp yetki açtırması gerekir.';
  } else if (rawCode === '54') {
    advice = 'Kartın son kullanma tarihi geçmiş veya hatalı girilmiştir.';
  }

  const upperRawCode = String(rawCode).toLocaleUpperCase('tr-TR');
  const upperRawMsg = String(rawMsg).toLocaleUpperCase('tr-TR');
  const upperOfficialMeaning = String(officialMeaning).toLocaleUpperCase('tr-TR');
  const upperProvider = String(provider).toLocaleUpperCase('tr-TR');
  const upperStageLabel = String(stageLabel).toLocaleUpperCase('tr-TR');
  const upperCustomerName = String(customerName).toLocaleUpperCase('tr-TR');
  const upperAdvice = String(advice).toLocaleUpperCase('tr-TR');
  const displayOrderId = String(orderId).toLocaleUpperCase('tr-TR');

  const htmlMessage = [
    `🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 `,
    `<b>DİKKAT RED</b>`,
    `🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 `,
    `🔴 <b>MÜŞTERİ: ${escapeHtml(upperCustomerName)}</b>`,
    `🔴 <b>TUTAR: ${escapeHtml(formattedAmount)} TL</b>`,
    `🔴 RED KODU: ${escapeHtml(upperRawCode)}`,
    `🔴 BANKA GEREKÇESİ: ${escapeHtml(upperRawMsg)}`,
    `🔴 POS / BANKA: ${escapeHtml(upperProvider)}`,
    `🔴 ZAMAN: ${escapeHtml(timeStr)}`
  ].join('\n');

  const ntfyMessage = [
    `🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 `,
    `❌ 𝗗𝗜̇𝗞𝗞𝗔𝗧 𝗥𝗘𝗗`,
    `🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 `,
    `🔴 𝗠𝗨̈𝗦̧𝗧𝗘𝗥𝗜̇: ${upperCustomerName}`,
    `🔴 𝗧𝗨𝗧𝗔𝗥: ${formattedAmount} TL`,
    `🔴 RED KODU: ${upperRawCode}`,
    `🔴 BANKA GEREKÇESİ: ${upperRawMsg}`,
    `🔴 POS / BANKA: ${upperProvider}`,
    `🔴 ZAMAN: ${timeStr}`
  ].join('\n');

  const inlineKeyboard = [
    [
      { text: '📊 YÖNETİM PANELİNDE İNCELE', url: adminUrl }
    ]
  ];

  if (rawPhone && rawPhone.length >= 10) {
    const waPhone = rawPhone.startsWith('90') ? rawPhone : (rawPhone.startsWith('0') ? '9' + rawPhone : '90' + rawPhone);
    const waText = encodeURIComponent(`Merhaba ${customerName}, Belgin Kuyumculuk siparişiniz esnasında bankanız kart işlemini onaylamadı (${rawMsg}). Siparişinizi tamamlamak için diğer kartınızla veya banka transferiyle yardımcı olabilir miyiz?`);
    inlineKeyboard[0].push({ text: '💬 WHATSAPP İLE ULAŞ', url: `https://wa.me/${waPhone}?text=${waText}` });
  }

  const results = { telegram: null, ntfy: null };
  const botToken = options.telegramBotToken || TELEGRAM_BOT_TOKEN;
  const chatId = options.telegramChatId || TELEGRAM_CHAT_ID;
  const topic = String(options.topic || process.env.NTFY_TOPIC || DEFAULT_NTFY_TOPIC).trim();

  const promises = [];

  // 1. Telegram Gönderimi (@Belgin_kasa_pos_bot)
  if (botToken && chatId) {
    promises.push(
      axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }, { timeout: 8000 })
      .then(response => {
        console.log(`[Notifier] Telegram POS Red Bildirimi iletildi -> OrderId: ${orderId}, Code: ${rawCode}`);
        results.telegram = { success: true, status: response.status };
      })
      .catch(async error => {
        console.error('[Notifier] Telegram Red Bildirim hatası (HTML), düz metin deneniyor:', error.response?.data || error.message);
        try {
          const plainText = htmlMessage.replace(/<[^>]*>?/gm, '');
          const fbRes = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: plainText,
            reply_markup: { inline_keyboard: inlineKeyboard },
          }, { timeout: 6000 });
          results.telegram = { success: true, status: fbRes.status, fallbackPlain: true };
        } catch (fbErr) {
          results.telegram = { success: false, error: fbErr.message };
        }
      })
    );
  }

  // 2. NTFY Gönderimi
  if (topic) {
    const ntfyPayload = {
      topic: topic,
      title: `❌ DİKKAT RED - BAŞARISIZ POS ❌`,
      message: ntfyMessage,
      markdown: true,
      priority: 4,
      tags: ['warning', 'x', 'credit_card'],
      click: adminUrl,
      actions: [
        {
          action: 'view',
          label: '📊 Yönetim Panelini Aç',
          url: adminUrl,
          clear: true,
        },
      ],
    };

    promises.push(
      axios.post('https://ntfy.sh', ntfyPayload, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        timeout: 6000,
      })
      .then(ntfyRes => {
        results.ntfy = { success: true, status: ntfyRes.status };
      })
      .catch(error => {
        results.ntfy = { success: false, error: error.message };
      })
    );
  }

  await Promise.allSettled(promises);
  return { success: true, results };
}

/**
 * Test Bildirimi Gönderme (Kurulum ve ses testi için - Yalnızca Yönetici Paneli Üzerinden)
 */
async function sendTestNotification(topic = DEFAULT_NTFY_TOPIC, customAmount = 120000, telegramOpts = {}) {
  const sampleOrder = {
    orderId: 'TEST-BLG-' + Date.now().toString().slice(-6),
    totalAmount: customAmount,
    total: customAmount,
    provider: 'KUVEYTTURK',
    deliveryMethod: 'showroom',
    highValueSecureDelivery: true,
    isPaid: true,
    paymentStatus: 'PAID',
    status: 'PAID',
    customer: {
      name: 'Örnek Müşteri (Yönetici Test Bildirimi)',
      phone: '+90 541 930 53 72',
    },
    items: [
      { name: '18K Altın Elmas Baget Yüzük', qty: 1, price: customAmount }
    ],
    paidAt: new Date(),
  };

  return await sendPaymentPushNotification(sampleOrder, {
    topic,
    isExplicitTest: true,
    telegramBotToken: telegramOpts.botToken,
    telegramChatId: telegramOpts.chatId,
  });
}

module.exports = {
  DEFAULT_NTFY_TOPIC,
  sendTelegramNotification,
  sendPaymentPushNotification,
  sendPaymentFailureNotification,
  sendTestNotification,
};

