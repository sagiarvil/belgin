const fs = require('fs');

const oldMapLink1 = 'https://maps.google.com/?q=Menderes+Caddesi+No+231/B+Buca+Izmir';
const oldMapLink2 = 'https://maps.google.com/?cid=belginkuyumculuk';
const newMapLink = 'https://share.google/e2vmC425agvKPAAHR';

const filesToUpdate = [
  'index.html',
  'iletisim.html',
  'scripts/seo-registry.js',
  'guvenli-odeme-ve-3d-secure.html',
  'hukuki-delil-ve-kayit-politikasi.html',
  'iade-degisim-cayma.html',
  'kvkk.html',
  'mesafeli-satis-sozlesmesi.html',
  'musteri-tanima-ve-islem-guvenligi.html',
  'on-bilgilendirme-formu.html',
  'yuksek-degerli-urun-teslimi.html'
];

for (const file of filesToUpdate) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let updated = content;
    updated = updated.split(oldMapLink1).join(newMapLink);
    updated = updated.split(oldMapLink2).join(newMapLink);
    if (content !== updated) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`Updated location link in ${file}`);
    }
  }
}
