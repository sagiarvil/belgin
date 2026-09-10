---
name: dark-pool-blackbox-telemetry
description: >-
  Silicon Valley, London & NYC ($5M+ Agency) 6-Area Advanced Black-Box & Dark Pool AI Search Intelligence Protocol (Profound, BrightEdge AI, Graphite tier). Measures and optimizes the 6 non-scoring black-box risk vectors: query fanout coverage, citation volatility, crawler policy divergence, render-retrieval gap, entity identity drift, and agent action friction.
---

# 6-Area Dark Pool & Black-Box AI Search Intelligence Protocol
## Silicon Valley, London & New York ($5,000,000+ Agency Methodology)
### Epistemic Integrity, External Observability, and Zero Pseudo-Signals

Bu yetenek; Google AI Overviews, Perplexity Pro, OpenAI Search, Claude Search ve Apple Intelligence sistemlerinin kapalı kapılar ardındaki 6 temel "Kara Kutu (Black-Box / Dark Pool)" belirsizlik alanını, kurumsal AI Intelligence ajanslarının (Graphite, BrightEdge AI, Profound) ampirik tersine mühendislik metodolojisiyle analiz eder ve stabilize eder.

---

### Epistemik İlke ve Ölçüm Sınırı (SSOT Boundary)
1. **Sıfır Uydurma / Sıfır Sahte Sinyal (Zero Pseudo-Signals):**
   - Tescilli model ağırlıkları, özel embedding vektörleri veya gizli sistem promptlarına doğrudan erişim iddia edilemez.
   - Kara Kutu (Black-Box) riski; tescilli iç mekanizmalara gizli erişim değil, **dışarıdan ampirik olarak gözlemlenebilir kanıt açığı ve belirsizlik derecesi** demektir.
2. **Kanonik Skordan Yalıtım (Non-Scoring Isolation):**
   - 6 Kara Kutu Risk Analizi, kanonik 18 motorlu deterministik ana skoru (Overall Score) asla manipüle etmez; karar destek ve stratejik stabilizasyon katmanı olarak çalışır.
3. **NOT_MEASURED Koruması:**
   - Ölçülemeyen, bağlam gerektiren (`REQUIRES_CONTEXT`) veya harici soket aşımına uğrayan durumlar yapay olarak PASS/FAIL'e zorlanamaz; dürüstçe `NOT_MEASURED` bırakılır.

---

### 6 İleri Kara Kutu / Derin İnternet Risk Alanı

#### 1. Query Fanout Coverage (Sorgu Yelpazesi Kapsama Riski)
- **Mekanizma:** Kullanıcı bir AI motoruna tek bir soru sorduğunda, LLM arka planda 3 ila 8 adet alt sorgu (sub-query fanout) türetir.
- **Kusur / Risk:** Dokümanın yalnızca birincil anahtar kelimeyi hedeflemesi, LLM'in türettiği ikinci derece (second-order) teknik varyantları karşılayamaması.
- **Tersine Mühendislik & Çözüm:** Her ana niyet sayfasında semantik varlık etrafındaki türetilmiş sorgu uzayını (query fanout graph) karşılayan LSI/eşanlamlı token öbekleri ve kontrast veri blokları yerleştirilir.

#### 2. Citation Volatility (Alıntı Uçuculuğu ve Halüsinasyon Riski)
- **Mekanizma:** Stokastik model örneklemesinde (temperature > 0), aynı soruya farklı oturumlarda farklı kaynakların referans verilmesi.
- **Kusur / Risk:** Sayfa içeriğinin gevşek, yoruma açık sıfatlar ("harika", "hızlı") içermesi nedeniyle Cross-Encoder reranker'lar tarafından deterministik bulunmaması.
- **Tersine Mühendislik & Çözüm:** `[Özne] - [Yüklem] - [Nesne]` üçlüleri ve kesin sayısal kanıt yoğunluğu (numerical contrast density) ile alıntı olasılığı stabilize edilir.

#### 3. Crawler Policy Divergence (Bot Ayrışma & İkili Tarama Riski)
- **Mekanizma:** Arama motoru ana crawler'ı (Googlebot) ile yapay zeka eğitim ve arama botlarının (Google-Extended, GPTBot, ClaudeBot, PerplexityBot) farklı `robots.txt` politikalarına ve WAF kurallarına tabi olması.
- **Kusur / Risk:** Sitenin klasik Google'da indekslenirken, GPTBot veya PerplexityBot tarafından 403 Forbidden veya WAF bloğu ile engellenmesi.
- **Tersine Mühendislik & Çözüm:** Bimodal User-Agent testi ve RFC 9309 uyumlu çoklu bot politikası matrisi ile WAF/Edge ayrışması giderilir.

#### 4. Render-Retrieval Gap (DOM Çizim & Alım Uçurumu Riski)
- **Mekanizma:** AI crawler'larının maliyet ve hız gerekçesiyle JavaScript hidrasyonunu (hydration) çalıştırmadan ham SSR HTML paketini tüketmesi.
- **Kusur / Risk:** Kritik metinlerin, tabloların veya JSON-LD şemalarının istemci taraflı JS (React/Vue/Next/Nuxt) ile yüklenmesi; ham HTML'in boş kabuk (empty shell) kalması.
- **Tersine Mühendislik & Çözüm:** 14.336 baytlık ham SSR HTML içinde birincil varlığın, tekil H1'in ve Schema.org `@graph` bloğunun hidrasyonsuz hazır sunulması.

#### 5. Entity Identity Drift (Varlık Kimlik Sapması & Çakışma Riski)
- **Mekanizma:** Parametrik bilgi havuzunda aynı veya benzer ada sahip küresel kuruluşlarla marka varlığının birbirine karışması.
- **Kusur / Risk:** Varlığın tüzel kişi, marka ve yazılım kimliğinin bağımsız düğümler halinde netleştirilmemesi.
- **Tersine Mühendislik & Çözüm:** JSON-LD `@graph` içinde Wikidata QID (`https://www.wikidata.org/wiki/Q...`) ve Google Knowledge Graph MID (`/m/...`) ile ontolojik süper-sınıf kilitlemesi.

#### 6. Agent Action Friction (Otonom Ajan Eylem Sürtünmesi Riski)
- **Mekanizma:** Otonom eylem ajanlarının (A2A, MCP, OpenAI Operator, Claude Computer Use) sitede işlem yapmak istediğinde insan doğrulaması veya karmaşık form engellerine takılması.
- **Kusur / Risk:** Programatik API dokümantasyonu (`openapi.json`), araç tanımları (`/mcp`) ve imzalı ajan kartının (`/.well-known/agent-card.json`) bulunmaması.
- **Tersine Mühendislik & Çözüm:** Agent Protocol v1.0 uyumlu makine yüzeyleri ve idempotency güvenceli headless endpoint sözleşmeleri.

