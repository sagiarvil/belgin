import re

js_path = '/Users/macair1/projects/belgin/functions/index.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace allowedHeaders
js = js.replace("allowedHeaders: ['Content-Type'],", "allowedHeaders: ['Content-Type', 'x-admin-key'],")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("CORS patched in index.js")
