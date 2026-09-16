import re

with open('scripts/generate-static-seo-pages.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. renderHeroAnswerEngine -> return ''
content = content.replace('function renderHeroAnswerEngine(routeOrItem) {', 'function renderHeroAnswerEngine(routeOrItem) {\n  return "";\n')

# 2. footer
content = re.sub(
    r'<div class="hero-answer-engine"[^>]*style="border-top:1px solid[^>]*>[\s\S]*?<a href="/llms/pages/[^"]+" class="hero-answer-engine-llm-link"[^>]*>Makine Özeti \(LLMS\) &rarr;</a>\n\s*</div>\n\s*</div>',
    '',
    content
)

# 3. magazin
content = re.sub(
    r'<div class="hero-answer-engine"[^>]*data-registry-route="/magazin/\$\{esc\(art\.slug\)\}/"[\s\S]*?<a href="/llms/pages/magazin\.md" class="hero-answer-engine-llm-link">Makine Özeti \(LLMS\) &rarr;</a>\n\s*</div>\n\s*</div>',
    '',
    content
)

# 4. PDP
content = re.sub(
    r'<!-- PDP HERO ANSWER ENGINE \(AEO / SSOT KÜNYE\) -->\s*<div class="hero-answer-engine"[\s\S]*?<a href="/llms/pages/elit-kategori\.md" class="hero-answer-engine-llm-link">Makine Özeti \(LLMS\) &rarr;</a>\n\s*</div>\n\s*</div>',
    '',
    content
)

with open('scripts/generate-static-seo-pages.js', 'w', encoding='utf-8') as f:
    f.write(content)
