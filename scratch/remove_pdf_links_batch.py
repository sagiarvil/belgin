import re

def remove_pdf_links(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Nav dropdown item
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="nav-dropdown-single-item"[^>]*>.*?</a>', '', content, flags=re.DOTALL)

    # 2. Header PDF button
    content = re.sub(r'<!-- GLOBAL EDITORIAL LUXURY PDF FOLIO -->\s*<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="btn-header-pdf"[^>]*>.*?</a>', '', content, flags=re.DOTALL)
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="btn-header-pdf"[^>]*>.*?</a>', '', content, flags=re.DOTALL)

    # 3. Mobile nav sub link
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="mobile-nav-sub-link"[^>]*>.*?</a>\n?', '', content, flags=re.DOTALL)

    # 4. Biz Kimiz Download button
    content = re.sub(r'<a href="/docs/belgin-kurumsal-profil-2026\.pdf"[^>]*class="btn-biz-download"[^>]*>.*?</a>\n?', '', content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filepath}")

remove_pdf_links('saatler/index.html')
remove_pdf_links('biz-kimiz/index.html')
