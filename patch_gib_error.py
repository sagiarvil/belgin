import os

js_path = '/Users/macair1/projects/belgin/js/admin.js'

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

old_err1 = "alert('❌ Taslak Fatura Uyarısı:\\n\\n' + (draftData?.message || 'GİB bağlantısı kurulamadı.') + '\\n\\n💡 İpucu: Başka bir sekmede earsivportal.efatura.gov.tr açık ise lütfen o sekmeden Güvenli Çıkış yapıp tekrar deneyiniz.');"
new_err1 = "alert('❌ Taslak Fatura Uyarısı:\\n\\n' + (draftData?.message || 'GİB Devlet Portalı yanıt vermiyor (Sunucu yoğun veya çökmüş olabilir).') + '\\n\\n💡 İpucu: Sol üstteki 🔌 GİB Sıfırla butonuna basıp 1-2 dakika sonra tekrar deneyiniz.');"

old_err2 = "alert('❌ Taslak Fatura Uyarısı:\\n\\n' + (draftData?.message || 'GİB bağlantısı kurulamadı.'));"
new_err2 = "alert('❌ Taslak Fatura Uyarısı:\\n\\n' + (draftData?.message || 'GİB Devlet Portalı yanıt vermiyor (Sunucu yoğun veya çökmüş olabilir).'));"

js = js.replace(old_err1, new_err1)
js = js.replace(old_err2, new_err2)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
