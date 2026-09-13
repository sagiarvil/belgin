from PIL import Image, ImageDraw, ImageFont

font_serif_path = "/System/Library/Fonts/Supplemental/Georgia.ttf"
font_sans_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

f_serif_40 = ImageFont.truetype(font_serif_path, 40)
f_gold_num = ImageFont.truetype(font_sans_bold_path, 34)

GOLD_COLOR = (224, 194, 126) # #E0C27E
CREAM_WHITE = (244, 239, 229) # #F4EFE5

def patch_page_footer(img_path, has_num=True, num_str="02 / 09"):
    im = Image.open(img_path)
    # Background texture right above: y from 2770 to 2815, x from 560 to 1300
    strip = im.crop((560, 2770, 1300, 2815))
    
    # Clean paste over y: 2825 to 2895
    im.paste(strip, (560, 2825))
    im.paste(strip, (560, 2855))
    
    draw = ImageDraw.Draw(im)
    # Text starts at x=575, y=2838
    draw.text((575, 2838), "www.belginkuyumculuk.co", font=f_serif_40, fill=CREAM_WHITE)
    
    if has_num:
        draw.text((im.width - 270, 2842), num_str, font=f_gold_num, fill=GOLD_COLOR)
        
    return im

# Test on page 1 and page 2
im1 = patch_page_footer('scratch/extracted_images/page_1_img_1_3.jpeg', has_num=False)
c1 = im1.crop((450, 2810, 1350, 2910))
c1.save('scratch/verify_renders/c1_tuned.jpg')

im2 = patch_page_footer('scratch/extracted_images/page_2_img_1_5.jpeg', has_num=True, num_str="02 / 09")
c2 = im2.crop((450, 2810, 2000, 2910))
c2.save('scratch/verify_renders/c2_tuned.jpg')

print("Tuned c1 and c2 saved.")
