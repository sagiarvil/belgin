const fs = require('fs');

const cardFooterBadges = `
<div style="max-width:1200px;margin:8px auto;padding:10px 18px;border:1px solid #d8e4e1;border-radius:8px;background:#ffffff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12px;color:#444;">
  <div style="display:flex;align-items:center;gap:6px;">
    <span>💳</span>
    <strong style="color:var(--color-ink);">Kabul Edilen Kart Ağları:</strong>
  </div>
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <span style="background:#1434CB;color:#FFF;font-family:sans-serif;font-weight:800;font-style:italic;font-size:11px;padding:3px 8px;border-radius:3px;letter-spacing:1px;">VISA</span>
    <span style="background:#222;color:#FFF;font-family:sans-serif;font-weight:700;font-size:10.5px;padding:3px 6px;border-radius:3px;display:inline-flex;align-items:center;gap:2px;">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#EB001B;"></span>
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#F79E1B;margin-left:-5px;opacity:0.9;"></span>
      <span style="margin-left:3px;">Mastercard</span>
    </span>
    <span style="background:#0A6FB7;color:#FFF;font-family:sans-serif;font-weight:800;font-size:10.5px;padding:3px 8px;border-radius:3px;letter-spacing:0.5px;">TROY</span>
    <span style="background:#EBF5FB;border:1px solid #AED6F1;color:#1B4F72;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:3px;">3D Secure SMS</span>
    <span style="background:#E8F8F5;border:1px solid #A3E4D7;color:#117A65;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:3px;">256-Bit SSL</span>
  </div>
</div>
`;

// index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
if (!indexHtml.includes('Kabul Edilen Kart Ağları:')) {
  indexHtml = indexHtml.replace('</div>\n</footer>', '</div>\n' + cardFooterBadges + '\n</footer>');
  fs.writeFileSync('index.html', indexHtml, 'utf8');
  console.log('Added footer card logos to index.html');
}

// iletisim.html
let iletisimHtml = fs.readFileSync('iletisim.html', 'utf8');
if (!iletisimHtml.includes('Kabul Edilen Kart Ağları:')) {
  iletisimHtml = iletisimHtml.replace('</div>\n</footer>', '</div>\n' + cardFooterBadges + '\n</footer>');
  fs.writeFileSync('iletisim.html', iletisimHtml, 'utf8');
  console.log('Added footer card logos to iletisim.html');
}
