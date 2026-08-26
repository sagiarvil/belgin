const fs = require('fs');

let appJs = fs.readFileSync('js/app.js', 'utf8');

// 1. Header comment
appJs = appJs.replace('// BELGIN — LÜKS SAAT & MÜCEVHERAT (EST. 1987)', '// BELGIN — LÜKS SAAT & MÜCEVHERAT (EST. 1999)');

// 2. init() navigation logic
const oldInitNav = `    const hash = location.hash.replace('#', '');
    if (hash && document.getElementById('page-' + hash)) {
      Router.navigate(hash, false);
    } else {
      Router.navigate('ana-sayfa', false);
    }`;

const newInitNav = `    const legacy = Router.migrateLegacyHash();
    const queryProductId = Number(new URLSearchParams(location.search).get('urun'));

    if (queryProductId && findProduct(queryProductId)) {
      Router.navigate('urun', false);
      this.openProduct(queryProductId, { skipHistory: true });
      const route = Router.routeForProduct(queryProductId);
      if (route) history.replaceState({ page: 'urun', productId: queryProductId }, '', route);
      return;
    }

    const state = legacy || Router.resolveLocation();
    if (state.page === 'urun' && state.productId) {
      Router.navigate('urun', false);
      this.openProduct(state.productId, { skipHistory: true });
    } else {
      Router.navigate(state.page, false);
    }`;

appJs = appJs.replace(oldInitNav, newInitNav);

// 3. renderProductCard <a href>
const oldCardRegex = /renderProductCard\(p\) \{[\s\S]*?return `\s*<div class="product-art-card[\s\S]*?<\/div>\s*<\/div>\s*`;\s*\},/;

const newCard = `renderProductCard(p) {
    const hoverImg = p.hoverImage || p.image;
    const isPreOwned = p.isPreOwned === true;
    const buyPrice = p.buyPrice || (p.price - 500);

    const priceHtml = isPreOwned ? \`
      <div class="prod-dual-pricing">
        <div class="prod-dual-price-row prod-sale-price-row">
          <span class="prod-price-label">Satış Fiyatı:</span>
          <span class="prod-price-value">\${formatPrice(p.price)} <small class="vat-text">(KDV Dahil)</small></span>
        </div>
        <div class="prod-dual-price-row prod-buy-price-row">
          <span class="prod-price-label">Alış Fiyatı:</span>
          <span class="prod-price-value">\${formatPrice(buyPrice)}</span>
        </div>
      </div>
    \` : \`
      <div class="prod-price-tag">\${formatPrice(p.price)}</div>
    \`;

    const productHref = (window.SEO_ROUTE_MAP || {})[String(p.id)] || \`/?urun=\${encodeURIComponent(p.id)}\`;

    return \`
      <a class="product-art-card \${isPreOwned ? 'product-art-card-preowned' : ''}"
         href="\${productHref}"
         data-product-id="\${p.id}"
         style="text-decoration:none; color:inherit; display:flex;">
        <div class="product-art-thumb">
          \${isPreOwned ? '<span class="badge-cond-gold">İkinci El</span>' : ''}
          <img class="img-primary" src="\${p.image}" alt="\${p.brand} \${p.name}" loading="lazy">
          <img class="img-hover" src="\${hoverImg}" alt="\${p.brand} \${p.name}" loading="lazy">
        </div>
        <div class="product-art-info">
          <h3 class="prod-brand-name">\${p.brand}</h3>
          <p class="prod-model-name">\${p.name}</p>
          <p class="prod-ref-size">\${p.reference}</p>
          \${priceHtml}
        </div>
      </a>
    \`;
  },`;

appJs = appJs.replace(oldCardRegex, newCard);

// 4. openProduct(id, options = {})
appJs = appJs.replace('openProduct(id) {', 'openProduct(id, options = {}) {');

const oldEndPdp = `    Router.navigate('urun', false);
    if (history.pushState) {
      history.pushState(null, '', '#urun-' + p.id);
    }`;

const newEndPdp = `    Router.navigate('urun', false);
    const route = Router.routeForProduct(p.id);
    if (!options.skipHistory && route && location.pathname !== route) {
      history.pushState({ page: 'urun', productId: p.id }, '', route);
    }`;

appJs = appJs.replace(oldEndPdp, newEndPdp);

fs.writeFileSync('js/app.js', appJs, 'utf8');
console.log('js/app.js patched successfully.');
