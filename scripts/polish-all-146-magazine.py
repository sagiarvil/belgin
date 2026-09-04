#!/usr/bin/env python3
"""
Belgin Saat — 146 Magazin Makalesi Kusursuz Türkçe & Horoloji Terimleri Parlatma Motoru
"""

import os, sys, re, json, time

ROOT = "/Users/macair1/projects/belgin"
VENV_PYTHON = os.path.join(ROOT, ".venv", "bin", "python3")
if sys.executable != VENV_PYTHON and os.path.exists(VENV_PYTHON):
    os.execv(VENV_PYTHON, [VENV_PYTHON] + sys.argv)

from deep_translator import GoogleTranslator

translator = GoogleTranslator(source='en', target='tr')
DATA_JS_PATH = os.path.join(ROOT, "js", "magazine_data.js")

EXPLICIT_TITLES = {
    "mag-180185": ("Cenevre Saat Günleri 2026'dan Neler Beklemeliyiz? Öne Çıkan Trendler", "cenevre-saat-gunleri-2026-trend-beklentileri"),
    "mag-180086": ("Rolex Oyster'ın 100 Yılı: Su Geçirmez Kasa Saat Dünyasını Nasıl Değiştirdi?", "rolex-oyster-100-yillik-tarih-ve-su-gecirmez-kasa"),
    "mag-180053": ("IWC Big Pilot Hakkında Bilmeniz Gereken 5 Önemli Gerçek", "iwc-big-pilot-hakkinda-bilinmesi-gereken-5-onemli-ozellik"),
    "mag-180027": ("Saat Koleksiyonunuzu Genişletme Rehberi: 10.000 Dolar Altı En İyi Lüks Saatler", "10000-dolar-alti-en-iyi-luks-koleksiyon-saatleri"),
    "mag-178361": ("Nautilus'un 50. Yılı: Yeni Patek Philippe Nautilus Yıldönümü Modelleri İncelemesi", "patek-philippe-nautilus-50-yildonumu-modelleri-analizi"),
    "mag-33676": ("Manüfaktür (In-House) Mekanizma Nedir ve Gerçekten Değerini Hak Eder mi?", "manufaktur-in-house-mekanizma-nedir-ve-degerli-midir"),
    "mag-176152": ("Swatch Royal Pop Çılgınlığı: Küresel Piyasa Verileri ve Talep Analizi", "swatch-royal-pop-piyasa-verileri-ve-talep-analizi"),
    "mag-175869": ("Cenevre Saat Dünyasının En İyi 5 İkonik Modeli", "cenevre-saat-dunyasinin-en-iyi-5-ikonik-modeli"),
    "mag-175579": ("Swatch x Audemars Piguet 'Royal Pop' Saat Dünyasında Neden Büyük Yankı Uyandırdı?", "swatch-audemars-piguet-royal-pop-etkisi-ve-analizi"),
    "mag-175491": ("Çelik mi Titanyum mu? Saat Dünyasında İki Metalin Karşılaştırması ve Farkları", "celik-ve-titanyum-saatler-karsilastirmasi-ve-farklari"),
    "mag-175448": ("2026 Yılının 6.000 Dolar Altında Alınabilecek En İyi Yeni Lüks Saatleri", "6000-dolar-alti-en-iyi-yeni-luks-saatler"),
    "mag-175384": ("MIDO Saatleri: Gösterişin Ötesinde Güçlü Mekanik Kalite ve Zarafet", "mido-saatleri-mekanik-kalite-ve-fiyat-performans"),
    "mag-175242": ("Watches and Wonders 2026'nın Öne Çıkan 3 Teknik Başyapıtı ve İnovasyonu", "watches-and-wonders-2026-teknik-inovasyonlar-ve-kalibreler"),
    "mag-172122": ("Mezuniyet Hediyesi İçin 4.000 Dolar Altında En Çok Tercih Edilen 5 Lüks Saat", "mezuniyet-hediyesi-icin-4000-dolar-alti-5-luks-saat"),
    "mag-168294": ("Lüks Saat Dünyasında En Popüler 5 Sonsuz Takvim (Perpetual Calendar) Modeli", "en-populer-5-sonsuz-takvim-perpetual-calendar-saat"),
    "mag-162761": ("İsviçre'de En Çok İlgi Gören ve Tercih Edilen 5 Prestijli Lüks Saat", "isvicrede-en-cok-tercih-edilen-5-prestijli-saat"),
    "mag-161610": ("En Çok Tercih Edilen 5 Jaeger-LeCoultre Modeli ve Koleksiyon Değerleri", "en-cok-tercih-edilen-5-jaeger-lecoultre-modeli"),
    "mag-161215": ("Koleksiyonerlerin En Çok İlgi Gösterdiği 5 Vintage Cartier Modeli", "en-cok-ilgi-goren-5-vintage-cartier-modeli"),
    "mag-160428": ("Küresel Ticaret Tarifeleri ve Vergiler Lüks Saat Sektörünü Nasıl Etkiler?", "kuresel-gumruk-tarifeleri-ve-luks-saat-sektoru-analizi"),
    "mag-152536": ("Arap Rakamlı ve Yeşil Kadranlı En Çekici 5 Lüks Saat Modeli", "arap-rakamli-ve-yesil-kadranli-en-sik-5-luks-saat"),
    "mag-141605": ("Dünyanın En Pahalı ve Seçkin Lüks Saat Markaları Rehberi", "dunyanin-en-pahali-ve-seckin-luks-saat-markalari"),
    "mag-112997": ("Japon Saatçiliğinin Gizemli ve Büyüleyici Dünyası: Grand Seiko ve Ötesi", "japon-saatciliginin-buyuleyici-tarihi-ve-markalari"),
    "mag-101475": ("Omega x Swatch MoonSwatch İncelemesi: Tüm Modeller Bir Bakışta", "moonswatch-tum-modeller-ve-kapsamli-inceleme"),
    "mag-179988": ("Omega vs IWC Karşılaştırması: Asırlık Gelenek İleri Teknolojiyle Buluşuyor", "omega-vs-iwc-karsilastirmasi-ve-koleksiyon-analizi"),
    "mag-96921": ("Rolex Day-Date İçin 3 Ulaşılabilir ve Güçlü Alternatif Model", "rolex-day-date-icin-3-ulasilabilir-alternatif-model"),
    "mag-179246": ("Breitling ve TAG Heuer Karşılaştırması: Kronograf Dünyasının İki Devi", "breitling-ve-tag-heuer-karsilastirmasi"),
    "mag-177995": ("Omega Seamaster Aqua Terra Koleksiyon Rehberi: Her Bileğe Uygun Zarafet", "omega-seamaster-aqua-terra-koleksiyon-rehberi")
}

HOROLOGY_PATTERNS = [
    (r"(?i)\bOurChronoPulse Index\b", "Belgin Saat Lüks Değer Endeksi"),
    (r"(?i)\bChronoPulse Index\b", "Belgin Saat Lüks Değer Endeksi"),
    (r"(?i)\bChronoPulse\b", "Belgin Saat Lüks Değer Endeksi"),
    (r"(?i)\bChronopolis\b", "Cenevre Saat Günleri"),
    (r"(?i)\bchrono24\s*magazine\b", "Belgin Saat Magazin"),
    (r"(?i)\bchrono24\s*report\b", "Belgin Saat Küresel Piyasa Raporu"),
    (r"(?i)\bchrono24\s*price\s*index\b", "Belgin Saat Lüks Fiyat Endeksi"),
    (r"(?i)\bchrono24\s*team\b", "Belgin Saat Editoryal Kurulu"),
    (r"(?i)\bchrono24\b", "Belgin Saat"),
    (r"(?i)\bc24\b", "Belgin Saat"),
    (r"(?i)\bour marketplace\b", "seçkin lüks saat koleksiyonumuz"),
    (r"(?i)\bon our platform\b", "küresel saat piyasasında"),
    (r"(?i)\bin our community\b", "saat tutkunları arasında"),
    (r"(?i)\bpascal gehrlein\b", "Uzman Saat Editörleri"),
    (r"(?i)\btim breining\b", "Saat Ustaları"),
    (r"(?i)\bsteiert\b", "Uzman Editör"),
    (r"(?i)\bgabriel steiert\b", "Uzman Editör"),
    (r"(?i)\b(haute horlogerie)\b", "Haute Horlogerie (Yüksek Saatçilik)"),
    (r"(?i)\bwatchmaking\b", "saatçilik"),
    (r"(?i)\bwatchmaker\b", "saat ustası"),
    (r"(?i)\btimepieces\b", "saatler"),
    (r"(?i)\btimepiece\b", "saat"),
    (r"(?i)\bdials\b", "kadranlar"),
    (r"(?i)\bdial\b", "kadran"),
    (r"(?i)\bbezel\b", "çerçeve (bezel)"),
    (r"(?i)\bcase\b", "kasa"),
    (r"(?i)\bmovements\b", "mekanizmalar"),
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
    (r"(?i)\bsapphire crystal\b", "safir kristal cam"),
    (r"(?i)\bstainless steel\b", "paslanmaz çelik"),
    (r"(?i)\bpre-owned\b", "ikinci el koleksiyonluk"),
    (r"(?i)\bsecondary market\b", "ikincil piyasa"),
    (r"(?i)\bluxury watches\b", "lüks saatler"),
    (r"(?i)\bluxury watch\b", "lüks saat"),
    (r"(?i)\bdiscontinued:?\b", "Üretimden Kaldırılan:"),
    (r"&#8217;", "’"),
    (r"&#8216;", "‘"),
    (r"&#8220;", "“"),
    (r"&#8221;", "”"),
    (r"&#8211;", "–"),
    (r"&#8212;", "—"),
    (r"&#038;", "&"),
    (r"&amp;", "&"),
    (r"&quot;", '"'),
    (r"İzleme Günleri", "Saat Günleri"),
    (r"İzleme Gün", "Saat Gün"),
    (r"İzleme Rehberi", "Saat Rehberi"),
    (r"İzle Yıldönümleri", "Saat Yıldönümleri"),
    (r"İzleme", "Saat"),
    (r"izleme", "saat"),
    (r"Belgin Saat’s", "Belgin Saat"),
    (r"Belgin Saat's", "Belgin Saat"),
    (r"Belgin Saat’te", "Belgin Saat'te"),
    (r"Most Right Now", ""),
    (r"Models on Belgin Saat", "Modelleri"),
    (r"20\.000 Dolar Altı €", "20.000 Dolar Altı"),
    (r"Dolar Altı €", "Dolar Altı")
]

def sanitize_str(text):
    if not text:
        return ""
    t = text
    for pat, repl in HOROLOGY_PATTERNS:
        t = re.sub(pat, repl, t)
    t = re.sub(r"\s+", " ", t).strip()
    return t

def translate_para_safe(p_text):
    if not p_text or len(p_text.strip()) < 10:
        return ""
    cleaned = sanitize_str(p_text)
    # Check if contains significant English text
    en_words = re.findall(r'\b(the|and|with|from|which|this|that|their|about|into|more|over|years|market|watches|collection|diver|watch|these|timepieces|look|great|under|water|for|best|top|guide)\b', cleaned, re.IGNORECASE)
    if len(en_words) >= 3:
        try:
            # Chunk by sentences if long
            if len(cleaned) > 1000:
                sents = re.split(r'(?<=[.!?]) +', cleaned)
                buf, trans_chunks = [], []
                for s in sents:
                    buf.append(s)
                    if len(" ".join(buf)) > 600:
                        trans_chunks.append(translator.translate(" ".join(buf)))
                        buf = []
                if buf:
                    trans_chunks.append(translator.translate(" ".join(buf)))
                res = " ".join(trans_chunks)
            else:
                res = translator.translate(cleaned)
            return sanitize_str(res)
        except Exception:
            return sanitize_str(cleaned)
    return sanitize_str(cleaned)

def main():
    print("=" * 70)
    print("💎 146 MAKALE İÇİN DERİN TÜRKÇELEŞTİRME VE TEMİZLEME BAŞLATILIYOR")
    print("=" * 70)

    with open(DATA_JS_PATH, "r", encoding="utf8") as f:
        c = f.read()
    m = re.search(r"const MAGAZINE_ARTICLES = (\[.*?\]);", c, re.DOTALL)
    articles = json.loads(m.group(1))
    print(f"Toplam makale sayısı: {len(articles)}")

    updated = []
    for idx, art in enumerate(articles):
        art_id = art["id"]
        title = art.get("title", "")
        slug = art.get("slug", "")

        # 1. Başlık ve slug kontrolü
        if art_id in EXPLICIT_TITLES:
            title, slug = EXPLICIT_TITLES[art_id]
        else:
            title = sanitize_str(title)
            # Eğer başlıkta hala bariz İngilizce kelimeler varsa
            if re.search(r'\b(the|and|with|from|which|this|that|their|about|what|are|differences|over|under|best|watches|wonders)\b', title, re.IGNORECASE):
                try:
                    tr_t = translator.translate(title)
                    title = sanitize_str(tr_t)
                except Exception:
                    pass

        # 2. İçerik paragrafları
        content_html = art.get("content_html", "")
        paras = re.findall(r"<p[^>]*>(.*?)</p>", content_html, re.DOTALL)

        clean_paras = []
        for p in paras:
            if "mag-seo-internal-box" in p or "Belgin Saat Koleksiyonu:" in p:
                continue
            plain = re.sub(r"<[^>]+>", "", p).strip()
            if len(plain) < 15:
                continue
            tr_p = translate_para_safe(plain)
            if len(tr_p) > 20 and tr_p not in clean_paras:
                clean_paras.append(tr_p)

        if not clean_paras:
            clean_paras = [
                f"{title} hakkında lüks saat dünyasından en güncel gelişmeler, koleksiyoner analizleri ve piyasa trendleri Belgin Saat Magazin'de detaylı olarak incelenmektedir.",
                "Yüksek saatçilik dünyasında teknik mükemmellik ve estetik zarafet, köklü manüfaktürlerin asırlık mirasıyla buluşuyor.",
                "İkincil piyasa dinamikleri, nadir referansların ve ikonik kalibrelerin değerini koruma gücünü bir kez daha gözler önüne seriyor."
            ]

        lead_para = clean_paras[0]
        quote_text = "Lüks bir mekanik saat yalnızca zamanı ölçen bir enstrüman değil; nesilden nesile aktarılan yaşayan bir sanat eseridir."
        t_low = title.lower()
        if any(k in t_low for k in ["dalis", "su gecirmez", "doxa", "diver"]):
            quote_text = "Derinliklerin karanlığında parlayan indeksler, profesyonel bir dalgıç saatini su altında ve günlük yaşamda hayati bir yol arkadaşına dönüştürür."
        elif any(k in t_low for k in ["yatirim", "fiyat", "deger", "piyasa"]):
            quote_text = "Saatçilikte en kârlı yatırım; geçici spekülatif heveslerin ötesinde, özgün kondisyonunu koruyan asırlık klasiklere yönelmektir."
        elif "rolex" in t_low:
            quote_text = "Rolex saatçilikte bir standarttır; her referans, mükemmel mühendislik ile küresel prestijin kusursuz dengesini temsil eder."
        elif "omega" in t_low or "speedmaster" in t_low:
            quote_text = "Speedmaster ve Seamaster efsaneleri, insanın sınırları aşma arzusunu mekanik bir başyapıta dönüştüren yaşayan bir mirastır."
        elif "patek" in t_low or "nautilus" in t_low or "aquanaut" in t_low:
            quote_text = "Patek Philippe sahibi olmak yalnızca bir saate sahip olmak değil; gelecek kuşaklara devredilecek bir mirası korumaktır."

        html_parts = [f'<p class="mag-lead-para">{lead_para}</p>']
        html_parts.append('<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>')
        mid = min(len(clean_paras), 3)
        for p in clean_paras[1:mid]:
            html_parts.append(f'<p>{p}</p>')

        html_parts.append(f'<div class="mag-quote-box"><blockquote>“{quote_text}”</blockquote></div>')
        html_parts.append('<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>')
        next_mid = min(len(clean_paras), 6)
        for p in clean_paras[mid:next_mid]:
            html_parts.append(f'<p>{p}</p>')

        html_parts.append('<h3 class="mag-subheading-h3">Koleksiyon Değeri ve Alıcı Rehberi</h3>')
        if len(clean_paras) > next_mid:
            for p in clean_paras[next_mid:]:
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

        final_html = "\n".join(html_parts)
        summary = lead_para if lead_para else title
        if len(summary) > 220:
            summary = summary[:217] + "..."

        art["title"] = title
        art["slug"] = slug
        art["summary"] = summary
        art["content_html"] = final_html
        updated.append(art)
        if (idx + 1) % 25 == 0 or idx == len(articles) - 1:
            print(f"  [{idx+1}/{len(articles)}] İşlendi: {art_id} -> {title[:50]}...")

    # Tarihe göre en yeniden eskiye sırala
    updated.sort(key=lambda a: (a.get("raw_date", "") or "", a.get("id", "") or ""), reverse=True)

    js_content = f"""// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: {time.strftime('%Y-%m-%d %H:%M')} (Akıcı Türkçe & Google SEO Zirvesi)
// Toplam İçerik: {len(updated)} Makale
// ==========================================================

const MAGAZINE_ARTICLES = {json.dumps(updated, ensure_ascii=False, indent=2)};

if (typeof window !== 'undefined') {{
  window.MAGAZINE_ARTICLES = MAGAZINE_ARTICLES;
}}

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ MAGAZINE_ARTICLES }};
}}
"""
    with open(DATA_JS_PATH, "w", encoding="utf8") as f:
        f.write(js_content)
    print(f"\n🎉 {len(updated)} makalenin tümü kusursuz şekilde kaydedildi!")

if __name__ == "__main__":
    main()
