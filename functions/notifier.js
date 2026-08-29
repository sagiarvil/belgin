/**
 * BELGIN KUYUMCULUK — MOBİL PUSH BİLDİRİM MOTORU (NTFY.SH)
 * Akbank Sanal POS ve PayTR başarılı işlemlerinde iPhone / Android telefonlara
 * anında sesli ve detaylı bildirim gönderir.
 */

const axios = require('axios');

const DEFAULT_NTFY_TOPIC = process.env.NTFY_TOPIC || 'belgin_kasa_2026';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8759848876:AAHH1s5PPMkSqKOCg4oBTTzWgx8B1_Kp5qA';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '912259513';

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

  // Test ve Mock Koruması
  if (!options.isExplicitTest && (process.env.NODE_ENV === 'test' || options.isTest === true)) {
    return { success: true, skipped: true, reason: 'TEST_ENV_SUPPRESSED' };
  }

  const orderId = order.orderId || 'BLG-' + Date.now();
  const upperId = String(orderId).toUpperCase();
  if (!options.isExplicitTest && (upperId.includes('TEST') || upperId.includes('MOCK') || upperId.includes('SAMPLE') || upperId.includes('PARALLEL') || upperId.includes('MAIL-FAIL') || upperId.includes('MISMATCH') || upperId.includes('N8N'))) {
    return { success: true, skipped: true, reason: 'TEST_ORDER_SUPPRESSED' };
  }

  const amount = Number(order.totalAmount || order.total || (order.payment && order.payment.amount) || 0);
  const formattedAmount = formatCurrency(amount);
  const customerName = (order.customer && order.customer.name) || order.customerName || 'Müşteri';
  const customerPhone = (order.customer && order.customer.phone) || order.customerPhone || '—';
  const customerIdentity = (order.customer && (order.customer.identityNumber || order.customer.identity)) || order.customerIdentity || '—';
  const customerAddress = (order.customer && order.customer.address) || order.customerAddress || order.address || '';
  const rawPhone = String(customerPhone).replace(/\D/g, '');
  const provider = (order.payment && order.payment.provider) || order.provider || 'AKBANK';
  const isShowroom = order.deliveryMethod === 'showroom' || order.highValueSecureDelivery === true;
  const deliveryText = isShowroom ? '🏛️ Showroom (Mağaza Teslim)' : '📦 Adrese Sigortalı Kargo';
  const timeStr = formatDate(order.paidAt || order.createdAt);

  let itemsSummary = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsSummary = order.items.map(i => `  • <b>${i.qty || 1}x</b> ${i.name || i.title || 'Lüks Koleksiyon Ürünü'}`).join('\n');
  }

  const htmlMessage = [
    `🔔 <b>BELGİN KUYUMCULUK — YENİ TAHSİLAT!</b>`,
    ``,
    `💰 <b>Tutar:</b> <code>${formattedAmount}</code>`,
    `👤 <b>Müşteri:</b> ${customerName}`,
    `🆔 <b>T.C. Kimlik / Pasaport:</b> <code>${customerIdentity}</code>`,
    customerAddress ? `🏠 <b>Fatura Adresi:</b> ${customerAddress}` : '',
    `📞 <b>Telefon:</b> ${customerPhone}`,
    `💳 <b>POS / Banka:</b> ${provider} (3D Secure)`,
    `📦 <b>Sipariş No:</b> <code>${orderId}</code>`,
    `📍 <b>Teslimat:</b> ${deliveryText}`,
    `⏰ <b>Tarih:</b> ${timeStr}`,
    itemsSummary ? `\n🛒 <b>Satın Alınan Ürünler:\n</b>${itemsSummary}` : '',
  ].filter(Boolean).join('\n');

  const inlineKeyboard = [
    [
      { text: '📊 Yönetim Panelini Aç', url: 'https://www.belginkuyumculuk.com/admin.html' }
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
    }, { timeout: 6000 });

    console.log(`[Notifier] Telegram Bildirimi iletildi -> ChatId: ${chatId}, OrderId: ${orderId}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error('[Notifier] Telegram Bildirim hatası:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// Mükerrer bildirim engelleme önbelleği (OrderId -> timestamp)
const recentNotifiedOrders = new Map();
const NOTIFY_DEDUPE_MS = 15 * 60 * 1000; // 15 dakika içinde aynı sipariş için tekrar bildirim atılmaz

/**
 * Başarılı Kredi Kartı Ödemesi İçin Hem NTFY Hem Telegram Bildirimi Gönderir
 */
async function sendPaymentPushNotification(order, options = {}) {
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
  const customerName = (order.customer && order.customer.name) || order.customerName || 'Müşteri';
  const customerPhone = (order.customer && order.customer.phone) || order.customerPhone || '—';
  const provider = (order.payment && order.payment.provider) || order.provider || 'AKBANK';
  const isShowroom = order.deliveryMethod === 'showroom' || order.highValueSecureDelivery === true;
  const deliveryText = isShowroom ? '🏛️ Showroom (Mağaza Teslim)' : '📦 Adrese Sigortalı Kargo';
  const timeStr = formatDate(order.paidAt || order.createdAt);

  let itemsSummary = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsSummary = order.items.map(i => `• ${i.qty || 1}x ${i.name || i.title || 'Lüks Koleksiyon Ürünü'}`).join('\n');
  }

  // 1. NTFY Gönderimi
  const customerIdentity = (order.customer && (order.customer.identityNumber || order.customer.identity)) || order.customerIdentity || '—';
  const messageLines = [
    `👤 Müşteri: ${customerName}`,
    `🆔 T.C. Kimlik / Pasaport: ${customerIdentity}`,
    `📞 Tel: ${customerPhone}`,
    `💳 POS / Banka: ${provider} (3D Secure Onaylı)`,
    `📦 Sipariş No: ${orderId}`,
    `📍 Teslimat: ${deliveryText}`,
    `⏰ İşlem Zamanı: ${timeStr}`,
  ];
  if (itemsSummary) {
    messageLines.push(`\n🛒 Satın Alınan Ürünler:\n${itemsSummary}`);
  }

  const payload = {
    topic: topic,
    title: `💰 YENİ ÖDEME ALINDI: ${formattedAmount}`,
    message: messageLines.join('\n'),
    priority: 5,
    tags: ['moneybag', 'credit_card', 'bell', 'gem'],
    click: 'https://www.belginkuyumculuk.com/admin.html',
    actions: [
      {
        action: 'view',
        label: '📊 Yönetim Panelini Aç',
        url: 'https://www.belginkuyumculuk.com/admin.html',
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

/**
 * Test Bildirimi Gönderme (Kurulum ve ses testi için - Yalnızca Yönetici Paneli Üzerinden)
 */
async function sendTestNotification(topic = DEFAULT_NTFY_TOPIC, customAmount = 120000, telegramOpts = {}) {
  const sampleOrder = {
    orderId: 'TEST-BLG-' + Date.now().toString().slice(-6),
    totalAmount: customAmount,
    total: customAmount,
    provider: 'AKBANK',
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
  sendTestNotification,
};

