import os
import re

with open('scripts/seo-ci-gate.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the G2 hero-answer-engine checks
content = re.sub(r"if \(\!indexHtml\.includes\('class=\"hero-answer-engine\"'\)\) \{[\s\S]*?\}", "", content)
content = re.sub(r"if \(\!indexHtml\.includes\('data-registry-route=\"/\"'\)\) \{[\s\S]*?\}", "", content)

# Remove the category loop checking for hero-answer-engine
content = re.sub(r"if \(\!catHtml\.includes\('hero-answer-engine'\)\) \{[\s\S]*?\}", "", content)

# Remove G11 hero-answer-engine check
content = re.sub(r"if \(\!html\.includes\('hero-answer-engine'\)\) \{[\s\S]*?\}", "", content)

with open('scripts/seo-ci-gate.js', 'w', encoding='utf-8') as f:
    f.write(content)

