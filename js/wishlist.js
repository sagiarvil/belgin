// ==========================================================
// BELGIN KUYUMCULUK — ENTERPRISE WISHLIST MODULE
// ==========================================================

const Wishlist = {
  ids: [],

  init() {
    try {
      const saved = localStorage.getItem('belgin_wishlist');
      this.ids = saved ? JSON.parse(saved) : [];
    } catch (e) {
      this.ids = [];
    }
    this.updateUI();
  },

  save() {
    try {
      localStorage.setItem('belgin_wishlist', JSON.stringify(this.ids));
    } catch (e) {
      console.warn('Wishlist save error:', e);
    }
    this.updateUI();
  },

  toggle(id) {
    const numId = Number(id);
    const idx = this.ids.indexOf(numId);
    const prod = findProduct(numId);
    const name = prod ? prod.name : 'Ürün';

    if (idx > -1) {
      this.ids.splice(idx, 1);
      showToast(`${name} istek listenizden çıkarıldı.`, 'info');
    } else {
      this.ids.push(numId);
      showToast(`${name} istek listenize eklendi.`, 'success');
    }
    this.save();
    if (typeof App !== 'undefined' && App.refreshCurrentPage) {
      App.refreshCurrentPage();
    }
  },

  has(id) {
    return this.ids.includes(Number(id));
  },

  getItems() {
    return getAllProducts().filter(p => this.ids.includes(p.id));
  },

  getCount() {
    return this.ids.length;
  },

  clear() {
    this.ids = [];
    this.save();
    if (typeof App !== 'undefined' && App.refreshCurrentPage) {
      App.refreshCurrentPage();
    }
  },

  updateUI() {
    const count = this.getCount();
    const badges = document.querySelectorAll('#wishlistBadge, .wishlist-badge-count');
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }
};
