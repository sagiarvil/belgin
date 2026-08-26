const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.split('href="#" data-page="saatler"').join('href="/saatler/" data-page="saatler"');
html = html.split('href="#" data-page="ikinci-el"').join('href="/ikinci-el/" data-page="ikinci-el"');
html = html.split('href="#" data-page="mucevherat"').join('href="/mucevherat/" data-page="mucevherat"');
html = html.split('href="#" data-page="ana-sayfa"').join('href="/" data-page="ana-sayfa"');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed all category hrefs in index.html.');
