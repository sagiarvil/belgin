const fs = require('fs');

// 1. Update js/app.js
let appCode = fs.readFileSync('js/app.js', 'utf8');

// Replace installmentBanner in openProduct
const oldBannerRegex = /\/\/ Taksit Banner[\s\S]*?const quickSpecsHtml/;
const newBanner = `// Güvenli Ödeme Bannerı (Tek Çekim & 3D Secure Güvencesi)
    const secureBannerHtml = \`
      <div class="pdp-installment-banner" style="background:#FAF8F5; border:1px solid #EAE5D9; color:#4A3B18; padding:10px 14px; border-radius:6px; font-size:12.5px; margin-top:14px; line-height:1.5;">
        <span>🔒 <strong>Güvenli Ödeme:</strong> BDDK lisanslı PayTR 256-bit SSL ve 3D Secure ile <strong>tek çekim</strong> veya havale/EFT güvencesi.</span>
      </div>
    \`;

    // 5'li Hızlı Özet Çipler (Altın vs Saat)
    const quickSpecsHtml`;

appCode = appCode.replace(oldBannerRegex, newBanner);
appCode = appCode.replace(/\$\{installmentBannerHtml\}/g, '${secureBannerHtml}');

// Replace tab-installments in openProduct
const oldInstallmentsTabRegex = /\/\/ Sekme 3: Taksit \/ Ödeme Seçenekleri[\s\S]*?const allProds/;
const newPaymentTab = `// Sekme 3: Güvenli Ödeme & 3D Secure
    const paymentTabHtml = \`
      <div id="tab-installments" class="pdp-tab-pane" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14px;">
          <h3 style="font-size:18px; font-weight:700; color:var(--color-ink); margin-bottom:14px;">
            💳 BDDK Lisanslı 3D Secure Güvenli Ödeme Standartları
          </h3>
          <p style="margin-bottom:12px;">
            Belgin Kuyumculuk olarak tüm saat, altın ve mücevher siparişlerinizde <strong>PayTR 256-bit SSL şifrelemeli 3D Secure altyapısı</strong> kullanılmaktadır. Tüm kredi ve banka kartlarıyla <strong>tek çekim</strong> olarak güvenle işlem yapabilirsiniz.
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:20px 0;">
            <div style="background:#FBF9F5; border:1px solid rgba(194,167,104,0.35); padding:16px; border-radius:6px;">
              <strong style="color:var(--color-ink); display:block; margin-bottom:6px;">💳 Kredi / Banka Kartı (3D Secure Tek Çekim)</strong>
              <span style="font-size:13px; color:#666;">Kart sahibinin cep telefonuna iletilen tek kullanımlık SMS onay kodu ile banka düzeyinde doğrulanır. Kart bilgileri sunucularımızda asla tutulmaz.</span>
            </div>
            <div style="background:#FBF9F5; border:1px solid rgba(194,167,104,0.35); padding:16px; border-radius:6px;">
              <strong style="color:var(--color-ink); display:block; margin-bottom:6px;">🏦 Banka Havalesi / FAST (%3 İndirimli)</strong>
              <span style="font-size:13px; color:#666;">Kurumsal banka hesaplarımıza anında transfer ile sipariş oluşturabilirsiniz. Açıklama kısmına sipariş kodunun yazılması yeterlidir.</span>
            </div>
          </div>
        </div>
      </div>
    \`;

    // İlgili Ürünler
    const allProds`;

appCode = appCode.replace(oldInstallmentsTabRegex, newPaymentTab);
appCode = appCode.replace(/\$\{installmentsTabHtml\}/g, '${paymentTabHtml}');
appCode = appCode.replace(/<span>💳 (?:Taksit Seçenekleri|Ödeme & Mevzuat)<\/span>/g, '<span>💳 Güvenli Ödeme & 3D Secure</span>');

// Replace any remaining installment references in app.js
appCode = appCode.replace(/Vade farksız \d+ taksit[^\n<]*/gi, 'Güvenli 3D Secure Tek Çekim');
appCode = appCode.replace(/Tüm kartlara Mevzuata Uygun Taksit imkanı/gi, 'BDDK Lisanslı 3D Secure Güvencesi');

fs.writeFileSync('js/app.js', appCode, 'utf8');
console.log('Updated js/app.js successfully');

// 2. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/Kredi Kartı \/ 3D Secure \(mevzuata uygun taksit\)/gi, 'Kredi Kartı / Banka Kartı (3D Secure Tek Çekim)');
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('Updated index.html successfully');

// 3. Update js/seo.js
let seoJs = fs.readFileSync('js/seo.js', 'utf8');
seoJs = seoJs.replace(/kredi kartına 12 taksit veya/gi, '3D Secure tek çekim ve');
seoJs = seoJs.replace(/taksitli saat alımı, /gi, '');
fs.writeFileSync('js/seo.js', seoJs, 'utf8');
console.log('Updated js/seo.js successfully');
