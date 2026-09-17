import re

js_path = '/Users/macair1/projects/belgin/functions/index.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# find "const { EarsivPortalService... } = require('./earsiv-service');"
earsiv_req = "const { EarsivPortalService, calculateJewelryInvoiceBreakdown, cleanInvoiceProductName, getCleanInvoiceItemsSummary } = require('./earsiv-service');"
init_app = "if (!admin.apps.length) admin.initializeApp();"

if earsiv_req in js and init_app in js:
    # Remove from top
    js = js.replace(earsiv_req + "\n", "")
    js = js.replace(earsiv_req, "")
    
    # Add after init_app
    js = js.replace(init_app, init_app + "\n" + earsiv_req)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("index.js patched!")
