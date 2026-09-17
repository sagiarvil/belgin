import re

js_path = '/Users/macair1/projects/belgin/js/admin.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

replacement = """
      if (inv.invoiceStatus === 'DRAFT' && inv.invoiceUuid) {
          if (submitBtn) submitBtn.innerHTML = '<span>⏳ SMS Tekrar Gönderiliyor...</span>';
          const smsRes = await fetch('/api/admin/invoice/send-sms?cb=1', {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ orderId: inv.orderId, adminKey: this.adminPin })
          });
          const rawText = await smsRes.text();
          try { draftData = JSON.parse(rawText); } catch (_) {}
          
          if (draftData && draftData.success) {
              draftData.invoiceUuid = inv.invoiceUuid;
          }
      } else {
          // ASENKRON GİB MİMARİSİ (FIRESTORE QUEUE POLLING)
          if (submitBtn) submitBtn.innerHTML = '<span>⏳ GİB Bağlantısı Kuruluyor...</span>';
          const asyncRes = await fetch('/api/admin/invoice/draft-async?cb=1', {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(draftPayload)
          });
          const asyncData = await asyncRes.json();
          if (!asyncData || !asyncData.success) {
             throw new Error(asyncData?.message || 'Asenkron görev başlatılamadı.');
          }
          
          const jobId = asyncData.jobId;
          if (submitBtn) submitBtn.innerHTML = '<span>⏳ GİB Yanıtı Bekleniyor (1-2 Dk Sürebilir)...</span>';
          
          // Poll every 3 seconds
          let jobSuccess = false;
          let jobError = null;
          for (let i = 0; i < 40; i++) { // max 120 seconds
             await new Promise(r => setTimeout(r, 3000));
             const statusRes = await fetch(`/api/admin/invoice/job-status?jobId=${jobId}&cb=${Date.now()}`, {
               headers: this.getAuthHeaders()
             });
             const statusData = await statusRes.json();
             if (statusData && statusData.success && statusData.data) {
                 const st = statusData.data.status;
                 if (st === 'SUCCESS') {
                     jobSuccess = true;
                     draftData = {
                         success: true,
                         invoiceUuid: statusData.data.invoiceUuid,
                         oid: statusData.data.oid
                     };
                     break;
                 } else if (st === 'ERROR') {
                     jobError = statusData.data.message;
                     break;
                 }
             }
          }
          
          if (!jobSuccess) {
              throw new Error(jobError || 'GİB Zaman Aşımı (120 sn). Fatura Taslaklara düşmüş olabilir, lütfen sayfayı yenileyin.');
          }
      }
"""

# Replace the block inside submitStoreInvoice
js = re.sub(r"      if \(inv\.invoiceStatus === 'DRAFT' && inv\.invoiceUuid\) \{.*?      \} else \{\n          const draftRes = await fetch\('/api/admin/invoice/draft\?cb=1'.*?try \{ draftData = JSON\.parse\(rawText\); \} catch \(\_\) \{\}\n      \}", replacement, js, flags=re.DOTALL)

# Update the catch block to be cleaner now that we have polling
catch_replacement = """
    } catch (e) {
      alert('❌ GİB İşlem Hatası: ' + e.message);
      if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';
    }
"""
js = re.sub(r"    \} catch \(e\) \{\n      if \(e\.message\.includes\('Failed to fetch'\).*?      if \(submitBtn\) submitBtn\.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';\n    \}", catch_replacement, js, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("admin.js updated for Async Polling!")
