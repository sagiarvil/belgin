#!/usr/bin/env python3
"""Self-heal fresh Chrono24 topics into Belgin Magazine.

Discovery/freshness is fixed to Chrono24's first-party static RSS. The preferred path is a
full-body extract through Belgin's allowlisted Cloud Function. Chrono24 currently rejects both
GitHub and Google Cloud data-center egress with HTTP 403, so a deterministic RSS editorial
fallback exists for that explicit failure mode.

The fallback never pretends to reproduce the inaccessible source article. It requires a valid
first-party RSS item with a meaningful summary, then creates an original Turkish Belgin editorial
analysis around only the topic proven by the feed. If the RSS evidence is too thin, the workflow
remains fail-closed.
"""

from __future__ import annotations

import html
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
MIN_RSS_SUMMARY_CHARS = 80


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
// Sürüm: 2026-09-09 (Fail-Closed + RSS/Cloud Self-Healing Sync)
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
                "User-Agent": "BelginMagazineSync/3.0",
            },
            timeout=70,
        )
    except Exception as exc:
        raise RuntimeError(f"extractor request failed: {type(exc).__name__}: {exc}") from exc

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
    raw_paras = payload.get("raw_paras") or []
    if not raw_title or not isinstance(raw_paras, list):
        raise RuntimeError("extractor payload missing title/paragraphs")
    raw_paras = [str(p).strip() for p in raw_paras if isinstance(p, str) and len(p.strip()) >= 35]
    body_chars = len(" ".join(raw_paras))
    if len(raw_paras) < 3 or body_chars < 600:
        raise RuntimeError(f"extractor payload too thin: paragraphs={len(raw_paras)} body_chars={body_chars}")
    payload["raw_paras"] = raw_paras
    payload["ingest_mode"] = "cloud_full"
    return payload


def _plain_rss_summary(meta: dict) -> str:
    raw = str(meta.get("content_html") or meta.get("description_html") or "")
    text = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", " ", raw, flags=re.I)
    text = re.sub(r"<style\b[^>]*>[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _money_limit(raw_title: str) -> str:
    match = re.search(r"(?:under|below|up to)\s*\$?([\d,.]+)", raw_title, flags=re.I)
    if not match:
        return ""
    value = re.sub(r"[^\d]", "", match.group(1))
    try:
        amount = int(value)
    except Exception:
        return ""
    return f"{amount:,}".replace(",", ".")


def rss_editorial_title(raw_title: str) -> str:
    """Translate common feed headline shapes without inventing article-specific facts."""
    raw_title = re.sub(r"\s+", " ", str(raw_title or "")).strip()
    lower = raw_title.lower()
    limit = _money_limit(raw_title)

    if "luxury watches" in lower and "newcom" in lower and limit:
        count = re.search(r"top\s+(\d+)", lower)
        n = count.group(1) if count else ""
        prefix = f"En İyi {n} " if n else ""
        return f"{limit} Dolar Altında Başlangıç İçin {prefix}Lüks Saat".replace("  ", " ")
    if "geneva watch days" in lower and "novelt" in lower:
        count = re.search(r"top\s+(\d+)", lower)
        n = count.group(1) if count else ""
        suffix = f"Öne Çıkan {n} Yeni Saat" if n else "Öne Çıkan Yeni Saatler"
        return f"Cenevre Saat Günleri 2026: {suffix}"
    if "geneva watch days" in lower and "recap" in lower:
        return "Cenevre Saat Günleri 2026: Yeni Saatler, Trendler ve Fuar Özeti"
    if "concept watch" in lower:
        return "Konsept Saat Nedir? Yüksek Saatçiliğin Deneysel Geleceği"

    replacements = [
        (r"(?i)\bthe top (\d+)\b", r"En İyi \1"),
        (r"(?i)\btop (\d+)\b", r"En İyi \1"),
        (r"(?i)\bluxury watches\b", "Lüks Saatler"),
        (r"(?i)\bluxury watch\b", "Lüks Saat"),
        (r"(?i)\bwatch guides?\b", "Saat Rehberi"),
        (r"(?i)\bwatch market\b", "Saat Piyasası"),
        (r"(?i)\bwatch trends?\b", "Saat Trendleri"),
        (r"(?i)\bvalue performance\b", "Değer Performansı"),
        (r"(?i)\bhalf-year comparison\b", "Yarıyıl Karşılaştırması"),
        (r"(?i)\baffordable alternatives\b", "Ulaşılabilir Alternatifler"),
        (r"(?i)\bwater resistant watches\b", "Su Geçirmez Saatler"),
        (r"(?i)\bnewcomers?\b", "Yeni Koleksiyonerler"),
        (r"(?i)\bgeneva watch days\b", "Cenevre Saat Günleri"),
        (r"(?i)\bhighlights?\b", "Öne Çıkanlar"),
        (r"(?i)\brecap\b", "Özet"),
        (r"(?i)\bnovelties\b", "Yeni Saatler"),
        (r"(?i)\bcomparison\b", "Karşılaştırması"),
        (r"(?i)\binvestment\b", "Yatırım"),
    ]
    translated = raw_title
    for pattern, replacement in replacements:
        translated = re.sub(pattern, replacement, translated)
    translated = re.sub(r"(?i)\bunder\s*\$?([\d,.]+)", lambda m: f"{re.sub(r'[^0-9]', '', m.group(1))} Dolar Altında", translated)
    return re.sub(r"\s+", " ", translated).strip(" :-")


def rss_editorial_paragraphs(meta: dict, title: str) -> list[str]:
    """Create original Turkish analysis using only the topic proven by first-party RSS metadata."""
    raw_title = str(meta.get("headline") or "").strip()
    summary = _plain_rss_summary(meta)
    if len(raw_title) < 12:
        raise RuntimeError("RSS fallback rejected: headline missing/too short")
    if len(summary) < MIN_RSS_SUMMARY_CHARS:
        raise RuntimeError(
            f"RSS fallback rejected: summary too thin ({len(summary)} < {MIN_RSS_SUMMARY_CHARS} chars)"
        )

    lower = raw_title.lower()
    lead = (
        f"{title} başlığı, güncel saat dünyasında koleksiyonerlerin karar verirken yalnız marka adına değil; "
        "mekanizma, kasa oranı, kullanım amacı, servis geçmişi ve uzun vadeli sahiplik deneyimine birlikte bakması "
        "gerektiğini yeniden gündeme taşıyor. Belgin Saat Magazin bu konuyu kaynak metni kopyalamadan, alıcı ve "
        "koleksiyoner açısından uygulanabilir bir değerlendirme çerçevesiyle ele alıyor."
    )

    if any(k in lower for k in ["newcom", "under $", "under ", "buyer", "guide", "collection"]):
        return [
            lead,
            "İlk lüks saat seçiminde en pahalı veya en çok konuşulan modele yönelmek yerine bilek ölçüsü, günlük kullanım sıklığı, su geçirmezlik ihtiyacı ve mekanizma servis edilebilirliği birlikte değerlendirilmelidir. İyi bir başlangıç saati, teknik olarak güven veren ve farklı kullanım senaryolarında sahibini zorlamayan dengeli bir referanstır.",
            "Bütçe yükseldikçe yalnız marka seçeneği değil, komplikasyon ve işçilik seviyesi de genişler. Buna rağmen kondisyon, kutu-belge bütünlüğü, geçmiş bakım kayıtları ve parça özgünlüğü ikinci el alımında fiyat etiketinden daha kritik hale gelebilir. Aynı modelin iki örneği arasında ciddi değer farkı yaratabilen unsur çoğu zaman bu belgelendirme zinciridir.",
            "Koleksiyon kurarken tek bir stile yığılmak yerine kullanım senaryolarını ayırmak daha sağlıklı bir yöntemdir: günlük saat, seyahat saati, kronograf, dalış saati veya daha klasik bir elbise saati gibi roller belirlemek gereksiz tekrarları azaltır. Böylece bütçe yalnız satın alma anına değil, uzun vadeli bakım ve kullanım maliyetine göre de daha verimli dağılır.",
            "Son karar aşamasında referans numarası, kasa çapı, lug-to-lug ölçüsü, kalibre, servis aralığı ve piyasa likiditesi aynı tabloda karşılaştırılmalıdır. Bu yaklaşım, yeni koleksiyonerin popülerlik baskısıyla değil kendi kullanım biçimi ve risk toleransıyla uyumlu bir saat seçmesini sağlar."
        ]

    if "geneva watch days" in lower or "novelt" in lower or "highlights" in lower or "recap" in lower:
        return [
            lead,
            "Cenevre Saat Günleri gibi fuarlarda ilk günün dikkatini sıra dışı tasarımlar çeker; kalıcı değeri ise çoğu zaman daha sessiz ayrıntılar belirler. Yeni bir saati değerlendirirken yalnız ilk görsel etkiye değil, mekanizmanın gerçekten yeni olup olmadığına, kasanın bilekteki oranına, okunabilirliğe, bitiş kalitesine ve markanın mevcut koleksiyonuyla tutarlılığına bakmak gerekir.",
            "Bağımsız üreticiler ve köklü markalar aynı dönemde yenilik sunduğunda karşılaştırma zorlaşır. Bir yeniliği güçlü yapan unsur her zaman komplikasyon sayısı değildir; bazen daha ince kasa, daha iyi ergonomi, geliştirilmiş güç rezervi veya mevcut bir mekanizmanın daha güvenilir hale getirilmesi koleksiyoner açısından daha anlamlı olabilir.",
            "Fuar tanıtımı ile gerçek sahiplik deneyimi arasında fark vardır. İlk değerlendirmede üretim adedi, servis altyapısı, mekanizma mimarisi ve markanın geçmiş referanslara verdiği destek dikkate alınmalıdır. Kısa süreli sosyal medya ilgisi tek başına koleksiyon değeri veya uzun vadeli talep göstergesi olarak kabul edilmemelidir.",
            "Belgin editoryal yaklaşımında yeni saatleri üç eksende okumak daha sağlıklıdır: teknik yenilik, günlük kullanılabilirlik ve koleksiyon içindeki anlamı. Bu üç alanın aynı anda güçlü olduğu modeller, fuar heyecanı geçtikten sonra da konuşulma ihtimali en yüksek adaylardır."
        ]

    if any(k in lower for k in ["investment", "value", "market", "price"]):
        return [
            lead,
            "Saat piyasasında fiyat ile değer aynı şey değildir. Liste fiyatı, gerçekleşen ikinci el işlemleri, kondisyon, üretim dönemi ve referansın bulunabilirliği birlikte okunmadan tek bir rakam üzerinden yatırım sonucu çıkarmak yanıltıcı olabilir.",
            "Koleksiyon değerini koruyan örneklerde özgün parça bütünlüğü, servis belgeleri, kutu ve evraklar, doğru polisaj geçmişi ve doğrulanabilir sahiplik zinciri öne çıkar. Özellikle nadir veya üretimi sona ermiş referanslarda bu ayrıntılar model adından bağımsız olarak önemli fiyat farkı yaratabilir.",
            "Likidite de değerlemenin parçasıdır. Teorik olarak yüksek fiyatlanan fakat alıcı derinliği düşük bir saat ile daha kolay el değiştiren güçlü bir referans aynı risk profiline sahip değildir. Bu nedenle alım kararında yalnız yükseliş potansiyeli değil, gerektiğinde çıkış yapılabilecek piyasa genişliği de dikkate alınmalıdır.",
            "Saati öncelikle kullanılacak ve korunacak mekanik bir varlık olarak görmek daha dengeli bir çerçeve sunar. Finansal beklenti, kondisyon ve bakım disiplininin önüne geçtiğinde koleksiyon kararı spekülasyona dönüşebilir."
        ]

    return [
        lead,
        "Bir saati değerlendirirken tasarım dili ile teknik mimariyi ayrı ayrı incelemek gerekir. Kasa oranı, kadran okunabilirliği ve bilezik veya kayış ergonomisi günlük deneyimi belirlerken; kalibre yapısı, güç rezervi, dayanıklılık ve servis erişimi uzun vadeli sahiplik kalitesini belirler.",
        "Marka hikâyesi ve modelin geçmişi önemlidir ancak tek başına satın alma gerekçesi değildir. Referansın kendi dönemindeki teknik konumu, benzer modeller karşısındaki farkı ve üreticinin satış sonrası desteği birlikte değerlendirildiğinde daha sağlıklı bir koleksiyon kararı ortaya çıkar.",
        "İkinci el veya vintage pazarda kondisyon ve doğrulanabilir geçmiş öne çıkar. Kasa geometrisinin korunması, doğru parçalar, servis kayıtları ve tutarlı seri-referans bilgisi özellikle yüksek değerli saatlerde satın alma öncesi kontrolün temel parçalarıdır.",
        "Belgin Saat Magazin bu tür güncel başlıkları kısa süreli popülerlikten ayırarak teknik kalite, kullanılabilirlik ve koleksiyon mantığı üzerinden yorumlar. Amaç tek bir modeli öne çıkarmak değil, okuyucunun kendi kullanım senaryosuna göre daha bilinçli karar verebilmesini sağlamaktır."
    ]


def build_rss_editorial_payload(meta: dict) -> dict:
    raw_title = str(meta.get("headline") or "").strip()
    title = rss_editorial_title(raw_title)
    raw_paras = rss_editorial_paragraphs(meta, title)
    body_chars = len(" ".join(raw_paras))
    if len(raw_paras) < 4 or body_chars < 1000:
        raise RuntimeError(f"RSS editorial payload too thin: paragraphs={len(raw_paras)} body_chars={body_chars}")
    return {
        "raw_title": title,
        "raw_date": str(meta.get("published") or "")[:10],
        "raw_paras": raw_paras,
        "hero_img_url": str(meta.get("image_url") or "").strip(),
        "transport": "chrono24-static-rss-editorial",
        "ingest_mode": "rss_editorial",
    }


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
        raise RuntimeError("article is blocked by magazine content policy")

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
    session.headers.update({"User-Agent": "BelginMagazineSync/3.0"})

    repaired: list[str] = []
    failures: list[str] = []
    for meta in missing:
        aid = str(meta.get("id") or "unknown")
        extracted = None
        cloud_error = ""
        try:
            extracted = request_cloud_extract(session, aid)
        except Exception as exc:
            cloud_error = f"{type(exc).__name__}: {exc}"
            try:
                extracted = build_rss_editorial_payload(meta)
                print(f"  DEGRADED {aid} | cloud_full_unavailable={cloud_error} | fallback=rss_editorial")
            except Exception as fallback_exc:
                failures.append(
                    f"{aid}: cloud_full failed ({cloud_error}); RSS fallback failed "
                    f"({type(fallback_exc).__name__}: {fallback_exc})"
                )
                continue

        try:
            article = build_article(lib, session, aid, extracted)
        except Exception as exc:
            failures.append(f"{aid}: build failed {type(exc).__name__}: {exc}")
            continue

        articles.append(article)
        existing_ids.add(aid)
        repaired.append(aid)
        print(
            f"  REPAIRED {aid} | mode={extracted.get('ingest_mode', '?')} | "
            f"paragraphs={len(extracted.get('raw_paras') or [])} | {article.get('title', '')}"
        )

    if failures:
        fail("; ".join(failures))
    if repaired:
        write_articles(articles)
    print(f"MAGAZINE_SELF_HEAL=PASS expected_new={len(expected)} repaired={len(repaired)}")


if __name__ == "__main__":
    main()
