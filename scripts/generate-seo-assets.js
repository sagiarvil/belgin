// BELGIN KUYUMCULUK — deterministic sitemap / robots / LLM assets
// Public machine-readable content must not invent registry numbers, certifications or delivery claims.
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://belginkuyumculuk.com';
const LAST_MOD = new Date().toISOString().split('T')[0];
const { PRODUCTS: products } = require('../js/data.js');

const STATIC_PAGES = [
  ['/', '1.0', 'daily', 'Belgin Kuyumculuk & Saat', 'İzmir Buca’da saat ve kuyum ürünleri, mağaza hizmetleri ve güvenli sipariş süreçleri.', 'home'],
  ['/iletisim.html', '0.9', 'weekly', 'İletişim ve Showroom | Belgin Kuyumculuk', 'Menderes Caddesi No:231/B Buca / İzmir mağaza ve iletişim bilgileri.', 'contact'],
  ['/mesafeli-satis-sozlesmesi.html', '0.6', 'monthly', 'Mesafeli Satış Sözleşmesi | Belgin Kuyumculuk', 'Mesafeli satış, ödeme, teslim, KYC ve tüketici haklarına ilişkin sözleşme.', 'legal'],
  ['/on-bilgilendirme-formu.html', '0.6', 'monthly', 'Ön Bilgilendirme Formu | Belgin Kuyumculuk', 'Sipariş öncesi ürün, fiyat, teslim, ödeme ve cayma bilgilendirmesi.', 'legal'],
  ['/musteri-tanima-ve-islem-guvenligi.html', '0.6', 'monthly', 'Müşteri Tanıma ve İşlem Güvenliği | Belgin Kuyumculuk', '12.000 TL iç güvenlik standardı, MASAK uyumu ve işlem doğrulama yaklaşımı.', 'legal'],
  ['/yuksek-degerli-urun-teslimi.html', '0.6', 'monthly', 'Yüksek Değerli Ürün Teslimi | Belgin Kuyumculuk', '12.000 TL ve üzerindeki altın ve saat ürünlerinde mağazadan teslim ve kimlik doğrulama esasları.', 'legal'],
  ['/hukuki-delil-ve-kayit-politikasi.html', '0.6', 'monthly', 'Hukuki Delil ve Kayıt Politikası | Belgin Kuyumculuk', 'Belge sürümü, SHA-256 bütünlük özeti, sipariş audit ve teslim delil zinciri.', 'legal'],
  ['/kvkk.html', '0.6', 'monthly', 'KVKK Aydınlatma Metni | Belgin Kuyumculuk', 'Kişisel verilerin işlenmesi, aktarılması, saklanması ve ilgili kişi hakları.', 'legal'],
  ['/kvkk-basvuru.html', '0.5', 'monthly', 'KVKK Başvuru ve Talep Yönetimi | Belgin Kuyumculuk', 'KVKK başvuru ve kimlik doğrulama süreci.', 'legal'],
  ['/gizlilik-politikasi.html', '0.5', 'monthly', 'Gizlilik ve Veri Güvenliği | Belgin Kuyumculuk', 'Kişisel veri, işlem ve web güvenliği yaklaşımı.', 'legal'],
  ['/cerez-politikasi.html', '0.5', 'monthly', 'Çerez Politikası | Belgin Kuyumculuk', 'Zorunlu ve izin gerektiren çerezlere ilişkin politika.', 'legal'],
  ['/kullanim-kosullari.html', '0.5', 'monthly', 'Web Sitesi Kullanım Koşulları | Belgin Kuyumculuk', 'Web sitesi kullanım, içerik ve sorumluluk koşulları.', 'legal'],
  ['/ticari-elektronik-ileti-onayi.html', '0.5', 'monthly', 'Ticari Elektronik İleti Onayı | Belgin Kuyumculuk', 'Pazarlama iletilerine ilişkin isteğe bağlı onay ve ret süreçleri.', 'legal'],
  ['/kvkk-acik-riza.html', '0.5', 'monthly', 'KVKK Açık Rıza Metni | Belgin Kuyumculuk', 'Yalnız gerekli faaliyetlerde kullanılan açık rıza yaklaşımı.', 'legal'],
  ['/garanti-ve-satis-sonrasi.html', '0.5', 'monthly', 'Garanti ve Satış Sonrası | Belgin Kuyumculuk', 'Ürün bazlı garanti, servis ve ayıplı mal haklarına ilişkin politika.', 'legal'],
  ['/iade-degisim-cayma.html', '0.6', 'monthly', 'Cayma, İade ve Değişim | Belgin Kuyumculuk', 'Cayma hakkı, ürün bazlı kanuni istisnalar, ayıplı mal ve iade kontrolleri.', 'legal'],
  ['/guvenli-odeme-ve-3d-secure.html', '0.6', 'monthly', 'Güvenli Ödeme | Belgin Kuyumculuk', 'Ödeme sağlayıcısı doğrulaması, 3D Secure ve ödeme güvenliği kuralları.', 'legal']
].map(([url, priority, changefreq, title, description, type]) => ({ url, priority, changefreq, title, description, type }));

function escXml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function generateSitemap() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
  for (const page of STATIC_PAGES) {
    xml += `  <url><loc>${BASE_URL}${page.url}</loc><lastmod>${LAST_MOD}</lastmod><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>\n`;
  }
  for (const prod of products) {
    xml += `  <url><loc>${BASE_URL}/#urun-${escXml(prod.id)}</loc><lastmod>${LAST_MOD}</lastmod><changefreq>daily</changefreq><priority>0.80</priority>`;
    if (prod.image) {
      const img = String(prod.image).startsWith('http') ? prod.image : `${BASE_URL}/${prod.image}`;
      xml += `<image:image><image:loc>${escXml(img)}</image:loc><image:title>${escXml(`${prod.brand} ${prod.name}`)}</image:title></image:image>`;
    }
    xml += '</url>\n';
  }
  xml += '</urlset>\n';
  fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml, 'utf8');
  console.log(`[seo] sitemap.xml: ${STATIC_PAGES.length + products.length} URL.`);
}

function generateLlmsTxt() {
  const productSummary = products.map((p) => `- ${p.brand} ${p.name} | ${p.category} | ₺${Number(p.price).toLocaleString('tr-TR')} | Ref: ${p.reference || 'N/A'}`).join('\n');
  const content = `# Belgin Kuyumculuk & Saat\n\n` +
`## İşletme\n- İşletme adı: BELGİN KUYUMCULUK - SEMİH SONBAHAR\n- Mağaza: Menderes Caddesi No:231/B Buca / İzmir\n- Telefon: +90 541 930 53 72\n- Telefon: +90 539 823 41 41\n- Web: ${BASE_URL}\n\n` +
`Not: MERSİS, vergi, oda sicili, yetki belgesi, sertifika veya akreditasyon numarası yalnız doğrulanmış resmi bilgi mevcutsa yayımlanır. Bu dosya doğrulanmamış numara veya kurum üyeliği iddiası üretmez.\n\n` +
`## İşlem Güvenliği\n- 12.000 TL ve üzerindeki altın ve saat ürünleri Belgin Kuyumculuk iç güvenlik standardı kapsamında mağazadan kimlik doğrulaması ve imzalı teslim-tesellüm ile teslim edilir.\n- 12.000 TL MASAK kanuni parasal eşiği değildir. MASAK yükümlülükleri kendi kanuni şartlarında ayrıca uygulanır.\n- Şüpheli işlem değerlendirmesi tutardan bağımsız olabilir.\n- Ödeme, ödeme sağlayıcısı sisteminde kesinleşmeden teslim tamamlanmaz.\n- Hukuki belge sürümleri ve SHA-256 bütünlük özetleri sipariş delil zincirine bağlanabilir.\n\n` +
`## Yasal Sayfalar\n${STATIC_PAGES.filter(p=>p.type==='legal').map(p=>`- [${p.title}](${BASE_URL}${p.url})`).join('\n')}\n\n` +
`## Katalog (${products.length} ürün)\n${productSummary}\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'llms.txt'), content, 'utf8');
  console.log('[seo] llms.txt üretildi.');
}

function generateLlmsFullTxt() {
  const details = products.map((p) => `### ${p.brand} ${p.name}\n- ID: ${p.id}\n- Kategori: ${p.category}\n- Fiyat: ₺${Number(p.price).toLocaleString('tr-TR')}\n- Referans: ${p.reference || 'N/A'}\n- Metal/Materyal: ${p.metal || 'Belirtilmemiş'}\n- Stok: ${p.inStock === false ? 'Stokta değil' : 'Stok bilgisi ürün kaydına göre'}\n`).join('\n');
  const content = `# Belgin Kuyumculuk — LLM Bilgi Tabanı\nVersion: 2026-08-25-v2\n\n## İşletme Profili\nBELGİN KUYUMCULUK - SEMİH SONBAHAR, Menderes Caddesi No:231/B Buca / İzmir adresinde faaliyet gösteren kuyumculuk/saat işletmesidir. Kamuya açık makine-okunur dosyalarda doğrulanmamış sicil, sertifika, üyelik, eksperlik veya teslimat iddiası yayımlanmaz.\n\n## Hukuki Güvenlik Çerçevesi\n12.000 TL ve üzerindeki altın ve saat işlemlerinde işletmenin daha sıkı iç KYC ve mağazadan teslim standardı uygulanır. Bu tutar MASAK kanuni parasal eşiği değildir. MASAK, KVKK ve tüketici mevzuatı yükümlülükleri kendi koşullarında ayrıca uygulanır.\n\n## Ürünler\n${details}\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'llms-full.txt'), content, 'utf8');
  console.log('[seo] llms-full.txt üretildi.');
}

function generateRobotsTxt() {
  const content = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: ${BASE_URL}/sitemap.xml\n# LLM context: ${BASE_URL}/llms.txt\n# Full LLM context: ${BASE_URL}/llms-full.txt\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'robots.txt'), content, 'utf8');
  console.log('[seo] robots.txt üretildi.');
}

generateSitemap();
generateLlmsTxt();
generateLlmsFullTxt();
generateRobotsTxt();
console.log('[seo] Tüm SEO/LLM varlıkları güncellendi.');
