---
name: ag-db-redis
description: db-redis reference
---

# Redis — Motor Notları (anahtar-değer / bellek içi)

## Kullanım alanı
- Cache, oturum, rate limit, kuyruk (Streams/List), sayaç, leaderboard (Sorted Set), pub/sub, dağıtık kilit, geçici veri.
- Birincil kalıcı veritabanı olarak kullanma (RDB/AOF olsa da) — kaynak-of-truth ayrı.

## Anahtar & tip
- Anahtar adlandırma: `app:entity:id:field` (namespace + `:`), tutarlı, tahmin edilebilir. Çok uzun anahtar bellek yer.
- Tipler: String, Hash (obje alanları), List (kuyruk/stack), Set, Sorted Set (skor/sıra), Stream (event log + consumer group), Bitmap, HyperLogLog, Geo.
- Hash büyük objeler için String(JSON)'dan iyi (kısmi güncelleme, bellek). Küçük hash/list/set "ziplist/listpack" ile çok verimli.

## TTL & bellek
- Cache anahtarına **daima `EXPIRE`** ver (sızıntı önler). Jitter ekle (aynı anda toplu expire = "cache stampede").
- `maxmemory` + politika: cache için `allkeys-lru`/`allkeys-lfu`; kalıcı veri karışıksa `volatile-lru`.
- Cache stampede: mutex/lock ile tek yenileme, veya erken yenileme (probabilistic early expiration).
- Büyük anahtar (bigkey) / çok elemanlı koleksiyon → parçala; `SCAN` (asla `KEYS` prod'da).

## Komut / performans
- Tek thread — O(N) komutlar (`SMEMBERS`, `HGETALL` büyük, `KEYS`, `LRANGE 0 -1`) sunucuyu bloklar. Kısıtlı aralık / `SCAN` aileleri kullan.
- Pipeline (round-trip azalt), `MGET`/`MSET`. Atomik çok adım: `MULTI/EXEC` veya Lua script (tek atomik, race yok).
- Rate limit / kilit: Lua veya `SET key val NX PX ttl` (kilit) + Redlock dikkatli; sahiplik token'ı ile serbest bırak.

## Dayanıklılık & topoloji
- Persistence: RDB (snapshot) + AOF (`appendfsync everysec`) birlikte. Sadece cache ise kapatılabilir.
- HA: Sentinel (failover) veya Redis Cluster (sharding, `CROSSSLOT` kısıtı — aynı slot için `{hashtag}`).
- Güvenlik: `requirepass`/ACL, TLS, `rename-command` tehlikeli komutlar (`FLUSHALL`, `CONFIG`), ağ bind.
- İzleme: `INFO`, `SLOWLOG`, `LATENCY`, `redis-cli --bigkeys`, bellek fragmentasyon oranı.
