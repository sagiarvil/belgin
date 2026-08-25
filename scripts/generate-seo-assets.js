// ==========================================================
// BELGIN KUYUMCULUK — OTOMATİK DİNAMİK SİTEMAP & LLMS GENERATOR
// Tasarım Mandate & SEO Parametreleri Standartlarına Tam Uyumlu
// ==========================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://belginkuyumculuk.com';
const LAST_MOD = new Date().toISOString().split('T')[0];

// 1. STATİK VE KURUMSAL SAYFALAR
const STATIC_PAGES = [
  {
    url: '/',
    priority: '1.0',
    changefreq: 'daily',
    title: 'Belgin Kuyumculuk — Lüks Saat, İkinci El & Mücevherat (Est. 1999)',
    description: 'İzmir Buca Menderes Caddesinde 25 yıldır ekspertizli Rolex, Patek Philippe, Audemars Piguet saatler, 24K has altın ve elmas mücevherat.',
    type: 'home'
  },
  {
    url: '/iletisim.html',
    priority: '0.9',
    changefreq: 'weekly',
    title: 'Showroom & VIP Randevu İletişim | BELGIN Kuyumculuk',
    description: 'Menderes Cad. No:231/B Buca/İzmir mağazamıza ulaşım, çalışma saatleri (09:00 - 19:00, Pazar Kapalı) ve VIP WhatsApp randevu hattı.',
    type: 'contact'
  },
  {
    url: '/kvkk.html',
    priority: '0.6',
    changefreq: 'monthly',
    title: 'KVKK Aydınlatma Metni | BELGIN Kuyumculuk',
    description: '6698 Sayılı Kişisel Verilerin Korunması Kanunu uyarınca aydınlatma metni ve veri işleme politikamız.',
    type: 'legal'
  },
  {
    url: '/mesafeli-satis-sozlesmesi.html',
    priority: '0.6',
    changefreq: 'monthly',
    title: 'Mesafeli Satış Sözleşmesi | BELGIN Kuyumculuk',
    description: '6502 sayılı Tüketicinin Korunması Kanunu ve Mesafeli Sözleşmeler Yönetmeliği uyarınca yasal satış sözleşmesi.',
    type: 'legal'
  },
  {
    url: '/on-bilgilendirme-formu.html',
    priority: '0.6',
    changefreq: 'monthly',
    title: 'Ön Bilgilendirme Formu | BELGIN Kuyumculuk',
    description: 'Müşteri sipariş öncesi yasal ön bilgilendirme ve teslimat şartları.',
    type: 'legal'
  },
  {
    url: '/gizlilik-politikasi.html',
    priority: '0.6',
    changefreq: 'monthly',
    title: 'Gizlilik ve Güvenlik Politikası | BELGIN Kuyumculuk',
    description: '256-Bit SSL ve PCI-DSS Seviye 1 banka düzeyinde güvenlik protokolleri.',
    type: 'legal'
  },
  {
    url: '/iade-degisim.html',
    priority: '0.6',
    changefreq: 'monthly',
    title: 'İade ve Değişim Koşulları | BELGIN Kuyumculuk',
    description: '14 gün yasal iade, 12 nokta ekspertiz güvencesi ve iade prosedürü.',
    type: 'legal'
  },
  {
    url: '/guvenli-odeme-ve-3d-secure.html',
    priority: '0.6',
    changefreq: 'monthly',
    title: '3D Secure 2.0 & BDDK Güvenli Ödeme | BELGIN Kuyumculuk',
    description: 'Tüm banka kartlarına 12 taksit ve PayTR 3D Secure 2.0 ödeme sistemi detayları.',
    type: 'legal'
  }
];

// 2. ÜRÜNLERİ DATA.JS'DEN ÇEK
const { PRODUCTS: products } = require('../js/data.js');

// 3. SITEMAP.XML ÜRET (GOOGLE IMAGE SITEMAP EXTENSION DAHİL)
function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd http://www.google.com/schemas/sitemap-image/1.1 http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">\n\n`;

  // Statik Sayfalar
  STATIC_PAGES.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
    xml += `    <lastmod>${LAST_MOD}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n\n`;
  });

  // Kategori SPA Sayfaları
  const categoryPages = [
    { url: '/#saatler', priority: '0.9', changefreq: 'daily' },
    { url: '/#mucevherat', priority: '0.9', changefreq: 'daily' },
    { url: '/#ikinci-el', priority: '0.85', changefreq: 'daily' },
    { url: '/#hikayemiz', priority: '0.7', changefreq: 'weekly' }
  ];
  categoryPages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
    xml += `    <lastmod>${LAST_MOD}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n\n`;
  });

  // Ürün Sanal Sayfaları & Görselleri
  products.forEach(prod => {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}/#urun-${prod.id}</loc>\n`;
    xml += `    <lastmod>${LAST_MOD}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.85</priority>\n`;
    if (prod.image) {
      const imgLoc = prod.image.startsWith('http') ? prod.image : `${BASE_URL}/${prod.image}`;
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${imgLoc}</image:loc>\n`;
      xml += `      <image:title><![CDATA[${prod.brand} ${prod.name} - BELGIN Kuyumculuk]]></image:title>\n`;
      xml += `      <image:caption><![CDATA[${prod.desc || prod.name}]]></image:caption>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n\n`;
  });

  xml += `</urlset>\n`;

  fs.writeFileSync(path.join(__dirname, '..', 'sitemap.xml'), xml, 'utf8');
  console.log(`✅ sitemap.xml başarıyla üretildi (${STATIC_PAGES.length + categoryPages.length + products.length} URL).`);
}

// 4. LLMS.TXT ÜRET (CLOUDFLARE AI / OPENAI / ANTHROPIC STANDARDI)
function generateLlmsTxt() {
  let content = `# Belgin Kuyumculuk & Saat (EST. 1999)
> İzmir Buca'da 25 yıllık kurumsal mirasa sahip, resmi İzmir Kuyumcular Odası (İKO Sicil: 4892) kayıtlı Haute Horlogerie & Joaillerie evi.

## Kurumsal Bilgiler & Kimlik
- Ticari Unvan: Belgin Kuyumculuk Sanayi ve Ticaret Ltd. Şti.
- Merkez Mağaza: Menderes Caddesi No 231/B Buca / İzmir, Türkiye
- Telefon VIP WhatsApp: +90 541 930 53 72
- Showroom Santral: +90 539 823 41 41
- Çalışma Saatleri: Pazartesi - Cumartesi 09:00 - 19:00 (Pazar Günleri Kapalıdır)
- Oda Sicil Numarası: İzmir Kuyumcular Odası (İZKO) No: 4892
- MERSİS: 0123456789012345 | Vergi Dairesi: Şirinyer V.D. 1234567890
- Web Sitesi: https://belginkuyumculuk.com

## Canlı Borsa & Piyasa Kurları Entegrasyonu
Belgin Kuyumculuk, doğrudan İzmir Kuyumcular Odası (https://www.izko.org.tr/guncel-kur) resmi canlı veri beslemesi ve Kapalıçarşı tahtası ile senkronize çalışır:
- 24 Ayar Has Altın
- 22 Ayar Burma / Ajda Bilezik
- 18 Ayar Tasarım Mücevher Altını
- 14 Ayar ve 8 Ayar Takı Altını
- Yeni/Eski Çeyrek, Yarım, Ziynet Tam ve Ata Cumhuriyet Altınları

## Hizmet Alanları
1. Sıfır ve Sertifikalı İkinci El Lüks Saatler (Rolex, Patek Philippe, Audemars Piguet, Cartier, IWC, Vacheron Constantin)
2. GIA / HRD Sertifikalı Pırlanta & Elmas Mücevherat (Solitaire, Su Yolu, Baget, Safir, Zümrüt, Yakut)
3. 15 Dakikada Ekspertizli Nakit Altın & Lüks Saat Alımı / Takas Simülatörü
4. Loomis Zırhlı Kurye ile Tam Değer Sigortalı Tüm Türkiye Teslimatı
5. BDDK Lisanslı PayTR Altyapısıyla 256-Bit SSL ve 3D Secure 2.0 ile 12 Taksitli Ödeme

## Temel Sayfalar & Yasal Sözleşmeler
- [Ana Sayfa & Canlı Simülatör](https://belginkuyumculuk.com/)
- [Showroom & İletişim](https://belginkuyumculuk.com/iletisim.html)
- [KVKK Aydınlatma Metni](https://belginkuyumculuk.com/kvkk.html)
- [Mesafeli Satış Sözleşmesi](https://belginkuyumculuk.com/mesafeli-satis-sozlesmesi.html)
- [Ön Bilgilendirme Formu](https://belginkuyumculuk.com/on-bilgilendirme-formu.html)
- [Gizlilik Politikası](https://belginkuyumculuk.com/gizlilik-politikasi.html)
- [İade ve Değişim Koşulları](https://belginkuyumculuk.com/iade-degisim.html)
- [3D Secure & Güvenli Ödeme](https://belginkuyumculuk.com/guvenli-odeme-ve-3d-secure.html)

## Mevcut Koleksiyon Özeti (${products.length} Seçkin Model)
${products.map(p => `- ${p.brand} ${p.name} (${p.category}): ₺${p.price.toLocaleString('tr-TR')} [${p.conditionBadge || 'Sertifikalı'}] Ref: ${p.reference || 'N/A'}`).join('\n')}
`;

  fs.writeFileSync(path.join(__dirname, '..', 'llms.txt'), content, 'utf8');
  console.log('✅ llms.txt başarıyla üretildi.');
}

// 5. LLMS-FULL.TXT ÜRET (DERİN AI ANALİZLERİ VE VERİ TABANLARI İÇİN)
function generateLlmsFullTxt() {
  let content = `# Belgin Kuyumculuk & Saat — Tam Kapsamlı LLM Bilgi Tabanı
Version: 2026.8.0
Standard: Enterprise AI / LLM Context Protocol

## 1. Şirket ve Showroom Profili
Belgin Kuyumculuk Sanayi ve Ticaret Ltd. Şti., 1999 yılında İzmir'de kurulmuş olup 25 yıldır kesintisiz olarak Menderes Caddesi No:231/B Buca / İzmir adresinde faaliyet göstermektedir.
İzmir Kuyumcular Odası (İKO) 4892 sicil numaralı resmi üyesidir.
Her saat Witschi Timegrapher ile test edilir; mekanizma genliği (+/- sn/gün, 285° genlik) ve su geçirmezlik testi onaylanarak teslim edilir. Pırlantalar GIA/HRD standartlarında 4C (Cut, Color, Clarity, Carat) sertifikalıdır.

## 2. Ürün Kataloğu Detayları
${products.map(p => `
### ID ${p.id}: ${p.brand} - ${p.name}
- Kategori: ${p.category}
- Satış Fiyatı: ₺${p.price.toLocaleString('tr-TR')}
- Referans / Model: ${p.reference}
- Kondisyon: ${p.conditionBadge || 'Kusursuz'}
- Stok Durumu: ${p.statusBadge || 'Stokta'}
- Metal / Materyal: ${p.metal}
- Kadran / Detay: ${p.dial || 'Özel Üretim'}
- Kutu & Evrak: ${p.boxPapers || 'Orijinal Kutu & Belge'}
- Görsel URL: ${p.image}
- Açıklama: ${p.desc}
`).join('\n')}

## 3. Değerleme ve Alım Prosedürü
Müşteriler masif altın (24K, 22K, 18K, 14K, 8K) ve sarrafiye ürünlerini (Çeyrek, Yarım, Tam, Ata, Gremse) anlık İzmir Kuyumcular Odası borsa fiyatları üzerinden hesaplayıp 15 dakikada İzmir Buca Showroom'unda nakit veya FAST banka havalesiyle bozdurabilirler.

## 4. İletişim Kanalları
- VIP Danışman: +90 541 930 53 72 (WhatsApp)
- Mağaza Tel: +90 539 823 41 41
- E-Posta: info@belgin.com
- Lokasyon: Menderes Cad. No 231/B Buca / İzmir
`;

  fs.writeFileSync(path.join(__dirname, '..', 'llms-full.txt'), content, 'utf8');
  console.log('✅ llms-full.txt başarıyla üretildi.');
}

// 6. ROBOTS.TXT ÜRET (TÜM AI BOTLARA İZİNLİ VE SİTEMAP BAĞLANTILI)
function generateRobotsTxt() {
  const content = `# ==========================================================
# BELGIN KUYUMCULUK — ROBOTS.TXT (ENTERPRISE AI & SEO MANDATE)
# ==========================================================

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# Search Engine Crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Yandex
Allow: /

# Generative AI & LLM Crawlers (Cloudflare AI / OpenAI / Anthropic / Perplexity)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

# Sitemaps & Machine-Readable LLM Knowledge
Sitemap: ${BASE_URL}/sitemap.xml
# LLMs Context: ${BASE_URL}/llms.txt
# LLMs Full Context: ${BASE_URL}/llms-full.txt
`;

  fs.writeFileSync(path.join(__dirname, '..', 'robots.txt'), content, 'utf8');
  console.log('✅ robots.txt başarıyla üretildi.');
}

// ÇALIŞTIR
generateSitemap();
generateLlmsTxt();
generateLlmsFullTxt();
generateRobotsTxt();
console.log('🎉 Tüm SEO & LLMs varlıkları başarıyla güncellendi!');
