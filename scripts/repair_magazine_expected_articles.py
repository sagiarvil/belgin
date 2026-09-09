#!/usr/bin/env python3
"""Self-heal fresh Chrono24 articles discovered by the independent RSS contract.

Discovery/freshness comes from Chrono24's first-party static RSS. The canonical article parser is
reused unchanged. For full article HTML the session tries the canonical .com URL first and then
the user-facing first-party Turkish locale (.com.tr). No third-party relay/proxy is used.
"""

from __future__ import annotations

import json
import os
import re
import runpy
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
// Sürüm: 2026-09-09 (Fail-Closed + First-Party Self-Healing Sync)
// ==========================================================

const MAGAZINE_ARTICLES = {payload};

if (typeof window !== 'undefined') {{
  window.MAGAZINE_ARTICLES = MAGAZINE_ARTICLES;
}}
if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ MAGAZINE_ARTICLES }};
}}
"""
    DATA_JS.write_text(content, encoding="utf-8")


class FirstPartyLocaleSession:
    """Session facade for the canonical scraper with a fixed Chrono24 locale fallback.

    This is not a generic proxy and cannot fetch arbitrary alternate hosts. Only
    https://www.chrono24.com/magazine/* is rewritten to the matching
    https://www.chrono24.com.tr/magazine/* URL after a failed canonical request.
    """

    def __init__(self, requests_module):
        self._session = requests_module.Session()
        self.headers = self._session.headers
        self.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.7,en;q=0.6",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        })
        self.last_article_transport = "none"
        self.last_article_statuses: list[str] = []

    def get(self, url, *args, **kwargs):
        target = str(url)
        is_article = target.startswith("https://www.chrono24.com/magazine/") and "-p_" in target
        if not is_article:
            return self._session.get(url, *args, **kwargs)

        request_kwargs = dict(kwargs)
        request_kwargs.setdefault("timeout", 20)
        statuses: list[str] = []

        try:
            direct = self._session.get(target, *args, **request_kwargs)
            statuses.append(f"com={direct.status_code}")
            if direct.status_code == 200 and direct.text:
                self.last_article_transport = "chrono24.com"
                self.last_article_statuses = statuses
                return direct
        except Exception as exc:
            statuses.append(f"com={type(exc).__name__}")

        tr_target = re.sub(r"^https://www\.chrono24\.com/", "https://www.chrono24.com.tr/", target)
        try:
            tr_response = self._session.get(tr_target, *args, **request_kwargs)
            statuses.append(f"com.tr={tr_response.status_code}")
            self.last_article_transport = "chrono24.com.tr" if tr_response.status_code == 200 else "blocked"
            self.last_article_statuses = statuses
            return tr_response
        except Exception as exc:
            statuses.append(f"com.tr={type(exc).__name__}")
            self.last_article_transport = "failed"
            self.last_article_statuses = statuses
            raise


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

    lib = runpy.run_path(str(SYNC_ENGINE), run_name="belgin_magazine_sync_lib")
    scrape = lib.get("scrape_single_article")
    requests_module = lib.get("requests")
    if not callable(scrape) or requests_module is None:
        fail("Primary scraper function could not be loaded")

    session = FirstPartyLocaleSession(requests_module)
    repaired: list[str] = []
    failures: list[str] = []
    for meta in missing:
        aid = str(meta.get("id") or "unknown")
        url = str(meta.get("url") or "")
        if not url:
            failures.append(f"{aid}: RSS snapshot URL missing")
            continue
        try:
            article = scrape(session, url)
        except Exception as exc:
            failures.append(
                f"{aid}: canonical scraper exception {type(exc).__name__}: {exc}; "
                f"transport={session.last_article_transport}; statuses={','.join(session.last_article_statuses)}"
            )
            continue
        if not article:
            failures.append(
                f"{aid}: canonical scraper returned no article; "
                f"transport={session.last_article_transport}; statuses={','.join(session.last_article_statuses)}"
            )
            continue
        if str(article.get("id")) != aid:
            failures.append(f"{aid}: scraper returned mismatched id {article.get('id')}")
            continue
        articles.append(article)
        existing_ids.add(aid)
        repaired.append(aid)
        print(
            f"  REPAIRED {aid} | transport={session.last_article_transport} | "
            f"{article.get('title', '')}"
        )

    if failures:
        fail("; ".join(failures))
    if repaired:
        write_articles(articles)
    print(f"MAGAZINE_SELF_HEAL=PASS expected_new={len(expected)} repaired={len(repaired)}")


if __name__ == "__main__":
    main()
