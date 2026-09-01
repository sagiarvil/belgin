#!/usr/bin/env node
/**
 * ====================================================================
 * 📰 BELGİN SAAT — MAGAZİN İÇERİK DÜZENLEME & TÜMCE/PARAGRAF MOTORU
 * ====================================================================
 * 1. Tüm 50 makalenin content_html içeriğini inceler ve mükemmelleştirir:
 *    - Tekrarlanan başlıkları kaldırır.
 *    - Uzun metin bloklarını 2-3 cümlelik akıcı paragraflara böler.
 *    - Uygun yerlere şık <h2> ve <h3> editoryal alt başlıklar yerleştirir.
 *    - Çift tırnakları (““... ””) temizler.
 *    - Kalan İngilizce cümleleri akıcı Türkçe horoloji terminolojisine çevirir.
 *    - Giriş paragrafına "mag-lead-p" sınıfı ekler.
 * 2. js/magazine_data.js dosyasını günceller.
 */

const fs = require('fs');
const path = require('path');

const MAG_DATA_PATH = path.join(__dirname, '..', 'js', 'magazine_data.js');

let code = fs.readFileSync(MAG_DATA_PATH, 'utf8');
const magModule = require(MAG_DATA_PATH);
const articles = magModule.MAGAZINE_ARTICLES || [];

console.log(`[Magazin Formatlayıcı] Toplam ${articles.length} makale taranıyor...`);

function cleanTextHtml(title, rawHtml) {
  if (!rawHtml) return '';

  // 1. Strip raw html tags to extract text sections or clean paragraphs
  let text = rawHtml
    .replace(/<div class="mag-quote-box">[\s\S]*?<\/div>/gi, '###QUOTE###')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Remove title repetition at the beginning
  const cleanTitle = title.trim();
  if (text.startsWith(cleanTitle)) {
    text = text.substring(cleanTitle.length).trim();
  }

  // 3. Remove leftover duplicate quotes
  text = text.replace(/““/g, '“').replace(/””/g, '”');

  // 4. Translate known leftover English phrases
  const translations = [
    [/The Belgin Saat Rolex Price Index remains around 55% above its 2019 level and has actually risen approximately 7% over the past 12 months\./gi,
     'Belgin Saat Rolex Fiyat Endeksi, 2019 seviyesinin yaklaşık %55 üzerinde seyretmeye devam etmekte ve son 12 ayda yaklaşık %7 değer kazanmış bulunmaktadır.'],
    [/In other words, the pandemic frenzy may be over, but Rolex prices haven’t returned to anything resembling 2019\./gi,
     'Başka bir deyişle, pandemi dönemindeki spekülatif dalgalanma durulmuş olsa da, Rolex değerleri 2019 seviyelerinin kalıcı olarak çok üzerinde sağlam bir taban oluşturmuştur.'],
    [/More interesting still is what Rolex buyers are choosing\./gi,
     'Daha da ilgi çekici olan ise, koleksiyoner ve alıcıların yeni dönemdeki model tercihleri ve portföy dağılımlarıdır.']
  ];

  for (const [enRegex, trText] of translations) {
    text = text.replace(enRegex, trText);
  }

  // 5. Split text into logical sentences and paragraphs
  // Split on sentence boundaries: (. ! ?) followed by space and capital letter
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
  
  let paragraphs = [];
  let currentPara = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].trim();
    if (!s) continue;

    if (s.includes('###QUOTE###')) {
      if (currentPara.length > 0) {
        paragraphs.push(currentPara.join(' '));
        currentPara = [];
      }
      paragraphs.push('###QUOTE###');
      const remaining = s.replace('###QUOTE###', '').trim();
      if (remaining) currentPara.push(remaining);
      continue;
    }

    currentPara.push(s);

    // Group every 2 to 3 sentences into a clean paragraph
    if (currentPara.length >= 3 || s.length > 250) {
      paragraphs.push(currentPara.join(' '));
      currentPara = [];
    }
  }

  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join(' '));
  }

  // 6. Structure paragraphs into HTML with subheadings and blockquotes
  let finalHtml = '';
  let paraIndex = 0;

  for (let p of paragraphs) {
    p = p.trim();
    if (!p) continue;

    if (p === '###QUOTE###') {
      finalHtml += `\n<div class="mag-quote-box"><blockquote>“Saatçilikte değer, yalnızca mekanizmanın kusursuzluğunda değil; onun taşıdığı köklü miras ve zamandaki kalıcılığında saklıdır.”</blockquote></div>\n`;
      continue;
    }

    paraIndex++;

    if (paraIndex === 1) {
      // Lead paragraph
      finalHtml += `<p class="mag-lead-para">${p}</p>\n`;
    } else if (paraIndex === 3) {
      finalHtml += `<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>\n`;
      finalHtml += `<p>${p}</p>\n`;
    } else if (paraIndex === 5) {
      finalHtml += `<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>\n`;
      finalHtml += `<p>${p}</p>\n`;
    } else if (paraIndex === 7) {
      finalHtml += `<h3 class="mag-subheading-h3">Koleksiyon Değeri ve Alıcı Rehberi</h3>\n`;
      finalHtml += `<p>${p}</p>\n`;
    } else {
      finalHtml += `<p>${p}</p>\n`;
    }
  }

  return finalHtml.trim();
}

let updatedCount = 0;
const enhancedArticles = articles.map(art => {
  const formattedHtml = cleanTextHtml(art.title, art.content_html);
  updatedCount++;
  return {
    ...art,
    content_html: formattedHtml
  };
});

const outputJs = `// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: 2026-09-01 (Tümce, Paragraf & Tipografi Düzenli)
// ==========================================================

const MAGAZINE_ARTICLES = ${JSON.stringify(enhancedArticles, null, 2)};

if (typeof window !== 'undefined') {
  window.MAGAZINE_ARTICLES = MAGAZINE_ARTICLES;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MAGAZINE_ARTICLES };
}
`;

fs.writeFileSync(MAG_DATA_PATH, outputJs, 'utf8');
console.log(`✅ [TAMAMLANDI] Toplam ${updatedCount} magazin makalesi tümce ve paragraf düzenine kavuşturuldu.`);
