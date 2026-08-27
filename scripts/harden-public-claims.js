'use strict';

const fs = require('fs');
const path = require('path');
const CLAIMS = require('./seo-claims-registry.js');

const root = path.join(__dirname, '..');

function normalizeHeritageClaims(html) {
  return html
    .replace(/\b25\s*yıllık\b/gi, "1999'dan beri süren")
    .replace(/\b25\s*yıldır\b/gi, "1999'dan beri")
    .replace(/>25\s*Yıl</gi, ">1999'dan beri<")
    .replace(/25\s*Yıllık\s+Güven/gi, "1999'dan Beri Güven")
    .replace(/25\+\s*Yıllık\s*Miras/gi, "1999'dan Beri Miras")
    .replace(/25\s*yıllık\s*zanaat/gi, "1999'dan beri süren zanaat")
    .replace(/EST\.\s*1987/gi, "EST. 1999")
    .replace(/Nişantaşı/gi, "İzmir Buca");
}

function hardenEvidenceClaims(html) {
  const rules = [
    {
      enabled: CLAIMS.certifiedDeliveries14000,
      pattern: /14\.?000\+\s*Sertifikalı Teslimat/gi,
      replacement: 'Uzman kontrollü ürün teslimatı'
    },
    {
      enabled: CLAIMS.giaHrdCoverage,
      pattern: /GIA,\s*HRD[^<.]*/gi,
      replacement: 'Ürüne ait mevcut sertifika ve ekspertiz bilgileri'
    },
    {
      enabled: CLAIMS.twelvePointExpertiseAllProducts,
      pattern: /12\s*Nokta Ekspertiz[^<.]*/gi,
      replacement: 'Ürüne göre ekspertiz ve kontrol bilgileri'
    },
    {
      enabled: CLAIMS.distributorWarrantyTwoYearsAllWatches,
      pattern: /2\s*Yıl Distribütör Garantisi/gi,
      replacement: 'Garanti kapsamı ürün belgesine göre'
    },
    {
      enabled: CLAIMS.bestPriceGuarantee,
      pattern: /en iyi fiyat garantisi/gi,
      replacement: 'güncel fiyatlandırma'
    },
    {
      enabled: CLAIMS.cashBuybackGuarantee,
      pattern: /geri alım güvencesi/gi,
      replacement: 'alım ve değerleme hizmeti'
    },
    {
      enabled: CLAIMS.support247,
      pattern: /7\/24\s*Kesintisiz/gi,
      replacement: 'WhatsApp danışma'
    }
  ];

  for (const rule of rules) {
    if (!rule.enabled) {
      html = html.replace(rule.pattern, rule.replacement);
    }
  }

  return html;
}

const textFiles = fs.readdirSync(root).filter((f) => /\.(html|txt|xml|js|json)$/i.test(f) && !f.includes('package-lock'));

const baseReplacements = [
  [/Belgin Kuyumculuk Sanayi ve Ticaret Ltd\. Şti\./g, 'BELGİN KUYUMCULUK - SEMİH SONBAHAR'],
  [/Belgin Kuyumculuk Ltd\. Şti\./g, 'BELGİN KUYUMCULUK - SEMİH SONBAHAR'],
  [/MERSİS:\s*0123456789012345\s*\|?\s*/g, ''],
  [/Şirinyer V\.D\.\s*1234567890/g, 'Vergi bilgisi doğrulanmış resmi kayıtta gösterilir'],
  [/Belgin Kuyumculuk Ekspertiz Kurulu/g, 'Belgin Kuyumculuk'],
  [/BDDK Lisanslı PayTR/gi, 'Akbank Sanal POS & 3D Secure'],
  [/PCI-DSS Seviye 1 banka düzeyinde/gi, '256-bit EV SSL & 3D Secure'],
  [/Loomis Zırhlı Kurye ile Tam Değer Sigortalı Tüm Türkiye Teslimatı/gi, 'Teslim yöntemi ürün ve sipariş koşullarına göre ödeme öncesinde gösterilir'],
  [/Tüm banka kartlarına 12 taksit/gi, '3D Secure 2.0 Güvenli Tek Çekim'],
  [/Kredi Kartı \/ 3D Secure \(mevzuata uygun taksit\)/gi, 'Kredi / Banka Kartı — 3D Secure Tek Çekim'],
  [/İkinci El Altın & Saat/gi, 'Seçkin Koleksiyon'],
  [/İkinci El Saat & Mücevherat Koleksiyonu/gi, 'Seçkin Saat & Mücevherat Koleksiyonu'],
  [/İkinci El Saatler/gi, 'Seçkin Saatler'],
  [/İkinci El Mücevherler/gi, 'Seçkin Mücevherler'],
  [/İkinci El/gi, 'Seçkin Ürünler']
];

for (const file of textFiles) {
  const full = path.join(root, file);
  if (!fs.statSync(full).isFile()) continue;
  let content = fs.readFileSync(full, 'utf8');
  const before = content;
  
  for (const [pattern, replacement] of baseReplacements) {
    content = content.replace(pattern, replacement);
  }
  
  content = normalizeHeritageClaims(content);
  content = hardenEvidenceClaims(content);

  if (content !== before) {
    fs.writeFileSync(full, content, 'utf8');
  }
}

console.log('[public-claims] Doğrulanmamış iddialar ve miras metinleri 1999 standardına göre sertleştirildi.');

module.exports = { normalizeHeritageClaims, hardenEvidenceClaims };
