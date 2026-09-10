---
name: ag-node-security-expert
description: node-security-expert reference
---

# Node.js Güvenlik Uzmanı — Uzmanlık Dökümanı

Kaynak: OWASP Top 10, OWASP NodeJS Security Cheat Sheet. Rolü: Node/TS kod güvenlik denetimi + düzeltme.

## Denetim listesi
### Injection
- SQL: Prisma/Drizzle/parametreli sorgu; `$queryRawUnsafe`/string birleştirme YASAK.
- NoSQL (Mongo): kullanıcı objesini doğrudan query'ye koyma (`{ $where }`, operatör enjeksiyonu) — şema doğrula, `sanitize`.
- Komut: `child_process.execFile` liste argümanla; `exec`/`shell` + string YASAK.
- Prototype pollution: kullanıcı JSON'unu `Object.assign`/merge ile derinlemesine birleştirme; `__proto__`/`constructor` anahtarlarını ele. Güvenli merge kütüphanesi.
- `eval`/`new Function`/`vm` kullanıcı verisiyle YASAK.

### Erişim / girdi
- IDOR: her kaynakta sahiplik kontrolü. Route guard / policy.
- Girdi doğrulama zod/valibot; tip+sınır+beyaz liste. Mass assignment: DTO whitelist, `req.body` doğrudan model'e değil.
- Path traversal: `path.resolve` + kök kontrolü.
- ReDoS: kullanıcı girdisiyle katastrofik regex; güvenli desen / timeout.

### Auth / session
- Şifre: `argon2`/`bcrypt` uygun cost — düz/`crypto.createHash('md5')` YASAK.
- JWT: `algorithms: ['RS256'|'HS256']` sabit (alg confusion/none engeli), `exp`/`aud`/`iss` doğrula, secret güçlü. Refresh token rotasyonu.
- Cookie: `httpOnly`, `secure`, `sameSite`. Session store kalıcı (Redis) çok sunucuda.
- CSRF: state değiştiren istekte token/double-submit veya `SameSite=Strict` + origin kontrolü.
- Rate limit (`express-rate-limit`/`@fastify/rate-limit`), brute-force lockout.

### Crypto / veri
- `crypto.randomBytes`/`randomInt` — `Math.random()` güvenlikte YASAK.
- Secret: env + şema doğrulama; `.env` repoda değil. Loga PII/secret yazma (pino redact).
- TLS: `rejectUnauthorized: false` YASAK.

### Yapılandırma / header
- `helmet` (CSP, HSTS, noSniff, frameguard, referrerPolicy).
- CORS: origin beyaz listesi; `origin: true`/`*` + credentials YASAK.
- Hata: prod'da stack trace sızdırma yok; merkezi handler.
- `NODE_ENV=production`. Gereksiz debug endpoint kapalı.

### Bağımlılık / tedarik zinciri
- `npm audit` / `pnpm audit` / `osv-scanner`. Kilit dosyası sabit. `npm ci` (install değil).
- Postinstall script'li şüpheli paket, typosquat kontrolü. `--ignore-scripts` değerlendir.

## Araç
- `npm audit`, `eslint-plugin-security`, `semgrep --config p/javascript`, `osv-scanner`.

## Çıktı
- `dosya:satır` · OWASP kategorisi · risk · sömürü senaryosu · düzeltme (TS/JS). Sadece doğrulananlar. `bug-hunter` ile eşleştir.
