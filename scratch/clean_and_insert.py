import sys

def patch():
    file_path = '/Users/macair1/projects/belgin/odeme-linki.html'
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Find the start and end of the injected cancel card
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if "<!-- VIP LINK CANCEL CARD -->" in line:
            start_idx = i
        if "<!-- /VIP LINK CANCEL CARD END -->" in line:
            end_idx = i
            break

    if start_idx != -1 and end_idx != -1:
        # Remove from original
        del lines[start_idx:end_idx+1]

    full_text = "".join(lines)
    
    better_cancel_card = """
    <!-- VIP LINK CANCEL CARD -->
    <div class="card" style="margin-top:24px; border-top:3px solid #ef4444; border-radius: 16px;">
      <div class="card-title" style="color:#ef4444; font-size: 16px; margin-bottom: 12px; display:flex; align-items:center; gap:8px;">
        <span style="background:#ef4444; color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:12px; box-shadow:0 0 10px rgba(239,68,68,0.4);">✕</span> 
        Gönderilmiş Linki İptal Et
      </div>
      <p style="font-size:13px; color:var(--text-dim); margin-bottom:18px; line-height:1.5;">Gönderdiğiniz bir linki (VIP Sipariş No veya Link) iptal edebilirsiniz.</p>
      
      <div class="field" style="margin-bottom: 18px;">
        <div class="input-shell" style="border-radius: 14px; border: 1.5px solid rgba(239,68,68,0.25); background: rgba(0,0,0,0.2); padding:2px;">
          <input type="text" id="cancelOrderId" class="form-input" style="padding: 16px; font-size: 15px; background: transparent; color: #fff;" placeholder="Örn: VIP-1726... veya link">
        </div>
      </div>
      
      <div class="field" style="margin-bottom:0;">
        <button type="button" class="btn" id="btnCancelLink" style="width: 100%; padding: 18px; border-radius: 30px; font-weight: 800; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; border: none; font-size: 16px; box-shadow: 0 6px 20px rgba(239,68,68,0.35); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          Linki İptal Et
        </button>
      </div>
      <div id="cancelFeedback" style="margin-top:14px; font-size:13.5px; font-weight: 600; display:none; padding: 14px; border-radius: 12px; text-align: center;"></div>
    </div>
    
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const btnCancel = document.getElementById('btnCancelLink');
        const inputCancel = document.getElementById('cancelOrderId');
        const feedback = document.getElementById('cancelFeedback');
        
        if(btnCancel) {
          // Touch feedback for mobile
          btnCancel.addEventListener('touchstart', () => btnCancel.style.transform = 'scale(0.98)', {passive: true});
          btnCancel.addEventListener('touchend', () => btnCancel.style.transform = 'scale(1)', {passive: true});
          
          btnCancel.addEventListener('click', async () => {
            let val = inputCancel.value.trim();
            if(!val) {
              feedback.style.display = 'block';
              feedback.style.background = 'rgba(239,68,68,0.1)';
              feedback.style.color = '#ef4444';
              feedback.innerHTML = 'Lütfen sipariş numarasını giriniz.';
              return;
            }
            
            let orderId = val;
            const vipMatch = val.match(/(VIP-[0-9]+)/i);
            if(vipMatch) {
              orderId = vipMatch[1];
            } else if (val.includes('?p=')) {
                try {
                    const token = new URLSearchParams(val.split('?')[1]).get('p');
                    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) base64 += '=';
                    const decoded = atob(base64);
                    const parts = decoded.split('|');
                    if(parts.length >= 3 && parts[0].startsWith('VIP-')) {
                        orderId = parts[0];
                    }
                } catch(e) {}
            }
            
            const originalHTML = btnCancel.innerHTML;
            btnCancel.innerHTML = '<span class="spinner" style="border-color:#fff; border-top-color:transparent; width:18px; height:18px; margin-right:8px; display:inline-block;"></span> İptal Ediliyor...';
            btnCancel.disabled = true;
            btnCancel.style.opacity = '0.8';
            btnCancel.style.transform = 'scale(0.98)';
            
            try {
              const res = await fetch('/api/payment/cancel-vip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, secret: 'VIP_ADMIN_BYPASS_2026' })
              });
              const data = await res.json();
              feedback.style.display = 'block';
              if(data.success) {
                feedback.style.background = 'rgba(16,185,129,0.15)';
                feedback.style.color = '#10b981';
                feedback.innerHTML = '✅ İptal Edildi: ' + orderId;
                inputCancel.value = '';
              } else {
                feedback.style.background = 'rgba(239,68,68,0.15)';
                feedback.style.color = '#ff6b6b';
                feedback.innerHTML = '❌ Hata: ' + data.message;
              }
            } catch(e) {
              feedback.style.display = 'block';
              feedback.style.background = 'rgba(239,68,68,0.15)';
              feedback.style.color = '#ff6b6b';
              feedback.innerHTML = '❌ Sunucu iletişim hatası.';
            } finally {
              btnCancel.innerHTML = originalHTML;
              btnCancel.disabled = false;
              btnCancel.style.opacity = '1';
              btnCancel.style.transform = 'scale(1)';
            }
          });
        }
      });
    </script>
    <!-- /VIP LINK CANCEL CARD END -->
"""
    
    target_split = '  <div id="toast" class="toast">'
    if target_split in full_text:
        # We want to place it just before <div id="toast">... but inside <div class="container">?
        # Actually in the code:
        #     </div>
        #   </div>
        #
        #   <div id="toast" class="toast">Panoya kopyalandı!</div>
        #
        # So we can replace "    </div>\n  </div>\n\n  <div id="toast"" 
        # with "    </div>\n" + better_cancel_card + "  </div>\n\n  <div id="toast""
        
        insert_target = '    </div>\n  </div>\n\n  <div id="toast"'
        if insert_target in full_text:
            full_text = full_text.replace(insert_target, '    </div>\n' + better_cancel_card + '\n  </div>\n\n  <div id="toast"')
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print("Successfully moved and styled the cancel card.")
        else:
            print("Could not find insert_target")
    else:
        print("Could not find target_split")

patch()
