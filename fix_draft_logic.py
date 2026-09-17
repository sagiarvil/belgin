import re

js_path = '/Users/macair1/projects/belgin/js/admin.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

replacement = """
      const draftPayload = {
        orderId: inv.orderId,
        totalAmount: Number(inv.totalAmount || 0),
        invoiceDate: invoiceDateVal,
        productName: inv.productName || (inv.items && inv.items[0]?.name) || '22 Ayar Bilezik',
        customerName: inv.customerName,
        customerIdentity: inv.customerIdentity,
        companyName: inv.companyName || inv.unvan,
        unvan: inv.unvan || inv.companyName,
        taxOffice: inv.taxOffice,
        customerAddress: inv.customerAddress,
        customerPhone: inv.customerPhone,
        customerEmail: inv.customerEmail,
        items: inv.items || [],
        customBreakdown: inv.breakdown || bd,
        orderData: {
          ...cleanOrderData,
          invoiceDate: invoiceDateVal
        },
        adminKey: this.adminPin
      };

      let draftData = null;
      
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
          const draftRes = await fetch('/api/admin/invoice/draft?cb=1', {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(draftPayload)
          });
          const rawText = await draftRes.text();
          try { draftData = JSON.parse(rawText); } catch (_) {}
      }
"""

js = re.sub(r"      const draftPayload = \{.*?\};\n\n      const draftRes = await fetch\('/api/admin/invoice/draft\?cb=1', \{\n        method: 'POST',\n        headers: this\.getAuthHeaders\(\),\n        body: JSON\.stringify\(draftPayload\)\n      \}\);\n\n      const rawText = await draftRes\.text\(\);\n      let draftData = null;\n      try \{ draftData = JSON\.parse\(rawText\); \} catch \(\_\) \{\}", replacement, js, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Logic updated successfully!")
