const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Add seo-route-map.js before router.js
if (!html.includes('js/seo-route-map.js')) {
  html = html.replace('<script src="js/router.js', '<script src="js/seo-route-map.js?v=2026.08.26.1620"></script>\n<script src="js/router.js');
}

// 2. Desktop Navigation links
html = html.replace('href="#saatler" data-page="saatler"', 'href="/saatler/" data-page="saatler"');
html = html.replace('href="#ikinci-el" data-page="ikinci-el"', 'href="/ikinci-el/" data-page="ikinci-el"');
html = html.replace(/href="#mucevherat"\s+data-page="mucevherat"/g, 'href="/mucevherat/" data-page="mucevherat"');
html = html.replace('href="#" data-page="hikayemiz"', 'href="/#hikayemiz" data-page="hikayemiz"');
html = html.replace('href="#" data-page="iletisim"', 'href="/#iletisim" data-page="iletisim"');
html = html.replace('href="#" data-page="ana-sayfa"', 'href="/" data-page="ana-sayfa"');

// 3. Mobile drawer links
html = html.replace('href="#" data-page="saatler"', 'href="/saatler/" data-page="saatler"');
html = html.replace('href="#" data-page="ikinci-el"', 'href="/ikinci-el/" data-page="ikinci-el"');
html = html.replace('href="#" data-page="mucevherat"', 'href="/mucevherat/" data-page="mucevherat"');

// 4. Footer links
html = html.replace('href="#" data-page="saatler"', 'href="/saatler/" data-page="saatler"');
html = html.replace('href="#" data-page="ikinci-el"', 'href="/ikinci-el/" data-page="ikinci-el"');
html = html.replace('href="#" data-page="mucevherat"', 'href="/mucevherat/" data-page="mucevherat"');

// 5. Mobile bottom dock links
html = html.replace('href="#" data-page="ana-sayfa"', 'href="/" data-page="ana-sayfa"');
html = html.replace('href="#" data-page="saatler"', 'href="/saatler/" data-page="saatler"');

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated with clean category links and seo-route-map script.');
