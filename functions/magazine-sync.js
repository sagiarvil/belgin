'use strict';

/**
 * BELGİN SAAT & KUYUMCULUK — MAGAZİN TAM OTONOM CLOUD SENKRONİZASYON MOTORU
 * -------------------------------------------------------------------------
 * 1. Chrono24 Resmi RSS Akışını (XML) sorgular.
 * 2. Firestore 'magazine_articles' ve yerel makale kimliklerini karşılaştırır.
 * 3. Yeni makaleleri çeker, temizler, Belgin Saat editoryal kimliğine uyarlar.
 * 4. Firestore 'magazine_articles' koleksiyonuna canlı yayın olarak kaydeder.
 * 5. İstemci tarafı (magazin/index.html) için anlık JSON API sunar.
 */

const axios = require('axios');

const RSS_URL = 'https://static.chrono24.com/magazine/article-rss-feed.xml?limit=30';
const ARTICLE_LINK_RE = /https:\/\/www\.chrono24\.com\/magazine\/[^\s<"']+-p_(\d+)\/?/i;

function decodeEntities(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripTags(value) {
  return decodeEntities(
    String(value || '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function extractTag(xml, tagName) {
  const escaped = tagName.replace(':', '\\:');
  const match = String(xml || '').match(new RegExp('<' + escaped + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + escaped + '>', 'i'));
  return match ? decodeEntities(match[1]).trim() : '';
}

function slugifyTr(text) {
  let t = String(text || '').toLowerCase();
  const map = { 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'İ': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c' };
  t = t.replace(/[ığüşöçİĞÜŞÖÇ]/g, m => map[m] || m);
  t = t.replace(/&[a-z0-9#]+;/g, '-');
  t = t.replace(/[^a-z0-9]+/g, '-');
  return t.replace(/^-+|-+$/g, '').slice(0, 100);
}

function cleanAndAdaptText(text) {
  let t = String(text || '');
  const rules = [
    [/\bchrono24\s*magazine\b/gi, 'Belgin Saat Magazin'],
    [/\bchrono24\s*report\b/gi, 'Belgin Saat Küresel Piyasa Raporu'],
    [/\bchrono24\s*price\s*index\b/gi, 'Belgin Saat Lüks Fiyat Endeksi'],
    [/\bchronopulse\b/gi, 'Belgin Saat Lüks Değer Endeksi'],
    [/\bchrono24\s*team\b/gi, 'Belgin Saat Uzman Ekibi'],
    [/\bchrono24\b/gi, 'Belgin Saat'],
    [/\bc24\b/gi, 'Belgin Saat'],
    [/on chrono24/gi, 'lüks saat pazarında'],
    [/our marketplace/gi, 'lüks saat koleksiyonumuzda'],
    [/on our platform/gi, 'küresel saat piyasasında'],
    [/in our community/gi, 'saat tutkunları arasında'],
    [/\bhaute horlogerie\b/gi, 'Haute Horlogerie (Yüksek Saatçilik)'],
    [/\bwatchmaking\b/gi, 'saatçilik'],
    [/\bwatchmaker\b/gi, 'saat ustası'],
    [/\btimepiece\b/gi, 'saat'],
    [/\bgeneve\b/gi, 'Cenevre'],
    [/\bgeneva\b/gi, 'Cenevre']
  ];
  for (const [re, rep] of rules) {
    t = t.replace(re, rep);
  }
  return t.trim();
}

async function fetchRssFeed() {
  const headers = {
    'User-Agent': 'BelginMagazineSync/3.0 (+https://www.belginkuyumculuk.com/magazin/)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*;q=0.5',
    'Cache-Control': 'no-cache'
  };
  const res = await axios.get(RSS_URL, { headers, timeout: 15000 });
  if (res.status !== 200 || typeof res.data !== 'string') {
    throw new Error(`RSS feed alınamadı: HTTP ${res.status}`);
  }

  const items = res.data.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const parsed = [];
  for (const item of items) {
    const link = extractTag(item, 'link') || extractTag(item, 'guid');
    const match = link.match(ARTICLE_LINK_RE);
    if (match) {
      parsed.push({
        articleId: match[1],
        id: `mag-${match[1]}`,
        link,
        title: stripTags(extractTag(item, 'title')),
        pubDate: extractTag(item, 'pubDate') || extractTag(item, 'published') || ''
      });
    }
  }
  return parsed;
}

async function fetchFullArticle(canonicalUrl) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,tr;q=0.7',
    'Cache-Control': 'no-cache'
  };
  const res = await axios.get(canonicalUrl, { headers, timeout: 20000 });
  if (res.status !== 200 || typeof res.data !== 'string') {
    throw new Error(`Makale HTML çekilemedi: HTTP ${res.status}`);
  }
  return res.data;
}

function parseArticleHtml(html, defaultTitle, defaultDate) {
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  let title = h1Match ? stripTags(h1Match[1]) : defaultTitle;
  title = cleanAndAdaptText(title);

  let rawDate = defaultDate;
  const timeMatch = html.match(/<time\b[^>]*datetime=["']([^"']+)["'][^>]*>/i);
  if (timeMatch) rawDate = timeMatch[1].slice(0, 10);

  let heroImg = '';
  const imgMatch = html.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
  for (const imgTag of imgMatch) {
    const srcM = imgTag.match(/src=["']([^"']+)["']/i);
    if (srcM) {
      const src = srcM[1];
      if (src.includes('magazine-article/') && !/300x300|logo|flag|144\//.test(src)) {
        heroImg = src;
        break;
      }
    }
  }

  const pMatches = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const paras = [];
  for (const p of pMatches) {
    const text = stripTags(p);
    if (text.length > 50 && !/cookie|çerez|copyright|all rights reserved|newsletter/i.test(text)) {
      paras.push(cleanAndAdaptText(text));
    }
  }

  const leadPara = paras[0] || `${title} hakkında horoloji dünyasından en güncel gelişmeler Belgin Saat Magazin'de.`;
  const subHeading = 'Tarihsel Kökenler ve Mekanik Mükemmellik';
  
  let contentHtml = `<p class="mag-lead-para">${leadPara}</p>`;
  contentHtml += `<h2 class="mag-subheading">${subHeading}</h2>`;
  for (let i = 1; i < Math.min(paras.length, 5); i++) {
    contentHtml += `<p>${paras[i]}</p>`;
  }

  const summary = leadPara.slice(0, 220) + '...';
  const readTime = `${Math.max(4, Math.round(contentHtml.length / 450))} dk okuma`;
  const slug = slugifyTr(title);

  return {
    title,
    slug,
    raw_date: rawDate,
    heroImg,
    summary,
    read_time: readTime,
    content_html: contentHtml
  };
}

/**
 * Çekirdek Senkronizasyon İşlevi:
 * Firestore 'magazine_articles' koleksiyonunu günceller.
 */
async function syncMagazineFeedCore(db, admin) {
  const rssItems = await fetchRssFeed();
  if (!rssItems || rssItems.length === 0) {
    return { success: true, newCount: 0, message: 'RSS feed boş veya okunamadı.' };
  }

  const magCol = db.collection('magazine_articles');
  const snapshot = await magCol.select('articleId').get();
  const existingIds = new Set();
  snapshot.forEach(doc => {
    existingIds.add(doc.id);
    const d = doc.data();
    if (d && d.articleId) existingIds.add(String(d.articleId));
  });

  const BLOCKED = new Set(['180505', '177236']);
  const newItems = rssItems.filter(item => !existingIds.has(item.id) && !existingIds.has(item.articleId) && !BLOCKED.has(item.articleId));

  if (newItems.length === 0) {
    return {
      success: true,
      newCount: 0,
      totalChecked: rssItems.length,
      message: `Tüm makaleler güncel (${rssItems.length} makale kontrol edildi, yeni makale bulunamadı).`
    };
  }

  let addedCount = 0;
  for (const item of newItems.slice(0, 3)) {
    try {
      const html = await fetchFullArticle(item.link);
      const parsed = parseArticleHtml(html, item.title, item.pubDate);
      
      const docData = {
        id: item.id,
        articleId: item.articleId,
        slug: parsed.slug,
        title: parsed.title,
        category: 'Saat Dünyası',
        publish_date: parsed.raw_date || new Date().toISOString().slice(0, 10),
        raw_date: parsed.raw_date,
        author: 'Belgin Saat & Mücevherat Editoryal Kurulu',
        read_time: parsed.read_time,
        image: parsed.heroImg || 'images/magazine/cenevre-saat-gunleri-2026-ozet-ve-yenilikler.jpg',
        summary: parsed.summary,
        content_html: parsed.content_html,
        source_url: '',
        isPublished: true,
        syncedVia: 'cloud-feed-sync',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await magCol.doc(item.id).set(docData, { merge: true });
      addedCount++;
    } catch (err) {
      console.warn(`[Magazine Sync Error] ${item.articleId}:`, err.message);
    }
  }

  return {
    success: true,
    newCount: addedCount,
    totalChecked: rssItems.length,
    message: `${addedCount} adet yeni makale başarıyla çekildi ve Firestore'a kaydedildi.`
  };
}

module.exports = {
  fetchRssFeed,
  syncMagazineFeedCore
};
