import fitz # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
import os

print("💎 [BELGİN SAAT & KUYUMCULUK] 2026 Master Kurumsal Profil Üretimi Başlatıldı...")

ORIGINAL_PDF = '/Users/macair1/.gemini/antigravity/brain/72a0b208-dccf-42b3-9290-227892c2d39e/.user_uploaded/media_1789215119007.pdf'
OUTPUT_PDF = '/Users/macair1/projects/belgin/docs/belgin-kurumsal-profil-2026.pdf'
PUBLIC_PDF = '/Users/macair1/projects/belgin/belgin-kurumsal-profil-2026.pdf'
os.makedirs('/Users/macair1/projects/belgin/docs', exist_ok=True)
os.makedirs('scratch/cleaned_pages', exist_ok=True)

# -------------------------------------------------------------
# 1. RASTER SAYFALARIN (1, 2, 4, 9) KUSURSUZ GÖRSEL MONTAJI
# -------------------------------------------------------------
font_serif_path = "/System/Library/Fonts/Supplemental/Georgia.ttf"
font_sans_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

f_serif_40 = ImageFont.truetype(font_serif_path, 40)
f_gold_num = ImageFont.truetype(font_sans_bold_path, 34)

GOLD_COLOR = (224, 194, 126) # #E0C27E
CREAM_WHITE = (244, 239, 229) # #F4EFE5

def patch_page_footer(img_path, has_num=True, num_str="02 / 09"):
    im = Image.open(img_path)
    # Background texture right above: y from 2770 to 2815, x from 545 to 1300
    strip = im.crop((545, 2770, 1300, 2815))
    
    # Clean paste over y: 2825 to 2895, starting from x=545 to cover entire old domain
    im.paste(strip, (545, 2825))
    im.paste(strip, (545, 2855))
    
    draw = ImageDraw.Draw(im)
    draw.text((575, 2838), "www.belginkuyumculuk.co", font=f_serif_40, fill=CREAM_WHITE)
    
    if has_num:
        draw.text((im.width - 270, 2842), num_str, font=f_gold_num, fill=GOLD_COLOR)
        
    return im

print("-> Sayfa 1, 2, 4 ve 9 görselleri www.belginkuyumculuk.co ile işleniyor...")

# Sayfa 1: Kapak
im1 = patch_page_footer('scratch/extracted_images/page_1_img_1_3.jpeg', has_num=False)
im1_dest = 'scratch/cleaned_pages/page_1_cleaned.jpeg'
im1.save(im1_dest, quality=95)

# Sayfa 2
im2 = patch_page_footer('scratch/extracted_images/page_2_img_1_5.jpeg', has_num=True, num_str="02 / 09")
im2_dest = 'scratch/cleaned_pages/page_2_cleaned.jpeg'
im2.save(im2_dest, quality=95)

# Sayfa 4
im4 = patch_page_footer('scratch/extracted_images/page_4_img_1_13.jpeg', has_num=True, num_str="04 / 09")
im4_dest = 'scratch/cleaned_pages/page_4_cleaned.jpeg'
im4.save(im4_dest, quality=95)

# Sayfa 9: Showroom Kapanış
im9 = Image.open('scratch/extracted_images/page_9_img_1_23.jpeg')
strip9 = im9.crop((780, 2750, 1430, 2790))
im9.paste(strip9, (780, 2640))
im9.paste(strip9, (780, 2675))

draw9 = ImageDraw.Draw(im9)
draw9.text((790, 2655), "www.belginkuyumculuk.co", font=f_serif_40, fill=CREAM_WHITE)
draw9.text((1800, 2845), "09 / 09", font=f_gold_num, fill=GOLD_COLOR)
im9_dest = 'scratch/cleaned_pages/page_9_cleaned.jpeg'
im9.save(im9_dest, quality=95)

print("✅ Sayfa 1, 2, 4, 9 görsel dosyaları sıfır pürüzle hazırlandı.")

# -------------------------------------------------------------
# 2. PYMUPDF MASTER DOKÜMAN İNŞASI
# -------------------------------------------------------------
orig_doc = fitz.open(ORIGINAL_PDF)
master_doc = fitz.open()

bg_emerald = (0.02745, 0.12157, 0.09412) # #071F18
font_sans = "/System/Library/Fonts/Supplemental/Arial.ttf"
font_sans_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

for i in range(len(orig_doc)):
    page_w = orig_doc[i].rect.width
    page_h = orig_doc[i].rect.height
    
    # Raster Sayfalar: 1, 2, 4, 9 (0, 1, 3, 8)
    if i == 0:
        p = master_doc.new_page(width=page_w, height=page_h)
        p.insert_image(p.rect, filename=im1_dest)
    elif i == 1:
        p = master_doc.new_page(width=page_w, height=page_h)
        p.insert_image(p.rect, filename=im2_dest)
    elif i == 3:
        p = master_doc.new_page(width=page_w, height=page_h)
        p.insert_image(p.rect, filename=im4_dest)
    elif i == 8:
        p = master_doc.new_page(width=page_w, height=page_h)
        p.insert_image(p.rect, filename=im9_dest)
    else:
        # Vektörel Sayfalar: 3, 5, 6, 7, 8 (2, 4, 5, 6, 7)
        master_doc.insert_pdf(orig_doc, from_page=i, to_page=i)
        p = master_doc[-1]
        
        # -----------------------------------------------------
        # Sayfa 6: Metin Çakışması (Overlap Bug) Düzeltmesi
        # -----------------------------------------------------
        if i == 5: # Sayfa 6
            print("-> Sayfa 6 editoryal metin hiyerarşisi uygulanıyor...")
            clean_p6_rect = fitz.Rect(40, 154, 560, 222)
            p.add_redact_annot(clean_p6_rect, fill=bg_emerald)
            p.apply_redactions()
            
            p.insert_font(fontname='f_arial_p6', fontfile=font_sans)
            # Spot metin (Muted Champagne)
            p.insert_text(
                fitz.Point(42, 163),
                "İkinci elde değer gören saatlerde ilişki tek satışla bitmez; müşteri zaman içinde yeni ürüne geçebilir,",
                fontname='f_arial_p6',
                fontfile=font_sans,
                fontsize=8.4,
                color=(0.78, 0.75, 0.69)
            )
            p.insert_text(
                fitz.Point(42, 174),
                "mevcut saatini değerlendirebilir ve portföyünü yeniden güncelleyebilir.",
                fontname='f_arial_p6',
                fontfile=font_sans,
                fontsize=8.4,
                color=(0.78, 0.75, 0.69)
            )
            # Ana açıklama paragrafı (Crisp Cream White)
            p.insert_text(
                fitz.Point(42, 192),
                "Takas ve geri alım yaklaşımı, müşterinin mevcut saatini portföyün dışında bırakmak yerine",
                fontname='f_arial_p6',
                fontfile=font_sans,
                fontsize=9.2,
                color=(0.96, 0.94, 0.90)
            )
            p.insert_text(
                fitz.Point(42, 204),
                "yeni tercihin bir parçası olarak değerlendirmesine imkân tanır. Değerlendirmede ürünün markası,",
                fontname='f_arial_p6',
                fontfile=font_sans,
                fontsize=9.2,
                color=(0.96, 0.94, 0.90)
            )
            p.insert_text(
                fitz.Point(42, 216),
                "referansı, kondisyonu, mevcut belge ve aksesuarları ile küresel piyasa karşılığı birlikte ele alınır.",
                fontname='f_arial_p6',
                fontfile=font_sans,
                fontsize=9.2,
                color=(0.96, 0.94, 0.90)
            )
        
        # -----------------------------------------------------
        # Sayfa 8: Parazit Çöp Metin Temizliği
        # -----------------------------------------------------
        if i == 7: # Sayfa 8
            print("-> Sayfa 8 görseller arası asılı parazit temizleniyor...")
            gap_rect = fitz.Rect(286.5, 150.0, 308.5, 220.0)
            p.add_redact_annot(gap_rect, fill=bg_emerald)
            p.apply_redactions()
            
        # -----------------------------------------------------
        # Sayfa 7: Randevu Linki
        # -----------------------------------------------------
        if i == 6: # Sayfa 7
            p7_box_rect = fitz.Rect(50, 755, 520, 775)
            p.add_redact_annot(p7_box_rect, fill=bg_emerald)
            p.apply_redactions()
            
            p.insert_font(fontname='f_arial_p7', fontfile=font_sans_bold)
            randevu_str = "Randevu ve özel talepler: www.belginkuyumculuk.co  •  VIP Danışma: +90 541 930 53 72"
            p.insert_text(
                fitz.Point(56, 768),
                randevu_str,
                fontname='f_arial_p7',
                fontfile=font_sans_bold,
                fontsize=8.2,
                color=(0.88, 0.76, 0.49)
            )
            
        # -----------------------------------------------------
        # Ortak Footer: Sayfa 3, 5, 6, 7, 8
        # -----------------------------------------------------
        footer_rect = fitz.Rect(40, 820, 500, 836)
        p.add_redact_annot(footer_rect, fill=bg_emerald)
        p.apply_redactions()
        
        p.insert_font(fontname='f_arial_ft', fontfile=font_sans)
        footer_str = "Belgin Kuyumculuk & Saat  •  Buca / İzmir  •  www.belginkuyumculuk.co"
        p.insert_text(
            fitz.Point(42, 830),
            footer_str,
            fontname='f_arial_ft',
            fontfile=font_sans,
            fontsize=6.8,
            color=(0.78, 0.75, 0.69)
        )

# -------------------------------------------------------------
# 3. METADATA VE ÇIKTI KAYDI
# -------------------------------------------------------------
master_doc.set_metadata({
    'title': 'Belgin Kuyumculuk & Saat — 2026 Kurumsal Profil & Lüks Saat Yönetimi',
    'author': 'Belgin Kuyumculuk & Saat',
    'subject': 'Kurumsal Profil, Miras, Lüks Saat Kürasyonu ve Güven Protokolü',
    'keywords': 'Belgin Kuyumculuk, Lüks Saat, Rolex, İzmir Buca, Ekspertiz, Takas, Portföy, www.belginkuyumculuk.co',
    'creator': 'Belgin Luxury Horology Studio',
    'producer': 'Antigravity Master Editorial PDF Engine'
})

master_doc.save(OUTPUT_PDF, garbage=4, deflate=True)
master_doc.save(PUBLIC_PDF, garbage=4, deflate=True)
master_doc.close()
orig_doc.close()

print(f"🎉 MASTER PDF ÜRETİMİ %100 BAŞARIYLA TAMAMLANDI:")
print(f"   -> {OUTPUT_PDF} ({os.path.getsize(OUTPUT_PDF) / (1024*1024):.2f} MB)")
print(f"   -> {PUBLIC_PDF} ({os.path.getsize(PUBLIC_PDF) / (1024*1024):.2f} MB)")

