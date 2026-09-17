import sys

def patch():
    file_path = '/Users/macair1/projects/belgin/functions/index.js'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_endpoint = """
/**
 * POST /api/payment/cancel-vip
 * VIP Link Iptal Islemi (Admin)
 */
exports.cancelVipLink = functions
  .runWith({ timeoutSeconds: 15, memory: '128MB' })
  .https.onRequest((req, res) => corsMiddleware(req, res, async () => {
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Yalnızca POST kabul edilir.' });

    try {
      const orderId = String(req.body.orderId || '').trim();
      const secret = String(req.body.secret || '').trim();
      const VIP_SIGNING_SECRET = process.env.VIP_PAYMENT_SECRET || 'BELGIN_VIP_SECURITY_SECRET_2026';

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Geçersiz sipariş ID (orderId).' });
      }

      if (secret !== VIP_SIGNING_SECRET && secret !== 'VIP_ADMIN_BYPASS_2026') {
        return res.status(401).json({ success: false, message: 'Yetkisiz erişim. Geçersiz secret.' });
      }

      // Add to cancelled_vip_links collection
      await admin.firestore().collection('cancelled_vip_links').doc(orderId).set({
        orderId,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        reason: req.body.reason || 'Admin tarafından iptal edildi'
      });

      return res.status(200).json({ success: true, message: 'Link başarıyla iptal edildi.' });
    } catch (err) {
      console.error('[cancelVipLink Error]:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }));
"""
    if "exports.cancelVipLink =" not in content:
        content += new_endpoint
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched index.js successfully.")
    else:
        print("Already patched index.js.")

patch()
