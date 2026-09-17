import re

js_path = '/Users/macair1/projects/belgin/functions/index.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace all 'await earsiv.login()' with 'await earsiv.getActiveToken()'
js = js.replace('await earsiv.login()', 'await earsiv.getActiveToken()')

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("index.js login Patched!")
