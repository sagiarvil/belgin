import os
import re

files_to_patch = [
    'index.html',
    'elit-kategori/index.html',
    'saatler/index.html',
    'biz-kimiz/index.html',
    'mucevherat/index.html',
    'markalar/index.html'
]

def clean_html(content):
    # This regex matches the section from <!-- BÖLÜM 1.7... to </section>
    pattern = r'<!-- BÖLÜM 1\.7: 🔬 MİKROMEKANİK USTALIK & HAUTE HORLOGERIE BENTO VİTRİNİ -->\s*<section class="craft-bento-section">[\s\S]*?</section>'
    content = re.sub(pattern, '', content)
    return content

for fname in files_to_patch:
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = clean_html(content)
        
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {fname}")

