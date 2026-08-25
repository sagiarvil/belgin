const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pages = [
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
];

const marker = 'data-belgin-defense-layer="v2"';
const standardLayer = `
<section ${marker} style="margin-top:34px;padding:18px 20px;background:#f8fbfa;border:1px solid #cfe2de;border-radius:10px;line-height:1.7;">
  <h2 style="margin-top:0;">Hukuki Delil ve Kayıt Katmanı</h2>
  <p>Bu hukuki metnin sürümü ve SHA-256 belge bütünlük özeti sistem manifestinde kaydedilir. Siparişe özgü zorunlu kabul kayıtları, sipariş ve ürün/fiyat snapshot'ı, ödeme sağlayıcısı sonucu ve uygulanıyorsa mağaza teslim-tesellüm kayıtları sunucu tarafındaki işlem kayıt zincirinde ilişkilendirilebilir. SHA-256 özeti tek başına nitelikli elektronik imza veya 5070 sayılı Kanun kapsamında yetkili elektronik sertifika hizmet sağlayıcısı tarafından üretilmiş zaman damgası olarak sunulmaz.</p>
  <p><a href="hukuki-delil-ve-kayit-politikasi.html">Hukuki Delil, Belge Sürümü ve İşlem Kayıt Politikası</a></p>
</section>`;

for (const file of pages) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) continue;
  let html = fs.readFileSync(full, 'utf8');

  if (!html.includes(marker) && file !== 'hukuki-delil-ve-kayit-politikasi.html') {
    if (html.includes('</main>')) html = html.replace('</main>', `${standardLayer}\n</main>`);
    else html = html.replace('</body>', `<main>${standardLayer}</main>\n</body>`);
  }

  if (!html.includes('js/legal-stamp.js')) {
    html = html.replace('</body>', '<script src="js/legal-stamp.js?v=2026.08.25.2600"></script>\n</body>');
  } else {
    html = html.replace(/js\/legal-stamp\.js\?v=[^"']+/g, 'js/legal-stamp.js?v=2026.08.25.2600');
  }

  const prohibited = ['generateSimulatedHash', 'SHA256-TS-', 'Elektronik Olarak İmzalandı & Onaylandı'];
  if (prohibited.some((term) => html.includes(term))) {
    throw new Error(`${file}: simüle elektronik imza/zaman damgası ifadesi bulundu.`);
  }

  fs.writeFileSync(full, html, 'utf8');
}

console.log('[legal-hardening] Public hukuk sayfaları v2 delil katmanıyla doğrulandı.');
