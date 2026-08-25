# SEO TEKNİK ALTYAPISINI 10/10 SEVİYESİNE ÇIKARAN UYGULAMA HARİTASI
## Cursor İçin Fazlara Bölünmüş, Kopyala-Yapıştır Mandate Talimatnamesi

---

## BU BELGE NASIL KULLANILIR (5 yaşındaki çocuğa anlatır gibi)

Düşün ki bir ev inşa ediyorsun. Önce temel atılır, sonra duvarlar, sonra çatı, en son boya. Duvarı temelsiz örersen ev çöker. Bu belge de öyle — **10 fazdan** oluşuyor ve **sırayla** ilerlemek zorundasın.

Kurallar çok basit:

1. **Her fazın kendi "CURSOR'A VER" kutusu var.** O kutunun içindeki metni olduğu gibi kopyala, Cursor'a yapıştır, çalıştır.
2. **Her fazın sonunda "BİTTİ Mİ KONTROLÜ" listesi var.** Listedeki her madde ✅ olmadan bir sonraki faza GEÇME. Cursor'a "kontrol et, hepsi geçiyor mu" diye ayrıca sor.
3. **Bir fazı atlarsan, sonraki fazlar bozuk çalışır.** Registry olmadan structured data yazılmaz, canonical olmadan sitemap doğru olmaz. Sıra kutsaldır.
4. **Her faz kendi promptunda `[SITE]`, `[SITE_ID]` gibi yer tutucuları senin siteninkiyle değiştirmeni ister.** Bunu yapmadan Cursor'a verme — Cursor ya soru sorar ya da yanlış varsayımla ilerler.
5. **Bir faz bittiğinde Cursor'dan Türkçe bir özet rapor iste**: "Bu fazda ne yaptın, hangi dosyaları oluşturdun/değiştirdin, hangi testler geçti, hangi riskler var" — bunu oku, onayla, sonra devam et. Kör onay verme.

Toplam 10 faz var. Küçük bir site isen Faz 0-7 yeterli olabilir. Orta-büyük/kurumsal site isen Faz 8-10 **zorunludur**.

---

## FAZ 0 — KEŞİF (Cursor kod yazmadan ÖNCE siteni tanımalı)

**Bu faz ne işe yarar:** Bir doktor ameliyat yapmadan önce tahlil ister. Bu faz da o tahlil. Cursor, mevcut sitenin ne durumda olduğunu haritalamadan hiçbir kod satırı yazmamalı.

### CURSOR'A VER:

```
GÖREV: SEO Baseline Keşif Raporu

Sen bir üst düzey teknik SEO mühendisisin. Aşağıdaki adımları SIRAYLA uygula,
hiçbirini atlama, hiçbirini varsayımla geçme:

1. Proje kök dizinini tara. Kullanılan framework'ü tespit et (Next.js, Nuxt,
   WordPress, custom vb.) ve versiyon numarasını yaz.
2. Mevcut route/sayfa yapısını çıkar: kaç tane sayfa var, hangi klasörde,
   hangi URL pattern'iyle üretiliyor.
3. Aşağıdaki dosyaları ara ve içeriklerini raporla (yoksa "YOK" yaz):
   - robots.txt
   - sitemap.xml veya sitemap index dosyaları
   - Herhangi bir "seo config" veya "meta" dosyası
   - next-sitemap, next-seo veya benzeri SEO kütüphanesi kurulu mu?
4. Kod içinde canonical tag üretimini bul. Her sayfada var mı, dinamik mi
   sabit mi, self-referencing mi kontrol et.
5. Structured data (JSON-LD) kullanımı var mı? Hangi @type'lar kullanılıyor?
6. Render yöntemini tespit et: SSR mi, SSG mi, tamamen client-side mi (CSR)?
   Bunu "view-source" mantığıyla düşün: ilk HTML response'da başlık,
   açıklama, ana içerik var mı yoksa hepsi JavaScript ile mi geliyor?
7. Title/meta description üretim mantığını bul: sabit mi, sayfa bazlı
   dinamik mi, boş mu?
8. Bulduğun HER ŞEYİ şu formatta bir markdown dosyasına yaz:
   docs/seo/00_BASELINE_RAPORU.md

   Rapor şu bölümleri içermeli:
   - Framework ve mimari özeti
   - Route/sayfa envanteri (tablo halinde)
   - Eksik/bozuk bulunan her şey (madde madde, "EKSİK:" öneki ile)
   - Risk seviyesi tahmini (Düşük/Orta/Yüksek) her eksik için

9. Rapor bitince bana ŞU SORUYU SOR ve cevabımı bekle, devam etme:
   "Baseline raporu hazır. Faz 1'e (Registry kurulumu) geçmemi onaylıyor
   musun, yoksa önce bu raporu birlikte gözden geçirelim mi?"

ÖNEMLİ: Bu fazda HİÇBİR KOD YAZMA, HİÇBİR DOSYA DEĞİŞTİRME. Sadece oku,
raporla, sor. Kod yazmak bir sonraki fazda başlar.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] `docs/seo/00_BASELINE_RAPORU.md` dosyası oluştu mu?
- [ ] Rapor içinde framework, route sayısı, render yöntemi net yazıyor mu?
- [ ] Eksik listesi var mı ve risk seviyeleri işaretli mi?
- [ ] Cursor senden onay istedi mi, hiçbir kod yazmadan durdu mu?

Hepsi ✅ ise Faz 1'e geç.

---

## FAZ 1 — TEK GERÇEK KAYNAK (SEO REGISTRY KURULUMU)

**Bu faz ne işe yarar:** Şu an her sayfanın title'ı, canonical'ı, meta'sı ayrı ayrı, kod içinde dağınık yerlerde yazılıyor olabilir. Bu, birinin bir yeri değiştirip diğerini unutmasına yol açar. Bu fazda TEK BİR dosya/veritabanı oluşturuyoruz — her sayfanın SEO bilgisi SADECE oradan okunacak. Bir lokantanın tek bir mönüsü olması gibi düşün — her masada farklı mönü olmaz.

### ÖNCE SEN DOLDUR (Cursor'a vermeden önce):

Aşağıdaki bilgileri kendi siten için hazırla, promptun içine yapıştır:

- `[SITE]` → gerçek domainin (örn. `ornek.com`)
- `[SITE_ID]` → site kısa kodu (örn. `ornek`)
- Site tipi: SaaS mı, e-ticaret mi, kurumsal mi, medya mı, yerel işletme mi?
- YMYL mi (sağlık/finans/hukuk konusu var mı)? Evet/Hayır

### CURSOR'A VER:

```
GÖREV: SEO Registry (Tek Gerçek Kaynak) Kurulumu

SİTE BİLGİLERİ:
- Domain: [SITE]
- Site ID: [SITE_ID]
- Site tipi: [SaaS/e-ticaret/kurumsal/medya/yerel-işletme]
- YMYL: [Evet/Hayır]

Aşağıdaki adımları SIRAYLA, HİÇBİRİNİ ATLAMADAN uygula:

ADIM 1 — Registry tipini oluştur
`src/seo/types.ts` dosyasını oluştur ve içine şu TypeScript interface'lerini
TAM OLARAK ekle (hiçbir alanı çıkarma, hiçbirini "opsiyonel" yapma çünkü
zaten opsiyonel olanlar işaretli):

```typescript
export type PageRole =
  | 'home' | 'hub' | 'category' | 'tool' | 'service'
  | 'article' | 'research' | 'comparison' | 'product'
  | 'local' | 'legal';

export type IndexDirective = 'index' | 'noindex';

export type RichResultType =
  | 'Article' | 'BreadcrumbList' | 'Dataset' | 'Event'
  | 'JobPosting' | 'LocalBusiness' | 'Organization' | 'Product'
  | 'ProfilePage' | 'QAPage' | 'Recipe' | 'ReviewSnippet'
  | 'SoftwareApplication' | 'VideoObject' | 'None';

export interface SeoEntityRef {
  readonly id: string;
  readonly name: string;
  readonly type: 'Organization' | 'Person' | 'Product' | 'Service' | 'Concept';
  readonly sameAs: readonly string[];
  readonly wikidataQid?: string;
}

export interface ContentQualityContract {
  readonly userProblem: string;
  readonly decisionEnabled: string;
  readonly uniqueValueTypes: readonly (
    | 'firstPartyData' | 'calculator' | 'expertExperience'
    | 'methodology' | 'caseStudy' | 'comparison' | 'dataset' | 'template'
  )[];
  readonly evidenceRefs: readonly string[];
  readonly limitations: readonly string[];
  readonly lastHumanReviewAt: string;
}

export interface SeoPageRecord {
  readonly route: `/${string}` | '/';
  readonly locale: string;
  readonly role: PageRole;
  readonly indexDirective: IndexDirective;
  readonly canonicalRoute: `/${string}` | '/';
  readonly title: string;
  readonly metaDescription: string;
  readonly h1: string;
  readonly primaryIntent: string;
  readonly primaryEntityId: string;
  readonly secondaryEntityIds: readonly string[];
  readonly authorId?: string;
  readonly reviewerId?: string;
  readonly publishedAt?: string;
  readonly modifiedAt: string;
  readonly richResultTypes: readonly RichResultType[];
  readonly imageUrl?: string;
  readonly conversionEvent: string;
  readonly sourceRefs: readonly string[];
  readonly parentHubRoute?: `/${string}`;
  readonly relatedRoutes: readonly `/${string}`[];
  readonly qualityContract?: ContentQualityContract;
  readonly contentSourcePath?: string;
}
```

ADIM 2 — Registry doğrulama şemasını yaz (Zod ile)
`scripts/validate-registry.ts` dosyasını oluştur. Bu dosya şunu yapmalı:
- Yukarıdaki SeoPageRecord tipinin TAM karşılığı olan bir Zod şeması yaz.
- Bu şema, her registry kaydını runtime'da doğrulayacak.
- ŞU KURALLARI şemaya kod olarak göm (bunlar geçmezse hata fırlatsın):
  a) `route` her zaman "/" ile başlamalı
  b) `canonicalRoute` boş olamaz
  c) `modifiedAt` geçerli bir ISO tarih olmalı VE gelecekte bir tarih OLAMAZ
  d) `richResultTypes` boşsa uyarı ver (hata değil, warning)
  e) Eğer `indexDirective` "noindex" ise, bu route sitemap listesine
     GİREMEZ — bunu ayrı bir fonksiyonla (`assertNoindexNotInSitemap`)
     kontrol et.
- Script'in sonunda: tüm registry kayıtlarını oku, hepsini bu şemadan
  geçir, HERHANGİ BİR HATA VARSA process.exit(1) ile çık (build'i kırsın).

ADIM 3 — Mevcut sayfaları registry'ye taşı
Faz 0'daki baseline raporunu (`docs/seo/00_BASELINE_RAPORU.md`) oku.
Oradaki HER route için bir `SeoPageRecord` kaydı oluştur ve
`src/seo/registry.ts` dosyasına ekle. Eksik bilgi varsa (örn. title
yoksa) placeholder yazma — o alanı TODO olarak işaretle ve ayrı bir
listede topla: `docs/seo/EKSIK_REGISTRY_ALANLARI.md`

ADIM 4 — CI'a bağla
`package.json` içine şu script'i ekle:
"seo:validate-registry": "tsx scripts/validate-registry.ts"

Bunu mevcut build/deploy pipeline'ına (varsa GitHub Actions, varsa
Vercel build command'ına) "build'den ÖNCE çalışacak" şekilde ekle.
Registry doğrulaması geçmezse build durmalı.

ADIM 5 — Rapor ver
İşin bitince `docs/seo/01_FAZ1_RAPORU.md` dosyasına şunu yaz:
- Kaç sayfa registry'ye taşındı
- Kaç sayfada eksik alan var (EKSIK_REGISTRY_ALANLARI.md'ye link ver)
- Zod validasyonu CI'a bağlandı mı, hangi komutla çalışıyor
- Bir sonraki faz için benim onayımı iste, kod yazmaya devam etme.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] `src/seo/types.ts` oluştu ve tüm alanlar eksiksiz mi?
- [ ] `scripts/validate-registry.ts` çalışıyor mu (`npm run seo:validate-registry` ile test et)?
- [ ] Bozuk bir kayıt (örn. gelecekte bir `modifiedAt`) verildiğinde script gerçekten hata veriyor mu? (Bunu bilerek test et!)
- [ ] Mevcut sayfaların en az %90'ı registry'de mi?
- [ ] CI/build pipeline'ına bağlandı mı?

Hepsi ✅ ise Faz 2'ye geç.

---

## FAZ 2 — HOST, PROTOKOL, CANONICAL, REDIRECT

**Bu faz ne işe yarar:** Aynı sayfaya 4 farklı yoldan gidilebiliyorsa (http://site.com, https://site.com, https://www.site.com, https://site.com/sayfa/) Google bunları 4 ayrı sayfa sanabilir ve gücünü bölüştürür. Bu fazda "her içeriğin TEK VE YALNIZ BİR adresi olacak" kuralını koduyor.

### CURSOR'A VER:

```
GÖREV: Canonical Host, Redirect ve Protokol Standardizasyonu

Aşağıdaki kuralları KOD OLARAK uygula. Hiçbirini "dokümana yazıp
bırakma" — her biri gerçek bir middleware/config/test olmalı.

ADIM 1 — Tek canonical host kararı
Bana şunu sor ve cevabımı bekle: "www.[SITE] mi yoksa [SITE] (www'suz)
mu canonical host olacak?" Cevabımı aldıktan sonra devam et.

ADIM 2 — Redirect middleware'i yaz
Framework'e uygun (Next.js ise middleware.ts, başka framework ise
uygun eşdeğeri) bir redirect katmanı oluştur ki:
a) HTTP isteği → HTTPS'e 301 ile yönlensin
b) Alternatif host (www/www'suz) → canonical host'a 301 ile yönlensin
c) Trailing slash politikası (sonunda / olan/olmayan) tek bir standarda
   301 ile yönlensin
d) Büyük harfli URL'ler küçük harfe 301 ile yönlensin
e) Bu redirect'ler TEK HOP olmalı — yani http://WWW.SITE.com/Sayfa/
   gibi 3 hatanın birden olduğu bir URL bile TEK bir 301 ile doğru
   adrese gitmeli, zincir OLMAMALI (3 ayrı redirect'e düşmemeli)

ADIM 3 — Self-canonical enjeksiyonu
Registry'den (`src/seo/registry.ts`) her sayfanın `canonicalRoute`
alanını okuyup `<link rel="canonical">` tag'ini otomatik üreten bir
fonksiyon/component yaz. Bu, HER indexable sayfada OLMAK ZORUNDA.
Manuel canonical yazımı olan yerler varsa (Faz 0 raporunda bulundu),
onları bul ve bu merkezi sisteme bağla, eskisini sil.

ADIM 4 — Güvenlik header'larını ekle
Şu header'ları sunucu/CDN config'ine ekle:
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
NOT: "preload" direktifini EKLEME — bu geri döndürülemez bir risktir,
sadece TÜM alt domainlerin kalıcı HTTPS'e hazır olduğu ayrıca
doğrulandıktan sonra manuel olarak eklenir. Bunu otomatik ekleme.

ADIM 5 — Redirect loop koruması
Bir test scripti yaz (`scripts/test-redirect-loops.ts`) ki:
- Registry'deki tüm route'ları alıp gerçek HTTP isteği atsın
  (staging/local ortamda)
- Herhangi bir redirect zinciri 1 hop'tan fazlaysa FAIL versin
- Herhangi bir redirect loop (A→B→A) tespit edilirse FAIL versin
Bu script'i CI'a ekle.

ADIM 6 — Kabul testini çalıştır
Şu curl testlerini staging ortamında SEN ÇALIŞTIR ve çıktısını rapora
yapıştır:
curl -sSIL http://[SITE]/
curl -sSIL https://www.[SITE]/
curl -sSI https://[SITE]/[herhangi bir gerçek route]

ADIM 7 — Rapor ver
`docs/seo/02_FAZ2_RAPORU.md` dosyasına: hangi host canonical seçildi,
redirect middleware'in nerede olduğu, curl test çıktıları, redirect
loop testinin sonucu. Onay iste, devam etme.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] Tüm alternatif host/protokol/slash varyasyonları TEK 301 ile doğru adrese gidiyor mu (curl ile bizzat test et)?
- [ ] Zincir 1 hop'u geçmiyor mu?
- [ ] Her sayfada self-canonical var mı (view-source ile 5 rastgele sayfada kontrol et)?
- [ ] `preload` header'ı YANLIŞLIKLA eklenmedi mi (bunu bilerek kontrol et, geri dönüşü yok)?
- [ ] Redirect loop testi CI'da çalışıyor mu?

Hepsi ✅ ise Faz 3'e geç.

---

## FAZ 3 — URL YAPISI, SITEMAP, ROBOTS, CRAWL-INDEX DURUM MAKİNESİ

**Bu faz ne işe yarar:** Google'a "hangi sayfalarımı tara, hangilerini tarama; hangilerini göster, hangilerini gösterme" talimatını NET ve ÇELİŞMEYEN şekilde vermek. Karışık talimat (örn. hem noindex hem robots.txt'te engelli) Google'ı şaşırtır ve o sayfa hiç doğru işlenmez.

### CURSOR'A VER:

```
GÖREV: URL Politikası, Sitemap, Robots.txt ve Crawl-Index Durum Makinesi

ADIM 1 — Her route'a bir "durum" ata
Registry'deki her SeoPageRecord için şu 5 durumdan (state) birini
hesaplayan bir fonksiyon yaz (`src/seo/pageState.ts`):

DRAFT | PUBLISHED_INDEXABLE | PUBLISHED_NOINDEX | REDIRECTED | GONE

Kurallar TAM OLARAK şöyle olmalı, başka türlü olamaz:
- PUBLISHED_INDEXABLE: HTTP 200, robots="index", sitemap'te VAR,
  canonical kendine (self)
- PUBLISHED_NOINDEX: HTTP 200, robots="noindex", sitemap'te YOK
- REDIRECTED: HTTP 301/308, robots YOK, sitemap'te YOK, canonical hedef
  sayfaya işaret eder
- GONE: HTTP 404/410, robots YOK, sitemap'te YOK

KRİTİK YASAK: Bir sayfa asla hem "noindex" HEM DE robots.txt'te
"disallow" olamaz — çünkü bot sayfayı görmezse noindex etiketini de
göremez, bu yüzden sayfa yanlışlıkla indekste kalabilir. Bunu
otomatik kontrol eden bir test yaz.

ADIM 2 — Soft-404 dedektörü yaz
`scripts/detect-soft-404.ts` oluştur. Şu durumları tarasın ve WARN
versin:
- HTTP 200 dönen ama içinde "bulunamadı/sayfa yok/no results" gibi
  ana mesaj olan sayfalar
- HTTP 200 dönen ama ana içerik metni neredeyse boş olan sayfalar
- Silinen URL'lerin hepsinin ana sayfaya (/) redirect edildiği durumlar
  (bu YANLIŞTIR — 410 kullanılmalı)
- Boş kategori/filtre sayfaları
- Çalışmayan "hesaplama aracı" sayfaları (buton var ama sonuç
  üretmiyor)

ADIM 3 — Sitemap üretici yaz
`scripts/generate-sitemap.ts` oluştur:
- SADECE registry'de `indexDirective: 'index'` VE durumu
  PUBLISHED_INDEXABLE olan route'ları dahil et
- 50.000 URL / 50MB sınırını aşarsa otomatik böl (sitemap index +
  alt sitemap'ler, tipe/locale'e göre)
- `lastmod` alanını ASLA build tarihinden alma — git commit tarihinden
  veya CMS'in `updatedAt` alanından al:
  `execSync('git log -1 --format=%cI -- "' + filePath + '"')`
- LASTMOD KALİTE KONTROLÜ ekle: Aynı timestamp'e sahip URL oranı
  %80'i geçerse WARN, %95'i geçerse (gerçek toplu migrasyon değilse)
  FAIL. Gelecekte bir tarih varsa FAIL.
- Redirect, 404, 5xx, noindex olan HİÇBİR URL sitemap'e giremez —
  bunu bir assertion ile garanti et, build'i kırsın.

ADIM 4 — robots.txt üretici yaz
- robots.txt sadece TARAMA kontrolü için kullanılsın, "indeksten
  çıkarma" amacıyla KULLANILMASIN (bu yanlış kullanımdır).
- Sitemap URL'sini robots.txt içine ekle.
- Gereksiz/değersiz parametre kombinasyonlarını (session id, sort,
  tracking param) burada crawl'dan hariç tutabilirsin ama bunu
  registry'deki facet kararlarıyla (Adım 5) tutarlı yap.

ADIM 5 — Faceted navigation / filtre karar matrisi
Eğer sitede filtre/facet sayfaları varsa (örn. e-ticaret kategori
filtreleri), her facet kombinasyonu için şu 5 karardan birini
registry'ye ekle:
- Ticari + benzersiz değer var → indexable landing page yap
- Kullanıcı filtresi, belirsiz talep → crawl kontrollü, canonical
  parent'a işaret etsin
- Sıralama/UTM parametresi → canonical parent'a işaret etsin,
  internal link VERME
- Sonsuz kombinasyon → crawl'ı kapat, URL bile üretme
- Kalıcı kaldırılmış → 404/410 veya en yakın eşdeğere 301

ADIM 6 — Pagination kuralı
Sayfa 2, 3, 4... olan listelerde:
- Her sayfa kendi canonical'ına sahip olsun (page 1'e canonical
  EDİLMESİN — bu sık yapılan bir hatadır)
- Gerçek `<a href="...">` linkleri kullan, sadece JavaScript
  onClick ile sayfa değiştirme YASAK

ADIM 7 — Search Console'a bağla ve rapor ver
Sitemap'i Search Console'a nasıl submit edeceğini adım adım yaz
(manuel adım, sen yapacaksın). `docs/seo/03_FAZ3_RAPORU.md`'ye:
kaç sayfa PUBLISHED_INDEXABLE, kaç tanesi soft-404 riski taşıyor,
sitemap kaç parçaya bölündü, robots.txt içeriği. Onay iste.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] Her route'un tek bir net durumu var mı (çelişki yok mu)?
- [ ] Hiçbir sayfa hem noindex hem robots.txt'te disallow değil mi?
- [ ] Sitemap sadece 200/indexable/canonical-self sayfaları içeriyor mu?
- [ ] `lastmod` gerçek içerik değişikliğinden mi geliyor (build tarihinden değil)?
- [ ] Soft-404 dedektörü çalıştırıldı mı, sonuçlar temizlendi mi?
- [ ] Sitemap Search Console'a gönderildi mi?

Hepsi ✅ ise Faz 4'e geç.

---

## FAZ 4 — RENDER: SSR/SSG VE HYDRATION PARITY

**Bu faz ne işe yarar:** Google bir sayfayı ilk gördüğünde (ham HTML) ne görüyorsa, kullanıcı JavaScript çalıştıktan sonra ne görüyorsa, İKİSİ DE AYNI ANLAMA gelmeli. Aksi halde Google "boş sayfa" görüp değer vermez.

### CURSOR'A VER:

```
GÖREV: Render Stratejisi ve Hydration Parity Denetimi

ADIM 1 — İlk HTML zorunluluk denetimi
`scripts/check-first-html.ts` yaz. Bu script, verilen bir route
listesi için HAM HTTP isteği atsın (JavaScript ÇALIŞTIRMADAN, yani
fetch/curl ile) ve şu öğelerin ham HTML içinde var olup olmadığını
kontrol etsin:
- <title>
- <meta name="description">
- <link rel="canonical">
- <meta name="robots">
- hreflang tag'leri (varsa)
- <h1>
- Ana açıklayıcı metin (en az X karakter, boş olmayan gerçek içerik)
- Crawlable <a href> internal linkler
- Kritik JSON-LD scripti
- Ana görsel (varsa alt text ile)
Herhangi biri EKSİKSE, o route için FAIL raporla.

ADIM 2 — Sayfa tipine göre render kararı uygula
Registry'deki her `role` alanına göre şu render stratejisini uygula
(zaten farklıysa düzelt):
- home / hub / category → SSG veya SSR (statik/sunucu render)
- article / research / comparison → SSG veya SSR
- tool (hesaplama aracı) → sonuç kısmı client-side OLABİLİR ama
  açıklayıcı/metodoloji metni SSR olmalı
- Kullanıcı paneli / login sonrası içerik → CSR + noindex (bunlar
  zaten indexlenmemeli)
- Kişiselleştirilmiş sonuç sayfaları → CSR, ayrı bir public canonical
  içerikten bağımsız tutulmalı

ADIM 3 — Hydration parity testi (Puppeteer ile)
`scripts/check-html-parity.ts` yaz:
- Puppeteer ile sayfayı aç, JavaScript çalışsın (rendered DOM)
- Aynı sayfanın ham HTML halini de al (fetch ile)
- İkisinin: title, H1, canonical URL, ana metin ANLAMININ eşleştiğini
  kontrol et (birebir string eşitliği değil, ANLAM eşitliği —
  örn. H1 hydration sonrası DEĞİŞMEMELİ)
- JS hatası simüle et (bilerek bir script'i bozarak test ortamında):
  ana içerik hâlâ okunabilir kalıyor mu kontrol et

ADIM 4 — Prod smoke test
Şu iki komutu staging/prod'da SEN çalıştır, çıktıyı karşılaştır:
curl -sS https://[SITE]/[ROUTE] > /tmp/page.html
grep -E "<title>|<h1|rel=\"canonical\"|application/ld\+json" /tmp/page.html

ADIM 5 — Rapor ver
`docs/seo/04_FAZ4_RAPORU.md`'ye: kaç route'ta ham HTML eksiği bulundu
ve düzeltildi, hangi page role'ler hangi render stratejisini kullanıyor,
hydration parity testinin sonucu. Onay iste.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] `check-first-html.ts` tüm kritik sayfalarda PASS veriyor mu?
- [ ] JavaScript kapalıyken (curl ile) title/H1/canonical/ana içerik görünüyor mu (bizzat kontrol et)?
- [ ] Hydration sonrası H1/title/canonical değişmiyor mu?
- [ ] JS hata verdiğinde ana içerik hâlâ okunabilir mi?

Hepsi ✅ ise Faz 5'e geç.

---

## FAZ 5 — İÇERİK KALİTESİ, E-E-A-T, ENTITY SİSTEMİ

**Bu faz ne işe yarar:** Google'a "bu içeriği gerçek bir uzman, gerçek veriyle yazdı, kopyala-yapıştır genel bilgi değil" kanıtını vermek. Bu, hem sıralama hem de kullanıcı güveni için en kritik katman.

### CURSOR'A VER:

```
GÖREV: Content Quality Contract, E-E-A-T ve Entity Sistemi Kurulumu

ADIM 1 — Her indexable sayfaya kalite sözleşmesi zorunluluğu getir
Registry'deki `qualityContract` alanını ZORUNLU hale getir (opsiyonel
değil) HER `role: article | research | comparison | tool` sayfası için.
Zod şemasında (Faz 1'de yazdığın) şu kuralı ekle: eğer role bunlardan
biriyse VE qualityContract yoksa VEYA `uniqueValueTypes` dizisi 2
elemandan azsa, build'i KIR (fail).

uniqueValueTypes şu listeden EN AZ 2 tane içermeli:
firstPartyData, calculator, expertExperience, methodology, caseStudy,
comparison, dataset, template

ADIM 2 — Yazar/uzman entity sayfaları oluştur
Her yazar/uzman için TEK bir profile sayfası (`/uzmanlar/[slug]`) ve
şu JSON-LD'yi otomatik üreten bir component yaz:

{
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://[SITE]/uzmanlar/[slug]#person",
    "name": "...",
    "jobTitle": "...",
    "worksFor": {"@id": "https://[SITE]/#organization"}
  }
}

Registry'deki her `authorId` alanı bu profile sayfasına bağlanmalı —
kopuk/eksik authorId varsa listele.

ADIM 3 — YMYL ise ek zorunlu alanlar
EĞER site YMYL ise (Faz 1'de belirttiğin), şu alanların HER ilgili
sayfada var olduğunu doğrulayan bir kontrol scripti yaz:
- Yazar adı + uzmanlık alanı + doğrulanabilir profil linki
- Yayın tarihi + anlamlı güncelleme tarihi (build tarihi DEĞİL)
- Metodoloji/hesap varsayımları açıklaması
- Kaynak ve veri sürüm tarihi
- Çıkar çatışması / affiliate açıklaması (varsa)
- Hukuki/finansal/sağlık kapsam sınırı metni
- Gerçek şirket iletişim bilgisi ve editoryal politika linki
Eksik olanları `docs/seo/YMYL_EKSIKLER.md`'ye listele, build'i KIRMA
(bunlar editoryal karar gerektirir) ama UYARI ver.

ADIM 4 — Cannibalization (sorgu çakışması) dedektörü
`scripts/detect-cannibalization.ts` yaz. Registry'deki tüm sayfaları
tarayıp:
- Aynı `primaryIntent` + benzer `title`/`h1`'e sahip birden fazla
  indexable sayfa varsa listele
- Bunları "muhtemel çakışma" olarak raporla, hangi sayfanın "owner"
  (primary) olması gerektiğini öner (en güçlü/en eski/en çok backlink
  alan)
Otomatik silme/birleştirme YAPMA — sadece raporla, insan karar versin.

ADIM 5 — Entity/Wikidata doğrulama
Registry'deki her `SeoEntityRef.wikidataQid` alanı için:
`scripts/validate-entity.ts` yaz, her QID için
https://www.wikidata.org/wiki/Special:EntityData/[QID].json adresine
istek atıp 200 dönüp dönmediğini kontrol etsin. Geçersiz QID varsa
build'i KIR.

ADIM 6 — Rapor ver
`docs/seo/05_FAZ5_RAPORU.md`: kaç sayfada kalite sözleşmesi tamamlandı,
kaç yazar profili oluşturuldu, YMYL eksik listesi (varsa), kaç
cannibalization riski bulundu, entity doğrulama sonucu. Onay iste.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] Her article/research/comparison/tool sayfasında en az 2 benzersiz değer türü var mı?
- [ ] Her yazarın tek ve doğru bir profile sayfası var mı?
- [ ] (YMYL ise) zorunlu güven alanları kontrol edildi mi?
- [ ] Cannibalization raporu üretildi mi ve gözden geçirildi mi?
- [ ] Tüm Wikidata QID'ler geçerli mi?

Hepsi ✅ ise Faz 6'ya geç.

---

## FAZ 6 — STRUCTURED DATA VE RICH RESULTS

**Bu faz ne işe yarar:** Google'a sayfanın "ne olduğunu" makine diliyle anlatmak — ama SADECE sayfada gerçekten görünen bilgiyi. Görünmeyen bilgiyi schema'ya yazmak (örn. sahte puan) ceza sebebidir.

### CURSOR'A VER:

```
GÖREV: Structured Data (JSON-LD) Sistemi Kurulumu

ADIM 1 — Page role → şema tipi eşleştirmesi
Şu tabloyu KOD OLARAK uygula (her page role için zorunlu ve varsa
eklenecek şema tiplerini üreten bir merkezi fonksiyon yaz,
`src/seo/schema/buildSchema.ts`):

- home → Organization, WebSite, WebPage (+ uygunsa LocalBusiness)
- article → Article/BlogPosting, Person/Organization, BreadcrumbList
  (+ uygunsa VideoObject)
- tool/SaaS → SoftwareApplication, WebPage, BreadcrumbList (+ SADECE
  gerçek ürün teklifi varsa Product)
- research/dataset → Dataset, Article/WebPage (+ uygunsa VideoObject)
- product → Product, Offer, BreadcrumbList (+ varsa
  MerchantReturnPolicy/ShippingDetails)
- local → LocalBusiness, Organization, BreadcrumbList
- profile → ProfilePage, Person
- job → JobPosting
- video watch page → VideoObject (+ uygunsa Clip/SeekToAction)

ADIM 2 — Tek @graph yapısı kullan
Her sayfada ayrı ayrı <script> blokları yerine TEK bir @graph JSON-LD
üret. Organization/WebSite bilgisi TÜM sayfalarda AYNI @id'yi
kullanarak referans versin (merkezi bir yerden gelsin, kopyalanmasın).

ADIM 3 — Görünür içerik eşleşmesi (parity) testi
`scripts/validate-schema-parity.ts` yaz. Bu script her sayfa için:
- JSON-LD'deki her değerin (fiyat, tarih, yazar adı, ürün adı vb.)
  sayfanın GÖRÜNÜR HTML içeriğinde de gerçekten var olduğunu kontrol
  etsin.
- Uyuşmazlık varsa (örn. schema'da fiyat var ama sayfada görünmüyor)
  FAIL versin.

ADIM 4 — Google Rich Results Test API entegrasyonu
`scripts/validate-schema-google.ts` yaz. Örneklem sayfalar için
Google'ın Rich Results Test API'sine istek atıp sonucu kontrol etsin.
Deploy öncesi CI'da çalıştır.

ADIM 5 — 2026 güncel kısıtlamaları uygula
- HowTo şemasını KULLANMA (deprecated, zorunlu değil)
- FAQPage şemasını SADECE semantik amaçla tut, "rich result garantisi"
  bekleme/vaat etme (Ağustos 2026'da FAQ arama görünümü kaldırıldı)
- Her sayfaya zorla FAQPage/HowTo EKLEME — sadece gerçekten uygunsa
- Kullanıcıya görünmeyen review/rating/price schema'sı YAZMA — bu
  hard yasak, kod review'da özellikle kontrol edilecek

ADIM 6 — Rapor ver
`docs/seo/06_FAZ6_RAPORU.md`: hangi page role'lerde hangi şemalar
uygulandı, parity testinin sonucu, Google Rich Results Test
sonuçları. Onay iste.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] Her page role'de doğru zorunlu şema tipleri var mı?
- [ ] JSON-LD'deki hiçbir veri, sayfada görünmeyen bir bilgi içermiyor mu?
- [ ] Google Rich Results Test'ten örnek sayfalar geçiyor mu?
- [ ] HowTo kullanılmamış, FAQPage'e rich-result garantisi bağlanmamış mı?

Hepsi ✅ ise Faz 7'ye geç.

---

## FAZ 7 — INTERNAL LINKING VE PERFORMANS (CWV / INP)

**Bu faz ne işe yarar:** Sitenin içindeki sayfalar birbirine nasıl bağlanıyor (güç dağılımı) ve sayfalar ne kadar hızlı/akıcı açılıyor — ikisi de doğrudan kullanıcı deneyimi ve sıralamayı etkiler.

### CURSOR'A VER:

```
GÖREV: Internal Link Graph Analizi ve Core Web Vitals/INP Optimizasyonu

ADIM 1 — Internal link graph çıkar
`scripts/analyze-links.ts` yaz (JSDOM veya benzeriyle):
- Tüm indexable sayfalardaki tüm <a href> linklerini topla
- Bir graph oluştur: hangi sayfa hangi sayfaya link veriyor
- ORPHAN sayfaları bul (hiçbir sayfadan link almayan indexable
  sayfalar) → bunlar FAIL, mutlaka bir hub'dan link almalı
- BROKEN internal linkleri bul (404/410'a giden) → FAIL
- Redirect'e giden internal linkleri bul → WARN, doğrudan hedefe
  güncellensin
- "Buraya tıklayın" gibi anlamsız anchor text oranını hesapla, %'sini
  raporla

ADIM 2 — Hub-spoke yapısını doğrula
Registry'deki `parentHubRoute` ve `relatedRoutes` alanlarını kullanarak:
- Her spoke sayfanın gerçekten parent hub'ına link verdiğini kontrol et
- Her hub'ın stratejik spoke'larına link verdiğini kontrol et
- Breadcrumb'ın gerçek hiyerarşiyi yansıttığını kontrol et

ADIM 3 — Core Web Vitals + INP ölçümü kur
`web-vitals` kütüphanesini projeye ekle. Gerçek kullanıcı verisini
(field data) toplayan bir script yaz ki şu 3 metriği ölçsün:
- LCP (hedef: ≤2.5s)
- INP (hedef: ≤200ms) — DİKKAT: bu FID'nin YERİNE geçti, FID'yi
  ölçme, INP ölç
- CLS (hedef: ≤0.1)
75. persentili hesapla (ortalama DEĞİL). Mobil ve masaüstü ayrı ayrı
raporla.

ADIM 4 — Lighthouse CI regresyon koruması
`.github/workflows/performance.yml` (veya kullanılan CI sistemine
uygun) dosyasını oluştur:
- Her PR'da Lighthouse CI çalışsın
- Önceki ölçüme göre %5'ten fazla performans düşüşü varsa PR'ı
  FAIL etsin

ADIM 5 — Rapor ver
`docs/seo/07_FAZ7_RAPORU.md`: kaç orphan sayfa bulundu ve düzeltildi,
kaç broken link düzeltildi, CWV/INP mevcut durumu (tablo halinde),
Lighthouse CI kuruldu mu. Onay iste.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] Orphan sayfa kalmadı mı?
- [ ] Broken internal link kalmadı mı?
- [ ] LCP/INP/CLS gerçek kullanıcı verisiyle ölçülüyor mu (Lighthouse değil, field data)?
- [ ] INP ölçülüyor mu (FID değil)?
- [ ] Lighthouse CI, regresyonu otomatik yakalıyor mu?

Hepsi ✅ ise Faz 8'e geç.

---

## FAZ 8 — AI GÖRÜNÜRLÜK, CRAWL BUDGET, LOG ANALİZİ (Orta-büyük siteler için ZORUNLU)

**Bu faz ne işe yarar:** Küçük bir dükkanın her müşteriyi tanıması kolaydır ama büyük bir AVM'nin kim nereye gidiyor diye kamera/veri sistemi kurması gerekir. Site büyüdükçe Google'ın hangi sayfaları taradığını, AI arama sonuçlarında nerede göründüğünü KÖRLEMESİNE değil VERİYLE takip etmek gerekir.

**Ne zaman zorunlu:** Site 10.000+ sayfaya sahipse veya Search Console'da "Crawled - currently not indexed" oranı %20'yi geçiyorsa. Değilse bu fazı "SHOULD" (güçlü öneri) olarak uygula, atlanabilir.

### CURSOR'A VER:

```
GÖREV: Crawl Budget Analizi, Log Analizi ve AI Görünürlük Takibi

ADIM 1 — Googlebot doğrulama
`scripts/verify-googlebot.py` yaz: sunucu/CDN loglarındaki
"Googlebot" User-Agent'lı isteklerin GERÇEKTEN Google'a ait olduğunu
reverse-DNS + forward-DNS çift doğrulamasıyla kontrol etsin (sahte
botları ayıklasın).

ADIM 2 — Crawl budget analizörü
`scripts/log_crawl_analyzer.py` yaz. Doğrulanmış Googlebot isteklerini
kullanarak:
- Route bazında crawl sıklığını hesapla
- "Crawl waste" oranını hesapla: değersiz/duplicate/parametreli
  URL'lere giden isteklerin toplam crawl'a oranı (hedef: <%10)
- "Orphan crawl gap": registry'de olup son 30 günde hiç taranmamış
  sayfaları listele
- "Zombie crawl": 404/410/redirect olmuş ama hâlâ düzenli
  ziyaret edilen URL'leri listele → bunlar 301 değil 410 ile
  kapatılmalı, internal link kalıntısı varsa temizlenmeli
- Yeni içeriğin yayından ilk Googlebot ziyaretine kadar geçen süreyi
  hesapla (discovery lag)

ADIM 3 — AI görünürlük takip tablosu kur
Bir veri tablosu/dosyası oluştur (`data/ai_visibility_log.json` veya
veritabanı tablosu) ve şu alanları tut:
- queryClusterId, aiOverviewTriggered (bool), citedAsSource (bool),
  citationPosition, capturedAt, ownerUrl
Bu veriyi haftalık olarak manuel/yarı-otomatik SERP izleme ile
doldurmak için bir script iskeleti yaz (gerçek SERP izleme genellikle
üçüncü parti bir araç gerektirir — bunu bana hatırlat, otomatik
kurma).

ADIM 4 — GA4 referrer segmentasyonu
GA4'te chatgpt.com, perplexity.ai, copilot.microsoft.com gibi AI
platformlarından gelen trafiği ayrı bir segment olarak işaretleyen
bir GA4 custom dimension/segment kurulum talimatı yaz (bu genellikle
GA4 arayüzünden manuel yapılır — adımları bana açık şekilde yaz, ben
uygulayacağım).

ADIM 5 — Rapor ver
`docs/seo/08_FAZ8_RAPORU.md`: crawl waste oranı, orphan crawl gap
listesi, zombie crawl listesi ve önerilen aksiyon (410'a çevir),
discovery lag trendi, AI görünürlük takip sisteminin kurulum durumu.
Onay iste.

ÖNEMLİ: AI görünürlük için "şu taktiği yaparsan AI Overview'de
görünürsün" gibi GARANTİ CÜMLESİ kurma — sadece ölçüm altyapısı kur,
vaat verme.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] Googlebot doğrulaması gerçek log verisiyle çalışıyor mu?
- [ ] Crawl waste oranı hesaplandı mı ve %10 altına indirme planı var mı?
- [ ] Zombie crawl'lar 410'a çevrildi mi?
- [ ] AI görünürlük takip tablosu kuruldu mu (garantisiz, sadece ölçüm)?
- [ ] GA4'te AI platform referrer segmentasyonu yapıldı mı?

Hepsi ✅ ise Faz 9'a geç.

---

## FAZ 9 — OTOMASYON, ÖLÇÜM, NEDENSELLİK (INCREMENTALITY) TESTİ

**Bu faz ne işe yarar:** "SEO çalışması işe yaradı mı" sorusuna hikaye anlatarak değil, gerçek veriyle kanıtla cevap vermek. Bu, üst düzey firmaları amatörden ayıran en önemli fark.

### CURSOR'A VER:

```
GÖREV: Ölçüm Altyapısı ve Nedensellik (Incrementality) Test Sistemi

ADIM 1 — GSC + GA4 + BigQuery bağlantısı
- Search Console Bulk Export'u BigQuery'ye bağlamak için adım adım
  talimat yaz (bu genellikle GCP konsolundan manuel yapılır — bana
  açık adımları ver).
- GA4 BigQuery export'unu aynı şekilde kur.
- Bu iki veri setini `query_cluster_id` / `ownerUrl` üzerinden
  birleştiren bir BigQuery view/SQL sorgusu yaz.

ADIM 2 — Executive/gelir raporu
`scripts/revenue_attribution_report.sql` yaz. Registry'deki
`conversionEvent` alanını GA4 dönüşüm verisiyle eşleştirip her
sayfa/page-role için: organik trafik → dönüşüm → tahmini gelir
katkısı zincirini raporlayan bir sorgu oluştur.

ADIM 3 — Incrementality (nedensellik) test çerçevesi kur
`scripts/incrementality_query.sql` yaz. Bu, şunu yapabilmeli:
- Bir "test grubu" (değişiklik uygulanan sayfalar/segment) ve
  "kontrol grubu" (değişiklik uygulanmayan, benzer sayfalar/segment)
  tanımlanabilsin
- İki grubun GA4 export verisindeki trafik/dönüşüm farkını, zaman
  serisi bazında karşılaştırsın
- Farkın güven aralığıyla (confidence interval) raporlansın, TEK
  NOKTA TAHMİNİ olarak sunulmasın

ADIM 4 — Test disiplini kuralı
Bundan sonra her büyük içerik/teknik girişim için ŞU ŞABLONU
kullanacağını bana hatırlatan bir `docs/seo/DENEY_SABLONU.md`
oluştur:
- Hipotez (önceden yazılır, girişimden SONRA değil)
- Ölçüm yöntemi (holdout/geo/zaman-serisi/sayfa-grubu)
- Test grubu ve kontrol grubu tanımı
- Beklenen sonuç ve ne zaman "işe yaramadı" denileceği (önceden
  belirlenir)

ADIM 5 — Otomasyon güvenlik ağı (varsa n8n kullanılıyorsa)
Eğer n8n veya benzeri bir otomasyon aracı kullanılacaksa:
- Her otomasyon workflow'unun "write mode" SADECE pull-request
  açması olsun, DOĞRUDAN prod'a yazmasın
- Idempotency (aynı işlemi iki kez çalıştırınca bozulmama) garantisi
  olsun
- Global bir error/hata workflow'u ve "dead letter" tablosu olsun
  (başarısız işlemler kaybolmasın, kayıt altına alınsın)
- Hiçbir credential/API key workflow node'una hardcode edilmesin,
  merkezi secret storage kullanılsın

ADIM 6 — Rapor ver
`docs/seo/09_FAZ9_RAPORU.md`: BigQuery bağlantı durumu, gelir
raporlama sorgusunun test sonucu, incrementality test çerçevesinin
nasıl kullanılacağı örneği, otomasyon güvenlik kontrolleri. Onay iste.
```

### BİTTİ Mİ KONTROLÜ:
- [ ] GSC + GA4 verisi BigQuery'de birleşiyor mu?
- [ ] Gelir attribution raporu çalışıyor mu?
- [ ] Incrementality test sorgusu bir örnek senaryoyla test edildi mi?
- [ ] Deney şablonu kuruldu ve "önce hipotez, sonra ölçüm" disiplini var mı?
- [ ] (n8n varsa) hiçbir otomasyon doğrudan prod'a yazmıyor, hepsi PR açıyor mu?

Hepsi ✅ ise Faz 10'a geç.

---

## FAZ 10 — GÜVENLİK AĞLARI: MİGRASYON PROTOKOLÜ, YASAKLAR, FİNAL DENETİM

**Bu faz ne işe yarar:** Bütün bu yapıyı bir gecede yok edebilecek tek şey büyük bir migrasyon (domain/CMS/URL değişimi) veya bilerek/bilmeyerek yasak bir taktiğin uygulanmasıdır. Bu faz, o riski kilit altına alır.

### CURSOR'A VER:

```
GÖREV: Migrasyon Güvenlik Protokolü ve Final SEO Denetimi

ADIM 1 — Migrasyon checklist scripti
Eğer yakın zamanda bir domain/CMS/URL yapısı değişikliği planlanıyorsa
`scripts/validate-migration-map.ts` yaz:
- Mevcut TÜM indexable route'ların envanterini çıkar (crawl + GSC +
  analytics + sunucu logu — DÖRT kaynağın kesişimini al, tek kaynağa
  güvenme)
- Her eski route için yeni route'a 1:1 mapping tablosu olduğunu
  doğrula
- Mapping'i OLMAYAN indexable bir route varsa, script HATA versin ve
  migrasyonu bloklasın
- Migrasyon sonrası: robots.txt'in yanlışlıkla hiçbir indexable
  route'u bloklamadığını doğrulayan bir test ekle (en sık migrasyon
  hatası budur)

ADIM 2 — Migrasyon sonrası izleme takvimi kur
`docs/seo/MIGRASYON_IZLEME_TAKVIMI.md` oluştur:
- T+1 ile T+7 gün: günlük crawl hatası, redirect zinciri, 404
  patlaması kontrolü
- T+7 ile T+30 gün: GSC index kapsama trendi, segment bazlı trafik
  karşılaştırması
- T+30 ile T+90 gün: tam trafik/gelir toparlanma eğrisi, %90 altı
  toparlanma varsa kök neden analizi tetiklensin

ADIM 3 — Yasaklar denetim scripti
`scripts/audit-forbidden-patterns.ts` yaz. Kod tabanını ve içerik
kaynağını tarayıp şu yasaklardan HERHANGİ BİRİNİN izine rastlarsa
raporla (build'i kırmasa da uyarı versin, insan gözden geçirsin):
- Cloaking (bot ve kullanıcıya farklı içerik) belirtisi
- Gizli metin/link (CSS ile gizlenmiş, display:none içinde anahtar
  kelime yığını)
- Şehir/kelime değiştirilerek üretilmiş çok sayıda benzer sayfa
  (doorway pattern)
- Kullanıcıya görünmeyen review/rating/price schema
- Sahte/uygulanmayan ücretsiz fiyat (price: 0)
- robots.txt + noindex çakışması (Faz 3'te de kontrol edilmişti,
  burada final kez tekrar kontrol et)
- Hardcode edilmiş API key/credential (frontend kodunda veya
  otomasyon node'larında)

ADIM 4 — Final 360 derece denetim
Tüm önceki fazların scriptlerini (Faz 1'den 9'a kadar yazdığın TÜM
validate/check/detect scriptlerini) TEK BİR komutla çalıştıran bir
`npm run seo:full-audit` komutu oluştur. Bu komut hepsini sırayla
çalıştırıp TEK BİR birleşik rapor üretsin:
`docs/seo/10_FINAL_360_DENETIM_RAPORU.md`

Bu rapor şunları içermeli:
- Her fazın PASS/FAIL/WARN durumu (tablo halinde)
- Kalan tüm açık riskler (varsa)
- Genel bir "SEO Sağlık Skoru" (0-100, her fazın ağırlıklı ortalaması)

ADIM 5 — Sonuç raporu ver
Bana şunu söyle: "10 fazın tamamı tamamlandı. Final denetim skoru:
[X]/100. Açık kalan riskler: [liste]. Bu noktadan sonra sistem
kendi kendini CI/CD üzerinden koruyacak şekilde kuruldu." Hiçbir
"garanti" cümlesi kurma — sadece durumu raporla.

EK GUNCELLEME:
1- Google Sesli Arama & AI Assistant İyileştirmesi (Speakable Schema) index.html
 JSON-LD şemaINA EKLE.
2-  Türkiye İnternet Servis Sağlayıcıları İçin Preconnect Kaynak İpuçları (Türk Telekom, Turkcell, Vodafone)
Yapılan İşlem: <link rel="preconnect" href="https://fonts.googleapis.com"> ve dns-prefetch bağlantıları eklendi.
Neden Kritik? Mobil ağlarda (3G/4G/5G) ve ev internetinde ilk sunucu yanıt süresini (TTFB ve FCP) 0.15 saniyenin altına indirerek Google Core Web Vitals (CWV) performansında rakipsiz kılınmıştır. EKLE

3- Sayfa kaynağındaki <meta description> etiketindeki açıklamayı 25 - 160 karakter uzunluğunda olacak şekilde düzenle.(public/glossary/, public/guides/, public/topics/, public/compare/ ve kök dizindeki tüm araçlar) 

4- Resim için açıklayıcı bir içerik yazmak için <img alt> özniteliğini kullanın: <img source='pic.gif' alt='Resmi temsil eden doğru ve açıklayıcı anahtar sözcüklerden oluşan metin.' />.

5- Arama Motoru İndeksleme ve Teknik SEO Kontrol Listesi
1. 🔗 Kanonik (Canonical) URL ve Yönlendirme Tutarlılığı
Kural: rel="canonical" etiketi her zaman doğrudan 200 OK yanıtı veren asıl URL'yi göstermelidir. Asla 301 veya 302 yönlendirmesi yapan bir URL kanonik olarak tanımlanamaz.
Yapılmaması Gereken: Sayfa /tools adresinden /tools.html adresine 301 yönleniyorsa, kanonik etikette veya sitemap'te /tools yazmak.
Doğru Uygulama: Sitedeki tüm iç linkler, sitemap.xml ve <link rel="canonical"> etiketleri tek bir standart URL yapısına (Clean URL veya .html) sadık kalmalıdır.
2. 🏷️ Mükerrer (Duplicate) Meta Etiketi Kontrolü
Kural: HTML <head> bloğunda <meta name="referrer">, <meta name="robots">, <meta name="viewport"> gibi etiketler sayfa başına sadece 1 kez bulunmalıdır.
Yapılmaması Gereken: Statik HTML şablonunda veya güvenlik bloğunda meta etiket varken, otomatik build/enjeksiyon script'lerinin (Python/Node.js) aynı etiketi ikinci kez sayfaya eklemesi.
Doğru Uygulama: Build script'leriniz etiket eklemeden önce sayfada aynı etiket var mı diye kontrol etmeli (idempotent injection) veya tüm meta etiketler tek bir merkezden (SSOT) yönetilmelidir.
3. 📐 Yapılandırılmış Veri / Schema (JSON-LD) CSS Seçici Uyumsuzluğu
Kural: SpeakableSpecification veya benzeri CSS seçicisi kullanan Schema (JSON-LD) yapılarında belirttiğiniz sınıf/ID adları (.tools-lede, .sc-guide-lede, h1 vb.) HTML DOM'unda birebir var olmalıdır.
Yapılmaması Gereken: JSON-LD şemasında "cssSelector": [".tools-lede"] tanımlayıp, HTML tarafında paragrafı <p class="sub"> olarak bırakmak.
Doğru Uygulama: Şemadaki seçiciler ile HTML class'ları birebir eşleştirilmeli ve yayın öncesi Google Rich Results veya Schema Validator ile doğrulanmalıdır.
4. ⚡ Sunucu Tarafı Render (Prerender/SSR) vs İstemci Tarafı JS Fetch (Soft 404 Önleme)
Kural: Sayfanın ana başlıkları, ürün/araç kataloğu ve meta verileri arama motoru botları için HTML kodunun içinde hazır (pre-rendered) sunulmalıdır.
Yapılmaması Gereken: Boş bir HTML gövdesi basıp tüm kataloğu/içeriği sayfa açıldıktan sonra JavaScript fetch() / AJAX ile yüklemek. (Botlar JS çalıştırmada zaman aşımına uğrarsa sayfayı boş / Soft 404 sanar).
Doğru Uygulama: Statik site oluşturucuları (SSG) veya prerender mekanizmaları kullanarak içerik kartlarını başlangıç HTML'ine dahil edin.
5. 🗺️ Sitemap.xml ve Robots.txt Uyumu (4'lü Altın Kural)
Kural: sitemap.xml içine eklediğiniz her URL şu 4 şartı birden sağlamalıdır:
Sunucudan 200 OK dönmeli (301, 404, 500 olmamalı),
Sayfada <meta name="robots" content="noindex"> bulunmamalı,
<link rel="canonical"> etiketi kendisini göstermeli,
robots.txt dosyasında Disallow: kuralı ile engellenmemiş olmalı.
6. 🔒 Güvenlik Başlıkları (CSP) ve Bot Erişilebilirliği
Kural: Güvenlik amacıyla eklenen Content-Security-Policy (CSP) başlıkları arama motoru botlarının (Googlebot, Bingbot) kullandığı kaynakları veya script yürütme mekanizmalarını engellememelidir.
Doğru Uygulama: CSP başlığında script-src, connect-src ve img-src kuralları test edilerek bot taramalarını kısıtlamadığından emin olunmalıdır.
💡 Özet Formül
Bir web sitesini canlıya alırken:

Meta etiket tekrarları var mı? ➔ Taramayla temizle.
Schema'daki CSS class'ları HTML'de var mı? ➔ Birebir eşle.
Canonical adresi ile Sitemap ve Yönlendirmeler örtüşüyor mu? ➔ Tek standarta bağla.
İçerik JS olmadan da okunabiliyor mu? ➔ Statik prerender sağla.

7-
```

### BİTTİ Mİ KONTROLÜ:
- [ ] Migrasyon mapping doğrulaması hazır mı (migrasyon planlanıyorsa)?
- [ ] Migrasyon sonrası izleme takvimi net günlerle tanımlı mı?
- [ ] Yasaklar denetim scripti tüm kod tabanını taradı mı, hiçbir ihlal bulunmadı mı?
- [ ] `npm run seo:full-audit` tek komutla tüm fazları çalıştırıyor mu?
- [ ] Final rapor bir "Sağlık Skoru" ve açık risk listesi içeriyor mu?

---

## SON HATIRLATMA — NE ZAMAN "10/10" DENİR

Hiçbir teknik şartname, hiçbir ajans, hiçbir kod bloğu Google'da #1 sıralamayı **garanti edemez**. "10/10 SEO altyapısı" demek şu demektir:

- Google'ın hiçbir resmi kuralını ihlal etmiyorsun (Faz 1-6, Faz 10 Adım 3)
- Sistemin kendi kendini koruyor — insan hata yapsa bile CI onu yakalıyor (her fazın validate/check scriptleri)
- İddialarını veriyle kanıtlayabiliyorsun, hikaye anlatmıyorsun (Faz 9)
- Büyük bir felaketi (migrasyon) önceden test edilmiş bir protokolle yönetiyorsun (Faz 10)

Bu, "garantili #1 sıralama" değil — "en yüksek olasılıklı, ölçülebilir, geri dönüşü olan, felakete dayanıklı büyüme sistemi" demektir. Gerçekte para kazanan üst düzey firmaların yaptığı da tam olarak budur.
