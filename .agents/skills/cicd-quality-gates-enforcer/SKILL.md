---
name: cicd-quality-gates-enforcer
description: >-
  Automated CI/CD Quality Gates (G0–G9) and formal verification protocol. Enforces npm run test:integrity, semantic drift limits, fake freshness detection, and canonical truth alignment with src/seo/registry.ts.
---

# CI/CD Quality Gates & Formal Verification Protocol
## 10 Mandatory Quality Gates (G0–G9) | Exit Code 1 on Violation

Bu yetenek; derleme öncesi ve CI/CD hattında (GitHub Actions, Cloudflare Pages build) hiçbir kusurlu veya eksik sayfanın yayına girmesine izin vermeyen denetim kapılarını çalıştırır.

---

### Kapı Listesi (G0 – G9)
- **G0 (Policy & Noindex Gate):** Ana sayfa veya birincil kanonik sayfalar asla `noindex` içeremez.
- **G1 (Canonical Consistency Gate):** Dizinlenen tüm sayfalar kendi sunulan URL'si ile birebir eşleşen mutlak kanonik etikete sahip olmalıdır.
- **G2 (Raw SSR HTML Existence Gate):** Ham SSR HTML çıktısı başlık, tekil H1, JSON-LD `@graph` ve kanonik etiket içermelidir (JS hidrasyonuna bağımlılık yasaktır).
- **G3 (Search Intent & Cannibalization Gate):** Aynı yerel ayarda (locale) iki farklı sayfa aynı birincil arama niyetine veya H1'e sahip olamaz.
- **G4 (LLM Deep Subgraph Integrity Gate):** Kök `/llms.txt` dosyasında listelenen tüm `/llms/pages/*.md` dosyaları diskte fiziksel olarak mevcut ve geçerli markdown formatında olmalıdır.
- **G5 (IndexNow Alphanumeric Key Validation Gate):** Genel kök dizinde geçerli IndexNow anahtar dosyası bulunmalıdır.
- **G6 (Fake Freshness Detection Gate):** `modifiedAt` veya `lastmod` tarihi gelecekte olamaz; içerikte en az %15 Levenshtein anlamsal fark olmadan güncellenemez.
- **G7 (Information Gain Score Gate):** Sayfa gövdesi en az 3 adet doğrulanabilir istatistiksel veri veya tescilli metodoloji benchmarkı barındırmalıdır.
- **G8 (Entity Triangulation Completeness Gate):** JSON-LD `sameAs` dizisi en az 3 adet doğrulanmış düğüm (Wikidata QID, Google MID, kurumsal profil) içermelidir.
- **G9 (n8n Workflow Configuration Gate):** Depoda geçerli ve test edilmiş bir n8n izleme iş akışı JSON dosyası bulunmalıdır.

---

### İcra Komutu
```bash
npm run test:integrity
```
Herhangi bir kapı ihlali derlemeyi `Exit Code 1` ile durdurur. İstisna kabul edilmez.

