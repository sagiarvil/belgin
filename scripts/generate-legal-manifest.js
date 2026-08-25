const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const MANIFEST_SCHEMA = 'belgin-legal-evidence-manifest-v3';
const MANIFEST_VERSION = '2026-08-25-v3.1';

const DOCUMENT_META = {
  'mesafeli-satis-sozlesmesi.html': { code: '01', version: '01_v2.1 (25.08.2026)', title: 'Mesafeli Satış Sözleşmesi' },
  'on-bilgilendirme-formu.html': { code: '02', version: '02_v2.1 (25.08.2026)', title: 'Ön Bilgilendirme Formu' },
  'yuksek-degerli-urun-teslimi.html': { code: '03', version: '03_v2.1 (25.08.2026)', title: 'Yüksek Değerli Ürün Mağazadan Teslim ve Uyum Politikası' },
  'kullanim-kosullari.html': { code: '04', version: '04_v2.1 (25.08.2026)', title: 'Kullanım Koşulları' },
  'kvkk.html': { code: '05', version: '05_v2.1 (25.08.2026)', title: 'KVKK Aydınlatma Metni' },
  'kvkk-aydinlatma-metni.html': { code: '05', version: '05_v2.1 (25.08.2026)', title: 'KVKK Aydınlatma Metni' },
  'kvkk-basvuru.html': { code: '06', version: '06_v2.1 (25.08.2026)', title: 'KVKK Başvuru Formu' },
  'gizlilik-politikasi.html': { code: '07', version: '07_v2.1 (25.08.2026)', title: 'Gizlilik Politikası' },
  'cerez-politikasi.html': { code: '08', version: '08_v2.1 (25.08.2026)', title: 'Çerez Politikası' },
  'ticari-elektronik-ileti-onayi.html': { code: '09', version: '09_v2.1 (25.08.2026)', title: 'Ticari Elektronik İleti Onay Metni' },
  'ticari-elektronik-ileti.html': { code: '09', version: '09_v2.1 (25.08.2026)', title: 'Ticari Elektronik İleti Politikası' },
  'kvkk-acik-riza.html': { code: '10', version: '10_v2.1 (25.08.2026)', title: 'KVKK Açık Rıza Metni' },
  'garanti-ve-satis-sonrasi.html': { code: '11', version: '11_v2.1 (25.08.2026)', title: 'Garanti ve Satış Sonrası Hizmetler' },
  'musteri-tanima-ve-islem-guvenligi.html': { code: '12', version: '12_v2.1 (25.08.2026)', title: 'Müşteri Tanıma ve İşlem Güvenliği Politikası' },
  'magaza-teslim-tesellum-formu.html': { code: '13', version: '13_v2.1 (25.08.2026)', title: 'Mağaza Teslim-Tesellüm ve Ürün Kimliklendirme Formu' },
  'iade-degisim-cayma.html': { code: '14', version: '14_v2.1 (25.08.2026)', title: 'İade, Değişim ve Cayma Hakkı Rehberi' },
  'iade-degisim.html': { code: '14', version: '14_v2.1 (25.08.2026)', title: 'İade ve Değişim Koşulları' },
  'guvenli-odeme-ve-3d-secure.html': { code: '15', version: '15_v2.1 (25.08.2026)', title: 'Güvenli Ödeme ve 3D Secure' },
  'hukuki-delil-ve-kayit-politikasi.html': { code: '16', version: '16_v2.1 (25.08.2026)', title: 'Hukuki Delil ve Kayıt Politikası' }
};

const documents = Object.keys(DOCUMENT_META)
  .filter((file) => fs.existsSync(path.join(root, file)))
  .sort();

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

const documentRecords = {};
for (const file of documents) {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  const meta = DOCUMENT_META[file];
  documentRecords[file] = {
    code: meta.code,
    version: meta.version,
    title: meta.title,
    sha256: sha256(raw),
    bytes: Buffer.byteLength(raw, 'utf8')
  };
}

// generatedAt hariç deterministik kök: içerik/sürüm değişmedikçe aynı kalır.
const canonicalEvidence = JSON.stringify({
  schema: MANIFEST_SCHEMA,
  version: MANIFEST_VERSION,
  algorithm: 'SHA-256',
  documents: documentRecords
});
const manifestRootSha256 = sha256(canonicalEvidence);

const manifest = {
  schema: MANIFEST_SCHEMA,
  version: MANIFEST_VERSION,
  generatedAt: new Date().toISOString(),
  algorithm: 'SHA-256',
  manifestRootSha256,
  externalTimestampModel: 'OpenTimestamps/Bitcoin auxiliary proof',
  legalNotice: 'SHA-256 ve OpenTimestamps kayıtları teknik belge bütünlüğü ve zaman ispatı katmanıdır; tek başına 5070 sayılı Kanun kapsamında nitelikli elektronik imza veya ESHS zaman damgası olarak sunulmaz.',
  documents: documentRecords
};

const serialized = JSON.stringify(manifest, null, 2) + '\n';
fs.writeFileSync(path.join(root, 'legal-manifest.json'), serialized, 'utf8');
fs.writeFileSync(path.join(root, 'functions', 'legal-manifest.json'), serialized, 'utf8');
console.log(`[legal-manifest] ${documents.length} hukuk belgesi; resmi kod/sürüm + SHA-256; root=${manifestRootSha256}`);
