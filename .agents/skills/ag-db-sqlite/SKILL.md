---
name: ag-db-sqlite
description: db-sqlite reference
---

# SQLite — Motor Notları

## Ne zaman uygun
- Gömülü, tek dosya, düşük-orta eşzamanlılık (çoğunlukla okuma). Mobil, masaüstü, testler, küçük web.
- Ağ dosya sistemi (NFS/SMB) üzerinde kullanma. Yüksek yazma eşzamanlılığı → sunucu DB.

## Ayarlar (zorunlu)
- `PRAGMA journal_mode=WAL;` (eşzamanlı okuma+yazma, çok daha iyi). `PRAGMA synchronous=NORMAL;` (WAL ile güvenli/hızlı).
- `PRAGMA foreign_keys=ON;` — her bağlantıda! (varsayılan kapalı).
- `PRAGMA busy_timeout=5000;` (kilit beklemede hemen SQLITE_BUSY atmasın).
- `PRAGMA temp_store=MEMORY;`, gerekiyorsa `mmap_size`.

## Tipler (dinamik tipleme)
- Depolama sınıfları: NULL, INTEGER, REAL, TEXT, BLOB. Sütun "type affinity" verir, zorlamaz.
- Tarih: `TEXT` ISO-8601 (`YYYY-MM-DD HH:MM:SS`) veya `INTEGER` unix epoch. Tutarlı seç.
- Para: tamsayı kuruş (INTEGER) veya TEXT; REAL kullanma.
- Boolean = INTEGER 0/1.
- `STRICT` tablolar (3.37+) — gerçek tip zorlaması, tercih et. `WITHOUT ROWID` küçük PK'lı tablolarda.
- JSON: `json1` (yerleşik) — `json_extract`, `->`, `->>`; generated column + indeks ile sorgula.

## İndeks / sorgu
- B-tree. Bileşik indeks önek kuralı. Kısmi indeks (`WHERE`), ifade indeksi.
- `rowid` gizli PK (INTEGER PRIMARY KEY ona takma ad). Covering indeks çalışır.
- `EXPLAIN QUERY PLAN`. `ANALYZE` istatistik. FTS5 tam metin için.

## Transaction / eşzamanlılık
- Tek yazar (dosya seviyesinde). WAL ile okurlar yazarı bloklamaz, ama iki yazar sıralanır.
- `BEGIN IMMEDIATE` yazma niyetli transaction'da (deadlock/`BUSY` riskini azaltır).
- Toplu insert'i tek transaction'a sar (yoksa her satır fsync — 100x yavaş).

## Migration / bakım
- `ALTER TABLE` sınırlı: ADD COLUMN, RENAME, DROP COLUMN (3.35+). Kolon tipi/kısıt değişimi = yeni tablo + kopya + rename (12 adımlı resmi yordam) — FK'ları geçici kapat.
- `VACUUM` dosyayı küçültür (kilit; `auto_vacuum=INCREMENTAL` + `PRAGMA incremental_vacuum`).
- Yedek: `.backup` / VACUUM INTO / dosya kopyası (yalnız WAL checkpoint sonrası, tercihen online backup API).
