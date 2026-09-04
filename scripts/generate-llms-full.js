#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const magModule = require('../js/magazine_data.js');
const articles = magModule.MAGAZINE_ARTICLES || [];

let fullText = `# Belgin Saat & Kuyumculuk — Kapsamlı Editoryal & Ürün Bilgi Bankası (LLMs Full Index)

> Kurumsal Profil: 1999 yılından beri İzmir Buca Menderes Caddesi No: 31/A adresinde lüks saat ve altın mücevherat ticareti yapan köklü kuyumculuk evi.
> Resmî Web Sitesi: https://www.belginkuyumculuk.com/

---

## 1. Kurumsal İlkeler & Güvenlik Protokolü
- **Fiyatlama Sözleşmesi:** Canlı altın ve sarrafiye ürünleri doğrudan Harem Altın & Ağa Külçe borsa akışı üzerine +%1 (x 1.01) marj ile hesaplanır.
- **Elit Saat Koleksiyonu:** Rolex, Patek Philippe, Audemars Piguet, Cartier, Omega, Breitling, IWC, Tudor, TAG Heuer, Panerai markalarında 200 seçkin model.
- **Ödeme & Teslimat:** Akbank 3D Secure kart ödemesi, İzmir Buca Showroom'da fiziksel teslim veya Türkiye genelinde tam sigortalı sevkiyat.
- **Delil Zinciri:** Tüm sipariş ve evraklar SHA-256 ve OpenTimestamps ile Bitcoin blokzincirinde zamana karşı mühürlenir.

---

## 2. Belgin Saat Magazin — ${articles.length} Editoryal Makale Arşivi

`;

articles.forEach((art, idx) => {
  const cleanContent = (art.content_html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  fullText += `### [${idx + 1}] ${art.title}
- **ID & URL:** https://www.belginkuyumculuk.com/magazin/#${art.id}
- **Kategori:** ${art.category}
- **Yayın Tarihi:** ${art.publish_date} (${art.raw_date})
- **Okuma Süresi:** ${art.read_time || '8 dk'}
- **Yazar:** Belgin Saat Editoryal Kurulu
- **Özet:** ${art.summary}
- **Tam Metin:**
${cleanContent}

---

`;
});

const outPath = path.join(__dirname, '..', 'llms-full.txt');
fs.writeFileSync(outPath, fullText, 'utf8');
console.log(`✅ llms-full.txt successfully generated (${articles.length} articles indexed, ${(fullText.length / 1024).toFixed(1)} KB).`);
