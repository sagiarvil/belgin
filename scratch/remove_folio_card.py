import re

with open('biz-kimiz/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern for the flipbook viewer
pattern = r'<!-- 2\. PROMINENT FIRST-SCREEN 16:9 PDF / FLIPBOOK VIEWER -->\s*<div class="biz-kimiz-folio-card" id="bizKimizFolioCard">.*?</div>\s*</div>\s*<!--'
# The div has nested divs, so regex with .*? might stop early or too late.
