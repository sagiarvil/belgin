---
name: enterprise-geo-ai-intelligence
description: >-
  Silicon Valley & London ($5M+ Tier) Generative Engine Optimization (GEO), Answer Engine Optimization (AEO), and LLM Ingestion Intelligence (Profound, BrightEdge AI, Graphite tier). Enforces 14KB TCP AST budgeting, ColBERT MaxSim late-interaction, Wikidata QID/Google MID consensus triangulation, and multi-tier /llms.txt surface architecture.
---

# Enterprise GEO & AI Search Intelligence Architecture
## Silicon Valley, London & New York ($5,000,000+ Agency Tier)
### Ingestion, Late-Interaction ColBERT, and Knowledge Vault Consensus

Bu yetenek; Google Gemini Live, Perplexity Pro, OpenAI GPT-5/o-Series/Search, Anthropic Claude 4/Search, Apple Intelligence ve Microsoft Copilot sistemlerinin web belgelerini ayrıştırma, indeksleme, vektörleme ve alıntı yapma algoritmalarını moleküler düzeyde yönetir.

---

### 1. 14KB TCP/TLS 0-RTT İlk Paket Bütçesi (The 14KB AST Budget)
Modern LLM crawler'ları (PerplexityBot, GPTBot, ClaudeBot, Applebot-Extended) web sayfalarını klasik tarayıcılar gibi render etmez; yüksek hızlı, kısıtlı işlem ve token bütçeli mikrosistemlerle tüketir:
- **14.336 Bayt Kuralı:** Sayfanın birincil semantik varlığı (Primary Entity), doğrudan AEO yanıt paragrafı ve Schema.org `@graph` bloğu ilk **14.336 bayt** içinde yer almalıdır.
- **Aşım Cezası:** İlk 14KB içinde semantik varlığı bulamayan crawler'lar `Early Scrape Termination` uygular; katlama altındaki verileri model parametrelerine almaz.
- **Hero/LCP İstisnası:** Hero görseli ve birincil içerik ASLA lazy-load edilemez (`loading="eager" fetchpriority="high"`). Gereksiz inline SVG, CSS ve takip kodları edge seviyesinde budanır.

---

### 2. ColBERT Çok Vektörlü Geç Etkileşim Puanlaması (Late Interaction MaxSim)
Geleneksel TF-IDF veya BM25 anahtar kelime eşleştirmesi 2026 itibarıyla tamamen geçersizdir. Arama motorları sorgu ve doküman paragraflarını çok vektörlü token matrislerine izdüşürür (`MaxSim` dot product):
- **Varlık Üçlüsü Formatı (Triples):** Her iddia ve bilgi noktası `[Özne] - [Yüklem] - [Nesne]` yapısıyla ifade edilir.
- **Kontrast Sayısal Yoğunluk (Cross-Encoder Attention):** Her 300 kelimelik blokta en az 3 adet doğrulanmış istatistik, oran, benchmark veya sayısal veri yer almalıdır (Örn: `%96.5 rerank uyumu`, `sub-40ms TTFB`, `105 kontrol noktası`).
- **Token Dağılım Çapası:** Her 300 kelimelik bölüm, açık varlık ve niyet içeren açıklayıcı `<h2 class="colbert-token-anchor">` ile başlamalıdır.

---

### 3. Knowledge Vault, Wikidata & Google MID Konsensüs Kilidi
LLM'ler halüsinasyon baskılama filtreleri (Hallucination Suppression Filters) çalıştırır. Parametrik bilgi tabanında doğrulanmayan varlıklar elenir:
- JSON-LD `@graph` içinde varlığın `sameAs` dizisine doğrudan **Wikidata QID** (`https://www.wikidata.org/wiki/Q...`) ve **Google Knowledge Graph MID** (`https://www.google.com/search?kgmid=/m/...`) bağlanır.
- Varlıklar döngüsel `@id` referanslarıyla (`Organization`, `Corporation`, `SoftwareApplication`, `Product`) ontolojik üst sınıflara kilitlenir.

---

### 4. AEO (Answer Engine Optimization) ve Sesli Arama Standardı
- **Hero Answer Box (İlk 100px):** Sayfanın en üst 100 pikselinde 29 ila 80 kelimelik, tek başına anlam ifade eden atomik doğrudan yanıt yer almalıdır.
- **FAQPage ve QAPage:** Her soru-cevap çifti net ve nesnel olmalı, Schema.org `FAQPage` şemasıyla işaretlenmelidir.

---

### 5. Çok Katmanlı LLM Yüzeyleri (/llms.txt, /llms/core.md)
- **Kök Dizin:** `/llms.txt` (H1 `# Domain`, blok alıntı `> Summary`, kanonik linkler).
- **Derin Alt Grafikler:** `/llms/core.md` ve `/llms/pages/*.md`.
- **Edge HTTP Başlıkları:** `Content-Type: text/markdown; charset=utf-8` ve `Access-Control-Allow-Origin: *`.

---

### 6. DPO / RLAIF Ton Kalibrasyonu (Öznel İfadelerin Temizliği)
- Doğrudan Tercih Optimizasyonu (DPO) algoritmaları öznel pazarlama övgülerini ("en iyi", "rakipsiz", "devrimsel", "mükemmel") alıntı listesinden düşürür.
- Tüm metinler nesnel, kanıtlanabilir ve teknik standart referanslarıyla (W3C, RFC 9110, IEEE 802.3) yazılmalıdır.

