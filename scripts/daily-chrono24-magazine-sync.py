#!/usr/bin/env python3
"""
Belgin Saat & Kuyumculuk — Günlük Chrono24 Magazin Otomatik Senkronizasyon & SEO Motoru
--------------------------------------------------------------------------------------
Bu motor:
1. https://www.chrono24.com/magazine/ ve ilgili kategorilerden yeni makaleleri çeker (Cloudflare Bypass).
2. 3. taraf logo, filigran, personel profil veya çalışan röportajlarını engeller.
3. Chrono24 marka ve pazar yeri ibarelerini sıfır toleransla temizler / Belgin Saat kimliğine uyarlar.
4. Profesyonel İsviçre saatçiliği (horoloji) terminolojisiyle Türkçeleştirir.
5. Yüksek çözünürlüklü kapak görsellerini yerel images/magazine/ dizinine indirir.
6. Google SEO için zengin H2/H3 ara başlıklar, alıntı kutuları ve iç linklemeler üretir.
7. js/magazine_data.js dosyasını günceller ve statik SEO sayfalarını derler.
"""

import os, sys, re, json, time, subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

# Sanal ortam auto-reexec kontrolü
ROOT = "/Users/macair1/projects/belgin"
VENV_PYTHON = os.path.join(ROOT, ".venv", "bin", "python3")
if sys.executable != VENV_PYTHON and os.path.exists(VENV_PYTHON):
    os.execv(VENV_PYTHON, [VENV_PYTHON] + sys.argv)

from curl_cffi import requests
from bs4 import BeautifulSoup

IMG_DIR = os.path.join(ROOT, "images", "magazine")
os.makedirs(IMG_DIR, exist_ok=True)
DATA_JS_PATH = os.path.join(ROOT, "js", "magazine_data.js")

BASE = "https://www.chrono24.com"
SOURCES = [
    f"{BASE}/magazine/",
    f"{BASE}/magazine/category/watch-market/",
    f"{BASE}/magazine/category/watch-guide/",
    f"{BASE}/magazine/category/watch-trends/",
    f"{BASE}/magazine/category/top-10-watches/",
    f"{BASE}/magazine/category/lifestyle/",
    f"{BASE}/magazine/archive/"
]

def slugify_tr(text):
    text = text.lower()
    text = re.sub(r"[ığüşöçİĞÜŞÖÇ]", lambda m: {"ı":"i","ğ":"g","ü":"u","ş":"s","ö":"o","ç":"c","İ":"i","Ğ":"g","Ü":"u","Ş":"s","Ö":"o","Ç":"c"}[m.group(0)], text)
    text = re.sub(r"&[a-z0-9#]+;", "-", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

HOROLOGY_GLOSSARY = [
    (r"(?i)\bgeneva watch days 2026: our recap of day 1\b", "Cenevre Saat Günleri 2026: 1. Gün Özeti ve Yeni Modeller"),
    (r"(?i)\bgeneva watch days\b", "Cenevre Saat Günleri"),
    (r"(?i)\bomega x swatch moonswatch: how long will the hype last\??\b", "Omega x Swatch MoonSwatch: Küresel İlgi ve İkincil Piyasa Trendi Ne Kadar Sürecek?"),
    (r"(?i)\bwater resistant watches: these timepieces look great in, at, and under the water\b", "Su Geçirmez Lüks Saatler: Karada, Denizde ve Derinliklerde Şıklık"),
    (r"(?i)\bleica: from deep heritage in cameras to mechanical watches\b", "Leica: Fotoğrafçılık Mirasından Mekanik Saatçiliğe Uzanan Yolculuk"),
    (r"(?i)\bdoxa: the ocean beckons\b", "Doxa: Okyanusların Çağrısı ve Profesyonel Dalış Saatleri Tarihi"),
    (r"(?i)\btop 10 swiss watch brands at a glance\b", "Bir Bakışta Dünyanın En İyi 10 İsviçre Saat Markası"),
    (r"(?i)\bare luxury watches a good investment in challenging times\??\b", "Zorlu Ekonomik Dönemlerde Lüks Saatler Güvenli Bir Yatırım mı?"),
    (r"(?i)\btop 10 best watch brands of all time\b", "Tüm Zamanların En İyi 10 Saat Markası ve Efsanevi Modelleri"),
    
    # Genel marka / platform arındırma
    (r"(?i)\bchrono24\s*magazine\b", "Belgin Saat Magazin"),
    (r"(?i)\bchrono24\s*report\b", "Belgin Saat Küresel Piyasa Raporu"),
    (r"(?i)\bchrono24\s*price\s*index\b", "Belgin Saat Lüks Fiyat Endeksi"),
    (r"(?i)\bchrono24\s*team\b", "Belgin Saat Uzman Ekibi"),
    (r"(?i)\bchrono24\b", "Belgin Saat"),
    (r"(?i)\bc24\b", "Belgin Saat"),
    (r"(?i)on chrono24", "lüks saat pazarında"),
    (r"(?i)our marketplace", "lüks saat koleksiyonumuzda"),
    (r"(?i)on our platform", "küresel saat piyasasında"),
    (r"(?i)in our community", "saat tutkunları arasında"),

    # Horoloji terimleri
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
    (r"(?i)\bdiving watches\b", "dalış saatleri"),
    (r"(?i)\bchronograph\b", "kronograf"),
    (r"(?i)\btourbillon\b", "tourbillon"),
    (r"(?i)\bminute repeater\b", "dakika tekrarlayıcı (minute repeater)"),
    (r"(?i)\bperpetual calendar\b", "sonsuz takvim (perpetual calendar)"),
    (r"(?i)\bco-axial\b", "Co-Axial"),
    (r"(?i)\bsapphire crystal\b", "safir kristal cam"),
    (r"(?i)\bstainless steel\b", "paslanmaz çelik"),
    (r"(?i)\bpre-owned\b", "ikinci el koleksiyonluk"),
    (r"(?i)\bvintage\b", "vintage"),
    (r"(?i)\bcollector\b", "koleksiyoner"),
    (r"(?i)\bcollectors\b", "koleksiyonerler"),
    (r"(?i)\bcollection\b", "koleksiyon"),
    (r"(?i)\binvestment\b", "yatırım"),
    (r"(?i)\bsecondary market\b", "ikincil piyasa"),
    (r"(?i)\bluxury watches\b", "lüks saatler"),
    (r"(?i)\bluxury watch\b", "lüks saat")
]

def clean_and_translate_text(text):
    if not text:
        return ""
    t = text
    for pat, repl in HOROLOGY_GLOSSARY:
        t = re.sub(pat, repl, t)
    
    # Genel İngilizce kalıpları Türkçe karşılıkları
    phrases = [
        (r"(?i)\bThe (\d+) most popular\b", r"En Çok Tercih Edilen \1"),
        (r"(?i)\bmost popular\b", "En Popüler"),
        (r"(?i)\bwatch guide\b", "Saat Rehberi"),
        (r"(?i)\bbuyer'?s guide\b", "Koleksiyoner & Alıcı Rehberi"),
        (r"(?i)\bprice development\b", "Değer ve Fiyat Gelişimi"),
        (r"(?i)\bvalue development\b", "Yatırım ve Değer Artışı"),
        (r"(?i)\bover the past (\d+) years\b", r"Son \1 Yıldaki Gelişim"),
        (r"(?i)\bunder \$?(\d+[\d,]*)\b", r"\1 Dolar Altı"),
        (r"(?i)\bbetween \$?(\d+[\d,]*) and \$?(\d+[\d,]*)\b", r"\1 - \2 Dolar Arası"),
        (r"(?i)\bdiscontinued:?\b", "Üretimi Sona Eren:"),
        (r"(?i)\band the best alternatives\b", "ve En İyi Alternatifler"),
        (r"(?i)\baffordable alternatives to the\b", "İçin En Uygun Alternatifler:"),
        (r"(?i)\bwhich is the better travel companion\??\b", "Hangisi Daha İyi Bir Seyahat Arkadaşı?"),
        (r"(?i)\bour recap of day 1\b", "1. Gün Özeti ve Öne Çıkanlar"),
        (r"(?i)\bhow long will the hype last\??\b", "Popülarite Ne Kadar Sürecek?"),
        (r"(?i)\bthese timepieces look great in, at, and under the water\b", "Karada, Denizde ve Derinliklerde Mükemmel Bir Duruş"),
        (r"(?i)\bfrom deep heritage in cameras to mechanical watches\b", "Fotoğrafçılık Mirasından Mekanik Saatçiliğe"),
        (r"(?i)\bthe ocean beckons\b", "Okyanusların Çağrısı"),
        (r"(?i)\bat a glance\b", "Bir Bakışta"),
        (r"(?i)\bare watches really a good investment\??\b", "Lüks Saatler Gerçekten İyi Bir Yatırım mı?"),
        (r"(?i)\bbest watch brands of all time\b", "Tüm Zamanların En İyi Saat Markaları"),
        (r"(?i)\bin challenging times\b", "Zorlu Ekonomik Dönemlerde"),
        (r"&#8217;", "’"),
        (r"&#8216;", "‘"),
        (r"&#8220;", "“"),
        (r"&#8221;", "”"),
        (r"&#8211;", "–"),
        (r"&#8212;", "—"),
        (r"&#038;", "&"),
        (r"&amp;", "&")
    ]
    for p_pat, p_rep in phrases:
        t = re.sub(p_pat, p_rep, t)
        
    t = re.sub(r"\s+", " ", t).strip()
    return t

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
        print(f"[GÖRSEL HATA] {img_url}: {e}")
    return img_url

def translate_article_content(title, raw_paras, url):
    """
    Ham paragrafları alır, profesyonel Türkçeye adapte eder,
    SEO odaklı H2/H3 ara başlıklar, özgün alıntı ve iç bağlantılarla zenginleştirir.
    """
    clean_paras = []
    for p in raw_paras:
        # Filtreleme: çerez, telif, yazar biyo, bülten
        if any(b in p.lower() for b in ["cookie", "çerez", "all rights reserved", "copyright", "newsletter", "subscribe", "written by", "author:", "chrono24"]):
            continue
        cleaned = clean_and_translate_text(p)
        if len(cleaned) > 40 and cleaned not in clean_paras:
            clean_paras.append(cleaned)

    if not clean_paras:
        clean_paras = [
            f"{title} hakkında lüks saat dünyasından en güncel gelişmeler, koleksiyoner analizleri ve piyasa trendleri Belgin Saat Magazin'de detaylı olarak incelenmektedir.",
            "Yüksek saatçilik dünyasında teknik mükemmellik ve estetik zarafet, köklü manüfaktürlerin asırlık mirasıyla buluşuyor.",
            "İkincil piyasa dinamikleri, nadir referansların ve ikonik kalibrelerin değerini koruma gücünü bir kez daha gözler önüne seriyor."
        ]

    # Başlığa ve temaya özel alıntı ve ara başlıklar
    lead_para = clean_paras[0]
    
    quote_text = "Lüks bir mekanik saat yalnızca zamanı ölçen bir enstrüman değil; nesilden nesile aktarılan yaşayan bir sanat eseridir."
    if "dalis" in title.lower() or "water" in title.lower() or "doxa" in title.lower() or "su gecirmez" in title.lower():
        quote_text = "Derinliklerin karanlığında parlayan indeksler, profesyonel bir dalgıç saatini su altında ve günlük yaşamda hayati bir yol arkadaşına dönüştürür."
    elif "yatirim" in title.lower() or "investment" in title.lower() or "deger" in title.lower():
        quote_text = "Saatçilikte en kârlı yatırım; geçici spekülatif heveslerin ötesinde, özgün kondisyonunu koruyan asırlık klasiklere yönelmektir."
    elif "moonswatch" in title.lower() or "omega" in title.lower():
        quote_text = "Efsanevi Speedmaster mirasının popüler kültürle buluşması, yeni nesil saat meraklılarını horoloji evrenine çeken küresel bir fenomendir."
    elif "cenevre" in title.lower() or "geneva" in title.lower():
        quote_text = "Cenevre'nin göl kıyısında buluşan bağımsız ustalar ve tarihi saat evleri, mekanik saatçiliğin geleceğini şekillendiriyor."
    elif "isvicre" in title.lower() or "swiss" in title.lower():
        quote_text = "İsviçre saatçiliğinin zirvesi; el işçiliği finisajlar, Cenevre Mührü ve yüzyılları aşan manüfaktür disiplininin ortak zaferidir."

    html_parts = [f'<p class="mag-lead-para">{lead_para}</p>']
    
    # Ara başlık 1
    html_parts.append('<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>')
    for p in clean_paras[1:3]:
        html_parts.append(f'<p>{p}</p>')
        
    # Alıntı kutusu
    html_parts.append(f'<div class="mag-quote-box"><blockquote>“{quote_text}”</blockquote></div>')
    
    # Ara başlık 2
    html_parts.append('<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>')
    for p in clean_paras[3:5]:
        html_parts.append(f'<p>{p}</p>')
        
    # İç Bağlantı ve Koleksiyoner Tavsiyesi
    html_parts.append('<h3 class="mag-subheading-h3">Koleksiyon Değeri ve Alıcı Rehberi</h3>')
    if len(clean_paras) > 5:
        for p in clean_paras[5:8]:
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

def determine_category_and_slug(title, raw_title):
    t = title.lower() + " " + raw_title.lower()
    cat = "Saat Dünyası & Analiz"
    if "rolex" in t:
        cat = "Rolex & Piyasa"
    elif "omega" in t or "speedmaster" in t or "moonswatch" in t:
        cat = "Omega & Koleksiyon"
    elif "patek" in t or "audemars" in t or "vacheron" in t or "haute" in t:
        cat = "Haute Horlogerie"
    elif "dalis" in t or "diver" in t or "water" in t or "su gecirmez" in t or "doxa" in t:
        cat = "Dalış Saatleri"
    elif "yatirim" in t or "investment" in t or "piyasa" in t or "fiyat" in t:
        cat = "Piyasa & Yatırım"
    elif "isvicre" in t or "swiss" in t:
        cat = "İsviçre Saatçiliği"
    elif "rehber" in t or "guide" in t:
        cat = "Alıcı Rehberi"

    slug = slugify_tr(title)
    if len(slug) > 75:
        slug = slug[:75].rstrip("-")
    return cat, slug

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
        
        h1 = soup.find("h1")
        raw_title = h1.get_text(strip=True) if h1 else ""
        if not raw_title and json_ld:
            raw_title = json_ld.get("headline", "")
        if not raw_title:
            return None

        # 🛡️ GÜVENLİK FİLTRESİ: Personel profilleri, çalışan röportajları ve logo filigranlı içerikleri engelle
        if re.search(r"(?i)favorite\s*watches|staff\s*picks|steiert|gehrlein|breining|team\s*member|employee|chrono24\s*team", raw_title + " " + url):
            print(f"[SYNC ATLA] 3. taraf personel/logo makalesi engellendi: {url}")
            return None

        title = clean_and_translate_text(raw_title)
        category, slug = determine_category_and_slug(title, raw_title)

        raw_date = ""
        if json_ld and json_ld.get("datePublished"):
            raw_date = json_ld.get("datePublished")[:10]
        if not raw_date:
            date_tag = soup.find("time") or soup.select_one(".date, .published")
            if date_tag:
                raw_date = date_tag.get("datetime") or date_tag.get_text().strip()
        if not raw_date:
            raw_date = time.strftime("%Y-%m-%d")
        date_tr = format_date_tr(raw_date)

        # Resim bulma
        hero_img_url = ""
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src") or ""
            if "magazine-article/" in src and not any(b in src for b in ["300x300", "logo", "flag", "144/"]):
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
        final_img = download_image(hero_img_url, img_filename) if hero_img_url else "images/hero-belgin-signature.webp"

        raw_paras = [p.get_text(strip=True) for p in soup.find_all("p")]
        content_html = translate_article_content(title, raw_paras, url)
        
        # Özet
        summary_m = re.search(r'<p class="mag-lead-para">(.*?)</p>', content_html)
        summary = summary_m.group(1) if summary_m else f"{title} hakkında detaylı saatçilik analizi."
        read_time = f"{max(4, round(len(content_html) / 450))} dk okuma"

        return {
            "id": art_id,
            "slug": slug,
            "title": title,
            "category": category,
            "publish_date": date_tr,
            "raw_date": raw_date,
            "author": "Belgin Saat & Mücevherat Editoryal Kurulu",
            "read_time": read_time,
            "image": final_img,
            "summary": summary,
            "content_html": content_html,
            "source_url": url
        }
    except Exception as e:
        print(f"[HATA] {url} çekilemedi: {e}")
        return None

def main():
    print("====================================================================")
    print("🚀 BELGİN SAAT — CHRONO24 MAGAZİN OTOMATİK SENKRONİZASYON MOTORU")
    print("====================================================================")
    
    existing_articles = []
    if os.path.exists(DATA_JS_PATH):
        try:
            with open(DATA_JS_PATH, "r", encoding="utf8") as f:
                content = f.read()
                m = re.search(r"const MAGAZINE_ARTICLES = (\[.*?\]);", content, re.DOTALL)
                if m:
                    existing_articles = json.loads(m.group(1))
        except Exception as e:
            print(f"Mevcut veriler yüklenirken hata: {e}")

    existing_ids = {a["id"] for a in existing_articles}
    existing_urls = {a.get("source_url") for a in existing_articles if a.get("source_url")}

    print(f"Mevcut yayındaki makale sayısı: {len(existing_articles)}")
    print("Chrono24 Magazine kaynakları ve post-sitemap.xml taranıyor...")

    discovered_urls = []
    
    # 1. Öncelikli olarak post-sitemap.xml'den tüm güncel URL'leri çek
    try:
        sm_res = requests.get(f"{BASE}/magazine/post-sitemap.xml", impersonate="chrome", timeout=15)
        if sm_res.status_code == 200:
            sm_urls = re.findall(r"<loc>(https://www.chrono24.com/magazine/[^<]+)</loc>", sm_res.text)
            for u in sm_urls:
                if u not in discovered_urls:
                    discovered_urls.append(u)
            print(f"  [Sitemap] {len(sm_urls)} makale URL'si keşfedildi.")
    except Exception as e:
        print(f"  [Sitemap Hata]: {e}")

    # 2. Kategori sayfalarını da tara
    for src in SOURCES:
        try:
            res = requests.get(src, impersonate="chrome", timeout=15)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    h = a["href"]
                    if re.search(r"/magazine/[a-z0-9\-]+-p_\d+/", h):
                        full = BASE + h if h.startswith("/") else h
                        if full not in discovered_urls:
                            discovered_urls.append(full)
        except Exception as e:
            print(f"[TARAMA HATA] {src}: {e}")

    print(f"Toplam keşfedilen makale URL'si: {len(discovered_urls)}")
    new_urls = []
    for u in discovered_urls:
        id_m = re.search(r"p_(\d+)", u)
        art_id = f"mag-{id_m.group(1)}" if id_m else None
        if art_id and art_id in existing_ids:
            continue
        if u in existing_urls:
            continue
        if re.search(r"(?i)staff|picks|team|author|employee|favorite-watches|steiert|gehrlein|breining|gtg", u):
            continue
        new_urls.append(u)

    print(f"Yeni eklenecek makale sayısı: {len(new_urls)}")

    new_articles = []
    if new_urls:
        target_urls = new_urls
        with ThreadPoolExecutor(max_workers=6) as executor:
            future_to_url = {executor.submit(scrape_single_article, u): u for u in target_urls}
            for future in as_completed(future_to_url):
                res = future.result()
                if res and res["id"] not in existing_ids:
                    new_articles.append(res)
                    existing_ids.add(res["id"])
                    print(f"  + Eklendi: {res['title']} ({res['slug']})")

    if new_articles:
        print(f"✅ {len(new_articles)} yeni makale başarıyla çekildi ve Türkçeleştirildi.")
        all_articles = new_articles + existing_articles
    else:
        print("Yeni içerik bulunamadı; mevcut içerikler sanitize ediliyor.")
        all_articles = existing_articles

    # En yeni makaleler en başta (descending) olacak şekilde sırala
    all_articles.sort(key=lambda a: (a.get("raw_date", "") or "", a.get("id", "") or ""), reverse=True)

    # js/magazine_data.js dosyasını kaydet
    js_content = f"""// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: {time.strftime('%Y-%m-%d %H:%M')} (Otomatik Senkronizasyon & SEO Uyumlu)
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

    # Otomatik olarak güvenlik filtresini ve SEO sayfalarını çalıştır
    print("\n🛡️ Güvenlik Filtresi ve Statik SEO Sayfaları Derleniyor...")
    try:
        subprocess.run(["node", os.path.join(ROOT, "scripts", "magazine-safety-filter.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "generate-static-seo-pages.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "inject-seo-schemas.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "generate-seo-assets.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "sync-seo-redirects.js")], check=True)
        print("🎉 TÜM SENKRONİZASYON VE SEO DERLEME SÜRECİ BAŞARIYLA TAMAMLANDI!")
    except Exception as e:
        print(f"[HATA] SEO derleme komutlarında sorun: {e}")

if __name__ == "__main__":
    main()
