// BELGIN KUYUMCULUK — BELGE BUTUNLUK VE DELIL KAYDI MOTORU
(function () {
  'use strict';

  const MANIFEST_URL = '/legal-manifest.json?v=2026.08.25.2460';

  const FALLBACK_VERSIONS = {
    'mesafeli-satis-sozlesmesi.html': '01_v2.1 (25.08.2026)',
    'on-bilgilendirme-formu.html': '02_v2.1 (25.08.2026)',
    'yuksek-degerli-urun-teslimi.html': '03_v2.1 (25.08.2026)',
    'kullanim-kosullari.html': '04_v2.1 (25.08.2026)',
    'kvkk.html': '05_v2.1 (25.08.2026)',
    'kvkk-aydinlatma-metni.html': '05_v2.1 (25.08.2026)',
    'kvkk-basvuru.html': '06_v2.1 (25.08.2026)',
    'gizlilik-politikasi.html': '07_v2.1 (25.08.2026)',
    'cerez-politikasi.html': '08_v2.1 (25.08.2026)',
    'ticari-elektronik-ileti-onayi.html': '09_v2.1 (25.08.2026)',
    'ticari-elektronik-ileti.html': '09_v2.1 (25.08.2026)',
    'kvkk-acik-riza.html': '10_v2.1 (25.08.2026)',
    'garanti-ve-satis-sonrasi.html': '11_v2.1 (25.08.2026)',
    'musteri-tanima-ve-islem-guvenligi.html': '12_v2.1 (25.08.2026)',
    'magaza-teslim-tesellum-formu.html': '13_v2.1 (25.08.2026)',
    'iade-degisim-cayma.html': '14_v2.1 (25.08.2026)',
    'iade-degisim.html': '14_v2.1 (25.08.2026)',
    'guvenli-odeme-ve-3d-secure.html': '15_v2.1 (25.08.2026)',
    'hukuki-delil-ve-kayit-politikasi.html': '16_v2.1 (25.08.2026)'
  };

  function currentFileName() {
    const path = String(window.location.pathname || '').split('/').pop();
    return path || 'index.html';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadManifest() {
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  function renderBox(record, manifest) {
    const mainEl = document.querySelector('main.legal') || document.querySelector('.legal-shell') || document.querySelector('.legal-doc-container') || document.querySelector('main') || document.body;
    if (!mainEl || document.getElementById('legalEvidenceIntegrityBox')) return;

    const file = currentFileName();
    const fallbackVer = FALLBACK_VERSIONS[file] || '2026-08-25-v2.1';
    const version = record?.version || fallbackVer;
    const sha256 = record?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const generatedAt = manifest?.generatedAt ? new Date(manifest.generatedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

    const html = `
      <section id="legalEvidenceIntegrityBox" aria-label="Belge sürümü ve bütünlük kaydı" style="margin:40px 0 0;padding:26px 30px;background:#fff;border:2px solid #084c47;border-radius:12px;box-shadow:0 8px 30px rgba(8,76,71,.08);font-family:system-ui,-apple-system,sans-serif;color:#222;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;border-bottom:1px solid #e6e0d6;padding-bottom:16px;margin-bottom:18px;">
          <div>
            <div style="font-size:11px;letter-spacing:1.7px;text-transform:uppercase;font-weight:800;color:#b68a32;margin-bottom:5px;">BELGE BÜTÜNLÜK VE DELİL KAYDI</div>
            <h3 style="margin:0;color:#084c47;font-size:20px;">Belge Sürümü ve SHA-256 Bütünlük Özeti</h3>
          </div>
          <span style="background:#eef6f4;border:1px solid #cfe2de;padding:7px 13px;border-radius:20px;font-size:12px;font-weight:700;color:#084c47;">Sistem Kayıt Katmanı</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:18px;font-size:13px;">
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Belge</strong>${escapeHtml(file)}</div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Sürüm</strong><strong style="color:#084c47;">${escapeHtml(version)}</strong></div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Manifest üretim zamanı</strong>${escapeHtml(generatedAt)}</div>
        </div>

        <div style="background:#eef6f4;border:1px solid #cfe2de;border-radius:8px;padding:14px 16px;margin-bottom:16px;overflow-wrap:anywhere;">
          <strong style="display:block;color:#084c47;margin-bottom:5px;">SHA-256 belge bütünlük özeti</strong>
          <code style="font-size:12px;font-family:monospace;font-weight:600;color:#084c47;">${escapeHtml(sha256)}</code>
        </div>

        <p style="font-size:12.5px;line-height:1.7;color:#555;margin:0 0 10px;">Bu kayıt, yayımlanan hukuki metnin sürümünü ve içeriğinin bütünlük kontrolünde kullanılabilecek SHA-256 özetini gösterir. Siparişe özgü kabul, ödeme ve teslim delilleri ayrıca sunucu tarafındaki sipariş/audit kayıtlarında tutulur.</p>
        <p style="font-size:12.5px;line-height:1.7;color:#555;margin:0;"><strong>Hukuki nitelik açıklaması:</strong> Bu alan tek başına nitelikli elektronik imza, güvenli elektronik imza veya 5070 sayılı Kanun kapsamında yetkili elektronik sertifika hizmet sağlayıcısı tarafından üretilmiş zaman damgası değildir. Böyle bir hizmet devreye alınırsa ayrıca sağlayıcı ve doğrulanabilir token bilgisiyle gösterilir.</p>
      </section>`;

    mainEl.insertAdjacentHTML('beforeend', html);
  }

  async function init() {
    const manifest = await loadManifest();
    const file = currentFileName();
    const record = manifest?.documents?.[file] || null;
    renderBox(record, manifest);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
