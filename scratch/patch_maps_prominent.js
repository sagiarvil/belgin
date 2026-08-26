const fs = require('fs');

const prominentMapBox = `
          <!-- ULTRA-PROMINENT GOOGLE MAPS & YOL TARİFİ KUTUSU -->
          <div style="background:#FFFFFF; border:2px solid var(--color-teal); border-radius:14px; overflow:hidden; box-shadow:0 12px 36px rgba(8,76,71,0.08);">
            
            <!-- Header Bar of the Map Box -->
            <div style="background:var(--color-teal); color:#FFFFFF; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:22px;">📍</span>
                <div>
                  <strong style="font-size:15px; letter-spacing:0.5px; display:block;">İZMİR BUCA MERKEZ SHOWROOM</strong>
                  <span style="font-size:12px; color:rgba(255,255,255,0.85);">Menderes Caddesi No:231/B Buca / İzmir</span>
                </div>
              </div>
              <span style="background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.4); padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700;">🟢 Açık • 09:00 - 19:00</span>
            </div>

            <!-- Google Maps Iframe -->
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3126.8926941617467!2d27.1685324!3d38.3842187!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14bbd8b74c5d57b5%3A0x6b5c3e03d4a4d6f0!2sMenderes%20Cd.%20No%3A231%2C%20Buca%2F%C4%B0zmir!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str" 
              width="100%" 
              height="320" 
              style="border:0; display:block;" 
              allowfullscreen="" 
              loading="lazy" 
              referrerpolicy="no-referrer-when-downgrade"
              title="Belgin Kuyumculuk Doğrulanmış Google Harita Konumu">
            </iframe>
            
            <!-- Interactive Action Bar Under Map -->
            <div style="padding:18px 24px; background:#FAF8F5; border-top:1px solid #EAE5D9; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
              <div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="color:#C2A768; font-size:16px;">🏛️</span>
                  <strong style="font-size:14.5px; color:var(--color-ink);">Resmi Doğrulanmış Google Konumu</strong>
                </div>
                <span style="font-size:12.5px; color:#555; display:block; margin-top:3px;">Şirinyer Meydanı & Buca Çarşı Girişi (25 Yıllık Mağaza)</span>
              </div>
              
              <a href="https://share.google/e2vmC425agvKPAAHR" target="_blank" rel="noopener" style="background:#8C6D23; background:linear-gradient(135deg, #084C47 0%, #0D6B64 100%); color:#FFFFFF; padding:13px 24px; border-radius:8px; font-size:13.5px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(8,76,71,0.25); transition:transform 0.2s;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                <span>Google Haritalar'da Yol Tarifi Al →</span>
              </a>
            </div>
          </div>
`;

// 1. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
const oldMapRegex = /<!-- Google Maps Embed -->[\s\S]*?<\/iframe>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
if (oldMapRegex.test(indexHtml)) {
  indexHtml = indexHtml.replace(oldMapRegex, prominentMapBox);
  fs.writeFileSync('index.html', indexHtml, 'utf8');
  console.log('Updated prominent map box in index.html');
} else {
  console.error('Could not match map embed in index.html');
}

// 2. Update iletisim.html
let iletisimHtml = fs.readFileSync('iletisim.html', 'utf8');
if (oldMapRegex.test(iletisimHtml)) {
  iletisimHtml = iletisimHtml.replace(oldMapRegex, prominentMapBox);
  fs.writeFileSync('iletisim.html', iletisimHtml, 'utf8');
  console.log('Updated prominent map box in iletisim.html');
} else {
  console.error('Could not match map embed in iletisim.html');
}
