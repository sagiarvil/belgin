const fs = require('fs');

const indexJsPath = '/Users/macair1/projects/belgin/functions/index.js';
let content = fs.readFileSync(indexJsPath, 'utf-8');

// 1. Add new endpoints in handleInvoiceRequest
const newEndpoints = `
    } else if (path.endsWith('/draft-async') || req.body?.action === 'draft-async') {
      const { orderId, orderData } = req.body;
      if (!orderId) return res.status(400).json({ success: false, message: 'orderId zorunludur' });
      
      const target = await getInvoiceTargetDoc(orderId, orderData);
      const invoiceDate = req.body.invoiceDate ? parseTrDateToIso(req.body.invoiceDate) : null;
      
      const jobRef = db.collection('invoice_jobs').doc();
      await jobRef.set({
        action: 'CREATE_DRAFT',
        status: 'PENDING',
        orderId: orderId,
        orderData: orderData || {},
        invoiceDate: invoiceDate,
        orderDocData: target.data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({ success: true, jobId: jobRef.id });

    } else if (path.endsWith('/job-status') || req.query?.action === 'job-status') {
      const jobId = req.query.jobId;
      if (!jobId) return res.status(400).json({ success: false, message: 'jobId zorunludur' });
      
      const jobSnap = await db.collection('invoice_jobs').doc(jobId).get();
      if (!jobSnap.exists) return res.status(404).json({ success: false, message: 'Job bulunamadı' });
      
      return res.json({ success: true, data: jobSnap.data() });
`;

content = content.replace("    } else if (path.endsWith('/draft') || req.body?.action === 'draft') {", newEndpoints + "\n    } else if (path.endsWith('/draft') || req.body?.action === 'draft') {");

// 2. Add processInvoiceJob at the end
const triggerFunction = `
// -------------------------------------------------------------
// ASYNC GİB INVOICE JOB PROCESSOR (Bypasses 60s HTTP limit)
// -------------------------------------------------------------
exports.processInvoiceJob = functions.region('us-central1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .firestore.document('invoice_jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (data.action !== 'CREATE_DRAFT') return;
    
    try {
      const earsiv = new EarsivPortalService();
      // login cache is handled inside earsiv-service if we use getActiveToken, but here we just call createDraftInvoice
      const draftResult = await earsiv.createDraftInvoice(data.orderDocData, data.invoiceDate, data.orderData);
      const smsResult = await earsiv.sendSmsOtp(draftResult.invoiceUuid, draftResult.oid, data.orderData?.customerPhone || '');
      
      await snap.ref.update({
        status: 'SUCCESS',
        invoiceUuid: draftResult.invoiceUuid,
        oid: draftResult.oid,
        smsResult: smsResult,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update order doc as well
      const orderRef = db.collection('orders').doc(data.orderId);
      await orderRef.update({
        invoiceUuid: draftResult.invoiceUuid,
        invoiceStatus: 'DRAFT',
        invoiceDate: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (e) {
      await snap.ref.update({
        status: 'ERROR',
        message: e.message || 'Bilinmeyen Hata',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
`;

if (!content.includes('exports.processInvoiceJob')) {
  content += '\n' + triggerFunction;
}

fs.writeFileSync(indexJsPath, content, 'utf-8');
console.log('index.js updated successfully!');
