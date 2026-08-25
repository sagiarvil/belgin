const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const textFiles = fs.readdirSync(root).filter((f) => /\.(html|txt|xml)$/i.test(f));
const replacements = [
  [/Belgin Kuyumculuk Sanayi ve Ticaret Ltd\. Şti\./g, 'BELGİN KUYUMCULUK - SEMİH SONBAHAR'],
  [/Belgin Kuyumculuk Ltd\. Şti\./g, 'BELGİN KUYUMCULUK - SEMİH SONBAHAR'],
  [/MERSİS:\s*0123456789012345\s*\|?\s*/g, ''],
  [/Şirinyer V\.D\.\s*1234567890/g, 'Vergi bilgisi doğrulanmış resmi kayıtta gösterilir'],
  [/İKO\s*(?:Sicil|Sicil Numarası)?\s*[:#]?\s*4892/gi, 'Oda/yetki bilgisi doğrulanmış resmi kayıtta gösterilir'],
  [/Belgin Kuyumculuk Ekspertiz Kurulu/g, 'Belgin Kuyumculuk'],
  [/BDDK Lisanslı PayTR/gi, 'PayTR'],
  [/PCI-DSS Seviye 1 banka düzeyinde/gi, 'ödeme sağlayıcısı güvenlik'],
  [/Loomis Zırhlı Kurye ile Tam Değer Sigortalı Tüm Türkiye Teslimatı/gi, 'Teslim yöntemi ürün ve sipariş koşullarına göre ödeme öncesinde gösterilir'],
  [/Tüm banka kartlarına 12 taksit/gi, 'Kart ve banka koşullarına göre sunulabilen taksit seçenekleri']
];

for (const file of textFiles) {
  const full = path.join(root, file);
  let content = fs.readFileSync(full, 'utf8');
  const before = content;
  for (const [pattern, replacement] of replacements) content = content.replace(pattern, replacement);
  if (content !== before) fs.writeFileSync(full, content, 'utf8');
}

console.log('[public-claims] Doğrulanmamış sicil/uyum/teslim iddiaları build öncesi temizlendi.');
