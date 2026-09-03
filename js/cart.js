// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE CART & CHECKOUT ENGINE
// Pure High Fashion Architecture — Zero Emojis
// ==========================================================

const Cart = {
  items: [],
  coupon: null,
  giftWrap: false,
  giftNote: '',

  sanitize() {
    this.items = (this.items || []).filter(item => {
      if (!item) return false;
      const id = String(item.id || '').trim();
      const name = String(item.name || '').trim();
      if (!id || id === 'undefined' || id === 'null') return false;
      if (!name || name === 'undefined' || name === 'null') return false;
      return true;
    }).map(item => {
      let p = Number(item.price);
      if (isNaN(p) || p <= 0) {
        const prod = typeof findProduct === 'function' ? findProduct(item.id) : null;
        if (prod && Number(prod.price) > 0) {
          p = Number(prod.price);
        }
      }
      item.price = p || 0;
      item.qty = Math.max(1, parseInt(item.qty, 10) || 1);
      item.itemKey = item.itemKey || String(item.id);
      return item;
    });
  },

  init() {
    try {
      const saved = localStorage.getItem('belgin_cart');
      this.items = saved ? JSON.parse(saved) : [];
      this.sanitize();
      const savedCoupon = localStorage.getItem('belgin_coupon');
      if (savedCoupon && typeof VALID_COUPONS !== 'undefined' && VALID_COUPONS[savedCoupon]) {
        this.coupon = { code: savedCoupon, ...VALID_COUPONS[savedCoupon] };
      }
      this.giftWrap = localStorage.getItem('belgin_gift_wrap') === 'true';
      this.giftNote = localStorage.getItem('belgin_gift_note') || '';
    } catch (e) {
      this.items = [];
    }
    this.save();
    this.updateUI();
  },

  save() {
    this.sanitize();
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
    const cleanPrice = Number(product.price || 0);

    const existing = this.items.find(item => String(item.itemKey) === String(itemKey) || (String(item.id) === String(product.id) && !ringSize && !item.ringSize));
    
    if (existing) {
      existing.qty = Math.max(1, (Number(existing.qty) || 0) + (Number(qty) || 1));
      if (!existing.price || existing.price <= 0) existing.price = cleanPrice;
      if (!existing.itemKey) existing.itemKey = itemKey;
    } else {
      this.items.push({
        itemKey: itemKey,
        id: product.id,
        name: product.name,
        price: cleanPrice,
        image: product.image || '',
        desc: product.desc || '',
        category: product.category || '',
        certificate: product.certificate || '',
        ringSize: ringSize,
        qty: Math.max(1, Number(qty) || 1)
      });
    }

    this.save();
    if (typeof App !== 'undefined' && typeof App.updateHeaderCartCount === 'function') {
      App.updateHeaderCartCount();
    }
    showToast(`${product.name} mücevher kasanıza eklendi.`, 'success');
  },

  addItem(productId, qty = 1, options = {}) {
    this.add(productId, qty, options);
    if (typeof App !== 'undefined' && App.updateHeaderCartCount) {
      App.updateHeaderCartCount();
    }
    if (typeof Router !== 'undefined' && Router.navigate) {
      Router.navigate('odeme');
    } else {
      window.location.href = '/#odeme';
    }
  },

  remove(itemKeyOrId) {
    const target = String(itemKeyOrId);
    this.items = this.items.filter(item => String(item.itemKey) !== target && String(item.id) !== target);
    this.save();
    if (typeof App !== 'undefined' && typeof App.renderCart === 'function' && typeof Router !== 'undefined' && (Router.currentPage === 'sepet' || window.location.hash === '#sepet')) {
      App.renderCart();
    }
    this.renderCartPage();
    this.renderCheckout();
    showToast('Ürün sepetten kaldırıldı.', 'info');
  },

  updateQty(itemKeyOrId, delta) {
    const target = String(itemKeyOrId);
    const item = this.items.find(i => String(i.itemKey) === target || String(i.id) === target);
    if (!item) return;
    item.qty = (Number(item.qty) || 1) + Number(delta);
    if (item.qty < 1) {
      this.remove(itemKeyOrId);
      return;
    }
    this.save();
    if (typeof App !== 'undefined' && typeof App.renderCart === 'function' && typeof Router !== 'undefined' && (Router.currentPage === 'sepet' || window.location.hash === '#sepet')) {
      App.renderCart();
    }
    this.renderCartPage();
    this.renderCheckout();
  },

  getSubtotal() {
    return this.items.reduce((sum, item) => {
      let p = Number(item.price);
      if (isNaN(p) || p <= 0) {
        const prod = typeof findProduct === 'function' ? findProduct(item.id) : null;
        if (prod && Number(prod.price) > 0) {
          p = Number(prod.price);
          item.price = p; // repair corrupt cart item price
        } else {
          p = 0;
        }
      }
      const q = Math.max(1, Number(item.qty) || 1);
      return sum + (p * q);
    }, 0);
  },

  getDiscountAmount() {
    if (!this.coupon) return 0;
    const subtotal = this.getSubtotal();
    return Math.round((subtotal * Number(this.coupon.discountPercent || 0)) / 100);
  },

  getTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const giftWrapFee = 0; // VIP Hediye Paketi Belgin'de ÜCRETSİZ
    return Math.max(0, subtotal - discount + giftWrapFee);
  },

  getCount() {
    return this.items.reduce((sum, item) => sum + (Math.max(1, Number(item.qty) || 1)), 0);
  },

  applyCoupon(code) {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) {
      showToast('Lütfen geçerli bir kupon kodu giriniz.', 'error');
      return false;
    }

    if (typeof VALID_COUPONS !== 'undefined' && VALID_COUPONS[trimmed]) {
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
    if (typeof App !== 'undefined' && typeof App.renderCart === 'function' && typeof Router !== 'undefined' && Router.currentPage === 'sepet') {
      App.renderCart();
    }
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
          <img src="${item.image || 'images/logo.png'}" alt="${item.name}">
        </div>
        <div class="cart-dropdown-item-info">
          <h5>${item.name}</h5>
          ${item.ringSize ? `<span class="cart-item-size">Ölçü: ${item.ringSize}</span>` : ''}
          <span class="cart-item-qty-label">${item.qty} adet × ${formatPrice(item.price)}</span>
        </div>
        <div class="cart-dropdown-item-price">${formatPrice(Number(item.price || 0) * Number(item.qty || 1))}</div>
      </div>
    `).join('');

    totalDiv.textContent = formatPrice(this.getTotal());
  },

  renderCartPage() {
    if (typeof App !== 'undefined' && typeof App.renderCart === 'function') {
      App.renderCart();
      return;
    }
  },

  renderCheckout() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const grandTotal = this.getTotal();

    const container = document.getElementById('checkoutItemsListMini') || document.getElementById('checkoutItems');
    const subtotalEl = document.getElementById('checkoutSubtotalDisplay') || document.getElementById('checkoutSubtotal');
    const discountRow = document.getElementById('checkoutDiscountRow');
    const discountEl = document.getElementById('checkoutDiscountDisplay');
    const totalEl = document.getElementById('checkoutGrandTotalDisplay') || document.getElementById('checkoutTotal');
    const submitBtn = document.getElementById('checkoutSubmitBtn') || document.getElementById('btnSubmitOrder');
    const submitBtnText = document.getElementById('checkoutSubmitBtnText');

    if (container) {
      if (this.items.length === 0) {
        container.innerHTML = `
          <div style="padding:16px; text-align:center; color:var(--color-muted); font-size:13px;">
            Sepetinizde ürün bulunmamaktadır. <a href="#" data-page="saatler" style="color:var(--color-teal); text-decoration:underline;">Alışverişe Başla</a>
          </div>
        `;
      } else {
        container.innerHTML = this.items.map(item => {
          const itemPrice = Number(item.price || 0);
          const linePrice = itemPrice * (Number(item.qty) || 1);
          return `
            <div class="checkout-item-mini-row" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px dashed rgba(0,0,0,0.08);">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:40px; height:40px; border-radius:4px; overflow:hidden; border:1px solid #EAE5D9; background:#FFF; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                  <img src="${item.image || 'images/logo.png'}" alt="${item.name}" style="width:100%; height:100%; object-fit:contain;">
                </div>
                <div>
                  <strong style="font-size:13px; color:var(--color-ink); display:block; line-height:1.3;">${item.name}</strong>
                  ${item.ringSize ? `<span style="font-size:11px; color:var(--color-muted);">Ölçü: ${item.ringSize} · </span>` : ''}
                  <span style="font-size:11.5px; color:var(--color-muted);">${item.qty} adet × ${formatPrice(itemPrice)}</span>
                </div>
              </div>
              <div style="font-size:14px; font-weight:700; color:var(--color-ink); font-family:var(--font-sans); font-variant-numeric:tabular-nums;">${formatPrice(linePrice)}</div>
            </div>
          `;
        }).join('');
      }
    }

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (totalEl) totalEl.textContent = formatPrice(grandTotal);
    
    if (submitBtnText) {
      submitBtnText.textContent = `3D Secure ile Güvenli Öde (${formatPrice(grandTotal)})`;
    } else if (submitBtn) {
      const span = submitBtn.querySelector('span:last-child');
      if (span) {
        span.textContent = `3D Secure ile Güvenli Öde (${formatPrice(grandTotal)})`;
      }
    }

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
