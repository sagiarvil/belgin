---
name: ag-mobile-optimization-expert
description: mobile-optimization-expert reference
---

# Mobil Optimizasyon Uzmanı — Uzmanlık Dökümanı

Hedef (mobil, saha verisi): LCP < 2.5s, INP < 200ms, CLS < 0.1. Ölçüm: pagespeed.web.dev + tarayıcı Performance paneli + `resize_window` 375px.

## LCP (yükleme)
- LCP öğesini (genelde hero görsel / başlık) tespit et. Ona `fetchpriority="high"` + `<link rel="preload">`.
- Kritik CSS inline; geri kalan CSS ertelenmiş. Render-blocking `<script>`'i `defer`/`async` veya body sonuna al.
- Font: `<link rel="preload" as="font" crossorigin>` + `font-display: swap`. Sistem fontu fallback stack.
- Görsel: modern format (WebP/AVIF), doğru boyut (`srcset`/`sizes`), `loading="lazy"` (LCP öğesi HARİÇ), CDN.
- Sunucu: TTFB düşür (cache, gzip/brotli), gereksiz redirect zinciri yok.

## INP (etkileşim)
- Ana iş parçacığını bloklayan uzun görevleri böl (`> 50ms`). Ağır JS'i tembel yükle / web worker.
- Event handler'da senkron ağır iş yapma; `requestIdleCallback`/debounce.
- Alpine: gereksiz global reaktivite, büyük `x-for` listelerinde `:key`. 3. parti script'leri (analytics, chat) ertele.
- Girdi gecikmesi: tıklamada anında görsel geri bildirim (disabled/spinner), işi sonra.

## CLS (kayma)
- Her `<img>`, `<video>`, `<iframe>`, reklam/embed alanına açık `width`/`height` veya `aspect-ratio`.
- Dinamik içerik (banner, flash mesaj, lazy bölüm) için yer ayır; mevcut içeriği aşağı itme.
- Web font swap'te metrik-uyumlu fallback; `size-adjust`.
- `position: sticky/fixed` header sayfa akışını bozmasın.

## Mobil UX
- Viewport meta: `width=device-width, initial-scale=1`.
- Dokunmatik hedef ≥ 40×40px, aralarında boşluk. Yatay scroll YASAK (`overflow-x` sadece tablo/kod kutusunda).
- Form: doğru `inputmode`/`type` (`tel`, `email`, `numeric`), `autocomplete`, tek sütun.
- Metin ≥ 16px (iOS zoom önler), yeterli satır yüksekliği/kontrast.
- Menü/modal mobilde tam genişlik, kolay kapatılır.

## Ağ / bütçe
- JS bütçesi mobilde küçük tut; kullanılmayan Tailwind/JS'i ayıkla.
- 3. parti kaynak sayısını sınırla; `preconnect`/`dns-prefetch` kritik origin'lere.
- HTTP cache header'ları (statik varlıklara uzun `max-age` + hash'li isim).

## Doğrulama
- `resize_window` 375×812 + reload; `read_console_messages`; görünüm ekran görüntüsü.
- pagespeed.web.dev (varsa) — üç metrik "good". Diagnostics maddelerini kapat.

## İletişim
- `frontend-developer` ile şablon/asset düzenlemelerini koordine et (aynı dosyaya aynı anda yazmayın).
- `seo-expert` ile CWV örtüşür — meta/preload kararlarını paylaş. Bitince: önce/sonra metrik + yapılan değişiklikler.
