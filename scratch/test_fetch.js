const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', (e) => resolve({ status: 0, error: e.message }));
  });
}

async function test() {
  const q = encodeURIComponent('Omega 310.30.42.50.01.002');
  const res = await fetchUrl('https://www.chrono24.com/search/index.htm?query=' + q);
  console.log('Status:', res.status, 'Length:', res.data ? res.data.length : 0);
  const regex = /https:\/\/[^"'\s]+\.chrono24\.com\/images\/(?:uhren|watches)\/[^"'\s]+\.(?:jpg|png|webp)/ig;
  const match = res.data ? res.data.match(regex) : null;
  console.log('Found matches:', match ? match.slice(0, 3) : 'None');
}
test();
