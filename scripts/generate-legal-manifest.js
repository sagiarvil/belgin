const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const version = '2026-08-25-v3';
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

const documentRecords = {};
for (const file of documents.sort()) {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  documentRecords[file] = {
    version,
    sha256: sha256(raw),
    bytes: Buffer.byteLength(raw, 'utf8')
  };
}

// Deterministic evidence root: generatedAt bu hesaba dahil edilmez.
// Böylece hukuki içerik değişmedikçe kök hash değişmez.
const canonicalEvidence = JSON.stringify({
  schema: 'belgin-legal-evidence-manifest-v3',
  version,
  algorithm: 'SHA-256',
  documents: documentRecords
});
const manifestRootSha256 = sha256(canonicalEvidence);

const manifest = {
  schema: 'belgin-legal-evidence-manifest-v3',
  version,
  generatedAt: new Date().toISOString(),
  algorithm: 'SHA-256',
  manifestRootSha256,
  externalTimestampModel: 'OpenTimestamps/Bitcoin auxiliary proof',
  legalNotice: 'SHA-256 ve OpenTimestamps kayitlari teknik butunluk/zaman ispati katmanidir; nitelikli elektronik imza veya 5070 sayili Kanun kapsaminda ESHS zaman damgasi degildir.',
  documents: documentRecords
};

const serialized = JSON.stringify(manifest, null, 2) + '\n';
fs.writeFileSync(path.join(root, 'legal-manifest.json'), serialized, 'utf8');
fs.writeFileSync(path.join(root, 'functions', 'legal-manifest.json'), serialized, 'utf8');
console.log(`[legal-manifest] ${documents.length} hukuk belgesi kaydedildi. root=${manifestRootSha256}`);
