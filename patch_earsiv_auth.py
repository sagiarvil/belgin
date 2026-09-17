import re

js_path = '/Users/macair1/projects/belgin/functions/earsiv-service.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

read_from_fs = """  async ensureAuthenticated() {
    try {
      const doc = await db.collection('settings').doc('gib_session').get();
      if (doc.exists) {
        const data = doc.data();
        if (data.token && data.expiresAt > Date.now()) {
          cachedSessionToken = data.token;
          cachedCookie = data.cookie;
          cachedTokenExpiresAt = data.expiresAt;
        }
      }
    } catch(e) { console.error('Token read err', e); }
    
    const now = Date.now();"""

js = js.replace("  async ensureAuthenticated() {\n    const now = Date.now();", read_from_fs)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Auth Patched!")
