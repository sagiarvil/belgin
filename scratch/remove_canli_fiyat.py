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
    # Remove desktop nav link
    content = re.sub(r'<!-- 5\. CANLI FİYATLAR -->\s*<li>\s*<a href="/canli-fiyatlar/"[\s\S]*?</a>\s*</li>', '', content)
    
    # Remove mobile nav link
    content = re.sub(r'<!-- 0\. Canlı Fiyatlar Butonu -->\s*<a href="/canli-fiyatlar/"[\s\S]*?</a>\s*<div style="height:12px;"></div>', '', content)
    content = re.sub(r'<!-- 0\. Canlı Fiyatlar Butonu -->\s*<a href="/canli-fiyatlar/"[\s\S]*?</a>', '', content)

    # Remove haute story item
    content = re.sub(r'<a href="/canli-fiyatlar/"[^>]*class="haute-story-item">[\s\S]*?</a>', '', content)
    
    # Remove mobile dock button
    content = re.sub(r'<a href="/canli-fiyatlar/"[^>]*class="mobile-dock-btn mobile-dock-btn-live">[\s\S]*?</a>', '', content)
    
    # Remove the section (matches <section id="page-canli-fiyatlar" up to </section>)
    content = re.sub(r'<!-- 4\.1 CANLI PİYASALAR & ALTIN FİYATLARI -->\s*<section id="page-canli-fiyatlar"[\s\S]*?</section>', '', content)
    
    # Remove hash script block parts
    content = re.sub(r'if \(window\.location\.hash === \'#canli-fiyatlar\' \|\| window\.location\.hash === \'#canlipiyasalar\'\) \{\s*window\.location\.replace\(\'/canli-fiyatlar/\'\);\s*\} else ', '', content)
    content = re.sub(r'if \(window\.location\.hash === \'#canli-fiyatlar\' \|\| window\.location\.hash === \'#canlipiyasalar\'\) \{\s*window\.location\.replace\(\'/canli-fiyatlar/\'\);\s*\}\s*', '', content)

    # Remove CSS block if it exists
    content = re.sub(r'#page-canli-fiyatlar\.active\s*\{\s*display:\s*block\s*!important;\s*\}', '', content)
    
    return content

for fname in files_to_patch:
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = clean_html(content)
        
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {fname}")

