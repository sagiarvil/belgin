// ==========================================================
// BELGIN KUYUMCULUK — KUYUMCU VE SAAT EKSPERTİZ SİMÜLATÖRÜ
// GERÇEK KAPALIÇARŞI CANLI BORSA HESAPLAMA MOTORU
// ==========================================================

const ValuationEngine = {
  // Ziynet & Sarrafiye Sabit Gramajları
  COIN_WEIGHTS: {
    ceyrek: { name: "Çeyrek Altın", weight: 1.754, karat: 0.916 },
    yarim: { name: "Yarım Altın", weight: 3.508, karat: 0.916 },
    tam: { name: "Tam / Ziynet Altın", weight: 7.016, karat: 0.916 },
    ata: { name: "Ata / Cumhuriyet Altını", weight: 7.216, karat: 0.916 },
    gremse: { name: "Gremse Altın (10'luk)", weight: 17.540, karat: 0.916 }
  },

  // Altın Ayar Katsayıları (Milyem)
  PURITY_MAP: {
    "24k": { label: "24 Ayar Külçe / Has Altın (%99.5)", factor: 0.995 },
    "22k": { label: "22 Ayar Burma / Ajda Bilezik (%91.6)", factor: 0.916 },
    "18k": { label: "18 Ayar Mücevher / Takı Altını (%75.0)", factor: 0.750 },
    "14k": { label: "14 Ayar Takı Altını (%58.5)", factor: 0.585 },
    "8k": { label: "8 Ayar Takı Altını (%33.3)", factor: 0.333 }
  },

  // Saat Modelleri ve Piyasa Taban Fiyatları (TRY)
  WATCH_CATALOG: {
    rolex: {
      name: "Rolex",
      models: {
        "submariner": { name: "Submariner Date (116610 / 126610)", baseSteel: 450000, baseRolesor: 620000, baseGold: 1450000 },
        "daytona": { name: "Cosmograph Daytona (116500 / 126500)", baseSteel: 980000, baseRolesor: 1150000, baseGold: 2100000 },
        "gmt": { name: "GMT-Master II 'Pepsi/Batman' (126710)", baseSteel: 580000, baseRolesor: 740000, baseGold: 1650000 },
        "datejust41": { name: "Datejust 41 (126334 / 126300)", baseSteel: 380000, baseRolesor: 490000, baseGold: 1200000 },
        "skydweller": { name: "Sky-Dweller (326934 / 336935)", baseSteel: 720000, baseRolesor: 890000, baseGold: 1950000 },
        "daydate": { name: "Day-Date 40 President (228238 / 228235)", baseSteel: 0, baseRolesor: 0, baseGold: 1850000 }
      }
    },
    patek: {
      name: "Patek Philippe",
      models: {
        "nautilus": { name: "Nautilus 5711 / 5712", baseSteel: 2400000, baseRolesor: 2700000, baseGold: 3800000 },
        "aquanaut": { name: "Aquanaut 5167A / 5168G", baseSteel: 1650000, baseRolesor: 1900000, baseGold: 2600000 },
        "calatrava": { name: "Calatrava 5227 / 5196", baseSteel: 850000, baseRolesor: 950000, baseGold: 1350000 }
      }
    },
    ap: {
      name: "Audemars Piguet",
      models: {
        "royaloak": { name: "Royal Oak 15500ST / 15510ST", baseSteel: 1450000, baseRolesor: 1750000, baseGold: 2650000 },
        "chronograph": { name: "Royal Oak Chronograph 26331ST", baseSteel: 1750000, baseRolesor: 2100000, baseGold: 3100000 },
        "offshore": { name: "Royal Oak Offshore 42mm / 44mm", baseSteel: 980000, baseRolesor: 1200000, baseGold: 1950000 }
      }
    },
    cartier: {
      name: "Cartier",
      models: {
        "santos": { name: "Santos de Cartier Büyük / Orta Boy", baseSteel: 260000, baseRolesor: 360000, baseGold: 850000 },
        "tank": { name: "Tank Must / Tank Française", baseSteel: 140000, baseRolesor: 220000, baseGold: 480000 },
        "ballon": { name: "Ballon Bleu de Cartier 36mm / 42mm", baseSteel: 190000, baseRolesor: 290000, baseGold: 680000 }
      }
    }
  },

  // Simülatör Arayüzünü Güncelle (Altın vs Saat Tab Seçimi)
  renderSimulator() {
    const container = document.getElementById('valuationSimulatorBox');
    if (!container) return;

    const mode = this.currentMode || 'watch';

    if (mode === 'gold') {
      const hasGramPrice = (typeof LIVE_MARKET_DATA !== 'undefined' && LIVE_MARKET_DATA.gramGold24k ? LIVE_MARKET_DATA.gramGold24k : 7111);
      
      container.innerHTML = `
        <div class="val-tab-bar" style="display:none;">
          <button class="btn-val-tab active" onclick="ValuationEngine.switchMode('gold')">
            <span>🪙</span>
            <span>Masif Altın & Ziynet Değerleme</span>
          </button>
          <button class="btn-val-tab" onclick="ValuationEngine.switchMode('watch')">
            <span>⌚</span>
            <span>Lüks Saat Ekspertiz & Değerleme</span>
          </button>
        </div>

        <div class="val-calc-body">
          <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:16px; margin-bottom:20px;">
            
            <!-- 1. Altın Kategorisi & Ayar -->
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Altın Türü & Ayarı</label>
              <select id="goldPuritySelect" onchange="ValuationEngine.onPurityChange()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:13.5px; font-weight:600; background:#fff; color:var(--color-ink);">
                <optgroup label="Masif & Hurda Altın">
                  <option value="24k">24 Ayar Külçe / Has Altın (%99.5)</option>
                  <option value="22k" selected>22 Ayar Burma / Ajda Bilezik (%91.6)</option>
                  <option value="18k">18 Ayar Mücevher Altını (%75.0)</option>
                  <option value="14k">14 Ayar Takı Altını (%58.5)</option>
                  <option value="8k">8 Ayar Takı Altını (%33.3)</option>
                </optgroup>
                <optgroup label="Sarrafiye / Darphane Altınları">
                  <option value="ceyrek">Çeyrek Altın (1.75 gr • 22K)</option>
                  <option value="yarim">Yarım Altın (3.50 gr • 22K)</option>
                  <option value="tam">Tam / Ziynet Altın (7.00 gr • 22K)</option>
                  <option value="ata">Ata / Cumhuriyet Altını (7.21 gr • 22K)</option>
                  <option value="gremse">Gremse Altın (17.54 gr • 22K)</option>
                </optgroup>
              </select>
            </div>

            <!-- 2. Gram Ağırlığı veya Adet -->
            <div>
              <label id="goldAmountLabel" style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Net Ağırlık (Gram)</label>
              <input type="number" id="goldWeightInput" value="25.00" step="0.5" min="0.5" oninput="ValuationEngine.calculateGold()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:14px; font-weight:700; background:#fff; color:var(--color-teal);">
            </div>

            <!-- 3. Taş & Fire Durumu -->
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Taş / Fire Düşümü</label>
              <select id="goldStoneLoss" onchange="ValuationEngine.calculateGold()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:13.5px; font-weight:600; background:#fff; color:var(--color-ink);">
                <option value="0">Taşsız / Masif (%0 Fire)</option>
                <option value="0.02">Hafif Taşlı (%2 Taş Düşümü)</option>
                <option value="0.05">Yoğun Taşlı / Zirkon (%5 Taş Düşümü)</option>
              </select>
            </div>
          </div>

          <!-- Hızlı Gram Butonları -->
          <div id="quickGramsBar" style="display:flex; align-items:center; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
            <span style="font-size:11.5px; font-weight:700; color:var(--color-gold-dark);">Hızlı Seçim:</span>
            <button onclick="ValuationEngine.setWeight(5)" class="btn-quick-gram">5 gr</button>
            <button onclick="ValuationEngine.setWeight(10)" class="btn-quick-gram">10 gr</button>
            <button onclick="ValuationEngine.setWeight(20)" class="btn-quick-gram">20 gr</button>
            <button onclick="ValuationEngine.setWeight(50)" class="btn-quick-gram">50 gr</button>
            <button onclick="ValuationEngine.setWeight(100)" class="btn-quick-gram">100 gr</button>
            <button onclick="ValuationEngine.setWeight(250)" class="btn-quick-gram">250 gr</button>
          </div>

          <!-- Hesaplama Sonuç Kartı -->
          <div id="goldResultCard"></div>
        </div>
      `;

      this.calculateGold();
    } else {
      // Saat Modu
      container.innerHTML = `
        <div class="val-tab-bar" style="display:none;">
          <button class="btn-val-tab" onclick="ValuationEngine.switchMode('gold')">
            <span>🪙</span>
            <span>Masif Altın & Ziynet Değerleme</span>
          </button>
          <button class="btn-val-tab active" onclick="ValuationEngine.switchMode('watch')">
            <span>⌚</span>
            <span>Lüks Saat Ekspertiz & Değerleme</span>
          </button>
        </div>

        <div class="val-calc-body">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Saat Markası</label>
              <select id="watchBrandSelect" onchange="ValuationEngine.onWatchBrandChange()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:13.5px; font-weight:600; background:#fff; color:var(--color-ink);">
                <option value="rolex">Rolex</option>
                <option value="patek">Patek Philippe</option>
                <option value="ap">Audemars Piguet</option>
                <option value="cartier">Cartier</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Model / Seri</label>
              <select id="watchModelSelect" onchange="ValuationEngine.calculateWatch()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:13.5px; font-weight:600; background:#fff; color:var(--color-ink);"></select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:20px;">
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Kasa Materyali</label>
              <select id="watchMetalSelect" onchange="ValuationEngine.calculateWatch()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:13px; font-weight:600; background:#fff; color:var(--color-ink);">
                <option value="steel">Paslanmaz Çelik</option>
                <option value="rolesor">Çelik-Altın (Rolesor)</option>
                <option value="gold">18K Masif Altın (Sarı/Rose/Beyaz)</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Kutu & Belge Durumu</label>
              <select id="watchBoxSelect" onchange="ValuationEngine.calculateWatch()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:13px; font-weight:600; background:#fff; color:var(--color-ink);">
                <option value="full">Tam Set (Kutu + Garanti Kartı)</option>
                <option value="papers">Sadece Garanti Kartı Var</option>
                <option value="watch">Sadece Saat (Belgesiz)</option>
              </select>
            </div>
            <div>
              <label style="font-size:12px; font-weight:700; color:var(--color-teal); display:block; margin-bottom:6px;">Kondisyon</label>
              <select id="watchCondSelect" onchange="ValuationEngine.calculateWatch()" style="width:100%; padding:11px 14px; border:1px solid rgba(194,167,104,0.4); border-radius:8px; font-size:13px; font-weight:600; background:#fff; color:var(--color-ink);">
                <option value="mint">Sıfır Ayarında / Koleksiyonluk</option>
                <option value="good">Çok Temiz / Orijinal Polisajsız</option>
                <option value="used">Kullanılmış / Polisaj Gerekli</option>
              </select>
            </div>
          </div>

          <!-- Saat Sonuç Kartı -->
          <div id="watchResultCard"></div>
        </div>
      `;

      this.onWatchBrandChange();
    }
  },

  switchMode(mode) {
    this.currentMode = mode;
    this.renderSimulator();
  },

  setWeight(gr) {
    const input = document.getElementById('goldWeightInput');
    if (input) {
      input.value = gr;
      this.calculateGold();
    }
  },

  onPurityChange() {
    const sel = document.getElementById('goldPuritySelect')?.value || '22k';
    const label = document.getElementById('goldAmountLabel');
    const input = document.getElementById('goldWeightInput');
    const quickBar = document.getElementById('quickGramsBar');

    if (this.COIN_WEIGHTS[sel]) {
      // Sarrafiye
      if (label) label.textContent = "Adet Sayısı";
      if (input) input.value = 1;
      if (quickBar) quickBar.style.display = 'none';
    } else {
      // Gramajlı
      if (label) label.textContent = "Net Ağırlık (Gram)";
      if (quickBar) quickBar.style.display = 'flex';
    }
    this.calculateGold();
  },

  // Gerçek Canlı Altın Hesaplama Motoru (İZKO Resmi Borsa Fiyatlarıyla)
  calculateGold() {
    const sel = document.getElementById('goldPuritySelect')?.value || '22k';
    const rawVal = parseFloat(document.getElementById('goldWeightInput')?.value) || 0;
    const stoneLoss = parseFloat(document.getElementById('goldStoneLoss')?.value) || 0;

    const data = typeof LIVE_MARKET_DATA !== 'undefined' ? LIVE_MARKET_DATA : { gramGold24k: 7083, gramGold22k: 6660, gramGold18k: 6380, gramGold14k: 5920, gramGold8k: 3430, quarterGold: 11700, ataGold: 47150, halfGold: 23420, fullGold: 46540 };

    let unitPrice = data.gramGold22k;
    let title = "";
    let isCoin = false;

    switch (sel) {
      case '24k':
        unitPrice = data.gramGold24k;
        title = `${rawVal} Gram 24 Ayar Has / Külçe Altın`;
        break;
      case '22k':
        unitPrice = data.gramGold22k;
        title = `${rawVal} Gram 22 Ayar Burma / Ajda Bilezik`;
        break;
      case '18k':
        unitPrice = data.gramGold18k || Math.round(data.gramGold24k * 0.750);
        title = `${rawVal} Gram 18 Ayar Mücevher Altını`;
        break;
      case '14k':
        unitPrice = data.gramGold14k || Math.round(data.gramGold24k * 0.585);
        title = `${rawVal} Gram 14 Ayar Takı Altını`;
        break;
      case '8k':
        unitPrice = data.gramGold8k || Math.round(data.gramGold24k * 0.333);
        title = `${rawVal} Gram 8 Ayar Takı Altını`;
        break;
      case 'ceyrek':
        unitPrice = data.quarterGold;
        title = `${rawVal} Adet Yeni Çeyrek Altın`;
        isCoin = true;
        break;
      case 'yarim':
        unitPrice = data.halfGold || data.quarterGold * 2;
        title = `${rawVal} Adet Yeni Yarım Altın`;
        isCoin = true;
        break;
      case 'tam':
        unitPrice = data.fullGold || data.quarterGold * 4;
        title = `${rawVal} Adet Yeni Tam / Ziynet Altın`;
        isCoin = true;
        break;
      case 'ata':
        unitPrice = data.ataGold || 47150;
        title = `${rawVal} Adet Ata / Cumhuriyet Altını`;
        isCoin = true;
        break;
      case 'gremse':
        unitPrice = (data.quarterGold * 10) || 117000;
        title = `${rawVal} Adet Gremse Altın (10'luk)`;
        isCoin = true;
        break;
    }

    let totalCashOffer = 0;
    if (isCoin) {
      totalCashOffer = Math.round(rawVal * unitPrice);
    } else {
      const effectiveGrams = rawVal * (1 - stoneLoss);
      totalCashOffer = Math.round(effectiveGrams * unitPrice);
    }

    const resCard = document.getElementById('goldResultCard');
    if (resCard) {
      resCard.innerHTML = `
        <div class="val-result-card-luxury">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(194, 167, 104, 0.3); padding-bottom:14px; margin-bottom:16px; flex-wrap:wrap; gap:10px; position:relative; z-index:2;">
            <div>
              <span style="font-size:11px; letter-spacing:1.5px; text-transform:uppercase; font-weight:800; color:var(--color-gold); display:block; margin-bottom:2px;">✦ Canlı Kapalıçarşı & İZKO Kuru ✦</span>
              <strong style="font-size:17px; color:#FFFFFF; font-weight:700;">${title}</strong>
            </div>
            <div style="text-align:right;">
              <span style="font-size:11.5px; color:#C4D9EC;">Has Altın Gramı: ₺${Number(data.gramGold24k).toLocaleString('tr-TR')}</span>
              <div style="font-size:14px; font-weight:800; color:#F5E5BA;">${isCoin ? 'Birim Adet Fiyatı' : 'Ayar Başı Gram'}: ₺${Number(unitPrice).toLocaleString('tr-TR')}</div>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:18px; position:relative; z-index:2;">
            <div>
              <span style="font-size:12px; color:#CADAE6; display:block; font-weight:600;">Anında Nakit / FAST Ödeme Tutarı:</span>
              <div style="font-family:var(--font-sans); font-size:36px; font-weight:800; color:#F5E5BA; line-height:1.1; font-variant-numeric:tabular-nums; letter-spacing:-0.02em; text-shadow:0 2px 12px rgba(245,229,186,0.3);">
                ₺${totalCashOffer.toLocaleString('tr-TR')}
              </div>
              <span style="font-size:11.5px; color:#86EFAC; font-weight:700; display:inline-flex; align-items:center; gap:4px; margin-top:4px;">
                <span>✓</span> İzmir Buca Showroomumuzda 15 dakikada anında nakit veya hesaba FAST havale
              </span>
            </div>

            <a href="https://wa.me/905419305372?text=Merhaba,%20sitenizden%20${encodeURIComponent(title)}%20icin%20₺${totalCashOffer.toLocaleString('tr-TR')}%20IZKO%20canli%20teklifi%20aldim.%20Bozdurmak%20icin%20randevu%20istiyorum." target="_blank" class="btn-luxury-whatsapp" style="font-size:13.5px; padding:14px 26px;">
              <span>Bu Fiyatı WhatsApp'ta Sabitle 🔒 →</span>
            </a>
          </div>

        </div>
      `;
    }
  },

  onWatchBrandChange() {
    const brandKey = document.getElementById('watchBrandSelect')?.value || 'rolex';
    const modelSelect = document.getElementById('watchModelSelect');
    if (!modelSelect || !this.WATCH_CATALOG[brandKey]) return;

    const brandData = this.WATCH_CATALOG[brandKey];
    modelSelect.innerHTML = Object.keys(brandData.models).map(k => `
      <option value="${k}">${brandData.models[k].name}</option>
    `).join('');

    this.calculateWatch();
  },

  // Gerçek Lüks Saat Ekspertiz Motoru
  calculateWatch() {
    const brandKey = document.getElementById('watchBrandSelect')?.value || 'rolex';
    const modelKey = document.getElementById('watchModelSelect')?.value;
    const metal = document.getElementById('watchMetalSelect')?.value || 'steel';
    const box = document.getElementById('watchBoxSelect')?.value || 'full';
    const cond = document.getElementById('watchCondSelect')?.value || 'good';

    const brandData = this.WATCH_CATALOG[brandKey];
    if (!brandData || !brandData.models[modelKey]) return;

    const model = brandData.models[modelKey];
    let basePrice = model.baseSteel;
    if (metal === 'rolesor') basePrice = model.baseRolesor || model.baseSteel * 1.3;
    if (metal === 'gold') basePrice = model.baseGold || model.baseSteel * 2.4;

    const boxMultipliers = { full: 1.12, papers: 1.04, watch: 0.90 };
    const condMultipliers = { mint: 1.15, good: 1.00, used: 0.88 };

    const estimated = Math.round(basePrice * (boxMultipliers[box] || 1) * (condMultipliers[cond] || 1));
    const minOffer = Math.round(estimated * 0.95);
    const maxOffer = Math.round(estimated * 1.05);

    const resCard = document.getElementById('watchResultCard');
    if (resCard) {
      resCard.innerHTML = `
        <div class="val-result-card-luxury">
          
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(194, 167, 104, 0.3); padding-bottom:14px; margin-bottom:16px; flex-wrap:wrap; gap:10px; position:relative; z-index:2;">
            <div>
              <span style="font-size:11px; letter-spacing:1.5px; text-transform:uppercase; font-weight:800; color:var(--color-gold); display:block; margin-bottom:2px;">✦ 12 Nokta Ekspertiz Tahmini Piyasa Değeri ✦</span>
              <strong style="font-size:17px; color:#FFFFFF; font-weight:700;">${brandData.name} — ${model.name}</strong>
            </div>
            <span class="val-instant-badge">15 Dakikada Ekspertiz</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:18px; position:relative; z-index:2;">
            <div>
              <span style="font-size:12px; color:#CADAE6; display:block; font-weight:600;">Tahmini Anında Nakit / Takas Teklif Aralığı:</span>
              <div style="font-family:var(--font-sans); font-size:32px; font-weight:800; color:#F5E5BA; line-height:1.1; font-variant-numeric:tabular-nums; letter-spacing:-0.02em; text-shadow:0 2px 12px rgba(245,229,186,0.3);">
                ₺${minOffer.toLocaleString('tr-TR')} — ₺${maxOffer.toLocaleString('tr-TR')}
              </div>
              <span style="font-size:11.5px; color:#86EFAC; font-weight:700; display:inline-flex; align-items:center; gap:4px; margin-top:4px;">
                <span>✓</span> Sertifikalı saat ustamız tarafından hassas zaman tutuş ve mekanizma testi
              </span>
            </div>

            <a href="https://wa.me/905419305372?text=Merhaba,%20${encodeURIComponent(brandData.name + ' ' + model.name)}%20saatim%20icin%20ekspertiz%20ve%20satis%20randevusu%20almak%20istiyorum." target="_blank" class="btn-luxury-whatsapp" style="font-size:13.5px; padding:14px 26px;">
              <span>WhatsApp ile Ekspertiz Başlat 🔒 →</span>
            </a>
          </div>

        </div>
      `;
    }
  }
};
