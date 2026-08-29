// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE CART & CHECKOUT ENGINE
// Pure High Fashion Architecture — Zero Emojis
// ==========================================================

const Cart = {
  items: [],
  coupon: null,
  giftWrap: false,
  giftNote: '',

  init() {
    try {
      const saved = localStorage.getItem('belgin_cart');
      this.items = saved ? JSON.parse(saved) : [];
      const savedCoupon = localStorage.getItem('belgin_coupon');
      if (savedCoupon && VALID_COUPONS[savedCoupon]) {
        this.coupon = { code: savedCoupon, ...VALID_COUPONS[savedCoupon] };
      }
      this.giftWrap = localStorage.getItem('belgin_gift_wrap') === 'true';
      this.giftNote = localStorage.getItem('belgin_gift_note') || '';
    } catch (e) {
      this.items = [];
    }
    this.updateUI();
  },

  save() {
    try {
      localStorage.setItem('belgin_cart', JSON.stringify(this.items));
      if (this.coupon) {
        localStorage.setItem('belgin_coupon', this.coupon.code);
      } else {
        localStorage.removeItem('belgin_coupon');
      }
      localStorage.setItem('belgin_gift_wrap', this.giftWrap ? 'true' : 'false');
      localStorage.setItem('belgin_gift_note', this.giftNote);
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    this.updateUI();
  },

  add(productId, qty = 1, options = {}) {
    const product = findProduct(productId);
    if (!product) return;

    const ringSize = options.ringSize || null;
    const itemKey = ringSize ? `${product.id}_${ringSize}` : `${product.id}`;

    const existing = this.items.find(item => item.itemKey === itemKey || (item.id === product.id && !ringSize && !item.ringSize));
    
    if (existing) {
      existing.qty += qty;
    } else {
      this.items.push({
        itemKey: itemKey,
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || '',
        desc: product.desc || '',
        category: product.category || '',
        certificate: product.certificate || '',
        ringSize: ringSize,
        qty: qty
      });
    }

    this.save();
    showToast(`${product.name} lüks mücevher kasanıza eklendi.`, 'success');
  },

  remove(itemKeyOrId) {
    this.items = this.items.filter(item => item.itemKey !== String(itemKeyOrId) && item.id !== Number(itemKeyOrId));
    this.save();
    showToast('Ürün sepetten kaldırıldı.', 'info');
  },

  updateQty(itemKeyOrId, delta) {
    const item = this.items.find(i => i.itemKey === String(itemKeyOrId) || i.id === Number(itemKeyOrId));
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) {
      this.remove(itemKeyOrId);
      return;
    }
    this.save();
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  },

  getDiscountAmount() {
    if (!this.coupon) return 0;
    const subtotal = this.getSubtotal();
    return Math.round((subtotal * this.coupon.discountPercent) / 100);
  },

  getTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const giftWrapFee = 0; // VIP Hediye Paketi Belgin'de ÜCRETSİZ
    return Math.max(0, subtotal - discount + giftWrapFee);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  },

  applyCoupon(code) {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
      showToast('Lütfen geçerli bir kupon kodu giriniz.', 'error');
      return false;
    }

    if (VALID_COUPONS[trimmed]) {
      this.coupon = { code: trimmed, ...VALID_COUPONS[trimmed] };
      this.save();
      showToast(`${trimmed} kuponu uygulandı: ${this.coupon.name}`, 'success');
      this.renderCartPage();
      this.renderCheckout();
      return true;
    } else {
      showToast('Geçersiz veya süresi dolmuş VIP kupon kodu.', 'error');
      return false;
    }
  },

  removeCoupon() {
    this.coupon = null;
    this.save();
    showToast('Kupon kodu kaldırıldı.', 'info');
    this.renderCartPage();
    this.renderCheckout();
  },

  toggleGiftWrap(enabled) {
    this.giftWrap = Boolean(enabled);
    this.save();
    this.renderCartPage();
    this.renderCheckout();
  },

  setGiftNote(note) {
    this.giftNote = note || '';
    this.save();
  },

  clear() {
    this.items = [];
    this.coupon = null;
    this.giftWrap = false;
    this.giftNote = '';
    this.save();
  },

  updateUI() {
    const totalQty = this.getCount();
    const badges = document.querySelectorAll('#cartBadge, .cart-badge-count');
    badges.forEach(badge => {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'inline-flex' : 'none';
    });

    const itemsDiv = document.getElementById('cartDropdownItems');
    const totalDiv = document.getElementById('cartDropdownTotal');
    if (!itemsDiv || !totalDiv) return;

    if (this.items.length === 0) {
      itemsDiv.innerHTML = `
        <div style="text-align:center; padding:32px 16px; color:var(--text-dim);">
          <p style="font-size:14px; margin-bottom:4px; font-family:var(--font-serif);">Kasanızda Henüz Ürün Yok</p>
          <span style="font-size:12px; color:var(--text-muted);">Özel koleksiyonlarımızı keşfetmeye başlayın.</span>
        </div>
      `;
      totalDiv.textContent = '₺0';
      return;
    }

    itemsDiv.innerHTML = this.items.map(item => `
      <div class="cart-dropdown-item">
        <div class="cart-dropdown-item-img">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-dropdown-item-info">
          <h5>${item.name}</h5>
          ${item.ringSize ? `<span class="cart-item-size">Ölçü: ${item.ringSize}</span>` : ''}
          <span class="cart-item-qty-label">${item.qty} adet × ${formatPrice(item.price)}</span>
        </div>
        <div class="cart-dropdown-item-price">${formatPrice(item.price * item.qty)}</div>
      </div>
    `).join('');

    totalDiv.textContent = formatPrice(this.getTotal());
  },

  renderCartPage() {
    const container = document.getElementById('cartContent');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty" style="text-align:center; padding:80px 20px;">
          <h2 style="font-family:var(--font-serif); font-size:32px; margin-bottom:12px; color:var(--text-main);">Mücevher Kasanız Boş</h2>
          <p style="color:var(--text-muted); margin-bottom:28px; max-width:440px; margin-left:auto; margin-right:auto; font-size:15px;">
            Eşsiz el işçiliği pırlantalar, altın kolyeler ve lüks saat koleksiyonlarımız sizi bekliyor.
          </p>
          <a class="btn btn-filled" href="#" data-page="jewellery">Koleksiyonu Keşfet</a>
        </div>
      `;
      return;
    }

    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const grandTotal = this.getTotal();

    container.innerHTML = `
      <div class="cart-layout-grid">
        <div class="cart-items-list">
          <div class="cart-list-header">
            <span>Ürün</span>
            <span style="text-align:center;">Adet</span>
            <span style="text-align:right;">Tutar</span>
          </div>
          ${this.items.map(item => `
            <div class="cart-item" data-key="${item.itemKey || item.id}">
              <div class="cart-item-img">
                <img src="${item.image}" alt="${item.name}">
              </div>
              <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-desc">${item.desc || ''}</p>
                ${item.ringSize ? `<div class="badge-tag">Ölçü: ${item.ringSize}</div>` : ''}
                ${item.certificate ? `<div class="cert-pill">${item.certificate}</div>` : ''}
                <div class="cart-item-unit-price">${formatPrice(item.price)} / adet</div>
              </div>
              <div class="cart-item-qty">
                <button type="button" aria-label="Azalt" onclick="Cart.updateQty('${item.itemKey || item.id}', -1); Cart.renderCartPage();">−</button>
                <span>${item.qty}</span>
                <button type="button" aria-label="Artır" onclick="Cart.updateQty('${item.itemKey || item.id}', 1); Cart.renderCartPage();">+</button>
              </div>
              <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
              <button class="cart-item-remove" title="Kaldır" onclick="Cart.remove('${item.itemKey || item.id}'); Cart.renderCartPage();">×</button>
            </div>
          `).join('')}

          <!-- Hediye Paketi Seçeneği -->
          <div class="gift-box-option">
            <label class="checkbox-label" style="font-weight:600;">
              <input type="checkbox" id="giftWrapCheck" ${this.giftWrap ? 'checked' : ''} onchange="Cart.toggleGiftWrap(this.checked)">
              <span class="gift-title">Özel Belgin Lüks Kadife Hediye Paketi ve Mühürlü Kart İstiyorum (Ücretsiz VIP Hizmet)</span>
            </label>
            ${this.giftWrap ? `
              <div class="gift-note-wrapper">
                <label for="giftNoteInput" style="display:block; margin-bottom:6px; font-size:13px; color:var(--text-secondary);">Özel Hediye Mesajınız:</label>
                <textarea id="giftNoteInput" placeholder="Sevdiklerinize iletmek istediğiniz zarif bir not yazın..." rows="2" oninput="Cart.setGiftNote(this.value)">${this.giftNote}</textarea>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="cart-summary-box">
          <h3 class="summary-title">Sipariş Özeti</h3>
          
          <div class="summary-row">
            <span>Ara Toplam</span>
            <span>${formatPrice(subtotal)}</span>
          </div>

          ${this.coupon ? `
            <div class="summary-row discount-row">
              <span>VIP İndirim (${this.coupon.code}) <button class="btn-link" onclick="Cart.removeCoupon()" style="background:none; border:none; color:var(--gold-primary); cursor:pointer; text-decoration:underline;">Kaldır</button></span>
              <span style="color:var(--gold-primary); font-weight:700;">- ${formatPrice(discount)}</span>
            </div>
          ` : ''}

          <div class="summary-row">
            <span>Sigortalı Zırhlı Kargo</span>
            <span style="color:#0D5C3A; font-weight:700;">Ücretsiz VIP Teslimat</span>
          </div>

          <div class="summary-row">
            <span>Ömür Boyu Garanti & Bakım</span>
            <span style="color:#0D5C3A; font-weight:700;">Dahil</span>
          </div>

          <div class="coupon-input-group">
            <input type="text" id="couponCodeInput" placeholder="VIP Kupon Kodu (Örn: BELGIN10)" value="${this.coupon ? this.coupon.code : ''}">
            <button class="btn btn-sm btn-outline" onclick="Cart.applyCoupon(document.getElementById('couponCodeInput').value)">Uygula</button>
          </div>

          <div class="summary-row total-row">
            <span>Genel Toplam</span>
            <span class="grand-total">${formatPrice(grandTotal)}</span>
          </div>

          <div style="font-size:12px; color:var(--text-muted); margin:12px 0 20px;">Fiyatlarımıza %20 KDV dahildir.</div>

          <a class="btn btn-filled btn-block btn-lg" href="#" data-page="checkout">
            Güvenli Ödemeye Geç
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    `;
  },

  renderCheckout() {
    if (this.items.length === 0) {
      if (typeof findProduct === 'function') {
        const p = findProduct(1) || findProduct(101) || (typeof PRODUCTS !== 'undefined' && PRODUCTS[0]);
        if (p) {
          this.items.push({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image || '',
            desc: p.desc || '',
            category: p.category || '',
            qty: 1
          });
          this.save();
        }
      }
    }

    const container = document.getElementById('checkoutItems') || document.getElementById('checkoutItemsListMini');
    const subtotalEl = document.getElementById('checkoutSubtotal') || document.getElementById('checkoutSubtotalDisplay');
    const discountRow = document.getElementById('checkoutDiscountRow');
    const discountEl = document.getElementById('checkoutDiscountDisplay');
    const totalEl = document.getElementById('checkoutTotal') || document.getElementById('checkoutGrandTotalDisplay');
    const submitBtnText = document.getElementById('checkoutSubmitBtnText');

    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const grandTotal = this.getTotal();

    if (container) {
      if (this.items.length === 0) {
        container.innerHTML = `
          <div style="padding:16px; text-align:center; color:var(--color-muted); font-size:13px;">
            Sepetinizde ürün bulunmamaktadır. <a href="#" data-page="saatler" style="color:var(--color-teal); text-decoration:underline;">Alışverişe Başla</a>
          </div>
        `;
      } else {
        container.innerHTML = this.items.map(item => `
          <div class="checkout-item-mini-row" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px dashed rgba(0,0,0,0.08);">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:40px; height:40px; border-radius:4px; overflow:hidden; border:1px solid #EAE5D9; background:#FFF; flex-shrink:0;">
                <img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:contain;">
              </div>
              <div>
                <strong style="font-size:13px; color:var(--color-ink); display:block; line-height:1.3;">${item.name}</strong>
                ${item.ringSize ? `<span style="font-size:11px; color:var(--color-muted);">Ölçü: ${item.ringSize} · </span>` : ''}
                <span style="font-size:11.5px; color:var(--color-muted);">${item.qty} adet × ${formatPrice(item.price)}</span>
              </div>
            </div>
            <div style="font-size:14px; font-weight:700; color:var(--color-ink); font-family:var(--font-sans); font-variant-numeric:tabular-nums;">${formatPrice(item.price * item.qty)}</div>
          </div>
        `).join('');
      }
    }

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (totalEl) totalEl.textContent = formatPrice(grandTotal);
    if (submitBtnText) submitBtnText.textContent = `3D Secure ile Güvenli Öde (${formatPrice(grandTotal)})`;

    if (discountRow) {
      if (this.coupon && discount > 0) {
        discountRow.style.display = 'flex';
        if (discountEl) discountEl.textContent = `- ${formatPrice(discount)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (typeof App !== 'undefined' && typeof App.renderCheckoutDeliveryOptions === 'function') {
      App.renderCheckoutDeliveryOptions();
    }
  }
};
