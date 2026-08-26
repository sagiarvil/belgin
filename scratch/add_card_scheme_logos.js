const fs = require('fs');

const cardLogosHtml = `
          <!-- AKBANK / VISA / MASTERCARD / TROY / 3D SECURE LOGO BANDI (Madde 14 Uyumu) -->
          <div style="background:#FAF8F5; border:1px solid #EAE5D9; border-radius:8px; padding:14px 18px; margin:20px 0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px;">🔒</span>
              <div>
                <strong style="font-size:12.5px; color:var(--color-ink); display:block;">Güvenli Ödeme Altyapısı</strong>
                <span style="font-size:11px; color:#666;">256-Bit SSL & BDDK Lisanslı 3D Secure Doğrulaması</span>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <!-- Visa Badge -->
              <span style="background:#1434CB; color:#FFF; font-family:sans-serif; font-weight:800; font-style:italic; font-size:13px; padding:4px 10px; border-radius:4px; letter-spacing:1px; display:inline-block;">VISA</span>
              <!-- Mastercard Badge -->
              <span style="background:#222; color:#FFF; font-family:sans-serif; font-weight:700; font-size:11.5px; padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:3px;">
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#EB001B;"></span>
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#F79E1B; margin-left:-6px; opacity:0.9;"></span>
                <span style="margin-left:4px;">Mastercard</span>
              </span>
              <!-- Troy Badge -->
              <span style="background:#0A6FB7; color:#FFF; font-family:sans-serif; font-weight:800; font-size:12px; padding:4px 10px; border-radius:4px; letter-spacing:0.5px; display:inline-block;">TROY</span>
              <!-- 3D Secure Badge -->
              <span style="background:#EBF5FB; border:1px solid #AED6F1; color:#1B4F72; font-size:11px; font-weight:700; padding:4px 8px; border-radius:4px; display:inline-block;">3D Secure</span>
            </div>
          </div>
`;

// 1. Update index.html #page-odeme
let indexHtml = fs.readFileSync('index.html', 'utf8');
if (!indexHtml.includes('AKBANK / VISA / MASTERCARD / TROY')) {
  const targetIdx = indexHtml.indexOf('<!-- HUKUKİ ONAYLAR VE BİLGİLENDİRMELER');
  if (targetIdx !== -1) {
    indexHtml = indexHtml.slice(0, targetIdx) + cardLogosHtml + '\n' + indexHtml.slice(targetIdx);
    fs.writeFileSync('index.html', indexHtml, 'utf8');
    console.log('Added Card Scheme Logos to index.html #page-odeme.');
  }
}

// 2. Add to Footer of index.html
const footerLogosHtml = `
        <div style="display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap; margin-top:20px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:11px; color:#888; text-transform:uppercase; letter-spacing:1px;">Kabul Edilen Ödeme Yöntemleri:</span>
          <span style="background:#1434CB; color:#FFF; font-family:sans-serif; font-weight:800; font-style:italic; font-size:11px; padding:3px 8px; border-radius:3px;">VISA</span>
          <span style="background:#222; color:#FFF; font-family:sans-serif; font-weight:700; font-size:10.5px; padding:3px 6px; border-radius:3px; display:inline-flex; align-items:center; gap:2px;">
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#EB001B;"></span>
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#F79E1B; margin-left:-5px; opacity:0.9;"></span>
            <span style="margin-left:3px;">Mastercard</span>
          </span>
          <span style="background:#0A6FB7; color:#FFF; font-family:sans-serif; font-weight:800; font-size:10.5px; padding:3px 8px; border-radius:3px;">TROY</span>
          <span style="background:rgba(255,255,255,0.1); color:#DDD; font-size:10.5px; font-weight:600; padding:3px 8px; border-radius:3px;">3D Secure SMS</span>
          <span style="background:rgba(255,255,255,0.1); color:#DDD; font-size:10.5px; font-weight:600; padding:3px 8px; border-radius:3px;">256-Bit SSL</span>
        </div>
`;

if (!indexHtml.includes('Kabul Edilen Ödeme Yöntemleri:')) {
  const footerEndIdx = indexHtml.indexOf('</div>\n    <div class="footer-legal-bar"');
  if (footerEndIdx !== -1) {
    indexHtml = indexHtml.slice(0, footerEndIdx) + footerLogosHtml + indexHtml.slice(footerEndIdx);
    fs.writeFileSync('index.html', indexHtml, 'utf8');
    console.log('Added Card Scheme Logos to index.html Footer.');
  }
}
