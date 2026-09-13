from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs('scratch/cleaned_pages', exist_ok=True)

# 1. Clean page 8 image
im8 = Image.open('scratch/extracted_images/page_8_img_2_11.jpeg')
im8_clean = im8.crop((0, 35, im8.width, im8.height))
im8_clean = im8_clean.resize(im8.size, Image.Resampling.LANCZOS)
im8_clean.save('scratch/cleaned_pages/page_8_img_clean.jpeg', quality=95)
print("Page 8 image cleaned.")

# Try to find a good serif / sans font on macOS
# Usually /System/Library/Fonts/Helvetica.ttc or Georgia.ttf
font_path_serif = "/System/Library/Fonts/Supplemental/Georgia.ttf"
font_path_sans = "/System/Library/Fonts/Helvetica.ttc"
if not os.path.exists(font_path_serif):
    font_path_serif = "/System/Library/Fonts/Times.ttc"

print("Serif font:", font_path_serif)
print("Sans font:", font_path_sans)

