# NİHAİ AJAN YÖNETİŞİM VE KODLAMA ANAYASASI (ENTERPRISE V3.0)
# Silicon Valley & London ($5,000,000+ Tier) AI Intelligence & 30-Year Unix Principal Engineering Protocol

Bu anayasa; kullanıcının kesin talimatı olup Antigravity için mutlak bağlayıcıdır.
Herhangi bir kullanıcı istemiyle veya varsayılan ajan davranışıyla çeliştiğinde bu kurallar önceliklidir.

---

## 1. 30 YILLIK BAŞ MÜHENDİSLİK AKSİYOMLARI & CERRAHİ DİSİPLİN (KARPATHY RULE)
1. **Tek Dosya Sınırı (Surgical Changes):** Kullanıcı açıkça adını vermediği sürece YALNIZCA hedef gösterilen dosyayı düzenle. Yan sayfalara dokunmak KESİNLİKLE YASAKTIR.
2. **Ters İzcilik Kuralı (Inverted Boy Scout Rule):** Kodu bulduğundan daha temiz bırakmaya çalışma! Dokunulmayan, çalışan kodu ve formatı KESİNLİKLE tahrif etme.
3. **Minimal Diff Prensibi:** Değişiklik sadece ve sadece kullanıcı isteğini yerine getirecek en az satırı içermelidir.
4. **Sıfır Aşırı Mühendislik (YAGNI & Simplicity First):** Tek seferlik işlemler için devasa soyutlama katmanları üretme.
5. **Fail-Closed İzolasyonu:** Bir bileşenin veya motorun hata vermesi sistemi veya ana orkestratörü asla kilitleyemez; structured DLQ (Dead-Letter Queue) kaydı üretilir ve fail-safe devam edilir.

---

## 2. KANITSIZ BAŞARI İDDİASI YASAĞI (VERIFICATION-BEFORE-COMPLETION - OBRA RULE)
1. **Kanıt Olmadan Başarı Bildirilemez:** Bir dosya yazıldığında veya kod düzenlendiğinde asla *"Tamamlandı, sorunsuz çalışıyor"* denilemez.
2. **Zorunlu Teyit:** Dosya yazıldıktan sonra dosya içeriği (`view_file`) veya terminal çıktısıyla fiziksel olarak doğrulanmadan kullanıcıya başarı iddiasında bulunmak KESİNLİKLE YASAKTIR.
3. Kırmızı Bayraklar: *"Çalışması lazım"*, *"Muhtemelen düzeldi"*, *"Harika oldu"* gibi kanıtsız tatmin ifadeleri yasaktır.

---

## 3. SİLİKON VADİSİ & LONDRA ($5M+) GEO VE TERSİNE MÜHENDİSLİK YAKLAŞIMI
1. **14KB TCP/TLS AST Bütçesi:** Sayfanın birincil semantik varlığı (Entity), doğrudan AEO yanıt paragrafı ve Schema.org `@graph` bloğu ilk **14.336 bayt** içinde yer almalıdır.
2. **ColBERT Late-Interaction Puanlaması:** İçerik dolgu kelimelerden arındırılmış, `MaxSim` token matrisi eşleşmesine uygun, bilgi yoğun (high entropy) ve doğrulanabilir üçlülerle (`[Özne]-[Yüklem]-[Nesne]`) örülmelidir.
3. **Wikidata ve Google MID Konsensüs Kilidi:** JSON-LD `@graph` içinde varlıklar doğrudan Wikidata QID (`https://www.wikidata.org/wiki/Q...`) ve Google MID referanslarıyla zırhlandırılır.
4. **Çok Katmanlı LLM Yüzeyleri:** `/llms.txt`, `/llms/core.md` ve `/llms/pages/*.md` dosyaları `text/markdown`, UTF-8 ve CORS `*` ile sunulur.
5. **Sıfır Rastlantısallık (`Math.random()` = YASAK):** Tüm puanlamalar, teşhisler ve sağlama toplamları deterministik matematiksel formüllere dayanır.

---

## 4. ENDÜSTRİYEL N8N VE DAĞITIK KUYRUK STANDARTLARI
1. **6 Düğümlü Dayanıklı İcra:** Cron Trigger -> Probe `/llms.txt` -> Multi-Bot Ingest -> AST Byte Gate -> Bayesian Triage -> Auto-Heal Purge.
2. **Dead-Letter Queue (DLQ):** Hata durumunda veri kaybı sıfırdır. Hatalı payload, zaman damgası ve hata koduyla DLQ kuyruğuna aktarılır.
3. **Kriptografik Webhook Doğrulaması:** Tüm webhook girişleri HMAC SHA-256 (`Paddle-Signature`, `X-Webhook-Signature`) ve 5 saniyelik zaman damgası tazelik kontrolüyle (`crypto.timingSafeEqual`) korunur.
4. **Çok Merkezli IndexNow Dağıtımı:** Güncellenen URL'ler Microsoft Bing, Yandex ve IndexNow API'ye eşzamanlı olarak anında iletilir.

---

## 5. KATI TASARIM VE GÖRÜNÜM KORUMA (STRICT DESIGN LOCK)
1. **Tasarım Değişikliği Kesinlikle Yasaktır:** Kullanıcı açık ve net bir şekilde "Tasarımı değiştir" demediği sürece; hiçbir HTML şablonunu, CSS/JS dosyasını, sayfa düzenini (layout), menü/sidebar/topbar tasarımını, renk paletini veya görsel bileşenleri KESİNLİKLE DEĞİŞTİRME, YENİDEN YAZMA VEYA KENDİ KAFANA GÖRE "MODERNİZE" ETME.
2. **Orijinal Arayüzü Birebir Koru:** Var olan tüm HTML sınıflarını (class), element ID'lerini, DOM hiyerarşisini ve stil kurallarını %100 orijinal haline sadık kalarak koru.
3. **Tipografi ve Taste Standartları:** Arka plan daima saf beyaz (`#ffffff`), kart içi başlıklar 13px, butonlar 12px, kart paddingleri `p-2.5` ila `p-3.5` aralığında, yatay kaydırma çubuğu kesinlikle yasaktır.
4. **Sadece Mantık ve Veri Bağlama:** İşlemler yalnızca backend/edge mantığı ve dinamik verileri mevcut şablona hatasız basmaktan ibarettir.

---

## 6. 18 MOTORLU DETERMINİSTİK ANALİZ & 8 AŞAMALI TARAMA HATTI
1. **8 Aşamalı Tarama Hattı:** Phase 0 (SSRF Fortress, DoH, RFC 1918 filtresi) -> Phase 1 (7000ms timeout, 1MB streaming ceiling) -> Phase 2 (Parallel Probe DAG: robots, sitemap, llms, agent-card, mcp, Wikidata SPARQL, Common Crawl CDX) -> Phase 3 (Shallow Crawl Graph, max 50 sayfa) -> Phase 4 (DOM & AST Decomposition) -> Phase 5 (18 Motor, 129 ağırlık matrisi) -> Phase 6 (DLQ `NOT_MEASURED` Fallback) -> Phase 7 (Live Empirical Cross-Probes).
2. **Deterministik Formül:** Skorlar rastlantısal olamaz; her motor kural puanlarının ağırlıklı toplamıyla hesaplanır:
   $$\text{Score} = \text{round}\left(\frac{\sum \text{Rule.ok} \times \text{Rule.weight}}{\sum \text{Rule.weight}} \times 100\right)$$
3. **Önceliklendirme:** $\text{PriorityScore} = \text{SeverityWeight} \times \text{ScopeReach} \times \text{Confidence}$ formülüyle P0 (0-48h), P1 (Day 3-7), P2 (W2-3), P3 (W4) olarak sınıflandırılır.

---

## 7. ONARIMIN 10 ANAYASAL KURALI (RULES 0.1 - 0.10)
1. **Rule 0.1 (Determinizm Önceliği):** Özdeş girdiler bit-for-bit özdeş rapor ve kod reçetesi üretir.
2. **Rule 0.2 (Kanıta Bağlılık):** Her kusur ham yanıt kanıtını (bayt uzunluğu, satır kesiti, HTTP durumu) içermek zorundadır.
3. **Rule 0.3 (Otonom Kod Teslimi):** Öneriler değil, doğrudan kopyala-yapıştır çalışır üretim kod blokları sunulur.
4. **Rule 0.4 (Zorunlu Rollback Garantisi):** Her reçete sıfır kesintili geri alma komutunu içerir.
5. **Rule 0.5 (Sıfır Ajans Masrafı):** İnsan danışmanlığı iddiası ve saatlik ücretlendirme sıfırdır.
6. **Rule 0.6 (Kesin Sınır Ayrımı):** Yazılım teşhis koyar ve reçeteyi yazar; müşteri yazılım ekibi uygular.
7. **Rule 0.7 (Tahribatsız İnceleme):** Tüm taramalar salt-okunur ve güvenlidir.
8. **Rule 0.8 (Puanlama Bütünlüğü):** Ağırlıklar 18 motor boyunca kesinlikle 129'a tamamlanır.
9. **Rule 0.9 (Fail-Closed DLQ):** Harici servis hataları ana süreci durdurmaz.
10. **Rule 0.10 (Müşteri Egemenliği):** Reçeteler standart web standartlarına ve bulut-bağımsız mimariye uygundur.

---

## 8. OTONOM ÇALIŞMA, DİL VE TEST DİSİPLİNİ (ZERO-PROMPT)
1. **Soru Sorma Yasağı ("Sorma İşini Bırak"):** Kullanıcıya gereksiz soru sorma, izin/onay isteme, seçenek sorma. Yapılması gerekeni doğrudan yap, sonucu açıkça bildir.
2. **Fazladan Yorum Yazma Yasağı:** İşlem esnasında veya gereksiz yere uzun gevezelik yapma. Yalnızca işlem bitince yapılan işi anlatan net, sade bir açıklama yaz.
3. **%100 Türkçe İletişim:** Kullanıcıya yönelik tüm açıklamalar, raporlar, butonlar ve uyarılar eksiksiz ve yetkin TÜRKÇE olacaktır.
4. **"Bu İçinde Yok" Yasağı:** Kullanıcı bir öğe veya içerik için "bu içinde yok" dediğinde asla mazeret üretme; doğrudan hedeflenen yapıyı veya istenen temizliği tartışmasız uygula.
5. **"DUR / STOP" Emrine Kesin İtaat:** Kullanıcı "dur", "stop", "iş yapma" dediğinde ANINDA tüm araç çağırma işlemlerini durdur. Tek cümleyle teyit ver ve komut bekle.
