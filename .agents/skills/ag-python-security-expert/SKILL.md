---
name: ag-python-security-expert
description: python-security-expert reference
---

# Python Güvenlik Uzmanı — Uzmanlık Dökümanı

Kaynak: OWASP Top 10, OWASP ASVS. Rolü: Python kod güvenlik denetimi + düzeltme.

## Denetim listesi
### Injection
- SQL: ORM parametreli; ham SQL'de `text()` + bind param, string birleştirme YASAK. `.raw()`/`.extra()` dikkat.
- Komut: `subprocess` liste argümanla, `shell=True` YASAK. `os.system` yok.
- Şablon: Jinja2 autoescape açık; `| safe` sadece güvenilir. SSTI: kullanıcı girdisi template string'e girmez.
- Deserialization: `pickle`/`yaml.load` (full) kullanıcı verisiyle YASAK → `json` / `yaml.safe_load`.
- `eval`/`exec`/`__import__` kullanıcı verisiyle YASAK.

### Erişim / girdi
- IDOR: her kaynakta sahiplik filtresi (`.filter(owner=request.user)`).
- Girdi doğrulama Pydantic/serializer ile; tip + sınır + beyaz liste. Mass assignment: alan beyaz listesi.
- Path traversal: `Path`/`os.path` + kök kontrolü (`resolve().is_relative_to(base)`).

### Auth / session
- Şifre: `argon2`/`bcrypt` (passlib) — `hashlib.md5/sha1` YASAK.
- JWT: `exp`/`aud`/`iss` doğrula, güçlü secret / RS256; `algorithms` beyaz listesi (alg=none engeli).
- Session cookie: `HttpOnly`, `Secure`, `SameSite`. Django `SESSION_COOKIE_*`, `CSRF_COOKIE_*`.
- CSRF: Django middleware açık; DRF `SessionAuthentication` ile CSRF. FastAPI'de state değiştiren istekte token/origin kontrolü.
- Rate limit / brute-force koruması.

### Crypto / veri
- `secrets` modülü — `random` güvenlikte YASAK.
- Secret: env / `pydantic-settings` / vault; repoda değil. Loga PII/secret yazma.
- TLS zorunlu; `verify=False` (requests/httpx) YASAK.

### Yapılandırma
- `DEBUG=False` prod; `ALLOWED_HOSTS` dolu. Detaylı hata sızıntısı yok.
- Güvenlik header'ları (django-csp / secure headers): CSP, HSTS, X-Content-Type-Options, X-Frame-Options.
- CORS: origin beyaz listesi; `allow_origins=["*"]` + credentials YASAK.

### Dosya / bağımlılık
- Yükleme: uzantı+MIME+magic byte, boyut sınırı, kök dışı, rastgele ad, çalıştırılabilir engeli.
- `pip-audit` / `safety` — bilinen açık. Kilit dosyası hash'li. Tedarik zinciri (typosquat) kontrolü.

## Araç
- `bandit -r` (statik güvenlik), `semgrep --config p/python`, `pip-audit`.

## Çıktı
- `dosya:satır` · OWASP kategorisi · risk · sömürü senaryosu · düzeltme (Python). Sadece doğrulananlar. `bug-hunter` ile eşleştir.
