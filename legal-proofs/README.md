# Belgin Kuyumculuk — Ücretsiz Dış Zaman İspatı Katmanı

Bu klasör, yayımlanan hukuki belge setinin `legal-manifest.json` bütünlük manifestine ait OpenTimestamps kanıtlarını saklar.

## Ne sağlar?

- Manifestin SHA-256 değeri alınır.
- Manifestin birebir kopyası içerik hash'i ile adlandırılarak saklanır.
- OpenTimestamps ücretsiz takvim sunucularına gönderilen `.ots` kanıtı üretilir.
- Kanıt daha sonra Bitcoin blok zincirindeki attestation bilgisiyle güncellenebilir ve bağımsız olarak doğrulanabilir.
- GitHub Actions her gün bekleyen `.ots` kanıtlarını `ots upgrade` ile güncellemeyi dener.

## Hukuki niteliği

Bu mekanizma teknik bir belge bütünlüğü ve belirli verinin belirli bir zamandan önce mevcut olduğuna ilişkin üçüncü taraf/blockchain destekli ek ispat katmanıdır.

**5070 sayılı Elektronik İmza Kanunu kapsamında güvenli/nitelikli elektronik imza değildir. BTK'ya bildirimde bulunmuş bir Elektronik Sertifika Hizmet Sağlayıcısı (ESHS) tarafından üretilen zaman damgasının yerine geçtiği iddia edilmez.**

Ücretsiz OpenTimestamps kanıtı; Belgin Kuyumculuk'un sunucu kayıtları, belge sürüm/hash manifesti, sipariş audit olayları, ödeme sağlayıcısı kayıtları ve mağaza teslim-tesellüm belgeleriyle birlikte yardımcı teknik delil olarak kullanılmak üzere tasarlanmıştır.

## Doğrulama

OpenTimestamps istemcisi kurulu bir ortamda örnek doğrulama:

```bash
python3 -m pip install opentimestamps-client==0.7.2
ots verify legal-proofs/legal-manifest-<SHA256>.json.ots
```

Bir kanıt ilk oluşturulduğunda Bitcoin attestation henüz kesinleşmemiş olabilir. `ots upgrade <dosya.ots>` komutu daha sonra kanıtı günceller.
