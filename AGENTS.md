# Belgin Kuyumculuk — ajan kuralları

## Canonical SEO / GEO / LLMS mandate — zorunlu

Her SEO, GEO, AEO, LLMS, sitemap, robots, canonical, structured-data, search-content, internal-link, redirect veya search-measurement değişikliğinden önce `SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md` tamamen okunur.

Bu kapsamlarda `SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md` tek kanonik Search Revenue mandate'idir ve eski SEO/GEO/LLMS talimat belgelerinin yerini alır. Runtime `robots.txt`, sitemap dosyaları/üreteçleri, `llms.txt`, `llms-full.txt`, `/llms/**`, schema kodu, ürün/fiyat/stok verisi operasyonel/source-of-truth varlıklarıdır; eski talimat belgesi sayılmaz.

Otorite sırası: kullanıcının en güncel açık talebi > SEO/GEO/AEO/LLMS/search scope'ta `SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md` > doğrulanmış ürün/fiyat/stok/yasal/runtime source-of-truth > görsel scope'ta `DESIGN.md` > bu dosyanın diğer operasyon kuralları. Search mandate gerçek ürün/fiyat/stok/yasal veriyi uyduramaz veya ezemez. Chrono24 marka adı veya Chrono24 temelli bağlayıcı fiyat/güvence formülü yeniden eklenemez.

## UI / Tasarım işleri — zorunlu

Kullanıcıya görünen HTML, CSS, responsive, product card, gallery, cart, checkout, legal page veya navigation değişikliğinden önce:

1. `DESIGN.md` dosyasını tamamen oku.
2. Hedef HTML/JS state'i ve `css/style.css` içindeki mevcut tokenları/kuralları oku.
3. Ürün, fiyat, stok, yasal metin ve ödeme verisini görsel değişiklikten ayrı gerçek kaynak olarak koru.

`DESIGN.md` kanonik görsel ve ticari UX sözleşmesidir. Dış referanslar yalnız bilgi mimarisi, güven yerleşimi, kompozisyon ve etkileşim fikri için kullanılabilir; başka bir lüks marka veya fintech sitesinin görsel kimliği kopyalanamaz.

## Değişmezler

- Mevcut teal / gold / warm-paper token sistemi korunur.
- Ürün fotoğrafı dekorasyondan daha önemlidir.
- Bir karar bloğunda tek baskın CTA kullanılır.
- Sahte stok kıtlığı, sahte yorum, sahte sertifika, sahte canlı durum ve doğrulanmamış ürün teknik özelliği eklenmez.
- Cart, checkout, payment, legal consent ve fiyat davranışı görsel çalışma uğruna bozulmaz.
- Yeni/edite edilen yüzey 320px–1440px aralığında page-level yatay taşma üretmez; `overflow-x:hidden` düzeltme yöntemi olarak kullanılmaz.
- Fatura kesilirken veya fatura şablonu/açıklamalarında ASLA "has altın" ibaresi kullanılmaz. Özel matrah (%0 KDV) satırlarında "Kıymetli Maden Bedeli (Özel Matrah)" veya doğrudan sipariş edilen ürün adı kullanılır. İşçilik satırlarında açıklama olarak yalnızca ve doğrudan "İşçilik" ifadesi kullanılır (ürün adı veya başka ek ifade eklenmez).
- **Fiyatlama & Borsa Akışı Kuralları (DEĞİŞMEZ KURAL):**
  1. **Sarı Tabela (`#canli-fiyatlar`) ve Üst Borsa Kayan Bandı:** Yalnızca ve doğrudan `https://canlipiyasalar.haremaltin.com/` canlı borsa soket akışı (`wss://hrmsocketonly.haremaltin.com`) referans alınarak, canlı gelen satış fiyatları üzerine her zaman **+%1 (x 1.01)** kâr marjı eklenerek anlık olarak güncellenir ve yansıtılır.
  2. **Katalogdaki Altın & Mücevherat Ürün Fiyatları:** Yalnızca `https://www.agakulche.com/ziynet-ata-altin` ve `https://www.agakulche.com/altin-bilezik` kaynaklarından çekilen canlı piyasa satış fiyatları üzerine her zaman istisnasız **+%1 (x 1.01)** kâr marjı eklenerek hesaplanır.
  3. **İZKO Referansı:** İZKO (İzmir Kuyumcular Odası) fiyatlama ve referansı sistemde tamamen devre dışıdır ve hiçbir hesaplama veya tabelada referans alınamaz.
