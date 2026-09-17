import re

for filepath in ['js/data.js', 'js/data-light.js']:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("} else {\n  window.PRODUCTS = PRODUCTS;\n  window.ELITE_WATCH_BRANDS = ELITE_WATCH_BRANDS;\n}", "} else if (typeof window !== 'undefined') {\n  window.PRODUCTS = PRODUCTS;\n  window.ELITE_WATCH_BRANDS = ELITE_WATCH_BRANDS;\n}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
