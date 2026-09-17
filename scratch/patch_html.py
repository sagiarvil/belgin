import sys

def patch():
    file_path = '/Users/macair1/projects/belgin/odeme-linki.html'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    cancel_ui = """
    <!-- VIP LINK CANCEL CARD -->
    <div class="card" style="margin-top:20px; border-top:2px solid #ef4444;">
      <div class="card-title" style="color:#ef4444;"><span class="dot" style="background:#ef4444; box-shadow:0 0 8px rgba(239,68,68,0.5);">⛔</span> Gönderilmiş VIP Link İptali</div>
      <p style="font-size:12px; color:var(--text-dim); margin-bottom:15px; line-height:1.5;">Gönderdiğiniz bir ödeme linkini (Sipariş ID veya /vip?p=... formatındaki linki) geçersiz kılmak için burayı kullanın.</p>
      
      <div class="field">
        <label class="field-label" for="cancelOrderId">Sipariş ID veya Link</label>
        <div class="input-shell">
          <input type="text" id="cancelOrderId" class="form-input" placeholder="Örn: VIP-1726555123 VEYA Linkin tamamı">
        </div>
      </div>
      
      <div class="field" style="margin-bottom:0;">
        <button type="button" class="btn" id="btnCancelLink" style="background:rgba(239, 68, 68, 0.1); border:1px solid #ef4444; color:#ef4444;">Link İptal Et</button>
      </div>
      <div id="cancelFeedback" style="margin-top:10px; font-size:12px; display:none;"></div>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const btnCancel = document.getElementById('btnCancelLink');
        const inputCancel = document.getElementById('cancelOrderId');
        const feedback = document.getElementById('cancelFeedback');
        
        if(btnCancel) {
          btnCancel.addEventListener('click', async () => {
            let val = inputCancel.value.trim();
            if(!val) {
              feedback.style.display = 'block';
              feedback.style.color = '#ef4444';
              feedback.innerHTML = 'Lütfen bir sipariş numarası veya link giriniz.';
              return;
            }
            
            // Extract VIP order id if it's a URL or p=...
            // Simple approach: if it has VIP-, extract that
            let orderId = val;
            const vipMatch = val.match(/(VIP-[0-9]+)/i);
            if(vipMatch) {
              orderId = vipMatch[1];
            } else if (val.includes('?p=')) {
                // If it's a base64 encoded token, we try to decode it.
                try {
                    const token = new URLSearchParams(val.split('?')[1]).get('p');
                    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) base64 += '=';
                    const decoded = atob(base64);
                    // It should be orderId|title|amount
                    const parts = decoded.split('|');
                    if(parts.length >= 3 && parts[0].startsWith('VIP-')) {
                        orderId = parts[0];
                    }
                } catch(e) {}
            }
            
            btnCancel.innerHTML = 'İptal Ediliyor...';
            btnCancel.disabled = true;
            
            try {
              const res = await fetch('/api/payment/cancel-vip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, secret: 'VIP_ADMIN_BYPASS_2026' })
              });
              const data = await res.json();
              feedback.style.display = 'block';
              if(data.success) {
                feedback.style.color = '#10b981';
                feedback.innerHTML = '✅ Link başarıyla iptal edildi (' + orderId + ').';
                inputCancel.value = '';
              } else {
                feedback.style.color = '#ef4444';
                feedback.innerHTML = '❌ Hata: ' + data.message;
              }
            } catch(e) {
              feedback.style.display = 'block';
              feedback.style.color = '#ef4444';
              feedback.innerHTML = '❌ Sunucu ile iletişim kurulamadı.';
            } finally {
              btnCancel.innerHTML = 'Link İptal Et';
              btnCancel.disabled = false;
            }
          });
        }
      });
    </script>
  </div>
  <!-- /VIP LINK CANCEL CARD END -->
"""

    if "VIP LINK CANCEL CARD" not in content:
        # insert right before the last </div> before scripts
        # We'll just replace "  <script src="/js/growth.js" defer></script>" with the cancel UI + the script
        target = '  <script src="/js/growth.js" defer></script>'
        content = content.replace(target, cancel_ui + "\n" + target)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched odeme-linki.html successfully.")
    else:
        print("Already patched odeme-linki.html.")

patch()
