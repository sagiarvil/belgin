import re

js_path = '/Users/macair1/projects/belgin/js/admin.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Revert fetch URLs back to relative paths
js = re.sub(r"fetch\('https://us-central1-carbon-web-1265b\.cloudfunctions\.net/adminInvoiceApi/api/admin/invoice/([^\']+)'", r"fetch('/api/admin/invoice/\1'", js)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("admin.js URLs reverted!")
