const fs = require('fs');

// 1. Update scripts/generate-seo-assets.js
let assetsCode = fs.readFileSync('scripts/generate-seo-assets.js', 'utf8');

const newXFunc = `function decodeHtml(v) {
  return String(v ?? '')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function x(v) {
  return decodeHtml(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}`;

assetsCode = assetsCode.replace(/function x\(v\) \{[\s\S]*?\}/, newXFunc);
fs.writeFileSync('scripts/generate-seo-assets.js', assetsCode, 'utf8');
console.log('scripts/generate-seo-assets.js XML escaping updated.');

// 2. Clean raw entities in js/data.js
let dataContent = fs.readFileSync('js/data.js', 'utf8');
if (dataContent.includes('&#039;') || dataContent.includes('&#39;')) {
  dataContent = dataContent.replace(/&#039;/g, "'").replace(/&#39;/g, "'");
  fs.writeFileSync('js/data.js', dataContent, 'utf8');
  console.log('Cleaned raw HTML entities in js/data.js.');
}
