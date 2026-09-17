const https = require('https');

const optionsOptions = {
  hostname: 'us-central1-carbon-web-1265b.cloudfunctions.net',
  path: '/adminInvoiceApi/api/admin/invoice/draft?cb=1',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://www.belginkuyumculuk.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'x-admin-key, content-type'
  }
};

const req1 = https.request(optionsOptions, (res) => {
  console.log('OPTIONS Status:', res.statusCode);
  console.log('OPTIONS Headers:', res.headers);
});
req1.end();
