const fs = require('fs');

// 1. Clean js/data.js
console.log('Updating js/data.js...');
let dataCode = fs.readFileSync('js/data.js', 'utf8');
dataCode = dataCode.replace(/T\.C\. Darphane & Belgin Mühürlü/g, 'T.C. Darphane / Resmi Ayar Damgalı');
dataCode = dataCode.replace(/Darphane & Belgin Mühürlü/g, 'T.C. Darphane Tescilli');
dataCode = dataCode.replace(/Belgin Mühürlü/g, 'T.C. Darphane Tescilli');
dataCode = dataCode.replace(/Belgin Mühür/g, 'T.C. Darphane Damgası');
dataCode = dataCode.replace(/Belgin mühür/g, 'T.C. Darphane damgası');
fs.writeFileSync('js/data.js', dataCode, 'utf8');
console.log('js/data.js cleaned successfully');

// 2. Update css/style.css
console.log('Updating css/style.css...');
let styleCss = fs.readFileSync('css/style.css', 'utf8');
const oldQuickSpecsCssRegex = /\/\* Quick Features 5-Grid \*\/[\s\S]*?\.pdp-actions-row \{/;
const newQuickSpecsCss = `/* Quick Features 4-Grid (Perfect 2x2 symmetry, no overflow) */
.pdp-quick-specs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.pdp-spec-pill {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.pdp-spec-pill-icon {
  font-size: 22px;
  flex-shrink: 0;
}
.pdp-spec-pill-label {
  font-size: 10.5px;
  color: var(--color-muted);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 2px;
}
.pdp-spec-pill-val {
  font-size: 13px;
  color: var(--color-ink);
  font-weight: 700;
  display: block;
  line-height: 1.35;
  word-break: break-word;
  overflow: visible;
  white-space: normal;
}

/* Action Buttons */
.pdp-actions-row {`;

styleCss = styleCss.replace(oldQuickSpecsCssRegex, newQuickSpecsCss);
fs.writeFileSync('css/style.css', styleCss, 'utf8');
console.log('css/style.css updated successfully');

// 3. Update js/app.js
console.log('Updating js/app.js...');
let appCode = fs.readFileSync('js/app.js', 'utf8');

// Replace quickSpecsHtml in openProduct
const oldQuickSpecsJsRegex = /\/\/ 5'li Hızlı Özet Çipler[\s\S]*?const trustBoxHtml/;
const newQuickSpecsJs = `// 4'lü Dengeli Hızlı Özet Çipler (2x2 Grid - Taşmasız & Simetrik)
    const quickSpecsHtml = isGoldProduct ? \`
      <div class="pdp-quick-specs">
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🪙</span>
          <div>
            <span class="pdp-spec-pill-label">Maden & Saflık</span>
            <span class="pdp-spec-pill-val">\${p.metal || '24 Ayar (995/1000)'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">⚖️</span>
          <div>
            <span class="pdp-spec-pill-label">Kategori</span>
            <span class="pdp-spec-pill-val">\${p.subCategory || 'Külçe & Sarrafiye'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🏛️</span>
          <div>
            <span class="pdp-spec-pill-label">Baskı / Menşei</span>
            <span class="pdp-spec-pill-val">T.C. Darphane</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">📜</span>
          <div>
            <span class="pdp-spec-pill-label">Sertifika & Fatura</span>
            <span class="pdp-spec-pill-val">%100 Ayar Garantili</span>
          </div>
        </div>
      </div>
    \` : \`
      <div class="pdp-quick-specs">
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">⚙️</span>
          <div>
            <span class="pdp-spec-pill-label">Mekanizma</span>
            <span class="pdp-spec-pill-val">\${specs['Mekanizma'] || 'Quartz / Analog'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">📐</span>
          <div>
            <span class="pdp-spec-pill-label">Kasa Çapı</span>
            <span class="pdp-spec-pill-val">\${specs['Kasa Çapı'] || '42 mm'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🛡️</span>
          <div>
            <span class="pdp-spec-pill-label">Cam Tipi</span>
            <span class="pdp-spec-pill-val">\${specs['Cam Tipi'] || 'Safir / Mineral'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">💧</span>
          <div>
            <span class="pdp-spec-pill-label">Su Geçirmezlik</span>
            <span class="pdp-spec-pill-val">\${specs['Su Geçirmezlik'] || '5 ATM (50 M)'}</span>
          </div>
        </div>
      </div>
    \`;

    // 4'lü Kurumsal Güvence Kutusu (Altın vs Saat)
    const trustBoxHtml`;

appCode = appCode.replace(oldQuickSpecsJsRegex, newQuickSpecsJs);

// Remove any remaining Belgin Mühür references from app.js
appCode = appCode.replace(/Belgin Mühürlü/g, 'T.C. Darphane Tescilli');
appCode = appCode.replace(/Belgin Mühür/g, 'T.C. Darphane Damgalı');
appCode = appCode.replace(/belgin mühür/gi, 'T.C. Darphane damgalı');
appCode = appCode.replace(/tescilli ve mühürlü\./g, 'tescilli ve sertifikalı.');
appCode = appCode.replace(/faturalı ve mühürlü olarak/g, 'faturalı ve sertifikalı olarak');
appCode = appCode.replace(/T\.C\. Darphane \/ Rafineri Resmi Orijinallik Mührü/g, 'T.C. Darphane / Rafineri Resmi Damgası');
appCode = appCode.replace(/Sıfır \/ Darphane & Mühürlü/g, 'Sıfır / T.C. Darphane Tescilli');

fs.writeFileSync('js/app.js', appCode, 'utf8');
console.log('js/app.js updated successfully');
