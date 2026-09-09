#!/usr/bin/env python3
"""Self-heal fresh Chrono24 articles discovered by the independent upstream contract.

The primary sync engine remains the canonical importer. This recovery layer only acts when the
preflight contract discovered an eligible fresh article that the primary discovery pass missed.
It reuses the primary engine's own scrape/translation function rather than maintaining a second
content implementation.
"""

from __future__ import annotations

import json
import os
import re
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / "js" / "magazine_data.js"
SYNC_ENGINE = ROOT / "scripts" / "sync-magazine-articles.py"
SNAPSHOT = Path(os.environ.get("MAGAZINE_CONTRACT_SNAPSHOT", "/tmp/magazine-upstream-contract.json"))


def fail(detail: str) -> "None":
    print(f"::error title=Magazine Self-Heal Failed::{detail}")
    raise SystemExit(2)


def load_articles() -> list[dict]:
    if not DATA_JS.exists():
        fail(f"Missing {DATA_JS}")
    content = DATA_JS.read_text(encoding="utf-8")
    match = re.search(r"const\s+MAGAZINE_ARTICLES\s*=\s*(\[.*?\]);", content, re.DOTALL)
    if not match:
        fail("MAGAZINE_ARTICLES payload could not be parsed")
    try:
        data = json.loads(match.group(1))
    except Exception as exc:
        fail(f"MAGAZINE_ARTICLES JSON decode failed: {exc}")
    if not isinstance(data, list) or not data:
        fail("MAGAZINE_ARTICLES is empty; refusing destructive recovery")
    return data


def write_articles(articles: list[dict]) -> None:
    articles.sort(key=lambda a: (a.get("raw_date", "") or "", a.get("id", "") or ""), reverse=True)
    payload = json.dumps(articles, ensure_ascii=False, indent=2)
    content = f"""// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: 2026-09-09 (Fail-Closed + Self-Healing Sync)
// ==========================================================

const MAGAZINE_ARTICLES = {payload};

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ MAGAZINE_ARTICLES }};
}}
"""
    DATA_JS.write_text(content, encoding="utf-8")


def main() -> None:
    if not SNAPSHOT.exists():
        fail(f"Contract snapshot missing: {SNAPSHOT}")
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    expected = snapshot.get("expected") or []
    if not expected:
        print("MAGAZINE_SELF_HEAL=PASS expected_new=0 repaired=0")
        return

    articles = load_articles()
    existing_ids = {str(item.get("id", "")) for item in articles}
    missing = [meta for meta in expected if meta.get("id") not in existing_ids]
    if not missing:
        print(f"MAGAZINE_SELF_HEAL=PASS expected_new={len(expected)} repaired=0 primary_sync_complete=1")
        return

    if not SYNC_ENGINE.exists():
        fail(f"Primary sync engine missing: {SYNC_ENGINE}")

    # Load primary implementation without executing its main(). Functions retain the module globals.
    lib = runpy.run_path(str(SYNC_ENGINE), run_name="belgin_magazine_sync_lib")
    scrape = lib.get("scrape_single_article")
    requests = lib.get("requests")
    if not callable(scrape) or requests is None:
        fail("Primary scraper function could not be loaded")

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }
    )

    repaired: list[str] = []
    failures: list[str] = []
    for meta in missing:
        aid = str(meta.get("id") or "unknown")
        url = str(meta.get("url") or "")
        if not url:
            failures.append(f"{aid}: snapshot URL missing")
            continue
        try:
            article = scrape(session, url)
        except Exception as exc:
            failures.append(f"{aid}: scraper exception {type(exc).__name__}: {exc}")
            continue
        if not article:
            failures.append(f"{aid}: primary scraper returned no article")
            continue
        if str(article.get("id")) != aid:
            failures.append(f"{aid}: scraper returned mismatched id {article.get('id')}")
            continue
        articles.append(article)
        existing_ids.add(aid)
        repaired.append(aid)
        print(f"  REPAIRED {aid} | {article.get('title', '')}")

    if failures:
        fail("; ".join(failures))

    if repaired:
        write_articles(articles)
    print(f"MAGAZINE_SELF_HEAL=PASS expected_new={len(expected)} repaired={len(repaired)}")


if __name__ == "__main__":
    main()
