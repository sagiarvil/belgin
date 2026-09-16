const fs = require('fs');
const path = require('path');

const keepElite = ['Rolex', 'TAG Heuer', 'Cartier', 'Rado', 'Tissot'];

function processDataFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Evaluate PRODUCTS and ELITE_WATCH_BRANDS
    let exportsContext = {};
    eval(content.replace(/module\.exports\s*=\s*{[^}]*};?/g, '') + ' exportsContext.PRODUCTS = PRODUCTS; exportsContext.ELITE_WATCH_BRANDS = ELITE_WATCH_BRANDS;');
    
    let { PRODUCTS, ELITE_WATCH_BRANDS } = exportsContext;
    
    // Update ELITE_WATCH_BRANDS
    ELITE_WATCH_BRANDS = keepElite;
    
    // Update PRODUCTS
    for (let p of PRODUCTS) {
        if (keepElite.includes(p.brand)) {
            p.category = 'elit-saatler';
            p.isElite = true;
            p.subCategory = `${p.brand} Koleksiyonu`;
        } else if (p.category === 'elit-saatler' || p.isElite) {
            p.category = 'saat';
            delete p.isElite;
        }
    }
    
    let newContent = `const ELITE_WATCH_BRANDS = ${JSON.stringify(ELITE_WATCH_BRANDS, null, 2)};\n\n`;
    newContent += `const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2)};\n\n`;
    newContent += `if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS, ELITE_WATCH_BRANDS };
} else {
  window.PRODUCTS = PRODUCTS;
  window.ELITE_WATCH_BRANDS = ELITE_WATCH_BRANDS;
}\n`;
    fs.writeFileSync(filePath, newContent, 'utf8');
}

processDataFile(path.join(__dirname, '../js/data.js'));
processDataFile(path.join(__dirname, '../js/data-light.js'));
