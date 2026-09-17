const https = require('https');

const optionsOptions = {
  hostname: 'us-central1-carbon-web-1265b.cloudfunctions.net',
  path: '/adminInvoiceApi/api/admin/invoice/draft?cb=1',
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://belginkuyumculuk.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'x-admin-key, content-type'
  }
};

const req1 = https.request(optionsOptions, (res) => {
  console.log('OPTIONS Status:', res.statusCode);
  console.log('OPTIONS Headers:', res.headers);
  
  if (res.headers['access-control-allow-headers'] && res.headers['access-control-allow-headers'].toLowerCase().includes('x-admin-key')) {
    console.log('CORS PREFLIGHT PASSED');
    
    // Now test POST
    const postData = JSON.stringify({ action: 'draft', orderId: 'test' });
    const postOptions = {
      hostname: 'us-central1-carbon-web-1265b.cloudfunctions.net',
      path: '/adminInvoiceApi/api/admin/invoice/draft?cb=1',
      method: 'POST',
      headers: {
        'Origin': 'https://belginkuyumculuk.com',
        'Content-Type': 'application/json',
        'x-admin-key': 'WRONG_KEY',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req2 = https.request(postOptions, (res2) => {
      console.log('POST Status:', res2.statusCode);
      let data = '';
      res2.on('data', d => data += d);
      res2.on('end', () => console.log('POST Body:', data));
    });
    req2.on('error', console.error);
    req2.write(postData);
    req2.end();
  } else {
    console.error('CORS PREFLIGHT FAILED');
  }
});
req1.on('error', console.error);
req1.end();
