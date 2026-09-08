'use strict';

const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const {
  PaymentEvidenceRouter,
  getComplianceConfig,
  generateBankTransferDeclarationText,
  generateCashDeclarationText,
  buildCanonicalEvidencePackage,
  computeDocumentFileHash,
} = require('./index');

const router = new PaymentEvidenceRouter();

/**
 * HTTPS endpoint: cashBankEvidenceApi
 * Provides RESTful access for N8N workflows, automated validation, and enterprise audit pipelines.
 *
 * Supported Actions:
 * - route: /api/evidence/route or ?action=route
 * - validate: /api/evidence/validate or ?action=validate
 * - compliance: /api/evidence/compliance or ?action=compliance
 * - declaration: /api/evidence/declaration or ?action=declaration
 * - package: /api/evidence/package or ?action=package
 */
const cashBankEvidenceApi = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest((req, res) => cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    try {
      const path = req.path || '';
      const body = req.body || {};
      const action = body.action || req.query.action || path.split('/').filter(Boolean).pop() || 'compliance';

      switch (action) {
        case 'route': {
          const method = body.paymentMethod || req.query.paymentMethod;
          if (!method) {
            return res.status(400).json({ success: false, error: 'paymentMethod gereklidir.' });
          }
          const routing = router.route(method);
          return res.status(200).json({ success: true, routing });
        }

        case 'validate': {
          const payload = body.order || body.payload || body;
          if (!payload || typeof payload !== 'object') {
            return res.status(400).json({ success: false, error: 'Doğrulanacak veri gövdesi (payload/order) gereklidir.' });
          }
          const result = router.process(payload);
          return res.status(200).json({ success: true, result });
        }

        case 'compliance': {
          const config = getComplianceConfig();
          return res.status(200).json({ success: true, compliance: config });
        }

        case 'declaration': {
          const method = String(body.paymentMethod || req.query.paymentMethod || '').toUpperCase();
          const order = body.order || body;
          let text = '';
          if (method === 'CASH_COUNTER' || method === 'NAKIT' || method === 'STORE_CASH') {
            text = generateCashDeclarationText(order);
          } else {
            text = generateBankTransferDeclarationText(order);
          }
          return res.status(200).json({ success: true, declarationText: text });
        }

        case 'package': {
          const order = body.order || body;
          const pkg = buildCanonicalEvidencePackage(order);
          return res.status(200).json({ success: true, package: pkg });
        }

        default: {
          return res.status(200).json({
            success: true,
            message: 'Belgin Kuyumculuk Nakit & Banka Havalesi Delil Motoru API',
            version: '1.0.0',
            availableEndpoints: [
              'POST /api/evidence/route',
              'POST /api/evidence/validate',
              'GET  /api/evidence/compliance',
              'POST /api/evidence/declaration',
              'POST /api/evidence/package',
            ],
          });
        }
      }
    } catch (err) {
      console.error('[cashBankEvidenceApi Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }));

module.exports = {
  cashBankEvidenceApi,
};
