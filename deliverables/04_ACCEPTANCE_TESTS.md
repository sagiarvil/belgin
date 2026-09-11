# 04. KABUL VE DOĞRULAMA KOMUTLARI (ACCEPTANCE TESTS)
```bash
# 1. H1 Tekillik Doğrulaması
curl -sL "https://www.belginkuyumculuk.com/" | grep -E -o "<h1[^>]*>.*?</h1>" | wc -l | awk '{if ($1==1) print "PASS: Tam olarak 1 adet H1 mevcut"; else {print "FAIL"; exit 1}}'

# 2. Hero Answer Doğrulaması
curl -sL "https://www.belginkuyumculuk.com/" | grep -E -o '<p class=["']hero-answer["']>.*?</p>' | wc -w | awk '{if ($1>=25 && $1<=85) print "PASS: " $1 " kelimelik Hero Answer mevcut"; else print "FAIL"}'

# 3. Google Preferred Sources
curl -sL "https://www.belginkuyumculuk.com/" | grep -E -q "publisher.js|google-add-preferred-source-btn" && echo "PASS: Preferred Sources aktif"
```
