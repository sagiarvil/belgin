import re

js_path = '/Users/macair1/projects/belgin/functions/earsiv-service.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

read_from_fs = """  async getActiveToken() {
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

js = js.replace("  async getActiveToken() {\n    const now = Date.now();", read_from_fs)

# Also fix the expiry variable assignment
save_to_fs = """        cachedTokenExpiresAt = Date.now() + 20 * 60 * 1000;
        try {
          await db.collection('settings').doc('gib_session').set({
            token: cachedSessionToken,
            cookie: cachedCookie,
            expiresAt: cachedTokenExpiresAt
          });
        } catch(e) { console.error('Token save err', e); }"""

js = js.replace("        cachedTokenExpiresAt = Date.now() + 20 * 60 * 1000;", save_to_fs)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Auth Patched successfully!")
