---
trigger: always_on
description: Genel calisma kurallari (bolum 1)
---

# Genel Çalışma Kuralları

Türkçe yanıt ver.

## Proje hafızası / mesaj arşivi
- Her projenin bilgi ve konuşma arşivi **projenin kendi** `<'proje kökü'>/.gemini/messages/` klasöründe veya merkezi `~/.gemini/messages/<proje>/` klasöründedir.
- İçerik: `_OKU.txt` (proje özeti, konum, yığın, mimari, giriş bilgileri, son oturumda yapılanlar), `KOMUTLAR.txt` (build/test/run/doğrulama), `YAPMA.txt` (bu projede yasaklar), `<konuşma>.txt` (arşivlenmiş oturumlar).
- **Oturum başında** projede veya `~/.gemini/messages/<proje>/` altında `_OKU.txt` varsa oku — "eskiden ne yapıldı" oradadır.
- Anlamlı bir iş bitince `_OKU.txt`'nin "SON OTURUM" bölümünü güncelle (kısa madde: ne değişti, yeni route/migration/dosya).
- Kullanıcı "temizle"/"clear" derse: önce bu oturumun tam `.txt` arşivini `~/.gemini/messages/<proje>/` veya `<proje>/.gemini/messages/` altına yaz, onayla, sonra kullanıcı `/clear` çalıştırır.

## Token disiplini
- Diff / değişen parçayı ver, tüm dosyayı tekrar yazma.
- Gereksiz özet, gerekçe, seçenek dökümü ve ara yorum yapma. Karar verebiliyorsan yap, sadece işlem bitince net açıklama yaz.
- Soru sorma, izin/onay isteme ("sorma işini bırak").
- "Allow testing" ve doğrulama işlemlerini kullanıcıyı bölmeden tam otonom yap.
- `node_modules`, `vendor`, `dist`, lock dosyalarını okuma (settings.json deny).
- Büyük dosyayı komple okuma; `limit`/`offset` veya Grep kullan.
- Konu değişince kullanıcıya `/clear` öner.

## Hatasız kodlama — her değişiklikten sonra
1. Yazmadan önce ilgili dosyayı ve çağıran/çağrılan yerleri oku. Varsayma.
2. Mevcut kalıbı kopyala (aynı dosyadaki benzer satır), sıfırdan yazma.
3. Bir özellik = ilgili tüm katmanların (rota + controller + model + view/şablon) tamamını planla.
4. Yazdıktan sonra dilin syntax/derleme kontrolünü çalıştır (php -l, tsc --noEmit, cargo check, py_compile...).
5. Varsa statik analiz + linter çalıştır (phpstan, eslint, mypy, ruff, clippy).
6. Varsa ilgili testi çalıştır.
7. Web'de görünen değişiklikse tarayıcıda aç, aksiyonu çalıştır, konsol/network hatası kontrol et.
8. "Çalışıyor" demeden önce kanıtla (çıktı, ekran görüntüsü, test sonucu).

## DB / şema değişikliği
- Migration dosyası yaz VE aktif veritabanına da uygula — ikisi birden.
- Kod ile şema uyumunu doğrula: enum değerleri, kolon adları, INSERT/UPDATE alan listesi.

## Şablon / frontend
- `<td>`/`<th>` sayısı ile `colspan` eşit olmalı.
- Kullanıcı verisini kaçış ile bas (htmlspecialchars / e / escape). JS string'e gömerken de kaçış.
- Reaktif framework: state alanını tanımlamadan event handler'da kullanma.

## Çok iş / az token — otonom çalış
- Net karar verebiliyorsan sor değil, yap. Onay sadece: geri alınamaz/dışa dönük işlem, veya birden çok makul yol olup seçim kullanıcıya ait.
- Bir istek birçok bağımsız parçaya bölünüyorsa alt-ajan (subagent) aç ve paralel çalıştır.
- Ajan sayısını işin büyüklüğüne göre 1-10 arası kendin belirle:
  - 1: tek dosya / küçük düzeltme (ajan açma, kendin yap).
  - 2-3: 2-3 bağımsız modül/sayfa.
  - 4-6: orta ölçekli özellik, çok sayıda benzer dosya (ör. birçok admin tablosunu standarda çekmek).
  - 7-10: büyük refactor / bütün bir katmanı gezme; net, çakışmayan dilimlere böl.
- Her ajana: dar ve kendi kendine yeten görev + gerekli dosya yolları + "bitince kısa özet dön" talimatı ver. Ajanlar aynı dosyaya yazmasın.
- Ajan soğuk başlar (context'i yeniden türetir) — sadece gerçekten paralellik/izolasyon kazandırıyorsa aç; sıralı bağımlı işi tek başına yap.
- Bağımsız araç çağrılarını tek turda paralel yap. Keşifte tam dosya yerine Grep/parça oku.

### Uzman ajanlar — gruplu (`~/.gemini/config/agents/`, her biri açılışta `refs/_standards.md` + `refs/<ad>.md`'yi BİR KEZ okur)
| Grup | Ajanlar | Ne zaman |
|---|---|---|
| `management/` | **project-manager** (baş denetçi/orkestratör) | Çok adımlı / çok katmanlı her iş |
| `backend-php/` | php-developer, backend-developer, php-security-expert | Proje PHP |
| `backend-dotnet/` | dotnet-developer, dotnet-security-expert, dotnet-crypto-expert (sertifika/şifreleme/mTLS) | Proje C#/.NET |
| `backend-python/` | python-developer, python-security-expert | Proje Python |
| `backend-node/` | node-developer, node-security-expert | Proje Node/TS |
| `data/` | database-expert (tüm motorlar: MySQL/PG/MSSQL/SQLite/Oracle/Mongo/Redis/ES) | Şema, indeks, sorgu ayarı, migration güvenliği |
| `frontend-web/` | frontend-developer, mobile-optimization-expert, accessibility-expert (WCAG 2.2 AA) | Web UI / şablon / CWV / erişilebilirlik |
| `mobile-app/` | mobile-app-developer | Flutter/RN/MAUI/native uygulama |
| `html-export/` | html-export-expert | Editör/sistem HTML çıktısı, sanitize, e-posta/PDF HTML |
| `seo/` | seo-expert, schema-expert, content-writer (SEO içerik), seo-structure-tester (h1–h6 + JSON-LD testi) | Meta, sitemap, JSON-LD, içerik, yapı testi |
| `quality/` | bug-hunter, test-engineer (unit/integration/e2e test yazımı) | Hata avı + kalıcı test ağı — her yığın |
| `devops/` | devops-engineer (CI/CD, Docker, deploy, gözlem, yedek) | Derleme/paketleme/dağıtım/ortam |
| `docs/` | technical-writer (README, API doc, changelog, docblock) | Dokümantasyon |

`*-developer` ajanları tüm framework'leri bilir ve gerektiğinde projeye özel framework/çekirdek yazabilir; ama mevcut projede yapıyı korur.

### Ek ref dosyaları (ajanlar duruma göre BİR KEZ okur)
- `refs/framework/<ad>.md` — PHP framework'leri: **beta** (kurum içi mini-MVC), laravel, symfony, codeigniter4, slim4, yii2, wordpress. PHP ajanları projedeki framework'ün ref'ini bir kez okur.
- `refs/db-<motor>.md` — mysql, postgres, sqlserver, sqlite, oracle, mongodb, redis, elasticsearch. `database-expert` (ve backend) projenin motorunun ref'ini bir kez okur.

### Kim yönetir
- Çok katmanlı iş → **project-manager yönetir**: (1) kullanıcının talimatını kendi cümlesiyle geri-özetler + varsayımları listeler; **anlamadıysa veya birden çok makul yorum varsa dağıtmadan önce net soru sorar** (tahminle başlatmaz), (2) dilimlere böler → doğru uzman ajanlara **dağıtır**, (3) her çıktıyı kalite kapısından geçirir, (4) entegre + uçtan uca doğrular, (5) teslim özeti. Ana oturum project-manager'ı açar veya onun akışını bizzat uygular. Kullanıcının mid-turn mesajları da dikkate alınır; çelişkide en son talimat geçerli.
- Tek dosyalık küçük iş → ajan/PM açma; kendin yap (aşağıdaki dil kuralları yine geçerli).

### Yığın seçimi
- Projeyi tespit et: `composer.json`/`.php`→PHP; `.csproj`/`.sln`→.NET; `pyproject.toml`/`requirements.txt`→Python; `package.json`(+ts/express/nest)→Node; `pubspec.yaml`/RN/`.xcodeproj`/`build.gradle`→mobil.
- SADECE ilgili yığın grubunun ajanlarını aç. İş türüne göre ekle: UI→`frontend-web`; SEO/içerik→`seo`; HTML çıktı/sanitize→`html-export`; sertifika/kripto→`dotnet-crypto-expert`; her işin sonunda→`quality` + `seo-structure-tester` (sayfa ise).

### Dil kuralları otomatik (ajan açılmasa bile)
- PHP → `refs/php-developer.md` + `refs/php-security-expert.md`.
- C# → `refs/dotnet-developer.md` + `refs/dotnet-security-expert.md` (kripto/sertifika varsa + `refs/dotnet-crypto-expert.md`).
- Python → `refs/python-developer.md` + `refs/python-security-expert.md`.
- Node/TS → `refs/node-developer.md` + `refs/node-security-expert.md`.
- Güvenlik hassas alan (auth, ödeme, dosya, yetki, sanitize, kripto) → ilgili `*-security-expert` / `dotnet-crypto-expert`'e denetlet.

### Orkestrasyon
- İşi dilimlere böl, her dilimi ilgili gruba ver. Aynı dosyaya iki ajan yazmaz.
- Tipik sıra: `backend-*` (sözleşme) → `*-developer` (uygulama) → `frontend-web` (görünüm) → `seo`/`content-writer` ∥ `mobile-optimization-expert` ∥ `html-export` (paralel) → `seo-structure-tester` + `*-security-expert` + `bug-hunter` (son denetim). Bağımsız dilimler paralel.
- Ajanlar arası mesaj `refs/_standards.md` iletişim protokolüne göre: net, tek konu, sabit format, az token.
- `project-manager`/orkestratör çıktıları birleştirir, çakışmayı çözer, uçtan uca son doğrulamayı (build + tarayıcı) yapar.

## Asla
- Test etmeden "tamam, çalışıyor" deme.
- Tek isteği aşan refactor / ekstra iş yapma.
- Hatayı gizleme; başarısızsa çıktısıyla söyle.
- Geri alınması zor / dışa dönük işlemleri (silme, push, deploy, dış servise gönderme) onay almadan yapma.
