---
name: reverse-engineering-telemetry
description: >-
  Silicon Valley & New York deep-scan reverse engineering protocol for search engine crawler telemetry, 8-phase deterministic scanning pipeline, 18-engine audit, and zero-defect production code recipes (P0-P3). Use when diagnosing drops or reverse engineering bot behavior.
---

# Silicon Valley & New York Deep-Scan Reverse Engineering Protocol
## 8-Phase Scanning Pipeline, 18 Deterministic Engines, and P0-P3 Root-Fix Contract

Bu yetenek; web sitelerinin arama motorları ve AI crawler'ları tarafından nasıl algılandığını tersine mühendislikle deşifre eder ve deterministik iyileştirme reçeteleri üretir.

---

### 1. 8 Aşamalı Deterministik Tarama Hattı (The 8-Phase Pipeline)
1. **Phase 0 (SSRF Fortress & DoH):**
   - RFC 3986 normalizasyonu: Yalnızca HTTP/HTTPS, standart portlar (80, 443).
   - Cloudflare DNS-over-HTTPS (DoH) ile A/AAAA çözümü.
   - Sıfır güven IP filtresi: RFC 1918, RFC 3927, RFC 6598, loopback ve multicast IP'leri derhal engellenir.
2. **Phase 1 (Multi-Bot 0-RTT Safe Fetch):**
   - 7000ms sert zaman aşımı (`AbortSignal.timeout(7000)`).
   - Maksimum 4 yönlendirme (her hopta yeni DoH denetimi).
   - Akışlı bayt tavanı: 1.000.000 bayt (1MB) aşımında okuma kesilir.
   - Bimodal User-Agent müzakeresi: 401/403 durumunda anında masaüstü Chrome profiline geçiş.
3. **Phase 2 (Paralel DAG Taraması):**
   - `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/.well-known/agent-card.json`, `/openapi.json`, `/mcp`, Wikidata SPARQL API, Common Crawl CDX sunucusu eşzamanlı taranır.
4. **Phase 3 (Sığ Tarama Alt Grafiği):**
   - Sayfa içi linkler ve sitemap üzerinden en fazla 50 kanonik sayfa, 4'lü gruplar halinde taranır.
5. **Phase 4 (DOM & AST Ayrıştırması):**
   - Tekil H1 kontrolü, canonical tutarlılığı, JSON-LD `@graph` ağaçları, `data-chunk-id` sınırları, render engelleyen scriptler.
6. **Phase 5 (18 Motorlu Vektör Telemetrisi):**
   - 18 motor, toplam 129 ağırlık katsayısı üzerinden deterministik kural puanlaması:
     $$\text{Score} = \text{round}\left(\frac{\sum \text{Rule.ok} \times \text{Rule.weight}}{\sum \text{Rule.weight}} \times 100\right)$$
7. **Phase 6 (DLQ ve Fallback):**
   - Ulaşılamayan harici servisler `NOT_MEASURED` olarak işaretlenir; tarama asla çökmez.
8. **Phase 7 (Ampirik Çapraz Doğrulama):**
   - JSON-LD `sameAs` linkleri ile çözülen Wikidata QID karşılaştırılır; varlık açığı raporlanır.

---

### 2. Onarımın 10 Anayasal Kuralı (The 10 Constitutional Rules)
1. **Determinizm Önceliği:** Aynı girdiler bit-for-bit özdeş rapor ve kod reçetesi üretir (`Math.random()` YASAKTIR).
2. **Kanıta Bağlılık:** Her kusur ham yanıt kanıtını (bayt uzunluğu, satır kesiti, HTTP durumu) içermek zorundadır.
3. **Otonom Kod Teslimi:** Öneriler değil; doğrudan kopyalanıp yapıştırılabilir eksiksiz üretim kod blokları sunulur.
4. **Zorunlu Geri Alma (Rollback) Garantisi:** Her reçete sıfır kesintili geri alma komutu veya talimatı içerir.
5. **Sıfır Ajans Masrafı:** İnsan emeği veya danışmanlık iddiası sıfırdır.
6. **Kesin Sınır Ayrımı:** Sistem kök nedeni teşhis eder ve reçeteyi yazar; müşteri yazılım ekibi canlıya alır.
7. **Tahribatsız İnceleme:** Tüm taramalar ve sondalar salt-okunur ve güvenlidir.
8. **Matematiksel Puanlama Bütünlüğü:** Ağırlıklar 18 motor boyunca kesinlikle 129'a tamamlanır.
9. **Fail-Closed İzolasyonu:** Harici servis hataları DLQ'ya düşer; derlemeyi durdurmaz.
10. **Müşteri Egemenliği:** Reçeteler bulut bağımsız, taşınabilir ve standart web standartlarına uygundur.

---

### 3. P0–P3 Matematiksel Önceliklendirme Matrisi
$$\text{PriorityScore} = \text{SeverityWeight} \times \text{ScopeReach} \times \text{Confidence}$$
- **P0 (Kritik - 0-48 Saat):** HTTP 5xx, yanlışlıkla `noindex`, güvenli olmayan karma içerikli formlar.
- **P1 (Yüksek - Gün 3-7):** Eksik canonical, 14KB AST aşımı, geçersiz JSON-LD, engellenen AI crawler'ları.
- **P2 (Orta - Hafta 2-3):** Eksik `/llms.txt`, Wikidata QID eksikliği, jenerik iç link çıpaları ("tıklayın").
- **P3 (İnce Ayar - Hafta 4):** Eksik A2A ajan kartı, eksik MCP araçları, DPO ton kalibrasyonu.

