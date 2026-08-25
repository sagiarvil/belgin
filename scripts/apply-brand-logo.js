const fs = require('fs');

const indexPath = 'index.html';
const cssPath = 'css/style.css';

let html = fs.readFileSync(indexPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) {
    if (source.includes(after)) return source;
    throw new Error(`Brand integration anchor not found: ${label}`);
  }
  return source.replace(before, after);
}

html = replaceOnce(
  html,
  '"logo": "https://belgin.web.app/favicon.svg"',
  '"logo": "https://belgin.web.app/images/belgin-logo.png"',
  'schema logo'
);

html = replaceOnce(
  html,
  '<link rel="stylesheet" href="css/style.css?v=2026.22.0">',
  '<link rel="stylesheet" href="css/style.css?v=2026.23.0">',
  'stylesheet cache version'
);

const desktopOld = `    <!-- Sol Logo -->\n    <a class="logo-area-main" href="#" data-page="home">\n      <div class="brand-crest">\n        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>\n      </div>\n      <div class="logo-text-col">\n        <span class="logo-main">BELGIN</span>\n        <span class="logo-sub">EST. 1999 • BUCA İZMİR</span>\n      </div>\n    </a>`;

const desktopNew = `    <!-- Sol Logo -->\n    <a class="logo-area-main brand-logo-link" href="#" data-page="home" aria-label="Belgin Kuyumculuk & Saat ana sayfa">\n      <img class="brand-logo brand-logo-header" src="images/belgin-logo.png" width="1672" height="941" alt="Belgin Kuyumculuk & Saat" decoding="async" fetchpriority="high">\n    </a>`;

html = replaceOnce(html, desktopOld, desktopNew, 'desktop header logo');

const mobileOld = `      <div class="logo-area-main">\n        <div class="brand-crest" style="color:var(--color-gold);">\n          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>\n        </div>\n        <div class="logo-text-col">\n          <span class="logo-main" style="color:#FFF;">BELGIN</span>\n          <span class="logo-sub" style="color:var(--color-gold);">EST. 1999 • BUCA İZMİR</span>\n        </div>\n      </div>`;

const mobileNew = `      <a class="logo-area-main brand-logo-link brand-logo-mobile-surface" href="#" data-page="home" aria-label="Belgin Kuyumculuk & Saat ana sayfa" onclick="App.toggleMobileDrawer(false)">\n        <img class="brand-logo brand-logo-mobile" src="images/belgin-logo.png" width="1672" height="941" alt="Belgin Kuyumculuk & Saat" decoding="async">\n      </a>`;

html = replaceOnce(html, mobileOld, mobileNew, 'mobile drawer logo');

html = replaceOnce(
  html,
  '        <div class="footer-art-brand">BELGIN</div>',
  '        <a class="footer-brand-logo-wrap" href="#" data-page="home" aria-label="Belgin Kuyumculuk & Saat ana sayfa">\n          <img class="brand-logo brand-logo-footer" src="images/belgin-logo.png" width="1672" height="941" alt="Belgin Kuyumculuk & Saat" loading="lazy" decoding="async">\n        </a>',
  'footer logo'
);

const marker = '/* BELGIN BRAND LOGO INTEGRATION v1 */';
if (!css.includes(marker)) {
  css += `\n\n${marker}\n.brand-logo-link {\n  display: inline-flex;\n  align-items: center;\n  justify-content: flex-start;\n  min-width: 0;\n  text-decoration: none;\n}\n.brand-logo {\n  display: block;\n  width: auto;\n  max-width: 100%;\n  object-fit: contain;\n  object-position: left center;\n}\n.brand-logo-header {\n  width: 168px;\n  height: auto;\n  max-height: 74px;\n}\n.header .brand-logo-link {\n  width: 168px;\n  flex: 0 0 168px;\n}\n.brand-logo-mobile-surface {\n  width: 176px;\n  min-height: 64px;\n  padding: 5px 8px;\n  border-radius: 8px;\n  background: #FFFFFF;\n  border: 1px solid rgba(194, 167, 104, 0.32);\n}\n.brand-logo-mobile {\n  width: 158px;\n  height: auto;\n}\n.footer-brand-logo-wrap {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 184px;\n  min-height: 82px;\n  padding: 7px 10px;\n  margin-bottom: 14px;\n  border-radius: 8px;\n  background: #FFFFFF;\n  border: 1px solid rgba(194, 167, 104, 0.28);\n  text-decoration: none;\n}\n.brand-logo-footer {\n  width: 162px;\n  height: auto;\n}\n@media (max-width: 1180px) {\n  .brand-logo-header { width: 148px; }\n  .header .brand-logo-link { width: 148px; flex-basis: 148px; }\n}\n@media (max-width: 1024px) {\n  .brand-logo-header { width: 138px; }\n  .header .brand-logo-link { width: 138px; flex-basis: 138px; }\n}\n@media (max-width: 640px) {\n  .brand-logo-header { width: 128px; }\n  .header .brand-logo-link { width: 128px; flex-basis: 128px; }\n  .brand-logo-mobile-surface { width: 164px; min-height: 60px; }\n  .brand-logo-mobile { width: 146px; }\n  .footer-brand-logo-wrap { width: 172px; }\n  .brand-logo-footer { width: 150px; }\n}\n`;
}

fs.writeFileSync(indexPath, html, 'utf8');
fs.writeFileSync(cssPath, css, 'utf8');
console.log('Belgin brand logo integration applied successfully.');
