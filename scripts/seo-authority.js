'use strict';

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function norm(v) {
  return String(v || '').toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function topBrands(list, limit) {
  const counts = new Map();
  for (const p of list || []) {
    const b = String(p.brand || '').trim();
    if (b) counts.set(b, (counts.get(b) || 0) + 1);
  }
  return [...counts.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0], 'tr')).slice(0, limit || 8);
}

function countPattern(list, re) {
  return (list || []).filter(p => re.test(norm([p.brand,p.name,p.description,p.desc,p.category,p.metal].filter(Boolean).join(' ')))).length;
}

function relatedArticles(articles, terms, limit, excludeId) {
  const nt = (terms || []).map(norm).filter(Boolean);
  return (articles || []).filter(a => !excludeId || a.id !== excludeId).map(a => {
    const hay = norm([a.title,a.summary,a.category].filter(Boolean).join(' '));
    const score = nt.reduce((s,t) => s + (hay.includes(t) ? 1 : 0), 0);
    return { a, score };
  }).filter(x => x.score > 0).sort((x,y) => y.score-x.score || String(y.a.raw_date||'').localeCompare(String(x.a.raw_date||''))).slice(0, limit || 4).map(x => x.a);
}

function articleCards(items) {
  if (!items || !items.length) return '';
  return '<div class="authority-editorial-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:16px;">' + items.map(a =>
    '<a href="/magazin/' + esc(a.slug) + '/" style="display:block;padding:14px 16px;border:1px solid rgba(5,51,47,.14);border-radius:10px;text-decoration:none;color:inherit;background:#fff;">' +
    '<span style="display:block;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;margin-bottom:6px;">' + esc(a.category || 'Magazin') + '</span>' +
    '<strong style="display:block;font-size:14px;line-height:1.45;color:#132522;">' + esc(a.title) + '</strong></a>'
  ).join('') + '</div>';
}

function navLinks(items, label) {
  return '<nav aria-label="' + esc(label) + '" style="display:flex;flex-wrap:wrap;gap:10px;margin:18px 0;">' + items.map(x =>
    '<a href="' + esc(x[0]) + '" style="display:inline-flex;padding:9px 12px;border-radius:8px;background:#05332f;color:#fff;text-decoration:none;font-size:12px;font-weight:700;">' + esc(x[1]) + '</a>'
  ).join('') + '</nav>';
}

function renderAuthorityCluster(key, list, allProducts, articles) {
  const cfgs = {
    saatler: {
      eyebrow:'Ticari Arama Merkezi',
      title:'İzmir Lüks Saat Seçimi: Marka, Referans, Fiyat ve Teknik Kontrol',
      text:'Bu bölüm ürün listesini; marka, referans ve fiyat karşılaştırmasını teknik kontrol, orijinallik rehberi ve İzmir Buca showroom incelemesiyle birleştirir. Kullanıcı ürün aramasından karar ve doğrulama içeriğine tek akışta geçebilir.',
      terms:['rolex','omega','patek','saat','mekanizma','koleksiyon'],
      links:[['/markalar/','Saat Markaları'],['/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/','Saat Ekspertiz Rehberi'],['/iletisim.html','İzmir Buca Showroom']],
      metrics:[['Yayınlanan saat modeli',String((list||[]).length)],['Marka kapsaması',String(new Set((list||[]).map(p=>p.brand).filter(Boolean)).size)],['Fiziksel inceleme','İzmir Buca']]
    },
    'elit-kategori': {
      eyebrow:'Üst Segment Karar Merkezi',
      title:'Rolex, Patek Philippe, Audemars Piguet ve Omega İçin Karar Katmanı',
      text:'Üst segment saatlerde marka adı tek başına yeterli değildir. Referans, kondisyon, mekanizma, fiyat ve ürün durumu birlikte değerlendirilmelidir. Bu katman elit koleksiyonu teknik doğrulama ve güvenli teslimat rehberlerine bağlar.',
      terms:['rolex','patek','audemars','omega','koleksiyon','ikinci el'],
      links:[['/saatler/','Tüm Lüks Saatler'],['/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/','Orijinallik & Ekspertiz'],['/rehber/izmir-kuyumculuk-ve-guvenli-teslimat/','Güvenli Teslimat']],
      metrics:[['Elit referans',String((list||[]).length)],['Elit marka',String(new Set((list||[]).map(p=>p.brand).filter(Boolean)).size)],['Karar odağı','Referans + kondisyon']]
    },
    mucevherat: {
      eyebrow:'Altın & Mücevher Karar Merkezi',
      title:'İzmir Altın, 22 Ayar Bilezik, Ziynet ve Pırlanta Karşılaştırma Merkezi',
      text:'Altın ve mücevher aramalarını tek ürün ızgarasına bırakmak yerine ürün türü, ayar, fiyat, canlı piyasa bağlantısı, faturalama ve teslimat bilgisini aynı merkezde topluyoruz. 22 ayar bilezik, ziynet ve pırlanta niyetleri ayrı bilgi yollarıyla desteklenir.',
      terms:['altin','bilezik','pirlanta','ziynet','sarrafiye'],
      links:[['/canli-fiyatlar/','Canlı Altın Fiyatları'],['/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/','Altın & Özel Matrah Rehberi'],['/rehber/pirlanta-ve-gemoloji-degerleme-rehberi/','Pırlanta 4C Rehberi']],
      metrics:[['Mücevher/altın ürün',String((list||[]).length)],['22 ayar/bilezik eşleşmesi',String(countPattern(list,/22.*ayar|bilezik/))],['Pırlanta eşleşmesi',String(countPattern(list,/pirlanta|diamond/))]]
    },
    magazin: {
      eyebrow:'Editoryal Otorite Katmanı',
      title:'Teknik İçerikten Ürün ve Karar Sayfalarına Editoryal Harita',
      text:'Magazin içerikleri yalnız haber akışı olarak tutulmaz. Marka ve model analizleri saat koleksiyonlarına; ekspertiz içerikleri doğrulama rehberlerine; altın ve mücevher içerikleri ilgili kategori ve rehberlere bağlanır.',
      terms:['rolex','omega','saat','altin','pirlanta','koleksiyon'],
      links:[['/saatler/','Lüks Saat Koleksiyonu'],['/mucevherat/','Altın & Mücevherat'],['/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/','Ekspertiz Rehberi']],
      metrics:[['Editoryal merkez','Belgin Saat Magazin'],['Bağlantı modeli','Konu → Rehber → Ürün'],['Güncellik','Yayın tarihine göre']]
    },
    markalar: {
      eyebrow:'Marka Otorite Katmanı',
      title:'Markadan Ürüne: Aktif Koleksiyon Kapsamasını Karşılaştırın',
      text:'Marka dizini yalnız isim listesi değil, aktif ürün kapsamasını destekleyen bir geçiş katmanıdır. Marka araştırmasından saat koleksiyonuna, elit segmente ve teknik ekspertiz rehberine tek adımda geçiş sağlar.',
      terms:['rolex','omega','patek','breitling','cartier','saat'],
      links:[['/saatler/','Tüm Lüks Saatler'],['/elit-kategori/','Elit Kategori'],['/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/','Ekspertiz Rehberi']],
      metrics:[['Aktif marka kapsaması',String(new Set((allProducts||[]).map(p=>p.brand).filter(Boolean)).size)],['Saat merkezi','/saatler/'],['Üst segment','/elit-kategori/']]
    }
  };
  const cfg = cfgs[key];
  if (!cfg) return '';
  const chips = topBrands(list,8).map(x => '<span style="display:inline-flex;gap:6px;padding:7px 10px;border:1px solid rgba(5,51,47,.14);border-radius:999px;background:#fff;font-size:12px;"><strong>'+esc(x[0])+'</strong><span style="color:#64748b;">'+esc(x[1])+'</span></span>').join('');
  const editorial = relatedArticles(articles,cfg.terms,4,null);
  return '<section class="seo-authority-cluster" data-seo-authority="'+esc(key)+'" style="max-width:1180px;margin:44px auto 16px;padding:28px;border:1px solid rgba(5,51,47,.12);border-radius:18px;background:linear-gradient(180deg,#fbfdfc 0%,#f7faf8 100%);">' +
    '<span style="display:block;font-size:11px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:#0f766e;margin-bottom:8px;">'+esc(cfg.eyebrow)+'</span>' +
    '<h2 style="font-family:var(--font-heading,serif);font-size:clamp(22px,3vw,32px);line-height:1.2;margin:0 0 12px;color:#132522;">'+esc(cfg.title)+'</h2>' +
    '<p style="max-width:900px;margin:0 0 18px;color:#475569;line-height:1.75;font-size:14px;">'+esc(cfg.text)+'</p>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:18px 0;">'+cfg.metrics.map(m=>'<div style="background:#fff;border:1px solid rgba(5,51,47,.1);border-radius:10px;padding:12px 14px;"><span style="display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:4px;">'+esc(m[0])+'</span><strong style="font-size:15px;color:#132522;">'+esc(m[1])+'</strong></div>').join('')+'</div>' +
    (chips ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 20px;">'+chips+'</div>' : '') +
    navLinks(cfg.links,cfg.title) + '<h3 style="font-size:17px;margin:24px 0 8px;color:#132522;">İlgili editoryal içerikler</h3>' + articleCards(editorial) + '</section>';
}

function editorialBridgeForArticle(art, articles) {
  const t = norm([art.title,art.summary,art.category].filter(Boolean).join(' '));
  const links = [];
  const add = (href,label) => { if (!links.some(x=>x[0]===href)) links.push([href,label]); };
  if (/rolex|patek|audemars|omega|breitling|cartier|vacheron|panerai|iwc|saat/.test(t)) { add('/elit-kategori/','Elit Saat Koleksiyonu'); add('/saatler/','Tüm Lüks Saatler'); add('/rehber/luks-saat-ekspertiz-ve-orijinallik-rehberi/','Ekspertiz & Orijinallik Rehberi'); }
  if (/altin|bilezik|ziynet|sarraf|kulce/.test(t)) { add('/mucevherat/','Altın & Mücevherat'); add('/canli-fiyatlar/','Canlı Altın Fiyatları'); add('/rehber/altin-yatirimi-ve-ozel-matrah-rehberi/','Altın & Özel Matrah Rehberi'); }
  if (/pirlanta|diamond|gemoloji|elmas/.test(t)) { add('/mucevherat/','Pırlanta & Mücevherat'); add('/rehber/pirlanta-ve-gemoloji-degerleme-rehberi/','Pırlanta 4C Rehberi'); }
  if (!links.length) { add('/saatler/','Lüks Saat Koleksiyonu'); add('/magazin/','Tüm Editoryal İçerikler'); }
  const terms = String(art.title||'').split(/\s+/).filter(w=>w.length>4).slice(0,4);
  const related = relatedArticles(articles,terms,3,art.id);
  return '<aside data-editorial-bridge="'+esc(art.id)+'" style="margin:38px 0 0;padding:24px;border:1px solid rgba(5,51,47,.14);border-radius:14px;background:#f8fbf9;">' +
    '<span style="font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0f766e;">Konu Bağlantıları</span><h2 style="font-size:20px;margin:7px 0 10px;color:#132522;">Bu içerikten ürün ve karar sayfalarına geçin</h2>' +
    '<p style="font-size:13px;line-height:1.7;color:#64748b;margin:0 0 14px;">Editoryal içeriği ilgili koleksiyon, doğrulama rehberi ve güncel ürün sayfalarıyla birlikte değerlendirin.</p>' +
    navLinks(links,'Editoryal konu bağlantıları') + (related.length ? '<h3 style="font-size:15px;margin:18px 0 8px;">İlgili okumalar</h3>'+articleCards(related) : '') + '</aside>';
}

module.exports = { renderAuthorityCluster, editorialBridgeForArticle };
