const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const meta = '<meta name="mobile-web-app-capable" content="yes">';

if (!html.includes(meta)) {
  const anchor = '<meta name="apple-mobile-web-app-capable" content="yes">';
  if (!html.includes(anchor)) {
    throw new Error('[mobile-web-app-meta] apple mobile meta anchor missing');
  }
  html = html.replace(anchor, `${anchor}\n  ${meta}`);
  fs.writeFileSync(file, html, 'utf8');
}

console.log('[mobile-web-app-meta] current mobile web app capability meta ensured.');
