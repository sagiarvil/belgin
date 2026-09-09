#!/usr/bin/env python3
"""Fail-closed contract for Chrono24 -> Belgin Magazine synchronization.

The contract deliberately does not trust the primary scraper. Chrono24 currently returns HTTP
403 to GitHub-hosted runners, so Chrono24 reads use two transports in order:
  1) direct curl-impersonated request
  2) Jina Reader (https://r.jina.ai/<target-url>) rendered-HTML read-through fallback

Phases:
  pre  : discover fresh eligible articles and persist the exact expected set
  post : prove every expected article exists in data + static SEO page + sitemap
  live : prove the deployed production data and article routes contain the expected set
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from curl_cffi import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / "js" / "magazine_data.js"
SITEMAP = ROOT / "sitemap-magazine.xml"
SNAPSHOT = Path(os.environ.get("MAGAZINE_CONTRACT_SNAPSHOT", "/tmp/magazine-upstream-contract.json"))
BASE = "https://www.chrono24.com"
LIVE_BASE = "https://www.belginkuyumculuk.com"
READER_BASE = "https://r.jina.ai/"

SOURCES = [
    f"{BASE}/magazine/",
    f"{BASE}/magazine/index.htm",
    f"{BASE}/magazine/category/watch-market/",
    f"{BASE}/magazine/category/watch-guide/",
    f"{BASE}/magazine/category/watch-trends/",
    f"{BASE}/magazine/category/top-10-watches/",
    f"{BASE}/magazine/category/lifestyle/",
]

BLOCKED_IDS = {"mag-180505", "mag-177236"}
BLOCKED_RE = re.compile(
    r"(?i)staff|picks|team|author|employee|favorite-watches|steiert|gehrlein|breining|gtg|rolex-report|chronopulse"
)
ARTICLE_ID_RE = re.compile(r"-p_(\d+)(?:/|$|[?#])")
ABS_ARTICLE_RE = re.compile(
    r"https?://(?:www\.)?chrono24\.com/magazine/[^\s\]\)\"'<>]+?-p_\d+/?(?:\?[^\s\]\)]*)?",
    re.I,
)


def fail(title: str, detail: str, code: int = 2) -> "None":
    print(f"::error title={title}::{detail}")
    raise SystemExit(code)


def make_session():
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }
    )
    return session


def _request(session, url: str, attempts: int, timeout: int, impersonate: bool = False, headers=None) -> str:
    last = "unknown"
    for attempt in range(1, attempts + 1):
        try:
            kwargs = {"timeout": timeout, "headers": headers or {}}
            if impersonate:
                kwargs["impersonate"] = "chrome124"
            response = session.get(url, **kwargs)
            if response.status_code == 200 and response.text:
                return response.text
            last = f"HTTP {response.status_code}"
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        if attempt < attempts:
            time.sleep(attempt * 2)
    raise RuntimeError(f"{url} -> {last}")


def fetch_document(session, url: str, attempts: int = 3, timeout: int = 25) -> tuple[str, str]:
    """Fetch a URL and return (HTML body, transport).

    Belgin production URLs are always read directly. Chrono24 gets one direct attempt, then
    Reader returns documentElement.outerHTML through a browser-rendered fetch. Keeping the
    fallback in HTML means the canonical BeautifulSoup parser stays unchanged.
    """
    is_chrono = url.startswith("https://www.chrono24.com/") or url.startswith("http://www.chrono24.com/")
    try:
        body = _request(session, url, 1 if is_chrono else attempts, timeout, impersonate=True)
        return body, "direct"
    except Exception as direct_exc:
        if not is_chrono:
            raise
        reader_url = f"{READER_BASE}{url}"
        try:
            body = _request(
                session,
                reader_url,
                attempts,
                max(timeout, 30),
                impersonate=False,
                headers={
                    "X-Respond-With": "html",
                    "X-No-Cache": "true",
                    "X-Engine": "browser",
                    "X-Respond-Timing": "resource-idle",
                },
            )
            if "<html" not in body.lower() and "<body" not in body.lower():
                raise RuntimeError("Reader returned non-HTML payload")
            return body, "reader-html"
        except Exception as reader_exc:
            raise RuntimeError(f"direct={direct_exc}; reader={reader_exc}") from reader_exc


def fetch_text(session, url: str, attempts: int = 3, timeout: int = 25) -> str:
    return fetch_document(session, url, attempts=attempts, timeout=timeout)[0]


def article_id_from_url(url: str) -> str | None:
    match = ARTICLE_ID_RE.search(url)
    return f"mag-{match.group(1)}" if match else None


def numeric_id(article_id: str) -> int:
    match = re.search(r"(\d+)$", article_id or "")
    return int(match.group(1)) if match else -1


def _normalize_article_url(value: str) -> str | None:
    if not value:
        return None
    value = value.strip().rstrip(".,;:!\"")
    full = urljoin(BASE, value).split("#", 1)[0]
    if "/magazine/" not in full or not article_id_from_url(full):
        return None
    return full


def extract_article_urls(document: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    soup = BeautifulSoup(document, "html.parser")
    for anchor in soup.find_all("a", href=True):
        full = _normalize_article_url(anchor.get("href", ""))
        if full and full not in seen:
            seen.add(full)
            found.append(full)
    # Defensive fallback in case a relay preserves raw absolute URLs outside anchors.
    for match in ABS_ARTICLE_RE.finditer(document):
        full = _normalize_article_url(match.group(0))
        if full and full not in seen:
            seen.add(full)
            found.append(full)
    return found


def parse_local_articles(path: Path = DATA_JS) -> list[dict]:
    if not path.exists():
        fail("Magazine data missing", f"Required file not found: {path}")
    content = path.read_text(encoding="utf-8")
    match = re.search(r"const\s+MAGAZINE_ARTICLES\s*=\s*(\[.*?\]);", content, re.DOTALL)
    if not match:
        fail("Magazine data invalid", "MAGAZINE_ARTICLES JSON payload could not be parsed")
    try:
        data = json.loads(match.group(1))
    except Exception as exc:
        fail("Magazine data invalid", f"MAGAZINE_ARTICLES JSON decode failed: {exc}")
    if not isinstance(data, list) or not data:
        fail("Magazine data empty", "MAGAZINE_ARTICLES is empty; refusing a destructive sync")
    return data


def metadata_from_article_document(url: str, document: str, transport: str = "direct") -> dict:
    soup = BeautifulSoup(document, "html.parser")
    headline = ""
    published = ""
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            payload = json.loads(script.string or "null")
        except Exception:
            continue
        candidates = []
        if isinstance(payload, dict):
            candidates.append(payload)
            graph = payload.get("@graph")
            if isinstance(graph, list):
                candidates.extend(item for item in graph if isinstance(item, dict))
        elif isinstance(payload, list):
            candidates.extend(item for item in payload if isinstance(item, dict))
        for item in candidates:
            kind = item.get("@type")
            kinds = kind if isinstance(kind, list) else [kind]
            if any(k in {"Article", "BlogPosting", "NewsArticle"} for k in kinds):
                headline = str(item.get("headline") or headline).strip()
                published = str(item.get("datePublished") or published)[:10]
                if headline:
                    break
        if headline:
            break
    if not headline:
        h1 = soup.find("h1")
        headline = h1.get_text(" ", strip=True) if h1 else ""
    if not published:
        time_tag = soup.find("time", attrs={"datetime": True})
        if time_tag:
            published = str(time_tag.get("datetime", ""))[:10]
    return {
        "id": article_id_from_url(url),
        "url": url,
        "headline": headline,
        "published": published,
        "transport": transport,
    }


def is_blocked_candidate(meta: dict) -> bool:
    article_id = meta.get("id") or ""
    haystack = f"{meta.get('url', '')} {meta.get('headline', '')}"
    return article_id in BLOCKED_IDS or bool(BLOCKED_RE.search(haystack))


def iso_date(value: str) -> date | None:
    try:
        return date.fromisoformat((value or "")[:10])
    except Exception:
        return None


def preflight() -> None:
    local = parse_local_articles()
    local_ids = {str(item.get("id", "")) for item in local}
    local_numeric_max = max((numeric_id(i) for i in local_ids), default=-1)
    local_dates = [iso_date(str(item.get("raw_date", ""))) for item in local]
    local_dates = [d for d in local_dates if d]
    latest_local_date = max(local_dates) if local_dates else None

    session = make_session()
    discovered: list[str] = []
    seen: set[str] = set()
    source_health: list[dict] = []
    for source in SOURCES:
        try:
            document, transport = fetch_document(session, source)
            urls = extract_article_urls(document)
            source_health.append({"url": source, "ok": True, "count": len(urls), "transport": transport})
            for url in urls:
                if url not in seen:
                    seen.add(url)
                    discovered.append(url)
        except Exception as exc:
            source_health.append({"url": source, "ok": False, "error": str(exc)})

    healthy = [item for item in source_health if item.get("ok") and item.get("count", 0) > 0]
    if not healthy:
        fail("Chrono24 upstream unavailable", f"No discovery source produced article URLs: {source_health}")
    if len(discovered) < 5:
        fail("Chrono24 discovery regression", f"Only {len(discovered)} article URLs discovered; expected at least 5")

    # Chrono24's numeric article ID is our freshness frontier. Historical intentionally-omitted
    # articles below the frontier never become false-positive recovery targets.
    priority_urls = []
    for url in discovered:
        aid = article_id_from_url(url) or ""
        if aid not in local_ids and numeric_id(aid) > local_numeric_max:
            priority_urls.append(url)

    expected: list[dict] = []
    inspection_errors: list[str] = []
    for url in priority_urls[:30]:
        aid = article_id_from_url(url) or "unknown"
        try:
            document, transport = fetch_document(session, url)
            meta = metadata_from_article_document(url, document, transport)
        except Exception as exc:
            inspection_errors.append(f"{aid}: {exc}")
            continue
        if not meta.get("headline"):
            inspection_errors.append(f"{aid}: missing headline")
            continue
        if is_blocked_candidate(meta):
            continue
        expected.append(meta)

    if inspection_errors:
        fail("Chrono24 article fetch regression", "; ".join(inspection_errors))

    expected.sort(key=lambda item: numeric_id(item.get("id") or ""), reverse=True)
    snapshot = {
        "created_at_epoch": int(time.time()),
        "latest_local_date": latest_local_date.isoformat() if latest_local_date else None,
        "local_numeric_max": local_numeric_max,
        "source_health": source_health,
        "discovered_count": len(discovered),
        "expected": expected,
        "live_targets": [],
    }
    SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    transports = sorted({item.get("transport") for item in source_health if item.get("ok")})
    print(f"MAGAZINE_UPSTREAM_PRE=PASS discovered={len(discovered)} expected_new={len(expected)} transports={','.join(transports)}")
    for meta in expected:
        print(f"  EXPECT {meta['id']} | {meta.get('published') or '?'} | {meta.get('transport')} | {meta.get('headline')}")


def postflight() -> None:
    if not SNAPSHOT.exists():
        fail("Magazine contract snapshot missing", str(SNAPSHOT))
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    expected = snapshot.get("expected") or []
    local = parse_local_articles()
    by_id = {str(item.get("id", "")): item for item in local}
    sitemap = SITEMAP.read_text(encoding="utf-8") if SITEMAP.exists() else ""
    failures: list[str] = []
    live_targets: list[dict] = []
    for meta in expected:
        aid = meta.get("id")
        article = by_id.get(aid)
        if not article:
            failures.append(f"{aid}: missing from MAGAZINE_ARTICLES after sync")
            continue
        slug = str(article.get("slug") or "").strip("/")
        if not slug:
            failures.append(f"{aid}: imported without slug")
            continue
        static_page = ROOT / "magazin" / slug / "index.html"
        if not static_page.exists() or static_page.stat().st_size < 500:
            failures.append(f"{aid}: static page missing/too small at {static_page}")
        if f"/magazin/{slug}/" not in sitemap:
            failures.append(f"{aid}: missing from sitemap-magazine.xml")
        live_targets.append({"id": aid, "slug": slug})
    if failures:
        fail("Magazine post-sync contract failed", "; ".join(failures))
    snapshot["live_targets"] = live_targets
    SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"MAGAZINE_POST_SYNC=PASS expected={len(expected)} verified={len(live_targets)}")


def liveflight() -> None:
    if not SNAPSHOT.exists():
        fail("Magazine contract snapshot missing", str(SNAPSHOT))
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    targets = snapshot.get("live_targets") or []
    session = make_session()
    cache_buster = int(time.time())
    try:
        listing = fetch_text(session, f"{LIVE_BASE}/magazin/?contract={cache_buster}", attempts=4, timeout=30)
    except Exception as exc:
        fail("Live magazine unavailable", str(exc))
    if "Belgin" not in listing:
        fail("Live magazine invalid", "Production /magazin/ returned 200 but expected Belgin marker is absent")
    if not targets:
        print("MAGAZINE_LIVE=PASS no_new_targets=1")
        return
    try:
        live_data = fetch_text(session, f"{LIVE_BASE}/js/magazine_data.js?contract={cache_buster}", attempts=4, timeout=30)
    except Exception as exc:
        fail("Live magazine data unavailable", str(exc))
    failures: list[str] = []
    for target in targets:
        aid = target["id"]
        slug = target["slug"]
        if aid not in live_data:
            failures.append(f"{aid}: absent from live magazine_data.js")
            continue
        try:
            page = fetch_text(session, f"{LIVE_BASE}/magazin/{slug}/?contract={cache_buster}", attempts=4, timeout=30)
            if len(page) < 500 or "Belgin" not in page:
                failures.append(f"{aid}: live article payload invalid")
        except Exception as exc:
            failures.append(f"{aid}: live route failed: {exc}")
    if failures:
        fail("Magazine live contract failed", "; ".join(failures))
    print(f"MAGAZINE_LIVE=PASS verified={len(targets)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=["pre", "post", "live"])
    args = parser.parse_args()
    if args.phase == "pre":
        preflight()
    elif args.phase == "post":
        postflight()
    else:
        liveflight()


if __name__ == "__main__":
    main()
