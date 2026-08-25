const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const version = '2026-08-25-v2';
const documents = [
  'mesafeli-satis-sozlesmesi.html',
  'on-bilgilendirme-formu.html',
  'yuksek-degerli-urun-teslimi.html',
  'musteri-tanima-ve-islem-guvenligi.html',
  'kvkk.html',
  'kvkk-aydinlatma-metni.html',
  'kvkk-basvuru.html',
  'gizlilik-politikasi.html',
  'cerez-politikasi.html',
  'kullanim-kosullari.html',
  'ticari-elektronik-ileti-onayi.html',
  'kvkk-acik-riza.html',
  'garanti-ve-satis-sonrasi.html',
  'guvenli-odeme-ve-3d-secure.html',
  'iade-degisim-cayma.html',
  'iade-degisim.html',
  'hukuki-delil-ve-kayit-politikasi.html'
].filter((file) => fs.existsSync(path.join(root, file)));

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

const manifest = {
  schema: 'belgin-legal-evidence-manifest-v2',
  version,
  generatedAt: new Date().toISOString(),
  algorithm: 'SHA-256',
  legalNotice: 'Bu hash degeri belge butunluk kontroludur; nitelikli elektronik imza veya 5070 sayili Kanun kapsaminda ESHS zaman damgasi degildir.',
  documents: {}
};

for (const file of documents) {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  manifest.documents[file] = {
    version,
    sha256: sha256(raw),
    bytes: Buffer.byteLength(raw, 'utf8')
  };
}

const serialized = JSON.stringify(manifest, null, 2) + '\n';
fs.writeFileSync(path.join(root, 'legal-manifest.json'), serialized, 'utf8');
fs.writeFileSync(path.join(root, 'functions', 'legal-manifest.json'), serialized, 'utf8');
console.log(`[legal-manifest] ${documents.length} hukuk belgesi SHA-256 ile kaydedildi.`);
