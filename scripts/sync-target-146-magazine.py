#!/usr/bin/env python3
"""
Belgin Saat & Kuyumculuk — Magazin Hedef 146 İçerik Senkronizasyon Motoru
-------------------------------------------------------------------------
1. js/magazine_data.js içindeki mevcut makaleleri korur (72 adet).
2. https://www.chrono24.com/magazine/post-sitemap.xml üzerinden yeni makaleleri tespit eder.
3. 3. taraf logo, filigran, personel profil veya çalışan röportajlarını engeller.
4. Chrono24 / ChronoPulse / C24 ve pazar yeri ibarelerini sıfır toleransla arındırır.
5. GoogleTranslator ve Horoloji terimler sözlüğüyle profesyonel Türkçeye adapte eder.
6. Kapak görsellerini yerel images/magazine/ dizinine indirir.
7. Toplam makale sayısını 146'ya tamamlar ve tarihe göre en yeniden en eskiye sıralar.
"""

import os, sys, re, json, time
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = "/Users/macair1/projects/belgin"
VENV_PYTHON = os.path.join(ROOT, ".venv", "bin", "python3")
if sys.executable != VENV_PYTHON and os.path.exists(VENV_PYTHON):
    os.execv(VENV_PYTHON, [VENV_PYTHON] + sys.argv)

from curl_cffi import requests
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator

translator = GoogleTranslator(source='en', target='tr')

IMG_DIR = os.path.join(ROOT, "images", "magazine")
os.makedirs(IMG_DIR, exist_ok=True)
DATA_JS_PATH = os.path.join(ROOT, "js", "magazine_data.js")

BASE = "https://www.chrono24.com"
SITEMAP_URL = f"{BASE}/magazine/post-sitemap.xml"

TARGET_TOTAL = 146

def slugify_tr(text):
    text = text.lower()
    text = re.sub(r"[ığüşöçİĞÜŞÖÇ]", lambda m: {"ı":"i","ğ":"g","ü":"u","ş":"s","ö":"o","ç":"c","İ":"i","Ğ":"g","Ü":"u","Ş":"s","Ö":"o","Ç":"c"}[m.group(0)], text)
    text = re.sub(r"&[a-z0-9#]+;", "-", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

HOROLOGY_GLOSSARY = [
    (r"(?i)\bgeneva watch days\b", "Cenevre Saat Günleri"),
    (r"(?i)\bwatch guide\b", "Saat Rehberi"),
    (r"(?i)\bbuyer'?s guide\b", "Alıcı ve Koleksiyoner Rehberi"),
    (r"(?i)\bprice development\b", "Fiyat ve Değer Gelişimi"),
    (r"(?i)\bvalue development\b", "Yatırım ve Değer Artışı"),
    (r"(?i)\bover the past (\d+) years\b", r"Son \1 Yıldaki Gelişim"),
    (r"(?i)\bdiscontinued:?\b", "Üretimden Kaldırılan:"),
    (r"(?i)\band the best alternatives\b", "ve En İyi Alternatifler"),
    (r"(?i)\baffordable alternatives to the\b", "İçin En Uygun Alternatifler:"),
    (r"(?i)\bare luxury watches a good investment\b", "Lüks Saatler Güvenli Bir Yatırım mı?"),
    (r"(?i)\bwatch brands\b", "saat markaları"),
    (r"(?i)\bwatch brand\b", "saat markası"),
    (r"(?i)\bhaute horlogerie\b", "Haute Horlogerie (Yüksek Saatçilik)"),
    (r"(?i)\bwatchmaking\b", "saatçilik"),
    (r"(?i)\bwatchmaker\b", "saat ustası"),
    (r"(?i)\btimepiece\b", "saat"),
    (r"(?i)\btimepieces\b", "saatler"),
    (r"(?i)\bdial\b", "kadran"),
    (r"(?i)\bdials\b", "kadranlar"),
    (r"(?i)\bbezel\b", "çerçeve (bezel)"),
    (r"(?i)\bcase\b", "kasa"),
    (r"(?i)\bmovement\b", "mekanizma (kalibre)"),
    (r"(?i)\bpower reserve\b", "güç rezervi"),
    (r"(?i)\bwater resistance\b", "su geçirmezlik"),
    (r"(?i)\bwater resistant\b", "su geçirmez"),
    (r"(?i)\bdiver watch\b", "dalış saati"),
    (r"(?i)\bdiver watches\b", "dalış saatleri"),
    (r"(?i)\bdive watch\b", "dalış saati"),
    (r"(?i)\bdive watches\b", "dalış saatleri"),
    (r"(?i)\bdiving watch\b", "dalış saati"),
    (r"(?i)\bchronograph\b", "kronograf"),
    (r"(?i)\btourbillon\b", "tourbillon"),
    (r"(?i)\bminute repeater\b", "dakika tekrarlayıcı (minute repeater)"),
    (r"(?i)\bperpetual calendar\b", "sonsuz takvim (perpetual calendar)"),
    (r"(?i)\bsapphire crystal\b", "safir kristal cam"),
    (r"(?i)\bstainless steel\b", "paslanmaz çelik"),
    (r"(?i)\bpre-owned\b", "ikinci el koleksiyonluk"),
    (r"(?i)\bsecondary market\b", "ikincil piyasa"),
    (r"(?i)\bluxury watches\b", "lüks saatler"),
    (r"(?i)\bluxury watch\b", "lüks saat"),
    # Marka temizliği
    (r"(?i)\bOurChronoPulse Index\b", "Belgin Saat Lüks Değer Endeksi"),
    (r"(?i)\bChronoPulse Index\b", "Belgin Saat Lüks Değer Endeksi"),
    (r"(?i)\bChronoPulse\b", "Belgin Saat Lüks Değer Endeksi"),
    (r"(?i)\bchrono24\s*magazine\b", "Belgin Saat Magazin"),
    (r"(?i)\bchrono24\s*report\b", "Belgin Saat Küresel Piyasa Raporu"),
    (r"(?i)\bchrono24\s*price\s*index\b", "Belgin Saat Lüks Fiyat Endeksi"),
    (r"(?i)\bchrono24\s*team\b", "Belgin Saat Editoryal Kurulu"),
    (r"(?i)\bchrono24\b", "Belgin Saat"),
    (r"(?i)\bc24\b", "Belgin Saat"),
    (r"(?i)\bour marketplace\b", "lüks saat koleksiyonumuz"),
    (r"(?i)\bon our platform\b", "küresel saat piyasasında"),
    (r"(?i)\bin our community\b", "saat tutkunları arasında")
]

def sanitize_text(text):
    if not text:
        return ""
    t = text
    for pat, repl in HOROLOGY_GLOSSARY:
        t = re.sub(pat, repl, t)

    t = (t.replace("&#8217;", "’")
          .replace("&#8216;", "‘")
          .replace("&#8220;", "“")
          .replace("&#8221;", "”")
          .replace("&#8211;", "–")
          .replace("&#8212;", "—")
          .replace("&#038;", "&")
          .replace("&amp;", "&")
          .replace("&quot;", '"')
          .replace("İzleme Günleri", "Saat Günleri")
          .replace("İzleme Gün", "Saat Gün")
          .replace("İzleme Rehberi", "Saat Rehberi")
          .replace("İzle Yıldönümleri", "Saat Yıldönümleri")
          .replace("İzleme", "Saat")
          .replace("izleme", "saat")
          .replace("Belgin Saat’s", "Belgin Saat")
          .replace("Belgin Saat's", "Belgin Saat")
          .replace("Belgin Saat’te", "Belgin Saat'te")
          .replace("Most Right Now", "")
          .replace("Models on Belgin Saat", "Modelleri")
          .replace("20.000 Dolar Altı €", "20.000 Dolar Altı")
          .replace("Dolar Altı €", "Dolar Altı"))
    t = re.sub(r"\s+", " ", t).strip()
    return t

def translate_text(text):
    if not text:
        return ""
    sanitized_in = sanitize_text(text)
    # İngilizce kelimeler içeriyorsa GoogleTranslator ile çevir
    has_english = bool(re.search(r"\b(the|and|with|from|which|this|that|their|about|into|more|over|years|market|watches|collection|diver|watch|these|timepieces|look|great|under|water|for|best|top|guide)\b", sanitized_in, re.IGNORECASE))
    if has_english:
        try:
            if len(sanitized_in) > 2000:
                parts = re.split(r'(?<=[.!?]) +', sanitized_in)
                chunk, res = [], []
                for p in parts:
                    chunk.append(p)
                    if len(" ".join(chunk)) > 1200:
                        res.append(translator.translate(" ".join(chunk)))
                        chunk = []
                if chunk:
                    res.append(translator.translate(" ".join(chunk)))
                translated = " ".join(res)
            else:
                translated = translator.translate(sanitized_in)
            return sanitize_text(translated)
        except Exception as e:
            print(f"  [Çeviri Hatası]: {e}")
            return sanitize_text(sanitized_in)
    return sanitize_text(sanitized_in)

def format_date_tr(date_str):
    if not date_str:
        return "Eylül 2026"
    try:
        m = re.match(r"(\d{4})-(\d{2})-(\d{2})", date_str)
        if m:
            y, mo, d = m.groups()
            months = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
            mo_idx = int(mo)
            mo_name = months[mo_idx] if 1 <= mo_idx <= 12 else "Eylül"
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
    except Exception as e:
        print(f"  [Görsel İndirme Hatası] {img_url}: {e}")
    return "images/hero-belgin-signature.webp"

def determine_category(title):
    t = title.lower()
    if "rolex" in t:
        return "Rolex & Piyasa"
    if "omega" in t or "speedmaster" in t or "moonswatch" in t or "seamaster" in t:
        return "Omega & Koleksiyon"
    if "patek" in t or "audemars" in t or "vacheron" in t or "haute" in t:
        return "Haute Horlogerie"
    if "dalis" in t or "dalgic" in t or "diver" in t or "water" in t or "su gecirmez" in t or "doxa" in t:
        return "Dalış Saatleri"
    if "yatirim" in t or "investment" in t or "piyasa" in t or "fiyat" in t or "endeks" in t:
        return "Piyasa & Yatırım"
    if "isvicre" in t or "swiss" in t:
        return "İsviçre Saatçiliği"
    if "rehber" in t or "guide" in t or "nasil" in t or "alternatif" in t or "en iyi" in t:
        return "Alıcı Rehberi"
    return "Saat Dünyası & Analiz"

def build_article_html(title, paras):
    clean_paras = []
    for p in paras:
        if any(b in p.lower() for b in ["cookie", "çerez", "all rights reserved", "copyright", "newsletter", "subscribe", "written by", "author:", "chrono24"]):
            continue
        cleaned = translate_text(p)
        if len(cleaned) > 40 and cleaned not in clean_paras:
            clean_paras.append(cleaned)

    if not clean_paras:
        clean_paras = [
            f"{title} konusunda lüks saat dünyasından en güncel gelişmeler, koleksiyoner analizleri ve piyasa trendleri Belgin Saat Magazin'de detaylı olarak incelenmektedir.",
            "Yüksek saatçilik dünyasında teknik mükemmellik ve estetik zarafet, köklü manüfaktürlerin asırlık mirasıyla buluşuyor.",
            "İkincil piyasa dinamikleri, nadir referansların ve ikonik kalibrelerin değerini koruma gücünü bir kez daha gözler önüne seriyor."
        ]

    lead_para = clean_paras[0]
    quote_text = "Lüks bir mekanik saat yalnızca zamanı ölçen bir enstrüman değil; nesilden nesile aktarılan yaşayan bir sanat eseridir."
    t_lower = title.lower()
    if any(k in t_lower for k in ["dalis", "su gecirmez", "doxa", "diver"]):
        quote_text = "Derinliklerin karanlığında parlayan indeksler, profesyonel bir dalgıç saatini su altında ve günlük yaşamda hayati bir yol arkadaşına dönüştürür."
    elif any(k in t_lower for k in ["yatirim", "fiyat", "deger", "piyasa"]):
        quote_text = "Saatçilikte en kârlı yatırım; geçici spekülatif heveslerin ötesinde, özgün kondisyonunu koruyan asırlık klasiklere yönelmektir."
    elif "rolex" in t_lower:
        quote_text = "Rolex saatçilikte bir standarttır; her referans, mükemmel mühendislik ile küresel prestijin kusursuz dengesini temsil eder."
    elif "omega" in t_lower:
        quote_text = "Speedmaster ve Seamaster efsaneleri, insanın sınırları aşma arzusunu mekanik bir başyapıta dönüştüren yaşayan bir mirastır."

    html_parts = [f'<p class="mag-lead-para">{lead_para}</p>']
    html_parts.append('<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>')
    for p in clean_paras[1:3]:
        html_parts.append(f'<p>{p}</p>')

    html_parts.append(f'<div class="mag-quote-box"><blockquote>“{quote_text}”</blockquote></div>')
    html_parts.append('<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>')
    for p in clean_paras[3:5]:
        html_parts.append(f'<p>{p}</p>')

    html_parts.append('<h3 class="mag-subheading-h3">Koleksiyon Değeri ve Alıcı Rehberi</h3>')
    if len(clean_paras) > 5:
        for p in clean_paras[5:10]:
            html_parts.append(f'<p>{p}</p>')
    else:
        html_parts.append('<p>Lüks saat piyasasında doğru modele ve orijinal kondisyondaki referanslara ulaşmak, koleksiyonunuzun uzun vadeli değerini koruması açısından kritik önem taşır.</p>')

    html_parts.append(
        '<p class="mag-seo-internal-box" style="margin-top: 2rem; padding: 1.25rem; background: rgba(5,51,47,0.05); border-left: 4px solid var(--color-teal); border-radius: 4px;">'
        '<strong>Belgin Saat Koleksiyonu:</strong> Aradığınız ikonik referansları ve nadir modelleri incelemek için '
        '<a href="/elit-kategori/" style="color: var(--color-teal); font-weight: 600; text-decoration: underline;">Elit Saat Koleksiyonumuzu</a> '
        'veya tüm seçkin <a href="/saatler/" style="color: var(--color-teal); font-weight: 600; text-decoration: underline;">Lüks Saat Modellerimizi</a> ziyaret edebilir, '
        'İzmir Buca showroomumuzda uzman ekibimizden özel ekspertiz randevusu alabilirsiniz.'
        '</p>'
    )
    return "\n".join(html_parts)

def scrape_article(url):
    try:
        res = requests.get(url, impersonate="chrome", timeout=15)
        if res.status_code != 200:
            return None
        soup = BeautifulSoup(res.text, "html.parser")

        # Kimlik
        id_m = re.search(r"p_(\d+)", url)
        art_id = f"mag-{id_m.group(1)}" if id_m else f"mag-{abs(hash(url)) % 100000}"

        h1 = soup.find("h1")
        raw_title = h1.get_text(strip=True) if h1 else ""
        if not raw_title:
            return None

        # Güvenlik filtresi: çalışan/ekip makalelerini engelle
        if re.search(r"(?i)favorite\s*watches|staff\s*picks|steiert|gehrlein|breining|team\s*member|employee|chrono24\s*team", raw_title + " " + url):
            return None

        title = translate_text(raw_title)
        if not title:
            return None

        slug = slugify_tr(title)
        if len(slug) > 75:
            slug = slug[:75].rstrip("-")

        # Tarih
        raw_date = ""
        time_tag = soup.find("time") or soup.select_one(".date, .published")
        if time_tag:
            raw_date = time_tag.get("datetime") or time_tag.get_text().strip()
        if not raw_date:
            m = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", res.text)
            if m:
                raw_date = m.group(1)
        if not raw_date:
            raw_date = time.strftime("%Y-%m-%d")
        date_tr = format_date_tr(raw_date[:10])

        # Görsel
        hero_img_url = ""
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or ""
            if "magazine-article/" in src and not any(b in src for b in ["300x300", "logo", "flag", "144/"]):
                hero_img_url = src
                break

        img_filename = f"{slug[:45]}.jpg"
        final_img = download_image(hero_img_url, img_filename) if hero_img_url else "images/hero-belgin-signature.webp"

        paras = [p.get_text(strip=True) for p in soup.find_all("p")]
        content_html = build_article_html(title, paras)

        lead_m = re.search(r'<p class="mag-lead-para">(.*?)</p>', content_html)
        summary = lead_m.group(1) if lead_m else f"{title} hakkında detaylı lüks saat analizi."
        read_time = f"{max(4, round(len(content_html) / 450))} dk okuma"
        category = determine_category(title)

        return {
            "id": art_id,
            "slug": slug,
            "title": title,
            "category": category,
            "publish_date": date_tr,
            "raw_date": raw_date[:10],
            "author": "Belgin Saat & Mücevherat Editoryal Kurulu",
            "read_time": read_time,
            "image": final_img,
            "summary": summary,
            "content_html": content_html,
            "source_url": url
        }
    except Exception as e:
        print(f"  [Hata {url}]: {e}")
        return None

def main():
    print("=" * 70)
    print("🚀 BELGİN SAAT — MAGAZİN HEDEF 146 İÇERİK SENKRONİZASYON MOTORU")
    print("=" * 70)

    # 1. Mevcut makaleleri yükle
    existing = []
    if os.path.exists(DATA_JS_PATH):
        with open(DATA_JS_PATH, "r", encoding="utf8") as f:
            c = f.read()
            m = re.search(r"const MAGAZINE_ARTICLES = (\[.*?\]);", c, re.DOTALL)
            if m:
                existing = json.loads(m.group(1))

    existing_ids = {a["id"] for a in existing}
    existing_slugs = {a["slug"] for a in existing}
    print(f"📊 Mevcut yayındaki makale sayısı: {len(existing)}")

    needed = TARGET_TOTAL - len(existing)
    if needed <= 0:
        print(f"✅ Zaten {len(existing)} makale mevcut (Hedef: {TARGET_TOTAL}).")
        return

    print(f"🎯 Hedef 146 için gereken yeni makale sayısı: {needed}")

    # 2. Sitemap üzerinden URL'leri keşfet
    print("📡 Chrono24 Magazin post-sitemap.xml taranıyor...")
    r = requests.get(SITEMAP_URL, impersonate="chrome", timeout=15)
    all_sitemap_urls = re.findall(r"<loc>(https://www.chrono24.com/magazine/[^<]+)</loc>", r.text)
    print(f"Toplam keşfedilen sitemap URL sayısı: {len(all_sitemap_urls)}")

    candidates = []
    for u in all_sitemap_urls:
        id_m = re.search(r"p_(\d+)", u)
        art_id = f"mag-{id_m.group(1)}" if id_m else None
        if art_id and art_id in existing_ids:
            continue
        if re.search(r"(?i)staff|picks|team|author|employee|favorite-watches|steiert|gehrlein|breining|gtg", u):
            continue
        candidates.append(u)

    print(f"İşlenebilir aday makale sayısı: {len(candidates)}")

    # 3. İhtiyaç duyulan miktarı paralel olarak çek
    new_articles = []
    # Fazladan birkaç tane çekelim ki geçersiz çıkan olursa tam 146 olsun
    target_fetch = candidates[:needed + 20]

    print(f"⚡ {len(target_fetch)} aday makale eşzamanlı çekiliyor ve Türkçeleştiriliyor...")

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(scrape_article, u): u for u in target_fetch}
        for fut in as_completed(futures):
            res = fut.result()
            if res and res["id"] not in existing_ids and res["slug"] not in existing_slugs:
                new_articles.append(res)
                existing_ids.add(res["id"])
                existing_slugs.add(res["slug"])
                print(f"  [+] ({len(new_articles)}/{needed}) Eklendi: {res['title'][:60]}... ({res['raw_date']})")
                if len(existing) + len(new_articles) >= TARGET_TOTAL:
                    break

    print(f"\n🎉 Başarıyla çekilen ve hazırlanan yeni makale sayısı: {len(new_articles)}")
    all_articles = existing + new_articles

    # Tam hedef sayıya göre kırp veya sınırla
    if len(all_articles) > TARGET_TOTAL:
        all_articles = all_articles[:TARGET_TOTAL]

    print(f"📦 Son toplam makale sayısı: {len(all_articles)}")

    # En yeni makaleler en başta olacak şekilde tarih sırasına diz
    all_articles.sort(key=lambda a: (a.get("raw_date", "") or "", a.get("id", "") or ""), reverse=True)

    # 4. js/magazine_data.js dosyasını kaydet
    js_content = f"""// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: {time.strftime('%Y-%m-%d %H:%M')} (Otomatik Senkronizasyon & SEO Uyumlu)
// Toplam İçerik: {len(all_articles)} Makale
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
    print(f"💾 {len(all_articles)} makale js/magazine_data.js dosyasına kaydedildi.")

if __name__ == "__main__":
    main()
