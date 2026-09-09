#!/usr/bin/env python3
"""Self-heal fresh Chrono24 articles through Belgin's cloud extractor.

Discovery/freshness is fixed to Chrono24's first-party static RSS. GitHub shared runners never
fetch full Chrono24 article pages. Instead they request a numeric article ID from Belgin's
allowlisted Cloud Function, then reuse the canonical Python transformation functions already used
by the primary magazine engine.
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
PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "carbon-web-1265b")
EXTRACTOR_URL = os.environ.get(
    "MAGAZINE_EXTRACTOR_URL",
    f"https://us-central1-{PROJECT_ID}.cloudfunctions.net/magazineFetchArticle",
)
EXTRACT_SCHEMA = "belgin-magazine-extract-v1"


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
// Sürüm: 2026-09-09 (Fail-Closed + Cloud Self-Healing Sync)
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


def extract_numeric_id(article_id: str) -> str:
    match = re.fullmatch(r"mag-(\d{5,7})", article_id or "")
    return match.group(1) if match else ""


def request_cloud_extract(session, article_id: str) -> dict:
    numeric_id = extract_numeric_id(article_id)
    if not numeric_id:
        fail(f"Invalid expected article id: {article_id}")
    try:
        response = session.post(
            EXTRACTOR_URL,
            json={"articleId": numeric_id},
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent": "BelginMagazineSync/2.0",
            },
            timeout=70,
        )
    except Exception as exc:
        raise RuntimeError(f"extractor request failed: {type(exc).__name__}: {exc}") from exc

    body = ""
    try:
        payload = response.json()
    except Exception:
        body = str(getattr(response, "text", ""))[:500]
        raise RuntimeError(f"extractor returned non-JSON HTTP {response.status_code}: {body}")

    if response.status_code != 200 or not payload.get("ok"):
        raise RuntimeError(
            f"extractor HTTP {response.status_code}: {payload.get('error') or 'UNKNOWN'} "
            f"{payload.get('message') or ''}".strip()
        )
    if payload.get("schema") != EXTRACT_SCHEMA:
        raise RuntimeError(f"unexpected extractor schema: {payload.get('schema')}")
    if str(payload.get("articleId")) != numeric_id:
        raise RuntimeError(f"extractor id mismatch: expected={numeric_id} actual={payload.get('articleId')}")

    raw_title = str(payload.get("raw_title") or "").strip()
    raw_date = str(payload.get("raw_date") or "").strip()[:10]
    raw_paras = payload.get("raw_paras") or []
    if not raw_title or not isinstance(raw_paras, list):
        raise RuntimeError("extractor payload missing title/paragraphs")
    raw_paras = [str(p).strip() for p in raw_paras if isinstance(p, str) and len(p.strip()) >= 35]
    body_chars = len(" ".join(raw_paras))
    if len(raw_paras) < 3 or body_chars < 600:
        raise RuntimeError(f"extractor payload too thin: paragraphs={len(raw_paras)} body_chars={body_chars}")
    payload["raw_paras"] = raw_paras
    return payload


def build_article(lib: dict, session, article_id: str, payload: dict) -> dict:
    clean_and_translate_text = lib.get("clean_and_translate_text")
    determine_category_and_slug = lib.get("determine_category_and_slug")
    translate_article_content = lib.get("translate_article_content")
    format_date_tr = lib.get("format_date_tr")
    download_image = lib.get("download_image")
    if not all(callable(fn) for fn in [
        clean_and_translate_text,
        determine_category_and_slug,
        translate_article_content,
        format_date_tr,
        download_image,
    ]):
        fail("Canonical magazine transformation functions could not be loaded")

    raw_title = payload["raw_title"]
    if re.search(
        r"(?i)favorite\s*watches|staff\s*picks|steiert|gehrlein|breining|team\s*member|employee|rolex-report|chronopulse",
        raw_title,
    ):
        raise RuntimeError("cloud-extracted article is blocked by magazine content policy")

    title = clean_and_translate_text(raw_title)
    category, slug = determine_category_and_slug(title, raw_title)
    raw_date = payload.get("raw_date") or "2026-09-09"
    publish_date = format_date_tr(raw_date)
    content_html = translate_article_content(title, payload["raw_paras"])
    summary_match = re.search(r'<p class="mag-lead-para">(.*?)</p>', content_html, re.DOTALL)
    summary = summary_match.group(1) if summary_match else f"{title} hakkında detaylı saatçilik analizi."
    read_time = f"{max(4, round(len(content_html) / 450))} dk okuma"

    hero_img_url = str(payload.get("hero_img_url") or "").strip()
    final_img = None
    if hero_img_url.startswith("https://"):
        img_filename = f"{slug[:45]}.jpg"
        try:
            final_img = download_image(session, hero_img_url, img_filename)
        except Exception:
            final_img = None
    if not final_img:
        final_img = "images/magazine/cenevre-saat-gunleri-2026-ozet-ve-yenilikler.jpg"

    return {
        "id": article_id,
        "slug": slug,
        "title": title,
        "category": category,
        "publish_date": publish_date,
        "raw_date": raw_date,
        "author": "Belgin Saat & Mücevherat Editoryal Kurulu",
        "read_time": read_time,
        "image": final_img,
        "summary": summary,
        "content_html": content_html,
        "source_url": "",
    }


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
    requests_module = lib.get("requests")
    if requests_module is None:
        fail("Canonical requests implementation could not be loaded")
    session = requests_module.Session()
    session.headers.update({"User-Agent": "BelginMagazineSync/2.0"})

    repaired: list[str] = []
    failures: list[str] = []
    for meta in missing:
        aid = str(meta.get("id") or "unknown")
        try:
            extracted = request_cloud_extract(session, aid)
            article = build_article(lib, session, aid, extracted)
        except Exception as exc:
            failures.append(f"{aid}: {type(exc).__name__}: {exc}")
            continue

        articles.append(article)
        existing_ids.add(aid)
        repaired.append(aid)
        print(
            f"  REPAIRED {aid} | cloud_transport={extracted.get('transport', '?')} | "
            f"paragraphs={len(extracted.get('raw_paras') or [])} | {article.get('title', '')}"
        )

    if failures:
        fail("; ".join(failures))
    if repaired:
        write_articles(articles)
    print(f"MAGAZINE_SELF_HEAL=PASS expected_new={len(expected)} repaired={len(repaired)}")


if __name__ == "__main__":
    main()
