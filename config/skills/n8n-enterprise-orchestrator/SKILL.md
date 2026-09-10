---
name: n8n-enterprise-orchestrator
description: >-
  Industrial n8n Directed Acyclic Graph (DAG) orchestration, event-driven resilient pipelines, Dead-Letter Queue (DLQ), automated drift remediation, and multi-hub IndexNow broadcasting. Use when designing, debugging, or deploying enterprise automation workflows.
---

# Industrial n8n DAG Orchestration & Fault-Tolerant Pipelines
## 30-Year Systems Principal & Resilient Event Loops
### Dead-Letter Queue (DLQ), Bayesian Triage, and Multi-Hub Broadcast

Bu yetenek; endüstriyel n8n iş akışlarını, dağıtık olay güdümlü mimarileri, otomatik hata telafisini ve çok merkezli gerçek zamanlı indeksleme ağını yönetir.

---

### 1. 6 Düğümlü Dayanıklı İcra Zinciri (The 6-Node Resilient DAG)
```
[01. CRON TRIGGER] ➔ [02. PROBE /llms.txt] ➔ [03. MULTI-BOT INGEST]
                                                        │
[06. AUTO-HEAL PURGE] ◄── [05. BAYESIAN TRIAGE] ◄───────┴── [04. AST BYTE GATE]
```
- **Node 01 (TRIGGER):** Cron `0 3 * * *` (Günlük 03:00 UTC), HMAC-SHA256 doğrulamalı webhook, 3x üstel geri çekilme (exponential backoff with jitter).
- **Node 02 (PROBE):** `/llms.txt` ve `/llms-full.txt` uçlarını 8000ms sert zaman aşımı ve sentetik worker yedeğiyle denetler.
- **Node 03 (INGEST):** Eşzamanlı HTTP/3 0-RTT crawler simülasyonu (PerplexityBot, GPTBot, ClaudeBot).
- **Node 04 (AUDIT):** 14KB AST bütçe penceresi, `data-chunk-id` sınırları ve Wikidata QID üçlülerini denetler.
- **Node 05 (TRIAGE):** Bayesian drift kapısı: Skor < 80/100 ise `INCIDENT_TRIAGE_DLQ` dalına sevk eder.
- **Node 06 (AUTO-HEAL):** Cloudflare Edge Cache Purge API'sini tetikler, bayat etiketleri temizler, Slack/PagerDuty eskalasyonu üretir.

---

### 2. Dead-Letter Queue (DLQ) ve Sıfır Veri Kaybı Prensibi
- Hiçbir ağ soketi zaman aşımı veya istisna ana orkestratörü durduramaz (`fail-closed`).
- Hatalı işlem anında yakalanır, `DeadLetterEntry` formatında JSON olarak serileştirilir:
  ```json
  {
    "engineId": "ENG-XX",
    "timestamp": "2026-09-09T21:00:00.000Z",
    "error": "Connection timeout or DNS failure",
    "status": "NOT_MEASURED",
    "retryCount": 3,
    "payload": { ... }
  }
  ```
- Kalan 17 motor kesintisiz çalışmaya devam eder; sonuçlar eksiksiz derlenir.

---

### 3. Çok Merkezli (Multi-Hub) IndexNow Dağıtımı
- Yeni oluşturulan veya semantik değişikliğe uğrayan her URL listesi, anında küresel IndexNow ağına iletilir:
  - `https://api.indexnow.org/indexnow`
  - `https://www.bing.com/indexnow`
  - `https://yandex.com/indexnow`
- Alfanümerik anahtar (`9d980417475ac56c8ad72ef2c743e1e5.txt`) ve anahtar konumu doğrulanır.

---

### 4. Kriptografik Webhook Güvenliği
- Tüm gelen webhook istekleri HMAC SHA-256 (`Paddle-Signature`, `X-Webhook-Signature`) ile doğrulanır.
- Replay attack koruması: Zaman damgası toleransı ±5 saniye (veya maksimum 300s).
- Zamanlama saldırılarına karşı güvenli karşılaştırma: `crypto.timingSafeEqual`.

