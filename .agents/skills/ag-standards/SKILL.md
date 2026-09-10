---
name: ag-standards
description: _standards reference
---

# Ortak Ajan Standardı — az token, çok iş, kaliteli işçilik

Kaynak: wshobson/agents, rahulvrane/awesome-claude-agents, hesreallyhim/awesome-claude-code deneyimi.

## Kapsam (tek sorumluluk)
- Sadece kendi uzmanlık alanın. Alan dışına çıkma; başka uzmanın işini `SendMessage` ile ona ver.
- Görevi dar ve eyleme dönük yorumla. Belirsizse en makul yorumla ilerle, dur-soru sadece geri alınamaz/dışa dönük işlemde veya seçim gerçekten kullanıcıya aitse.

## Az token
- Keşifte tam dosya okuma yok: Grep + hedefli `offset/limit`. `node_modules`, `vendor`, `dist`, lock, build çıktısı okuma.
- Ref dosyanı ve bu dosyayı **bir kez** oku, tekrar okuma.
- Bağımsız araç çağrılarını tek turda paralel yap.
- Aynı bilgiyi tekrar türetme; önceki bulguyu kullan.
- Kod verirken diff/parça ver, tüm dosyayı tekrar yazma. Gereksiz özet/gerekçe/seçenek dökümü yok.
- Çıktı kısa ve yapılandırılmış: ne yaptın, hangi dosyalar, sonraki ajanın bilmesi gerekenler, açık kalanlar.

## Çok iş
- Bir görev bağımsız dilimlere ayrılıyorsa paralel çalıştır / orkestratöre "şu 3 dilim paralel" de.
- Sıralı bağımlı işi tek başına, kesintisiz yürüt; her adımda dur-rapor verme, sonda topla.
- "Yaparım" deyip bırakma — bitir ve doğrula.

## Kaliteli işçilik
- Mevcut kalıbı kopyala (aynı dosyadaki benzer yapı), sıfırdan icat etme. Proje kurallarına (CLAUDE.md, ref) uy.
- Yazmadan önce ilgili kodu + çağıran/çağrılan yerleri oku. Varsayma.
- Bir özellik = tüm katmanların (veri + mantık + görünüm + meta) tutarlı bütünü.
- Değişiklikten sonra doğrulama zinciri: syntax/derleme → statik analiz/linter → ilgili test → görünürse tarayıcı/çalıştır → kanıt (çıktı/ekran görüntüsü).
- "Çalışıyor" demeden kanıtla. Test başarısızsa çıktısıyla söyle, gizleme.
- Kenar durumları düşün: boş/aşırı/negatif girdi, yetkisiz erişim, eşzamanlılık, süre dolması, kaynak yok.

## Araç & model
- Sadece gerçekten gereken aracı kullan (frontmatter'da minimum tut).
- Basit/operasyonel iş için hızlı model; mimari/güvenlik/derin analiz için güçlü model yeterlidir — görevi modeline göre değil, kalite eşiğine göre yap.

## İletişim protokolü (ajanlar arası — net, az token)
- Mesaj kısa ve tek konu. Sohbet/nezaket cümlesi yok, arka plan tekrar yok. En fazla 3-4 satır.
- Sabit format:
  - `KİME:` hedef ajan · `KONU:` tek cümle
  - `İSTEK:` ne yapılacak / ne lazım (spesifik: dosya yolu, değişken adı, endpoint, alan)
  - `BAĞLAM:` sadece hedefin bilmediği zorunlu 1 satır (varsa)
  - `BEKLENEN:` çıktının biçimi / kabul kriteri
- Dosya/kod paylaşırken tam içerik değil `yol:satır` referansı veya küçük diff.
- Soru sormadan önce cevabı `refs`/`CLAUDE.md`/kodda ara; oradaysa sorma.
- Bitiş raporu orkestratöre: `YAPILDI:` (madde) · `DOSYALAR:` (yol listesi) · `SONRAKİ AJAN İÇİN:` (kısa) · `AÇIK:` (varsa). Başka bir şey yazma.
- İki ajan aynı dosyaya aynı anda yazmaz. Çakışma + son doğrulama orkestratör/proje yöneticisinde.
