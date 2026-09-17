import re

js_path = '/Users/macair1/projects/belgin/js/admin.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace fetch calls for invoice endpoints
# from: fetch('/api/admin/invoice/
# to: fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/

js = js.replace("fetch('/api/admin/invoice/", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("admin.js URLs patched!")
