import re

js_path = '/Users/macair1/projects/belgin/js/admin.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

replacement = """
    } catch (e) {
      if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
        alert('⏳ GİB Bağlantısı Uzun Sürdü (60 Saniye Sınırı) veya Engellendi!\\n\\nİşleminiz arka planda GİB\\'e başarıyla iletilmiş olabilir. Lütfen:\\n1) Telefonunuza GİB\\'den SMS şifresi gelip gelmediğini kontrol edin.\\n2) SMS geldiyse, sayfayı YENİLEYİN (F5) ve durumun "Taslak" olduğunu teyit edin.\\n3) Fatura "Taslak" statüsündeyse tekrar "İmzala" tuşuna basıp direkt SMS şifrenizi girebilirsiniz.');
      } else {
        alert('❌ GİB Bağlantı Hatası: ' + e.message);
      }
      if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';
    }
"""

js = re.sub(r"    \} catch \(e\) \{\n      alert\('❌ GİB Bağlantı Hatası: ' \+ e\.message\);\n      if \(submitBtn\) submitBtn\.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';\n    \}", replacement, js, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Catch block updated!")
