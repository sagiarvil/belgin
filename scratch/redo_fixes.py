import os
import re

def process_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Elite Brands in HTML files
    # Desktop Mega Menu
    content = content.replace('👑 Haute Horlogerie (10 Evi)', '👑 Haute Horlogerie (5 Saat Evi)')
    
    # Remove Omega, Patek, Audemars, Breitling, Tudor, IWC, Panerai from Desktop
    for brand in ['Omega', 'Patek%20Philippe', 'Audemars%20Piguet', 'Breitling', 'Tudor', 'IWC%20Schaffhausen', 'Panerai']:
        content = re.sub(rf'<a href="/elit-kategori/\?marka={brand}".*?</a>\s*', '', content, flags=re.DOTALL)
        
    # Remove from brand-page-item list
    for brand in ['Omega', 'Patek%20Philippe', 'Audemars%20Piguet', 'Breitling', 'Tudor', 'IWC%20Schaffhausen', 'Panerai']:
        content = re.sub(rf'<a href="/elit-kategori/\?marka={brand}".*?</a>\s*', '', content, flags=re.DOTALL)

    # Change description
    content = content.replace('Rolex, Omega, Patek Philippe, Audemars Piguet, Breitling ve daha fazlası', 'Rolex, TAG Heuer, Cartier, Rado ve Tissot')
    
    # Update count
    content = content.replace('🏷️ Tüm Saat Markaları (25)', '🏷️ Tüm Saat Markaları')

    # 2. Remove Canli Fiyatlar
    content = re.sub(r'<!-- 5\. CANLI FİYATLAR -->\s*<li>\s*<a href="/canli-fiyatlar/".*?</a>\s*</li>', '', content, flags=re.DOTALL)
    content = re.sub(r'<!-- 0\. Canlı Fiyatlar Butonu -->\s*<a href="/canli-fiyatlar/".*?</a>\s*<div style="height:12px;"></div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<!-- 0\. Canlı Fiyatlar Butonu -->\s*<a href="/canli-fiyatlar/".*?</a>', '', content, flags=re.DOTALL)
    content = re.sub(r'<a href="/canli-fiyatlar/"[^>]*class="haute-story-item">.*?</a>', '', content, flags=re.DOTALL)
    content = re.sub(r'<a href="/canli-fiyatlar/"[^>]*class="mobile-dock-btn mobile-dock-btn-live">.*?</a>', '', content, flags=re.DOTALL)
    content = re.sub(r'<!-- 4\.1 CANLI PİYASALAR & ALTIN FİYATLARI -->\s*<section id="page-canli-fiyatlar".*?</section>', '', content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Apply to common HTML files
for f in ['index.html', 'saatler/index.html', 'elit-kategori/index.html', 'biz-kimiz/index.html', 'markalar/index.html', 'mucevherat/index.html', 'iletisim.html']:
    process_file(f)

# Update js/data.js and js/data-light.js to restrict ELITE_WATCH_BRANDS
def patch_js_data(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(
        r'const ELITE_WATCH_BRANDS = \[.*?\];', 
        "const ELITE_WATCH_BRANDS = ['Rolex', 'TAG Heuer', 'Cartier', 'Rado', 'Tissot'];", 
        content, 
        flags=re.DOTALL
    )
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

patch_js_data('js/data.js')
patch_js_data('js/data-light.js')

