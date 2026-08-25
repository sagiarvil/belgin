// BELGIN KUYUMCULUK — document version & transaction evidence card
// This module deliberately does NOT claim a qualified electronic signature,
// trusted timestamp or cryptographic proof unless such evidence actually exists.
(function () {
  const DOCUMENT_VERSION = '2026-08-25';

  function getAudit() {
    try {
      const raw = localStorage.getItem('last_order_audit') || localStorage.getItem('belgin_active_transaction');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function render() {
    const main = document.querySelector('main.legal') || document.querySelector('.legal-shell') || document.querySelector('.legal-doc-container') || document.querySelector('main');
    if (!main || document.getElementById('legalEvidenceCard')) return;

    const audit = getAudit();
    const orderId = audit?.orderId || audit?.merchant_oid || null;
    const acceptedAt = audit?.termsAcceptedAt || audit?.acceptedAt || null;
    const termsVersion = audit?.termsVersion || audit?.legalClientVersions?.terms || DOCUMENT_VERSION;
    const preInfoVersion = audit?.preInformationVersion || audit?.legalClientVersions?.preInformation || DOCUMENT_VERSION;
    const highValueVersion = audit?.highValueDeliveryVersion || audit?.legalClientVersions?.highValueDelivery || null;

    const card = document.createElement('section');
    card.id = 'legalEvidenceCard';
    card.setAttribute('aria-label', 'Belge sürümü ve işlem kayıt bilgisi');
    card.style.cssText = 'margin-top:36px;padding:22px 24px;background:#fff;border:1px solid #cfe2de;border-left:5px solid #084c47;border-radius:10px;font:13px/1.65 system-ui,-apple-system,sans-serif;color:#26302e';

    if (!audit || !orderId) {
      card.innerHTML = `
        <strong style="display:block;color:#084c47;margin-bottom:6px">Belge sürüm bilgisi</strong>
        <div>Bu sayfanın yayın sürümü: <b>${DOCUMENT_VERSION}</b>.</div>
        <div style="margin-top:7px;color:#5f6765">Bu ekranda bir siparişe ait elektronik imza, nitelikli zaman damgası veya kriptografik onay üretildiği iddia edilmez. Siparişe ilişkin kabul ve işlem delilleri, ödeme/sipariş sisteminde gerçekten oluşturulan kayıtlar üzerinden değerlendirilir.</div>`;
    } else {
      card.innerHTML = `
        <strong style="display:block;color:#084c47;margin-bottom:8px">İşlem kayıt özeti</strong>
        <div><b>Sipariş referansı:</b> ${esc(orderId)}</div>
        ${acceptedAt ? `<div><b>Kabul zamanı:</b> ${esc(new Date(acceptedAt).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}))}</div>` : ''}
        <div><b>Mesafeli satış sürümü:</b> ${esc(termsVersion)}</div>
        <div><b>Ön bilgilendirme sürümü:</b> ${esc(preInfoVersion)}</div>
        ${highValueVersion ? `<div><b>Yüksek değerli teslim sürümü:</b> ${esc(highValueVersion)}</div>` : ''}
        <div style="margin-top:8px;color:#5f6765">Bu kart yalnız tarayıcıda mevcut işlem kaydının okunabilir özetidir. Nitelikli elektronik imza veya güvenli elektronik zaman damgası yerine geçmez. Hukuki ispatta sunucu sipariş kaydı, ödeme sağlayıcı kaydı, kabul sürümleri ve mağaza teslim belgeleri esas alınır.</div>`;
    }

    main.appendChild(card);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
