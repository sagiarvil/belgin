# 🏛️ ENTERPRISE TOKENOMICS & TRANSFORMER REVERSE-ENGINEERING MANDATE v3.0
# Silicon Valley, London & NYC ($5,000,000+ Tier) Agency Architecture & 30-Year Unix Engineering Protocol

> **Statü:** BAĞLAYICI ANAYASAL MANDATE (CONSTITUTIONAL EXECUTIVE MANDATE)  
> **Kapsam:** Tüm Modeller (Gemini, Claude, GPT, OpenAI Codex), Tüm Alt Ajanlar, CLI ve Otomasyon Motorları  
> **Hedef:** Token Tüketimini %70 - %85 Azaltma, Sıfır Bağlam Şişmesi, 10x Bağlam Ömrü

---

## 📌 MADDE 1: TRANSFORMER ATTENTION BUDAMA & KV CACHE PRUNING
1. **Problem:** Transformer mimarisinde bağlam penceresi uzadıkça Dikkat Matrisi (Self-Attention) karesel O(N^2) hesaplama karmaşıklığıyla şişer. Model, geçmişteki anlamsız selamlama, teşekkür ve dolgu kelimelerini her turda baştan hesaplar.
2. **Çözüm Protokolü (StreamingLLM & H2O Evrensel Kuralı):**
   - **Attention Sink Korunumu:** Sisteme giren ilk sistem talimatı (System Prompt) ve ilk 2-4 başlangıç tokeni sabit tutulur.
   - **Recency Bias Korunumu:** En son 2-4 turun aktif diyalog blokları kayıpsız korunur.
   - **Ara Bellek Budama:** Ortada kalan, düşük Shannon entropisine sahip dolgu cümleleri (nezaket sözcükleri, ara onaylar, tekrarlar) Transformer dikkat katmanına girmeden budanır.
   - **Sonuç:** Model 100K tokenlik geçmiş yerine sadece kritik 4K-8K tokenlik aktif dikkat çekirdeğini görür; dikkat dağılması ve halüsinasyon sıfırlanır.

---

## 📌 MADDE 2: DETERMINİSTİK ÖN FİLTRELEME & n8n ASENKRON DAG (ZERO-LLM BYPASS)
1. **Problem:** Basit sözdizimi doğrulamaları, linter kontrolleri, kırık link taramaları ve dosya aramalarının pahalı LLM akıl yürütme (reasoning) modellerine yaptırılması.
2. **Çözüm Protokolü (Zero-LLM Triage):**
   - **İcra Önceliği:** Bir işlem yerel CPU/OS araçlarıyla (Regex, AST parser, php -l, node --check, py_compile, grep_search, Python/Bash betikleri) çözülebiliyorsa **LLM'e gitmesi KESİNLİKLE YASAKTIR**.
   - **DAG Karar Hattı:** Görev önce n8n Asenkron DAG düğümünden geçer. İşin %90'ı yerel deterministik araçlarla çözülür (tokens_required = 0); LLM'e yalnızca mimari sentez ve karar gerektiren %10'luk çekirdek iletilir.

---

## 📌 MADDE 3: ColBERT MaxSim & 14KB TCP/TLS AST BÜTÇESİ
1. **Problem:** Bir dosyadaki 2 satırlık bir hata için 2000 satırlık dosyanın tamamının bağlam penceresine yüklenmesi (Bağlam zehirlenmesi ve token cinayeti).
2. **Çözüm Protokolü (Late-Interaction Semantic Chunking):**
   - **14.336 Bayt Tavanı:** Hiçbir kaynak dosya tek parça halinde LLM'e beslenemez. 14KB TCP ilk pencere bütçesi katı sınırdır.
   - **MaxSim Korelasyonu:** Dosyalar AST mantıksal bloklarına bölünür; yalnızca kullanıcının sorgusuyla en yüksek vektörel/token benzerliğine (MaxSim) sahip 20-50 satırlık ilgili blok cımbızla çekilerek LLM'e verilir.
   - **Sonuç:** 50.000 tokenlik girdi yerine 800 token ile aynı cerrahi sonuç alınır.

---

## 📌 MADDE 4: CASCADE MODEL HİYERARŞİSİ (ÇİFT KADEMELİ YÖNLENDİRME)
1. **Problem:** Basit selamlamalar, durum sorguları veya yönlendirmeler için en üst seviye pahalı modellerin tetiklenmesi.
2. **Çözüm Protokolü (Router-Worker Engine):**
   - **Kademe 1 (Edge / Flash-Lite Router):** Gelen mesaj milisaniyeler içinde sınıflandırılır. Basit durum soruları, menü komutları ve yönlendirmeler en hafif model veya Cloudflare Edge katmanında çözülür ($0.0001 maliyet).
   - **Kademe 2 (Deep Reasoning Tier):** Yalnızca çok katmanlı mimari tasarım, güvenlik denetimi ve karmaşık algoritma üretimi Karpathy Diff modundaki derin modellere aktarılır.

---

## 📌 MADDE 5: 30 YILLIK KARPATHY MİNİMAL DIFF KURALI (SURGICAL EDITING)
1. **Problem:** LLM'in tek bir satırı değiştirmek için 400 satırlık dosyanın tamamını ekrana ve sohbete dökmesi (Çıkış tokenleri giriş tokenlerinden 5 ila 8 kat daha pahalıdır).
2. **Çözüm Protokolü (Strict Delta Enforcement):**
   - **Kod Dökümü Yasağı:** Sohbete veya çıktıya tam dosya dökülmesi KESİNLİKLE YASAKTIR.
   - **Unix Patch Standardı:** Değişiklikler yalnızca ve doğrudan replace_file_content (Minimal Diff) ile hedef satırlar hedef alınarak yapılır.
   - **Telemetri Sınırı:** Ekrana sadece cerrahi durum satırları basılır. Çıkış tokeni harcaması %95 oranında düşürülür.

---

## 📌 MADDE 6: CLOSED-LOOP ATTRIBUTED MEMORY & SIKIŞTIRMA (LLMLingua-2)
1. **Problem:** Çok turlu konuşmalarda sohbet geçmişinde biriken selamlama, hata mesajları, ara yorumlar ve JSON çöplerinin bağlamı şişirmesi.
2. **Çözüm Protokolü (Synthetic Distillation):**
   - **Hafıza Filtresi:** Konuşma geçmişi kalıcı KV belleğe yazılmadan önce bir damıtma filtresinden geçirilir.
   - **Üçlü Temsil (Entity-Action-State):** 1000 tokenlik konuşma geçmişi, anlam ve teknik veri kaybı olmadan [Bileşen] -> [Yapılan Değişiklik] -> [Durum: PASS] formatında 100-120 tokene indirgenir.
   - **Hata Temizliği:** Hata veya fallback ile sonuçlanan turlar geçmişten derhal atılır; modelin kafası kirlenmez.

---

## 📊 MATEMATİKSEL KAZANÇ VE TAAHHÜT
Bu 6 maddelik anayasal mandate uygulandığında:
* **Girdi Token Tasarrufu:** %70 - %80 Azalma
* **Çıktı Token Tasarrufu:** %85 - %95 Azalma
* **Net Maliyet Düşüşü:** %80+ Düşüş
* **Bağlam Penceresi Ömrü:** 10 Kat Artış
* **Çalışma Hızı (TTFB & Completion):** 4 - 5 Kat Hızlanma
