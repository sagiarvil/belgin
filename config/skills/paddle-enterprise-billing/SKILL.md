---
name: paddle-enterprise-billing
description: >-
  Paddle Billing v2 enterprise integration, Paddle.js overlay, HMAC-SHA256 webhook verification, multi-currency parity (PPP), atomic entitlement provisioning, and $99 license digital delivery with binary STORE CRC32 ZIP compilation.
---

# Paddle Billing v2 & Global Revenue Architecture
## High-Volume Checkout, Stateless Entitlements, and Binary STORE ZIP

Bu yetenek; Paddle Billing v2 altyapısını, abonelik yaşam döngülerini, dijital lisans teslimatını ve PKWARE Method 0 ZIP derleyicisini yönetir.

---

### 1. İstemci Tarafı Paddle.js Entegrasyonu
- Dinamik para birimi (USD, EUR, TRY) ve yerel satın alma gücü paritesi (PPP) desteği.
- Temiz, modern overlay checkout açılışı:
  ```javascript
  Paddle.Checkout.open({
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      locale: 'tr',
      successUrl: 'https://htmlandhtml.com/checkout?status=success'
    },
    items: [{ priceId: 'pri_...', quantity: 1 }],
    customer: { email: userEmail },
    customData: { auditId: '...', tier: 'enterprise' }
  });
  ```

---

### 2. Sıfır Güven (Zero-Trust) Webhook Doğrulaması
- Paddle `Paddle-Signature` başlığını doğrulamadan hiçbir hak veya lisans teslim edilmez.
- `ts` (zaman damgası) ve `h1` (HMAC-SHA256 özeti) ayrıştırılır:
  - Zaman damgası toleransı: ±300 saniye (replay attack engelleme).
  - Zamanlama yan kanal koruması: `crypto.timingSafeEqual`.

---

### 3. Durumsuz (Stateless) HMAC Yetkilendirme Belirteçleri
- $99 tek seferlik lisans satın alan misafir kullanıcılar şifrelenmiş ve imzalanmış durumsuz yetkilendirme belirteci alır (`domain`, `orderId`, `expiry`).
- Kalıcı şifre veya veritabanı oturum yükü gerektirmez.

---

### 4. Deterministik İkili STORE CRC32 ZIP Derlemesi (Method 0)
- Dış JSZip veya yerel C++ bağımlılığı olmadan, doğrudan PKWARE PKZIP 2.0 spesifikasyonuna göre Method 0 (STORE) ile bayt düzeyinde 30 dosyayı arşivler.
- Olasılıksal sıkıştırma heuristikleri içermediği için aynı girdi bit-for-bit özdeş SHA-256 sağlama toplamına sahip ZIP arşivi üretir.

