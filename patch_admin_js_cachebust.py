import re

js_path = '/Users/macair1/projects/belgin/js/admin.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace fetch URLs with a cache buster query parameter
js = js.replace("fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/draft',", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/draft?cb=1',")
js = js.replace("fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/batch-draft',", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/batch-draft?cb=1',")
js = js.replace("fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/send-sms',", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/send-sms?cb=1',")
js = js.replace("fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/batch-sign',", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/batch-sign?cb=1',")
js = js.replace("fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/sign',", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/sign?cb=1',")
js = js.replace("fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/cancel',", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/cancel?cb=1',")
js = js.replace("fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/force-logout',", "fetch('https://us-central1-carbon-web-1265b.cloudfunctions.net/adminInvoiceApi/api/admin/invoice/force-logout?cb=1',")

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("admin.js fetch URLs cache busted!")
