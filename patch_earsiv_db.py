import re

js_path = '/Users/macair1/projects/belgin/functions/earsiv-service.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace global db declaration
if "const db = admin.firestore();" in js:
    js = js.replace("const db = admin.firestore();", "const getDb = () => admin.apps.length ? admin.firestore() : null;")
    
    # Replace all 'db.collection' with 'getDb().collection'
    js = js.replace("await db.collection", "await getDb().collection")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("DB lazy Patched!")
