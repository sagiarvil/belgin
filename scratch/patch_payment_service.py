import sys

def patch():
    file_path = '/Users/macair1/projects/belgin/functions/payment/payment-service.js'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    target = "const items = normalizeCart(body.items, isVipPayment, body.vipToken, productCatalog);"
    replacement = """const items = normalizeCart(body.items, isVipPayment, body.vipToken, productCatalog);

    // --- VIP LINK CANCELLATION CHECK ---
    const isVipCheck = isVipPayment || items.some(i => String(i.id).startsWith('VIP-'));
    if (isVipCheck) {
      const vipOrderId = items.find(i => String(i.id).startsWith('VIP-'))?.id;
      if (vipOrderId) {
        try {
          const cancelDoc = await db.collection('cancelled_vip_links').doc(vipOrderId).get();
          if (cancelDoc.exists) {
            const error = new Error('Bu VIP ödeme linki/siparişi iptal edilmiştir.');
            error.code = 'VIP_LINK_CANCELLED';
            throw error;
          }
        } catch (err) {
          if (err.code === 'VIP_LINK_CANCELLED') throw err;
          console.error('Cancel check error:', err);
        }
      }
    }
    // ------------------------------------"""

    if target in content and "VIP LINK CANCELLATION CHECK" not in content:
        content = content.replace(target, replacement)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched payment-service.js successfully.")
    else:
        print("Target not found or already patched in payment-service.js.")

patch()
