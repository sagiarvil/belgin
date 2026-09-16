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

# 1. Remove the `<div class="hero-answer-engine"...>...</div>` block
# Notice that some are wrapped in `<div class="container-art">` maybe?
# The regex should find `<div class="hero-answer-engine"[^>]*>...</div>` 
# Since there could be multiple or they could be multi-line, we use a robust regex or just regex to strip the block.

def remove_hero_answer_engine(content):
    # This regex matches from <div class="hero-answer-engine" up to its closing </div>
    # It assumes the div has no nested divs, but wait, it does! (hero-answer-engine-badge, hero-answer-engine-meta)
    # We can match up to </a>\s*</div>\s*</div> or similar.
    # Alternatively, just remove any block starting with <div class="hero-answer-engine" and ending with the next closing </div>\s*</div>
    
    # A simpler way: we know it contains "hero-answer-engine-badge" and ends with "</div>\n    </div>"
    # Let's write a simple nested tag parser, or just use a regex that matches the known structure.
    
    pattern = r'<div class="hero-answer-engine"[^>]*>[\s\S]*?<a href="[^"]+" class="hero-answer-engine-llm-link"[^>]*>[\s\S]*?</a>\s*</div>\s*</div>'
    content = re.sub(pattern, '', content)
    
    # Also remove the footer one which looks like: <div class="hero-answer-engine" data-registry-route="/" style="border-top:1px solid ...> ... </div>
    pattern_footer = r'<div class="hero-answer-engine"[^>]*style="border-top[^>]*>[\s\S]*?</div>'
    content = re.sub(pattern_footer, '', content)
    
    return content

def fix_modal_script(content):
    old_script = """// Her girişte garantili açılma
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(showCorporatePolicyModal, 400);
  });
} else {
  setTimeout(showCorporatePolicyModal, 400);
}"""
    
    new_script = """// 24 saatte bir göster (rahatsız etmemek için)
function shouldShowPolicyModal() {
  var lastSeen = localStorage.getItem('policyModalLastSeen');
  if (!lastSeen) return true;
  var now = new Date().getTime();
  // 24 saat = 24 * 60 * 60 * 1000 = 86400000 ms
  return (now - parseInt(lastSeen, 10)) > 86400000;
}

if (shouldShowPolicyModal()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(showCorporatePolicyModal, 400);
    });
  } else {
    setTimeout(showCorporatePolicyModal, 400);
  }
}"""
    
    # We also need to patch closeCorporatePolicyModal to set the item.
    old_close = """function closeCorporatePolicyModal() {
  var modal = document.getElementById('corporatePolicyNoticeModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(function() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 320);
  }
}"""

    new_close = """function closeCorporatePolicyModal() {
  var modal = document.getElementById('corporatePolicyNoticeModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(function() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      localStorage.setItem('policyModalLastSeen', new Date().getTime().toString());
    }, 320);
  }
}"""
    
    content = content.replace(old_script, new_script)
    content = content.replace(old_close, new_close)
    return content

for fname in files_to_patch:
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = remove_hero_answer_engine(content)
        content = fix_modal_script(content)
        
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {fname}")

