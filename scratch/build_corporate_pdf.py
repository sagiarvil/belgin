import fitz # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
import os

print("🚀 Belgin Saat & Kuyumculuk Kurumsal PDF Geliştirme Motoru Başlatıldı...")

ORIGINAL_PDF = '/Users/macair1/.gemini/antigravity/brain/72a0b208-dccf-42b3-9290-227892c2d39e/.user_uploaded/media_1789215119007.pdf'
OUTPUT_PDF = '/Users/macair1/projects/belgin/docs/belgin-kurumsal-profil-2026.pdf'
PUBLIC_PDF = '/Users/macair1/projects/belgin/belgin-kurumsal-profil-2026.pdf'
os.makedirs('/Users/macair1/projects/belgin/docs', exist_ok=True)

doc = fitz.open(ORIGINAL_PDF)

# =========================================================================
# 1. GÖRSELLERİN GELİŞTİRİLMESİ (PAGES 1, 2, 4, 9, 8)
# =========================================================================

font_serif_path = "/System/Library/Fonts/Supplemental/Georgia.ttf"
font_sans_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
font_sans_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

f_serif_40 = ImageFont.truetype(font_serif_path, 40)
f_gold_num = ImageFont.truetype(font_sans_bold_path, 34)

GOLD_COLOR = (224, 194, 126) # #E0C27E
CREAM_WHITE = (244, 239, 229) # #F4EFE5

def patch_page_image_domain(img_path, domain_x, domain_y, clean_w, clean_h, page_num_str=None):
    im = Image.open(img_path)
    draw = ImageDraw.Draw(im)
    
    # Clean domain region by sampling background around it
    bg_sample = im.getpixel((domain_x - 30, domain_y + 15))
    draw.rectangle([domain_x - 10, domain_y - 8, domain_x + clean_w, domain_y + clean_h], fill=bg_sample)
    
    # Draw new domain: www.belginkuyumculuk.co
    draw.text((domain_x, domain_y - 4), "www.belginkuyumculuk.co", font=f_serif_40, fill=CREAM_WHITE)
    
    if page_num_str:
        num_x = im.width - 270
        num_y = domain_y
        draw.text((num_x, num_y), page_num_str, font=f_gold_num, fill=GOLD_COLOR)
        
    return im

print("1. Tam sayfa görsellerdeki domain ve sayfa numaraları güncelleniyor...")

# Sayfa 1: Kapak (Domain: www.belginkuyumculuk.co)
im1 = patch_page_image_domain('scratch/extracted_images/page_1_img_1_3.jpeg', 635, 2815, 620, 55, None)
im1_dest = 'scratch/cleaned_pages/page_1_cleaned.jpeg'
im1.save(im1_dest, quality=95)

# Sayfa 2: (Domain: www.belginkuyumculuk.co, Num: 02 / 09)
im2 = patch_page_image_domain('scratch/extracted_images/page_2_img_1_5.jpeg', 635, 2815, 620, 55, '02 / 09')
im2_dest = 'scratch/cleaned_pages/page_2_cleaned.jpeg'
im2.save(im2_dest, quality=95)

# Sayfa 4: (Domain: www.belginkuyumculuk.co, Num: 04 / 09)
im4 = patch_page_image_domain('scratch/extracted_images/page_4_img_1_13.jpeg', 635, 2815, 620, 55, '04 / 09')
im4_dest = 'scratch/cleaned_pages/page_4_cleaned.jpeg'
im4.save(im4_dest, quality=95)

# Sayfa 9: Showroom Kapanış (Domain: www.belginkuyumculuk.co, Num: 09 / 09)
im9 = Image.open('scratch/extracted_images/page_9_img_1_23.jpeg')
draw9 = ImageDraw.Draw(im9)
bg9 = im9.getpixel((750, 2695))
draw9.rectangle([780, 2670, 1370, 2735], fill=bg9)
draw9.text((790, 2672), "www.belginkuyumculuk.co", font=f_serif_40, fill=CREAM_WHITE)
draw9.text((im9.width - 270, 2675), "09 / 09", font=f_gold_num, fill=GOLD_COLOR)
im9_dest = 'scratch/cleaned_pages/page_9_cleaned.jpeg'
im9.save(im9_dest, quality=95)

print("✅ Sayfa 1, 2, 4 ve 9 görselleri www.belginkuyumculuk.co ve kurumsal sayfa numaralarıyla güncellendi.")

# =========================================================================
# 2. PDF İÇERİK KATMANLARININ ONARILMASI
# =========================================================================

def replace_full_page_image(page, new_img_path):
    img_list = page.get_images()
    if img_list:
        xref = img_list[0][0]
        with open(new_img_path, 'rb') as f:
            new_img_bytes = f.read()
        doc.update_stream(xref, new_img_bytes)

replace_full_page_image(doc[0], im1_dest)
replace_full_page_image(doc[1], im2_dest)
replace_full_page_image(doc[3], im4_dest)
replace_full_page_image(doc[8], im9_dest)
print("✅ PDF Sayfa 1, 2, 4, 9 görsel akışları güncellendi.")

# Sayfa 8: Miss Tourism Eurasia görselindeki parazit çöp yazının temizlenmiş haliyle değiştirilmesi
clean_p8_img = 'scratch/cleaned_pages/page_8_img_clean.jpeg'
with open(clean_p8_img, 'rb') as f:
    clean_p8_bytes = f.read()

p8 = doc[7]
for img_info in p8.get_images():
    xref = img_info[0]
    base = doc.extract_image(xref)
    # Target image 11 (the model with crown)
    if xref == 11 or (base.get('width') == 980 and base.get('height') == 1240 and xref != 10):
        doc.update_stream(xref, clean_p8_bytes)
        print(f"✅ Sayfa 8 görsel xref {xref} temizlenmiş görsel ile değiştirildi.")

# =========================================================================
# 3. SAYFA 6'DAKİ METİN ÇAKIŞMASI HATASININ GİDERİLMESİ
# =========================================================================
print("2. Sayfa 6'daki metin çakışması (overlap bug) düzeltiliyor...")
p6 = doc[5]

bg_emerald = (0.02745, 0.12157, 0.09412) # #071F18

# Çakışan metin alanını ört
clean_rect = fitz.Rect(40, 153, 560, 218)
p6.draw_rect(clean_rect, color=bg_emerald, fill=bg_emerald)

# 1. Spot metin (y: 154 - 173)
spot_text = "İkinci elde değer gören saatlerde ilişki tek satışla bitmez; müşteri zaman içinde yeni bir modele geçebilir, mevcut saatini değerlendirebilir ve portföyünü güncelleyebilir."
p6.insert_textbox(
    fitz.Rect(42, 154, 550, 175),
    spot_text,
    fontfile=font_sans_path,
    fontsize=8.5,
    color=(0.78, 0.75, 0.69)
)

# 2. Ana paragraf (y: 180 - 215)
body_text = "Takas ve geri alım yaklaşımı, müşterinin mevcut saatini portföyün dışında bırakmak yerine yeni tercihin bir parçası olarak değerlendirmesine imkân tanır. Değerlendirmede ürünün markası, referansı, kondisyonu, mevcut kutu/evrakları ve anlık piyasa karşılığı birlikte ele alınır."
p6.insert_textbox(
    fitz.Rect(42, 180, 550, 216),
    body_text,
    fontfile=font_sans_path,
    fontsize=9.2,
    color=(0.96, 0.94, 0.90)
)

print("✅ Sayfa 6 tipografik çakışması pürüzsüz iki katmanlı editoryal mizanpaja dönüştürüldü.")

# =========================================================================
# 4. TÜM SAYFALARDA DOMAIN GÜNCELLEMESİ (www.belginkuyumculuk.co)
# =========================================================================
print("3. Tüm sayfalarda kurumsal domain www.belginkuyumculuk.co olarak güncelleniyor...")

for pno in [2, 4, 5, 6, 7]: # Sayfa 3, 5, 6, 7, 8
    p = doc[pno]
    footer_rect = fitz.Rect(40, 820, 500, 836)
    p.draw_rect(footer_rect, color=bg_emerald, fill=bg_emerald)
    
    footer_str = "Belgin Kuyumculuk & Saat  •  Buca / İzmir  •  www.belginkuyumculuk.co"
    p.insert_text(
        fitz.Point(42, 830),
        footer_str,
        fontfile=font_sans_path,
        fontsize=6.8,
        color=(0.78, 0.75, 0.69)
    )

# Sayfa 7 randevu çubuğu
p7 = doc[6]
p7_box_rect = fitz.Rect(50, 755, 520, 775)
p7.draw_rect(p7_box_rect, color=bg_emerald, fill=bg_emerald)
randevu_str = "Randevu ve özel talepler: www.belginkuyumculuk.co  •  VIP Danışma: +90 541 930 53 72"
p7.insert_text(
    fitz.Point(56, 768),
    randevu_str,
    fontfile=font_sans_bold_path,
    fontsize=8.2,
    color=(0.88, 0.76, 0.49)
)

print("✅ Sayfa 3, 5, 6, 7, 8 kurumsal footer ve randevu linkleri www.belginkuyumculuk.co yapıldı.")

# =========================================================================
# 5. METADATA & PDF KAYDI
# =========================================================================
doc.set_metadata({
    'title': 'Belgin Kuyumculuk & Saat — 2026 Kurumsal Profil & Lüks Saat Yönetimi',
    'author': 'Belgin Kuyumculuk & Saat',
    'subject': 'Kurumsal Profil, Miras, Lüks Saat Kürasyonu ve Güven Protokolü',
    'keywords': 'Belgin Kuyumculuk, Lüks Saat, Rolex, İzmir Buca, Ekspertiz, Takas, Portföy',
    'creator': 'Belgin Luxury Horology Studio',
    'producer': 'Antigravity Ultra-Premium PDF Engine'
})

doc.save(OUTPUT_PDF, garbage=4, deflate=True)
doc.save(PUBLIC_PDF, garbage=4, deflate=True)
doc.close()

pdf_size_mb = os.path.getsize(OUTPUT_PDF) / (1024 * 1024)
print(f"🎉 MASTER KURUMSAL PDF BAŞARIYLA OLUŞTURULDU:")
print(f"   -> {OUTPUT_PDF} ({pdf_size_mb:.2f} MB)")
print(f"   -> {PUBLIC_PDF} ({pdf_size_mb:.2f} MB)")

