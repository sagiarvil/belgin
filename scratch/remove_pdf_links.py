import re

def remove_pdf_links(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Nav dropdown item (lines 629-634)
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="nav-dropdown-single-item"[^>]*>.*?</a>', '', content, flags=re.DOTALL)

    # 2. Header PDF button (lines 654-660)
    content = re.sub(r'<!-- GLOBAL EDITORIAL LUXURY PDF FOLIO -->\s*<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="btn-header-pdf"[^>]*>.*?</a>', '', content, flags=re.DOTALL)
    # Also just in case the comment is missing:
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="btn-header-pdf"[^>]*>.*?</a>', '', content, flags=re.DOTALL)

    # 3. Mobile nav sub link (line 776)
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="mobile-nav-sub-link"[^>]*>.*?</a>\n?', '', content, flags=re.DOTALL)

    # 4. Biz Kimiz Download button (line 2064)
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="btn-biz-download"[^>]*>.*?</a>\n?', '', content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Processed {filepath}")

remove_pdf_links('index.html')

