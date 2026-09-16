import os
import re

filepath = 'scripts/generate-static-seo-pages.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the product PDP hero answer engine
pdp_pattern = r'<!-- PDP HERO ANSWER ENGINE \(AEO / SSOT KÜNYE\) -->\s*<div class="hero-answer-engine"[\s\S]*?</div>\s*</div>\s*</div>'
content = re.sub(pdp_pattern, '', content)

# Remove the magazin hero answer engine
mag_pattern = r'<div class="hero-answer-engine"[^>]*data-registry-route="/magazin/\$\{esc\(art\.slug\)\}/"[\s\S]*?</div>\s*</div>\s*</div>'
content = re.sub(mag_pattern, '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
