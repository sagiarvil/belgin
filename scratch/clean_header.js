// ==========================================================
// BELGİN KUYUMCULUK — MASTER ÜRÜN VE KOLEKSİYON VERİTABANI
// Sürüm: 2026-08-26.live-sync (Saat&Saat 9 Marka Senkronizasyonu)
// Toplam Yayın Ürünü: 1636 (Fiyat >= 12.000 TL)
// ==========================================================

const WATCH_BRANDS = [
  {
    "id": "versace",
    "name": "Versace",
    "count": 243,
    "origin": "İsviçre / İtalya",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/2/8/281835ca0f67c8b08a47e1aed9e789fbd61464adcbcb5f22c19d368c8045cb56.jpeg"
  },
  {
    "id": "michael-kors",
    "name": "Michael Kors",
    "count": 187,
    "origin": "ABD / İsviçre",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/f/4/f49f87b275f77cc12b158bf9b8745b26f54e5e36e6a548ac1ffaf505f66ec905.jpeg"
  },
  {
    "id": "gc",
    "name": "Gc",
    "count": 173,
    "origin": "İsviçre Yapımı (Swiss Made)",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/3/7/37efb98bd82fed4ae4fa2f70c47dc9ff7de2571fef294c651a0490b328e62ddd.jpeg"
  },
  {
    "id": "guess",
    "name": "Guess",
    "count": 294,
    "origin": "ABD",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/c/2/c2bc551e7a0d64b119e30bd0bbbe8790635f5d0bb48bcef769df77ecbe199aec.jpeg"
  },
  {
    "id": "fossil",
    "name": "Fossil",
    "count": 166,
    "origin": "ABD",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/a/5/a5d3504e5681aa6b392dd5065543693fe95527ba442c29ea0fad8d05f8653223.jpeg"
  },
  {
    "id": "seiko",
    "name": "Seiko",
    "count": 139,
    "origin": "Japonya",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/9/1/91d20aa19ce417407ce4f722b3c20d74206205863c412cd48d9a3217fcecb784.jpeg"
  },
  {
    "id": "calvin-klein",
    "name": "Calvin Klein",
    "count": 133,
    "origin": "ABD / İsviçre",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/c/5/c5d779a15eef22d75b7250088ad557573c500ab700212b83f126ab3922710d0d.jpeg"
  },
  {
    "id": "diesel",
    "name": "Diesel",
    "count": 89,
    "origin": "İtalya",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/c/3/c3521b6ee5d103b224b0967c42626bf18e1dc1f58f4d1379557a209929ee0e61.jpeg"
  },
  {
    "id": "welder",
    "name": "Welder",
    "count": 201,
    "origin": "İtalya",
    "image": "https://cdn.saatvesaat.com.tr/mnresize/800/-/media/catalog/product/8/0/80105b29a495e70d915a3345f300de855c452822394f2c96ac5057239cc0d731.jpeg"
  }
];

const JEWELRY_BRANDS = [
  {
    "id": "cartier",
    "name": "Cartier",
    "count": 24,
    "image": "https://artjewellerywatches.com/api/photo/jewelry-definition/100"
  },
  {
    "id": "tiffany",
    "name": "Tiffany & Co.",
    "count": 0,
    "image": "https://artjewellerywatches.com/api/photo/jewelry-definition/101"
  },
  {
    "id": "bulgari",
    "name": "Bvlgari",
    "count": 0,
    "image": "https://artjewellerywatches.com/api/photo/jewelry-definition/102"
  },
  {
    "id": "vca",
    "name": "Van Cleef & Arpels",
    "count": 0,
    "image": "https://artjewellerywatches.com/api/photo/jewelry-definition/103"
  },
  {
    "id": "chopard",
    "name": "Chopard",
    "count": 0,
    "image": "https://artjewellerywatches.com/api/photo/jewelry-definition/104"
  }
];

// MASTER ÜRÜN LİSTESİ (1636 Ürün: 1625 Sıfır Saat + 11 İkinci El & Mücevherat)
