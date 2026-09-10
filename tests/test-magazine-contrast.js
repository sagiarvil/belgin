const fs = require('fs');
const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css', 'style.css'), 'utf8');
const jsApp = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

console.log('=== TEST 1: CSS Style Reverse Contrast Rules ===');
assert.ok(css.includes('.home-mag-featured-content h3'), 'CSS must define .home-mag-featured-content h3');
assert.ok(css.includes('color: #FFFFFF !important;'), 'h3 must be forced to #FFFFFF with !important');
assert.ok(css.includes('text-shadow: 0 2px 10px rgba(0, 0, 0, 0.95)'), 'h3 must have strong legibility shadow');
assert.ok(css.includes('color: #F1F5F9 !important;'), 'p must be high-contrast light slate');
assert.ok(css.includes('backdrop-filter: blur(8px)'), 'content block must have frosted glass backdrop protection');
console.log('✅ PASS: CSS Reverse Contrast Rules Verified');

console.log('\n=== TEST 2: JS Template Dynamic Contrast ===');
assert.ok(jsApp.includes('color:#FFFFFF; line-height:1.35; margin:0 0 8px 0; text-shadow:0 2px 10px rgba(0,0,0,0.95)'), 'js/app.js renderHomeMagazine must have inline #FFFFFF and shadow on h3');
assert.ok(jsApp.includes('color:#F1F5F9; margin:0 0'), 'js/app.js renderHomeMagazine must have light high-contrast p');
console.log('✅ PASS: JS Template Contrast Verified');

console.log('\n=== TEST 3: Static HTML Fallback Contrast ===');
assert.ok(indexHtml.includes('color:#FFFFFF; line-height:1.35; margin:0 0 8px 0; text-shadow:0 2px 10px rgba(0,0,0,0.95)'), 'index.html static cards must have inline #FFFFFF and shadow on h3');
console.log('✅ PASS: Static HTML Fallback Contrast Verified');

console.log('\n🎉 ALL 3 MAGAZINE CONTRAST TESTS PASSED PERFECTLY!');
