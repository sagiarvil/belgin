const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/v=2026\.08\.26\.1555/g, 'v=2026.08.26.1600');
fs.writeFileSync('index.html', indexHtml, 'utf8');

let iletisimHtml = fs.readFileSync('iletisim.html', 'utf8');
iletisimHtml = iletisimHtml.replace(/v=2026\.[^"'\s]+/g, 'v=2026.08.26.1600');
fs.writeFileSync('iletisim.html', iletisimHtml, 'utf8');

console.log('Bumped version tags to 2026.08.26.1600');
