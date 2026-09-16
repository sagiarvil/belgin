import re
with open('js/app.js', 'r', encoding='utf-8') as f:
    r_content = f.read()

r_content = re.sub(r'\'canli-fiyatlar\': "Piyasa Bilgileri \| Belgin Saat",\n?', '', r_content)
r_content = r_content.replace(', .nav-desktop [data-page="canli-fiyatlar"]', '')
r_content = r_content.replace('.mobile-drawer-nav [data-page="canli-fiyatlar"], ', '')
r_content = r_content.replace('\'page-mucevherat\', \'page-canli-fiyatlar\'', '\'page-mucevherat\'')
r_content = re.sub(r'if \(path === \'/canli-fiyatlar\' \|\| path === \'/canlipiyasalar\'\) return \{ page: \'canli-fiyatlar\' \};\n?', '', r_content)
r_content = re.sub(r'if \(page === \'canli-fiyatlar\'\) return \'/canli-fiyatlar/\';\n?', '', r_content)
r_content = re.sub(r'if \(hash === \'canli-fiyatlar\' \|\| hash === \'canlipiyasalar\'\) \{[\s\S]*?return \{ page: \'canli-fiyatlar\' \};\n\s*\}\n?', '', r_content)
r_content = re.sub(r'\'canli-fiyatlar\': \'/canli-fiyatlar/\',\n?', '', r_content)
r_content = re.sub(r'\'canlipiyasalar\': \'/canli-fiyatlar/\',\n?', '', r_content)
r_content = re.sub(r'if \(initialHash === \'canli-fiyatlar\' \|\| initialHash === \'canlipiyasalar\'\) \{[\s\S]*?return;\n\s*\}\n?', '', r_content)
r_content = re.sub(r'if \(page === \'canli-fiyatlar\'\) \{[\s\S]*?return;\n\s*\}\n\s*\}\n?', '', r_content)
r_content = re.sub(r'if \(hash === \'canli-fiyatlar\' \|\| hash === \'canlipiyasalar\'\) \{[\s\S]*?\} else if', 'if', r_content)
r_content = re.sub(r'document\.body\.classList\.toggle\(\'page-canli-fiyatlar\', page === \'canli-fiyatlar\'\);\n?', '', r_content)
r_content = re.sub(r'document\.body\.classList\.toggle\(\'page-is-canli-fiyatlar\', page === \'canli-fiyatlar\'\);\n?', '', r_content)
r_content = r_content.replace(' || page === \'canli-fiyatlar\'', '')
r_content = r_content.replace('page === \'canli-fiyatlar\' ? \'/canli-fiyatlar/\' : (page === \'mucevherat\' ?', 'page === \'mucevherat\' ?')
r_content = r_content.replace('(Örn: canli-fiyatlar sayfasındayken logoya tıklandı)', '')
r_content = re.sub(r'case \'canli-fiyatlar\':\n\s*this\.renderLivePricesPage\(\);\n\s*break;\n?', '', r_content)
r_content = re.sub(r'if \(Router\.currentPage === \'canli-fiyatlar\'\) this\.renderLivePricesPage\(\);\n?', '', r_content)
r_content = re.sub(r'renderLivePricesPage\(\) \{[\s\S]*?const container = document\.getElementById\(\'page-canli-fiyatlar\'\);[\s\S]*?\}\s*\}\s*\},', '', r_content)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(r_content)
    
with open('js/router.js', 'r', encoding='utf-8') as f:
    s_content = f.read()

s_content = re.sub(r'\} else if \(page === \'canli-fiyatlar\'\) \{[\s\S]*?\} else if', '} else if', s_content)

with open('js/router.js', 'w', encoding='utf-8') as f:
    f.write(s_content)

