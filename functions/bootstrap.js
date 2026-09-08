const base = require('./index');
const { completeHighValueDelivery } = require('./delivery');
const { onOrderEvidenceFinalize, issueEvidenceAccessToken, getOrderEvidence } = require('./evidence');
const { dispatchOrderEvidenceEmails } = require('./mailer');
const cashBankEvidence = require('./cash-bank-evidence');
const { cashBankEvidenceApi } = require('./cash-bank-evidence/api');

module.exports = {
  ...base,
  completeHighValueDelivery,
  onOrderEvidenceFinalize,
  issueEvidenceAccessToken,
  getOrderEvidence,
  dispatchOrderEvidenceEmails,
  cashBankEvidence,
  cashBankEvidenceApi,
};
