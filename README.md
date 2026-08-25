# Belgin Kuyumculuk — E-Ticaret (Firebase + PayTR)

Lüks mücevher ve saat e-ticaret sitesi. Firebase Hosting + Cloud Functions + PayTR iframe entegrasyonu.

## Proje Yapısı

```
belgin-kuyumculuk/
├── index.html                          # Ana SPA (tüm sayfalar)
├── mesafeli-satis-sozlesmesi.html      # Mesafeli Satış Sözleşmesi (zorunlu)
├── on-bilgilendirme-formu.html         # Ön Bilgilendirme Formu (zorunlu)
├── kvkk.html                           # KVKK Aydınlatma Metni (zorunlu)
├── gizlilik-politikasi.html            # Gizlilik Politikası (zorunlu)
├── iade-degisim.html                   # İade & Değişim (zorunlu)
├── firebase.json                       # Firebase Hosting & Functions config
├── .firebaserc                         # Firebase proje ayarı
├── css/
│   └── style.css                       # Tüm stiller
├── js/
│   ├── data.js                         # Ürün verileri (JSON)
│   ├── utils.js                        # Yardımcı fonksiyonlar
│   ├── cart.js                         # Sepet modülü (localStorage)
│   ├── wishlist.js                     # Favoriler modülü
│   ├── router.js                       # SPA router
│   ├── paytr.js                        # PayTR iframe entegrasyonu
│   └── app.js                          # Ana uygulama
├── functions/
│   ├── package.json                    # Node.js dependencies
│   └── index.js                        # Cloud Functions (PayTR API)
└── README.md                           # Bu dosya
```

## Özellikler

| Modül | Açıklama |
|-------|----------|
| **Ana Sayfa** | Hero, koleksiyonlar, öne çıkan ürünler, hizmetler |
| **Mücevher** | 12 ürün, kategori filtreleme |
| **Saat** | 6 lüks saat koleksiyonu |
| **Ürün Detay** | Miktar seçici, sepete ekle, favorilere ekle |
| **Sepet** | Miktar güncelleme, silme, toplam |
| **Ödeme** | PayTR iframe, teslimat bilgileri, 4 zorunlu checkbox |
| **Favoriler** | localStorage'da kalıcı |
| **Hesabım** | Giriş / Kayıt formları |
| **Arama** | Tüm ürünlerde anlık arama |
| **Yasal Sayfalar** | 5 ayrı yasal sayfa (banka denetimi için zorunlu) |
| **Responsive** | Mobil, tablet, masaüstü |

## PayTR Entegrasyonu Akışı

```
Kullanıcı
    ↓
Sepete ürün ekle → localStorage
    ↓
Checkout sayfası → Teslimat bilgileri + 4 checkbox
    ↓
"Siparişi Tamamla" butonu
    ↓
Firebase Functions: createPayTRToken
    ↓
PayTR API → Token + iframe URL döner
    ↓
PayTR iframe sayfada açılır (3D Secure)
    ↓
Kullanıcı kart bilgilerini PayTR'de girer
    ↓
PayTR callback → Firebase Functions: paytrCallback
    ↓
Firestore sipariş durumu güncellenir
    ↓
Başarılı/Başarısız sayfaya yönlendirme
```

## Kurulum Adımları

### 1. Gerekli Araçları Yükle

```bash
npm install -g firebase-tools
```

### 2. Firebase Projesi Oluştur

```bash
firebase login
firebase projects:create belgin-kuyumculuk
firebase use belgin-kuyumculuk
```

### 3. PayTR Hesabı Aç

1. [paytr.com](https://www.paytr.com) adresine git
2. "Hemen Başvur" butonuna tıkla
3. Şirket bilgilerini gir (Ltd. Şti. kuruluşu gerekli)
4. Gerekli belgeleri yükle:
   - Vergi levhası
   - İmza sirküleri
   - Kimlik fotokopisi
   - İmza beyannamesi
5. Onay süreci: 1-3 iş günü

### 4. PayTR API Bilgilerini Al

PayTR panelinden (Mağaza Bilgileri):
- **Merchant ID**
- **Merchant Key**
- **Merchant Salt**

### 5. Firebase Functions Konfigürasyonu

```bash
# PayTR bilgilerini Firebase ortam değişkeni olarak ekle
firebase functions:config:set paytr.merchant_id="YOUR_MERCHANT_ID"
firebase functions:config:set paytr.merchant_key="YOUR_MERCHANT_KEY"
firebase functions:config:set paytr.merchant_salt="YOUR_MERCHANT_SALT"
```

### 6. PayTR Callback URL Ayarı

PayTR panelinde:
- **Bildirim URL (Callback):** `https://belginkuyumculuk.web.app/api/paytrCallback`
- **Başarılı URL:** `https://belginkuyumculuk.web.app/#payment-success`
- **Başarısız URL:** `https://belginkuyumculuk.web.app/#payment-failed`

### 7. Deploy Et

```bash
# Functions deploy
firebase deploy --only functions

# Hosting deploy
firebase deploy --only hosting

# Hepsi birlikte
firebase deploy
```

## Maliyet Analizi (Aylık)

| Hizmet | Maliyet | Not |
|--------|---------|-----|
| Firebase Hosting | **0 TL** | 10 GB bantwidth ücretsiz |
| Firebase Functions | **0 TL** | 2M çağrı/ay ücretsiz |
| Firestore | **0 TL** | 50K okuma/gün ücretsiz |
| Cloud NAT / Statik IP | **0 TL** | PayTR kullanıldığı için gerekmez |
| PayTR Komisyon | **%1.99 - %2.69** | Tek çekim |
| Taksitli Komisyon | **+%0.5 - %1.5** | Taksit sayısına göre |
| **TOPLAM ALTYAPI** | **0 TL** | Spark plan yeterli |

## Test Modu

`functions/index.js`'te `test_mode: 1` olarak ayarlı. Canlıya almadan önce:

1. PayTR panelinden canlı onay al
2. `test_mode: 0` yap
3. `debug_on: 0` yap
4. Tekrar deploy et

## Güvenlik Kontrol Listesi

- [x] HTTPS zorunlu (Firebase Hosting otomatik)
- [x] TLS 1.2+ (Firebase otomatik)
- [x] 3D Secure zorunlu (PayTR tarafından yönetilir)
- [x] Kart bilgisi asla sunucuya gitmez (PayTR iframe)
- [x] Hash doğrulama (PayTR callback)
- [x] Firestore Security Rules yazılmalı
- [x] CORS yalnızca kendi domaininden

## Yasal Sayfalar (Banka Denetimi İçin Zorunlu)

| Sayfa | Dosya | Durum |
|-------|-------|-------|
| Mesafeli Satış Sözleşmesi | `mesafeli-satis-sozlesmesi.html` | ✅ Hazır |
| Ön Bilgilendirme Formu | `on-bilgilendirme-formu.html` | ✅ Hazır |
| KVKK Aydınlatma Metni | `kvkk.html` | ✅ Hazır |
| Gizlilik Politikası | `gizlilik-politikasi.html` | ✅ Hazır |
| İade & Değişim | `iade-degisim.html` | ✅ Hazır |
| ETBİS QR Kodu | Footer placeholder | ⚠️ ETBİS'ten alınmalı |

## Sorun Giderme

### "Hash doğrulama başarısız" hatası
- `merchant_key` ve `merchant_salt` değerlerini kontrol et
- Firebase config'i doğru ayarladığından emin ol: `firebase functions:config:get`

### "Token oluşturulamadı" hatası
- PayTR panelinde test modu aktif mi kontrol et
- `merchant_id` doğru mu kontrol et
- Functions loglarını kontrol et: `firebase functions:log`

### iframe yüklenmiyor
- Adblocker devre dışı bırak
- `paytr.js`'te `API_BASE` URL'sini kontrol et
- Functions deploy edildi mi kontrol et

## Lisans

Belgin Kuyumculuk özel projesidir.
