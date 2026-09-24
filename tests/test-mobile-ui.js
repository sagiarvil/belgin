const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  const rootDir = path.resolve(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const styleCss = fs.readFileSync(path.join(rootDir, 'css/style.css'), 'utf8');

  // 1. Mobile bottom dock contains Canli Borsa button
  assert(indexHtml.includes('/canli-fiyatlar/'), 'index.html must contain link to /canli-fiyatlar/ in mobile dock');
  assert(indexHtml.includes('dock-live-indicator'), 'index.html must contain dock-live-indicator in mobile dock');
  assert(indexHtml.includes('Canlı Borsa'), 'index.html must contain Canlı Borsa label in mobile dock');

  // 2. CSS contains 5-item mobile dock refinements and live pulse
  assert(styleCss.includes('.mobile-dock-btn'), 'style.css must contain .mobile-dock-btn');
  assert(styleCss.includes('.dock-live-indicator'), 'style.css must contain .dock-live-indicator');
  assert(styleCss.includes('dockLivePulse'), 'style.css must contain dockLivePulse keyframes');

  // 3. BOM pass check
  const buf = fs.readFileSync(path.join(rootDir, 'index.html'));
  assert(!(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF), 'index.html must be BOM-free UTF-8');

  console.log('PASS: All Mobile UI verifications passed successfully.');
}

runTest();
