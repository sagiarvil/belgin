const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');

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
  'guvenli-odeme-ve-3d-secure.html': { code: '15', version: '15_v2.1 (25.08.2026)', title: 'Güvenli Ödeme ve 3D Secure 2.0' },
  'hukuki-delil-ve-kayit-politikasi.html': { code: '16', version: '16_v2.1 (25.08.2026)', title: 'Hukuki Delil ve Kayıt Politikası' }
};

const documents = Object.keys(DOCUMENT_META).filter((file) => fs.existsSync(path.join(root, file)));

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

const manifest = {
  schema: 'belgin-legal-evidence-manifest-v2',
  version: '2026-08-25-v2.1',
  generatedAt: new Date().toISOString(),
  algorithm: 'SHA-256',
  legalNotice: 'Bu hash değeri belge bütünlük kontrolüdür; 6502 ve 6698 sayılı kanunlar uyarınca kalıcı veri saklayıcısı niteliğindedir.',
  documents: {}
};

for (const file of documents) {
  const raw = fs.readFileSync(path.join(root, file), 'utf8');
  const meta = DOCUMENT_META[file] || { code: '00', version: '2026-08-25-v2.1', title: file };
  manifest.documents[file] = {
    code: meta.code,
    version: meta.version,
    title: meta.title,
    sha256: sha256(raw),
    bytes: Buffer.byteLength(raw, 'utf8')
  };
}

const serialized = JSON.stringify(manifest, null, 2) + '\n';
fs.writeFileSync(path.join(root, 'legal-manifest.json'), serialized, 'utf8');
fs.writeFileSync(path.join(root, 'functions', 'legal-manifest.json'), serialized, 'utf8');
console.log(`[legal-manifest] ${documents.length} hukuk belgesi SHA-256 ve resmi sürüm numaralarıyla kaydedildi.`);
