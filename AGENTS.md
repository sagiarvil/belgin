# Belgin Kuyumculuk — ajan kuralları

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
- Fatura kesilirken veya fatura şablonu/açıklamalarında ASLA "has altın" ibaresi kullanılmaz. Özel matrah (%0 KDV) satırlarında "Kıymetli Maden Bedeli (Özel Matrah)" veya doğrudan sipariş edilen ürün adı kullanılır.
