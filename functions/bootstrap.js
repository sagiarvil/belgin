const base = require('./index');
const { completeHighValueDelivery } = require('./delivery');
const { onOrderEvidenceFinalize, issueEvidenceAccessToken, getOrderEvidence } = require('./evidence');
const { dispatchOrderEvidenceEmails } = require('./mailer');
const { ziraatPaymentCallback } = require('./ziraat-callback');
const { magazineFetchArticle } = require('./magazine-fetch');

module.exports = {
  ...base,
  completeHighValueDelivery,
  onOrderEvidenceFinalize,
  issueEvidenceAccessToken,
  getOrderEvidence,
  dispatchOrderEvidenceEmails,
  ziraatPaymentCallback,
  magazineFetchArticle,
};