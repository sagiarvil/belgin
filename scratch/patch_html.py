import os
import re

files_to_patch = [
    'index.html',
    'elit-kategori/index.html',
    'saatler/index.html',
    'biz-kimiz/index.html',
    'mucevherat/index.html',
    'markalar/index.html',
    'canli-fiyatlar/index.html'
]

new_elite_menu = '''<div class="nav-dropdown-menu nav-dropdown-mega nav-dropdown-elite">
            <div class="nav-dropdown-header" style="background:linear-gradient(90deg, #111413 0%, #1A2120 100%); color:#FFFFFF; border-bottom:1px solid rgba(194, 167, 104, 0.3);">
              <span>👑 HAUTE HORLOGERIE • 5 SAAT EVİ</span>
              <a href="/elit-kategori/" data-page="elit-kategori" data-filter="all" style="color:var(--color-gold);">Tüm Elit Saatleri Gör →</a>
            </div>
            <div class="nav-dropdown-grid">
              <a href="/elit-kategori/" data-page="elit-kategori" data-filter="all" class="nav-sub-brand-item nav-all-item" style="border-color:var(--color-gold);">
                <span class="nav-sub-brand-name">⭐ TÜM ELİT SAATLER</span>
                <span class="nav-sub-brand-tag">5 Marka İkonik Modeller</span>
              </a>
              <a href="/elit-kategori/?marka=Rolex" data-page="elit-kategori" data-filter="Rolex" class="nav-sub-brand-item">
                <span class="nav-sub-brand-name">👑 Rolex</span>
                <span class="nav-sub-brand-tag">Submariner, Daytona, GMT</span>
              </a>
              <a href="/elit-kategori/?marka=TAG%20Heuer" data-page="elit-kategori" data-filter="TAG Heuer" class="nav-sub-brand-item">
                <span class="nav-sub-brand-name">TAG Heuer</span>
                <span class="nav-sub-brand-tag">Carrera, Monaco</span>
              </a>
              <a href="/elit-kategori/?marka=Cartier" data-page="elit-kategori" data-filter="Cartier" class="nav-sub-brand-item">
                <span class="nav-sub-brand-name">Cartier</span>
                <span class="nav-sub-brand-tag">Santos, Tank, Ballon Bleu</span>
              </a>
              <a href="/elit-kategori/?marka=Rado" data-page="elit-kategori" data-filter="Rado" class="nav-sub-brand-item">
                <span class="nav-sub-brand-name">Rado</span>
                <span class="nav-sub-brand-tag">Captain Cook, True Square</span>
              </a>
              <a href="/elit-kategori/?marka=Tissot" data-page="elit-kategori" data-filter="Tissot" class="nav-sub-brand-item">
                <span class="nav-sub-brand-name">Tissot</span>
                <span class="nav-sub-brand-tag">PRX, Seastar, Le Locle</span>
              </a>
            </div>
          </div>
        </li>'''

new_mobile_elite = '''<!-- 0. Elit Kategori Akordeon (HAUTE HORLOGERIE 5 MARKA) -->
      <div style="margin-bottom:8px;">
        <button class="mobile-nav-accordion-header" onclick="this.nextElementSibling.classList.toggle('open'); this.querySelector('.acc-arr').textContent = this.nextElementSibling.classList.contains('open') ? '▴' : '▾';" style="background:#111413; color:#E6D2A8; border:1px solid rgba(194,167,104,0.4); font-weight:800;">
          <span>👑 ELİT KATEGORİ</span>
          <span class="acc-arr">▾</span>
        </button>
        <div class="mobile-nav-accordion-sub">
          <a href="/elit-kategori/" data-page="elit-kategori" data-filter="all" class="mobile-nav-sub-link" style="color:var(--color-gold); font-weight:700;">⭐ TÜMÜ (5 Marka)</a>
          <a href="/elit-kategori/?marka=Rolex" data-page="elit-kategori" data-filter="Rolex" class="mobile-nav-sub-link">👑 Rolex</a>
          <a href="/elit-kategori/?marka=TAG%20Heuer" data-page="elit-kategori" data-filter="TAG Heuer" class="mobile-nav-sub-link">TAG Heuer</a>
          <a href="/elit-kategori/?marka=Cartier" data-page="elit-kategori" data-filter="Cartier" class="mobile-nav-sub-link">Cartier</a>
          <a href="/elit-kategori/?marka=Rado" data-page="elit-kategori" data-filter="Rado" class="mobile-nav-sub-link">Rado</a>
          <a href="/elit-kategori/?marka=Tissot" data-page="elit-kategori" data-filter="Tissot" class="mobile-nav-sub-link">Tissot</a>
        </div>
      </div>'''

for fname in files_to_patch:
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r'<div class="nav-dropdown-menu nav-dropdown-mega nav-dropdown-elite">[\s\S]*?</div>\s*</li>', new_elite_menu, content)
        content = re.sub(r'<!-- 0\. Elit Kategori Akordeon[\s\S]*?<div class="mobile-nav-accordion-sub">[\s\S]*?</div>\s*</div>', new_mobile_elite, content)
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
