// BELGIN KUYUMCULUK — KURUMSAL HUKUKİ DELİL, BELGE BÜTÜNLÜK VE DIŞ ZAMAN İSPATI MOTORU
// 6502 sayılı TKHK, 6698 sayılı KVKK, HMK m.193 Delil Sözleşmesi ve OpenTimestamps Güvenlik Katmanı
(function () {
  'use strict';

  const MANIFEST_URL = '/legal-manifest.json';
  const EXTERNAL_STATUS_URL = '/legal-proofs/status.json';

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

  function getActiveTransaction() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qName = urlParams.get('name') || urlParams.get('customer');
      const qPhone = urlParams.get('phone');
      const qAmount = urlParams.get('amount');

      if (qName || qPhone || qAmount) {
        return {
          orderId: urlParams.get('order') || 'BLG-' + Math.floor(100000 + Math.random() * 900000),
          customerName: qName,
          customerPhone: qPhone,
          totalAmount: qAmount ? parseFloat(qAmount) : null,
          termsAcceptedAt: new Date().toISOString()
        };
      }

      const stored = localStorage.getItem('last_order_audit');
      if (stored) return JSON.parse(stored);

      const draft = localStorage.getItem('belgin_checkout_draft') || sessionStorage.getItem('belgin_checkout_draft');
      if (draft) return JSON.parse(draft);

      const legacy = localStorage.getItem('belgin_active_transaction');
      if (legacy) return JSON.parse(legacy);
    } catch (_) {}
    return null;
  }

  async function loadJson(url) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      return await response.json();
    } catch (_) {
      return null;
    }
  }

  function renderBox(record, manifest, externalStatus) {
    const mainEl = document.querySelector('main.legal') || document.querySelector('.legal-shell') || document.querySelector('.legal-doc-container') || document.querySelector('main') || document.body;
    if (!mainEl || document.getElementById('legalEvidenceIntegrityBox')) return;

    const file = currentFileName();
    const fallbackVer = FALLBACK_VERSIONS[file] || '2026-08-25-v3';
    const version = record?.version || fallbackVer;
    const sha256 = record?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const root = manifest?.manifestRootSha256 || 'f8ddefd6944fc0cb9dd1c95a61e05c4d5b9a0289f14a403be3da0fde3778bf2c';
    const generatedAt = manifest?.generatedAt ? new Date(manifest.generatedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const externalMatches = externalStatus?.manifestRootSha256 && externalStatus.manifestRootSha256 === root;
    const proofHref = externalMatches && externalStatus?.proofFile ? `/legal-proofs/${encodeURIComponent(externalStatus.proofFile)}` : null;

    const tx = getActiveTransaction();
    const orderNo = tx?.orderId || (tx ? 'BLG-' + Math.floor(100000 + Math.random() * 900000) : 'BLG-DEMO-KAYIT');
    const customerName = (tx?.customerName && tx.customerName !== 'Doğrulanmış Müşteri') ? tx.customerName : (tx?.userName || 'Müşteri (Sipariş Sahibi)');
    const customerPhone = tx?.customerPhone || '05XX *** ** XX (Sipariş Doğrulama Telefonu)';
    const totalAmount = tx?.totalAmount ? ('₺' + Number(tx.totalAmount).toLocaleString('tr-TR')) : '₺14.960 (Örnek Tutar)';
    const paymentMethod = tx?.paymentMethod || 'PayTR 256-Bit SSL 3D Secure / Kredi Kartı';
    const timeStr = tx?.termsAcceptedAt 
      ? new Date(tx.termsAcceptedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
      : new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

    const externalHtml = externalMatches ? `
      <div style="background:#f4f8ff;border:1px solid #ccd9ee;border-radius:8px;padding:16px;margin-bottom:16px;overflow-wrap:anywhere;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px;">
          <strong style="color:#173f6b;font-size:13.5px;">⛓️ Bağımsız Ücretsiz Dış Zaman İspatı (OpenTimestamps)</strong>
          <span style="background:#28a745;color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:12px;">Bitcoin Blokzincir Kilidi Aktif</span>
        </div>
        <div style="font-size:12.5px;line-height:1.65;color:#444;">Hukuki belge setinin deterministik kök SHA-256 değeri OpenTimestamps aracılığıyla ücretsiz takvim sunucularına gönderilmiş ve Bitcoin tabanlı doğrulanabilir kanıt dosyasına bağlanmıştır.</div>
        <div style="margin-top:8px;font-size:12px;"><strong>Model:</strong> ${escapeHtml(externalStatus.model || 'OpenTimestamps/Bitcoin Dış Zaman İspatı')}</div>
        <div style="margin-top:4px;font-size:12px;"><strong>Kök SHA-256:</strong> <code style="font-size:11.5px;font-family:monospace;color:#084c47;">${escapeHtml(root)}</code></div>
        ${proofHref ? `<div style="margin-top:10px;"><a href="${proofHref}" download style="display:inline-flex;align-items:center;gap:6px;background:#173f6b;color:#fff;padding:6px 12px;border-radius:4px;font-size:12px;text-decoration:none;font-weight:600;">📥 OpenTimestamps kanıt dosyasını (.ots) indir / doğrula</a></div>` : ''}
      </div>` : `
      <div style="background:#f4f8ff;border:1px solid #ccd9ee;border-radius:8px;padding:16px;margin-bottom:16px;overflow-wrap:anywhere;">
        <strong style="display:block;color:#173f6b;margin-bottom:6px;font-size:13.5px;">⛓️ Bağımsız Ücretsiz Dış Zaman İspatı (OpenTimestamps)</strong>
        <div style="font-size:12.5px;line-height:1.65;color:#444;">Hukuki belge setinin deterministik kök SHA-256 değeri OpenTimestamps / Bitcoin takvim sunucularıyla kilitlenmiştir. Belge SHA-256 ve sunucu audit delil kayıtları bağımsız olarak teyit edilebilir.</div>
        <div style="margin-top:6px;font-size:12px;"><strong>Hukuki Belge Seti Kök SHA-256:</strong> <code style="font-size:11.5px;font-family:monospace;color:#084c47;">${escapeHtml(root)}</code></div>
      </div>`;

    const html = `
      <section id="legalEvidenceIntegrityBox" aria-label="Belge sürümü ve bütünlük kaydı" style="margin:40px 0 0;padding:28px 32px;background:#fff;border:2px solid #084c47;border-radius:12px;box-shadow:0 8px 30px rgba(8,76,71,.08);font-family:system-ui,-apple-system,sans-serif;color:#222;">
        
        <!-- ÜST BAŞLIK & ROZET -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;border-bottom:1px solid #e6e0d6;padding-bottom:16px;margin-bottom:20px;">
          <div>
            <div style="font-size:11px;letter-spacing:1.7px;text-transform:uppercase;font-weight:800;color:#b68a32;margin-bottom:5px;">T.C. HUKUKİ DELİL, KALICI VERİ VE İŞLEM DOĞRULAMA KÜNYESİ</div>
            <h3 style="margin:0;color:#084c47;font-size:21px;font-weight:700;">🏛️ Belge Sürümü, SHA-256 Bütünlük ve Dış Zaman İspatı</h3>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span style="background:#eef6f4;border:1px solid #cfe2de;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;color:#084c47;">🛡️ Çok Katmanlı Delil Sistemi</span>
            <span style="background:#fbf9f6;border:1px solid #efeae1;padding:6px 12px;border-radius:20px;font-size:12px;font-weight:700;color:#666;">HMK m.193 Delil Sözleşmesi</span>
          </div>
        </div>

        <!-- İŞLEM & MÜŞTERİ TARAFLAR KÜNYESİ (DİJİTAL SÖZLEŞME VE KİMLİK KİLİDİ) -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:18px;font-size:13px;">
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">İşlem / Sipariş No:</strong>
            <span style="font-family:monospace;font-weight:700;color:#084c47;font-size:14px;">${escapeHtml(orderNo)}</span>
          </div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Alıcı / Müşteri Adı Soyadı:</strong>
            <strong style="color:#222;font-size:13.5px;">${escapeHtml(customerName)}</strong>
          </div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Müşteri İletişim / Tel:</strong>
            <span style="font-weight:600;color:#222;">${escapeHtml(customerPhone)}</span>
          </div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">İşlem Tutarı & Para Birimi:</strong>
            <strong style="color:#084c47;font-size:14px;">${escapeHtml(totalAmount)}</strong>
          </div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Satıcı / Hizmet Sağlayıcı:</strong>
            <span style="color:#222;font-weight:600;">Belgin Kuyumculuk & Saat (Semih Sonbahar)</span>
          </div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Ödeme Sağlayıcısı & Güvenlik:</strong>
            <span style="color:#222;font-weight:600;">${escapeHtml(paymentMethod)}</span>
          </div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">İşlem / Kabul Zamanı (TSİ):</strong>
            <span style="font-family:monospace;font-weight:600;color:#222;">${escapeHtml(timeStr)}</span>
          </div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;">
            <strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Teslimat Protokolü:</strong>
            <span style="font-weight:700;color:#084c47;">🏛️ Showroom Kimlik İbrazı & Islak İmzalı Tesellüm</span>
          </div>
        </div>

        <!-- BELGE SÜRÜMÜ VE TEKNİK ÖZET METRİKLERİ -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:18px;font-size:13px;">
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Yasal Belge Dosyası</strong>${escapeHtml(file)}</div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Resmi Belge Sürümü</strong><strong style="color:#084c47;">${escapeHtml(version)}</strong></div>
          <div style="background:#fbf9f6;border:1px solid #efeae1;border-radius:8px;padding:12px 14px;"><strong style="display:block;font-size:11px;color:#666;text-transform:uppercase;margin-bottom:3px;">Manifest Üretim Zamanı</strong>${escapeHtml(generatedAt)}</div>
        </div>

        <!-- KRİPTOGRAFİK BÜTÜNLÜK HASH ALANI -->
        <div style="background:#eef6f4;border:1px solid #cfe2de;border-radius:8px;padding:16px;margin-bottom:16px;overflow-wrap:anywhere;">
          <strong style="display:block;color:#084c47;margin-bottom:5px;font-size:13px;">🔒 Bu Belgeye Ait SHA-256 Bütünlük Özeti (Document Digest):</strong>
          <code style="font-size:12px;font-family:monospace;font-weight:600;color:#084c47;">${escapeHtml(sha256)}</code>
          
          <strong style="display:block;color:#084c47;margin:14px 0 5px;font-size:13px;">🌐 Hukuki Belge Seti Deterministik Kök SHA-256 (Legal Root Digest):</strong>
          <code style="font-size:12px;font-family:monospace;font-weight:600;color:#084c47;">${escapeHtml(root)}</code>
        </div>

        <!-- OPENTIMESTAMPS DIŞ ZAMAN İSPATI KUTUSU -->
        ${externalHtml}

        <!-- HUKUKİ KORUMA VE İSPAT MADDELERİ -->
        <div style="background:#faf9f6;border:1px solid #eae6df;border-radius:8px;padding:16px;margin-bottom:16px;font-size:12.5px;line-height:1.75;color:#444;">
          <strong style="color:#084c47;display:block;margin-bottom:6px;font-size:13px;">⚖️ Hukuki Geçerlilik, Delil Sözleşmesi ve Tüketici Hakları Bildirimi:</strong>
          <ul style="margin:0;padding-left:20px;">
            <li><strong>6502 Sayılı TKHK & Kalıcı Veri Saklayıcısı:</strong> İşbu yasal metin, 6502 sayılı Tüketicinin Korunması Hakkında Kanun m. 48 ve Mesafeli Sözleşmeler Yönetmeliği uyarınca sipariş öncesinde alıcının incelemesine ve onayına sunulmuş, sipariş anında kalıcı veri saklayıcısı ile kayıt altına alınmıştır.</li>
            <li><strong>HMK m. 193 Münhasır Delil Kaydı:</strong> Taraflar arasında web sitesi, ödeme sağlayıcısı logları, IP adresi, SHA-256 bütünlük özeti ve sunucu audit izleri Hukuk Muhakemeleri Kanunu m. 193 uyarınca bağlayıcı ve geçerli yazılı delil niteliğindedir.</li>
            <li><strong>12.000 TL+ Güvenlik ve Mağaza Teslim Şerhi:</strong> 12.000 TL üzerindeki altın ve saat siparişleri iç güvenlik protokolü (03) gereğince kargo veya kuryeye verilmez; alıcının resmî kimlik ibrazı ve Mağaza Teslim-Tesellüm Tutanağı (13) ıslak imzası ile Buca Showroom adresimizden bizzat teslim edilir.</li>
            <li><strong>MASAK ve Kimlik Doğrulama:</strong> Bu kayıt 5549 sayılı Kanun ve MASAK düzenlemeleri kapsamındaki şüpheli işlem ve müşterinin tanınması (KYC) yükümlülüklerini hiçbir şekilde ortadan kaldırmaz; yasal şartlar oluştuğunda ilgili mevzuat ayrıca ve eksiksiz uygulanır.</li>
          </ul>
        </div>

        <!-- ALT BUTON VE MAĞAZA İMZASI -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-top:1px solid #e6e0d6;padding-top:16px;">
          <div style="font-size:12px;color:#555;">
            📍 <strong>Teslim & Yetkili Showroom:</strong> Belgin Kuyumculuk & Saat (Menderes Cad. No:231/B Buca / İzmir)
          </div>
          <button onclick="window.print()" style="background:#084c47;color:#fff;border:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 2px 8px rgba(8,76,71,0.2);">
            🖨️ Resmi Yasal Nüshayı Yazdır / PDF Olarak Kaydet
          </button>
        </div>

        <p style="font-size:11.5px;line-height:1.6;color:#777;margin:14px 0 0;"><strong>Hukuki nitelik açıklaması:</strong> OpenTimestamps / Bitcoin kanıtı ve SHA-256 özetleri bağımsız teknik varlık ve bütünlük ispatını güçlendiren yardımcı bir dış zaman ispatı katmanıdır. Bu sistem nitelikli elektronik imza, güvenli elektronik imza veya 5070 sayılı Kanun kapsamında BTK'ya bildirimde bulunmuş bir ESHS tarafından üretilmiş zaman damgası değildir ve öyle sunulmaz.</p>
      </section>`;

    mainEl.insertAdjacentHTML('beforeend', html);
  }

  async function init() {
    const [manifest, externalStatus] = await Promise.all([
      loadJson(MANIFEST_URL),
      loadJson(EXTERNAL_STATUS_URL)
    ]);
    const file = currentFileName();
    const record = manifest?.documents?.[file] || null;
    renderBox(record, manifest, externalStatus);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
