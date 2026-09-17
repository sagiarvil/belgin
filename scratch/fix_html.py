import sys

def fix():
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
        # Extract the card lines
        card_lines = lines[start_idx:end_idx+1]
        # Remove from original
        del lines[start_idx:end_idx+1]
    else:
        print("Could not find the card to remove.")
        return

    # Now find the end of the .container
    # It's right before <script src="/js/data.js
    # Let's search for "</body>" and go back up to find the last </div> before scripts
    insert_idx = -1
    for i, line in enumerate(lines):
        if "<script src=\"/js/data.js" in line or "<script src=\"/js/vip-payment.js" in line:
            # We want to insert just before the script tags at the bottom.
            # But wait, data.js is actually inside the body, right?
            pass

    # Let's just find "</body>"
    body_end_idx = -1
    for i, line in enumerate(lines):
        if "</body>" in line:
            body_end_idx = i
            break

    # We will insert it right before the last closing </div> that is before the inline <script> block at the end of body.
    # Let's just do a string replacement on the full text instead.
    
    full_text = "".join(lines)
    
    # Improved Cancel Card HTML
    better_cancel_card = """
    <!-- VIP LINK CANCEL CARD -->
    <div class="card" style="margin-top:24px; border-top:2px solid #ef4444; border-radius: 16px;">
      <div class="card-title" style="color:#ef4444; font-size: 16px; margin-bottom: 10px;"><span class="dot" style="background:#ef4444; box-shadow:0 0 8px rgba(239,68,68,0.5);">⛔</span> Gönderilmiş Linki İptal Et</div>
      <p style="font-size:13px; color:var(--text-dim); margin-bottom:16px; line-height:1.5;">Yanlış gönderdiğiniz bir linki (Sipariş ID veya linkin tamamı) geçersiz kılın.</p>
      
      <div class="field" style="margin-bottom: 16px;">
        <div class="input-shell" style="border-radius: 12px; border: 1px solid rgba(239,68,68,0.3);">
          <input type="text" id="cancelOrderId" class="form-input" style="padding: 14px; font-size: 14px;" placeholder="Örn: VIP-1726555123 veya link...">
        </div>
      </div>
      
      <div class="field" style="margin-bottom:0;">
        <button type="button" class="btn" id="btnCancelLink" style="width: 100%; padding: 15px; border-radius: 12px; font-weight: bold; background: #ef4444; color: #fff; border: none; font-size: 15px; box-shadow: 0 4px 12px rgba(239,68,68,0.3);">🗑️ Linki İptal Et</button>
      </div>
      <div id="cancelFeedback" style="margin-top:12px; font-size:13px; font-weight: 500; display:none; padding: 10px; border-radius: 8px; text-align: center;"></div>
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
            
            btnCancel.innerHTML = '⏳ İptal Ediliyor...';
            btnCancel.disabled = true;
            btnCancel.style.opacity = '0.7';
            
            try {
              const res = await fetch('/api/payment/cancel-vip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, secret: 'VIP_ADMIN_BYPASS_2026' })
              });
              const data = await res.json();
              feedback.style.display = 'block';
              if(data.success) {
                feedback.style.background = 'rgba(16,185,129,0.1)';
                feedback.style.color = '#10b981';
                feedback.innerHTML = '✅ Link iptal edildi: ' + orderId;
                inputCancel.value = '';
              } else {
                feedback.style.background = 'rgba(239,68,68,0.1)';
                feedback.style.color = '#ef4444';
                feedback.innerHTML = '❌ Hata: ' + data.message;
              }
            } catch(e) {
              feedback.style.display = 'block';
              feedback.style.background = 'rgba(239,68,68,0.1)';
              feedback.style.color = '#ef4444';
              feedback.innerHTML = '❌ Sunucu iletişim hatası.';
            } finally {
              btnCancel.innerHTML = '🗑️ Linki İptal Et';
              btnCancel.disabled = false;
              btnCancel.style.opacity = '1';
            }
          });
        }
      });
    </script>
    <!-- /VIP LINK CANCEL CARD END -->
"""

    # To place it inside the container, we look for the last closing div of the container.
    # The structure is <div class="container"> ... </div> <script> ... </body>
    # Let's just put it right before `<script src="/js/data.js` or before `function fallbackCopy`
    
    # Actually, we can just find:
    #  <div class="toast" id="toast"></div>
    # </div> <!-- This is the container end -->
    
    target_split = '  <div class="toast" id="toast"></div>\n  </div>'
    if target_split in full_text:
        full_text = full_text.replace(target_split, better_cancel_card + "\n" + target_split)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(full_text)
        print("Successfully moved and styled the cancel card.")
    else:
        # Fallback
        target2 = '<script src="/js/data.js'
        if target2 in full_text:
             # Just inject it before the script tags, but make sure it's inside the container
             # Actually, if we insert before scripts, it might be outside container. 
             pass
        print("Couldn't find target split point. Here are the bottom lines:")
        print(full_text[-500:])
        
        # Let's try replacing `</form>\n    </div>`
        target3 = '</form>\n    </div>'
        if target3 in full_text:
            full_text = full_text.replace(target3, target3 + "\n" + better_cancel_card)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(full_text)
            print("Successfully moved using target3.")

fix()
