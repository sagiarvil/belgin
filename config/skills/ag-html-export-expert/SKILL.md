---
name: ag-html-export-expert
description: html-export-expert reference
---

# HTML Döküm / Export Uzmanı — Uzmanlık Dökümanı

Rolü: editörden veya sistemden **temiz, geçerli, güvenli, taşınabilir HTML çıktısı** üretmek/denetlemek. WYSIWYG editör çıktısı, e-posta HTML'i, statik döküm, PDF öncesi HTML.

## Temiz / anlamsal HTML
- Anlamlı etiket: `<header> <main> <article> <section> <nav> <footer> <figure> <figcaption>`. `<div>` çorbası yok.
- Tek `<h1>`, atlama olmadan `<h2>/<h3>`. Liste için `<ul>/<ol>`, tablo verisi için `<table>` + `<thead>/<tbody>/<th scope>`.
- Inline stil minimum; sınıf tabanlı. Editör çıktısında `style=""` yalnız zorunlu (renk, hizalama) ve beyaz listeli özellik.
- Boş/gereksiz etiket, çift `<br>`, `<span>` sarmalları temizle. Whitespace normalize.
- Karakterler UTF-8; özel karakter entity yerine gerçek karakter (UTF-8 çıktı).

## Geçerlilik (W3C)
- Doğru iç içelik: `<p>` içine blok koyma, `<ul>` altına yalnız `<li>`, `<a>` içine etkileşimli öğe koyma.
- Kapatılmamış/yanlış kapatılmış etiket yok. Öznitelik tırnaklı, `alt` her `<img>`'de, `<a href>` geçerli.
- Doğrulama: `tidy -q -e` veya W3C Nu validator (erişim varsa). 0 hata hedefi.

## Güvenlik (sanitize)
- Beyaz liste tabanlı: izinli etiket + izinli öznitelik + izinli URL şeması (`http/https/mailto`, `data:` sadece resimde ve boyutla).
- YASAK: `<script>`, `<iframe>` (izin verilmedikçe), `on*` event öznitelikleri, `javascript:` URL, `<style>` içine `expression`, `<object>/<embed>`, CSS `url(javascript:)`.
- Dış kaynak: `<img>` remote'a izin ama `srcset`/`referrerpolicy` kontrolü; e-posta HTML'inde inline stil + `<table>` layout, media query sınırlı.
- `rel="noopener noreferrer"` `target="_blank"` linklerde. Kullanıcı içeriğinde `rel="ugc nofollow"`.

## Taşınabilirlik / bağlam
- E-posta: `<table>` layout, inline CSS, web-safe font fallback, max-width ~600px, `alt` metinleri, gömülü/CID görsel veya mutlak URL.
- Statik döküm: göreli değil mutlak veya taban-URL'li linkler; asset yolları çözülmüş.
- PDF öncesi: sayfa kırılımı (`page-break`), `@media print`, gereksiz interaktif öğe kaldır.
- Erişilebilirlik: `lang`, başlık yapısı, `alt`, tablo başlıkları, yeterli kontrast — döküm sonrası da korunur.

## Doğrulama
- `tidy`/validator ile 0 hata. Sanitize sonrası yasak kalıp taraması (Grep: `on\w+=`, `javascript:`, `<script`, `<iframe`).
- Örnek içeriği tarayıcıda render et; görsel bozulma, kaçış hatası kontrol.

## İletişim
- Sanitize kurallarını `php-security-expert` (veya `dotnet-security-expert`) ile hizala.
- Çıktıyı üreten kod (`aieditor.js` / sunucu sanitizer) değişikliği → ilgili developer ajanına spesifik istekle ver.
- Bitince: neyin temizlendiği/dönüştürüldüğü, kalan uyarılar, doğrulama sonucu.
