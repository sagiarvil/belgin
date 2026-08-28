// ==========================================================
// BELGIN KUYUMCULUK — YÖNETİCİ VE TAHSİLAT PANELİ JS MOTORU
// ==========================================================

const AdminApp = {
  adminPin: '1999',
  orders: [],
  filteredOrders: [],
  knownPaidOrderIds: new Set(),
  isInitialLoadDone: false,
  currentPreset: 'all',
  currentPage: 1,
  pageSize: 10,
  pollTimer: null,
  activeInvoiceOrderId: null,
  activeInvoiceUuid: null,
  activeInvoiceBreakdown: null,

  init() {
    this.startClock();
    const savedPin = sessionStorage.getItem('belgin_admin_pin');
    if (savedPin === '1999') {
      this.adminPin = savedPin;
      this.hideAuthGate();
      this.loadCachedOrders();
      this.loadOrders().then(() => {
        this.isInitialLoadDone = true;
        this.startLivePolling();
      });
    } else {
      this.showAuthGate();
      const input = document.getElementById('adminPinInput');
      if (input) setTimeout(() => input.focus(), 150);
    }
  },

  loadCachedOrders() {
    try {
      const cached = localStorage.getItem('belgin_admin_cached_data');
      if (cached) {
        // Eski sahte/mock verileri temizle
        if (cached.includes('POS-14000-8291') || cached.includes('BLG-12865794') || cached.includes('VIP-9941-45000')) {
          localStorage.removeItem('belgin_admin_cached_data');
          return;
        }
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          this.orders = parsed.orders;
          parsed.orders.forEach(o => {
            if (o && o.orderId) this.knownPaidOrderIds.add(o.orderId);
          });
          this.renderData(parsed.summary, parsed.orders);
          return;
        }
      }
    } catch (_) {}
  },

  startClock() {
    const update = () => {
      const el = document.getElementById('liveClock');
      if (el) el.textContent = new Date().toLocaleTimeString('tr-TR');
    };
    update();
    setInterval(update, 1000);
  },

  startLivePolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.pollNewOrders();
    }, 8000);
  },

  async pollNewOrders() {
    if (!this.adminPin || document.getElementById('adminAuthGate')?.style.display === 'flex') return;

    try {
      const startDate = document.getElementById('startDate')?.value || '';
      const endDate = document.getElementById('endDate')?.value || '';
      const status = document.getElementById('statusFilter')?.value || 'PAID';

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status) params.append('status', status);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { 'x-admin-key': this.adminPin }
      });

      if (res.status === 200) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.orders)) {
          // Yalnızca son 5 dakikada yeni gelen gerçek ödemeleri bildir
          let hasNewPayment = false;
          let newPaymentName = '';
          let newPaymentAmount = '';
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

          data.orders.forEach(o => {
            if (o.isPaid && o.paymentStatus === 'PAID') {
              if (this.isInitialLoadDone && !this.knownPaidOrderIds.has(o.orderId)) {
                const orderTime = o.paidAt ? new Date(o.paidAt).getTime() : (o.createdAt ? new Date(o.createdAt).getTime() : 0);
                if (orderTime >= fiveMinutesAgo || orderTime === 0) {
                  hasNewPayment = true;
                  newPaymentName = o.customerName || 'Yeni Müşteri';
                  newPaymentAmount = '₺' + Number(o.totalAmount || 0).toLocaleString('tr-TR');
                }
              }
              this.knownPaidOrderIds.add(o.orderId);
            }
          });

          this.orders = data.orders;
          this.renderData(data.summary, data.orders);

          if (hasNewPayment) {
            this.playChime();
            this.showToast(`🔔 YENİ TAHSİLAT: ${newPaymentName} — ${newPaymentAmount}`);
          }
        }
      }
    } catch (_) {}
  },

  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
  },

  showToast(msg) {
    let toast = document.getElementById('adminLiveToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminLiveToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #042926;
        color: #FFF;
        border: 2px solid #C2A768;
        padding: 14px 20px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 13.5px;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = msg;
    toast.style.display = 'flex';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.style.display = 'none', 300);
    }, 5000);
  },

  showAuthGate() {
    const gate = document.getElementById('adminAuthGate');
    if (gate) gate.style.display = 'flex';
  },

  hideAuthGate() {
    const gate = document.getElementById('adminAuthGate');
    if (gate) gate.style.display = 'none';
  },

  verifyPin() {
    const input = document.getElementById('adminPinInput');
    const val = (input ? input.value : '').trim();
    const err = document.getElementById('pinErrorMsg');

    if (val === '1999') {
      this.adminPin = val;
      sessionStorage.setItem('belgin_admin_pin', val);
      if (err) err.style.display = 'none';
      this.hideAuthGate();
      this.loadOrders().then(() => this.startLivePolling());
    } else {
      if (err) err.style.display = 'block';
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },

  logout() {
    try {
      sessionStorage.removeItem('belgin_admin_pin');
      localStorage.removeItem('belgin_admin_pin');
    } catch (_) {}
    this.adminPin = '';
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    window.location.href = '/';
  },

  // TARİH PRESETLERİ
  selectPreset(preset, btn) {
    this.currentPreset = preset;
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    const today = new Date();
    const toDateStr = (d) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        startInput.value = toDateStr(today);
        endInput.value = toDateStr(today);
        break;
      case 'yesterday':
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        startInput.value = toDateStr(yest);
        endInput.value = toDateStr(yest);
        break;
      case 'last7':
        const d7 = new Date(today);
        d7.setDate(d7.getDate() - 7);
        startInput.value = toDateStr(d7);
        endInput.value = toDateStr(today);
        break;
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        startInput.value = toDateStr(firstDay);
        endInput.value = toDateStr(today);
        break;
      case 'last30':
        const d30 = new Date(today);
        d30.setDate(d30.getDate() - 30);
        startInput.value = toDateStr(d30);
        endInput.value = toDateStr(today);
        break;
      case 'all':
      default:
        startInput.value = '';
        endInput.value = '';
        break;
    }

    this.loadOrders();
  },

  onCustomDateChange() {
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    this.loadOrders();
  },

  // SİPARİŞLERİ YÜKLE
  async loadOrders() {
    // Yalnızca ekranda henüz hiç sipariş yoksa yükleme göstergesi göster
    const tbody = document.getElementById('ordersTableBody');
    if (tbody && (!this.orders || this.orders.length === 0)) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:36px; color:var(--admin-muted);">
            ⏳ Sipariş ve tahsilat kayıtları yükleniyor...
          </td>
        </tr>
      `;
    }

    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    const status = document.getElementById('statusFilter')?.value || 'PAID';

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          'x-admin-key': this.adminPin
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.status === 401) {
        this.showAuthGate();
        return;
      }

      const data = await res.json();
      if (data && data.success && Array.isArray(data.orders)) {
        this.orders = data.orders;
        try {
          localStorage.setItem('belgin_admin_cached_data', JSON.stringify({
            summary: data.summary,
            orders: data.orders
          }));
        } catch (_) {}
        this.renderData(data.summary, data.orders);
      } else {
        throw new Error(data.message || 'Veri formatı geçersiz.');
      }
    } catch (err) {
      console.warn('[AdminApp] API çağrısı gecikti/başarısız:', err.message);
      if (!this.orders || this.orders.length === 0) {
        this.renderEmptyState();
      }
    }

    const syncEl = document.getElementById('lastSyncTime');
    if (syncEl) syncEl.textContent = 'Son Güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
  },

  renderEmptyState() {
    this.orders = [];
    const summary = {
      totalVolume: 0,
      formattedTotalVolume: '₺0',
      totalCount: 0,
      successfulCount: 0,
      averageOrderValue: 0,
      formattedAverageOrderValue: '₺0',
      providerBreakdown: {}
    };
    this.renderData(summary, []);
  },

  // VERİLERİ RENDER ET
  renderData(summary, orders) {
    // 1. KPI Kartları
    const kpiVol = document.getElementById('kpiTotalVolume');
    const kpiCount = document.getElementById('kpiSuccessCount');
    const kpiAov = document.getElementById('kpiAov');
    const kpiProv = document.getElementById('kpiProviderStats');
    const countBadge = document.getElementById('tableCountBadge');

    if (kpiVol) kpiVol.textContent = summary?.formattedTotalVolume || '₺0';
    if (kpiCount) kpiCount.textContent = summary?.successfulCount || 0;
    if (kpiAov) kpiAov.textContent = summary?.formattedAverageOrderValue || '₺0';

    if (kpiProv && summary?.providerBreakdown) {
      const provLines = Object.entries(summary.providerBreakdown).map(([k, v]) => `${k}: ₺${(v.sum || 0).toLocaleString('tr-TR')}`);
      kpiProv.innerHTML = provLines.join('<br>') || '—';
    }

    if (countBadge) countBadge.textContent = `(${orders.length} Kayıt)`;

    this.filteredOrders = orders;
    this.filterTable();
  },

  // DURUM FİLTRESİ DEĞİŞTİR (PİLLER VEYA SELECT)
  setStatusFilter(status, btn) {
    this.currentPage = 1;
    const select = document.getElementById('statusFilter');
    if (select) select.value = status;
    document.querySelectorAll('.btn-status-pill').forEach(b => b.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      const targetBtn = document.querySelector(`.btn-status-pill[data-status="${status}"]`);
      if (targetBtn) targetBtn.classList.add('active');
    }
    this.loadOrders();
  },

  onStatusSelectChange(statusVal) {
    this.currentPage = 1;
    document.querySelectorAll('.btn-status-pill').forEach(b => b.classList.remove('active'));
    const targetBtn = document.querySelector(`.btn-status-pill[data-status="${statusVal}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    this.loadOrders();
  },

  goToPage(page) {
    this.currentPage = page;
    this.filterTable();
  },

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterTable();
    }
  },

  nextPage() {
    this.currentPage++;
    this.filterTable();
  },

  // CANLI ARAMA, DURUM FİLTRESİ & 10'LU SAYFALAMA
  filterTable() {
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter')?.value || 'PAID';

    const visibleOrders = this.filteredOrders.filter(o => {
      const matchSearch = !searchVal || 
        o.orderId.toLowerCase().includes(searchVal) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchVal)) ||
        (o.customerPhone && o.customerPhone.includes(searchVal)) ||
        (o.provider && o.provider.toLowerCase().includes(searchVal));

      // TEK VE KESİN REFERANS: Akbank POS / Banka tarafından GERÇEKTEN onaylanmış ve kayda geçmiş tahsilatlar
      const isPaid = Boolean(o.isPaid) && (o.paymentStatus === 'PAID' || o.status === 'PAID' || o.status === 'AWAITING_STORE_PICKUP');
      const isFailed = o.status === 'FAILED' || o.paymentStatus === 'FAILED' || o.status === 'PAYMENT_FAILED';
      const isPending = !isPaid && !isFailed;
      const isInvoiceSigned = (o.invoiceStatus === 'SIGNED');
      const isInvoicePending = isPaid && !isInvoiceSigned;

      let matchStatus = true;
      if (statusVal === 'PAID') matchStatus = isPaid;
      else if (statusVal === 'INVOICE_PENDING') matchStatus = isInvoicePending;
      else if (statusVal === 'INVOICE_SIGNED') matchStatus = isInvoiceSigned;
      else if (statusVal === 'PENDING') matchStatus = isPending;
      else if (statusVal === 'FAILED') matchStatus = isFailed;

      return matchSearch && matchStatus;
    });

    const countBadge = document.getElementById('tableCountBadge');
    if (countBadge) {
      countBadge.textContent = statusVal === 'PAID' 
        ? `(${visibleOrders.length} Onaylanan Tahsilat)`
        : (statusVal === 'INVOICE_PENDING'
        ? `(${visibleOrders.length} Faturası Kesilecek İşlem)`
        : (statusVal === 'INVOICE_SIGNED'
        ? `(${visibleOrders.length} Faturası Kesilmiş İşlem)`
        : `(${visibleOrders.length} Kayıt)`));
    }

    const totalItems = visibleOrders.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIdx = totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endIdx = Math.min(this.currentPage * this.pageSize, totalItems);
    const pagedOrders = visibleOrders.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);

    // Sayfalama Bilgi ve Butonlarını Güncelle
    const pageInfo = document.getElementById('paginationInfo');
    if (pageInfo) {
      pageInfo.textContent = `Toplam ${totalItems} işlemden ${startIdx}-${endIdx} arası gösteriliyor (Sayfa ${this.currentPage} / ${totalPages})`;
    }

    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
    if (btnNext) btnNext.disabled = this.currentPage >= totalPages;

    const pageButtonsContainer = document.getElementById('pageNumberButtons');
    if (pageButtonsContainer) {
      let pageBtnsHtml = '';
      for (let p = 1; p <= totalPages; p++) {
        pageBtnsHtml += `
          <button class="btn-page ${p === this.currentPage ? 'active' : ''}" onclick="AdminApp.goToPage(${p})">
            ${p}
          </button>
        `;
      }
      pageButtonsContainer.innerHTML = pageBtnsHtml;
    }

    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (pagedOrders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:36px; color:var(--admin-muted);">
            Seçilen filtrelere uygun ödeme kaydı bulunamadı.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pagedOrders.map(o => {
      const isPaid = Boolean(o.isPaid) && (o.paymentStatus === 'PAID' || o.status === 'PAID' || o.status === 'AWAITING_STORE_PICKUP');
      const isFailed = o.status === 'FAILED' || o.paymentStatus === 'FAILED' || o.status === 'PAYMENT_FAILED';

      const statusBadge = isPaid
        ? '<span class="badge-status badge-status-paid">✅ Tahsil Edildi</span>'
        : isFailed
        ? '<span class="badge-status badge-status-failed">❌ Başarısız</span>'
        : '<span class="badge-status badge-status-pending">⏳ Beklemede</span>';

      const invoiceBadge = o.invoiceStatus === 'SIGNED'
        ? '<div style="font-size:11px; margin-top:3px;"><span style="background:#E8F5E9; color:#1B5E20; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #A5D6A7;">🧾 Fatura: İmzalandı</span></div>'
        : (o.invoiceStatus === 'DRAFT'
        ? '<div style="font-size:11px; margin-top:3px;"><span style="background:#FFF8E1; color:#F57F17; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #FFE082;">🧾 Fatura: Taslak</span></div>'
        : '');

      const dateFormatted = new Date(o.createdAt).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      return `
        <tr>
          <td style="font-family:monospace; font-weight:800; font-size:11.5px; color:#064E3B;">${o.orderId}</td>
          <td style="font-size:11px; color:#64748B; white-space:nowrap;">${dateFormatted}</td>
          <td>
            <div style="font-weight:800; font-size:12px; color:#0F172A;">${o.customerName || 'Müşteri'}</div>
            <div style="font-size:11px; color:#64748B;">${o.customerPhone || '—'}</div>
            <div style="font-size:10.5px; color:#B45309; font-weight:700;">🆔 <span style="font-family:monospace;">${o.customerIdentity && o.customerIdentity !== '—' ? o.customerIdentity : 'Showroom'}</span></div>
          </td>
          <td style="font-weight:800; font-size:13.5px; color:#047857; white-space:nowrap;">
            ₺${Number(o.totalAmount || 0).toLocaleString('tr-TR')}
          </td>
          <td>
            <select class="admin-status-dropdown ${isPaid ? 'status-paid' : (isFailed ? 'status-failed' : 'status-pending')}" 
                    onchange="AdminApp.quickChangeStatus('${o.orderId}', this.value, this)" 
                    title="Durumu doğrudan değiştirmek veya silmek için seçiniz">
              <option value="PAID" ${isPaid ? 'selected' : ''}>✅ Tahsil Edildi</option>
              <option value="PENDING" ${!isPaid && !isFailed ? 'selected' : ''}>⏳ Beklemede</option>
              <option value="FAILED" ${isFailed ? 'selected' : ''}>❌ Başarısız / İptal</option>
              <option value="DELETE" style="color:#C62828; font-weight:800;">🗑️ Kaydı Sil</option>
            </select>
            ${invoiceBadge}
          </td>
          <td style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
            ${!isPaid ? `<button class="btn-admin-primary" style="padding:3px 7px; font-size:11px; background:#15803D; border-color:#15803D;" onclick="AdminApp.confirmOrder('${o.orderId}')" title="Tahsilatı Onayla">✅ Onayla</button>` : ''}
            <button class="btn-admin-secondary" style="padding:3px 7px; font-size:11px; background:#F0F9FF; border-color:#0284C7; color:#0369A1; font-weight:700;" onclick="AdminApp.showDetail('${o.orderId}')">
              Detay
            </button>
            ${o.invoiceStatus !== 'SIGNED' ? `
              <button class="btn-admin-primary" style="padding:3px 7px; font-size:11px; background:#059669; border-color:#059669; color:#FFF; font-weight:700;" onclick="AdminApp.startInvoiceSigning('${o.orderId}')" title="GİB e-Arşiv Fatura Kes">
                🧾 Fatura Kes
              </button>
            ` : `
              <button class="btn-admin-secondary" style="padding:3px 7px; font-size:11px; background:#F0FDF4; border-color:#059669; color:#065F46; font-weight:700;" onclick="AdminApp.viewInvoice('${o.invoiceUuid}', '${o.orderId}')" title="Faturayı Aç / Yazdır">
                📄 Fatura
              </button>
              <button class="btn-admin-secondary" style="padding:3px 7px; font-size:11px; background:#10B981; border-color:#10B981; color:#FFF; font-weight:700;" onclick="AdminApp.sendInvoiceViaWhatsApp('${o.orderId}')" title="Faturayı WhatsApp ile Müşteriye İlet">
                📲 WhatsApp
              </button>
            `}
            <button class="btn-admin-secondary" style="padding:3px 7px; font-size:11px; background:#FFFBEB; border-color:#D97706; color:#92400E; font-weight:700;" onclick="AdminApp.printLegalDocument('${o.orderId}')" title="Zaman Damgalı Sözleşme & Delil Çıktısı">
              📜 Yasal
            </button>
            <button class="btn-admin-secondary" style="padding:3px 6px; font-size:11px; border-color:#FCA5A5; color:#DC2626; background:#FEF2F2;" onclick="AdminApp.deleteOrder('${o.orderId}')" title="Test/mükerrer kaydı veritabanından kalıcı olarak sil">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // KUYUMCULUK ÖZEL MATRAH HESAPLAMA
  calculateJewelryBreakdown(totalAmount) {
    const total = Number(totalAmount) || 0;
    const workmanshipTotal = Math.max(1, Math.round(total * 0.01 * 100) / 100);
    const hasGoldAmount = Math.round((total - workmanshipTotal) * 100) / 100;
    const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
    const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
    return {
      hasGoldAmount,
      workmanshipNet,
      workmanshipKdv,
      workmanshipTotal,
      grandTotal: total
    };
  },

  // HUKUKİ DELİL & SÖZLEŞME ÇIKTISI AÇ
  printLegalDocument(orderId) {
    window.open(`/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(orderId)}`, '_blank');
  },

  // ÜRÜN TESLİM, KONTROL VE ÖDEME İŞLEMİ TEYİT BEYANI AÇ
  printDeliveryStatement(orderId) {
    window.open(`/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(orderId)}&tab=delivery-statement`, '_blank');
  },

  // SİPARİŞ DETAY MODALI
  showDetail(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailModal');
    const content = document.getElementById('modalOrderContent');
    if (!modal || !content) return;

    const bd = this.calculateJewelryBreakdown(order.totalAmount);

    const itemsHtml = (order.items || []).map(it => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #EEE; font-size:13px;">
        <span><strong>${it.name || it.title}</strong> (x${it.qty || 1})</span>
        <strong style="color:var(--admin-teal);">₺${Number(it.price || 0).toLocaleString('tr-TR')}</strong>
      </div>
    `).join('');

    content.innerHTML = `
      <div style="background:#F9F8F5; padding:14px; border-radius:8px; border:1px solid var(--admin-border); margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:12px; color:var(--admin-muted); font-weight:700;">SİPARİŞ REFERANS:</span>
          <strong style="font-family:monospace; font-size:14px; color:var(--admin-teal-dark);">${order.orderId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:12px; color:var(--admin-muted); font-weight:700;">HUKUKİ DELİL KİMLİĞİ:</span>
          <span style="font-family:monospace; font-size:12px;">${order.evidenceId || order.orderId}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; color:var(--admin-muted); font-weight:700;">İŞLEM TARİHİ:</span>
          <span style="font-size:13px; font-weight:600;">${new Date(order.createdAt).toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <h4 style="margin:14px 0 8px; font-size:14px; color:var(--admin-teal-dark);">Müşteri & Fatura Kimlik Bilgileri</h4>
      <div style="font-size:13px; line-height:1.7; margin-bottom:16px;">
        <div><strong>Ad Soyad:</strong> ${order.customerName || '—'}</div>
        <div><strong>T.C. Kimlik / Pasaport:</strong> <span style="font-family:monospace; font-weight:800; color:#084C47; background:#F0F7F5; padding:2px 8px; border-radius:4px; border:1px solid #D3E4E0;">${order.customerIdentity || 'Showroomda İbraz Edilecek'}</span></div>
        <div><strong>Fatura Adresi:</strong> <span>${order.customerAddress || 'Showroom / Mağazadan Teslim'}</span></div>
        <div><strong>Telefon:</strong> ${order.customerPhone || '—'}</div>
        <div><strong>E-Posta:</strong> ${order.customerEmail || '—'}</div>
        <div><strong>Teslimat Şekli:</strong> ${order.deliveryMethod === 'showroom' ? 'İzmir Buca Showroom Mağazadan Teslim' : 'Kargo Teslimatı'}</div>
      </div>

      <h4 style="margin:14px 0 8px; font-size:14px; color:var(--admin-teal-dark);">Tahsilat & POS Bilgileri</h4>
      <div style="font-size:13px; line-height:1.6; margin-bottom:16px;">
        <div><strong>POS Kanalı:</strong> ${order.provider || 'AKBANK'} Sanal POS 3D Secure</div>
        <div><strong>Ödeme Durumu:</strong> ${order.isPaid && order.paymentStatus === 'PAID' ? '✅ Tahsil Edildi (Akbank 3D Onaylı)' : (order.status === 'FAILED' || order.paymentStatus === 'FAILED' ? '❌ Başarısız' : '⏳ Beklemede (Ödeme Tamamlanmadı)')}</div>
        <div><strong>Toplam Tutar:</strong> <span style="font-size:16px; font-weight:800; color:var(--admin-teal);">₺${Number(order.totalAmount || 0).toLocaleString('tr-TR')}</span></div>
      </div>

      <h4 style="margin:16px 0 8px; font-size:14px; color:var(--admin-teal-dark); display:flex; justify-content:space-between; align-items:center;">
        <span>🧾 GİB e-Arşiv Fatura Bilgileri</span>
        <span style="font-size:11px; padding:3px 8px; border-radius:4px; font-weight:700; ${
          order.invoiceStatus === 'SIGNED' ? 'background:#E8F5E9; color:#1B5E20; border:1px solid #A5D6A7;' :
          order.invoiceStatus === 'DRAFT' ? 'background:#FFF8E1; color:#F57F17; border:1px solid #FFE082;' :
          'background:#F3F4F6; color:#4B5563; border:1px solid #E5E7EB;'
        }">
          ${order.invoiceStatus === 'SIGNED' ? '✅ İmzalandı (Resmi Belge)' : (order.invoiceStatus === 'DRAFT' ? '⏳ GİB Taslak Hazır' : '⚠️ Fatura Henüz Kesilmedi')}
        </span>
      </h4>

      <div style="background:#F4F8F7; border:1px solid #D1E5E1; border-radius:8px; padding:12px 14px; font-size:12.5px; line-height:1.6; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span><strong>1. Kalem:</strong> Has Altın Bedeli (%0 KDV / Özel Matrah 351)</span>
          <strong>₺${bd.hasGoldAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span><strong>2. Kalem:</strong> İşçilik Bedeli (₺${bd.workmanshipNet.toLocaleString('tr-TR', {minimumFractionDigits:2})} Matrah + ₺${bd.workmanshipKdv.toLocaleString('tr-TR', {minimumFractionDigits:2})} KDV)</span>
          <strong>₺${bd.workmanshipTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; border-top:1px dashed #B8D6CF; padding-top:5px; margin-top:5px; font-weight:800; color:var(--admin-teal); font-size:13px;">
          <span>Toplam Fatura Tutarı:</span>
          <span>₺${Number(order.totalAmount || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
        </div>
        ${order.invoiceNumber ? `
          <div style="margin-top:10px; padding-top:8px; border-top:1px solid #D1E5E1; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span><strong>GİB Belge No:</strong> <span style="font-family:monospace; color:#084C47; font-weight:800;">${order.invoiceNumber}</span></span>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <button class="btn-admin-secondary" style="padding:4px 10px; font-size:11.5px; background:#FFF; border-color:#084C47; color:#084C47; font-weight:700;" onclick="AdminApp.viewInvoice('${order.invoiceUuid}')">
                📄 Resmi Faturayı Aç / Yazdır
              </button>
              <button class="btn-admin-secondary" style="padding:4px 10px; font-size:11.5px; background:#25D366; border-color:#25D366; color:#FFF; font-weight:700;" onclick="AdminApp.sendInvoiceViaWhatsApp('${order.orderId}')">
                📲 WhatsApp ile Faturayı Gönder
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      <h4 style="margin:14px 0 8px; font-size:14px; color:var(--admin-teal-dark);">Ürün Dökümü</h4>
      <div style="margin-bottom:20px;">
        ${itemsHtml || '<div>Ürün kaydı yok</div>'}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
        ${!order.isPaid && order.paymentStatus !== 'PAID' ? `
          <button class="btn-admin-primary" style="background:#196C3A; border-color:#196C3A;" onclick="AdminApp.confirmOrder('${order.orderId}')">
            ✅ Banka Tahsilatını Onayla
          </button>
        ` : `
          <button class="btn-admin-secondary" style="border-color:#E74C3C; color:#C0392B;" onclick="AdminApp.markOrderFailed('${order.orderId}')" title="Bu işlem mükerrer veya ödenmemiş ise iptal durumuna al">
            ❌ İptal / Başarısız Yap
          </button>
        `}
        ${order.invoiceStatus !== 'SIGNED' ? `
          <button class="btn-admin-primary" style="background:#084C47; border-color:#084C47;" onclick="AdminApp.startInvoiceSigning('${order.orderId}')">
            🧾 GİB e-Arşiv Fatura İmzala (SMS)
          </button>
        ` : ''}
        <button class="btn-admin-secondary" style="border-color:#EF9A9A; color:#C62828; font-weight:700;" onclick="AdminApp.deleteOrder('${order.orderId}')" title="Bu test siparişini veritabanından kalıcı olarak sil">
          🗑️ Kaydı Tamamen Sil
        </button>
        <button class="btn-admin-secondary" style="background:#F0F7F5; border-color:#084C47; color:#084C47; font-weight:700;" onclick="AdminApp.printDeliveryStatement('${order.orderId}')" title="Ürün Teslim, Kontrol ve Ödeme İşlemi Teyit Beyanını Aç">
          🛡️ Ürün Teslim Beyanı (28.08.2026)
        </button>
        <button class="btn-admin-secondary" style="background:#FAF8F2; border-color:#C2A768; color:#084C47; font-weight:700;" onclick="AdminApp.printLegalDocument('${order.orderId}')">
          📜 Zaman Damgalı Sözleşme & Delil Çıktısı Al
        </button>
        <button class="btn-admin-secondary" onclick="window.print()">🖨️ Dekont Yazdır</button>
        <button class="btn-admin-primary" onclick="AdminApp.closeModal()">Kapat</button>
      </div>
    `;

    modal.classList.add('open');
  },

  // SİPARİŞİ / TEST KAYDINI VERİTABANINDAN KALICI OLARAK SİL
  async deleteOrder(orderId) {
    if (!confirm(`⚠️ DİKKAT:\n\n${orderId} numaralı test/mükerrer sipariş kaydını veritabanından TAMAMEN SİLMEK istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      this.filterTable();
      return;
    }

    try {
      const res = await fetch('/api/admin/orders/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          orderId,
          adminKey: this.adminPin
        })
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`Sunucu bağlantısı kurulamadı (${res.status})`);
      }

      if (res.ok && data && data.success) {
        this.orders = this.orders.filter(o => o.orderId !== orderId);
        this.filteredOrders = this.filteredOrders.filter(o => o.orderId !== orderId);
        alert('✅ ' + (data.message || 'Kayıt başarıyla silindi.'));
        this.closeModal();
        this.loadOrders();
      } else {
        alert('❌ Hata: ' + (data?.message || `Silinemedi (${res.status}).`));
        this.filterTable();
      }
    } catch (e) {
      alert('❌ Bağlantı hatası: ' + e.message);
      this.filterTable();
    }
  },

  // İŞLEMİ BAŞARISIZ / İPTAL OLARAK İŞARETLE
  async markOrderFailed(orderId) {
    if (!confirm(`${orderId} numaralı işlemi 'Başarısız / İptal' olarak işaretlemek istiyor musunuz?\n\nBu işlem kaydı 'Onaylananlar (Tahsil Edilen)' listesinden çıkaracak ve ciroyu güncelleyecektir.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          orderId,
          status: 'FAILED',
          paymentStatus: 'FAILED',
          reason: 'Yönetici tarafından mükerrer/ödenmemiş olarak işaretlendi',
          adminKey: this.adminPin
        })
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`Sunucu bağlantısı kurulamadı (${res.status})`);
      }

      if (res.ok && data && data.success) {
        alert('✅ ' + (data.message || 'Durum güncellendi.'));
        this.closeModal();
        this.loadOrders();
      } else {
        alert('❌ Hata: ' + (data?.message || `Güncellenemedi (${res.status}).`));
      }
    } catch (e) {
      alert('❌ Bağlantı hatası: ' + e.message);
    }
  },

  // DURUM SÜTUNUNDAN DOĞRUDAN AÇILIR MENÜ (SELECT) İLE DURUM DEĞİŞTİRME / SİLME
  async quickChangeStatus(orderId, newStatus, selectEl) {
    if (newStatus === 'DELETE') {
      this.deleteOrder(orderId);
      return;
    }

    const statusLabels = {
      PAID: '✅ Tahsil Edildi (Onaylı)',
      PENDING: '⏳ Beklemede',
      FAILED: '❌ Başarısız / İptal'
    };

    if (!confirm(`${orderId} numaralı işlemin durumunu '${statusLabels[newStatus] || newStatus}' olarak güncellemek istediğinize emin misiniz?`)) {
      this.filterTable();
      return;
    }

    if (selectEl) selectEl.disabled = true;

    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          paymentStatus: newStatus,
          reason: `Yönetici tarafından durum '${newStatus}' olarak değiştirildi`,
          adminKey: this.adminPin
        })
      });

      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`Sunucu bağlantısı kurulamadı (${res.status})`);
      }

      if (res.ok && data && data.success) {
        const targetOrder = this.orders.find(o => o.orderId === orderId);
        if (targetOrder) {
          targetOrder.status = newStatus;
          targetOrder.paymentStatus = newStatus;
          targetOrder.isPaid = (newStatus === 'PAID');
        }
        if (typeof this.showToast === 'function') {
          this.showToast(`✅ ${orderId} durumu '${statusLabels[newStatus] || newStatus}' olarak güncellendi.`);
        }
        this.loadOrders();
      } else {
        alert('❌ Hata: ' + (data?.message || `Güncellenemedi (${res.status}).`));
        this.filterTable();
      }
    } catch (e) {
      alert('❌ Bağlantı hatası: ' + e.message);
      this.filterTable();
    } finally {
      if (selectEl) selectEl.disabled = false;
    }
  },

  // TOPLU FATURA KESME (BİRDEN FAZLA SİPARİŞİ TEK SMS İLE MÜHÜRLE)
  async startBatchInvoiceSigning() {
    const pendingOrders = this.orders.filter(o => {
      const isPaid = (o.status === 'PAID' || o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS' || o.isPaid === true);
      return isPaid && o.invoiceStatus !== 'SIGNED';
    });

    if (pendingOrders.length === 0) {
      alert('ℹ️ Faturası kesilecek onaylanmış sipariş bulunamadı.\n\n(Tüm tahsil edilen siparişlerin faturaları zaten imzalanmış durumdadır.)');
      return;
    }

    const totalBatchAmount = pendingOrders.reduce((sum, o) => {
      const amt = Number(o.totalAmount || o.total || (o.payment && o.payment.amount) || (o.amountInKurus ? o.amountInKurus / 100 : 0) || 0);
      return sum + amt;
    }, 0);

    if (!confirm(`🧾 TOPLU FATURA KESİMİ\n\nFaturası kesilecek ${pendingOrders.length} adet sipariş bulundu.\nToplam Tutar: ₺${totalBatchAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}\n\nBu siparişlerin tamamı için GİB üzerinde taslak açılıp telefonunuza TEK BİR SMS onay kodu gönderilecektir.\n\nOnaylıyor musunuz?`)) {
      return;
    }

    this.isBatchInvoice = true;
    this.batchPendingOrders = pendingOrders;

    const summaryBox = document.getElementById('smsModalOrderSummary');
    if (summaryBox) {
      const itemsListHtml = pendingOrders.map((o, idx) => `
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:2px;">
          <span>${idx + 1}. ${o.customerName || 'Müşteri'} (${o.orderId})</span>
          <span>₺${Number(o.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>
      `).join('');

      summaryBox.innerHTML = `
        <div style="font-weight:700; color:var(--admin-gold); margin-bottom:4px; font-size:12px;">🧾 Toplu Fatura Listesi (${pendingOrders.length} Adet Sipariş)</div>
        <div style="max-height:90px; overflow-y:auto; border:1px solid #E2E8F0; padding:4px 6px; border-radius:4px; margin-bottom:4px; background:#F8FAFC;">
          ${itemsListHtml}
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:800; color:var(--admin-teal); border-top:1px solid #D1E5E1; padding-top:3px;">
          <span>Genel Toplam:</span>
          <span>₺${totalBatchAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>
      `;
    }

    const input = document.getElementById('gibSmsInput');
    const errDiv = document.getElementById('smsErrorMsg');
    const submitBtn = document.getElementById('btnSubmitGibSms');
    if (input) input.value = '';
    if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<span>⏳ GİB Taslaklar Açılıyor & SMS Gönderiliyor...</span>'; }

    // SMS Modalını Aç
    const smsModal = document.getElementById('invoiceSmsModal');
    if (smsModal) smsModal.classList.add('open');

    try {
      const res = await fetch('/api/admin/invoice/batch-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': this.adminPin },
        body: JSON.stringify({
          orderIds: pendingOrders.map(o => o.orderId),
          adminKey: this.adminPin
        })
      });

      const data = await res.json();
      if (!data || !data.success) {
        alert('❌ Toplu Taslak Uyarısı:\n\n' + (data?.message || 'GİB bağlantısı kurulamadı.'));
        this.closeSmsModal();
        return;
      }

      this.activeInvoiceOid = data.oid || '';
      this.batchDraftItems = data.draftInvoices || [];

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>✅ Doğrula & Tüm Faturaları İmzala</span>';
      }
      if (input) setTimeout(() => input.focus(), 150);

      if (data.phone) {
        const phoneBox = document.getElementById('smsModalPhoneInfo');
        if (phoneBox) phoneBox.textContent = `Yetkili Telefon: ${data.phone}`;
      }
    } catch (e) {
      alert('❌ GİB Bağlantı Hatası: ' + e.message);
      this.closeSmsModal();
    }
  },

  // GİB E-ARŞİV FATURA İMZALAMA AKIŞINI BAŞLAT (TASLAK OLUŞTUR & SMS GÖNDER)
  async startInvoiceSigning(orderId) {
    this.isBatchInvoice = false;
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    this.activeInvoiceOrderId = orderId;
    const bd = this.calculateJewelryBreakdown(order.totalAmount);
    this.activeInvoiceBreakdown = bd;

    const summaryBox = document.getElementById('smsModalOrderSummary');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>Sipariş No:</strong> ${order.orderId}</span>
          <span><strong>Müşteri:</strong> ${order.customerName || 'Nihai Tüketici'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>1. Kalem Has Altın (%0 KDV):</strong> ₺${bd.hasGoldAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>2. Kalem İşçilik (%20 KDV):</strong> ₺${bd.workmanshipTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:800; color:var(--admin-teal); border-top:1px solid #D1E5E1; padding-top:3px; margin-top:3px;">
          <span>Toplam Fatura Tutarı:</span>
          <span>₺${Number(order.totalAmount || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
        </div>
      `;
    }

    const input = document.getElementById('gibSmsInput');
    const errDiv = document.getElementById('smsErrorMsg');
    const submitBtn = document.getElementById('btnSubmitGibSms');
    if (input) input.value = '';
    if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>'; }

    // Tek İstekle GİB Taslak ve SMS Tetikleme
    try {
      if (submitBtn) submitBtn.innerHTML = '<span>⏳ GİB Taslak & SMS Hazırlanıyor...</span>';
      let draftRes = await fetch('/api/admin/invoice/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          orderId: order.orderId,
          totalAmount: Number(order.totalAmount || order.total || (order.payment && order.payment.amount) || (order.amountInKurus ? order.amountInKurus / 100 : 0) || 0),
          adminKey: this.adminPin
        })
      });

      let draftData = await draftRes.json();

      if (!draftData || !draftData.success) {
        alert('❌ Taslak Fatura Uyarısı:\n\n' + (draftData?.message || 'GİB bağlantısı kurulamadı.') + '\n\n💡 İpucu: Başka bir sekmede earsivportal.efatura.gov.tr açık ise lütfen o sekmeden Güvenli Çıkış yapıp tekrar deneyiniz.');
        if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';
        return;
      }

      this.activeInvoiceUuid = draftData.invoiceUuid;
      this.activeInvoiceOid = draftData.oid || '';
      if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';

      // SMS Modalını Aç
      const smsModal = document.getElementById('invoiceSmsModal');
      if (smsModal) smsModal.classList.add('open');
      if (input) setTimeout(() => input.focus(), 150);

      if (draftData && draftData.phone) {
        const phoneBox = document.getElementById('smsModalPhoneInfo');
        if (phoneBox) {
          phoneBox.textContent = `Yetkili Telefon: ${draftData.phone}`;
        }
      }

      if (draftData && draftData.isMock) {
        if (errDiv) {
          errDiv.style.display = 'block';
          errDiv.style.color = '#084C47';
          errDiv.textContent = 'ℹ️ Test / Simülasyon Modu: Kod olarak 123456 girebilirsiniz.';
        }
      }
    } catch (e) {
      alert('❌ GİB Bağlantı Hatası: ' + e.message);
      if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';
    }
  },

  // TEKRAR SMS GÖNDER
  async resendInvoiceSms() {
    const btn = document.getElementById('btnResendGibSms');
    const errDiv = document.getElementById('smsErrorMsg');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ SMS Gönderiliyor...';
    }
    if (errDiv) { errDiv.style.display = 'none'; }

    try {
      const res = await fetch('/api/admin/invoice/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          orderId: this.activeInvoiceOrderId,
          adminKey: this.adminPin
        })
      });

      const data = await res.json();
      if (data && data.success) {
        this.activeInvoiceOid = data.oid || this.activeInvoiceOid;
        if (errDiv) {
          errDiv.style.display = 'block';
          errDiv.style.color = '#084C47';
          errDiv.textContent = `📲 ${data.message || 'SMS kodu tekrar iletildi.'}`;
        }
      } else {
        if (errDiv) {
          errDiv.style.display = 'block';
          errDiv.style.color = '#C81E1E';
          errDiv.textContent = data?.message || 'SMS gönderilemedi.';
        }
      }
    } catch (e) {
      if (errDiv) {
        errDiv.style.display = 'block';
        errDiv.style.color = '#C81E1E';
        errDiv.textContent = 'Bağlantı hatası: ' + e.message;
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📲 SMS Gelmedi mi? Kodu Tekrar Gönder';
      }
    }
  },

  // SMS KODUNU GÖNDER VE İMZALAT
  async submitInvoiceSms() {
    const input = document.getElementById('gibSmsInput');
    const errDiv = document.getElementById('smsErrorMsg');
    const submitBtn = document.getElementById('btnSubmitGibSms');
    const smsCode = (input?.value || '').trim();

    if (!smsCode || smsCode.length < 4) {
      if (errDiv) {
        errDiv.style.display = 'block';
        errDiv.style.color = '#C81E1E';
        errDiv.textContent = 'Lütfen en az 4-6 haneli SMS kodunu giriniz.';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳ GİB Faturası İmzalanıyor...</span>';
    }

    try {
      if (this.isBatchInvoice) {
        // TOPLU İMZALAMA İSTEĞİ
        const res = await fetch('/api/admin/invoice/batch-sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': this.adminPin },
          body: JSON.stringify({
            items: this.batchDraftItems || [],
            oid: this.activeInvoiceOid || '',
            smsCode: smsCode,
            adminKey: this.adminPin
          })
        });

        const data = await res.json();
        if (data && data.success) {
          alert(`🎉 TOPLU İMZA BAŞARILI!\n\n${data.signedCount || (this.batchDraftItems || []).length} adet siparişin faturası tek SMS ile GİB üzerinde resmi olarak imzalandı.`);
          if (this.batchPendingOrders) {
            this.batchPendingOrders.forEach(o => {
              o.invoiceStatus = 'SIGNED';
            });
          }
          this.closeSmsModal();
          this.filterTable();
        } else {
          if (errDiv) {
            errDiv.style.display = 'block';
            errDiv.style.color = '#C81E1E';
            errDiv.textContent = 'Hata: ' + (data?.message || 'Toplu imzalama başarısız oldu.');
          }
        }
      } else {
        // TEKİL İMZALAMA İSTEĞİ
        const res = await fetch('/api/admin/invoice/sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': this.adminPin
          },
          body: JSON.stringify({
            orderId: this.activeInvoiceOrderId,
            invoiceUuid: this.activeInvoiceUuid,
            oid: this.activeInvoiceOid || '',
            smsCode: smsCode,
            adminKey: this.adminPin
          })
        });

        const data = await res.json();
        if (data && data.success) {
          alert(`✅ Fatura Başarıyla İmzalandı!\n\nBelge No: ${data.invoiceNumber}\n\nFatura GİB e-Arşiv sistemine kaydedildi ve resmiyet kazandı.`);
          
          // Sipariş yerel durumunu güncelle
          const targetOrder = this.orders.find(o => o.orderId === this.activeInvoiceOrderId);
          if (targetOrder) {
            targetOrder.invoiceStatus = 'SIGNED';
            targetOrder.invoiceNumber = data.invoiceNumber;
            targetOrder.invoiceUuid = this.activeInvoiceUuid;
          }

          this.closeSmsModal();
          this.filterTable();
          if (this.activeInvoiceOrderId) {
            this.showDetail(this.activeInvoiceOrderId);
          }
        } else {
          if (errDiv) {
            errDiv.style.display = 'block';
            errDiv.style.color = '#C81E1E';
            errDiv.textContent = 'Hata: ' + (data?.message || 'İmzalama başarısız oldu.');
          }
        }
      }
    } catch (e) {
      if (errDiv) {
        errDiv.style.display = 'block';
        errDiv.style.color = '#C81E1E';
        errDiv.textContent = 'Bağlantı hatası: ' + e.message;
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';
      }
    }
  },

  // İMZALANMIŞ FATURAYI YENİ SEKMEDE GÖRÜNTÜLE
  viewInvoice(invoiceUuid, orderId) {
    const url = `/api/admin/invoice/view?uuid=${encodeURIComponent(invoiceUuid || '')}&orderId=${encodeURIComponent(orderId || '')}&adminKey=${encodeURIComponent(this.adminPin)}`;
    window.open(url, '_blank');
  },

  // FATURAYI MÜŞTERİYE WHATSAPP İLE GÖNDER
  sendInvoiceViaWhatsApp(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    let phone = String(order.customerPhone || order.customer?.phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '9' + phone;
    if (!phone.startsWith('90') && phone.length === 10) phone = '90' + phone;

    const invoiceUrl = `https://belginkuyumculuk.com/api/admin/invoice/view?uuid=${order.invoiceUuid || ''}&adminKey=1999`;
    const customerName = order.customerName || order.customer?.name || 'Değerli Müşterimiz';
    const amount = Number(order.totalAmount || order.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const invoiceNo = order.invoiceNumber || 'GİB e-Arşiv Faturanız';

    const msg = `Sayın *${customerName}*,\n\nBelgin Kuyumculuk'tan yapmış olduğunuz *₺${amount}* tutarındaki alışverişinize ait resmi GİB e-Arşiv faturanız düzenlenmiştir.\n\n🧾 *Fatura No:* ${invoiceNo}\n📄 *Faturayı Görüntüle & İndir:*\n${invoiceUrl}\n\nBizi tercih ettiğiniz için teşekkür eder, sağlıklı ve bol kazançlı günler dileriz.\n\n*Belgin Kuyumculuk*\nMenderes Cad. No:231/B Buca / İzmir\n0 (541) 930 52 72`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  },

  closeSmsModal() {
    const modal = document.getElementById('invoiceSmsModal');
    if (modal) modal.classList.remove('open');
    // Eğer imzalanmadan kapatıldıysa oturumu arka planda serbest bırak
    if (this.activeInvoiceOrderId) {
      fetch('/api/admin/invoice/force-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': this.adminPin },
        body: JSON.stringify({ adminKey: this.adminPin })
      }).catch(() => {});
    }
    this.activeInvoiceOrderId = null;
    this.activeInvoiceUuid = null;
  },

  async confirmOrder(orderId) {
    if (!confirm(`${orderId} numaralı siparişin bankadan tahsil edildiğini onaylıyor musunuz?\n\nBu işlem siparişi 'Tahsil Edildi' durumuna geçirir ve muhasebe@belginkuyumculuk.com adresine otomatik resmi bildirim gönderir.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/orders/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({ orderId, adminKey: this.adminPin })
      });

      const data = await res.json();
      if (data && data.success) {
        alert('✅ ' + data.message);
        this.closeModal();
        this.loadOrders();
      } else {
        alert('❌ Hata: ' + (data.message || 'Onaylanamadı.'));
      }
    } catch (e) {
      alert('❌ Bağlantı hatası: ' + e.message);
    }
  },

  closeModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.remove('open');
  },

  // MOBİL PUSH BİLDİRİM TESTİ GÖNDER
  async sendTestPush(evt) {
    const btn = evt?.currentTarget;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Gönderiliyor...';
    }
    try {
      const res = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          adminKey: this.adminPin,
          amount: 120000
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ 120.000 TL Test Ödeme Bildirimi ntfy üzerinden telefonunuza gönderildi!\n\nLütfen telefonunuzdaki ntfy uygulamasını ve kilit ekranınızı kontrol ediniz.');
      } else {
        alert('❌ Bildirim gönderilemedi: ' + (data.message || data.error || 'Bilinmeyen hata'));
      }
    } catch (e) {
      alert('❌ Bildirim gönderilirken hata oluştu: ' + e.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📱 Test Bildirimi</span>';
      }
    }
  },

  // EXCEL / CSV RAPORU İNDİR
  exportToCsv() {
    if (!this.orders || this.orders.length === 0) {
      alert('Dışa aktarılacak ödeme kaydı bulunamadı.');
      return;
    }

    const headers = ['Sipariş No', 'Hukuki Delil ID', 'Tarih', 'Müşteri Adı', 'T.C. Kimlik / Pasaport', 'Fatura Adresi', 'Telefon', 'E-Posta', 'Tutar (TL)', 'POS Kanalı', 'Ödeme Durumu', 'Teslimat'];
    const rows = this.orders.map(o => [
      `"${o.orderId}"`,
      `"${o.evidenceId || o.orderId}"`,
      `"${new Date(o.createdAt).toLocaleString('tr-TR')}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.customerIdentity || '').replace(/"/g, '""')}"`,
      `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.customerEmail || ''}"`,
      `"${Number(o.totalAmount || 0)}"`,
      `"${o.provider || 'AKBANK'}"`,
      `"${o.paymentStatus || o.status}"`,
      `"${o.deliveryMethod || 'showroom'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Belgin_Kuyumculuk_Tahsilat_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
