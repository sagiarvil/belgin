const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const COMPANY = 'BELGİN KUYUMCULUK - SEMİH SONBAHAR';
const SUPPORT_EMAIL = 'iletisim@belginkuyumculuk.com';
const MARKER = 'data-bank-pos-readiness="v1"';

function writeIfChanged(file, transform) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  const before = fs.readFileSync(full, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(full, after, 'utf8');
}

function scrubPublicClaims(content) {
  let out = content;

  out = out
    .replace(/Belgin Kuyumculuk Sanayi ve Ticaret Ltd\. Şti\./g, COMPANY)
    .replace(/Belgin Kuyumculuk Ltd\. Şti\./g, COMPANY)
    .replace(/0123456789012345/g, 'RESMİ BELGEDE İBRAZ EDİLİR')
    .replace(/1234567890/g, 'RESMİ BELGEDE İBRAZ EDİLİR')
    .replace(/Şirinyer V\.D\.\s*[-–]?\s*RESMİ BELGEDE İBRAZ EDİLİR/g, 'Vergi bilgileri resmi belge üzerinden ibraz edilir')
    .replace(/MERSİS\s*(?:No|\/ Vergi No)?\s*:\s*RESMİ BELGEDE İBRAZ EDİLİR(?:\s*\/\s*RESMİ BELGEDE İBRAZ EDİLİR\s*\([^)]*\))?/gi, 'Ticari Kayıt Bilgileri: Yetkili banka ve kamu kurumlarına resmi belge üzerinden ibraz edilir')
    .replace(/MERSİS:\s*RESMİ BELGEDE İBRAZ EDİLİR\s*\|\s*[^<\n]*/gi, 'Ticari kayıt bilgileri resmi belge üzerinden ibraz edilir')
    .replace(/BDDK Lisanslı PayTR\s*/gi, '')
    .replace(/PayTR 256-bit SSL\s*&\s*3D Secure 2\.0/gi, 'Güvenli Kart Ödemesi & 3D Secure')
    .replace(/PayTR 3D Secure/gi, '3D Secure Kart Ödemesi')
    .replace(/Kredi Kartı\s*\/\s*3D Secure\s*\(12 Taksit\)/gi, 'Kredi Kartı / 3D Secure (mevzuata uygun taksit)')
    .replace(/12 aya varan taksit seçenekleri/gi, 'mevzuat ve kart/banka kurallarına uygun taksit seçenekleri')
    .replace(/Tüm bankaların kredi kartlarına[^<\n]*12 aya varan taksit seçenekleri:?/gi, 'Kart ve banka koşullarına göre, yürürlükteki mevzuat sınırları içinde taksit seçenekleri:')
    .replace(/resmi distribütör ithalatı ve 2 yıl garantilidir/gi, 'ürüne ait fatura ve garanti belgesindeki kapsamla satılır')
    .replace(/Türkiye Distribütörü Onaylı ve Kaşeli Garanti Belgesi/gi, 'Ürüne ait garanti belgesi ve satış faturası')
    .replace(/Belgin Kuyumculuk & Saat Distribütörlük Taahhüdü/gi, 'Belgin Kuyumculuk Ürün ve Belge Taahhüdü');

  // Tüm checkbox'lar aktif kullanıcı iradesiyle seçilmelidir; hiçbir rıza/onay önceden işaretlenmez.
  out = out.replace(/(<input\b(?=[^>]*\btype=["']checkbox["'])[^>]*?)\schecked(?=[\s>])/gi, '$1');

  // Eski ürün detayında sabit 6/9/12 planı yerine yalnız mevzuata bağlı açıklama göster.
  const installmentDisclosure = `<!-- SEKME 3: Taksit Seçenekleri -->
          <div id="tab-installments" class="pdp-tab-pane" role="tabpanel">
            <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:24px; line-height:1.7;">
              <strong style="display:block; margin-bottom:8px;">Kart ve banka koşullarına göre taksit</strong>
              <p style="font-size:13.5px; color:var(--color-muted); margin:0;">Taksit seçenekleri ödeme adımında, kartın bankası ve işlem tarihinde yürürlükte bulunan mevzuat sınırlarına göre gösterilir. Sitede mevzuatın üzerinde sabit taksit taahhüdü verilmez.</p>
            </div>
          </div>

          <!-- SEKME 4:`;
  out = out.replace(/<!-- SEKME 3:[\s\S]*?<!-- SEKME 4:/g, installmentDisclosure);

  // Geriye kalan eski sabit yüksek taksit etiketleri kamu metninde bulunmamalı.
  out = out.replace(/\b(?:6|9|12)\s*Taksit\b/gi, 'Mevzuata Uygun Taksit');

  return out;
}

const htmlFiles = fs.readdirSync(root).filter((name) => /\.html$/i.test(name));
for (const file of htmlFiles) {
  writeIfChanged(file, (content) => {
    let out = scrubPublicClaims(content);

    if (!out.includes(`mailto:${SUPPORT_EMAIL}`)) {
      const contact = `\n<div ${MARKER} style="max-width:1200px;margin:12px auto;padding:12px 18px;border:1px solid #d8e4e1;border-radius:8px;background:#f8fbfa;font-size:12px;line-height:1.6;color:#33413e;">\n  <strong>Müşteri Hizmetleri:</strong> <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> · <a href="tel:+905419305372">+90 541 930 53 72</a> · Menderes Caddesi No:231/B Buca / İzmir\n</div>`;
      if (out.includes('</footer>')) out = out.replace('</footer>', `${contact}\n</footer>`);
      else if (out.includes('</body>')) out = out.replace('</body>', `${contact}\n</body>`);
    }

    if (file === 'index.html' && !out.includes('data-payment-network-readiness="v1"')) {
      const networks = `\n<div data-payment-network-readiness="v1" style="max-width:1200px;margin:14px auto;padding:14px 18px;border:1px solid #e2ded5;border-radius:8px;background:#fff;font-size:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">\n  <strong>Kartlı ödeme güvenliği</strong>\n  <span aria-label="Visa kabul edilir">VISA</span>\n  <span aria-label="Mastercard kabul edilir">Mastercard</span>\n  <span>3D Secure · Kart numarası/CVV Belgin sistemlerinde saklanmaz.</span>\n</div>`;
      if (out.includes('<footer')) out = out.replace('<footer', `${networks}\n<footer`);
    }

    return out;
  });
}

for (const file of ['js/app.js', 'js/cart.js', 'js/router.js']) {
  writeIfChanged(file, scrubPublicClaims);
}

writeIfChanged('functions/index.js', (content) => {
  let out = content.replace(/max_installment:\s*6/g, 'max_installment: 3');
  if (!out.includes('CALLBACK_AMOUNT_MISMATCH')) {
    const needle = "      const order = orderDoc.data();\n";
    const guard = `${needle}      if (String(total_amount) !== String(order.amountInKurus)) {\n        console.error('[PayTR Security] Callback amount mismatch:', merchant_oid, total_amount, order.amountInKurus);\n        await appendAuditEvent(orderRef, 'CALLBACK_AMOUNT_MISMATCH', { received: String(total_amount), expected: String(order.amountInKurus) });\n        return res.status(400).send('PAYTR notification failed: amount mismatch');\n      }\n`;
    if (!out.includes(needle)) throw new Error('functions/index.js callback order anchor bulunamadı.');
    out = out.replace(needle, guard);
  }
  return out;
});

writeIfChanged('tests/test-suite.js', (content) => content
  .replace(/belgin-legal-evidence-manifest-v2/g, 'belgin-legal-evidence-manifest-v3')
  .replace(/Hukuki belge manifest şeması v2/g, 'Hukuki belge manifest şeması v3'));

console.log('[bank-pos-hardening] Banka/PCI kamu beyanı, consent, taksit, iletişim, callback ve manifest uyumu uygulandı.');