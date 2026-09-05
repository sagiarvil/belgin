#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const magModule = require('../js/magazine_data.js');
const articles = magModule.MAGAZINE_ARTICLES || [];

let fullText = `# Belgin Saat & Kuyumculuk — Kapsamlı Editoryal & Ürün Bilgi Bankası (LLMs Full Index)

> Kurumsal Profil: 1999 yılından beri İzmir Buca Menderes Caddesi No:231/B adresinde lüks saat ve altın mücevherat ticareti yapan köklü kuyumculuk evi.
> Resmî Web Sitesi: https://www.belginkuyumculuk.com/

---

## 1. Kurumsal İlkeler & Güvenlik Protokolü
- **Fiyatlama Sözleşmesi:** Canlı altın ve sarrafiye ürünleri doğrudan Harem Altın borsa soket akışı satış fiyatları üzerine +%3 (x 1.03) marj ile hesaplanır; alış fiyatlarında marj uygulanmaz (x 1.00).
- **Elit Saat Koleksiyonu:** Rolex, Patek Philippe, Audemars Piguet, Cartier, Omega, Breitling, IWC, Tudor, TAG Heuer, Panerai markalarında 200 seçkin model.
- **Ödeme & Teslimat:** Akbank 3D Pay ve PayTR 256-Bit SSL kart ödemesi, İzmir Buca Showroom'da fiziksel teslim veya Türkiye genelinde tam sigortalı zırhlı sevkiyat.
- **Delil Zinciri:** Tüm sipariş ve evraklar SHA-256 hash ve OpenTimestamps ile Bitcoin blokzincirinde zamana karşı mühürlenir.
- **Vergi & Fatura:** 3065 sayılı KDV Kanunu Geçici 17. Madde uyarınca altın ve kıymetli maden işlemleri %0 KDV özel matrah ile faturalandırılır. Faturada yalnızca 'İşçilik' ve 'Kıymetli Maden Bedeli' satırları yer alır.

---

## 2. Bilgi Grafı (Knowledge Sub-Graphs)
- **Kurumsal Merkez:** https://www.belginkuyumculuk.com/llms/entities/belgin-kuyumculuk.md
- **Fiziki Showroom:** https://www.belginkuyumculuk.com/llms/entities/showroom.md
- **Uzman Heyet:** https://www.belginkuyumculuk.com/llms/entities/experts.md
- **Ekspertiz Metodolojileri:** https://www.belginkuyumculuk.com/llms/entities/methodologies.md
- **Ana Sayfa Alt-Grafı:** https://www.belginkuyumculuk.com/llms/pages/ana-sayfa.md
- **Elit Saat Evleri Alt-Grafı:** https://www.belginkuyumculuk.com/llms/pages/elit-kategori.md
- **İzmir Yerel Saat Hub:** https://www.belginkuyumculuk.com/llms/local/izmir-luks-saat.md
- **İkinci El Saat Güvencesi:** https://www.belginkuyumculuk.com/llms/topics/ikinci-el-luks-saat.md

---

## 3. Belgin Saat Magazin — ${articles.length} Editoryal Makale Arşivi

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
