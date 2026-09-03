# SAGIARVIL SEARCH REVENUE OS — ENTERPRISE / EXCLUSIVE MASTER MANDATE

**Doküman Kodu:** SAGIARVIL-SRO-2026-V1  
**Statü:** SEO / GEO / AEO / LLMS / Sitemap / Crawler / Search Revenue alanında TEK BAĞLAYICI MANDATE  
**Repo:** `sagiarvil/belgin`  
**Domain:** `https://www.belginkuyumculuk.com`  
**Nihai Kalite Hedefi:** Kontrol edilebilir release kapılarında **100/100**. 99 final kabul değildir.  
**Ticari North Star:** **Organic Store Gross Profit + Qualified WhatsApp/Call/Store Visit** ve portföy seviyesinde **Total Organic Contribution Margin**.

> Bu mandate, bu repodaki önceki SEO/GEO/AEO/LLM-discoverability talimat ve şartname belgelerinin yerini alır. Çalışan `robots.txt`, sitemap dosyaları/üreteçleri, `llms.txt`, `llms-full.txt`, `/llms/**` bilgi düğümleri, schema kodları, ürün/fiyat/stok verileri ve SEO runtime varlıkları eski “talimat belgesi” sayılmaz; bunlar bu mandate altında denetlenen operasyon varlıklarıdır.

---

## 0. OTORİTE VE ÇELİŞKİ HİYERARŞİSİ

SEO/GEO/LLMS/search-growth konusunda öncelik sırası:

1. Kullanıcının bu görevdeki en güncel açık talebi.
2. Bu dosya: `SAGIARVIL_SEARCH_REVENUE_OS_MANDATE.md`.
3. Resmî arama motoru, schema, HTTP, güvenlik ve platform dokümantasyonu.
4. Repo içindeki güncel ve doğrulanmış runtime/source-of-truth dosyaları.
5. Belgin'in ürün, fiyat, stok, mağaza, yasal, ödeme, tasarım ve güvenlik gibi kendi alanındaki kanonik proje belgeleri.
6. Eski SEO/GEO/LLMS notları yalnız tarihsel bağlamdır; bu mandate ile çelişemez.

SEO çalışması ürün/fiyat/stok/yasal gerçekliği uyduramaz veya ezemez. Kullanıcının açık kuralı gereği **Chrono24 marka adı veya Chrono24 temelli bağlayıcı fiyat/güvence formülü yeniden eklenemez.**

Bir AI ajanı, geliştirici veya otomasyon; sayfa, routing, metadata, canonical, schema, sitemap, robots, LLMS, içerik, internal link, redirect veya search ölçümü değiştirmeden önce bu mandate'i okumak zorundadır.

---

## 1. AMAÇ

Amaç “çok trafik” değildir. Amaç Türkiye'de ve özellikle İzmir/Buca yerel ticari talebinde **lüks saat ve kuyumculuk aramasını güvenilir ürün/mağaza keşfine ve gerçek satış fırsatına dönüştüren; hızlı, makinece okunabilir, ölçülebilir bir Search Revenue Operating System** kurmaktır.

Başarı zinciri:

`LOCAL/PRODUCT QUERY → BRAND/CATEGORY/PRODUCT PAGE → TRUST + AVAILABILITY → WHATSAPP/CALL/VISIT/PURCHASE → GROSS PROFIT`

Kesin ranking, trafik veya gelir garantisi iddia edilemez. `%100` hedef, bizim kontrolümüzdeki mimari ve release kapılarının eksiksiz geçmesidir.

---

## 2. BELGIN DOMAIN OWNERSHIP

Belgin'in primer konu sahipliği:

- lüks saat
- ikinci el lüks saat
- saat markaları/modelleri/referansları
- kuyumculuk/mücevherat
- İzmir/Buca local commerce niyetleri
- showroom, teslimat, sipariş ve gerçek ürün keşfi
- marka → kategori → ürün → mağaza dönüşüm akışı

SKDM, DRFIN ve ExcelArşiv bu primer ticari niyetleri kopyalayamaz. Aynı primer ticari intent iki SAGIARVIL domaininde aynı anda sahiplenilemez.

---

## 3. SEARCH SINGLE SOURCE OF TRUTH — REGISTRY

Tüm indexable URL'ler merkezi Search Registry'de kayıtlı olmalıdır.

```yaml
route:
canonical:
status:
indexDirective:
domain:
locale:
pageRole:
primaryIntent:
secondaryIntents:
topicOwner:
primaryEntity:
supportingEntities:
title:
metaDescription:
h1:
schemaTypes:
sitemap:
  include:
  lastModified:
robotsPolicy:
llm:
  tier:
  node:
  parentNode:
evidence:
  sources:
  verifiedAt:
commercial:
  funnelStage:
  conversionAction:
measurement:
  conversionEvents:
```

Registry'de olmayan yeni indexable sayfa final release alamaz. Metadata, canonical, JSON-LD, sitemap üyeliği, LLMS ilişkisi ve mümkün olan yerde robots policy aynı SSOT'tan türetilmelidir.

---

## 4. MULTI-TIER LLMS KNOWLEDGE GRAPH — ZORUNLU

Minimum mimari:

```text
/llms.txt
/llms-full.txt
/llms/core.md
/llms/entities/
/llms/brands/
/llms/local/
/llms/topics/
/llms/pages/
```

Roller:

- `/llms.txt`: token-ekonomik ana manifest/router.
- `/llms-full.txt`: kontrollü geniş makine özeti.
- `/llms/core.md`: Belgin kimliği, mağaza, iş modeli, doğrulanabilir güven gerçekleri.
- `/llms/entities/**`: mağaza/showroom ve diğer stabil entity'ler.
- `/llms/brands/**`: yüksek değerli marka hub'ları; yalnız gerçek site envanteri/ilişkisiyle desteklenen bilgiler.
- `/llms/local/**`: İzmir/Buca/showroom/teslimat gibi gerçek local entity ve intent düğümleri.
- `/llms/topics/**`: ikinci el, sipariş üzerine ürün, doğrulama/orijinallik süreci gibi doğrulanabilir ticari bilgi konuları.
- `/llms/pages/**`: flagship canonical HTML sayfalarının derin subgraph'ları.

Her LLMS node:

```yaml
canonicalWebUrl:
primaryEntity:
primaryIntent:
parentNode:
lastVerified:
evidence:
relatedNodes:
```

Kurallar:

1. Flagship LLMS node canonical HTML ile bağlanır; saf entity kayıtları istisnadır.
2. Orphan LLMS node yasaktır.
3. LLMS içeriği ürün, fiyat, stok ve HTML gerçekliğiyle çelişemez.
4. Uydurma orijinallik belgesi, sertifika, stok, fiyat, teslimat, review, rating veya marka ilişkisi eklenemez.
5. Binlerce ürün için mekanik olarak binlerce `.md` üretmek zorunlu değildir. Ürün detayları Product schema + canonical HTML ile taşınabilir; LLMS katmanı yüksek değerli brand/local/topic/flagship düğümlerde yoğunlaşır.
6. `/llms/**` doğru MIME/UTF-8 ile servis edilmelidir.

---

## 5. LOCAL + PRODUCT ENTITY GRAPH — BELGIN İÇİN HARD GATE

Temel ticari graph:

`Organization → JewelryStore/LocalBusiness → Location → Brand → Product → Offer/Availability → WebPage → BreadcrumbList`

Sayfaya göre gerçek ve uygun Schema.org tipleri kullanılmalıdır. Product sayfasında mümkün olduğunda doğrulanmış gerçeklerden:

- brand
- model
- reference
- condition
- year (biliniyorsa)
- material (biliniyorsa)
- movement (biliniyorsa)
- availability
- price/offer yalnız gerçek ve güncelse
- store/location/delivery ilişkisi

kullanılabilir.

Schema yalnız görünür ve doğrulanabilir gerçekleri taşır. Sahte review/rating/availability/price/credential yasaktır. Stabil `@id` kullanılmalıdır.

---

## 6. LOCAL SEO CONTRACT

Belgin için local authority:

- mağaza adı/adres/telefon/saat bilgilerinde tutarlılık,
- canonical showroom/location entity,
- doğru Organization/JewelryStore bağlantısı,
- kullanıcıya gerçek yol/iletişim/dönüşüm olanağı,
- İzmir/Buca yerel sorgularında gerçek mağaza ve ürün değeri

üzerine kurulmalıdır.

Şehir/ilçe adını değiştirerek yapay doorway sayfaları üretmek yasaktır. Local page ancak gerçek kullanıcı değeri ve gerçek yer ilişkisi varsa indexlenebilir.

---

## 7. SITEMAP CONTRACT

Sitemap'e yalnız:

`HTTP 200 + canonical + indexable + production URL`

girebilir.

Sitemap index mümkün olduğunda semantik olarak pages/categories/products/magazine-images gibi uygun alt sitemaplere ayrılabilir.

Yasak:

- redirect URL
- 404/410
- noindex
- duplicate canonical
- staging/preview/admin
- sitemap'e konup robots ile yanlışlıkla engellenen canonical ticari URL
- sahte lastmod

**Sitemap ↔ robots kesişimi otomatik doğrulanmalıdır; yanlış bloklanmış ticari canonical URL sayısı 0 olmak zorundadır.**

---

## 8. ROBOTS VE AI CRAWLER GOVERNANCE

Belgin'de robots politikası özellikle kritik release gate'tir.

- Canonical, indexable ürün/marka/local ticari URL yanlışlıkla `User-agent: *` altında bloklanamaz.
- `/api`, `/admin`, staging/preview/private alanlar uygun şekilde korunur.
- Search/retrieval botları ile training botları ayrı policy olarak yönetilir.
- Robots duplicate-content çözme aracı değildir.
- Duplicate/filtre/alternatif URL sorunlarında uygun canonical/noindex/redirect stratejisi kullanılır.

---

## 9. CONTENT / INFORMATION GAIN CONTRACT

Yeni indexable içerik gerçek ticari veya bilgi değeri üretmelidir:

- gerçek ürün/marka bilgisi,
- mağaza/showroom bilgisi,
- model/reference/condition gibi satın alma kararı bilgileri,
- doğrulanabilir teslimat/sipariş süreci,
- gerçek ikinci el/lüks saat karar desteği,
- özgün mağaza/ürün deneyimi.

Yasak:

- seri düşük değerli AI kategori/şehir sayfaları,
- scraped/spun içerik,
- fake freshness,
- sahte scarcity,
- sahte review/rating/certificate,
- yapay backlink/click/account ağları,
- marka ile olmayan ilişkiyi varmış gibi gösteren içerik.

---

## 10. INTENT OWNERSHIP VE CANNIBALIZATION

Her indexable sayfanın tek `primaryIntent` sahibi vardır.

Repo içi duplicate primer intent = kritik hata.  
Cross-domain duplicate ticari intent = kritik hata.

Brand/category/product/local sayfalarının görevleri birbirine karıştırılmamalıdır.

Kararlar:

`KEEP / EXPAND / REFRESH / REPOSITION / MERGE / NOINDEX / DELETE`

---

## 11. INTERNAL LINK GRAPH

- Home/local hub → brand/category → product → related product/trust/local dönüşüm yolu açık olmalıdır.
- Elite/brand seçimi ilgili marka ürünlerini doğru listelemelidir.
- Indexable ticari/flagship sayfa orphan olamaz.
- Broken internal link = release hatası.
- Canonical olmayan/redirect URL'lere sistematik internal link verilmez.

---

## 12. CANONICAL / DUPLICATE HOMEPAGE CONTRACT

`/`, `/index.html`, www/non-www ve trailing-slash varyasyonları tek kanonik host/URL politikasında birleşmelidir. Aynı homepage'in ayrı indexlenebilir varyasyonları kabul edilmez.

Canonical tek başına bırakılmaz; uygulanabilir yerde redirect + internal-link + sitemap standardizasyonu birlikte yapılır.

---

## 13. PERFORMANCE / RENDER CONTRACT

Hard production:

```yaml
LCP_p75: <= 2.5s
INP_p75: <= 200ms
CLS_p75: <= 0.10
```

Exclusive hedef:

```yaml
LCP_p75: < 2.0s
INP_p75: < 150ms
CLS_p75: < 0.05
```

Ürün görselleri LCP/CLS bütçesini bozmayacak biçimde optimize edilir ancak kalite gereksiz düşürülmez. Field veri yoksa PASS uydurulamaz. İlk HTML ile hydrated DOM arasında kritik SEO içeriği parity korunur.

---

## 14. G0–G16 RELEASE GATES

- **G0** Registry integrity
- **G1** HTTP status
- **G2** Canonical/host/duplicate integrity
- **G3** Index/noindex integrity
- **G4** Robots ↔ sitemap reconciliation
- **G5** Title/H1/meta requirements
- **G6** Render parity
- **G7** Structured-data validity
- **G8** Entity integrity / stable @id
- **G9** Intra-domain intent collision
- **G10** Cross-domain SAGIARVIL intent collision
- **G11** Internal links / orphan detection
- **G12** Multi-tier LLMS integrity
- **G13** Product/local evidence + freshness + unsupported-claim control
- **G14** Performance budget
- **G15** Commercial conversion + measurement instrumentation
- **G16** Live production health check

Kritik gate başarısızsa `BUILD/RELEASE FAIL → PROD YOK`.

Gate'i geçmek için guard/test kapatmak veya gerçekliği bozan SEO metni eklemek yasaktır.

---

## 15. DEPLOYMENT CONTRACT

`baseline → branch/change → registry validation → G0–G16 → build/test → diff review → preview → production deploy → live health check → discovery/IndexNow where applicable → measurement`

Yüksek performanslı mevcut URL'ler baseline olmadan toplu rewrite edilmez.

---

## 16. MEASUREMENT & REVENUE LOOP

`query → impression → click → product/local landing → WhatsApp/call/store action/order → sale → revenue → gross profit`

Fırsat modeli:

`Expected Search Value = Search Demand × Commercial Intent × Conversion Probability × Ranking Probability × Topical Authority × Information Gain × AI Citation Potential / (Competition × Cost × Risk)`

North Star generic trafik değil, gerçek mağaza/ürün geliri ve nitelikli ticari aksiyondur.

---

## 17. BELGIN COMMERCIAL ARCHITECTURE

`LOCAL + PRODUCT + BRAND + TRUST + INVENTORY`

Flagship akış:

`SEARCH → BRAND/CATEGORY/LOCAL HUB → PRODUCT → TRUST/AVAILABILITY → CONTACT/VISIT/PURCHASE`

Önemli sayfalarda kullanıcıya açık fiyat/availability durumu, ürün gerçekleri, showroom ilişkisi, teslimat/iletişim ve uygun CTA bulunmalıdır; olmayan garanti veya güvence uydurulamaz.

---

## 18. HARD PROHIBITIONS

Kesinlikle yasak:

- sahte kullanıcı/hesap/tıklama/review,
- manipülatif backlink/PBN,
- düşük değerli AI seri üretimi,
- fake freshness,
- sahte stok/fiyat/rating/review/certificate,
- Chrono24 marka adı veya Chrono24 temelli bağlayıcı fiyat/güvence formülünü yeniden eklemek,
- robots/sitemap/canonical çatışması,
- preview/staging indexlenmesi,
- ölçülmemiş metriği ölçülmüş gibi raporlamak,
- eski SEO mandate'ini bu dosyanın üzerinde otorite saymak.

---

## 19. 100/100 FINAL ACCEPTANCE CONTRACT

```yaml
brokenCanonical: 0
homepageCanonicalDuplicates: 0
robotsSitemapConflict: 0
blockedCommercialCanonicals: 0
wrongNoindex: 0
orphanIndexable: 0
brokenInternalLinks: 0
schemaCriticalErrors: 0
entityConflicts: 0
undefinedPrimaryIntent: 0
intraDomainIntentCollision: 0
crossDomainIntentCollision: 0
llmsOrphanNodes: 0
llmsBrokenReferences: 0
unsupportedProductClaims: 0
fakeFreshness: 0
stagingIndexable: 0
previewIndexable: 0
commercialPageWithoutConversionPath: 0
commercialPageWithoutMeasurementContract: 0
```

Field CWV, Search Console, ranking, AI citation veya revenue gibi dış veriler yoksa **UNVERIFIED** kalır; sahte PASS verilemez.

---

## 20. AJAN ÇALIŞMA PROTOKOLÜ

1. Bu mandate'i tamamen oku.
2. Mevcut runtime/ürün/URL durumunu incele.
3. Search Registry kaydını bul/tasarla.
4. Intent/entity owner'ı doğrula.
5. Ürün/local claim varsa gerçek source-of-truth ile doğrula.
6. HTML, schema, sitemap, robots ve LLMS etkisini birlikte değerlendir.
7. G0–G16'yı çalıştır.
8. Fail varsa sebebi düzelt; testi kaldırma.
9. Prod sonrası canlı health-check yap.
10. Yapılmamış testi yapılmış gibi raporlama.

**Durum:** Bu dosya Belgin Kuyumculuk'un SEO/GEO/AEO/LLMS/Search Revenue konularında tek kanonik mandate'idir.
