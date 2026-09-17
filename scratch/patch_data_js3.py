import re

for filepath in ['js/data.js', 'js/data-light.js']:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = re.sub(r'if \(typeof module !== \'undefined\' && module\.exports\) \{.*', '''const WATCHES = PRODUCTS.filter(p => (p.category === 'saat' || p.category === 'watch') && !p.isPreOwned);
const JEWELLERY = PRODUCTS.filter(p => (p.category === 'jewelry' || p.category === 'jewellery') && !p.isPreOwned);
const PRE_OWNED_GOLD = PRODUCTS.filter(p => p.isPreOwned && p.isGold);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRODUCTS,
    ELITE_WATCH_BRANDS,
    WATCH_BRANDS,
    JEWELRY_BRANDS,
    WATCHES,
    JEWELLERY,
    PRE_OWNED_ITEMS,
    PRE_OWNED_GOLD,
    ALL_PRODUCTS: PRODUCTS
  };
}

if (typeof window !== 'undefined') {
  window.PRODUCTS = PRODUCTS;
  window.ELITE_WATCH_BRANDS = ELITE_WATCH_BRANDS;
  window.WATCH_BRANDS = WATCH_BRANDS;
  window.JEWELRY_BRANDS = JEWELRY_BRANDS;
  window.WATCHES = WATCHES;
  window.JEWELLERY = JEWELLERY;
  window.PRE_OWNED_ITEMS = PRE_OWNED_ITEMS;
  window.PRE_OWNED_GOLD = PRE_OWNED_GOLD;
}''', content, flags=re.DOTALL)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except FileNotFoundError:
        pass

