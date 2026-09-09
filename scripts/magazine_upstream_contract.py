#!/usr/bin/env python3
"""Fail-closed Chrono24 -> Belgin Magazine freshness and delivery contract.

Chrono24's www host rejects GitHub-hosted runners with HTTP 403. Discovery therefore uses
Chrono24's own public static magazine RSS distribution surface. The contract never treats a
transport/parser error as 'no new article'.

Phases:
  pre  : read RSS, identify every eligible ID newer than local frontier, persist exact snapshot
  post : prove every expected article exists in data + static page + magazine sitemap
  live : prove deployed production serves the expected data and article routes
"""

from __future__ import annotations

import argparse
import json
import os
import re
import time
import xml.etree.ElementTree as ET
from datetime import date
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from curl_cffi import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_JS = ROOT / "js" / "magazine_data.js"
SITEMAP = ROOT / "sitemap-magazine.xml"
SNAPSHOT = Path(os.environ.get("MAGAZINE_CONTRACT_SNAPSHOT", "/tmp/magazine-upstream-contract.json"))
BASE = "https://www.chrono24.com"
RSS_URL = "https://static.chrono24.com/magazine/article-rss-feed.xml?limit=30"
LIVE_BASE = "https://www.belginkuyumculuk.com"

BLOCKED_IDS = {"mag-180505", "mag-177236"}
BLOCKED_RE = re.compile(
    r"(?i)staff|picks|team|author|employee|favorite-watches|steiert|gehrlein|breining|gtg|rolex-report|chronopulse"
)
ARTICLE_ID_RE = re.compile(r"-p_(\d+)(?:/|$|[?#])")
ABS_ARTICLE_RE = re.compile(
    r"https?://(?:www\.)?chrono24\.com(?:\.tr)?/magazine/[^\s\]\)\"'<>]+?-p_\d+/?(?:\?[^\s\]\)]*)?",
    re.I,
)


def fail(title: str, detail: str, code: int = 2) -> "None":
    print(f"::error title={title}::{detail}")
    raise SystemExit(code)


def make_session():
    session = requests.Session()
    session.headers.update({
        "User-Agent": "BelginMagazineSync/2.0 (+https://www.belginkuyumculuk.com/magazin/)",
        "Accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
    })
    return session


def fetch_text(session, url: str, attempts: int = 3, timeout: int = 25) -> str:
    last = "unknown"
    for attempt in range(1, attempts + 1):
        try:
            response = session.get(url, timeout=timeout)
            if response.status_code == 200 and response.text:
                return response.text
            last = f"HTTP {response.status_code}"
        except Exception as exc:
            last = f"{type(exc).__name__}: {exc}"
        if attempt < attempts:
            time.sleep(attempt * 2)
    raise RuntimeError(f"{url} -> {last}")


def article_id_from_url(url: str) -> str | None:
    match = ARTICLE_ID_RE.search(url or "")
    return f"mag-{match.group(1)}" if match else None


def numeric_id(article_id: str) -> int:
    match = re.search(r"(\d+)$", article_id or "")
    return int(match.group(1)) if match else -1


def _normalize_article_url(value: str) -> str | None:
    if not value:
        return None
    value = value.strip().rstrip(".,;:!\"")
    full = urljoin(BASE, value).split("#", 1)[0]
    full = re.sub(r"^https://www\.chrono24\.com\.tr/", "https://www.chrono24.com/", full, flags=re.I)
    if "/magazine/" not in full or not article_id_from_url(full):
        return None
    return full


def extract_article_urls(document: str) -> list[str]:
    """Backward-compatible helper used by tests and defensive RSS parsing."""
    found: list[str] = []
    seen: set[str] = set()
    soup = BeautifulSoup(document or "", "html.parser")
    for anchor in soup.find_all("a", href=True):
        full = _normalize_article_url(anchor.get("href", ""))
        if full and full not in seen:
            seen.add(full)
            found.append(full)
    for match in ABS_ARTICLE_RE.finditer(document or ""):
        full = _normalize_article_url(match.group(0))
        if full and full not in seen:
            seen.add(full)
            found.append(full)
    return found


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def _child_text(item: ET.Element, names: set[str]) -> str:
    for child in list(item):
        if _local_name(child.tag) in names and child.text:
            return child.text.strip()
    return ""


def _image_from_item(item: ET.Element) -> str:
    for child in item.iter():
        local = _local_name(child.tag)
        if local in {"content", "thumbnail", "enclosure"}:
            candidate = (child.attrib.get("url") or child.attrib.get("href") or "").strip()
            medium = (child.attrib.get("medium") or child.attrib.get("type") or "").lower()
            if candidate and (local != "content" or not medium or "image" in medium):
                return candidate
    return ""


def _published_iso(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        return ""
    iso = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", raw)
    if iso:
        return iso.group(1)
    try:
        return parsedate_to_datetime(raw).date().isoformat()
    except Exception:
        return ""


def _body_metrics(html: str) -> tuple[int, int]:
    soup = BeautifulSoup(html or "", "html.parser")
    text = soup.get_text(" ", strip=True)
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p") if p.get_text(" ", strip=True)]
    return len(text), len(paragraphs)


def parse_rss_items(xml_text: str) -> list[dict]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        raise ValueError(f"invalid RSS XML: {exc}") from exc

    parsed: list[dict] = []
    seen_ids: set[str] = set()
    for item in (node for node in root.iter() if _local_name(node.tag) in {"item", "entry"}):
        title = _child_text(item, {"title"})
        link = _child_text(item, {"link"})
        if not link:
            for child in list(item):
                if _local_name(child.tag) == "link":
                    link = (child.attrib.get("href") or "").strip()
                    if link:
                        break
        guid = _child_text(item, {"guid", "id"})
        url = _normalize_article_url(link) or _normalize_article_url(guid)
        if not url:
            urls = extract_article_urls(" ".join(filter(None, [link, guid, ET.tostring(item, encoding="unicode")])))
            url = urls[0] if urls else None
        aid = article_id_from_url(url or "")
        if not aid or aid in seen_ids:
            continue
        seen_ids.add(aid)

        description_html = _child_text(item, {"description", "summary"})
        content_html = _child_text(item, {"encoded", "content"})
        # media:content is not article body; reject it if it is only a URL/empty payload.
        if content_html and not ("<" in content_html or len(content_html) > 200):
            content_html = ""
        preferred_body = content_html if _body_metrics(content_html)[0] >= _body_metrics(description_html)[0] else description_html
        body_chars, paragraph_count = _body_metrics(preferred_body)

        parsed.append({
            "id": aid,
            "url": url,
            "headline": title,
            "published": _published_iso(_child_text(item, {"pubdate", "published", "updated", "date"})),
            "description_html": description_html,
            "content_html": content_html,
            "image_url": _image_from_item(item),
            "body_chars": body_chars,
            "paragraph_count": paragraph_count,
            "source": "chrono24-static-rss",
        })
    parsed.sort(key=lambda x: numeric_id(x.get("id", "")), reverse=True)
    return parsed


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
    try:
        rss_text = fetch_text(session, RSS_URL, attempts=3, timeout=30)
        items = parse_rss_items(rss_text)
    except Exception as exc:
        fail("Chrono24 RSS unavailable", str(exc))
    if not items:
        fail("Chrono24 RSS parser regression", "RSS returned no valid magazine article items")
    if len(items) < 5:
        fail("Chrono24 RSS unexpectedly sparse", f"Only {len(items)} valid article items were parsed")

    eligible = [item for item in items if not is_blocked_candidate(item)]
    if not eligible:
        fail("Chrono24 RSS policy regression", "RSS contains no eligible magazine items")

    feed_numeric_max = max(numeric_id(item["id"]) for item in items)
    eligible_numeric_max = max(numeric_id(item["id"]) for item in eligible)
    expected = [
        item for item in eligible
        if item["id"] not in local_ids and numeric_id(item["id"]) > local_numeric_max
    ]

    # Critical freshness invariant: an eligible upstream frontier ahead of local may never become
    # a green 'nothing to do' result.
    if eligible_numeric_max > local_numeric_max and not expected:
        fail(
            "Magazine freshness invariant failed",
            f"eligible RSS max={eligible_numeric_max} local max={local_numeric_max} but expected set is empty",
        )

    snapshot = {
        "created_at_epoch": int(time.time()),
        "latest_local_date": latest_local_date.isoformat() if latest_local_date else None,
        "local_numeric_max": local_numeric_max,
        "feed_numeric_max": feed_numeric_max,
        "eligible_numeric_max": eligible_numeric_max,
        "rss_url": RSS_URL,
        "rss_item_count": len(items),
        "expected": expected,
        "live_targets": [],
    }
    SNAPSHOT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"MAGAZINE_UPSTREAM_PRE=PASS source=chrono24-static-rss items={len(items)} "
        f"local_max={local_numeric_max} eligible_max={eligible_numeric_max} expected_new={len(expected)}"
    )
    for meta in expected:
        print(
            f"  EXPECT {meta['id']} | {meta.get('published') or '?'} | "
            f"body_chars={meta.get('body_chars', 0)} paragraphs={meta.get('paragraph_count', 0)} | "
            f"{meta.get('headline', '')}"
        )


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
