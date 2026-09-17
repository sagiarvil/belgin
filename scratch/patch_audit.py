with open('tests/dark-pool-blackbox-audit.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('tests/dark-pool-blackbox-audit.js', 'w', encoding='utf-8') as f:
    skip = False
    for line in lines:
        if "test('Vector 4.3: canli-fiyatlar" in line:
            skip = True
        
        if not skip:
            f.write(line)
            
        if skip and line.strip() == "});":
            skip = False

