#!/usr/bin/env python3
"""Fail-closed contract for Chrono24 -> Belgin Magazine synchronization.

Phases:
  pre  : prove upstream is reachable, discover fresh eligible articles and persist snapshot
  post : prove every expected article was imported, statically generated and added to sitemap
  live : prove deployed production serves the imported data and article routes

This guard is intentionally independent from the sync engine so a parser/discovery regression
cannot silently report success.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
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


def fail(title: str, detail: str, code: int = 2) -> "None":
    print(f"::error title={title}::{detail}")
    raise SystemExit(code)


def warn(title: str, detail: str) -> None:
    print(f"::warning title={title}::{detail}")


def make_session():
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
    return session


def fetch_text(session, url: str, attempts: int = 3, timeout: int = 20) -> str:
    last = "unknown"
    for attempt in range(1, attempts + 1):
        try:
            response = session.get(url, impersonate="chrome124", timeout=timeout)
            if response.status_code == 200 and response.text:
                return response.text
            last = f"HTTP {response.status_code}"
        except Exception as exc:  # network failure must not become a green workflow
            last = f"{type(exc).__name__}: {exc}"
        if attempt < attempts:
            time.sleep(attempt * 2)
    raise RuntimeError(f"{url} -> {last}")


def article_id_from_url(url: str) -> str | None:
    match = ARTICLE_ID_RE.search(url)
    return f"mag-{match.group(1)}" if match else None


def numeric_id(article_id: str) -> int:
    match = re.search(r"(\d+)$", article_id or "")
    return int(match.group(1)) if match else -1


def extract_article_urls(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    found: list[str] = []
    seen: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = anchor.get("href", "")
        if "/magazine/" not in href or "-p_" not in href:
            continue
        full = urljoin(BASE, href).split("#", 1)[0]
        if not article_id_from_url(full) or full in seen:
            continue
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


def metadata_from_article_html(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
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
            html = fetch_text(session, source)
            urls = extract_article_urls(html)
            source_health.append({"url": source, "ok": True, "count": len(urls)})
            for url in urls:
                if url not in seen:
                    seen.add(url)
                    discovered.append(url)
        except Exception as exc:
            source_health.append({"url": source, "ok": False, "error": str(exc)})

    healthy = [item for item in source_health if item.get("ok")]
    if len(healthy) < 2:
        fail("Chrono24 upstream unavailable", f"Only {len(healthy)}/{len(SOURCES)} discovery sources were reachable: {source_health}")
    if len(discovered) < 5:
        fail("Chrono24 discovery regression", f"Only {len(discovered)} article URLs discovered; expected at least 5")

    # Evaluate genuinely fresh/missing candidates. IDs are monotonic in Chrono24 today,
    # while publication date is a second independent signal if IDs ever stop being monotonic.
    missing_urls = [url for url in discovered if article_id_from_url(url) not in local_ids]
    priority_urls = []
    for url in missing_urls:
        aid = article_id_from_url(url) or ""
        if numeric_id(aid) > local_numeric_max or url in discovered[:15]:
            priority_urls.append(url)

    expected: list[dict] = []
    inspection_errors: list[str] = []
    inspected: set[str] = set()

    for url in priority_urls[:30]:
        if url in inspected:
            continue
        inspected.add(url)
        try:
            meta = metadata_from_article_html(url, fetch_text(session, url))
        except Exception as exc:
            aid = article_id_from_url(url) or "unknown"
            # A new/high ID that cannot be fetched is exactly the silent failure we must stop.
            if numeric_id(aid) > local_numeric_max:
                inspection_errors.append(f"{aid}: {exc}")
            continue

        if not meta.get("headline"):
            if numeric_id(meta.get("id") or "") > local_numeric_max:
                inspection_errors.append(f"{meta.get('id')}: missing headline")
            continue
        if is_blocked_candidate(meta):
            continue

        published = iso_date(meta.get("published", ""))
        is_fresh = numeric_id(meta.get("id") or "") > local_numeric_max
        if latest_local_date and published:
            is_fresh = is_fresh or published >= latest_local_date
        if is_fresh:
            expected.append(meta)

    if inspection_errors:
        fail("Chrono24 article fetch regression", "; ".join(inspection_errors))

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
    print(f"MAGAZINE_UPSTREAM_PRE=PASS discovered={len(discovered)} expected_new={len(expected)}")
    for meta in expected:
        print(f"  EXPECT {meta['id']} | {meta.get('published') or '?'} | {meta.get('headline')}")


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
