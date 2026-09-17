with open('tests/test-price-band-animation.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("});\n});", "});")

with open('tests/test-price-band-animation.js', 'w', encoding='utf-8') as f:
    f.write(content)
