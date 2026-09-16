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
    # This regex matches the section from <!-- 2.1 BELGİN SAAT MAGAZİN & EDİTORYAL MERKEZİ --> down to its closing </div>
    # It ends right before <!-- 3. ENTEGRE BANKA, SANAL POS & İLETİŞİM ŞERİDİ -->
    pattern = r'<!-- 2\.1 BELGİN SAAT MAGAZİN & EDİTORYAL MERKEZİ -->\s*<div class="footer-magazine-hub">[\s\S]*?</div>\s*</div>\s*(?=<!-- 3\. ENTEGRE BANKA, SANAL POS & İLETİŞİM ŞERİDİ -->)'
    content = re.sub(pattern, '', content)
    
    # Just in case there are spacing differences, let's also use a more robust fallback
    fallback_pattern = r'<!-- 2\.1 BELGİN SAAT MAGAZİN & EDİTORYAL MERKEZİ -->\s*<div class="footer-magazine-hub">[\s\S]*?</div>\s*</div>\s*'
    content = re.sub(fallback_pattern, '', content)
    
    return content

for fname in files_to_patch:
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = clean_html(content)
        
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {fname}")

