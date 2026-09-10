---
name: ag-frontend-developer
description: frontend-developer reference
---

# Frontend Developer — Uzmanlık Dökümanı

## Yığın
- PHP şablonları: `themes/Admin/default/**`, `themes/Site/default/**`. Layout: `themes/*/default/layout/main.php`, partial'lar `partials/`.
- Tailwind (CDN utility sınıfları), Alpine.js (`x-data`, `x-show`, `x-model`, `@click`, `x-for`, `x-transition`), Bootstrap Icons `bi bi-*`.
- Tasarım: açık/beyaz. `bg-white`, `border-slate-200`, `rounded-[3px]`, `shadow-2xs`. Koyu tema yok.

## Admin tablo standardı (tüm liste sayfaları; SADECE filtre satırı bölüme göre değişir)
- Kart sarmalı: `bg-white rounded-[3px] border border-slate-200 shadow-2xs overflow-hidden` > `overflow-x-auto` > `table w-full text-left text-xs`.
- `thead`: `bg-slate-50 text-slate-600 font-semibold border-b border-slate-200`.
- İlk sütun `ID`: `#<id>` `font-bold text-slate-600`. Gerekirse önünde `w-10` checkbox `th` (`:checked="allChecked" @change="toggleAll($event)"`) + satırda `value="<id>" x-model.number="selected"`.
- Seçim varken üstte toplu işlem çubuğu: `x-show="selected.length" ... "N seçildi" + Sil butonu` (form içinde `<template x-for="id in selected"><input type="hidden" name="ids[]" :value="id"></template>`).
- Son sütun `İşlemler`: `<td>` içinde `<div class="flex items-center justify-end gap-1">`.
- Aksiyon = ikon buton `w-7 h-7 inline-flex items-center justify-center rounded-[3px] transition cursor-pointer`:
  - Görüntüle: `bg-slate-100 hover:bg-slate-200 text-slate-600` + `bi-eye`
  - Düzenle: `bg-indigo-50 hover:bg-indigo-100 text-indigo-700` + `bi-pencil-square`
  - Sil: `bg-rose-50 hover:bg-rose-100 text-rose-600` + `bi-trash3`, form `onsubmit="return confirm('... <?= htmlspecialchars(addslashes($x['name'])) ?> ...')"`
- Durum rozeti: `px-2 py-0.5 rounded-[3px] text-[10px] font-bold border` + renk (emerald/amber/rose/slate).
- Boş durum: `<tr><td colspan="<sütun sayısı>" class="py-8 text-center text-slate-400">...</td></tr>`.

## Kalite kuralları
- `<td>`/`<th>` sayısı = `colspan`. Kolon ekleyince boş-durum colspan'ı da güncelle.
- Alpine: `x-data`'da tanımsız alan/method'u `@click`/`x-model`'de kullanma. `json_encode($p, ENT_QUOTES)` ile obje geçir (`@click='openEdit(<?= ... ?>)'`).
- Kullanıcı verisi `htmlspecialchars()`. JS string'e gömerken ek olarak `addslashes()` / `json_encode`.
- Form: `method="post"`, `_csrf` hidden, doğru `action`.
- Erişilebilirlik: `<label>` bağlı input, `aria-label` ikon-only butonlara `title`, yeterli kontrast, tek `<h1>`.

## Responsive
- `overflow-x-auto` ile tablo yatay kaydırılır, sayfa gövdesi yatay kaymaz.
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, `flex-col sm:flex-row`. Görsele `width`/`height` + `loading="lazy"`.
- Dokunmatik hedef min 40px. `mobile-optimization-expert` ile koordine.

## Doğrulama
- Tarayıcıda aç (`preview_start`/`navigate`), `read_console_messages` hatasız, `computer` ile aksiyonu dene, ekran görüntüsü.
- `resize_window` mobile (375px) ve dark test.

## İletişim
- Bitince özet: değişen şablonlar, beklenen view değişkenleri, kalan bağımlılıklar.
- Değişken/endpoint lazımsa `SendMessage` → `php-developer`. `seo-expert`/`schema-expert` bloklarını `<head>`'e entegre et.
