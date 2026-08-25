const base = require('./index');
const { completeHighValueDelivery } = require('./delivery');
const { onOrderEvidenceFinalize, issueEvidenceAccessToken, getOrderEvidence } = require('./evidence');

module.exports = {
  ...base,
  completeHighValueDelivery,
  onOrderEvidenceFinalize,
  issueEvidenceAccessToken,
  getOrderEvidence,
};
