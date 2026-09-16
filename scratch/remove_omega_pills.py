import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<div class="brand-carousel-card"[^>]*Omega[^>]*>.*?</div>', '', content, flags=re.DOTALL)
content = re.sub(r'<button class="mobile-filter-pill"[^>]*Omega[^>]*>.*?</button>', '', content, flags=re.DOTALL)
content = re.sub(r'<button class="uv-pill-btn"[^>]*Omega[^>]*>.*?</button>', '', content, flags=re.DOTALL)
content = re.sub(r'<option value="Omega">.*?</option>', '', content, flags=re.DOTALL)
content = re.sub(r'<button class="mag-filter-pill"[^>]*Omega[^>]*>.*?</button>', '', content, flags=re.DOTALL)
content = re.sub(r'<li><a href="/magazin/\?kategori=Omega.*?</A></li>', '', content, flags=re.IGNORECASE|re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

