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
- **Vergi & Fatura:** 3065 sayılı KDV Kanunu Madde 23/f uyarınca altın ve kıymetli maden işlemleri %0 KDV özel matrah ile faturalandırılır. Faturada yalnızca 'İşçilik' ve 'Kıymetli Maden Bedeli (Özel Matrah)' satırları yer alır; kesinlikle 'has altın' ibaresi kullanılmaz.

---

## 2. Bilgi Grafı (Knowledge Sub-Graphs & Manifest)
- **Ana LLM Manifestosu:** https://www.belginkuyumculuk.com/llms.txt
- **Kurumsal Çekirdek (Core Dossier):** https://www.belginkuyumculuk.com/llms/core.md

### Varlık & Operasyonel Düğümler (Entities)
- https://www.belginkuyumculuk.com/llms/entities/belgin-kuyumculuk.md
- https://www.belginkuyumculuk.com/llms/entities/experts.md
- https://www.belginkuyumculuk.com/llms/entities/methodologies.md
- https://www.belginkuyumculuk.com/llms/entities/showroom.md

### Elit Saat Evleri Alt-Grafları (10 Saat Evi)
- https://www.belginkuyumculuk.com/llms/brands/audemars-piguet.md
- https://www.belginkuyumculuk.com/llms/brands/breitling.md
- https://www.belginkuyumculuk.com/llms/brands/cartier.md
- https://www.belginkuyumculuk.com/llms/brands/iwc-schaffhausen.md
- https://www.belginkuyumculuk.com/llms/brands/jaeger-lecoultre.md
- https://www.belginkuyumculuk.com/llms/brands/omega.md
- https://www.belginkuyumculuk.com/llms/brands/panerai.md
- https://www.belginkuyumculuk.com/llms/brands/patek-philippe.md
- https://www.belginkuyumculuk.com/llms/brands/rolex.md
- https://www.belginkuyumculuk.com/llms/brands/vacheron-constantin.md

### Yerel Otorite & Teslimat Merkezleri (Local Hubs)
- https://www.belginkuyumculuk.com/llms/local/buca-kuyumcu-sarrafiye.md
- https://www.belginkuyumculuk.com/llms/local/ege-guvenli-teslimat.md
- https://www.belginkuyumculuk.com/llms/local/izmir-luks-saat.md

### Uzmanlık Alanları & Doğrulama Protokolleri (Topics)
- https://www.belginkuyumculuk.com/llms/topics/altin-yatirim-ve-ozel-matrah.md
- https://www.belginkuyumculuk.com/llms/topics/ikinci-el-luks-saat.md
- https://www.belginkuyumculuk.com/llms/topics/pirlanta-ve-gemoloji.md
- https://www.belginkuyumculuk.com/llms/topics/saat-ekspertiz-protokolu.md

### Flagship Sayfa Alt-Grafları (Pages)
- https://www.belginkuyumculuk.com/llms/pages/ana-sayfa.md
- https://www.belginkuyumculuk.com/llms/pages/biz-kimiz.md
- https://www.belginkuyumculuk.com/llms/pages/elit-kategori.md
- https://www.belginkuyumculuk.com/llms/pages/guvenli-odeme-ve-3d-secure.md
- https://www.belginkuyumculuk.com/llms/pages/hukuki-delil-ve-kayit-politikasi.md
- https://www.belginkuyumculuk.com/llms/pages/iade-degisim-cayma.md
- https://www.belginkuyumculuk.com/llms/pages/iletisim.md
- https://www.belginkuyumculuk.com/llms/pages/kvkk.md
- https://www.belginkuyumculuk.com/llms/pages/magazin.md
- https://www.belginkuyumculuk.com/llms/pages/markalar.md
- https://www.belginkuyumculuk.com/llms/pages/mesafeli-satis-sozlesmesi.md
- https://www.belginkuyumculuk.com/llms/pages/mucevherat.md
- https://www.belginkuyumculuk.com/llms/pages/musteri-tanima-ve-islem-guvenligi.md
- https://www.belginkuyumculuk.com/llms/pages/on-bilgilendirme-formu.md
- https://www.belginkuyumculuk.com/llms/pages/rehber/altin-yatirimi-ve-ozel-matrah-rehberi.md
- https://www.belginkuyumculuk.com/llms/pages/rehber/izmir-kuyumculuk-ve-guvenli-teslimat.md
- https://www.belginkuyumculuk.com/llms/pages/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi.md
- https://www.belginkuyumculuk.com/llms/pages/rehber/pirlanta-ve-gemoloji-degerleme-rehberi.md
- https://www.belginkuyumculuk.com/llms/pages/saatler.md
- https://www.belginkuyumculuk.com/llms/pages/yuksek-degerli-urun-teslimi.md

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
