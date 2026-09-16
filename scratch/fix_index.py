import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Remove Desktop Nav Link
html = re.sub(r'<!-- 5\. CANLI FİYATLAR -->\s*<li>\s*<a href="/canli-fiyatlar/"[^>]*>[\s\S]*?</a>\s*</li>', '', html)

# 2. Remove Mobile Nav Link
html = re.sub(r'<!-- 0\. Canlı Fiyatlar Butonu -->\s*<a href="/canli-fiyatlar/"[^>]*>[\s\S]*?</a>\s*<div style="height:12px;"></div>', '', html)
html = re.sub(r'<!-- 0\. Canlı Fiyatlar Butonu -->\s*<a href="/canli-fiyatlar/"[^>]*>[\s\S]*?</a>', '', html)

# 3. Remove Haute Story Item
html = re.sub(r'<a href="/canli-fiyatlar/"[^>]*class="haute-story-item">[\s\S]*?</a>', '', html)

# 4. Remove Mobile Dock Button
html = re.sub(r'<a href="/canli-fiyatlar/"[^>]*class="mobile-dock-btn mobile-dock-btn-live">[\s\S]*?</a>', '', html)

# 5. Remove page-canli-fiyatlar section
# Find the start index
start_tag = '<!-- 4.1 CANLI PİYASALAR & ALTIN FİYATLARI -->'
start_idx = html.find(start_tag)
if start_idx != -1:
    # Find the next section: <!-- 6. İLETİŞİM & SHOWROOM RANDEVU SAYFASI (ULTRA-PREMIUM SPA) -->
    end_tag = '<!-- 6. İLETİŞİM & SHOWROOM RANDEVU SAYFASI (ULTRA-PREMIUM SPA) -->'
    end_idx = html.find(end_tag, start_idx)
    if end_idx != -1:
        html = html[:start_idx] + html[end_idx:]

# 6. Remove Hash Script Blocks
html = re.sub(r'if \(window\.location\.hash === \'#canli-fiyatlar\' \|\| window\.location\.hash === \'#canlipiyasalar\'\) \{\s*window\.location\.replace\(\'/canli-fiyatlar/\'\);\s*\} else ', '', html)
html = re.sub(r'if \(window\.location\.hash === \'#canli-fiyatlar\' \|\| window\.location\.hash === \'#canlipiyasalar\'\) \{\s*window\.location\.replace\(\'/canli-fiyatlar/\'\);\s*\}\s*', '', html)

# 7. Remove CSS block
html = re.sub(r'#page-canli-fiyatlar\.active\s*\{\s*display:\s*block\s*!important;\s*\}', '', html)

# 8. Remove Craft Bento Section
bento_start = '<!-- BÖLÜM 1.7: 🔬 MİKROMEKANİK USTALIK & HAUTE HORLOGERIE BENTO VİTRİNİ -->'
bento_start_idx = html.find(bento_start)
if bento_start_idx != -1:
    bento_end = '<!-- BÖLÜM 2: YENİ EKLENEN SAATLER (Sayfa Başına 30 Ürün) -->'
    bento_end_idx = html.find(bento_end, bento_start_idx)
    if bento_end_idx != -1:
        html = html[:bento_start_idx] + html[bento_end_idx:]

# 9. Remove Footer Magazine Hub
mag_start = '<!-- 2.1 BELGİN SAAT MAGAZİN & EDİTORYAL MERKEZİ -->'
mag_start_idx = html.find(mag_start)
if mag_start_idx != -1:
    mag_end = '<!-- 3. ENTEGRE BANKA, SANAL POS & İLETİŞİM ŞERİDİ -->'
    mag_end_idx = html.find(mag_end, mag_start_idx)
    if mag_end_idx != -1:
        html = html[:mag_start_idx] + html[mag_end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Fix applied.")
