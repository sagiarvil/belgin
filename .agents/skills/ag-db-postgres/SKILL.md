---
name: ag-db-postgres
description: db-postgres reference
---

# PostgreSQL — Motor Notları

## Genel
- Sürüm güncel (14+). `search_path` bilinçli; şema kullan (`app`, `public` çöpe atma).
- Zaman: `timestamptz` (her zaman — `timestamp` without tz kullanma). Saat dilimi session'da, depolama UTC.
- `text` serbest kullan (VARCHAR ile perf farkı yok); sınır gerekiyorsa `CHECK (length(x) <= N)`.

## Tipler (güçlü yön)
- Para: `numeric(12,2)`. Kimlik: `bigint GENERATED ALWAYS AS IDENTITY` veya `uuid` (`gen_random_uuid()` / UUIDv7).
- `jsonb` (indekslenebilir, `->`, `->>`, `@>`, GIN indeks). `json` sadece ham saklama.
- `enum` tipi var ama değer ekleme/silme zahmetli → çoğu zaman `text` + `CHECK` veya lookup tablo.
- Dizi (`int[]`, `text[]`), `range`, `inet`, `tsvector` (tam metin), `citext` (case-insensitive), `hstore`.
- Kısmi + ifade indeksi first-class: `CREATE INDEX ... WHERE status='active'`, `CREATE INDEX ... ((lower(email)))`.

## İndeks
- Varsayılan B-tree. `GIN` (jsonb, dizi, tam metin), `GiST`/`SP-GiST` (geometri, range), `BRIN` (çok büyük, sıralı tablo — zaman serisi), `HASH` (eşitlik).
- Covering: `INCLUDE (col)`. Bileşik: eşitlik önce, aralık sonra.
- `CREATE INDEX CONCURRENTLY` (kilitsiz, transaction dışı) büyük tabloda zorunlu.
- `EXPLAIN (ANALYZE, BUFFERS)`. `pg_stat_user_indexes` kullanılmayan indeks, `pg_stat_statements` yavaş sorgu.

## Transaction / MVCC
- İzolasyon: `READ COMMITTED` (varsayılan) çoğu iş için; `REPEATABLE READ`/`SERIALIZABLE` gerektiğinde (serialization failure'ı retry et).
- MVCC → `UPDATE`/`DELETE` ölü satır bırakır; `autovacuum` ayarı önemli (büyük/yoğun tabloda agresifleştir). Tablo/indeks şişmesi (bloat) izle.
- `SELECT ... FOR UPDATE [SKIP LOCKED]` kuyruk deseni için ideal.
- DDL transaction'ludur (çoğu) — migration'ı tek transaction'da atomik yapabilirsin (CONCURRENTLY hariç).

## Migration tuzakları
- `ADD COLUMN` default'lu 11+ sürümde anlık; `NOT NULL` + default ayrı adım büyük tabloda.
- Tip değişimi tabloyu yeniden yazar → USING ile dikkat, büyük tabloda batch.
- `lock_timeout` + `statement_timeout` ayarla ki migration prod'u kilitlemesin.

## Performans
- `shared_buffers` ≈ RAM %25, `effective_cache_size` ≈ %60-75, `work_mem` sorgu başına dikkatli.
- Keyset pagination. `count(*)` tam tarama → `pg_class.reltuples` tahmini veya sayaç tablosu.
- Partisyonlama (declarative) çok büyük tabloda (zaman/aralık). `VACUUM ANALYZE` istatistik.
