---
name: antigravity-account-switch
description: Google Antigravity coklu hesap gecisi. Aktif oturumu yakala, kayitli hesaplari listele, bir hesaba gec (Antigravity kapat -> o hesabin cookie/session yaz -> limit/kullanim izlerini sifirla -> yeniden baslat) veya cikis + temizle. Kullanici "hesap degistir", "diger hesaba gec", "X hesabina gir", "cikis yap ve temizle" derse kullan.
---

# Antigravity Hesap Gecisi

Depo (GUI ile ortak): D:\proje\AgAccountManager\bin\Accounts\
Betik: bu klasordeki switch.ps1

Her cagri:
    powershell -ExecutionPolicy Bypass -File "<skill-dir>\switch.ps1" <param>

| Amac | Param |
|---|---|
| Kayitli hesaplar | -List |
| Aktif oturumu kaydet | -CaptureCurrent |
| Hesaba gec | -To eposta@ornek.com |
| Gec + acma | -To eposta@ornek.com -NoRelaunch |
| Cikis + temizle | -Logout |

## Akis (kullanici "X hesabina gec")
1. -List ile X kayitli mi kontrol et. Degilse: "once o hesapla girip -CaptureCurrent calistir" de.
2. -To X calistir: Antigravity kapatilir, mevcut oturum arsivlenir, limit izleri silinir,
   X'in cookie/session yazilir, Antigravity yeniden baslar.
3. Ciktilari ozetle.

## Kurallar
- Islem Antigravity'i yeniden baslatir; kullanicidan onay al.
- Hicbir sey kalici silinmez; Accounts\<hesap>\<zaman>\ altina tasinir.
- Emin degilsen once -List, sonra sor.