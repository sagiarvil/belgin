#!/usr/bin/env python3
"""Belgin Magazine release integrity and live-drift guard.

This guard is intentionally independent from article discovery. It prevents a green sync when:
- local magazine data contains duplicate IDs/slugs or invalid dates,
- a recent article has no static page / sitemap / canonical,
- Firebase Hosting is stale relative to main even when there are no new upstream articles.

Exit codes:
  0 = healthy
  2 = local/release integrity failure
  3 = live drift detected (safe for workflow to auto-heal by redeploying Hosting)
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from collections import Counter
from pathlib import Path

from curl_cffi import requests

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import magazine_upstream_contract as contract  # noqa: E402

LIVE_BASE = "https://www.belginkuyumculuk.com"
CHECK_RECENT = 5
ISO_DATE_RE = re.compile(r"^20\d{2}-\d{2}-\d{2}$")


def fail(detail: str, code: int = 2) -> "None":
    print(f"::error title=Magazine Release Guard::{detail}")
    raise SystemExit(code)


def _recent_articles() -> list[dict]:
    articles = contract.parse_local_articles()
    ids = [str(a.get("id") or "") for a in articles]
    slugs = [str(a.get("slug") or "").strip("/") for a in articles]

    duplicate_ids = sorted(k for k, n in Counter(ids).items() if k and n > 1)
    duplicate_slugs = sorted(k for k, n in Counter(slugs).items() if k and n > 1)
    if duplicate_ids:
        fail(f"duplicate magazine IDs: {duplicate_ids[:10]}")
    if duplicate_slugs:
        fail(f"duplicate magazine slugs: {duplicate_slugs[:10]}")
    if any(not i.startswith("mag-") or contract.numeric_id(i) < 0 for i in ids):
        fail("one or more magazine IDs are malformed")
    if any(not slug for slug in slugs):
        fail("one or more magazine slugs are empty")

    ordered = sorted(
        articles,
        key=lambda a: (str(a.get("raw_date") or ""), contract.numeric_id(str(a.get("id") or ""))),
        reverse=True,
    )
    recent = ordered[:CHECK_RECENT]
    for article in recent:
        raw_date = str(article.get("raw_date") or "")[:10]
        if not ISO_DATE_RE.fullmatch(raw_date):
            fail(f"{article.get('id')}: invalid raw_date={raw_date!r}")
        if not str(article.get("title") or "").strip():
            fail(f"{article.get('id')}: title missing")
        if len(str(article.get("content_html") or "")) < 500:
            fail(f"{article.get('id')}: article content unexpectedly thin")
    return recent


def local_guard() -> None:
    recent = _recent_articles()
    sitemap_path = ROOT / "sitemap-magazine.xml"
    if not sitemap_path.exists():
        fail("sitemap-magazine.xml missing")
    sitemap = sitemap_path.read_text(encoding="utf-8")

    failures: list[str] = []
    for article in recent:
        aid = str(article["id"])
        slug = str(article["slug"]).strip("/")
        route = f"/magazin/{slug}/"
        static_page = ROOT / "magazin" / slug / "index.html"
        if not static_page.exists() or static_page.stat().st_size < 500:
            failures.append(f"{aid}: static page missing/too small")
            continue
        page = static_page.read_text(encoding="utf-8", errors="replace")
        canonical = f'{LIVE_BASE}{route}'
        if canonical not in page:
            failures.append(f"{aid}: canonical missing/mismatched")
        if route not in sitemap:
            failures.append(f"{aid}: absent from sitemap-magazine.xml")
    if failures:
        fail("; ".join(failures))
    print(f"MAGAZINE_RELEASE_LOCAL=PASS recent={len(recent)}")


def _get(session, url: str, attempts: int = 3) -> str:
    last = "unknown"
    for attempt in range(1, attempts + 1):
        try:
            res = session.get(url, timeout=30)
            if res.status_code == 200 and res.text:
                return res.text
            last = f"HTTP {res.status_code}"
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        if attempt < attempts:
            time.sleep(attempt * 2)
    fail(f"live fetch failed: {url} -> {last}", code=3)


def live_guard() -> None:
    # Local integrity is a prerequisite; live drift must never mask corrupt release data.
    recent = _recent_articles()
    session = requests.Session()
    session.headers.update({
        "User-Agent": "BelginMagazineReleaseGuard/1.0",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    })
    nonce = int(time.time())
    live_data = _get(session, f"{LIVE_BASE}/js/magazine_data.js?release_guard={nonce}")
    live_sitemap = _get(session, f"{LIVE_BASE}/sitemap-magazine.xml?release_guard={nonce}")
    listing = _get(session, f"{LIVE_BASE}/magazin/?release_guard={nonce}")

    failures: list[str] = []
    for article in recent:
        aid = str(article["id"])
        slug = str(article["slug"]).strip("/")
        route = f"/magazin/{slug}/"
        if aid not in live_data:
            failures.append(f"{aid}: absent from live magazine_data.js")
        if route not in live_sitemap:
            failures.append(f"{aid}: absent from live sitemap-magazine.xml")
        if slug not in listing and aid == str(recent[0]["id"]):
            failures.append(f"{aid}: latest slug absent from live magazine listing")
        try:
            page = _get(session, f"{LIVE_BASE}{route}?release_guard={nonce}")
            canonical = f"{LIVE_BASE}{route}"
            if len(page) < 500 or "Belgin" not in page or canonical not in page:
                failures.append(f"{aid}: live page/canonical invalid")
        except SystemExit as exc:
            if exc.code == 3:
                failures.append(f"{aid}: live route unavailable")
            else:
                raise

    if failures:
        fail("LIVE_DRIFT: " + "; ".join(failures), code=3)
    print(f"MAGAZINE_RELEASE_LIVE=PASS recent={len(recent)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=["local", "live"])
    args = parser.parse_args()
    if args.phase == "local":
        local_guard()
    else:
        live_guard()


if __name__ == "__main__":
    main()
