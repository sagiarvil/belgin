const https = require('https');

function getVQD(query) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'duckduckgo.com',
      path: '/?q=' + encodeURIComponent(query),
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const m = data.match(/vqd=([a-zA-Z0-9_\-]+)/) || data.match(/vqd="([^"]+)"/);
        resolve(m ? m[1] : null);
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

function searchImages(query, vqd) {
  return new Promise((resolve) => {
    const path = `/i.js?q=${encodeURIComponent(query)}&o=json&p=1&s=0&u=bing&f=,,,&l=us-en&vqd=${vqd}`;
    const req = https.request({
      hostname: 'duckduckgo.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://duckduckgo.com/'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.results || []);
        } catch(e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.end();
  });
}

async function main() {
  const query = 'Omega Speedmaster Moonwatch 310.30.42.50.01.002 watch';
  const vqd = await getVQD(query);
  console.log('VQD:', vqd);
  if (vqd) {
    const results = await searchImages(query, vqd);
    console.log('Results count:', results.length);
    if (results.length > 0) {
      console.log('First 3 images:', results.slice(0, 3).map(r => ({ image: r.image, title: r.title, width: r.width, height: r.height })));
    }
  }
}
main();
