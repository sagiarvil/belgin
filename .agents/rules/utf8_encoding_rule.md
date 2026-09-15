# KURAL: Türkçe Karakter (UTF-8) ve Dosya Düzenleme Standartları

Bu kural; dosyaları PowerShell, PHP, Python veya Node.js üzerinden düzenlerken Türkçe karakterlerin bozulmasını (Ã¼, ÅŸ, Ä± gibi çift kodlanmış UTF-8 hataları) kesin olarak engellemek için konulmuştur.

## 1. Sorunun Kaynağı
Windows işletim sistemlerinde Powershell'in `Get-Content` ve `Set-Content` veya `Out-File` komutları, açıkça belirtilmedikçe (BOM yoksa) dosyaları sistem varsayılan kodlamasıyla (Türkiye için ANSI/Windows-1254) okumaya çalışır. Bu durum, orijinali UTF-8 olan dosyalardaki `ş`, `ı`, `ğ` gibi çok baytlı (multi-byte) karakterlerin parçalanıp bozulmasına yol açar.

## 2. Kesinlikle Uyulması Gereken Kurallar

### A. PowerShell Kullanımı (YASAKLANANLAR VE DOĞRULAR)
- **YANLIŞ:** `$content = Get-Content file.php` (Bozar!)
- **DOĞRU:** `$content = Get-Content file.php -Encoding UTF8`
- **YANLIŞ:** `Set-Content file.php $content` (Bozar!)
- **DOĞRU:** `Set-Content file.php $content -Encoding UTF8`
- *Alternatif Doğru:* Dosya değişimlerini Powershell komutları yerine `replace_file_content` veya `write_to_file` araçlarıyla yap. Ajan araçları her zaman native UTF-8 destekler.

### B. Python Kullanımı
Python 3'te Windows üzerinde `open('file.txt', 'r')` yapıldığında varsayılan `encoding` genellikle `cp1254` (veya cp1252) olur.
- **YANLIŞ:** `with open('dosya.php', 'r') as f:`
- **DOĞRU:** `with open('dosya.php', 'r', encoding='utf-8') as f:`

### C. PHP Kullanımı
PHP'nin `file_get_contents` ve `file_put_contents` fonksiyonları varsayılan olarak binary-safe (byte düzeyinde) çalışır, bu yüzden karakter setini kendi başına bozmazlar. Ancak string manipülasyonu yaparken Multi-byte string (mb_*) fonksiyonları kullanılmalıdır.
- **DOĞRU:** `file_get_contents('dosya.php')` ve `file_put_contents('dosya.php', $data)` güvenlidir.
- Eğer JSON okunuyorsa: `json_encode($data, JSON_UNESCAPED_UNICODE)` kullanılmalıdır.

### D. Node.js Kullanımı
Node.js'te okuma/yazma işlemleri her zaman açıkça UTF-8 belirtilerek yapılmalıdır.
- **DOĞRU:** `fs.readFileSync('dosya.php', 'utf8')`

## 3. Toplu Kontrol ve Düzenleme Ajanları İçin
Eğer birden fazla dosyada find-replace yapacaksanız, terminalde `sed` veya Powershell komutları yazmak yerine, *daima* `replace_file_content` tool'unu kullanın. Eğer çok karmaşık bir regex işlemi gerekiyorsa, Node.js veya Python scripti yazarak **encoding='utf-8'** bayrağını kesinlikle ekleyin.
