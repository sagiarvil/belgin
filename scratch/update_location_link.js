const fs = require('fs');

const oldMapLink1 = 'https://maps.google.com/?cid=3574131035126264051';
const oldMapLink2 = 'https://maps.google.com/?cid=3574131035126264051';
const newMapLink = 'https://maps.google.com/?cid=3574131035126264051';

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
