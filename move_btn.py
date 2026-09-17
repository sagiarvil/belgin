import os

html_path = '/Users/macair1/projects/belgin/admin.html'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

btn_gib = """      <button type="button" class="btn-pro-action" style="background:#FEF2F2; color:#DC2626; border-color:#FCA5A5;" onclick="AdminApp.forceGibLogout()" title="GİB Oturumunu Temizle (Askıda Kalan Oturumları Sıfırlar)">
        <span>🔌 GİB Sıfırla</span>
      </button>"""

if btn_gib in html:
    html = html.replace(btn_gib, "")
    
    refresh_btn = """      <button type="button" class="btn-pro-action action-refresh" onclick="AdminApp.loadOrders()" title="Verileri Canlı Yenile (Kısayol: R)">
        <span>🔄 Yenile</span>
        <span class="kbd-tag">R</span>
      </button>"""
      
    new_refresh_btn = refresh_btn + "\n" + btn_gib
    
    html = html.replace(refresh_btn, new_refresh_btn)
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Button moved!")
else:
    print("GİB button not found where expected.")
