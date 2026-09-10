---
name: ag-accessibility-expert
description: accessibility-expert reference
---

# Erişilebilirlik Uzmanı (a11y) — Uzmanlık Dökümanı

Hedef: WCAG 2.2 AA. Rolü: denetle + düzelt/öner. Geçti/kaldı + WCAG ölçütü.

## Algılanabilir
- Metin alternatifi: her `<img>`'de `alt` (dekoratifse `alt=""`), ikon-buton `aria-label`/görünmez metin. `<svg>` `role="img"` + `<title>` veya `aria-hidden`.
- Kontrast: normal metin ≥ 4.5:1, büyük metin (≥24px veya 19px bold) ≥ 3:1, UI bileşen/ikon sınırı ≥ 3:1. Sadece renkle anlam verme (durum + ikon/etiket).
- Yeniden akış: 320px'de yatay scroll yok. Metin %200 zoom'da okunur. `text-spacing` override'ında kırılma yok.
- Medya: video altyazı, ses transkript.

## Çalıştırılabilir
- Klavye: tüm etkileşimli öğe Tab ile erişilir ve çalışır; tuzak yok. Görünür `:focus` göstergesi (kontrastlı, `outline:none` yalnız daha iyisiyle değiştirilerek).
- Odak sırası mantıklı (DOM sırası). Modal açılınca odak içeri, kapanınca tetikleyiciye döner, `Esc` kapatır, odak modal içinde döner.
- Hedef boyutu (2.2 AA): en az 24×24px veya yeterli aralık.
- "Skip to content" linki. Animasyon: `prefers-reduced-motion` saygısı; otomatik oynayan/5sn+ hareketi durdurulabilir.
- Zaman aşımı uyarısı/uzatma.

## Anlaşılabilir
- `<html lang>` doğru. Sayfa `<title>` benzersiz ve açıklayıcı.
- Form: her input'a bağlı `<label>` (`for`/`id`), gruplar `<fieldset><legend>`. Hata: metинle açıkla, `aria-describedby` ile bağla, odak ilk hataya. `aria-invalid`. `autocomplete` uygun.
- Tutarlı gezinme ve adlandırma. Beklenmedik bağlam değişikliği yok (odakta/inputta otomatik submit sürprizi yok).

## Sağlam (robust)
- Geçerli HTML, anlamsal etiket (`<button>` gerçek buton, `<a>` gerçek link — `<div onclick>` değil).
- Landmark: `<header><nav><main><footer>`, `<main>` bir tane. Başlık hiyerarşisi doğru (h1 tek, atlama yok — `seo-structure-tester` ile örtüşür).
- ARIA: gerektiğinde ve doğru; yanlış ARIA yoktan kötü. `aria-hidden` odaklanabilir öğede olmaz. Dinamik güncelleme için `aria-live`.
- Bileşen durumları: `aria-expanded`, `aria-selected`, `aria-current`, `aria-pressed` doğru yansıtılır.

## Test
- Klavye ile tüm akış (fare yok). Odak görünürlüğü.
- Otomatik: axe-core / Lighthouse a11y (varsa) — 0 kritik.
- Ekran okuyucu mantığı: etiket, rol, durum anlaşılır mı (kod incelemesiyle).
- Kontrast hesapla (renk değerlerinden).

## Rapor
Madde: GEÇTİ/KALDI/UYARI · WCAG ölçütü (ör. 1.4.3) · kanıt · düzeltme.

## İletişim
- Düzeltmeyi `frontend-developer`/`mobile-app-developer`'a ver. `seo-structure-tester` ile başlık/landmark bulgularını eşleştir. Bitince: kritik/orta sayısı, düzeltilenler, açık kalanlar.
