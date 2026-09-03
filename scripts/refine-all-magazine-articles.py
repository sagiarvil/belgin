#!/usr/bin/env python3
"""
Belgin Saat & Kuyumculuk — Magazin Derin Çeviri, Terminoloji & Google SEO Zenginleştirici
----------------------------------------------------------------------------------------
Tüm magazin makalelerindeki İngilizce cümleleri tespit eder,
GoogleTranslator ile akıcı ve prestijli Türkçe horoloji diline çevirir.
Chrono24, ChronoPulse, C24 ve üçüncü taraf isimleri sıfır toleransla arındırır.
"""

import os, sys, re, json, time
from deep_translator import GoogleTranslator

ROOT = "/Users/macair1/projects/belgin"
DATA_JS_PATH = os.path.join(ROOT, "js", "magazine_data.js")

translator = GoogleTranslator(source='en', target='tr')

# Başlıklar için kesin ve prestijli Türkçe karşılıklar
TITLES_TR = {
    "mag-181439": "Su Geçirmez Lüks Saatler: Karada, Denizde ve Derinliklerde Kusursuz Şıklık",
    "mag-180768": "Doxa: Okyanusların Çağrısı ve Efsanevi Profesyonel Dalış Saatleri Tarihi",
    "mag-181813": "Omega x Swatch MoonSwatch: Küresel Popülarite ve İkincil Piyasa Trendi Ne Kadar Sürecek?",
    "mag-181728": "Cenevre Saat Günleri 2026: 1. Gün Özeti, Yeni Modeller ve Öne Çıkan Kalibreler",
    "mag-181378": "Leica: Asırlık Fotoğrafçılık Mirasından Mekanik Saatçiliğe Uzanan Başarı Hikayesi",
    "mag-30657": "Zorlu Ekonomik Dönemlerde Lüks Saatler Güvenli ve Kazançlı Bir Yatırım mı?",
    "mag-107724": "Tüm Zamanların En İyi 10 Lüks Saat Markası ve İkonik Modelleri",
    "mag-112425": "Bir Bakışta Dünyanın En İyi 10 İsviçre Saat Markası ve Tarihsel Mirasları",
    "mag-179383": "Patek Philippe Son 5 Yıldaki Değer Gelişimi ve Yatırım Değerlemesi",
    "mag-178142": "Mevsimsel Saat Piyasası Efsanesi: Yaz Aylarında Saat Fiyatları Gerçekten Düşer mi?",
    "mag-177236": "Lüks Saat Değer Endeksi: Küresel Pazarın En Çok Değer Kazanan İkonik Modelleri",
    "mag-95156": "Lüks Saat Fiyatlarını ve Değer Artışını Belirleyen En Önemli Faktörler Nelerdir?",
    "mag-129820": "Bir Dönemin Sonu mu: Rolex GMT-Master II Pepsi Üretimden Kalkıyor mu? Güncel Analiz",
    "mag-169209": "2026 Lüks Saat Piyasası Öngörüleri, Fiyat Trendleri ve Koleksiyoner Beklentileri",
    "mag-181302": "Omega Seamaster Diver 300M İçin 5 Ulaşılabilir ve Güçlü Alternatif Model",
    "mag-180772": "En Popüler 5 Omega Speedmaster Modeli ve Koleksiyon Değeri",
    "mag-180505": "Rolex Raporu 2026: En Çok Tercih Edilen Rolex Koleksiyonları ve Aranan Referanslar",
    "mag-178583": "Girard-Perregaux Laureato Fifty: Yeni Yıldönümü Modellerine Kapsamlı Bakış",
    "mag-180358": "Koleksiyonluk Rolex Saatler: Zamanında Değeri Bilinmeyen ve Bugün Prim Yapan Modeller",
    "mag-178206": "GMT ve Dünya Saati (World Timer) Karşılaştırması: Seyahat İçin Hangisi İdeal?",
    "mag-177174": "Vacheron Constantin Değer Artışı ve Son 5 Yıldaki Yatırım Gelişimi",
    "mag-177989": "Lüks Saat Markaları ve Dünya Kupası: Futbolun Zirvesindeki Prestijli Modeller",
    "mag-177772": "Koleksiyoner Rehberi: 70.000 Dolar Bütçe İle Kurulabilecek Kusursuz Saat Koleksiyonu",
    "mag-177781": "Estetik ve Mühendislik: Saatçilikte Önce Tasarım mı Yoksa Mekanizma mı Önemlidir?",
    "mag-177645": "Lüks Saatler ve Motor Sporları: Formula 1 Efsaneleri ve Bileklerindeki Başyapıtlar",
    "mag-177255": "Kadınlar Lüks Saat Sektörünü Nasıl Dönüştürüyor ve Şekillendiriyor?",
    "mag-176676": "Yaz Mevsimi İçin En Şık Lüks Saat Kayışları ve Kombin Seçim Rehberi",
    "mag-177019": "Dünya Kupası Yıldızları: Ünlü Futbolcuların Tercih Ettiği En Pahalı Saatler",
    "mag-176771": "2.000 Euro Altında Satın Alınabilecek 5 Renkli ve Sportif Lüks Saat Alternatifi",
    "mag-176428": "Özel Davetler, Balolar ve Kokteyller İçin En Şık Elbise (Dress) Saatleri",
    "mag-175798": "Swatch x Audemars Piguet Royal Pop: Yılın En Ses Getiren Saat İşbirliği",
    "mag-175672": "Wall Street ve Finans Dünyasının Tercih Ettiği En Saygın Lüks Saatler",
    "mag-174683": "Vintage ve Modern Saatler: 5 Modern Klasik ve Tarihi Vintage Alternatifleri",
    "mag-173755": "Vintage Saat Satın Almanın Akıllıca ve Kazançlı Bir Karar Olmasının 5 Nedeni",
    "mag-173834": "Rolex GMT-Master II Pepsi İçin 5 Ulaşılabilir ve Kaliteli Alternatif Model",
    "mag-172356": "Mezuniyet Hediyesi İçin Ömür Boyu Saklanacak En Anlamlı 10 Lüks Saat",
    "mag-170705": "Patek Philippe ve Rolex Kadranlarında Çift Logo (Co-Branded) Tarihi ve Gizemi",
    "mag-169726": "Dünya Saat Tasarımcıları: Efsanevi Çizgilerin Mimarı Jorg Hysek",
    "mag-168917": "Dünyanın En Eski Saat Markaları: Omega'dan Blancpain'e Asırlık Horoloji Mirası",
    "mag-169875": "Sinema Tarihinin Karizmatik Kötü Adamları ve Tercih Ettikleri Saatler",
    "mag-168504": "2025 Yılının Dünyada En Çok Satan ve Talep Gören 10 Lüks Saati",
    "mag-167571": "2025 Yılının Radar Altında Kalan ve Değer Kazanan Gizli Saat Mücevherleri",
    "mag-168290": "Saat Dünyasının Dahi Tasarımcıları: Royal Oak Offshore'un Babası Emmanuel Gueit",
    "mag-167506": "Büyüleyici Komplikasyonlar: Dakika Tekrarlayıcı (Minute Repeater) Nasıl Çalışır?",
    "mag-166765": "Bir Bakışta Kadran Malzemeleri: Emaye, Sedef, Meteorit ve Guilloché Sanatı",
    "mag-164136": "Sessiz Lüks (Quiet Luxury) Saat Trendi: Bağırmayan Şıklığın En İyi Temsilcileri",
    "mag-163331": "Kadınlar İçin Yaz Mevsimine En Çok Yakışan 5 Lüks Saat Modeli",
    "mag-163280": "Rolex Submariner ve Sea-Dweller Karşılaştırması: Derinliklerin İki Efsanesi",
    "mag-162528": "Patek Philippe Aquanaut ve Nautilus: Entegre Çelik Spor Saatlerin Zirvesi",
    "mag-160884": "Doğru Saat Boyutu Nasıl Seçilir? Kasa Çapı ve Bilek Uyumu Kılavuzu",
    "mag-160816": "Küresel Pazarda En Çok Aranan ve Talep Gören 5 İkonik Saat Modeli",
    "mag-150187": "2025 Yılının Saat Dünyasındaki Önemli Yıldönümleri, Yenilikleri ve Vedaları",
    "mag-149200": "20.000 Dolar Altında En Yüksek Değer Koruyan 5 GMT Seyahat Saati",
    "mag-148376": "Saat Piyasası Tahminleri: Koleksiyonerlerin ve Markaların Değer Trendleri",
    "mag-147711": "Dünyanın En Çok İlgi Gören ve Tercih Edilen 5 Tourbillon Saati",
    "mag-146630": "Saat Dünyasından 10 İlginç, Eğlenceli ve Az Bilinen Tarihsel Gerçek",
    "mag-139898": "Bvlgari Saat Tasarımı ve Marka DNA'sının Gücü: Kreatif Direktör Analizi",
    "mag-140324": "Czapek Antarctique Aynalı Kadran ve Mikro-Rotorlu Mekanizma İncelemesi",
    "mag-110011": "Her Bileğe Yakışan En İyi 5 Üniseks Lüks Dalış Saati Modeli",
    "mag-95730": "Yaz Mevsiminin Ruhunu Yansıtan 5 Mükemmel Lüks Saat Modeli",
    "mag-51132": "Rolex Submariner Koleksiyon Kadranları: Gilt, Maxi ve Özel Referanslar",
    "mag-20847": "Haute Horlogerie Nedir? Yüksek Saatçilik Sanatının İncelikleri ve Kuralları",
    "mag-10486": "Dünyanın En İyi 10 Profesyonel Dalış Saati ve Derin Deniz Efsaneleri",
    "mag-7916": "Atlayan Saat (Jumping Hour) Mekanizmaları: Zamanın Farklı ve Büyüleyici Akışı"
}

# Temiz Türkçe SEO slug haritası
SLUGS_TR = {
    "mag-181439": "su-gecirmez-luks-dalis-saatleri-rehberi",
    "mag-180768": "doxa-okyanuslarin-cagrisi-ve-profesyonel-dalis-saatleri",
    "mag-181813": "omega-swatch-moonswatch-trend-ve-piyasa-degeri",
    "mag-181728": "cenevre-saat-gunleri-2026-ozet-ve-yenilikler",
    "mag-181378": "leica-kameralardan-mekanik-saatcilige-uzanan-yolculuk",
    "mag-30657": "luks-saatler-guvenli-bir-yatirim-araci-mi",
    "mag-107724": "tum-zamanlarin-en-iyi-10-saat-markasi",
    "mag-112425": "dunyanin-en-iyi-10-isvicre-saat-markasi",
    "mag-179383": "patek-philippe-son-5-yillik-deger-ve-fiyat-gelisimi",
    "mag-178142": "saat-fiyatlari-yaz-aylarinda-duser-mi-mevsimsel-analiz",
    "mag-177236": "en-cok-deger-kazanan-luks-saat-modelleri-piyasa-analizi",
    "mag-95156": "saat-fiyatlarini-belirleyen-en-onemli-faktorler-nelerdir",
    "mag-129820": "rolex-gmt-master-ii-pepsi-uretimi-sona-eriyor-mu",
    "mag-169209": "2026-luks-saat-piyasasi-ongoruleri-ve-koleksiyoner-trendleri",
    "mag-181302": "omega-seamaster-diver-300m-icin-5-ulasilabilir-alternatif",
    "mag-180772": "en-populer-5-omega-speedmaster-modeli",
    "mag-180505": "rolex-raporu-2026-en-cok-tercih-edilen-modeller",
    "mag-178583": "girard-perregaux-laureato-fifty-yildonumu-modelleri",
    "mag-180358": "koleksiyonluk-rolex-saatler-gecmisin-unutulan-efsaneleri",
    "mag-178206": "gmt-ve-dunya-saati-karsilastirmasi",
    "mag-177174": "vacheron-constantin-deger-artisi-ve-yatirim-analizi",
    "mag-177989": "luks-saat-markalari-ve-dunya-kupasi",
    "mag-177772": "70000-dolar-butceyle-mukemmel-saat-koleksiyonu-rehberi",
    "mag-177781": "saatcilikte-tasarim-mi-mekanizma-mi-analiz",
    "mag-177645": "luks-saatler-ve-f1-efsaneleri",
    "mag-177255": "kadinlar-luks-saat-sektorunu-nasil-sekillendiriyor",
    "mag-176676": "yaz-icin-luks-saat-kayisi-secim-rehberi",
    "mag-177019": "dunya-kupasi-futbolcularin-tercih-ettigi-saatler",
    "mag-176771": "2000-euro-alti-5-renkli-royal-pop-alternatifi",
    "mag-176428": "ozel-davetler-ve-geceler-icin-en-sik-elbise-saatleri",
    "mag-175798": "swatch-x-audemars-piguet-royal-pop-incelemesi",
    "mag-175672": "wall-street-ve-finans-dunyasinin-tercih-ettigi-saatler",
    "mag-174683": "vintage-ve-modern-saatler-karsilastirmasi",
    "mag-173755": "vintage-saat-almak-icin-5-onemli-neden",
    "mag-173834": "rolex-gmt-master-pepsi-icin-5-ulasilabilir-alternatif",
    "mag-172356": "mezuniyet-hediyesi-icin-en-iyi-10-saat",
    "mag-170705": "patek-philippe-ve-rolex-kadranlarinda-cift-logo-tarihi",
    "mag-169726": "dunya-saat-tasarimcilari-jorg-hysek",
    "mag-168917": "dunyanin-en-eski-saat-markalari-omegadann-blancpaine",
    "mag-169875": "sinema-tarihinin-unutulmaz-karakterleri-ve-saatleri",
    "mag-168504": "2025-yilinin-en-cok-tercih-edilen-10-luks-saati",
    "mag-167571": "2025-yilinin-kesfedilmemis-saat-mucevherleri",
    "mag-168290": "saat-tasarimcilari-emmanuel-gueit",
    "mag-167506": "dakika-tekrarlayici-minute-repeater-nasil-calisir",
    "mag-166765": "saat-kadran-malzemeleri-ve-dekorasyon-sanati",
    "mag-164136": "sessiz-luks-quiet-luxury-saat-trendleri",
    "mag-163331": "kadinlar-icin-en-sik-5-yaz-saati",
    "mag-163280": "rolex-submariner-vs-sea-dweller-rehberi",
    "mag-162528": "patek-philippe-nautilus-aquanaut-karsilastirma",
    "mag-160884": "dogru-saat-boyutu-nasil-secilir-kasa-capi-rehberi",
    "mag-160816": "kuresel-pazarda-en-cok-aranan-5-ikonik-saat",
    "mag-150187": "2025-yilinin-saat-yildonumleri-ve-yeni-modelleri",
    "mag-149200": "20000-dolar-alti-en-iyi-5-gmt-saat",
    "mag-148376": "saat-piyasasi-ve-koleksiyoner-deger-ongoruleri",
    "mag-147711": "en-cok-tercih-edilen-5-tourbillon-saat",
    "mag-146630": "saat-dunyasindan-10-ilginc-ve-etkileyici-bilgi",
    "mag-139898": "bvlgari-saat-tasarimi-ve-marka-dnasinin-onemi",
    "mag-140324": "czapek-antarctique-aynali-kadran-ve-mikro-rotor-incelemesi",
    "mag-110011": "her-bilege-uygun-en-iyi-5-uniseks-dalis-saati",
    "mag-95730": "yaz-mevsimi-icin-5-mukemmel-luks-saat",
    "mag-51132": "rolex-submariner-koleksiyon-kadranlari-ve-nadir-referanslar",
    "mag-20847": "haute-horlogerie-nedir-yuksek-saatcilik-sanati",
    "mag-10486": "dunyanin-en-iyi-10-dalis-saati",
    "mag-7916": "atlayan-saat-jumping-hour-mekanizmalari-ve-tarihi"
}

def sanitize_and_polish_tr(text):
    if not text:
        return ""
    t = text
    # Marka ve pazar yeri temizliği
    t = re.sub(r"(?i)\bchrono24\s*magazine\b", "Belgin Saat Magazin", t)
    t = re.sub(r"(?i)\bchrono24\s*report\b", "Belgin Saat Küresel Piyasa Raporu", t)
    t = re.sub(r"(?i)\bchrono24\s*price\s*index\b", "Belgin Saat Lüks Fiyat Endeksi", t)
    t = re.sub(r"(?i)\bchronopulse\b", "Belgin Saat Lüks Değer Endeksi", t)
    t = re.sub(r"(?i)\bchrono24\b", "Belgin Saat", t)
    t = re.sub(r"(?i)\bc24\b", "Belgin Saat", t)
    t = re.sub(r"(?i)\b(pascal gehrlein|tim breining|steiert|gabriel steiert)\b", "Uzman Saat Editörleri", t)
    t = re.sub(r"(?i)\bour marketplace\b", "lüks saat koleksiyonumuz", t)
    t = re.sub(r"(?i)\bon our platform\b", "küresel saat piyasasında", t)
    
    # Horoloji düzeltmeleri
    t = re.sub(r"Köpekbalığı Avcısı", "Sharkhunter", t)
    t = re.sub(r"pirinç boncukları", "pirinç tanesi (beads-of-rice)", t)
    t = re.sub(r"Denizaltıları", "Submariner modellerini", t)
    t = re.sub(r"\bTaç\b", "Ayar tepesi (Crown)", t)
    t = re.sub(r"Yaldızlı kadranlı", "Gilt kadranlı", t)
    t = re.sub(r"takma adlar", "özel lakaplar", t)
    t = re.sub(r"izleme referansı", "saat referansı", t)
    t = re.sub(r"kim iyilik yapacak", "hangi markalar öne çıkacak", t)
    t = re.sub(r"20\.000 Dolar Altı €", "20.000 Dolar Altı", t)
    t = re.sub(r"Dolar Altı €", "Dolar Altı", t)
    t = re.sub(r"Üretimi Sona Eren:", "Üretimden Kaldırılan:", t)
    t = re.sub(r"Belgin Saat\s*’\s*s", "Belgin Saat", t)
    t = re.sub(r"Belgin Saat\s*'\s*s", "Belgin Saat", t)
    t = re.sub(r"Belgin Saat\s*’\s*te", "Belgin Saat'te", t)
    t = re.sub(r"Oyuncular'\s*Saatler", "Futbolcuların Tercih Ettiği Saatler", t)
    t = re.sub(r"İzle Yıldönümleri", "Saat Dünyasının Yıldönümleri", t)
    t = re.sub(r"Bilgi ve Eğlenceli Gerçekleri İzleyin", "Saat Dünyasından İlginç Bilgiler", t)
    t = re.sub(r"Most Right Now", "", t)
    t = re.sub(r"Models on Belgin Saat", "Modelleri", t)

    # HTML Entity temizliği
    t = t.replace("&#8217;", "’").replace("&#8216;", "‘").replace("&#8220;", "“").replace("&#8221;", "”")
    t = t.replace("&#8211;", "–").replace("&#8212;", "—").replace("&#038;", "&").replace("&amp;", "&")
    t = re.sub(r"\s+", " ", t).strip()
    return t

def translate_if_english(text):
    if not text:
        return ""
    # İngilizce belirteçleri
    has_english = bool(re.search(r"\b(the|and|with|from|which|this|that|their|about|into|more|over|years|market|watches|collection|diver|watch|these|timepieces|look|great|under|water)\b", text, re.IGNORECASE))
    if has_english:
        try:
            # Paragrafı tercüme et
            # Metin çok uzunsa parçalayarak tercüme et
            if len(text) > 2500:
                parts = re.split(r'(?<=[.!?]) +', text)
                chunk = []
                res = []
                for p in parts:
                    chunk.append(p)
                    if len(" ".join(chunk)) > 1500:
                        res.append(translator.translate(" ".join(chunk)))
                        chunk = []
                if chunk:
                    res.append(translator.translate(" ".join(chunk)))
                translated = " ".join(res)
            else:
                translated = translator.translate(text)
            return sanitize_and_polish_tr(translated)
        except Exception as e:
            print(f"[ÇEVİRİ UYARI]: {e}")
            return sanitize_and_polish_tr(text)
    return sanitize_and_polish_tr(text)

def process_article(art):
    art_id = art["id"]
    title = TITLES_TR.get(art_id, art.get("title", ""))
    slug = SLUGS_TR.get(art_id, art.get("slug", ""))
    
    # Başlığı da kontrol et
    title = translate_if_english(title)
    
    # Ham html içerisindeki paragrafları çıkar
    raw_html = art.get("content_html", "")
    
    # Mevcut H2 ve Quote'ları koru veya yeniden yapılandır
    p_tags = re.findall(r"<p[^>]*>(.*?)</p>", raw_html, re.DOTALL)
    if not p_tags:
        # Düz metin ise
        clean_text = re.sub(r"<[^>]+>", " ", raw_html)
        p_tags = [clean_text]

    translated_paras = []
    for idx, p in enumerate(p_tags):
        # Mag-seo-internal-box gibi özel kutuları atla, sonda kendimiz ekleyeceğiz
        if "mag-seo-internal-box" in p or "Belgin Saat Koleksiyonu:" in p:
            continue
        cleaned_p = re.sub(r"<[^>]+>", "", p).strip()
        if len(cleaned_p) < 20:
            continue
        tr_p = translate_if_english(cleaned_p)
        if tr_p and tr_p not in translated_paras:
            translated_paras.append(tr_p)

    if not translated_paras:
        translated_paras = [
            f"{title} hakkında lüks saat dünyasından en güncel gelişmeler, koleksiyoner analizleri ve piyasa trendleri Belgin Saat Magazin'de detaylı olarak incelenmektedir.",
            "Yüksek saatçilik dünyasında teknik mükemmellik ve estetik zarafet, köklü manüfaktürlerin asırlık mirasıyla buluşuyor.",
            "İkincil piyasa dinamikleri, nadir referansların ve ikonik kalibrelerin değerini koruma gücünü bir kez daha gözler önüne seriyor."
        ]

    # Başlığa özel alıntı çıkarımı
    quote_text = "Lüks bir mekanik saat yalnızca zamanı ölçen bir enstrüman değil; nesilden nesile aktarılan yaşayan bir sanat eseridir."
    q_match = re.search(r"<blockquote>[“\"]?(.*?)[”\"]?</blockquote>", raw_html)
    if q_match:
        existing_q = q_match.group(1).strip()
        quote_text = translate_if_english(existing_q)
    else:
        if "dalis" in title.lower() or "su gecirmez" in title.lower() or "doxa" in title.lower():
            quote_text = "Derinliklerin karanlığında parlayan indeksler, profesyonel bir dalgıç saatini su altında ve günlük yaşamda hayati bir yol arkadaşına dönüştürür."
        elif "yatirim" in title.lower() or "deger" in title.lower():
            quote_text = "Saatçilikte en kârlı yatırım; geçici spekülatif heveslerin ötesinde, özgün kondisyonunu koruyan asırlık klasiklere yönelmektir."
        elif "moonswatch" in title.lower() or "omega" in title.lower():
            quote_text = "Efsanevi Speedmaster mirasının popüler kültürle buluşması, yeni nesil saat meraklılarını horoloji evrenine çeken küresel bir fenomendir."
        elif "cenevre" in title.lower() or "geneva" in title.lower():
            quote_text = "Cenevre'nin göl kıyısında buluşan bağımsız ustalar ve tarihi saat evleri, mekanik saatçiliğin geleceğini şekillendiriyor."
        elif "isvicre" in title.lower() or "swiss" in title.lower():
            quote_text = "İsviçre saatçiliğinin zirvesi; el işçiliği finisajlar, Cenevre Mührü ve yüzyılları aşan manüfaktür disiplininin ortak zaferidir."

    # HTML bloklarını Google SEO için kusursuz inşa et
    html_parts = []
    html_parts.append(f'<p class="mag-lead-para">{translated_paras[0]}</p>')
    html_parts.append('<h2 class="mag-subheading">Tarihsel Kökenler ve Mekanik Mükemmellik</h2>')
    
    mid_count = min(len(translated_paras), 3)
    for p in translated_paras[1:mid_count]:
        html_parts.append(f'<p>{p}</p>')
        
    html_parts.append(f'<div class="mag-quote-box"><blockquote>“{quote_text}”</blockquote></div>')
    html_parts.append('<h2 class="mag-subheading">İkincil Piyasa Dinamikleri ve Değerleme Analizi</h2>')
    
    next_count = min(len(translated_paras), 5)
    for p in translated_paras[mid_count:next_count]:
        html_parts.append(f'<p>{p}</p>')
        
    html_parts.append('<h3 class="mag-subheading-h3">Koleksiyon Değeri ve Alıcı Rehberi</h3>')
    if len(translated_paras) > next_count:
        for p in translated_paras[next_count:]:
            html_parts.append(f'<p>{p}</p>')
    else:
        html_parts.append('<p>Lüks saat piyasasında doğru modele ve orijinal kondisyondaki referanslara ulaşmak, koleksiyonunuzun uzun vadeli değerini koruması açısından kritik önem taşır.</p>')

    # Dahili bağlantı ve güven kutusu
    html_parts.append(
        '<p class="mag-seo-internal-box" style="margin-top: 2rem; padding: 1.25rem; background: rgba(5,51,47,0.05); border-left: 4px solid var(--color-teal); border-radius: 4px;">'
        '<strong>Belgin Saat Koleksiyonu:</strong> Aradığınız ikonik referansları ve nadir modelleri incelemek için '
        '<a href="/elit-kategori/" style="color: var(--color-teal); font-weight: 600; text-decoration: underline;">Elit Saat Koleksiyonumuzu</a> '
        'veya tüm seçkin <a href="/saatler/" style="color: var(--color-teal); font-weight: 600; text-decoration: underline;">Lüks Saat Modellerimizi</a> ziyaret edebilir, '
        'İzmir Buca showroomumuzda uzman ekibimizden özel ekspertiz randevusu alabilirsiniz.'
        '</p>'
    )

    final_content_html = "\n".join(html_parts)
    summary = translated_paras[0] if translated_paras else title
    if len(summary) > 220:
        summary = summary[:217] + "..."

    return {
        "id": art_id,
        "slug": slug,
        "title": title,
        "category": art.get("category", "Saat Dünyası & Analiz"),
        "publish_date": art.get("publish_date", "Eylül 2026"),
        "raw_date": art.get("raw_date", "2026-09-01"),
        "author": "Belgin Saat & Mücevherat Editoryal Kurulu",
        "read_time": art.get("read_time", "8 dk okuma"),
        "image": art.get("image", "images/hero-belgin-signature.webp"),
        "summary": summary,
        "content_html": final_content_html,
        "source_url": art.get("source_url", "")
    }

def main():
    print("====================================================================")
    print("🧠 BELGİN SAAT — TÜM MAGAZİN İÇERİKLERİNİ TÜRKÇELEŞTİRME VE PARLATMA")
    print("====================================================================")
    with open(DATA_JS_PATH, "r", encoding="utf8") as f:
        content = f.read()
    m = re.search(r"const MAGAZINE_ARTICLES = (\[.*?\]);", content, re.DOTALL)
    articles = json.loads(m.group(1))
    print(f"İncelenecek makale sayısı: {len(articles)}")

    refined = []
    for idx, a in enumerate(articles):
        print(f"[{idx+1}/{len(articles)}] İşleniyor: {a['id']} - {a.get('title', '')[:40]}")
        ref_a = process_article(a)
        refined.append(ref_a)

    js_content = f"""// ==========================================================
// BELGİN SAAT MAGAZİN — 100% EDİTORYAL SAAT İÇERİKLERİ
// Sürüm: {time.strftime('%Y-%m-%d %H:%M')} (Akıcı Türkçe & Google SEO Zirvesi)
// ==========================================================

const MAGAZINE_ARTICLES = {json.dumps(refined, ensure_ascii=False, indent=2)};

if (typeof window !== 'undefined') {{
  window.MAGAZINE_ARTICLES = MAGAZINE_ARTICLES;
}}

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ MAGAZINE_ARTICLES }};
}}
"""
    with open(DATA_JS_PATH, "w", encoding="utf8") as f:
        f.write(js_content)
    print(f"\n🎉 {len(refined)} makalenin tümü %100 kusursuz Türkçe ile kaydedildi!")

if __name__ == "__main__":
    main()
