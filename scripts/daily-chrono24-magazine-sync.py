#!/usr/bin/env python3
"""
Belgin Saat — Günlük Chrono24 Magazin Otomatik Senkronizasyon Motoru
Her gün saat 01:00'de çalışır, yeni magazin makalelerini çeker, Türkçeleştirir,
görselleri kaydeder ve yayına alır.
"""

import os, sys, re, json, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from curl_cffi import requests
from bs4 import BeautifulSoup

ROOT = "/Users/macair1/projects/belgin"
IMG_DIR = os.path.join(ROOT, "images", "magazine")
os.makedirs(IMG_DIR, exist_ok=True)

DATA_JS_PATH = os.path.join(ROOT, "js", "magazine_data.js")

BASE = "https://www.chrono24.com"
SOURCES = [
    f"{BASE}/magazine/archive/",
    f"{BASE}/magazine/category/watch-market/",
    f"{BASE}/magazine/category/watch-guide/",
    f"{BASE}/magazine/category/watch-trends/",
    f"{BASE}/magazine/category/top-10-watches/",
    f"{BASE}/magazine/category/lifestyle/"
]

def slugify(text):
    text = text.lower()
    text = re.sub(r"[ığüşöçİĞÜŞÖÇ]", lambda m: {"ı":"i","ğ":"g","ü":"u","ş":"s","ö":"o","ç":"c","İ":"i","Ğ":"g","Ü":"u","Ş":"s","Ö":"o","Ç":"c"}[m.group(0)], text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

def clean_and_translate_text(text):
    if not text:
        return ""
    t = text
    t = re.sub(r"(?i)\bchrono24\s*magazine\b", "Belgin Saat Magazin", t)
    t = re.sub(r"(?i)\bchrono24\s*report\b", "Belgin Saat Küresel Piyasa Raporu", t)
    t = re.sub(r"(?i)\bchrono24\s*price\s*index\b", "Belgin Saat Lüks Fiyat Endeksi", t)
    t = re.sub(r"(?i)\bchrono24\b", "Belgin Saat", t)
    t = re.sub(r"(?i)\bc24\b", "Belgin Saat", t)
    t = re.sub(r"(?i)on chrono24", "küresel lüks saat pazarında", t)
    t = re.sub(r"(?i)our marketplace", "lüks saat koleksiyonumuzda", t)
    t = re.sub(r"(?i)\bthe (\d+) most popular\b", r"En Çok Tercih Edilen \1", t)
    t = re.sub(r"(?i)\bmost popular\b", "En Popüler", t)
    t = re.sub(r"(?i)\bwatch guide\b", "Saat Rehberi", t)
    t = re.sub(r"(?i)\bbuyer'?s guide\b", "Koleksiyoner & Alıcı Rehberi", t)
    t = re.sub(r"(?i)\bprice development\b", "Değer ve Fiyat Gelişimi", t)
    t = re.sub(r"(?i)\bvalue development\b", "Yatırım ve Değer Artışı", t)
    t = re.sub(r"(?i)\bover the past (\d+) years\b", r"Son \1 Yıldaki Gelişim", t)
    t = re.sub(r"(?i)\bunder \$?(\d+[\d,]*)\b", r"\1 Dolar Altı", t)
    t = re.sub(r"(?i)\bbetween \$?(\d+[\d,]*) and \$?(\d+[\d,]*)\b", r"\1 - \2 Dolar Arası", t)
    t = re.sub(r"(?i)\bhow a waterproof case changed the world of watches\b", "Su Geçirmez Kasa Saatçilik Dünyasını Nasıl Değiştirdi?", t)
    t = re.sub(r"(?i)\bswiss watchmaking for a new generation\b", "Yeni Nesil İsviçre Saatçiliği", t)
    t = re.sub(r"(?i)\bwhat to expect at\b", "Öne Çıkan Yenilikler:", t)
    t = re.sub(r"(?i)\bdiscontinued:?\b", "Üretimi Sona Eren:", t)
    t = re.sub(r"(?i)\band the best alternatives\b", "ve En İyi Alternatifler", t)
    t = re.sub(r"(?i)\baffordable alternatives to the\b", "İçin En Uygun Alternatifler:", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def format_date_tr(date_str):
    if not date_str:
        return "Ağustos 2026"
    try:
        m = re.match(r"(\d{4})-(\d{2})-(\d{2})", date_str)
        if m:
            y, mo, d = m.groups()
            months = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
            mo_idx = int(mo)
            mo_name = months[mo_idx] if 1 <= mo_idx <= 12 else "Ağustos"
            return f"{int(d)} {mo_name} {y}"
    except Exception:
        pass
    return date_str

def download_image(img_url, filename):
    local_path = os.path.join(IMG_DIR, filename)
    rel_path = f"images/magazine/{filename}"
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        return rel_path
    try:
        r = requests.get(img_url, impersonate="chrome", timeout=15)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(local_path, "wb") as f:
                f.write(r.content)
            return rel_path
    except Exception:
        pass
    return img_url

def scrape_single_article(url):
    try:
        res = requests.get(url, impersonate="chrome", timeout=15)
        if res.status_code != 200:
            return None
        soup = BeautifulSoup(res.text, "html.parser")
        
        json_ld = None
        for s in soup.find_all("script", type="application/ld+json"):
            try:
                d = json.loads(s.string)
                if isinstance(d, dict) and d.get("@type") in ["Article", "BlogPosting", "NewsArticle"]:
                    json_ld = d
                    break
                elif isinstance(d, dict) and "@graph" in d:
                    for item in d["@graph"]:
                        if item.get("@type") in ["Article", "BlogPosting", "NewsArticle"]:
                            json_ld = item
                            break
            except Exception:
                pass
        
        id_match = re.search(r"p_(\d+)", url)
        art_id = f"mag-{id_match.group(1)}" if id_match else f"mag-{abs(hash(url)) % 100000}"
        
        raw_title = ""
        if json_ld and json_ld.get("headline"):
            raw_title = json_ld.get("headline")
        if not raw_title:
            h1 = soup.find("h1")
            raw_title = h1.get_text().strip() if h1 else ""
        if not raw_title:
            return None
        title = clean_and_translate_text(raw_title)
        slug = slugify(title)
        
        raw_date = ""
        if json_ld and json_ld.get("datePublished"):
            raw_date = json_ld.get("datePublished")
        if not raw_date:
            date_tag = soup.find("time") or soup.select_one(".date, .article-date, .published")
            if date_tag:
                raw_date = date_tag.get("datetime") or date_tag.get_text().strip()
        date_tr = format_date_tr(raw_date)

        hero_img_url = ""
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or ""
            if "magazine-article/" in src or "magazine-content/" in src:
                if not any(bad in src for bad in ["144/", "300x300", "logo", "flag"]):
                    hero_img_url = src
                    break
        if not hero_img_url and json_ld and json_ld.get("image"):
            imgs = json_ld.get("image")
            if isinstance(imgs, list) and len(imgs) > 0:
                first = imgs[0]
                hero_img_url = first.get("contentUrl") if isinstance(first, dict) else str(first)
            elif isinstance(imgs, str):
                hero_img_url = imgs

        img_filename = f"{slug[:45]}.jpg"
        final_img = download_image(hero_img_url, img_filename) if hero_img_url else "images/belgin-logo.png"

        category = "Saat Dünyası & Analiz"
        if "rolex" in title.lower():
            category = "Rolex & Piyasa"
        elif "omega" in title.lower() or "speedmaster" in title.lower():
            category = "Omega & Koleksiyon"
        elif "patek" in title.lower() or "audemars" in title.lower() or "haute" in title.lower():
            category = "Haute Horlogerie"
        elif "tissot" in title.lower() or "tudor" in title.lower() or "longines" in title.lower():
            category = "İsviçre Saatçiliği"
        elif "rehber" in title.lower() or "guide" in title.lower():
            category = "Alıcı Rehberi"
        elif "fiyat" in title.lower() or "değer" in title.lower() or "trend" in title.lower():
            category = "Piyasa & Değer Trendi"

        paragraphs = []
        for p in soup.find_all("p"):
            p_text = p.get_text().strip()
            if len(p_text) > 40 and not any(bad in p_text.lower() for bad in ["cookie", "çerez", "all rights reserved", "copyright", "newsletter", "subscribe"]):
                clean_p = clean_and_translate_text(p_text)
                if clean_p and clean_p not in paragraphs:
                    paragraphs.append(clean_p)
                    
        if len(paragraphs) == 0:
            paragraphs = [f"{title} hakkında lüks saat dünyasından en güncel gelişmeler, koleksiyoner analizleri ve piyasa trendleri Belgin Saat Magazin'de."]

        summary = paragraphs[0] if len(paragraphs) > 0 else title
        read_time = f"{max(3, round(len(' '.join(paragraphs)) / 800))} dk okuma"

        content_html_parts = []
        for idx, p in enumerate(paragraphs[:6]):
            if idx == 2:
                content_html_parts.append(f"<div class='mag-quote-box'><blockquote>“Saatçilikte değer, yalnızca mekanizmanın kusursuzluğunda değil; onun taşıdığı miras ve zaman içindeki kalıcılığında saklıdır.”</blockquote></div>")
            content_html_parts.append(f"<p>{p}</p>")
            
        content_html = "\n".join(content_html_parts)

        return {
            "id": art_id,
            "slug": slug,
            "title": title,
            "category": category,
            "publish_date": date_tr,
            "raw_date": raw_date,
            "author": "Belgin Saat Editör Masası",
            "read_time": read_time,
            "image": final_img,
            "summary": summary,
            "content_html": content_html,
            "source_url": url
        }
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return None

def main():
    print("[SYNC] Chrono24 Magazine Günlük Senkronizasyon Başlatıldı...")
    
    existing_articles = []
    if os.path.exists(DATA_JS_PATH):
        try:
            with open(DATA_JS_PATH, "r", encoding="utf8") as f:
                content = f.read()
                m = re.search(r"const MAGAZINE_ARTICLES = (\[.*?\]);", content, re.DOTALL)
                if m:
                    existing_articles = json.loads(m.group(1))
        except Exception as e:
            print(f"Could not load existing data: {e}")

    existing_ids = {a["id"] for a in existing_articles}
    existing_urls = {a.get("source_url") for a in existing_articles}

    discovered_urls = set()
    for src in SOURCES:
        try:
            res = requests.get(src, impersonate="chrome", timeout=15)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    h = a["href"]
                    if re.search(r"/magazine/[a-z0-9\-]+-p_\d+/", h):
                        full = BASE + h if h.startswith("/") else h
                        discovered_urls.add(full)
        except Exception as e:
            print(f"Error fetching source {src}: {e}")

    new_urls = [u for u in discovered_urls if u not in existing_urls][:15]
    print(f"[SYNC] Bulunan yeni makale sayısı: {len(new_urls)}")

    if new_urls:
        new_articles = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_url = {executor.submit(scrape_single_article, u): u for u in new_urls}
            for future in as_completed(future_to_url):
                res = future.result()
                if res and res["id"] not in existing_ids:
                    new_articles.append(res)

        print(f"[SYNC] Başarıyla işlenen yeni makale: {len(new_articles)}")
        all_articles = new_articles + existing_articles
        all_articles = all_articles[:60]
    else:
        all_articles = existing_articles

    js_content = f"""// ==========================================================
// BELGİN SAAT MAGAZİN — GÜNCEL EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: {time.strftime('%Y-%m-%d')}
// ==========================================================

const MAGAZINE_ARTICLES = {json.dumps(all_articles, ensure_ascii=False, indent=2)};

if (typeof window !== 'undefined') {{
  window.MAGAZINE_ARTICLES = MAGAZINE_ARTICLES;
}}

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ MAGAZINE_ARTICLES }};
}}
"""
    with open(DATA_JS_PATH, "w", encoding="utf8") as f:
        f.write(js_content)
    print(f"[SYNC] Toplam {len(all_articles)} makale ile js/magazine_data.js güncellendi.")

if __name__ == "__main__":
    main()
