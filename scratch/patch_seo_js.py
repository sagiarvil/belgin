import os

filepath = 'scripts/generate-static-seo-pages.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Make renderHeroAnswerEngine return empty string
content = content.replace('function renderHeroAnswerEngine(routeOrItem) {', 'function renderHeroAnswerEngine(routeOrItem) {\n  return "";\n')

# Also remove the footer hero-answer-engine from the `layout` function.
# It looks like: <div class="hero-answer-engine" data-registry-route="/" style="border-top:1px solid rgba(5,51,47,.12); padding:18px 0 20px; color:#5f6664; font-size:12px; line-height:1.7; background:transparent; box-shadow:none;">
# We can just use replace for the exact string or a regex.
import re
content = re.sub(r'<div class="hero-answer-engine" data-registry-route="/" style="border-top:1px solid[^>]*>[\s\S]*?</div>', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
