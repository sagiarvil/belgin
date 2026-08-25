const fs = require('fs');

const path = 'js/data.js';
let source = fs.readFileSync(path, 'utf8');

const updates = {
  101: {
    name: 'Carrera Date Twin-Time GMT',
    reference: 'WDA2114.BA0043 · 41mm',
    desc: 'TAG Heuer Carrera Date Twin-Time WDA2114.BA0043; 41mm çelik kasa, teal yeşil kadran, otomatik manufacture Calibre TH31-03, GMT, 80 saat güç rezervi ve 100m su geçirmezlik.',
    image: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dw4cc3dbd9/TAG_Heuer_Carrera/WDA2114.BA0043/WDA2114.BA0043_Soldier.png?expansion=true&impolicy=TrimRatioResize&ratioHeight=5&ratioWidth=4&width=1600',
    hoverImage: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dw4cc3dbd9/TAG_Heuer_Carrera/WDA2114.BA0043/WDA2114.BA0043_Soldier.png?expansion=true&impolicy=TrimRatioResize&ratioHeight=5&ratioWidth=4&width=1600',
    sourceUrl: 'https://www.tagheuer.com/int/en/timepieces/collections/tag-heuer-carrera/41-mm-th31-03/WDA2114.BA0043.html'
  },
  102: {
    name: 'Carrera Chronograph Otomatik',
    reference: 'CBN2A1AA.FT6228 · 44mm',
    desc: 'TAG Heuer Carrera Chronograph CBN2A1AA.FT6228; 44mm çelik kasa, siyah kadran, siyah seramik bezel, Calibre 16 otomatik kronograf, siyah perfore kauçuk kayış ve 100m su geçirmezlik.',
    image: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dw6eb05ae1/TAG_Heuer_Carrera/CBN2A1AA.FT6228/CBN2A1AA.FT6228_Soldier.png?expansion=true&impolicy=TrimRatioResize&ratioHeight=5&ratioWidth=4&width=1600',
    hoverImage: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dw6eb05ae1/TAG_Heuer_Carrera/CBN2A1AA.FT6228/CBN2A1AA.FT6228_Soldier.png?expansion=true&impolicy=TrimRatioResize&ratioHeight=5&ratioWidth=4&width=1600',
    sourceUrl: 'https://www.tagheuer.com/us/en/timepieces/collections/tag-heuer-carrera/44-mm-calibre-16-automatic/CBN2A1AA.FT6228.html'
  },
  103: {
    name: 'Formula 1 Chronograph Gulf Edition',
    reference: 'CAZ101N.FC8243 · 43mm',
    desc: 'TAG Heuer Formula 1 Gulf Special Edition CAZ101N.FC8243; 43mm çelik kasa, Gulf mavi-turuncu kadran, quartz kronograf, mavi deri kayış ve 200m su geçirmezlik.',
    image: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dwfa2a241b/TAG_Heuer_Formula_1/CAZ101N.FC8243/CAZ101N.FC8243_Soldier.png?expansion=true&impolicy=TrimRatioResize&ratioHeight=5&ratioWidth=4&width=1600',
    hoverImage: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dwfa2a241b/TAG_Heuer_Formula_1/CAZ101N.FC8243/CAZ101N.FC8243_Soldier.png?expansion=true&impolicy=TrimRatioResize&ratioHeight=5&ratioWidth=4&width=1600',
    sourceUrl: 'https://www.tagheuer.com/us/en/timepieces/collections/tag-heuer-formula-1/43-mm-quartz/CAZ101N.FC8243.html'
  },
  104: {
    name: 'Formula 1 Date Siyah 41mm',
    reference: 'WAZ1110.FT8023 · 41mm',
    image: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dwd6327dc6/TAG_Heuer_Formula_1/WAZ1110.FT8023/WAZ1110.FT8023_1000.png?height=1106&impolicy=resizeTrim&width=884',
    hoverImage: 'https://www.tagheuer.com/on/demandware.static/-/Sites-tagheuer-master/default/dwd6327dc6/TAG_Heuer_Formula_1/WAZ1110.FT8023/WAZ1110.FT8023_1000.png?height=1106&impolicy=resizeTrim&width=884',
    sourceUrl: 'https://www.tagheuer.com/int/en/timepieces/collections/tag-heuer-formula-1/41-mm-quartz/WAZ1110.FT8023.html'
  },
  105: {
    name: 'HydroConquest Otomatik Seramik',
    reference: 'L3.781.4.56.6 · 41mm',
    image: 'https://api.ecom.longines.com/media/catalog/product/w/a/watch-collection-hydroconquest-l3-781-4-56-6-d65499-hero.png?w=2560',
    hoverImage: 'https://api.ecom.longines.com/media/catalog/product/w/a/watch-collection-hydroconquest-l3-781-4-56-6-d65499-hero.png?w=2560',
    sourceUrl: 'https://www.longines.com/p/watch-hydroconquest-l3-781-4-56-6'
  },
  106: {
    name: 'Master Collection Moonphase Ay Fazı',
    reference: 'L2.909.4.78.3 · 40mm',
    image: 'https://api.ecom.longines.com/media/catalog/product/w/a/watch-collection-longines-master-collection-moonphase-l2-909-4-78-3-8f8b4a-hero.png?w=2560',
    hoverImage: 'https://api.ecom.longines.com/media/catalog/product/w/a/watch-collection-longines-master-collection-moonphase-l2-909-4-78-3-8f8b4a-hero.png?w=2560',
    sourceUrl: 'https://www.longines.com/p/watch-longines-master-collection-moonphase-l2-909-4-78-3'
  },
  107: {
    name: 'Captain Cook Otomatik Kırmızı-Siyah',
    reference: 'R32105353 · 42mm',
    dial: 'Kırmızıdan Siyaha Geçişli Kadran & Hareketli Çapa',
    desc: 'Rado Captain Cook R32105353; 42mm paslanmaz çelik kasa ve bilezik, siyah yüksek teknoloji seramik bezel, kırmızıdan siyaha geçişli kadran ve 300m su geçirmezlik.',
    image: 'https://www.rado.com/media/sgecom_contentsystem/Campaigns/Valentines_Day/captain-cook-red.jpg?im=Resize%3D%281024%2C682%29%2Caspect%3Dfill%3BCrop%3D%280%2C0%2C1024%2C682%29%2Cgravity%3DCenter',
    hoverImage: 'https://www.rado.com/media/sgecom_contentsystem/Campaigns/Valentines_Day/captain-cook-red.jpg?im=Resize%3D%281024%2C682%29%2Caspect%3Dfill%3BCrop%3D%280%2C0%2C1024%2C682%29%2Cgravity%3DCenter',
    sourceUrl: 'https://www.rado.com/captain-cook-automatic-r32105353.html'
  },
  108: {
    name: 'True Square Automatic Open Heart Siyah Seramik',
    reference: 'R27086162 · 38mm',
    desc: 'Rado True Square Automatic Open Heart R27086162; 38mm monoblok siyah yüksek teknoloji seramik kasa ve bilezik, açık kalp kadran ve otomatik R734 mekanizma.',
    image: 'https://www.rado.com/media/sgecom_contentsystem/PDP_Images/true-square-black-carousel-a.jpg?im=Resize%3D%281024%2C682%29%2Caspect%3Dfill%3BCrop%3D%280%2C0%2C1024%2C682%29%2Cgravity%3DCenter',
    hoverImage: 'https://www.rado.com/media/sgecom_contentsystem/PDP_Images/true-square-black-carousel-a.jpg?im=Resize%3D%281024%2C682%29%2Caspect%3Dfill%3BCrop%3D%280%2C0%2C1024%2C682%29%2Cgravity%3DCenter',
    sourceUrl: 'https://www.rado.com/true-square-automatic-open-heart-r27086162.html'
  },
  1: {
    name: 'Juste un Clou Pırlantalı Bilezik',
    reference: 'B6048617 · 17',
    desc: 'Cartier Juste un Clou B6048617 klasik pırlantalı bilezik; 18 ayar sarı altın, 32 parlak kesim pırlanta toplam 0,58 ct ve 3,5mm genişlik.',
    image: 'https://www.chronoland.ru/images/thumbs-720x900-products/EDF1uz3nGt7qa4aV5z2QY2zHEWa9rA1WdFiSWfXo.png',
    hoverImage: 'https://www.chronoland.ru/images/thumbs-720x900-products/EDF1uz3nGt7qa4aV5z2QY2zHEWa9rA1WdFiSWfXo.png',
    sourceUrl: 'https://www.cartier.com/en-tr/jewellery/bracelets/juste-un-clou/juste-un-clou-bracelet-classic-model-diamonds-CRB6048617.html'
  },
  2: {
    name: 'Setting Tektaş Pırlanta Yüzük',
    reference: '70524805 · 11',
    image: 'https://d17anp2eo56k6j.cloudfront.net/media/catalog/product/t/i/tiffany-co-1-51-carat-solitaire-diamond-ring-gia-d-vvs1_3_10-1-14464.jpg',
    hoverImage: 'https://d17anp2eo56k6j.cloudfront.net/media/catalog/product/t/i/tiffany-co-1-51-carat-solitaire-diamond-ring-gia-d-vvs1_3_10-1-14464.jpg',
    sourceUrl: 'https://www.tiffany.com/engagement/the-tiffany-setting/'
  },
  3: {
    name: 'Love Bilezik Klasik Rose Altın',
    reference: 'B6067417 · 17',
    desc: 'Cartier LOVE B6067417 klasik model; 18 ayar rose altın, 6,1mm genişlik, iki işlevsel vidalı orijinal kapama sistemi ve tornavida.',
    image: 'https://www.cartier.com/dw/image/v2/BFHP_PRD/on/demandware.static/-/Sites-cartier-master/default/dwd3992778/images/large/8c77aa1d2fb75ca19a78bd8393c44394.png?sfrm=png&sh=750&sm=fit&sw=750',
    hoverImage: 'https://www.cartier.com/dw/image/v2/BFHP_PRD/on/demandware.static/-/Sites-cartier-master/default/dwd3992778/images/large/8c77aa1d2fb75ca19a78bd8393c44394.png?sfrm=png&sh=750&sm=fit&sw=750',
    sourceUrl: 'https://www.cartier.com/en-ie/jewellery/bracelets/love/-love-bracelet-classic-model-CRB6067417'
  },
  4: {
    name: 'Love Bilezik Klasik Sarı Altın',
    reference: 'B6067517 · 18',
    desc: 'Cartier LOVE B6067517 klasik model; 18 ayar sarı altın, 6,1mm genişlik, iki işlevsel vidalı orijinal kapama sistemi ve tornavida.',
    image: 'https://jewelsaficionado.com/cdn/shop/files/cartier-love-bracelet-in-yellow-gold-cartier-1146590431_2048x.jpg?v=1741848007',
    hoverImage: 'https://jewelsaficionado.com/cdn/shop/files/cartier-love-bracelet-in-yellow-gold-cartier-1146590431_2048x.jpg?v=1741848007',
    sourceUrl: 'https://www.cartier.com/en-tr/be-inspired/engrave-your-creation/love-bracelet-classic-model-CRB6067517.html'
  },
  5: {
    name: 'Love Yüzük Küçük Sarı Altın',
    reference: 'B4085000 · 56',
    image: 'https://www.cartier.com/dw/image/v2/BFHP_PRD/on/demandware.static/-/Sites-cartier-master/default/dwf8eb0d0b/images/large/509efad81d12569981abebf66c433720.png?sfrm=png&sh=750&sm=fit&sw=750',
    hoverImage: 'https://www.cartier.com/dw/image/v2/BFHP_PRD/on/demandware.static/-/Sites-cartier-master/default/dwf8eb0d0b/images/large/509efad81d12569981abebf66c433720.png?sfrm=png&sh=750&sm=fit&sw=750',
    sourceUrl: 'https://www.cartier.com/en-tr/jewellery/rings/love/love-ring-small-model-CRB4085000.html'
  },
  6: {
    name: 'Juste un Clou Klasik Sarı Altın',
    reference: 'B6048217 · 16',
    dial: 'Pırlantasız Klasik Model',
    desc: 'Cartier Juste un Clou B6048217 klasik model; 18 ayar sarı altın, pırlantasız ikonik çivi formu ve 3,5mm genişlik.',
    image: 'https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwecbecd81/images/large/0628c1ecff495255b019bdc9c03b10e4.png?sfrm=png&sh=750&sm=fit&sw=750',
    hoverImage: 'https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwecbecd81/images/large/0628c1ecff495255b019bdc9c03b10e4.png?sfrm=png&sh=750&sm=fit&sw=750',
    sourceUrl: 'https://www.cartier.com/en-tr/jewellery/bracelets/juste-un-clou/juste-un-clou-bracelet-classic-model-CRB6048217.html'
  },
  7: {
    name: 'Love Bilezik Klasik Beyaz Altın',
    reference: 'B6067617 · 16',
    desc: 'Cartier LOVE B6067617 klasik model; 18 ayar beyaz altın, 6,1mm genişlik, iki işlevsel vidalı orijinal kapama sistemi ve tornavida.',
    image: 'https://cashing-diamonds.com/cdn/shop/files/64607.jpg?v=1686017866',
    hoverImage: 'https://cashing-diamonds.com/cdn/shop/files/64607.jpg?v=1686017866',
    sourceUrl: 'https://www.cartier.com/en-tr/jewellery/bracelets/love/love-bracelet-classic-model-B6067617.html'
  },
  8: {
    name: 'Juste un Clou Yüzük Sarı Altın',
    reference: 'B4092600 · 54',
    desc: 'Cartier Juste un Clou B4092600 klasik model yüzük; 18 ayar sarı altın ve 2,6mm genişlik.',
    image: 'https://backend.lombard-perspectiva.ru/storage/images/jewelry/assets/04b3ad661504e0ddfa75f7c994b41ee6_xxl.webp',
    hoverImage: 'https://backend.lombard-perspectiva.ru/storage/images/jewelry/assets/04b3ad661504e0ddfa75f7c994b41ee6_xxl.webp',
    sourceUrl: 'https://www.cartier.com/en-tr/jewellery/rings/juste-un-clou/juste-un-clou-ring-classic-model-CRB4092600.html'
  }
};

function updateBlock(id, changes) {
  const re = new RegExp(`(\\{\\n    id: ${id},[\\s\\S]*?\\n  \\})(?=,\\n  \\{|\\n\\];)`);
  const match = source.match(re);
  if (!match) throw new Error(`Product ${id} block not found`);
  let block = match[1];

  for (const [field, value] of Object.entries(changes)) {
    const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const fieldRe = new RegExp(`(^    ${field}: )"[^"]*"(,?$)`, 'm');
    if (fieldRe.test(block)) {
      block = block.replace(fieldRe, `$1"${escaped}"$2`);
    } else if (field === 'sourceUrl') {
      block = block.replace(/(^    hoverImage: "[^"]*",?$)/m, `$1\n    sourceUrl: "${escaped}",`);
    } else {
      throw new Error(`Product ${id}: field ${field} not found`);
    }
  }

  source = source.replace(match[1], block);
}

for (const [id, changes] of Object.entries(updates)) updateBlock(id, changes);

fs.writeFileSync(path, source, 'utf8');
console.log(`Updated ${Object.keys(updates).length} products with verified identity/image mappings.`);
