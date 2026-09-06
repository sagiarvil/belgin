#!/usr/bin/env python3
"""
Belgin Saat & Kuyumculuk — Lüks Saat Magazin Senkronizasyon & SEO Motoru
--------------------------------------------------------------------------------------
1. https://www.chrono24.com/magazine/ ve kategori sayfalarından yeni makaleleri çeker.
2. 3. taraf logo, filigran, personel profil veya çalışan röportajlarını engeller.
3. 3. taraf marka/pazar yeri ibarelerini sıfır toleransla Belgin Saat kimliğine uyarlar.
4. Profesyonel İsviçre saatçiliği (horoloji) terminolojisiyle Türkçeleştirir.
5. Yüksek çözünürlüklü kapak görsellerini yerel images/magazine/ dizinine indirir.
6. Google SEO için zengin H2/H3 ara başlıklar, alıntı kutuları ve iç linklemeler üretir.
7. js/magazine_data.js dosyasını günceller ve statik SEO sayfalarını derler.
"""

import os, sys, re, json, time, subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
VENV_PYTHON = os.path.join(ROOT, ".venv", "bin", "python3")
if sys.prefix == sys.base_prefix and os.path.exists(VENV_PYTHON):
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
    f"{BASE}/magazine/category/lifestyle/"
]

def slugify_tr(text):
    text = text.lower()
    text = re.sub(r"[ığüşöçİĞÜŞÖÇ]", lambda m: {"ı":"i","ğ":"g","ü":"u","ş":"s","ö":"o","ç":"c","İ":"i","Ğ":"g","Ü":"u","Ş":"s","Ö":"o","Ç":"c"}[m.group(0)], text)
    text = re.sub(r"&[a-z0-9#]+;", "-", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

HOROLOGY_GLOSSARY = [
    (r"(?i)\bgeneva watch days 2026: our highlights from day 3\b", "Cenevre Saat Günleri 2026: 3. Günden Öne Çıkan Başyapıtlar ve Yenilikler"),
    (r"(?i)\bgeneva watch days 2026: our highlights from day 2\b", "Cenevre Saat Günleri 2026: 2. Günden Öne Çıkanlarımız"),
    (r"(?i)\bgeneva watch days 2026: our recap of day 1\b", "Cenevre Saat Günleri 2026: 1. Gün Özeti ve Yeni Modeller"),
    (r"(?i)\bgeneva watch days\b", "Cenevre Saat Günleri"),
    (r"(?i)\brolex gmt-master ii pepsi value performance: a half-year comparison\b", "Rolex GMT-Master II Pepsi Değer ve Fiyat Performansı: Yarıyıl Analizi"),
    (r"(?i)\bomega x swatch moonswatch: how long will the hype last\??\b", "Omega x Swatch MoonSwatch: Küresel İlgi ve İkincil Piyasa Trendi Ne Kadar Sürecek?"),
    (r"(?i)\bwater resistant watches: these timepieces look great in, at, and under the water\b", "Su Geçirmez Lüks Saatler: Karada, Denizde ve Derinliklerde Şıklık"),
    (r"(?i)\bleica: from deep heritage in cameras to mechanical watches\b", "Leica: Fotoğrafçılık Mirasından Mekanik Saatçiliğe Uzanan Yolculuk"),
    (r"(?i)\bdoxa: the ocean beckons\b", "Doxa: Okyanusların Çağrısı ve Profesyonel Dalış Saatleri Tarihi"),
    (r"(?i)\btop 10 swiss watch brands at a glance\b", "Bir Bakışta Dünyanın En İyi 10 İsviçre Saat Markası"),
    (r"(?i)\bare luxury watches a good investment in challenging times\??\b", "Zorlu Ekonomik Dönemlerde Lüks Saatler Güvenli Bir Yatırım mı?"),
    (r"(?i)\bare watches really a good investment\??\b", "Lüks Saatler Gerçekten İyi Bir Yatırım mı?"),
    (r"(?i)\btop 10 best watch brands of all time\b", "Tüm Zamanların En İyi 10 Saat Markası ve Efsanevi Modelleri"),
    (r"(?i)\bthe 10 most famous watches of all time\b", "Tüm Zamanların En Ünlü 10 İkonik Saat Modeli"),
    (r"(?i)\bwatch anniversaries 2026: what the watch world is celebrating this year\b", "2026 Saat Dünyası Yıldönümleri ve Kutlanan Efsanevi Modeller"),
    (r"(?i)\bcartier goes blue: the most beautiful blue dial models\b", "Cartier Mavi Kadran Koleksiyonu: En Şık Mavi Kadranlı Modeller"),
    (r"(?i)\bindie brand portrait: dennison watches\b", "Bağımsız Saat Evi Portresi: Dennison Watches"),
    (r"(?i)\b3 perfect winter watches for the cold season\b", "Kış Sezonu İçin 3 Kusursuz Lüks Saat Tercihi"),
    (r"(?i)\belegant and timeless: cartier watches in black\b", "Zarif ve Zamansız: Siyah Kadranlı Cartier Modelleri"),
    (r"(?i)\bthe best watches of 2025 so far\b", "2025 Yılının En İyi Saatleri ve Öne Çıkan Başyapıtlar"),
    (r"(?i)\b10 best watches under \$?2,?000\b", "2.000 Dolar Altı En İyi 10 Mekanik Saat"),
    (r"(?i)\bfive reasons why watches are perfect graduation gift\b", "Mezuniyet İçin Mekanik Bir Saatin En Mükemmel Hediye Olmasının 5 Sebebi"),
    (r"(?i)\bvintage cars and vintage watches\b", "Klasik Otomobiller ve Vintage Mekanik Saatler"),
    (r"(?i)\btop 10 luxury watches that every watch fan needs to experience\b", "Her Saat Tutkununun Deneyimlemesi Gereken En İyi 10 Lüks Saat"),
    (r"(?i)\bcollecting luxury watches: 7 signs that youve caught the collecting bug\b", "Lüks Saat Koleksiyonculuğu: Saat Tutkunu Olduğunuzu Gösteren 7 İşaret"),
    (r"(?i)\bspring watches for him and her\b", "Bahar Ayları İçin Kadın ve Erkek Lüks Saat Önerileri"),
    (r"(?i)\bstone dials on the wrist\b", "Doğal Taş Kadranlar: Bilekte Eşsiz Doğal Zarafet"),
    (r"(?i)\bvalentines day watches\b", "Sevgililer Günü İçin İkonik Çift Saatleri"),
    (r"(?i)\bour top 5 solar watches\b", "En İyi 5 Güneş Enerjili Yüksek Teknolojili Saat"),
    (r"(?i)\bluxury watches from the 70s back in style\b", "1970'lerin İkonik Lüks Saat Tasarımları Yeniden Zirvede"),
    (r"(?i)\b5 up-and-coming watch brands to look out for\b", "Yükselişte Olan ve Takip Edilmesi Gereken 5 Bağımsız Saat Markası"),
    (r"(?i)\bhollywood stars and their watches\b", "Hollywood Yıldızları ve Tercih Ettikleri Lüks Saatler"),
    (r"(?i)\bour best watches for engagements and weddings\b", "Nişan ve Düğün İçin En Şık Lüks Saat Modelleri"),
    (r"(?i)\btop 5 extreme expedition watches\b", "Zorlu Keşifler İçin En Dayanıklı 5 Ekstrem Macera Saati"),
    (r"(?i)\btop 10 watch icons that were grateful for\b", "Saat Dünyasına Yön Veren En Büyük 10 İkonik Model"),

    # Genel marka / platform arındırma
    (r"(?i)\bchrono24\s*magazine\b", "Belgin Saat Magazin"),
    (r"(?i)\bchrono24\s*report\b", "Belgin Saat Küresel Piyasa Raporu"),
    (r"(?i)\bchrono24\s*price\s*index\b", "Belgin Saat Lüks Fiyat Endeksi"),
    (r"(?i)\bchronopulse\b", "Belgin Saat Lüks Değer Endeksi"),
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
        (r"(?i)\bour highlights from day (\d+)\b", r"\1. Günden Öne Çıkan Başyapıtlar"),
        (r"(?i)\bour recap of day (\d+)\b", r"\1. Gün Özeti ve Öne Çıkanlar"),
        (r"(?i)\bhow long will the hype last\??\b", "Popülarite Ne Kadar Sürecek?"),
        (r"(?i)\ba half-year comparison\b", "Yarıyıl Değer Analizi"),
        (r"(?i)\bat a glance\b", "Bir Bakışta"),
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

def is_image_contaminated(image_path):
    if not os.path.exists(image_path):
        return False
    fname = os.path.basename(image_path).lower()
    for bad in ["rolex-report", "chronopulse", "luks-saat-deger-endeksi", "the-rolex-report", "c24-", "chrono24"]:
        if bad in fname:
            return True
    return False

def download_image(session, img_url, filename):
    local_path = os.path.join(IMG_DIR, filename)
    rel_path = f"images/magazine/{filename}"
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        if is_image_contaminated(local_path):
            try: os.remove(local_path)
            except Exception: pass
            return None
        return rel_path
    try:
        r = session.get(img_url, impersonate="chrome124", timeout=15)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(local_path, "wb") as f:
                f.write(r.content)
            if is_image_contaminated(local_path):
                try: os.remove(local_path)
                except Exception: pass
                return None
            return rel_path
    except Exception as e:
        print(f"[GÖRSEL HATA] {img_url}: {e}")
    return None

def translate_article_content(title, raw_paras):
    clean_paras = []
    for p in raw_paras:
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

    lead_para = clean_paras[0]
    quote_text = "Lüks bir mekanik saat yalnızca zamanı ölçen bir enstrüman değil; nesilden nesile aktarılan yaşayan bir sanat eseridir."
    if "dalis" in title.lower() or "water" in title.lower() or "doxa" in title.lower() or "su gecirmez" in title.lower():
        quote_text = "Derinliklerin karanlığında parlayan indeksler, profesyonel bir dalgıç saatini su altında ve günlük yaşamda hayati bir yol arkadaşına dönüştürür."
    elif "pepsi" in title.lower() or "rolex" in title.lower():
        quote_text = "İkonik çift renkli seramik bezel ve zamansız çelik kasa yapısı, GMT-Master II efsanesini küresel lüks piyasanın en istikrarlı yatırım aracına dönüştürüyor."
    elif "yatirim" in title.lower() or "investment" in title.lower() or "deger" in title.lower():
        quote_text = "Saatçilikte en kârlı yatırım; geçici spekülatif heveslerin ötesinde, özgün kondisyonunu koruyan asırlık klasiklere yönelmektir."
    elif "cenevre" in title.lower() or "geneva" in title.lower():
        quote_text = "Cenevre'nin göl kıyısında buluşan bağımsız ustalar ve tarihi saat evleri, mekanik saatçiliğin geleceğini şekillendiriyor."

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
    elif "cartier" in t:
        cat = "Cartier & Zarafet"
    elif "patek" in t or "audemars" in t or "vacheron" in t or "haute" in t:
        cat = "Haute Horlogerie"
    elif "dalis" in t or "diver" in t or "water" in t or "su gecirmez" in t or "doxa" in t:
        cat = "Dalış Saatleri"
    elif "yatirim" in t or "investment" in t or "piyasa" in t or "fiyat" in t or "deger" in t:
        cat = "Piyasa & Yatırım"
    elif "isvicre" in t or "swiss" in t:
        cat = "İsviçre Saatçiliği"
    elif "rehber" in t or "guide" in t:
        cat = "Alıcı Rehberi"

    slug = slugify_tr(title)
    if len(slug) > 75:
        slug = slug[:75].rstrip("-")
    return cat, slug

def scrape_single_article(session, url):
    try:
        res = session.get(url, impersonate="chrome124", timeout=15)
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
        
        BLOCKED_MAG_IDS = {"mag-180505", "mag-177236"}
        if art_id in BLOCKED_MAG_IDS:
            return None

        h1 = soup.find("h1")
        raw_title = h1.get_text(strip=True) if h1 else ""
        if not raw_title and json_ld:
            raw_title = json_ld.get("headline", "")
        if not raw_title:
            return None

        if re.search(r"(?i)favorite\s*watches|staff\s*picks|steiert|gehrlein|breining|team\s*member|employee|rolex-report|chronopulse", raw_title + " " + url):
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
        final_img = download_image(session, hero_img_url, img_filename) if hero_img_url else None
        if not final_img:
            final_img = "images/magazine/cenevre-saat-gunleri-2026-ozet-ve-yenilikler.jpg"

        raw_paras = [p.get_text(strip=True) for p in soup.find_all("p")]
        content_html = translate_article_content(title, raw_paras)
        
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
            "source_url": ""
        }
    except Exception as e:
        print(f"[HATA] {url} çekilemedi: {e}")
        return None

def main():
    print("====================================================================")
    print("🚀 BELGİN SAAT — MAGAZİN YENİ MAKALE SENKRONİZASYON MOTORU")
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
    print(f"Mevcut yayındaki makale sayısı: {len(existing_articles)}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
    }
    session = requests.Session()
    session.headers.update(headers)

    try:
        session.get(f"{BASE}/magazine/", impersonate="chrome124", timeout=15)
    except Exception as e:
        print(f"Oturum ısıtma hatası: {e}")

    discovered_urls = []
    for src in SOURCES:
        try:
            res = session.get(src, impersonate="chrome124", timeout=15)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")
                count = 0
                for a in soup.find_all("a", href=True):
                    h = a["href"]
                    if "/magazine/" in h and "-p_" in h:
                        full = BASE + h if h.startswith("/") else h
                        if full not in discovered_urls:
                            discovered_urls.append(full)
                            count += 1
                print(f"  [Tarama] {src} -> {count} bağlantı bulundu.")
        except Exception as e:
            print(f"[TARAMA HATA] {src}: {e}")

    print(f"Toplam keşfedilen makale URL'si: {len(discovered_urls)}")
    BLOCKED_SYNC_IDS = {"mag-180505", "mag-177236"}
    new_urls = []
    for u in discovered_urls:
        id_m = re.search(r"p_(\d+)", u)
        art_id = f"mag-{id_m.group(1)}" if id_m else None
        if art_id and (art_id in existing_ids or art_id in BLOCKED_SYNC_IDS):
            continue
        if re.search(r"(?i)staff|picks|team|author|employee|favorite-watches|steiert|gehrlein|breining|gtg|rolex-report|chronopulse", u):
            continue
        new_urls.append(u)

    print(f"Yeni eklenecek makale sayısı: {len(new_urls)}")

    new_articles = []
    for u in new_urls:
        res = scrape_single_article(session, u)
        if res and res["id"] not in existing_ids:
            new_articles.append(res)
            existing_ids.add(res["id"])
            print(f"  + Başarıyla Eklendi: {res['title']} ({res['slug']})")
        time.sleep(0.5)

    if new_articles:
        print(f"✅ {len(new_articles)} yeni makale başarıyla çekildi ve Türkçeleştirildi.")
        all_articles = new_articles + existing_articles
    else:
        print("Yeni eklenecek makale bulunamadı.")
        all_articles = existing_articles

    all_articles.sort(key=lambda a: (a.get("raw_date", "") or "", a.get("id", "") or ""), reverse=True)

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
    print(f"💾 Toplam {len(all_articles)} makale js/magazine_data.js dosyasına kaydedildi.")

    print("\n🛡️ Güvenlik Filtresi ve Statik SEO Sayfaları Derleniyor...")
    try:
        subprocess.run(["node", os.path.join(ROOT, "scripts", "magazine-safety-filter.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "sanitize-public-magazine-provenance.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "generate-static-seo-pages.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "inject-seo-schemas.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "generate-seo-assets.js")], check=True)
        subprocess.run(["node", os.path.join(ROOT, "scripts", "sync-seo-redirects.js")], check=True)
        print("🎉 TÜM SENKRONİZASYON VE SEO DERLEME SÜRECİ BAŞARIYLA TAMAMLANDI!")
    except Exception as e:
        print(f"[HATA] Derleme hatası: {e}")

if __name__ == "__main__":
    main()
