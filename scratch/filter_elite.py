import re
import json

with open('js/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the ELITE_WATCH_BRANDS array and parse it, then filter it.
start_idx = content.find('const ELITE_WATCH_BRANDS = [')
if start_idx != -1:
    end_idx = content.find('];\n', start_idx) + 1
    array_str = content[start_idx + len('const ELITE_WATCH_BRANDS = '):end_idx]
    
    # Actually, it's easier to use a regex to remove objects that are not in the allowed list
    allowed_brands = ["Rolex", "TAG Heuer", "Cartier", "Rado", "Tissot"]
    
    import ast
    try:
        # replace boolean or other js syntax if necessary, but it's pure json-like
        parsed = json.loads(array_str)
        filtered = [b for b in parsed if b['name'] in allowed_brands]
        new_array_str = json.dumps(filtered, indent=2, ensure_ascii=False)
        content = content[:start_idx] + 'const ELITE_WATCH_BRANDS = ' + new_array_str + content[end_idx:]
    except Exception as e:
        print("Parse error:", e)

with open('js/data.js', 'w', encoding='utf-8') as f:
    f.write(content)
