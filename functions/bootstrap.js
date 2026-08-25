const base = require('./index');
const { completeHighValueDelivery } = require('./delivery');
const { onOrderEvidenceFinalize, issueEvidenceAccessToken, getOrderEvidence } = require('./evidence');
const { dispatchOrderEvidenceEmails } = require('./mailer');

module.exports = {
  ...base,
  completeHighValueDelivery,
  onOrderEvidenceFinalize,
  issueEvidenceAccessToken,
  getOrderEvidence,
  dispatchOrderEvidenceEmails,
};
