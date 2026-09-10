# Katı Tasarım ve Görünüm Koruma Kuralı (Strict Design Lock)

1. **Tasarım Değişikliği Kesinlikle Yasaktır:** Kullanıcı açık ve net bir şekilde "Tasarımı değiştir" veya "Yeni bir arayüz tasarla" demediği sürece; hiçbir HTML şablonunu, CSS/JS dosyasını, sayfa düzenini (layout), menü/sidebar/topbar tasarımını, renk paletini veya görsel bileşenleri KESİNLİKLE DEĞİŞTİRME, YENİDEN YAZMA VEYA KENDİ KAFANA GÖRE "MODERNİZE" ETME.
2. **Orijinal Arayüzü Birebir Koru:** Var olan tüm HTML sınıflarını (class), element ID'lerini, DOM hiyerarşisini ve stil kurallarını %100 orijinal haline sadık kalarak koru.
3. **Sadece Backend ve Veri Bağlama:** Yapılacak tüm işlemler yalnızca backend mantığı (Model, Service, Controller, Route, SQL, Güvenlik, API) ve veritabanındaki dinamik verileri var olan mevcut şablona hatasız basmaktan ibarettir.
4. **Hata Düzeltmede Tasarımı Bozma:** PHP uyarısı, undefined variable veya fonksiyon hatası giderilirken sadece ilgili veri değişkeni veya PHP kodu düzeltilmeli; çevresindeki HTML veya CSS kesinlikle tahrif edilmemelidir.
