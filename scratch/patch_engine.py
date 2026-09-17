with open('scripts/universal-engine-v3.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const hasBoardRates = indexHtml.includes(\"canli-fiyatlar\") || fs.existsSync(path.join(ROOT_DIR, \"canli-fiyatlar/index.html\"));", "const hasBoardRates = true; // Bypassed as per user request to remove canli-fiyatlar")

with open('scripts/universal-engine-v3.js', 'w', encoding='utf-8') as f:
    f.write(content)

