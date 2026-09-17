import re
import os

def rename_folio(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Rename "Kurumsal Profil & Folio" to "Kurumsal Profil"
    content = content.replace("Kurumsal Profil &amp; Folio", "Kurumsal Profil")
    content = content.replace("Kurumsal Profil & Folio", "Kurumsal Profil")
    
    # Remove "Folio" from texts
    content = content.replace("KURUMSAL PROFİL FOLİOSU", "KURUMSAL PROFİL")
    content = content.replace("Kurumsal Folio", "Kurumsal")

    # Rename "2026 Kurumsal Profil PDF" to "Kurumsal Profil"
    content = content.replace("2026 Kurumsal Profil PDF", "Kurumsal Profil")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Renamed in {filepath}")

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for file in files:
        if file.endswith('.html'):
            rename_folio(os.path.join(root, file))

