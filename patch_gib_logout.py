import os

html_path = '/Users/macair1/projects/belgin/admin.html'
js_path = '/Users/macair1/projects/belgin/js/admin.js'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

btn_html = """      <button type="button" class="btn-pro-action action-sms" onclick="AdminApp.startBatchInvoiceSigning()" title="Toplu Fatura Kes / SMS (Kısayol: S)">
        <span>🧾 Toplu Fatura (SMS)</span>
        <span class="kbd-tag">S</span>
      </button>
      <button type="button" class="btn-pro-action" style="background:#FEF2F2; color:#DC2626; border-color:#FCA5A5;" onclick="AdminApp.forceGibLogout()" title="GİB Oturumunu Temizle (Askıda Kalan Oturumları Sıfırlar)">
        <span>🔌 GİB Sıfırla</span>
      </button>"""

if "AdminApp.forceGibLogout()" not in html:
    html = html.replace("""      <button type="button" class="btn-pro-action action-sms" onclick="AdminApp.startBatchInvoiceSigning()" title="Toplu Fatura Kes / SMS (Kısayol: S)">
        <span>🧾 Toplu Fatura (SMS)</span>
        <span class="kbd-tag">S</span>
      </button>""", btn_html)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("HTML patched.")
else:
    print("HTML already patched.")

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

js_func = """
  async forceGibLogout() {
    try {
      const btn = document.querySelector('button[onclick="AdminApp.forceGibLogout()"]');
      if (btn) btn.innerHTML = '<span>⏳ Sıfırlanıyor...</span>';
      
      const res = await fetch('/api/admin/invoice/force-logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ adminKey: this.adminPin })
      });
      
      if (btn) btn.innerHTML = '<span>🔌 GİB Sıfırla</span>';
      
      if (res.ok) {
        alert('✅ GİB Oturumu Başarıyla Sıfırlandı.\\n\\nAskıda kalan (timeout) tüm oturumlar temizlendi. Fatura kesme işlemini tekrar deneyebilirsiniz.');
      } else {
        alert('⚠️ GİB Oturumu sıfırlanırken bir hata oluştu veya zaten oturum yoktu.');
      }
    } catch (e) {
      alert('Hata: ' + e.message);
      const btn = document.querySelector('button[onclick="AdminApp.forceGibLogout()"]');
      if (btn) btn.innerHTML = '<span>🔌 GİB Sıfırla</span>';
    }
  },

  closeSmsModal() {"""

if "forceGibLogout()" not in js:
    js = js.replace("\n  closeSmsModal() {", js_func)
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print("JS patched.")
else:
    print("JS already patched.")
