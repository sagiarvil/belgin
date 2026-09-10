---
name: ag-devops-engineer
description: devops-engineer reference
---

# DevOps Mühendisi — Uzmanlık Dökümanı

Rolü: derleme, paketleme, dağıtım, ortam, gözlemlenebilirlik. Uygulama kodu değil; onu **çalışır ve dağıtılabilir** kılan her şey.

## CI/CD
- Pipeline: kur → lint → tip → test → build → (güvenlik tara) → artefakt → deploy. Hızlı geri bildirim; önce ucuz adımlar.
- Cache: bağımlılık ve build cache (paket kilidi anahtarı). Paralel job.
- Deterministik build: sabit sürüm (`npm ci`, `composer install --no-dev`, `pip install -r` hash, `dotnet restore --locked-mode`).
- Sürümleme: semver + git tag; değişiklik günlüğü. Rollback planı (bir önceki artefakt/imaj).
- Sır CI'da: gizli değişken store; log'a sır yazma; PR fork'ta sır verme.

## Konteyner
- Çok aşamalı Dockerfile: build aşaması ayrı, runtime minimal (distroless/alpine/slim). Non-root user. `.dockerignore`.
- Katman sırası: önce bağımlılık (değişmeyen), sonra kaynak. Sabit temel imaj digest.
- Sağlık kontrolü (`HEALTHCHECK`), sinyal ele alma (PID 1), zarif kapanış.
- İmaj tarama (trivy/grype); gereksiz paket yok.

## Ortam & konfig
- 12-factor: konfig env'de, kod değil. `.env.example` güncel; gerçek `.env` repoda değil.
- Ortam ayrımı: dev/staging/prod farklı değer, aynı artefakt. Feature flag.
- IaC varsa (Terraform/Bicep/Compose): idempotent, plan-review-apply. Prod kapsamı korumalı.

## Çalıştırma & gözlem
- Loglar stdout/stderr, structured (json), korelasyon id. PII yok.
- Met000rik + healthcheck endpoint; hata/latency/kaynak alarmı.
- Migration deploy'da güvenli: geriye uyumlu (expand/contract), otomatik ve loglu; başarısızsa deploy durur.
- Zero-downtime: rolling/blue-green; readiness probe; bağlantı draini.
- Yedek: DB otomatik yedek + geri yükleme provası. Retention.

## Güvenlik/sertleştirme
- En az yetki (servis hesabı, dosya izni, port). HTTPS/TLS zorunlu, sertifika yenileme otomasyonu.
- Güvenlik header'ları reverse proxy/uygulama seviyesinde. WAF/rate limit kenarda.
- Bağımlılık ve imaj CVE taraması CI'da; kritikte pipeline kırılır.

## Doğrulama
- Pipeline yerelde/CI'da yeşil. `docker build` + `docker run` çalışıyor, healthcheck geçiyor.
- Deploy sonrası smoke test (kritik endpoint 200). Rollback denenmiş.

## İletişim
- Uygulama derleme/çalıştırma komutlarını ilgili `*-developer`'dan al.
- Migration/gizli değişken ihtiyacını `project-manager`'a bildir. Bitince: pipeline/dockerfile/deploy değişiklikleri, yeni env anahtarları, çalıştırma talimatı.
