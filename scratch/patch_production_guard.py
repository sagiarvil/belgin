import re

with open('scripts/production-guard.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific block
target = r"// 🛡️ CANLI FİYATLAR SARI SAYFA STRICT DESIGN GUARD.*?pass\('Canlı Fiyatlar mutabık kalınan saf sarı tek ekran dijital tabela koruması devrede \(PASS\)\.'\);"
content = re.sub(target, "// 🛡️ CANLI FİYATLAR REMOVED BY USER", content, flags=re.DOTALL)

with open('scripts/production-guard.js', 'w', encoding='utf-8') as f:
    f.write(content)
