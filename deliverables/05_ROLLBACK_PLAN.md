# 05. GÜVENLİ GERİ ALMA PLANI (ROLLBACK PLAN)
Herhangi bir gerileme veya acil durumda:
1. Edge CDN seviyesinde Cloudflare Worker devre dışı bırakılabilir (Fail-Open passthrough).
2. Git ile önceki sürüme dönme: `git checkout HEAD~1 -- index.html scripts/`
3. Firebase Hosting rollback: `firebase hosting:rollback`
