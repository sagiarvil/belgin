# Belgin Kuyumculuk — ajan kuralları

## Canonical SEO / GEO / LLMS mandate — zorunlu

Her SEO, GEO, AEO, LLMS, sitemap, robots, canonical, structured-data, search-content, internal-link, redirect veya search-measurement değişikliğinden önce `SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md` tamamen okunur.

Bu kapsamlarda `SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md` tek kanonik Search Revenue mandate'idir ve eski SEO/GEO/LLMS talimat belgelerinin yerini alır. Runtime `robots.txt`, sitemap dosyaları/üreteçleri, `llms.txt`, `llms-full.txt`, `/llms/**`, schema kodu, ürün/fiyat/stok verisi operasyonel/source-of-truth varlıklarıdır; eski talimat belgesi sayılmaz.

Otorite sırası: kullanıcının en güncel açık talebi > SEO/GEO/AEO/LLMS/search scope'ta `SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md` > doğrulanmış ürün/fiyat/stok/yasal/runtime source-of-truth > görsel scope'ta `DESIGN.md` > bu dosyanın diğer operasyon kuralları. Search mandate gerçek ürün/fiyat/stok/yasal veriyi uyduramaz veya ezemez. Lüks saatlerde (Elit Kategori) Chrono24 global piyasa referansı ve +%80 kâr marjı formülü devam eder; komisyon ve marj kaldırma kuralı yalnızca altın, ziynet ve mücevherat satışları için geçerlidir.

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
- **Fiyatlama & Borsa Akışı Kuralları (DEĞİŞMEZ KURAL — ALTIN FİYAT MOTORU MANDATE):**
  1. **MÜŞTERİ SATIŞ FİYATI: PRIMARY = İZKO normal "Satış"**: Sarı Tabela (`#canli-fiyatlar`), Üst Borsa Kayan Bandı, Showroom Vitrini ve Katalogdaki tüm Altın, Ziynet, Bilezik, Külçe ve Sarrafiye satış fiyatları birincil olarak İZKO (İzmir Kuyumcular Odası) normal "Satış" (nakit) kuru üzerinden hiçbir marj eklenmeksizin (1.00x birebir) anlık belirlenir. İZKO "K.K Satış" kolonu normal kur motorunda KESİNLİKLE KULLANILMAZ.
  2. **ALIŞ FİYATI: PRIMARY = Harem "Alış"**: Müşteri alış / geri alım fiyatları doğrudan Harem Altın canlı borsa soket akışındaki alış fiyatları (`alis`) referans alınarak hiçbir kâr marjı, komisyon veya katsayı eklenmeden birebir (0% marj / 1.00x çarpan) olarak yansıtılır.
  3. **SATIŞ FALLBACK: Harem "Satış"**: İZKO kaynağı başarısız, bayat (>300 sn), ulaşılamaz veya geçersiz olduğunda, müşteri satış fiyatı otomatik ve kesintisiz olarak Harem Altın ham "Satış" fiyatına (marjsız 1.00x) düşer.
  4. **YASAKLAR**: Altın ve mücevheratta Harem × 1.02 veya 1.005 markup YOKTUR; İZKO K.K Satış YOKTUR; İZKO + Harem ortalaması YOKTUR.
  5. **LÜKS SAATLER (ELİT KATEGORİ CHRONO24 MARJI DEVAM EDER)**: 200 Elit Lüks Saatte Chrono24 küresel piyasa referans fiyatı ve +%80 kâr marjı (`Chrono24 USD Ref × USD Kuru × 1.80`) formülü geçerlidir ve devam eder. Komisyon/marj kaldırma kuralı yalnızca altın, sarrafiye ve mücevherat satışlarına münhasırdır.
- **VIP Link /22 Kısayolu Kuralı (DEĞİŞMEZ KURAL — ASLA DEĞİŞTİRİLEMEZ SÖZLEŞME):** VIP link oluşturma tarafında `/22` yazıldığında veya `/22` kısayolu kullanıldığında karşıya çıkacak ürün İSTİSNASIZ ve YALNIZCA **"22 Ayar Bilezik"**tir. Bu `/22` kısayolunda başka hiçbir ürün (Ata, Çeyrek, Yarım, Ajda, Burma vs.) yer alamaz, önerilemez veya sepete eklenemez; önceki çoklu ürün kaydı tamamen silinmiştir ve geçersizdir. Fatura, sipariş ve ödeme linki kalemleri yalnızca ve doğrudan "22 Ayar Bilezik (Kıymetli Maden Bedeli - Özel Matrah)" ve "İşçilik" satırlarından oluşur.
