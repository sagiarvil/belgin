const fs = require('fs');
let appCode = fs.readFileSync('js/app.js', 'utf8');

const startIdx = appCode.indexOf('  openProduct(id) {');
if (startIdx === -1) throw new Error('openProduct not found');

const endIdx = appCode.indexOf('  changePdpMainImage(src, thumbEl) {', startIdx);
if (endIdx === -1) throw new Error('changePdpMainImage not found');

const newOpenProduct = `  openProduct(id) {
    const p = findProduct(id);
    if (!p) return;

    const container = document.getElementById('productDetailView');
    if (!container) return;

    const isGoldProduct = (p.category === 'jewelry' || p.category === 'jewellery' || p.isGold);
    const isHighVal = (typeof isHighValueSecureDelivery === 'function' ? isHighValueSecureDelivery(p) : p.price >= 12000);
    const specs = p.specs || {};

    // Galleri görselleri (Varsa ek açılar, yoksa ana görsel)
    const galleryImages = (p.images && p.images.length > 0) ? p.images : [p.image];

    // Thumbnails HTML
    const thumbsHtml = galleryImages.map((img, idx) => \`
      <div class="pdp-thumb-item \${idx === 0 ? 'active' : ''}" onclick="App.changePdpMainImage('\${img}', this)">
        <img src="\${img}" alt="\${p.brand} \${p.name} - \${idx + 1}" loading="lazy">
      </div>
    \`).join('');

    // Fiyat & İndirim Rozeti
    const hasDiscount = p.oldPrice && p.oldPrice > p.price;
    const discountPercent = hasDiscount ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
    const monthlyInstallment = Math.round(p.price / 3);

    // Taksit Banner (Altın için tek çekim mevzuat uyarısı, saat için 3 taksit)
    const installmentBannerHtml = isGoldProduct ? \`
      <div class="pdp-installment-banner" style="background:#FFF9EE; border:1px solid #E6D2A8; color:#5D4411; padding:10px 14px; border-radius:6px; font-size:12.5px; margin-top:14px; line-height:1.5;">
        <span>🔒 <strong>BDDK Mevzuat Uyarısı:</strong> Külçe altın, ziynet ve sarrafiye ürünlerinde finansal mevzuat gereğince <strong>tek çekim</strong> uygulanır.</span>
      </div>
    \` : \`
      <div class="pdp-installment-banner" style="\${p.isPreOwned ? 'margin-top:14px;' : ''}">
        <span>💳 Vade farksız 3 taksit: <strong>3 x \${formatPrice(monthlyInstallment)}</strong></span>
        <span style="color:#888; font-weight:normal; font-size:12px;">(Tüm kartlara Mevzuata Uygun Taksit imkanı)</span>
      </div>
    \`;

    // 5'li Hızlı Özet Çipler (Altın vs Saat)
    const quickSpecsHtml = isGoldProduct ? \`
      <div class="pdp-quick-specs">
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🪙</span>
          <div>
            <span class="pdp-spec-pill-label">Maden Türü</span>
            <span class="pdp-spec-pill-val">Kıymetli Altın</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">⚖️</span>
          <div>
            <span class="pdp-spec-pill-label">Ayar & Saflık</span>
            <span class="pdp-spec-pill-val">\${p.metal || '24 Ayar (995/1000)'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🏛️</span>
          <div>
            <span class="pdp-spec-pill-label">Baskı / Menşei</span>
            <span class="pdp-spec-pill-val">T.C. Darphane / Rafineri</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🔒</span>
          <div>
            <span class="pdp-spec-pill-label">Güvenlik Mührü</span>
            <span class="pdp-spec-pill-val">\${p.hallmark || 'Hologramlı & Mühürlü'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">📜</span>
          <div>
            <span class="pdp-spec-pill-label">Belge & Garanti</span>
            <span class="pdp-spec-pill-val">%100 Ayar Garantili</span>
          </div>
        </div>
      </div>
    \` : \`
      <div class="pdp-quick-specs">
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">⚙️</span>
          <div>
            <span class="pdp-spec-pill-label">Mekanizma</span>
            <span class="pdp-spec-pill-val">\${specs['Mekanizma'] || 'Quartz / Analog'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">📐</span>
          <div>
            <span class="pdp-spec-pill-label">Kasa Çapı</span>
            <span class="pdp-spec-pill-val">\${specs['Kasa Çapı'] || '42 mm'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🛡️</span>
          <div>
            <span class="pdp-spec-pill-label">Cam Tipi</span>
            <span class="pdp-spec-pill-val">\${specs['Cam Tipi'] || 'Safir / Mineral'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">💧</span>
          <div>
            <span class="pdp-spec-pill-label">Su Geçirmezlik</span>
            <span class="pdp-spec-pill-val">\${specs['Su Geçirmezlik'] || '5 ATM (50 M)'}</span>
          </div>
        </div>
        <div class="pdp-spec-pill">
          <span class="pdp-spec-pill-icon">🎨</span>
          <div>
            <span class="pdp-spec-pill-label">Kordon</span>
            <span class="pdp-spec-pill-val">\${specs['Kordon / Kayış'] || 'Paslanmaz Çelik'}</span>
          </div>
        </div>
      </div>
    \`;

    // 4'lü Kurumsal Güvence Kutusu (Altın vs Saat)
    const trustBoxHtml = isGoldProduct ? \`
      <div class="pdp-trust-box">
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">🪙</span>
          <div class="pdp-trust-item-text">
            <strong>%100 Darphane & Saflık Garantisi</strong>
            <span>Resmi ayar ve milyem standartlarında tescilli ve mühürlü.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">🏛️</span>
          <div class="pdp-trust-item-text">
            <strong>Buca Showroom'dan Teslimat</strong>
            <span>12.000 TL üzeri yasal kimlik ve imza ile mağazadan güvenli teslim.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">💳</span>
          <div class="pdp-trust-item-text">
            <strong>BDDK Lisanslı 3D Secure</strong>
            <span>PayTR 256-bit SSL korumalı banka altyapısı & tek çekim.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">⚖️</span>
          <div class="pdp-trust-item-text">
            <strong>Anında Nakit Alım & Değerleme</strong>
            <span>Kapalıçarşı anlık serbest piyasa kurundan nakde çevirme güvencesi.</span>
          </div>
        </div>
      </div>
    \` : \`
      <div class="pdp-trust-box">
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">🛡️</span>
          <div class="pdp-trust-item-text">
            <strong>2 Yıl Distribütör Garantisi</strong>
            <span>Orijinal kutusu, garanti belgesi ve faturalı teslimat.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">🏛️</span>
          <div class="pdp-trust-item-text">
            <strong>Buca Showroom'dan Teslimat</strong>
            <span>12.000 TL üzeri yasal kimlik ve imza ile mağazadan güvenli teslim.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">💳</span>
          <div class="pdp-trust-item-text">
            <strong>BDDK Lisanslı 3D Secure</strong>
            <span>PayTR 256-bit SSL korumalı banka altyapısı.</span>
          </div>
        </div>
        <div class="pdp-trust-item">
          <span class="pdp-trust-item-icon">⚖️</span>
          <div class="pdp-trust-item-text">
            <strong>Ekspertiz & Takas Güvencesi</strong>
            <span>Sertifikalı & 12 Nokta Ekspertiz Güvencesi</span>
          </div>
        </div>
      </div>
    \`;

    // Sekme 1: Ürün Detayları
    const detailsTabHtml = isGoldProduct ? \`
      <div id="tab-details" class="pdp-tab-pane active" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14.5px;">
          <h2 style="font-size:20px; font-weight:700; color:var(--color-ink); margin-bottom:16px;">
            \${p.brand} \${p.name} Ürün Bilgisi ve Saflık Detayları
          </h2>
          <p style="margin-bottom:16px;">
            \${p.description || p.desc}
          </p>
          <div style="background:#FBF9F5; border-left:4px solid var(--color-teal); padding:16px 20px; margin:20px 0; border-radius:0 6px 6px 0;">
            <strong style="color:var(--color-teal); display:block; margin-bottom:4px; font-size:14px;">Belgin Kuyumculuk Altın ve Ayar Taahhüdü:</strong>
            Sitemizde ve Buca showroomumuzda satışa sunulan tüm altın, külçe, ziynet ve sarrafiye ürünleri T.C. Darphane ve resmi rafinerilerin standartlarında, %100 safiyet ve ayar garantisiyle faturalı ve mühürlü olarak teslim edilir.
          </div>
          <h3 style="font-size:16px; font-weight:700; color:var(--color-ink); margin:24px 0 10px;">Teslimat & Ambalaj İçeriği:</h3>
          <ul style="padding-left:20px; margin-bottom:16px; display:flex; flex-direction:column; gap:6px;">
            <li>Orijinal Hologramlı Güvenlik Ambalajı / Külçe Blister Paketi</li>
            <li>Belgin Kuyumculuk Resmi Satış Faturası ve Ayar Sertifikası</li>
            <li>T.C. Darphane / Rafineri Resmi Orijinallik Mührü</li>
            <li>Kapalıçarşı Anlık Serbest Piyasa Geri Alım Güvencesi</li>
          </ul>
        </div>
      </div>
    \` : \`
      <div id="tab-details" class="pdp-tab-pane active" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14.5px;">
          <h2 style="font-size:20px; font-weight:700; color:var(--color-ink); margin-bottom:16px;">
            \${p.brand} \${p.name} Ürün Bilgisi ve Tasarım Detayları
          </h2>
          <p style="margin-bottom:16px;">
            \${p.description || p.desc}
          </p>
          <div style="background:#FBF9F5; border-left:4px solid var(--color-teal); padding:16px 20px; margin:20px 0; border-radius:0 6px 6px 0;">
            <strong style="color:var(--color-teal); display:block; margin-bottom:4px; font-size:14px;">Belgin Kuyumculuk Ürün ve Belge Taahhüdü:</strong>
            Sitemizde ve Buca showroomumuzda yer alan tüm <strong>\${p.brand}</strong> saat modelleri %100 orijinal, ürüne ait fatura ve garanti belgesindeki kapsamla satılır. Siparişiniz seri numarası kayıtlı garanti belgesi, orijinal kutusu ve kaşeli sertifikasıyla eksiksiz teslim edilmektedir.
          </div>
          <h3 style="font-size:16px; font-weight:700; color:var(--color-ink); margin:24px 0 10px;">Kutu İçeriği:</h3>
          <ul style="padding-left:20px; margin-bottom:16px; display:flex; flex-direction:column; gap:6px;">
            <li>Orijinal \${p.brand} Lüks Saat Kutusu ve Koruma Ambalajı</li>
            <li>Ürüne ait garanti belgesi ve satış faturası</li>
            <li>Türkçe Kullanım Kılavuzu ve Mekanizma Bakım Kartı</li>
            <li>Belgin Kuyumculuk Satış Faturası ve Yetkili Belgesi</li>
          </ul>
        </div>
      </div>
    \`;

    // Sekme 2: Teknik Özellikler Tablosu
    const specsTabHtml = isGoldProduct ? \`
      <div id="tab-specs" class="pdp-tab-pane" role="tabpanel">
        <div class="pdp-specs-category-grid">
          
          <!-- 1. Maden & Saflık -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🪙 Maden & Saflık</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Maden Türü</span><span class="pdp-spec-value">Kıymetli Altın</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ayar / Saflık</span><span class="pdp-spec-value">\${p.metal || '24 Ayar (995/1000)'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kategori</span><span class="pdp-spec-value">\${p.subCategory || 'Külçe & Sarrafiye'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Durum</span><span class="pdp-spec-value">Sıfır / Darphane & Mühürlü</span></div>
            </div>
          </div>

          <!-- 2. Sertifika & Güvenlik -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🔒 Sertifika & Güvenlik</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ürün Kodu</span><span class="pdp-spec-value">\${p.ref || p.reference}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ambalaj Tipi</span><span class="pdp-spec-value">Hologramlı Güvenlik Ambalajı</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Damga / Mühür</span><span class="pdp-spec-value">\${p.hallmark || 'T.C. Darphane Mühürlü'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Fatura</span><span class="pdp-spec-value">Resmi E-Fatura & Ayar Kaydı</span></div>
            </div>
          </div>

          <!-- 3. Teslimat & Alım Garantisi -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🏛️ Teslimat & Değerleme</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Teslimat Kuralı</span><span class="pdp-spec-value">12.000 TL+ Showroom Güvenli Teslim</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Geri Alım</span><span class="pdp-spec-value">Anlık Kapalıçarşı Kuruyla Nakit Alım</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ödeme Şekli</span><span class="pdp-spec-value">BDDK Uyumlu Tek Çekim / 3D Secure</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Menşei</span><span class="pdp-spec-value">Türkiye (T.C. Darphane Tescilli)</span></div>
            </div>
          </div>

        </div>
      </div>
    \` : \`
      <div id="tab-specs" class="pdp-tab-pane" role="tabpanel">
        <div class="pdp-specs-category-grid">
          
          <!-- 1. Ürün Bilgisi -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🏷️ Ürün Bilgisi</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Marka</span><span class="pdp-spec-value">\${p.brand}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Model / Ref</span><span class="pdp-spec-value">\${p.ref || p.reference}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Cinsiyet</span><span class="pdp-spec-value">\${specs['Cinsiyet'] || 'Erkek / Kadın'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Çalışma Tipi</span><span class="pdp-spec-value">\${specs['Mekanizma'] || 'Quartz Analog'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Menşei</span><span class="pdp-spec-value">\${p.origin || specs['Menşei'] || 'İsviçre / Japonya'}</span></div>
            </div>
          </div>

          <!-- 2. Kasa Detayları -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">📐 Kasa Detayları</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Çapı</span><span class="pdp-spec-value">\${specs['Kasa Çapı'] || '42 mm'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Materyali</span><span class="pdp-spec-value">\${specs['Kasa Materyali'] || p.metal || '316L Çelik'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Rengi</span><span class="pdp-spec-value">\${specs['Kasa Rengi'] || 'Metalik Çelik / Altın'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kasa Şekli</span><span class="pdp-spec-value">Yuvarlak / Geometrik</span></div>
            </div>
          </div>

          <!-- 3. Kadran & Cam -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🛡️ Kadran & Cam</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Cam Özelliği</span><span class="pdp-spec-value">\${specs['Cam Tipi'] || 'Safir / Mineral'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kadran Rengi</span><span class="pdp-spec-value">\${specs['Kadran Rengi'] || 'Antrasit / Siyah'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kadran Tipi</span><span class="pdp-spec-value">Analog / İndeksli</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Aydınlatma</span><span class="pdp-spec-value">LumiBrite / Fosforlu Kollar</span></div>
            </div>
          </div>

          <!-- 4. Kordon / Kayış -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">🎨 Kordon / Kayış</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kordon Tipi</span><span class="pdp-spec-value">\${specs['Kordon / Kayış'] || 'Paslanmaz Çelik'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kordon Rengi</span><span class="pdp-spec-value">Metalik / Deri Tonu</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Klips</span><span class="pdp-spec-value">Kelebek / Emniyetli Toka</span></div>
            </div>
          </div>

          <!-- 5. Fonksiyonlar -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">⚡ Fonksiyonlar</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Su Geçirmezlik</span><span class="pdp-spec-value">\${specs['Su Geçirmezlik'] || '5 ATM (50 Metre)'}</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Takvim</span><span class="pdp-spec-value">Gün / Tarih Göstergesi</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Kronometre</span><span class="pdp-spec-value">Mevcut / Hassas Sayaç</span></div>
            </div>
          </div>

          <!-- 6. Garanti & Güvenlik -->
          <div class="pdp-spec-cat-card">
            <div class="pdp-spec-cat-title">📜 Garanti & Teslimat</div>
            <div class="pdp-spec-rows">
              <div class="pdp-spec-row"><span class="pdp-spec-key">Garanti Süresi</span><span class="pdp-spec-value">2 Yıl Distribütör Garantili</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Teslimat Kuralı</span><span class="pdp-spec-value">12.000 TL+ Mağazadan Teslim</span></div>
              <div class="pdp-spec-row"><span class="pdp-spec-key">Ekspertiz Kaydı</span><span class="pdp-spec-value">Sertifikalı & Ekspertiz Onaylı</span></div>
            </div>
          </div>

        </div>
      </div>
    \`;

    // Sekme 3: Taksit / Ödeme Seçenekleri
    const installmentsTabHtml = isGoldProduct ? \`
      <div id="tab-installments" class="pdp-tab-pane" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:24px; line-height:1.7;">
          <strong style="display:block; margin-bottom:8px; font-size:16px; color:var(--color-ink);">⚖️ BDDK Finansal Mevzuatı ve Taksit Kısıtlaması</strong>
          <p style="font-size:14px; color:#444; margin-bottom:12px;">
            Bankacılık Düzenleme ve Denetleme Kurumu (BDDK) ile Ticaret Bakanlığı Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca; <strong>külçe altın, gram altın, ziynet, ata altın ve sarrafiye ürünlerinde kredi kartına taksit uygulanmamaktadır</strong>.
          </p>
          <div style="background:#FBF9F5; border:1px solid rgba(194,167,104,0.35); padding:14px 18px; border-radius:6px; font-size:13px; color:#5D4411;">
            💡 <strong>Geçerli Ödeme Yöntemleri:</strong> Tüm kredi kartları veya banka kartlarıyla PayTR 3D Secure tek çekim veya güvenli banka havalesi ile siparişinizi tamamlayabilirsiniz.
          </div>
        </div>
      </div>
    \` : \`
      <div id="tab-installments" class="pdp-tab-pane" role="tabpanel">
        <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:24px; line-height:1.7;">
          <strong style="display:block; margin-bottom:8px;">Kart ve banka koşullarına göre taksit</strong>
          <p style="font-size:13.5px; color:var(--color-muted); margin:0;">Taksit seçenekleri ödeme adımında, kartın bankası ve işlem tarihinde yürürlükte bulunan mevzuat sınırlarına göre gösterilir. Sitede mevzuatın üzerinde sabit taksit taahhüdü verilmez.</p>
        </div>
      </div>
    \`;

    // İlgili Ürünler
    const allProds = typeof getAllProducts === 'function' ? getAllProducts() : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
    const relatedProducts = allProds.filter(x => x.id !== p.id && (x.brand === p.brand || x.category === p.category)).slice(0, 4);

    const breadcrumbCategory = isGoldProduct ? 'Mücevherat & Altın' : 'Lüks Saatler';
    const breadcrumbPage = isGoldProduct ? 'mucevherat' : 'saatler';

    container.innerHTML = \`
      <div class="pdp-page-container">
        
        <!-- 1. Breadcrumbs -->
        <nav class="pdp-breadcrumbs" aria-label="Breadcrumb">
          <a href="#" data-page="ana-sayfa">Ana Sayfa</a>
          <span class="pdp-separator">/</span>
          <a href="#" data-page="\${breadcrumbPage}">\${breadcrumbCategory}</a>
          <span class="pdp-separator">/</span>
          <a href="#" onclick="App.filterWatchesByBrand('\${p.brand}', null)">\${p.brand}</a>
          <span class="pdp-separator">/</span>
          <span class="pdp-current">\${p.name}</span>
        </nav>

        <!-- 2. Master Hero Grid (Left: Gallery, Right: Buy Box) -->
        <div class="pdp-hero-grid">
          
          <!-- SOL: Gelişmiş Galeri ve 10x Optik Makro Büyüteç -->
          <div class="pdp-gallery-wrap">
            <div class="pdp-thumbs-list">
              \${thumbsHtml}
            </div>
            
            <div class="pdp-main-photo-box" onmousemove="App.handleZoom(event, this)" onmouseleave="App.resetZoom(this)">
              \${isHighVal ? \`
                <div class="pdp-badge-top-left">
                  <span class="pdp-badge-item pdp-badge-secure">🏛️ 12.000 TL+ MAĞAZA TESLİMİ</span>
                </div>
              \` : ''}
              <img src="\${p.image}" alt="\${p.brand} \${p.name}" id="pdpMainImageTarget">
              <div class="pdp-loupe-hint">🔍 10x Optik İnceleme İçin Üzerine Gelin</div>
            </div>
          </div>

          <!-- SAĞ: Satın Alma & Özellikler Paneli (Buy Box) -->
          <div class="pdp-buy-box">
            <a href="#" onclick="App.filterWatchesByBrand('\${p.brand}', null)" class="pdp-brand-title">\${p.brand}</a>
            <h1 class="pdp-product-title">\${p.name}</h1>
            
            <div class="pdp-meta-row">
              <span>Ürün Kodu: <strong class="pdp-meta-sku">\${p.ref || p.reference}</strong></span>
              <span>•</span>
              <span class="pdp-meta-stock">● Stokta Var (Hemen Teslim)</span>
              <span>•</span>
              <span>Kategori: <strong>\${p.subCategory || (isGoldProduct ? 'Altın & Mücevherat' : 'Lüks Saat')}</strong></span>
            </div>

            <!-- Fiyat Kutusu -->
            <div class="pdp-price-wrap \${p.isPreOwned ? 'pdp-dual-price-wrap' : ''}">
              \${p.isPreOwned ? \`
                <div class="pdp-dual-pricing-panel">
                  <div class="pdp-dual-row pdp-sale-highlight">
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                      <span class="pdp-price-badge-pill">SATIŞ FİYATI</span>
                      <span class="pdp-current-price">\${formatPrice(p.price)}</span>
                      <span class="pdp-vat-badge">KDV Dahil</span>
                    </div>
                  </div>
                  <div class="pdp-dual-row pdp-buy-highlight">
                    <div class="pdp-buyback-box">
                      <span class="pdp-buyback-title">Alış Fiyatı:</span>
                      <span class="pdp-buyback-price">\${formatPrice(p.buyPrice || (p.price - 5000))}</span>
                    </div>
                  </div>
                </div>
              \` : \`
                <div class="pdp-price-header">
                  \${hasDiscount ? \`<span class="pdp-old-price">\${formatPrice(p.oldPrice)}</span>\` : ''}
                  <span class="pdp-current-price">\${formatPrice(p.price)}</span>
                  \${hasDiscount ? \`<span class="pdp-discount-badge">-%\${discountPercent} İNDİRİM</span>\` : ''}
                </div>
              \`}
              \${installmentBannerHtml}
            </div>

            <!-- Hızlı Özet Teknik Çipler -->
            \${quickSpecsHtml}

            <!-- Aksiyon Butonları -->
            <div class="pdp-actions-row">
              <button class="pdp-btn-cart" onclick="Cart.add(\${p.id}); App.updateHeaderCartCount(); Router.navigate('sepet');">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span>Sepete Ekle</span>
              </button>
              <button class="pdp-btn-fast" onclick="Cart.add(\${p.id}); App.updateHeaderCartCount(); Router.navigate('odeme');">
                <span>Hemen Satın Al</span>
              </button>
              <a class="pdp-btn-whatsapp" href="https://wa.me/905419305372?text=Merhaba,%20\${encodeURIComponent(p.brand + ' ' + p.name)}%20(\${p.ref || p.reference})%20modeli%20hakkinda%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener" aria-label="WhatsApp Satış Danışmanı">
                <span>💬</span>
              </a>
            </div>

            <!-- 4'lü Kurumsal Güvence Kutusu -->
            \${trustBoxHtml}

          </div>
        </div>

        <!-- 3. Alt Sekmeler (Detaylar, Teknik Özellikler, Taksit, Teslimat) -->
        <div class="pdp-tabs-container">
          <div class="pdp-tabs-nav" role="tablist">
            <button class="pdp-tab-btn active" onclick="App.switchPdpTab('tab-details', this)" role="tab">
              <span>📋 Ürün Detayları</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-specs', this)" role="tab">
              <span>⚙️ Teknik Özellikler Tablosu</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-installments', this)" role="tab">
              <span>💳 Ödeme & Mevzuat</span>
            </button>
            <button class="pdp-tab-btn" onclick="App.switchPdpTab('tab-delivery', this)" role="tab">
              <span>🚚 Teslimat, Güvenlik & İade Koşulları</span>
            </button>
          </div>

          <!-- SEKME 1: Ürün Detayları -->
          \${detailsTabHtml}

          <!-- SEKME 2: Teknik Özellikler Tablosu -->
          \${specsTabHtml}

          <!-- SEKME 3: Taksit / Ödeme Seçenekleri -->
          \${installmentsTabHtml}

          <!-- SEKME 4: Teslimat, Güvenlik & İade Koşulları -->
          <div id="tab-delivery" class="pdp-tab-pane" role="tabpanel">
            <div style="background:#FFFFFF; border:1px solid var(--color-border); border-radius:8px; padding:28px 32px; line-height:1.8; color:#444; font-size:14px;">
              <h3 style="font-size:18px; font-weight:700; color:var(--color-ink); margin-bottom:14px;">
                🏛️ Yüksek Değerli Ürün Teslimat Protokolü (03)
              </h3>
              <p style="margin-bottom:12px;">
                <strong>12.000 TL üzerindeki tüm altın ve lüks saat ürünleri</strong>, güvenlik protokolleri gereğince yalnızca İzmir Buca'daki merkez showroomumuzdan (Menderes Cad. No:231/B Buca / İzmir) bizzat teslim edilmektedir.
              </p>
              <ul style="padding-left:20px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">
                <li>Teslimat sırasında alıcı kimlik fotokopisi ve ıslak imzalı teslim tutanağı zorunludur.</li>
                <li>Üçüncü şahıslara ve vekaletsiz teslimat yapılmamaktadır.</li>
                <li>Tüm ürünler mühürlü ambalajında ve resmi faturasıyla teslim edilir.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    \`;

    Router.navigate('urun', false);
    if (history.pushState) {
      history.pushState(null, '', '#urun-' + p.id);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 30);
  },
`;

appCode = appCode.slice(0, startIdx) + newOpenProduct + appCode.slice(endIdx);
fs.writeFileSync('js/app.js', appCode, 'utf8');
console.log('Successfully updated openProduct in js/app.js');
