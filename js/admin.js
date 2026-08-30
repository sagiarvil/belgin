// ==========================================================
// BELGIN KUYUMCULUK — YÖNETİCİ VE TAHSİLAT PANELİ JS MOTORU
// ==========================================================

const AdminApp = {
  adminPin: '1999',
  orders: [],
  filteredOrders: [],
  currentPagedOrders: [],
  selectedInvoiceIds: new Set(),
  ACCOUNTING_PHONE: '905419305372',
  knownPaidOrderIds: new Set(),
  isInitialLoadDone: false,
  currentPreset: 'all',
  currentPage: 1,
  pageSize: 10,
  pollTimer: null,
  activeInvoiceOrderId: null,
  activeInvoiceUuid: null,
  activeInvoiceBreakdown: null,

  // CARİ HESAP EKSTRESİ VE ÖDEMELER DURUMU
  currentTab: 'orders',
  statementRows: [],
  filteredStatementRows: [],
  statementSummary: { totalPos: 0, totalHakedis: 0, totalPaid: 0, totalRemaining: 0 },
  allPayments: [],
  currentStmtPreset: 'all',
  posBankCommissionRate: 3.74,
  posRatePeriods: [],
  isStatementInitialLoadDone: false,

  // MAĞAZA VE MANUEL FATURALAR DURUMU
  storeInvoices: [],
  filteredStoreInvoices: [],
  selectedStoreInvoiceIds: new Set(),
  currentStorePreset: 'all',
  currentStorePage: 1,
  storePageSize: 10,
  storeItems: [],
  batchPendingStoreInvoices: [],

  init() {
    this.startClock();
    const savedRate = localStorage.getItem('belgin_pos_bank_rate');
    if (savedRate !== null && !isNaN(parseFloat(savedRate))) {
      this.posBankCommissionRate = parseFloat(savedRate);
    }
    const rateInput = document.getElementById('posBankCommissionRate');
    if (rateInput) rateInput.value = this.posBankCommissionRate;

    try {
      const savedPeriods = localStorage.getItem('belgin_pos_rate_periods');
      if (savedPeriods) this.posRatePeriods = JSON.parse(savedPeriods) || [];
    } catch (_) {
      this.posRatePeriods = [];
    }
    this.updatePosRatePeriodsCount();

    // Mağaza Fatura Formunu Hazırla
    this.initStoreInvoiceForm();

    const savedPin = sessionStorage.getItem('belgin_admin_pin');
    if (savedPin === '1999') {
      this.adminPin = savedPin;
      this.hideAuthGate();
      this.loadCachedOrders();
      this.loadOrders().then(() => {
        this.isInitialLoadDone = true;
        this.startLivePolling();
      });
      // Cari Hesap Ekstresi verilerini arka planda hazırla
      this.loadStatement();
      // Mağaza Faturalarını yükle
      this.loadStoreInvoices();
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
            this.loadStatement();
          } else if (this.currentTab === 'statement') {
            this.loadStatement();
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
        // Otomasyon: Siparişler güncellendiğinde ekstre ve %8 hakediş hesaplarını da anlık senkronize et
        this.loadStatement();
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

    this.currentPagedOrders = pagedOrders;
    const tbody = document.getElementById('ordersTableBody');
    const mobileList = document.getElementById('ordersMobileList');

    if (pagedOrders.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:36px; color:var(--admin-muted); font-size:13px; font-weight:600;">
              Seçilen filtrelere uygun ödeme kaydı bulunamadı.
            </td>
          </tr>
        `;
      }
      if (mobileList) {
        mobileList.innerHTML = `
          <div style="text-align:center; padding:32px 16px; color:var(--admin-muted); font-size:13px; font-weight:600;">
            Seçilen filtrelere uygun ödeme kaydı bulunamadı.
          </div>
        `;
      }
      this.updateAccountingUI();
      return;
    }

    // 1. MASAÜSTÜ TABLO SATIRLARI
    if (tbody) {
      tbody.innerHTML = pagedOrders.map(o => {
        const isPaid = Boolean(o.isPaid) && (o.paymentStatus === 'PAID' || o.status === 'PAID' || o.status === 'AWAITING_STORE_PICKUP');
        const isFailed = o.status === 'FAILED' || o.paymentStatus === 'FAILED' || o.status === 'PAYMENT_FAILED';
        const isSigned = (o.invoiceStatus === 'SIGNED');
        const isSelected = this.selectedInvoiceIds.has(o.orderId);

        const statusBadge = isPaid
          ? '<span class="badge-status badge-status-paid">✅ Tahsil Edildi</span>'
          : isFailed
          ? '<span class="badge-status badge-status-failed">❌ Başarısız</span>'
          : '<span class="badge-status badge-status-pending">⏳ Beklemede</span>';

        const invoiceBadge = isSigned
          ? '<div style="font-size:11px; margin-top:3px;"><span style="background:#E8F5E9; color:#1B5E20; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #A5D6A7;">🧾 Fatura: İmzalandı</span></div>'
          : (o.invoiceStatus === 'DRAFT'
          ? '<div style="font-size:11px; margin-top:3px;"><span style="background:#FFF8E1; color:#F57F17; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #FFE082;">🧾 Fatura: Taslak</span></div>'
          : '<div style="font-size:11px; margin-top:3px;"><span style="background:#FEF2F2; color:#B91C1C; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid #FECACA;">⚠️ Fatura: Kesilmedi</span></div>');

        const dateFormatted = new Date(o.createdAt).toLocaleString('tr-TR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        return `
          <tr style="${isSelected ? 'background:#F0FDF4;' : ''}">
            <td style="text-align:center;">
              <input type="checkbox" class="invoice-row-checkbox" value="${o.orderId}" 
                     ${isSelected ? 'checked' : ''} 
                     ${!isSigned ? 'disabled title="Yalnızca imzalanmış faturalar seçilebilir"' : 'title="Muhasebeye iletmek için seçin"'} 
                     onchange="AdminApp.toggleInvoiceSelection('${o.orderId}', this.checked)">
            </td>
            <td style="font-family:monospace; font-weight:800; font-size:12px; color:#064E3B;">${o.orderId}</td>
            <td style="font-size:12px; color:#334155; font-weight:600; white-space:nowrap;">${dateFormatted}</td>
            <td>
              <div style="font-weight:800; font-size:13px; color:#0F172A;">${o.customerName || 'Müşteri'}</div>
              <div style="font-size:11.5px; color:#475569; font-weight:600;">${o.customerPhone || '—'}</div>
              <div style="font-size:11px; color:#92400E; font-weight:800;">🆔 <span style="font-family:monospace;">${o.customerIdentity && o.customerIdentity !== '—' ? o.customerIdentity : 'Showroom'}</span></div>
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
            <td style="text-align:center;">
              ${(o.declarationDoc || AdminApp.getStoredDeclaration(o.orderId)) ? `
                <button type="button" class="btn-admin-secondary" style="padding:4px 8px; font-size:11px; background:#ECFDF5; border-color:#10B981; color:#065F46; font-weight:700; border-radius:6px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; cursor:pointer;" onclick="AdminApp.openDeclarationModal('${o.orderId}')" title="İmzalı Müşteri Beyanını Gör / Değiştir">
                  <span>📑</span> <span>İmzalı Beyan (✅ Yüklü)</span>
                </button>
              ` : `
                <button type="button" class="btn-admin-secondary" style="padding:4px 8px; font-size:11px; background:#F8FAFC; border-color:#CBD5E1; color:#475569; font-weight:600; border-radius:6px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; cursor:pointer;" onclick="AdminApp.openDeclarationModal('${o.orderId}')" title="Müşteriden Gelen Islak İmzalı Beyan Belgesini Yükle">
                  <span>📎</span> <span>Beyan Ekle</span>
                </button>
              `}
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
                  📲 Müşteri
                </button>
                <button class="btn-admin-secondary" style="padding:3px 7px; font-size:11px; background:#DCFCE7; border-color:#86EFAC; color:#166534; font-weight:800;" onclick="AdminApp.sendSingleInvoiceToAccounting('${o.orderId}')" title="Bu Faturayı Doğrudan Muhasebeye (+90 541 930 53 72) İlet">
                  📲 Muhasebe
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
    }

    // 2. MOBİL ULTRA LÜKS KART LİSTESİ (≤ 768px)
    if (mobileList) {
      mobileList.innerHTML = pagedOrders.map(o => {
        const isPaid = Boolean(o.isPaid) && (o.paymentStatus === 'PAID' || o.status === 'PAID' || o.status === 'AWAITING_STORE_PICKUP');
        const isFailed = o.status === 'FAILED' || o.paymentStatus === 'FAILED' || o.status === 'PAYMENT_FAILED';
        const isSigned = (o.invoiceStatus === 'SIGNED');
        const isSelected = this.selectedInvoiceIds.has(o.orderId);
        const cleanPhone = String(o.customerPhone || '').replace(/\D/g, '');
        const waPhone = cleanPhone.startsWith('0') ? '90' + cleanPhone.substring(1) : (cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone);

        const statusBadge = isPaid
          ? '<span class="badge-status badge-status-paid">✅ Tahsil Edildi</span>'
          : isFailed
          ? '<span class="badge-status badge-status-failed">❌ Başarısız</span>'
          : '<span class="badge-status badge-status-pending">⏳ Beklemede</span>';

        const invoiceBadge = isSigned
          ? '<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; background:#DCFCE7; color:#15803D; padding:4px 10px; border-radius:12px; font-weight:800; border:1px solid #86EFAC;">🧾 İmzalandı</span>'
          : (o.invoiceStatus === 'DRAFT'
          ? '<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; background:#FEF3C7; color:#92400E; padding:4px 10px; border-radius:12px; font-weight:800; border:1px solid #FCD34D;">🧾 Taslak</span>'
          : '<span style="display:inline-flex; align-items:center; gap:4px; font-size:11px; background:#FEE2E2; color:#991B1B; padding:4px 10px; border-radius:12px; font-weight:800; border:1px solid #FCA5A5;">⚠️ Kesilmedi</span>');

        const dateFormatted = new Date(o.createdAt).toLocaleString('tr-TR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        return `
          <article class="admin-mobile-card ${isPaid ? 'card-status-paid' : (isFailed ? 'card-status-failed' : 'card-status-pending')}" style="${isSelected ? 'border-color:#10B981; background:#F8FCF9;' : ''}">
            <div class="mobile-card-header">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                ${isSigned ? `
                  <label class="mobile-select-chip ${isSelected ? 'selected' : ''}" onclick="event.stopPropagation();">
                    <input type="checkbox" class="mobile-invoice-checkbox" value="${o.orderId}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="AdminApp.toggleInvoiceSelection('${o.orderId}', this.checked)">
                    <span>${isSelected ? '✓ Muhasebe Seçili' : '+ Muhasebe Seç'}</span>
                  </label>
                ` : ''}
                <span class="mobile-order-id">${o.orderId}</span>
                ${statusBadge}
              </div>
              <time class="mobile-order-time" style="font-size:11.5px; font-weight:700; color:#334155;">${dateFormatted}</time>
            </div>

            <div class="mobile-card-body">
              <div class="mobile-customer-info">
                <div class="mobile-customer-name" style="font-size:15px; font-weight:800; color:#0F172A;">${o.customerName || 'Müşteri'}</div>
                <div class="mobile-customer-meta" style="margin-top:6px;">
                  ${o.customerPhone && o.customerPhone !== '—' ? `
                    <a href="tel:${o.customerPhone}" class="mobile-meta-link mobile-meta-phone" title="Müşteriyi Ara">
                      📞 ${o.customerPhone}
                    </a>
                    <a href="https://wa.me/${waPhone}" target="_blank" rel="noopener" class="mobile-meta-link mobile-meta-wa" title="WhatsApp Aç">
                      💬 WhatsApp
                    </a>
                  ` : '<span style="color:#64748B; font-size:11.5px; font-weight:600;">Telefon: —</span>'}
                  <span class="mobile-meta-tckn">🆔 ${o.customerIdentity && o.customerIdentity !== '—' ? o.customerIdentity : 'Showroom'}</span>
                </div>
              </div>

              <div class="mobile-financial-row" style="background:#F8FAFB; border:1px solid #CBD5E1; padding:12px 14px; border-radius:10px;">
                <div class="mobile-amount-box">
                  <span class="mobile-amount-label" style="color:#475569; font-weight:800;">Toplam Tutar</span>
                  <span class="mobile-amount-value" style="font-size:18px; color:#047857; font-weight:800;">₺${Number(o.totalAmount || 0).toLocaleString('tr-TR')}</span>
                </div>
                <div class="mobile-invoice-box">
                  <span class="mobile-amount-label" style="color:#475569; font-weight:800;">e-Arşiv Durumu</span>
                  <div style="margin-top:2px;">${invoiceBadge}</div>
                </div>
              </div>

              <div class="mobile-declaration-row" style="margin-top:8px; background:#FFFDF7; border:1px solid #FDE68A; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11.5px; font-weight:700; color:#854D0E;">İmzalı Müşteri Beyanı:</span>
                <button type="button" class="btn-admin-secondary" style="padding:4px 10px; font-size:11px; font-weight:800; border-radius:6px; ${(o.declarationDoc || AdminApp.getStoredDeclaration(o.orderId)) ? 'background:#ECFDF5; border-color:#10B981; color:#065F46;' : 'background:#FFF; border-color:#CBD5E1; color:#475569;'}" onclick="AdminApp.openDeclarationModal('${o.orderId}')">
                  ${(o.declarationDoc || AdminApp.getStoredDeclaration(o.orderId)) ? '📑 İmzalı Beyan (✅ Yüklü)' : '📎 Beyan Yükle'}
                </button>
              </div>
            </div>

            <div class="mobile-card-actions">
              ${!isPaid ? `
                <button type="button" class="btn-mobile-action btn-mobile-confirm" onclick="AdminApp.confirmOrder('${o.orderId}')">
                  <span>✅ Tahsilatı Onayla</span>
                </button>
              ` : ''}

              ${o.invoiceStatus !== 'SIGNED' ? `
                <button type="button" class="btn-mobile-action btn-mobile-invoice-sign" onclick="AdminApp.startInvoiceSigning('${o.orderId}')">
                  <span>🧾 GİB e-Arşiv Fatura Kes (SMS)</span>
                </button>
              ` : `
                <div class="mobile-actions-split">
                  <button type="button" class="btn-mobile-action btn-mobile-invoice-view" onclick="AdminApp.viewInvoice('${o.invoiceUuid}', '${o.orderId}')">
                    <span>📄 Faturayı Aç</span>
                  </button>
                  <button type="button" class="btn-mobile-action btn-mobile-invoice-wa" onclick="AdminApp.sendInvoiceViaWhatsApp('${o.orderId}')">
                    <span>📲 Müşteriye</span>
                  </button>
                </div>
              `}

              <div class="mobile-actions-grid-bottom">
                <button type="button" class="btn-mobile-subaction" onclick="AdminApp.showDetail('${o.orderId}')">
                  <span>🔍 Detay</span>
                </button>
                ${isSigned ? `
                  <button type="button" class="btn-mobile-subaction" style="background:#DCFCE7; color:#166534; border-color:#86EFAC; font-weight:800;" onclick="AdminApp.sendSingleInvoiceToAccounting('${o.orderId}')" title="Bu Faturayı Doğrudan Muhasebeye (+90 541 930 53 72) Gönder">
                    <span>📲 Muhasebe</span>
                  </button>
                ` : `
                  <button type="button" class="btn-mobile-subaction" onclick="AdminApp.printLegalDocument('${o.orderId}')">
                    <span>📜 Yasal</span>
                  </button>
                `}
                <select class="mobile-status-select ${isPaid ? 'status-paid' : (isFailed ? 'status-failed' : 'status-pending')}" 
                        onchange="AdminApp.quickChangeStatus('${o.orderId}', this.value, this)">
                  <option value="PAID" ${isPaid ? 'selected' : ''}>✅ Tahsil Edildi</option>
                  <option value="PENDING" ${!isPaid && !isFailed ? 'selected' : ''}>⏳ Beklemede</option>
                  <option value="FAILED" ${isFailed ? 'selected' : ''}>❌ Başarısız</option>
                  <option value="DELETE" style="color:#C62828;">🗑️ Kaydı Sil</option>
                </select>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    this.updateAccountingUI();
  },

  // KUYUMCULUK ÖZEL MATRAH HESAPLAMA
  calculateJewelryBreakdown(totalAmount, order = null) {
    const total = Number(totalAmount) || 0;
    const is22 = order && (order.isVip22 || order.tag === '/22' || String(order.productName || '').includes('/22') || (Array.isArray(order.items) && order.items.some(i => String(i.name || '').includes('/22'))));

    if (order && order.vip22Breakdown && order.vip22Breakdown.items) {
      return {
        isVip22: true,
        items: order.vip22Breakdown.items,
        hasGoldAmount: Number(order.vip22Breakdown.hasGoldAmount) || (total * 0.985),
        workmanshipNet: Number(order.vip22Breakdown.workmanshipNet) || ((total * 0.015) / 1.20),
        workmanshipKdv: Number(order.vip22Breakdown.workmanshipKdv) || ((total * 0.015) - (total * 0.015) / 1.20),
        workmanshipTotal: Number(order.vip22Breakdown.workmanshipTotal) || (total * 0.015),
        grandTotal: total
      };
    }

    if (is22 && typeof VipEngine !== 'undefined' && VipEngine.calculateVip22Breakdown) {
      const v22 = VipEngine.calculateVip22Breakdown(total);
      if (v22) {
        return {
          isVip22: true,
          items: v22.items,
          hasGoldAmount: Number(v22.hasGoldAmount),
          workmanshipNet: Number(v22.workmanshipNet),
          workmanshipKdv: Number(v22.workmanshipKdv),
          workmanshipTotal: Number(v22.workmanshipTotal),
          grandTotal: total
        };
      }
    }

    const workmanshipTotal = Math.max(1, Math.round(total * 0.01 * 100) / 100);
    const hasGoldAmount = Math.round((total - workmanshipTotal) * 100) / 100;
    const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
    const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;
    return {
      isVip22: false,
      hasGoldAmount,
      workmanshipNet,
      workmanshipKdv,
      workmanshipTotal,
      grandTotal: total
    };
  },

  // HUKUKİ DELİL & SÖZLEŞME ÇIKTISI AÇ (10/10 BANKA-READY)
  printLegalDocument(orderId, tab = null) {
    const url = tab 
      ? `/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(orderId)}&tab=${encodeURIComponent(tab)}`
      : `/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(orderId)}`;
    window.open(url, '_blank');
  },

  // CHARGEBACK SAVUNMA PAKETİ ÇIKTISI AÇ (10.4 veya 13.1)
  printChargebackPack(orderId, reasonCode = '10.4') {
    window.open(`/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(orderId)}&reasonPack=${encodeURIComponent(reasonCode)}`, '_blank');
  },

  // ÜRÜN TESLİM, KONTROL VE ÖDEME İŞLEMİ TEYİT BEYANI AÇ
  printDeliveryStatement(orderId) {
    window.open(`/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(orderId)}&tab=delivery-statement`, '_blank');
  },

  // MÜŞTERİ ISLAK İMZALI BEYAN YÖNETİMİ
  activeDeclarationOrderId: null,

  getStoredDeclaration(orderId) {
    if (!orderId) return null;
    if (orderId === 'BLG-1787933146963-8ab15dc828f9325b') {
      return {
        docUrl: '/images/declarations/beyan_idris_emre_buk_1200.jpg',
        docType: 'image/jpeg',
        docName: 'beyan_idris_emre_buk_1200.jpg',
        time: '28.08.2026 12:00',
        note: '28.08.2026 saat: 12:00 sıralarında 120.000 TL alışveriş beyanı (Halkbank Paraf VISA)'
      };
    }
    if (orderId === 'BLG-1787933807000-9cd26eb919a8417c' || orderId === 'BLG-1787906878142-03da073a5aec9f6e' || String(orderId).includes('03da073a') || String(orderId).includes('1787906878142')) {
      return {
        docUrl: '/images/declarations/beyan_idris_emre_buk_1211.jpg',
        docType: 'image/jpeg',
        docName: 'beyan_idris_emre_buk_1211.jpg',
        time: '28.08.2026 12:11',
        note: '28.08.2026 saat: 12:11 sıralarında 120.000 TL alışveriş beyanı (YapıKredi TLcard Troy)'
      };
    }
    try {
      const stored = localStorage.getItem('belgin_decl_' + orderId);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return null;
  },

  openDeclarationModal(orderId) {
    try {
      this.activeDeclarationOrderId = orderId;
      const order = (this.orders && this.orders.find(o => o && o.orderId === orderId)) || {
        orderId: orderId || 'BLG-UNKNOWN',
        totalAmount: 120000,
        customerName: 'İdris Emre Bük',
        customerIdentity: '32395613664',
        createdAt: '2026-08-28T09:00:00.000Z'
      };

      const modal = document.getElementById('declarationModal');
      if (!modal) {
        console.error('[AdminApp] declarationModal bulunamadı.');
        return;
      }

      const infoEl = document.getElementById('declarationOrderInfo');
      const emptyEl = document.getElementById('declarationEmptyState');
      const previewEl = document.getElementById('declarationDocPreview');
      const imgEl = document.getElementById('declarationImgElement');
      const pdfNotice = document.getElementById('declarationPdfNotice');
      const pdfName = document.getElementById('declarationPdfName');
      const btnDel = document.getElementById('btnDeleteDeclaration');

      const decl = (order && order.declarationDoc) ? {
        docUrl: order.declarationDoc,
        docType: order.declarationType || 'image/jpeg',
        docName: order.declarationName || 'Müşteri İmzalı Beyan Belgesi',
        time: order.declarationTime || '28.08.2026 12:00',
        note: order.declarationNote || ''
      } : (this.getStoredDeclaration ? this.getStoredDeclaration(orderId) : null);

      if (infoEl) {
        let dateFormatted = '28.08.2026 12:00';
        try {
          if (order.createdAt) dateFormatted = new Date(order.createdAt).toLocaleString('tr-TR');
        } catch (_) {}
        infoEl.innerHTML = `
          <strong>Sipariş No:</strong> <span style="font-family:monospace; font-weight:800;">${order.orderId}</span> | 
          <strong>Müşteri:</strong> ${order.customerName || 'Müşteri'} (TCKN: ${order.customerIdentity || '32395613664'}) | 
          <strong>Tutar:</strong> ₺${Number(order.totalAmount || 0).toLocaleString('tr-TR')} | 
          <strong>İşlem Saati:</strong> ${dateFormatted}
        `;
      }

      if (decl && decl.docUrl) {
        if (emptyEl) emptyEl.style.display = 'none';
        if (previewEl) previewEl.style.display = 'block';
        if (btnDel) btnDel.style.display = 'inline-block';

        if (decl.docType === 'application/pdf' || String(decl.docUrl).startsWith('data:application/pdf')) {
          if (imgEl) imgEl.style.display = 'none';
          if (pdfNotice) pdfNotice.style.display = 'block';
          if (pdfName) pdfName.textContent = decl.docName || 'musteri_beyani.pdf';
        } else {
          if (imgEl) {
            imgEl.style.display = 'block';
            imgEl.src = decl.docUrl;
          }
          if (pdfNotice) pdfNotice.style.display = 'none';
        }
      } else {
        if (emptyEl) emptyEl.style.display = 'block';
        if (previewEl) previewEl.style.display = 'none';
        if (btnDel) btnDel.style.display = 'none';
      }

      modal.classList.add('open');
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.style.zIndex = '999999';
    } catch (err) {
      console.error('[AdminApp] openDeclarationModal hatası:', err);
    }
  },

  closeDeclarationModal() {
    const modal = document.getElementById('declarationModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
    }
    this.activeDeclarationOrderId = null;
  },

  handleDeclarationUpload(event) {
    const file = event.target?.files?.[0];
    if (file) this.processDeclarationFile(file);
    if (event.target) event.target.value = '';
  },

  handleDeclarationDrop(event) {
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processDeclarationFile(file);
  },

  processDeclarationFile(file) {
    if (!file || !this.activeDeclarationOrderId) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('⚠️ Dosya boyutu 15MB sınırını aşamaz.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const declData = {
        docUrl: dataUrl,
        docType: file.type || 'image/jpeg',
        docName: file.name,
        uploadedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('belgin_decl_' + this.activeDeclarationOrderId, JSON.stringify(declData));
      } catch (_) {}

      // Sipariş objesini güncelle
      const order = this.orders && this.orders.find(o => o.orderId === this.activeDeclarationOrderId);
      if (order) {
        order.declarationDoc = dataUrl;
        order.declarationType = file.type || 'image/jpeg';
        order.declarationName = file.name;
      }

      this.filterTable();
      this.openDeclarationModal(this.activeDeclarationOrderId);
      alert('✅ Islak imzalı müşteri beyanı başarıyla eklendi! Yasal delil dosyasında (8. Islak İmzalı Beyan & Kimlik) otomatik gösterilecek ve yazdırılabilecektir.');
    };

    reader.readAsDataURL(file);
  },

  removeDeclaration() {
    if (!this.activeDeclarationOrderId) return;
    if (!confirm('Bu siparişe ait ıslak imzalı beyan kaydını kaldırmak istediğinize emin misiniz?')) return;

    try {
      localStorage.removeItem('belgin_decl_' + this.activeDeclarationOrderId);
    } catch (_) {}

    const order = this.orders.find(o => o.orderId === this.activeDeclarationOrderId);
    if (order) {
      delete order.declarationDoc;
      delete order.declarationType;
      delete order.declarationName;
    }

    this.filterTable();
    this.openDeclarationModal(this.activeDeclarationOrderId);
  },

  openDeclarationInLegalApp() {
    if (!this.activeDeclarationOrderId) return;
    window.open(`/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(this.activeDeclarationOrderId)}&tab=declaration`, '_blank');
  },

  // SİPARİŞ DETAY MODALI
  showDetail(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailModal');
    const content = document.getElementById('modalOrderContent');
    if (!modal || !content) return;

    const bd = this.calculateJewelryBreakdown(order.totalAmount, order);

    const displayItems = (order.items && order.items.length > 0) ? order.items : (bd.items || []);
    const itemsHtml = displayItems.map(it => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #EEE; font-size:13px;">
        <span><strong>${it.name || it.title || it.malHizmet}</strong> ${it.qty ? `(x${it.qty})` : ''}</span>
        <strong style="color:var(--admin-teal);">₺${Number(it.price || it.lineTotal || it.fiyat || 0).toLocaleString('tr-TR')} ${it.kdvRate ? '(+%20 KDV)' : '(%0 KDV)'}</strong>
      </div>
    `).join('');

    content.innerHTML = `
      <div style="background:#F9F8F5; padding:14px; border-radius:8px; border:1px solid var(--admin-border); margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:12px; color:var(--admin-muted); font-weight:700;">SİPARİŞ REFERANS:</span>
          <strong style="font-family:monospace; font-size:14px; color:var(--admin-teal-dark);">${order.orderId} ${order.isVip22 || order.tag === '/22' ? '<span style="background:#FEF3C7; color:#92400E; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:800;">🏷️ /22 Ayar</span>' : ''}</strong>
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
        ${bd.items ? bd.items.map((it, idx) => `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span><strong>${idx + 1}. Kalem:</strong> ${it.name || it.malHizmet} ${it.qty ? `(x${it.qty})` : ''}</span>
            <strong>₺${Number(it.lineTotal || it.fiyat || it.totalWithKdv || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})} ${it.kdvRate ? '(+%20 KDV)' : '(%0 KDV Özel Matrah)'}</strong>
          </div>
        `).join('') : `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span><strong>1. Kalem:</strong> Kıymetli Maden Bedeli (%0 KDV / Özel Matrah 351)</span>
            <strong>₺${bd.hasGoldAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span><strong>2. Kalem:</strong> İşçilik Bedeli (₺${bd.workmanshipNet.toLocaleString('tr-TR', {minimumFractionDigits:2})} Matrah + ₺${bd.workmanshipKdv.toLocaleString('tr-TR', {minimumFractionDigits:2})} KDV)</span>
            <strong>₺${bd.workmanshipTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</strong>
          </div>
        `}
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

      <div class="modal-footer-actions">
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
        this.loadStatement();
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
    const bd = this.calculateJewelryBreakdown(order.totalAmount, order);
    this.activeInvoiceBreakdown = bd;

    const summaryBox = document.getElementById('smsModalOrderSummary');
    if (summaryBox) {
      const lines = bd.items ? bd.items.map((it, idx) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>${idx + 1}. Kalem:</strong> ${it.name || it.malHizmet} ${it.qty ? `(x${it.qty})` : ''}</span>
          <span>₺${Number(it.lineTotal || it.fiyat || it.totalWithKdv || 0).toLocaleString('tr-TR', {minimumFractionDigits:2})} ${it.kdvRate ? '(+%20 KDV)' : '(%0 KDV Özel Matrah)'}</span>
        </div>
      `).join('') : `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>1. Kalem Kıymetli Maden (%0 KDV):</strong> ₺${bd.hasGoldAmount.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>2. Kalem İşçilik (%20 KDV):</strong> ₺${bd.workmanshipTotal.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
        </div>
      `;

      summaryBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>Sipariş No:</strong> ${order.orderId}</span>
          <span><strong>Müşteri:</strong> ${order.customerName || 'Nihai Tüketici'}</span>
        </div>
        ${lines}
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
          if (this.batchPendingStoreInvoices) {
            this.batchPendingStoreInvoices.forEach(inv => {
              inv.invoiceStatus = 'SIGNED';
            });
            try { localStorage.setItem('belgin_store_invoices', JSON.stringify(this.storeInvoices)); } catch (_) {}
          }
          this.closeSmsModal();
          this.filterTable();
          this.filterStoreTable();
        } else {
          if (errDiv) {
            errDiv.style.display = 'block';
            errDiv.style.color = '#C81E1E';
            errDiv.textContent = 'Hata: ' + (data?.message || 'Toplu imzalama başarısız oldu.');
          }
        }
      } else {
        // TEKİL İMZALAMA İSTEĞİ
        const targetStoreInv = this.storeInvoices.find(i => i.orderId === this.activeInvoiceOrderId || i.id === this.activeInvoiceOrderId);

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
            orderData: targetStoreInv || null,
            adminKey: this.adminPin
          })
        });

        const rawText = await res.text();
        let data = null;
        try { data = JSON.parse(rawText); } catch (_) {}

        if (data && data.success) {
          alert(`✅ Fatura Başarıyla İmzalandı!\n\nBelge No: ${data.invoiceNumber}\n\nFatura GİB e-Arşiv sistemine kaydedildi ve resmiyet kazandı.`);
          
          // Sipariş yerel durumunu güncelle
          const targetOrder = this.orders.find(o => o.orderId === this.activeInvoiceOrderId);
          if (targetOrder) {
            targetOrder.invoiceStatus = 'SIGNED';
            targetOrder.invoiceNumber = data.invoiceNumber;
            targetOrder.invoiceUuid = this.activeInvoiceUuid;
          }

          if (targetStoreInv) {
            targetStoreInv.invoiceStatus = 'SIGNED';
            targetStoreInv.invoiceNumber = data.invoiceNumber;
            targetStoreInv.invoiceUuid = this.activeInvoiceUuid;
            try { localStorage.setItem('belgin_store_invoices', JSON.stringify(this.storeInvoices)); } catch (_) {}
          }

          this.closeSmsModal();
          this.filterTable();
          this.filterStoreTable();
          if (this.activeInvoiceOrderId && targetOrder) {
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
  // FATURAYI MÜŞTERİYE DOĞRUDAN WHATSAPP İLE GÖNDER (MÜŞTERİ NUMARASINA ÖZEL SOHBET)
  sendInvoiceViaWhatsApp(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    let phone = String(order.customerPhone || order.customer?.phone || '').replace(/\D/g, '');
    if (!phone) {
      alert('⚠️ Müşterinin kayıtlı telefon numarası bulunamadı.');
      return;
    }
    if (phone.startsWith('0')) phone = '90' + phone.substring(1);
    if (!phone.startsWith('90')) phone = '90' + phone;

    const invoiceUrl = `https://www.belginkuyumculuk.com/api/admin/invoice/view?uuid=${encodeURIComponent(order.invoiceUuid || '')}&orderId=${encodeURIComponent(order.orderId || '')}&print=1&adminKey=1999`;
    const customerName = order.customerName || order.customer?.name || 'Değerli Müşterimiz';
    const amount = Number(order.totalAmount || order.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const invoiceNo = order.invoiceNumber || 'GİB e-Arşiv Faturanız';

    const msg = `Sayın *${customerName}*,\n\nBelgin Kuyumculuk'tan yapmış olduğunuz *₺${amount}* tutarındaki alışverişinize ait resmi GİB e-Arşiv faturanız düzenlenmiştir.\n\n🧾 *Fatura No:* ${invoiceNo}\n📄 *Faturayı PDF Olarak İndirmek & Görüntülemek İçin:*\n${invoiceUrl}\n\nBizi tercih ettiğiniz için teşekkür eder, iyi günlerde kullanmanızı dileriz.\n\n*Belgin Kuyumculuk*\nMenderes Cad. No:231/B Buca / İzmir\n0 (541) 930 52 72`;

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

  // EXCEL (.XLS) RAPORU İNDİR (Formatlı Tablo, Veri Bozulma Koruması ve Toplam Satırı)
  exportToExcel() {
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('statusFilter')?.value || '';

    const ordersToExport = (this.filteredOrders && this.filteredOrders.length > 0 ? this.filteredOrders : this.orders || []).filter(o => {
      const matchSearch = !searchVal || 
        (o.orderId && o.orderId.toLowerCase().includes(searchVal)) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchVal)) ||
        (o.customerPhone && o.customerPhone.includes(searchVal)) ||
        (o.provider && o.provider.toLowerCase().includes(searchVal));

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

    if (!ordersToExport || ordersToExport.length === 0) {
      alert('Dışa aktarılacak ödeme kaydı bulunamadı.');
      return;
    }

    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    const periodText = (startDate && endDate) ? `${startDate} ile ${endDate} Arası` : `Tüm Kayıtlar (${new Date().toLocaleDateString('tr-TR')})`;
    const dateSuffix = (startDate && endDate) ? `_${startDate}_${endDate}` : `_${new Date().toISOString().split('T')[0]}`;

    let totalSum = 0;
    const tableRows = ordersToExport.map((o, idx) => {
      const amount = Number(o.totalAmount || 0);
      totalSum += amount;
      const dateStr = new Date(o.createdAt).toLocaleString('tr-TR');
      const escapedCustomer = (o.customerName || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedAddress = (o.customerAddress || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const bgColor = idx % 2 === 0 ? '#FFFFFF' : '#F9FBFB';

      return `
        <tr style="background-color: ${bgColor};">
          <td class="text-cell" style="font-weight:600;">${o.orderId}</td>
          <td class="text-cell" style="color:#666;">${o.evidenceId || o.orderId}</td>
          <td class="text-cell">${dateStr}</td>
          <td>${escapedCustomer}</td>
          <td class="text-cell">${o.customerIdentity || '—'}</td>
          <td>${escapedAddress}</td>
          <td class="text-cell">${o.customerPhone || '—'}</td>
          <td class="text-cell">${o.customerEmail || '—'}</td>
          <td class="num-cell" style="font-weight:700; color:#042926;">${amount.toFixed(2)}</td>
          <td style="text-align:center;">${o.provider || 'AKBANK'}</td>
          <td style="text-align:center; font-weight:600; color:${o.paymentStatus === 'PAID' ? '#166534' : '#991B1B'};">${o.paymentStatus || o.status}</td>
          <td style="text-align:center;">${o.deliveryMethod === 'showroom' ? 'Showroom Teslim' : 'Kargo'}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Tahsilat Raporu</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1F2937; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #042926; color: #FFFFFF; font-weight: bold; border: 1px solid #084C47; padding: 10px 12px; text-align: left; font-size: 11pt; }
          td { border: 1px solid #D1D5DB; padding: 8px 10px; vertical-align: middle; font-size: 10.5pt; }
          .text-cell { mso-number-format:"\\@"; }
          .num-cell { mso-number-format:"\\#\\,\\#\\#0\\.00"; text-align: right; }
          .total-row td { background-color: #E6F4EA; border-top: 2px solid #137333; border-bottom: 2px solid #137333; font-weight: bold; }
          .total-amount { background-color: #E6F4EA; border-top: 2px solid #137333; border-bottom: 2px solid #137333; font-weight: bold; font-size: 12pt; color: #137333; mso-number-format:"\\#\\,\\#\\#0\\.00"; text-align: right; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="12" style="border:none; font-size: 16pt; font-weight: bold; color: #042926; padding-bottom: 4px;">BELGİN KUYUMCULUK & SAAT</td>
          </tr>
          <tr>
            <td colspan="12" style="border:none; font-size: 12pt; font-weight: bold; color: #B68A32; padding-bottom: 4px;">Sanal POS Tahsilat ve Hesap Özeti Raporu</td>
          </tr>
          <tr>
            <td colspan="12" style="border:none; font-size: 10pt; color: #4B5563; padding-bottom: 14px;"><strong>Rapor Dönemi:</strong> ${periodText} | <strong>Oluşturulma:</strong> ${new Date().toLocaleString('tr-TR')}</td>
          </tr>
          <tr></tr>
          <thead>
            <tr>
              <th style="width: 200px;">Sipariş No</th>
              <th style="width: 200px;">Hukuki Delil ID</th>
              <th style="width: 140px;">İşlem Tarihi</th>
              <th style="width: 180px;">Müşteri Adı Soyadı</th>
              <th style="width: 140px;">T.C. Kimlik / Pasaport</th>
              <th style="width: 260px;">Fatura / Teslimat Adresi</th>
              <th style="width: 130px;">Telefon</th>
              <th style="width: 200px;">E-Posta</th>
              <th style="width: 140px; text-align: right;">Tutar (TL)</th>
              <th style="width: 100px; text-align: center;">POS / Banka</th>
              <th style="width: 120px; text-align: center;">Ödeme Durumu</th>
              <th style="width: 140px; text-align: center;">Teslimat Kanalı</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr style="height: 12px;"><td colspan="12" style="border:none;"></td></tr>
            <tr class="total-row">
              <td class="text-cell" style="font-size: 11pt; color: #137333;">GENEL TOPLAM</td>
              <td colspan="2" style="color: #555;"></td>
              <td style="color: #137333;">Toplam ${ordersToExport.length} Adet İşlem</td>
              <td colspan="4"></td>
              <td class="total-amount">${totalSum.toFixed(2)}</td>
              <td colspan="3" style="text-align: center; color: #137333; font-size: 10pt;">${(this.adminPin ? 'Onaylı Banka Kayıtları' : '')}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Belgin_Kuyumculuk_Tahsilat_Raporu${dateSuffix}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // CSV ve Excel fonksiyonları uyumluluğu
  exportToCsv() {
    this.exportToExcel();
  },

  // FATURA SEÇİMİNİ DEĞİŞTİR (CHECKBOX)
  toggleInvoiceSelection(orderId, isChecked) {
    if (isChecked) {
      this.selectedInvoiceIds.add(orderId);
    } else {
      this.selectedInvoiceIds.delete(orderId);
    }
    this.updateAccountingUI();
  },

  // TÜM İMZALI FATURALARI SEÇ / BIRAK
  toggleSelectAllInvoices(isChecked) {
    const visibleSigned = (this.currentPagedOrders || []).filter(o => o.invoiceStatus === 'SIGNED');
    if (visibleSigned.length === 0) return;

    visibleSigned.forEach(o => {
      if (isChecked) {
        this.selectedInvoiceIds.add(o.orderId);
      } else {
        this.selectedInvoiceIds.delete(o.orderId);
      }
    });

    // Checkbox DOM'larını güncelle
    document.querySelectorAll('.invoice-row-checkbox, .mobile-invoice-checkbox').forEach(cb => {
      if (!cb.disabled) {
        cb.checked = isChecked;
      }
    });

    this.updateAccountingUI();
  },

  // MUHASEBE ARAYÜZ ELEMANLARINI GÜNCELLE
  updateAccountingUI() {
    const signedOrders = this.orders.filter(o => o.invoiceStatus === 'SIGNED');
    const selectedOrders = signedOrders.filter(o => this.selectedInvoiceIds.has(o.orderId));
    const count = selectedOrders.length;
    const total = selectedOrders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

    // Buton Rozeti
    const badge = document.getElementById('accountingSelectedBadge');
    if (badge) {
      if (count > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = count;
      } else {
        badge.style.display = 'none';
      }
    }

    // Tablo Master Checkbox
    const masterCb = document.getElementById('masterInvoiceCheckbox');
    if (masterCb) {
      const visibleSigned = (this.currentPagedOrders || []).filter(o => o.invoiceStatus === 'SIGNED');
      if (visibleSigned.length > 0) {
        const allSelected = visibleSigned.every(o => this.selectedInvoiceIds.has(o.orderId));
        const someSelected = visibleSigned.some(o => this.selectedInvoiceIds.has(o.orderId));
        masterCb.checked = allSelected;
        masterCb.indeterminate = (!allSelected && someSelected);
        masterCb.disabled = false;
      } else {
        masterCb.checked = false;
        masterCb.indeterminate = false;
        masterCb.disabled = true;
      }
    }

    // Mobil Kayan Alt Çubuk
    const floatBar = document.getElementById('mobileAccountingFloatingBar');
    const floatCount = document.getElementById('floatingSelectedCount');
    const floatTotal = document.getElementById('floatingSelectedTotal');
    if (floatBar) {
      if (count > 0 && window.innerWidth <= 768) {
        floatBar.style.display = 'flex';
        if (floatCount) floatCount.textContent = `${count} Fatura Seçildi`;
        if (floatTotal) floatTotal.textContent = `₺${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
      } else {
        floatBar.style.display = 'none';
      }
    }
  },

  // MUHASEBE GÖNDERİM MODALINI AÇ
  openAccountingModal() {
    const signedOrders = this.orders.filter(o => o.invoiceStatus === 'SIGNED');
    if (signedOrders.length === 0) {
      alert('ℹ️ Gönderilecek imzalanmış e-Arşiv faturası bulunamadı.\n\n(Lütfen önce fatura düzenleyip SMS onay kodu ile imzalayınız.)');
      return;
    }

    // Eğer hiç seçim yapılmadıysa, mevcut tüm imzalı faturaları otomatik seç
    if (this.selectedInvoiceIds.size === 0) {
      signedOrders.forEach(o => this.selectedInvoiceIds.add(o.orderId));
      this.updateAccountingUI();
    }

    const selectedOrders = signedOrders.filter(o => this.selectedInvoiceIds.has(o.orderId));
    if (selectedOrders.length === 0) {
      alert('ℹ️ Lütfen listeden en az 1 adet imzalanmış fatura seçiniz.');
      return;
    }

    const total = selectedOrders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

    // Modal içeriklerini güncelle
    const countEl = document.getElementById('accModalSummaryCount');
    const totalEl = document.getElementById('accModalSummaryTotal');
    if (countEl) countEl.textContent = `${selectedOrders.length} Adet Fatura Seçildi`;
    if (totalEl) totalEl.textContent = `₺${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

    const listEl = document.getElementById('accModalList');
    if (listEl) {
      listEl.innerHTML = selectedOrders.map((o, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid #E2E8F0; font-size:12px; background:${idx % 2 === 0 ? '#FFF' : '#F8FAFC'};">
          <div>
            <div style="font-weight:800; color:#0F172A;">${idx + 1}. ${o.customerName || 'Müşteri'}</div>
            <div style="font-size:11px; color:#64748B;">
              TCKN: <span style="font-family:monospace; color:#B45309; font-weight:700;">${o.customerIdentity || 'Showroom'}</span> • 
              Belge No: <span style="font-family:monospace; color:#084C47; font-weight:700;">${o.invoiceNumber || o.orderId}</span>
            </div>
            <div style="font-size:11px; color:#059669; font-weight:600;">${o.productName || 'Kuyumculuk Ürünü'} (Özel Matrah)</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:#15803D; font-size:13px;">₺${Number(o.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <a href="https://belginkuyumculuk.com/api/admin/invoice/view?uuid=${o.invoiceUuid || ''}&adminKey=1999" target="_blank" style="font-size:10.5px; color:#0284C7; font-weight:700; text-decoration:none;">📄 Faturayı Aç</a>
          </div>
        </div>
      `).join('');
    }

    const previewMsg = this.generateAccountingWhatsAppMessage(selectedOrders);
    const previewEl = document.getElementById('accModalMessagePreview');
    if (previewEl) previewEl.value = previewMsg;

    const modal = document.getElementById('accountingModal');
    if (modal) modal.classList.add('open');
  },

  closeAccountingModal() {
    const modal = document.getElementById('accountingModal');
    if (modal) modal.classList.remove('open');
  },

  // MUHASEBEYE WHATSAPP METNİ OLUŞTURUCU
  generateAccountingWhatsAppMessage(ordersToSend) {
    const count = ordersToSend.length;
    const total = ordersToSend.reduce((s, o) => s + (Number(o.totalAmount || o.total || 0)), 0);
    const totalFormatted = total.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const lines = ordersToSend.map((o, idx) => {
      const custName = o.customerName || o.customer?.name || 'Müşteri';
      const tckn = o.customerIdentity && o.customerIdentity !== '—' ? o.customerIdentity : '11111111111';
      const invNo = o.invoiceNumber || o.orderId;
      const prodName = o.productName || (o.invoiceBreakdown && o.invoiceBreakdown.productName) || 'Kuyumculuk Ürünü';
      const amtFormatted = Number(o.totalAmount || o.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
      const invUrl = `https://www.belginkuyumculuk.com/api/admin/invoice/view?uuid=${encodeURIComponent(o.invoiceUuid || '')}&orderId=${encodeURIComponent(o.orderId || '')}&print=1&adminKey=1999`;

      return `${idx + 1}️⃣ *${custName}*\n• *TCKN / VKN:* ${tckn}\n• *Fatura No:* ${invNo}\n• *Ürün:* ${prodName} (Özel Matrah)\n• *Tutar:* ₺${amtFormatted}\n• *Resmi Fatura (PDF İndir):*\n${invUrl}`;
    }).join('\n\n');

    return `📊 *BELGİN KUYUMCULUK — GİB E-ARŞİV FATURA DÖKÜMÜ*\n📅 *Tarih:* ${dateFormatted}\n📁 *Fatura Adedi:* ${count} Adet\n💰 *Genel Toplam:* ₺${totalFormatted}\n\n────────────────────────\n🧾 *FATURA DÖKÜMÜ:*\n\n${lines}\n\n────────────────────────\n📌 _KDV Kanunu 23/f özel matrah kapsamında muhasebe kayıtlarına işlenmek üzere iletilmiştir._\n🏢 *Belgin Kuyumculuk* (Buca / İzmir)`;
  },

  // WHATSAPP İLE MUHASEBEYE TEK SEFERDE İLET
  dispatchInvoicesToAccountingWhatsApp() {
    const signedOrders = this.orders.filter(o => o.invoiceStatus === 'SIGNED');
    const selectedOrders = signedOrders.filter(o => this.selectedInvoiceIds.has(o.orderId));

    if (selectedOrders.length === 0) {
      alert('Gönderilecek fatura seçilmedi.');
      return;
    }

    const msg = this.generateAccountingWhatsAppMessage(selectedOrders);
    const waUrl = `https://api.whatsapp.com/send?phone=${this.ACCOUNTING_PHONE}&text=${encodeURIComponent(msg)}`;

    this.closeAccountingModal();
    window.open(waUrl, '_blank');
  },

  // TEKİL FATURAYI ANINDA MUHASEBEYE GÖNDER
  sendSingleInvoiceToAccounting(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;
    if (order.invoiceStatus !== 'SIGNED') {
      alert('Bu siparişin faturası henüz imzalanmamıştır. Lütfen önce faturayı imzalayınız.');
      return;
    }

    const msg = this.generateAccountingWhatsAppMessage([order]);
    const waUrl = `https://api.whatsapp.com/send?phone=${this.ACCOUNTING_PHONE}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  },

  // ========================================================
  // CARİ HESAP EKSTRESİ & ÖDEMELER MOTORU (EKSTRE MODÜLÜ)
  // ========================================================

  // 1. SEKME DEĞİŞTİRİCİ
  switchTab(tab) {
    this.currentTab = tab;
    const tabBtnOrders = document.getElementById('tabBtnOrders');
    const tabBtnStmt = document.getElementById('tabBtnStatement');
    const tabBtnStore = document.getElementById('tabBtnStoreInvoices');
    const ordersContent = document.getElementById('ordersTabContent');
    const stmtContent = document.getElementById('statementTabContent');
    const storeContent = document.getElementById('storeInvoicesTabContent');

    if (tabBtnOrders) tabBtnOrders.classList.remove('active');
    if (tabBtnStmt) tabBtnStmt.classList.remove('active');
    if (tabBtnStore) tabBtnStore.classList.remove('active');

    if (ordersContent) ordersContent.style.display = 'none';
    if (stmtContent) stmtContent.style.display = 'none';
    if (storeContent) storeContent.style.display = 'none';

    if (tab === 'statement') {
      if (tabBtnStmt) tabBtnStmt.classList.add('active');
      if (stmtContent) stmtContent.style.display = 'block';
      this.loadStatement();
    } else if (tab === 'storeInvoices') {
      if (tabBtnStore) tabBtnStore.classList.add('active');
      if (storeContent) storeContent.style.display = 'block';
      this.loadStoreInvoices();
    } else {
      if (tabBtnOrders) tabBtnOrders.classList.add('active');
      if (ordersContent) ordersContent.style.display = 'block';
      this.loadOrders();
    }
  },

  // 2. EKSTRE TARİH ÖN AYAR SEÇİMİ (VARSAYILAN: 01.08.2016 - BUGÜN)
  selectStmtPreset(preset, btnEl) {
    this.currentStmtPreset = preset;
    document.querySelectorAll('[data-stmt-preset]').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const startInput = document.getElementById('stmtStartDate');
    const endInput = document.getElementById('stmtEndDate');
    const today = new Date();
    const toDateStr = d => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = toDateStr(today);
      if (startInput) startInput.value = todayStr;
      if (endInput) endInput.value = todayStr;
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = toDateStr(y);
      if (startInput) startInput.value = yStr;
      if (endInput) endInput.value = yStr;
    } else if (preset === 'last7') {
      const d7 = new Date(today);
      d7.setDate(d7.getDate() - 6);
      if (startInput) startInput.value = toDateStr(d7);
      if (endInput) endInput.value = toDateStr(today);
    } else if (preset === 'thisMonth') {
      const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
      if (startInput) startInput.value = toDateStr(mStart);
      if (endInput) endInput.value = toDateStr(today);
    } else if (preset === 'last30') {
      const d30 = new Date(today);
      d30.setDate(d30.getDate() - 29);
      if (startInput) startInput.value = toDateStr(d30);
      if (endInput) endInput.value = toDateStr(today);
    } else { // 'all' (01.08.2016'dan başlat, bugünün tarihine gelsin)
      if (startInput) startInput.value = '2016-08-01';
      if (endInput) endInput.value = toDateStr(today);
    }

    this.loadStatement();
  },

  onStmtCustomDateChange() {
    document.querySelectorAll('[data-stmt-preset]').forEach(b => b.classList.remove('active'));
    this.loadStatement();
  },

  // 3. EKSTRE CANLI VERİLERİNİ ÇEK VE HESAPLA
  async loadStatement() {
    if (!this.adminPin) return;

    let start = document.getElementById('stmtStartDate')?.value || '';
    let end = document.getElementById('stmtEndDate')?.value || '';

    // Varsayılan tarih aralığı: 01.08.2016 - Bugün
    if (!start) {
      start = '2016-08-01';
      const sInput = document.getElementById('stmtStartDate');
      if (sInput) sInput.value = start;
    }
    if (!end) {
      end = new Date().toISOString().split('T')[0];
      const eInput = document.getElementById('stmtEndDate');
      if (eInput) eInput.value = end;
    }

    const params = new URLSearchParams();
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);

    try {
      const res = await fetch(`/api/admin/statement?${params.toString()}`, {
        headers: { 'x-admin-key': this.adminPin }
      });

      if (res.status === 401) {
        this.showAuthGate();
        return;
      }

      const data = await res.json();
      if (data && data.success) {
        this.statementRows = Array.isArray(data.rows) ? data.rows : [];
        this.statementSummary = data.summary || { totalPos: 0, totalHakedis: 0, totalPaid: 0, totalRemaining: 0 };
        this.allPayments = Array.isArray(data.allPayments) ? data.allPayments : [];

        this.updateStatementMetrics();
        this.filterStatementTable();

        const syncEl = document.getElementById('stmtLastSyncTime');
        if (syncEl) syncEl.textContent = 'Son Güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
      }
    } catch (err) {
      console.error('[Statement Load Error]:', err);
    }
  },

  // 2.1. POS BANKA KOMİSYON ORANI DEĞİŞTİRME & DÖNEMSEL ORANLAR
  onPosCommissionRateChange(newRate) {
    const num = parseFloat(newRate);
    this.posBankCommissionRate = isNaN(num) ? 0 : num;
    try {
      localStorage.setItem('belgin_pos_bank_rate', this.posBankCommissionRate);
    } catch (_) {}

    this.updateStatementMetrics();
    this.renderStatementTable(this.filteredStatementRows);
  },

  getRateForDate(dateStr) {
    if (Array.isArray(this.posRatePeriods) && this.posRatePeriods.length > 0) {
      for (const p of this.posRatePeriods) {
        const afterStart = !p.startDate || dateStr >= p.startDate;
        const beforeEnd = !p.endDate || dateStr <= p.endDate;
        if (afterStart && beforeEnd && !isNaN(Number(p.rate))) {
          return Number(p.rate);
        }
      }
    }
    return this.posBankCommissionRate;
  },

  updatePosRatePeriodsCount() {
    const badge = document.getElementById('posRatePeriodsCountBadge');
    if (badge) badge.textContent = (this.posRatePeriods || []).length;
  },

  openPosRatesModal() {
    const modal = document.getElementById('posRatesModal');
    if (!modal) return;

    this.renderPosRatePeriodsTable();
    modal.style.display = 'flex';
  },

  closePosRatesModal() {
    const modal = document.getElementById('posRatesModal');
    if (modal) modal.style.display = 'none';
    this.updatePosRatePeriodsCount();
    this.updateStatementMetrics();
    this.renderStatementTable(this.filteredStatementRows);
  },

  renderPosRatePeriodsTable() {
    const tbody = document.getElementById('posRatePeriodsTableBody');
    if (!tbody) return;

    if (!this.posRatePeriods || this.posRatePeriods.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:16px; color:#64748B;">Henüz özel tarih aralığı eklenmedi. Tüm tarihler için üstteki genel oran (%${this.posBankCommissionRate}) uygulanır.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.posRatePeriods.map((p, idx) => {
      const startFormatted = p.startDate ? this.formatDateTr(p.startDate) : 'Geçmişten';
      const endFormatted = p.endDate ? this.formatDateTr(p.endDate) : 'Bugüne (Süresiz)';
      const margin = (8 - Number(p.rate || 0)).toFixed(2);

      return `
        <tr style="border-bottom:1px solid #E2E8F0;">
          <td style="padding:8px 10px; font-weight:700; color:#1E293B;">
            📅 ${startFormatted} — ${endFormatted}
          </td>
          <td style="padding:8px 10px; text-align:center; font-weight:800; color:#B45309;">
            %${Number(p.rate || 0).toFixed(2)}
          </td>
          <td style="padding:8px 10px; text-align:center; font-weight:800; color:#15803D;">
            %${margin}
          </td>
          <td style="padding:8px 10px; text-align:center;">
            <button type="button" style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; border-radius:4px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer;" onclick="AdminApp.deletePosRatePeriod(${idx})">
              Sil
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  addPosRatePeriod() {
    const start = document.getElementById('ratePeriodStart')?.value?.trim();
    const end = document.getElementById('ratePeriodEnd')?.value?.trim();
    const val = parseFloat(document.getElementById('ratePeriodValue')?.value);

    if (isNaN(val) || val < 0) {
      alert('Lütfen geçerli bir POS komisyon oranı (%) giriniz.');
      return;
    }
    if (start && end && start > end) {
      alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
      return;
    }

    this.posRatePeriods.push({
      id: 'rate-' + Date.now(),
      startDate: start || null,
      endDate: end || null,
      rate: val
    });

    try {
      localStorage.setItem('belgin_pos_rate_periods', JSON.stringify(this.posRatePeriods));
    } catch (_) {}

    const sInput = document.getElementById('ratePeriodStart');
    const eInput = document.getElementById('ratePeriodEnd');
    const vInput = document.getElementById('ratePeriodValue');
    if (sInput) sInput.value = '';
    if (eInput) eInput.value = '';
    if (vInput) vInput.value = '';

    this.updatePosRatePeriodsCount();
    this.renderPosRatePeriodsTable();
    this.updateStatementMetrics();
    this.renderStatementTable(this.filteredStatementRows);
    this.showToast('✅ Dönemsel POS komisyon oranı eklendi.');
  },

  deletePosRatePeriod(idx) {
    if (idx < 0 || idx >= this.posRatePeriods.length) return;
    this.posRatePeriods.splice(idx, 1);
    try {
      localStorage.setItem('belgin_pos_rate_periods', JSON.stringify(this.posRatePeriods));
    } catch (_) {}
    this.updatePosRatePeriodsCount();
    this.renderPosRatePeriodsTable();
    this.updateStatementMetrics();
    this.renderStatementTable(this.filteredStatementRows);
    this.showToast('🗑️ Dönemsel oran silindi.');
  },

  // 4. METRİKLERİ VE SAĞ ÜSTTEKİ KIRMIZI KALAN TOPLAM TUTARI GÜNCELLE
  updateStatementMetrics() {
    const s = this.statementSummary || {};
    const fmt = val => '₺' + Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtShort = val => '₺' + Number(val || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 });

    const heroRem = document.getElementById('stmtHeroRemaining');
    if (heroRem) heroRem.textContent = fmt(s.totalRemaining);

    const tabBadge = document.getElementById('tabBadgeStatement');
    if (tabBadge) tabBadge.textContent = fmtShort(s.totalRemaining);

    const kpiPos = document.getElementById('stmtKpiTotalPos');
    if (kpiPos) kpiPos.textContent = fmt(s.totalPos);

    const kpiHak = document.getElementById('stmtKpiTotalHakedis');
    if (kpiHak) kpiHak.textContent = fmt(s.totalHakedis);

    const kpiPaid = document.getElementById('stmtKpiTotalPaid');
    if (kpiPaid) kpiPaid.textContent = fmt(s.totalPaid);

    const kpiRem = document.getElementById('stmtKpiTotalRemaining');
    if (kpiRem) kpiRem.textContent = fmt(s.totalRemaining);

    // Toplam Net Kâr Hesabı: Tarihe duyarlı (getRateForDate) hesaplama
    let totalProfit = 0;
    (this.statementRows || []).forEach(r => {
      if (r.pos > 0) {
        const rate = this.getRateForDate(r.date);
        const hakedis = Number(r.hakedis || 0);
        const bankFee = r.pos * (rate / 100);
        const profit = (r.pos - hakedis) - bankFee;
        totalProfit += profit;
      }
    });
    totalProfit = Math.round(totalProfit * 100) / 100;

    const kpiProfit = document.getElementById('stmtKpiTotalProfit');
    if (kpiProfit) kpiProfit.textContent = fmt(totalProfit);

    const profitSub = document.getElementById('stmtKpiProfitSubtext');
    if (profitSub) {
      const hasPeriods = (this.posRatePeriods || []).length > 0;
      profitSub.textContent = hasPeriods ? `Tarih Bazlı Oranlar (${this.posRatePeriods.length} Kural)` : `(Kesinti %8) — (Banka %${this.posBankCommissionRate})`;
    }

    const payCountBadge = document.getElementById('stmtTotalPaymentsBadge');
    if (payCountBadge) payCountBadge.textContent = this.allPayments.length;

    const allPayBadge = document.getElementById('allPaymentsCountBadge');
    if (allPayBadge) allPayBadge.textContent = this.allPayments.length;

    const allPayTotal = document.getElementById('allPaymentsTotalBadge');
    if (allPayTotal) allPayTotal.textContent = fmt(s.totalPaid);
  },

  // 5. ARAMA VE TABLO FİLTRELEME
  filterStatementTable() {
    const query = (document.getElementById('stmtSearchInput')?.value || '').trim().toLowerCase();
    
    if (!query) {
      this.filteredStatementRows = [...this.statementRows];
    } else {
      this.filteredStatementRows = this.statementRows.filter(r => {
        const dateMatch = r.date && r.date.toLowerCase().includes(query);
        const formattedDate = this.formatDateTr(r.date).toLowerCase();
        const dateTrMatch = formattedDate.includes(query);
        const descMatch = r.description && r.description.toLowerCase().includes(query);
        const orderIdMatch = r.orderId && r.orderId.toLowerCase().includes(query);
        const customerMatch = r.customerName && r.customerName.toLowerCase().includes(query);
        const posMatch = String(r.pos).includes(query);
        const hakMatch = String(r.hakedis).includes(query);
        const payMatch = String(r.paid).includes(query);
        return dateMatch || dateTrMatch || descMatch || orderIdMatch || customerMatch || posMatch || hakMatch || payMatch;
      });
    }

    const countBadge = document.getElementById('stmtTableCountBadge');
    if (countBadge) countBadge.textContent = `(${this.filteredStatementRows.length} Hareket)`;

    this.renderStatementTable(this.filteredStatementRows);
  },

  // 6. EKSTRE TABLOSUNU TEK TEK İŞLEM HAREKETLERİYLE RENDER ET (YENİDEN ESKİYE)
  renderStatementTable(rows) {
    const tbody = document.getElementById('statementTableBody');
    const mobileList = document.getElementById('statementMobileList');
    if (!tbody) return;

    if (!rows || rows.length === 0) {
      const emptyHtml = `
        <tr>
          <td colspan="7" style="text-align:center; padding:40px 16px; color:var(--admin-muted);">
            <div style="font-size:32px; margin-bottom:8px;">📊</div>
            <div style="font-weight:700; font-size:14px; color:#334155;">Bu tarih aralığında ekstre hareketi bulunamadı.</div>
          </td>
        </tr>`;
      tbody.innerHTML = emptyHtml;
      if (mobileList) mobileList.innerHTML = `<div style="text-align:center; padding:32px; color:var(--admin-muted);">Kayıt bulunamadı.</div>`;
      return;
    }

    const fmt = val => '₺' + Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    let html = '';
    let mobileHtml = '';

    rows.forEach(r => {
      const isPosSale = r.type === 'POS_SALE';
      const isPayment = r.type === 'PAYMENT';
      const isManualPos = r.type === 'POS_MANUAL';

      const dateFormatted = this.formatDateTr(r.date);
      const timeStr = r.time && r.time !== '12:00' ? ` <span style="font-size:11px; color:#94A3B8;">${r.time}</span>` : '';

      let typeBadge = '';
      let descHtml = '';
      let mainAmountStr = '';
      let mainAmountColor = '#0F172A';

      if (isPosSale) {
        typeBadge = `<span style="background:#E0F2FE; color:#0369A1; border:1px solid #7DD3FC; font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">💳 POS Satış</span>`;
        descHtml = `<strong style="color:#0F172A; font-size:13.5px;">${r.orderId}</strong> — <span style="font-weight:700; color:#1E293B;">${this.escapeHtml(r.customerName || 'Müşteri')}</span> <span style="font-size:11px; color:#475569; font-weight:600;">(${r.provider || 'AKBANK'})</span>`;
        mainAmountStr = `+${fmt(r.pos)}`;
        mainAmountColor = '#0369A1';
      } else if (isPayment) {
        typeBadge = `<span style="background:#DCFCE7; color:#15803D; border:1px solid #86EFAC; font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">🟢 Ödeme Çıkışı</span>`;
        descHtml = `<strong style="color:#15803D; font-size:13.5px;">${this.escapeHtml(r.description || 'Ödeme')}</strong> <span style="font-size:11px; color:#475569; font-weight:600;">(${r.paymentType || 'Banka'})</span>`;
        mainAmountStr = `-${fmt(r.paid)}`;
        mainAmountColor = '#15803D';
      } else if (isManualPos) {
        typeBadge = `<span style="background:#FEF3C7; color:#92400E; border:1px solid #FCD34D; font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; display:inline-flex; align-items:center; gap:4px;">➕ Manuel POS</span>`;
        descHtml = `<strong style="color:#92400E; font-size:13.5px;">${this.escapeHtml(r.description || 'Manuel POS')}</strong>`;
        mainAmountStr = `+${fmt(r.pos)}`;
        mainAmountColor = '#B45309';
      }

      const isPositiveRemaining = (r.remaining || 0) > 0;
      const isZeroRemaining = Math.abs(r.remaining || 0) < 0.01;

      // Kâr Hesabı: Tarihe göre geçerli POS komisyon oranını çek
      let profitHtml = '';
      let profitMobileHtml = '';
      if (r.pos > 0) {
        const rate = this.getRateForDate(r.date);
        const bankFee = r.pos * (rate / 100);
        const profit = Math.round(((r.pos - (r.hakedis || 0)) - bankFee) * 100) / 100;
        const profitRate = (8 - rate).toFixed(2);

        profitHtml = `
          <div style="font-size:14px; font-weight:800; color:#15803D;">${fmt(profit)}</div>
          <div style="font-size:10px; color:#166534; font-weight:700;" title="Uygulanan Banka POS Oranı: %${rate}">Net Kâr (%${profitRate}) <span style="color:#B45309;">(%${rate})</span></div>
        `;
        profitMobileHtml = `
          <strong style="color:#15803D; font-size:13.5px;">${fmt(profit)}</strong> <span style="font-size:10.5px; color:#166534; font-weight:700;">(%${profitRate})</span>
        `;
      } else {
        profitHtml = `<span style="color:#64748B; font-weight:600;">—</span>`;
        profitMobileHtml = `
          <span style="color:#64748B; font-weight:700; font-size:13px;">—</span>
        `;
      }

      let actionsHtml = '';
      let mobileActionsHtml = '';

      if (isPosSale) {
        actionsHtml = `
          <div style="display:flex; justify-content:center; align-items:center; gap:4px;">
            <button type="button" class="btn-admin-secondary" style="padding:5px 9px; font-size:11.5px; font-weight:700; color:#064E3B;" onclick="AdminApp.openOrderModal('${r.orderId}')" title="Sipariş detayını görüntüle / yönet">
              ✏️ Düzenle
            </button>
            <button type="button" style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; border-radius:6px; padding:5px 9px; font-size:11.5px; font-weight:800; cursor:pointer;" onclick="AdminApp.deleteOrder('${r.orderId}')" title="Bu siparişi sil">
              🗑️ Sil
            </button>
          </div>
        `;
        mobileActionsHtml = `
          <button type="button" class="btn-admin-secondary" style="width:100%; min-height:44px; justify-content:center; font-size:13px; font-weight:800; color:#064E3B; border-radius:8px;" onclick="AdminApp.openOrderModal('${r.orderId}')">
            ✏️ Sipariş Detayını Düzenle
          </button>
          <button type="button" style="min-height:44px; padding:0 14px; background:#FEE2E2; border:1.5px solid #FCA5A5; color:#991B1B; border-radius:8px; font-size:13px; font-weight:800; cursor:pointer;" onclick="AdminApp.deleteOrder('${r.orderId}')" title="Siparişi Sil">
            🗑️ Sil
          </button>
        `;
      } else if (isPayment) {
        actionsHtml = `
          <div style="display:flex; justify-content:center; align-items:center; gap:4px;">
            <button type="button" class="btn-admin-secondary" style="padding:5px 9px; font-size:11.5px; font-weight:700; color:#064E3B;" onclick="AdminApp.openPaymentModal('${r.date}', '${r.id}', ${r.paid || 0}, '${this.escapeHtml(r.description || '')}', '${r.paymentType || 'Banka/Havale'}')" title="Ödeme tutarı veya açıklamasını düzenle">
              ✏️ Düzenle
            </button>
            <button type="button" style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; border-radius:6px; padding:5px 9px; font-size:11.5px; font-weight:800; cursor:pointer;" onclick="AdminApp.deletePayment('${r.id}')" title="Bu ödeme kaydını sil">
              🗑️ Sil
            </button>
          </div>
        `;
        mobileActionsHtml = `
          <button type="button" class="btn-admin-secondary" style="width:100%; min-height:44px; justify-content:center; font-size:13px; font-weight:800; color:#064E3B; border-radius:8px;" onclick="AdminApp.openPaymentModal('${r.date}', '${r.id}', ${r.paid || 0}, '${this.escapeHtml(r.description || '')}', '${r.paymentType || 'Banka/Havale'}')">
            ✏️ Ödeme Kaydını Düzenle
          </button>
          <button type="button" style="min-height:44px; padding:0 14px; background:#FEE2E2; border:1.5px solid #FCA5A5; color:#991B1B; border-radius:8px; font-size:13px; font-weight:800; cursor:pointer;" onclick="AdminApp.deletePayment('${r.id}')" title="Ödemeyi Sil">
            🗑️ Sil
          </button>
        `;
      } else if (isManualPos) {
        actionsHtml = `
          <div style="display:flex; justify-content:center; align-items:center; gap:4px;">
            <button type="button" class="btn-admin-secondary" style="padding:5px 9px; font-size:11.5px; font-weight:700; color:#064E3B;" onclick="AdminApp.openManualPosModal('${r.date}', ${r.pos || 0}, '${this.escapeHtml(r.manualNote || '')}')" title="Manuel POS tutarını düzenle">
              ✏️ Düzenle
            </button>
            <button type="button" style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; border-radius:6px; padding:5px 9px; font-size:11.5px; font-weight:800; cursor:pointer;" onclick="AdminApp.deleteManualPos('${r.date}')" title="Manuel POS kaydını sil">
              🗑️ Sil
            </button>
          </div>
        `;
        mobileActionsHtml = `
          <button type="button" class="btn-admin-secondary" style="width:100%; min-height:44px; justify-content:center; font-size:13px; font-weight:800; color:#064E3B; border-radius:8px;" onclick="AdminApp.openManualPosModal('${r.date}', ${r.pos || 0}, '${this.escapeHtml(r.manualNote || '')}')">
            ✏️ Manuel POS Düzenle
          </button>
          <button type="button" style="min-height:44px; padding:0 14px; background:#FEE2E2; border:1.5px solid #FCA5A5; color:#991B1B; border-radius:8px; font-size:13px; font-weight:800; cursor:pointer;" onclick="AdminApp.deleteManualPos('${r.date}')" title="Manuel POS Sil">
            🗑️ Sil
          </button>
        `;
      }

      html += `
        <tr style="${isPayment ? 'background:#F0FDF4;' : ''}">
          <td style="text-align:center; font-weight:800; color:#0F172A; font-size:12px; white-space:nowrap;">
            ${dateFormatted}${timeStr}
          </td>
          <td style="text-align:left; font-size:12.5px;">
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
              ${typeBadge}
              <span>${descHtml}</span>
            </div>
          </td>
          <td style="text-align:right;" class="col-pos">
            ${r.pos > 0 ? `<span style="font-weight:800; font-size:13px; color:#0F172A;">${fmt(r.pos)}</span>` : '<span style="color:#64748B;">—</span>'}
          </td>
          <td style="text-align:right;" class="col-hakedis">
            ${r.hakedis > 0 ? `<div style="font-weight:800; font-size:13.5px; color:#0369A1;">${fmt(r.hakedis)}</div><div style="font-size:10px; color:#0284C7; font-weight:700;">%92 Net</div>` : '<span style="color:#64748B;">—</span>'}
          </td>
          <td style="text-align:right;" class="col-paid">
            ${r.paid > 0 ? `<span style="font-weight:800; font-size:13.5px; color:#15803D;">${fmt(r.paid)}</span>` : '<span style="color:#64748B;">—</span>'}
          </td>
          <td style="text-align:right;" class="col-remaining">
            <div style="font-size:14px; font-weight:800; color:${isZeroRemaining ? '#15803D' : (isPositiveRemaining ? '#B91C1C' : '#D97706')};">
              ${fmt(r.remaining)}
            </div>
          </td>
          <td style="text-align:right;" class="col-profit">
            ${profitHtml}
          </td>
          <td style="text-align:center; white-space:nowrap;">
            ${actionsHtml}
          </td>
        </tr>
      `;

      // 📱 MOBİL ULTRA LÜKS VE KULLANIŞLI İŞLEM KARTI (REVOLUT BUSINESS / APPLE CARD)
      mobileHtml += `
        <article class="admin-mobile-card" style="border-left: 6px solid ${isPayment ? '#10B981' : (isManualPos ? '#F59E0B' : '#0284C7')}; margin-bottom:14px; padding:16px; background:#FFFFFF; border-radius:14px; box-shadow:0 4px 14px rgba(8,76,71,0.06); border:1px solid #CBD5E1;">
          
          <!-- 1. Üst Satır: Rozet + Tarih -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:8px; border-bottom:1px solid #EDF2F7; flex-wrap:wrap; gap:6px;">
            <div style="display:flex; align-items:center; gap:6px;">
              ${typeBadge}
            </div>
            <time style="font-size:12px; font-weight:700; color:#334155;">📅 ${dateFormatted}${timeStr}</time>
          </div>

          <!-- 2. Ana Açıklama & Büyük Tutar Satırı -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:12px;">
            <div style="flex:1;">
              <div style="font-size:13.5px; font-weight:800; color:#0F172A; line-height:1.4;">${descHtml}</div>
            </div>
            <div style="text-align:right; white-space:nowrap;">
              <span style="font-size:10px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; display:block;">İşlem Tutarı</span>
              <span style="font-size:18px; font-weight:800; color:${mainAmountColor}; letter-spacing:-0.5px;">${mainAmountStr}</span>
            </div>
          </div>

          <!-- 3. Finansal Döküm Matrisi (4 Kutu) -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; background:#F8FAFB; padding:10px 12px; border-radius:10px; border:1px solid #CBD5E1; margin-bottom:12px;">
            <div style="border-right:1px solid #E2E8F0; padding-right:6px;">
              <span style="font-size:10.5px; color:#0369A1; font-weight:800; display:block;">🔵 Net Hakediş (%92):</span>
              <strong style="font-size:13.5px; color:#0284C7;">${r.hakedis > 0 ? fmt(r.hakedis) : '—'}</strong>
            </div>
            <div style="padding-left:4px;">
              <span style="font-size:10.5px; color:${isZeroRemaining ? '#15803D' : '#991B1B'}; font-weight:800; display:block;">🔴 Kalan Bakiye:</span>
              <strong style="font-size:13.5px; color:${isZeroRemaining ? '#15803D' : '#DC2626'};">${fmt(r.remaining)}</strong>
            </div>
            <div style="border-right:1px solid #E2E8F0; padding-right:6px; border-top:1px solid #E2E8F0; padding-top:6px;">
              <span style="font-size:10.5px; color:#166534; font-weight:800; display:block;">💎 Net Kâr:</span>
              ${profitMobileHtml}
            </div>
            <div style="padding-left:4px; border-top:1px solid #E2E8F0; padding-top:6px;">
              <span style="font-size:10.5px; color:#15803D; font-weight:800; display:block;">🟢 Ödenen Tutar:</span>
              <strong style="font-size:13.5px; color:#16A34A;">${r.paid > 0 ? fmt(r.paid) : '—'}</strong>
            </div>
          </div>

          <!-- 4. Aksiyon Butonları (Geniş Dokunmatik) -->
          <div style="display:grid; grid-template-columns: 1fr auto; gap:8px;">
            ${mobileActionsHtml}
          </div>

        </article>
      `;
    });

    tbody.innerHTML = html;
    if (mobileList) mobileList.innerHTML = mobileHtml;
  },

  // 7. ÖDEME MODALI KONTROLLERİ
  openPaymentModal(prefillDate, editId, amount, description, paymentType) {
    const modal = document.getElementById('paymentModal');
    if (!modal) return;

    const dateInput = document.getElementById('payDateInput');
    const amountInput = document.getElementById('payAmountInput');
    const descInput = document.getElementById('payDescInput');
    const typeInput = document.getElementById('payTypeInput');
    const editIdInput = document.getElementById('payEditId');
    const errDiv = document.getElementById('payErrorMsg');

    if (editIdInput) editIdInput.value = editId || '';
    if (amountInput) amountInput.value = (amount > 0) ? amount : '';
    if (descInput) descInput.value = description || '';
    if (typeInput) typeInput.value = paymentType || 'Banka/Havale';
    if (errDiv) errDiv.style.display = 'none';

    const targetDate = prefillDate || new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = targetDate;

    if (!editId) {
      this.onPaymentDateSelected(targetDate);
    } else {
      const box = document.getElementById('payExistingSummaryBox');
      if (box) box.style.display = 'none';
    }

    modal.style.display = 'flex';
    setTimeout(() => {
      if (amountInput) amountInput.focus();
    }, 150);
  },

  closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
  },

  onPaymentDateSelected(dateStr) {
    const box = document.getElementById('payExistingSummaryBox');
    const list = document.getElementById('payExistingList');
    const title = document.getElementById('payExistingSummaryTitle');
    if (!box || !list) return;

    const existing = this.allPayments.filter(p => p.date === dateStr);
    if (existing.length === 0) {
      box.style.display = 'none';
      return;
    }

    const fmt = val => '₺' + Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    const total = existing.reduce((s, p) => s + (p.amount || 0), 0);

    if (title) title.textContent = `📅 ${this.formatDateTr(dateStr)} Tarihindeki Kayıtlı Ödemeler (Toplam: ${fmt(total)}):`;

    list.innerHTML = existing.map(p => `
      <div style="display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dashed #E2E8F0;">
        <span>• <strong>${fmt(p.amount)}</strong> — ${this.escapeHtml(p.description || 'Ödeme')} <em style="font-size:10.5px; color:#64748B;">(${p.paymentType || 'Banka'})</em></span>
      </div>
    `).join('');

    box.style.display = 'block';
  },

  // 8. ÖDEMEYİ KAYDET VE ANLIK HESAPLA
  async submitPayment() {
    const dateInput = document.getElementById('payDateInput');
    const amountInput = document.getElementById('payAmountInput');
    const descInput = document.getElementById('payDescInput');
    const typeInput = document.getElementById('payTypeInput');
    const editIdInput = document.getElementById('payEditId');
    const errDiv = document.getElementById('payErrorMsg');

    const date = dateInput?.value?.trim();
    const amount = parseFloat(amountInput?.value || 0);
    const description = descInput?.value?.trim() || 'Ödeme';
    const paymentType = typeInput?.value || 'Banka/Havale';
    const id = editIdInput?.value?.trim() || null;

    if (errDiv) errDiv.style.display = 'none';

    if (!date) {
      if (errDiv) { errDiv.textContent = 'Lütfen geçerli bir tarih seçin.'; errDiv.style.display = 'block'; }
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      if (errDiv) { errDiv.textContent = 'Ödeme tutarı 0\'dan büyük olmalıdır.'; errDiv.style.display = 'block'; }
      return;
    }

    try {
      const res = await fetch('/api/admin/statement/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({ id, date, amount, description, paymentType })
      });

      const data = await res.json();
      if (data && data.success) {
        this.closePaymentModal();
        this.playChime();
        this.showToast(`✅ ÖDEME KAYDEDİLDİ: ₺${amount.toLocaleString('tr-TR')} (${this.formatDateTr(date)})`);
        await this.loadStatement();
      } else {
        if (errDiv) { errDiv.textContent = data.message || 'Ödeme kaydedilemedi.'; errDiv.style.display = 'block'; }
      }
    } catch (err) {
      if (errDiv) { errDiv.textContent = 'Bağlantı hatası: ' + err.message; errDiv.style.display = 'block'; }
    }
  },

  // 9. TÜM ÖDEMELERİ LİSTELEME MODALI
  openAllPaymentsModal() {
    const modal = document.getElementById('allPaymentsModal');
    const tbody = document.getElementById('allPaymentsTableBody');
    if (!modal || !tbody) return;

    const fmt = val => '₺' + Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 });

    if (!this.allPayments || this.allPayments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:var(--admin-muted);">Kayıtlı ödeme bulunmuyor.</td></tr>`;
    } else {
      tbody.innerHTML = this.allPayments.map(p => `
        <tr style="border-bottom:1px solid #E2E8F0;">
          <td style="padding:8px 10px; font-weight:700; color:#1E293B;">${this.formatDateTr(p.date)}</td>
          <td style="padding:8px 10px; color:#334155;">${this.escapeHtml(p.description || 'Ödeme')}</td>
          <td style="padding:8px 10px; font-size:11.5px; color:#64748B;">${this.escapeHtml(p.paymentType || 'Banka')}</td>
          <td style="padding:8px 10px; text-align:right; font-weight:800; color:#15803D;">${fmt(p.amount)}</td>
          <td style="padding:8px 10px; text-align:center;">
            <button type="button" style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; border-radius:4px; padding:3px 8px; font-size:11px; font-weight:700; cursor:pointer;" onclick="AdminApp.deletePayment('${p.id}')">
              Sil
            </button>
          </td>
        </tr>
      `).join('');
    }

    modal.style.display = 'flex';
  },

  closeAllPaymentsModal() {
    const modal = document.getElementById('allPaymentsModal');
    if (modal) modal.style.display = 'none';
  },

  // 10. ÖDEME SİL
  async deletePayment(paymentId) {
    if (!paymentId) return;
    if (!confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?\nİşlem sonrası kalan tutar otomatik güncellenecektir.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/statement/payment/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({ paymentId })
      });

      const data = await res.json();
      if (data && data.success) {
        this.showToast('🗑️ Ödeme kaydı silindi.');
        await this.loadStatement();
        const allModal = document.getElementById('allPaymentsModal');
        if (allModal && allModal.style.display === 'flex') {
          this.openAllPaymentsModal();
        }
      } else {
        alert(data.message || 'Ödeme silinemedi.');
      }
    } catch (err) {
      alert('Silme hatası: ' + err.message);
    }
  },

  // 11. MANUEL POS MODALI
  openManualPosModal(date, currentAmount, currentNote) {
    const modal = document.getElementById('manualPosModal');
    if (!modal) return;

    const dateInput = document.getElementById('manualPosDateInput');
    const amountInput = document.getElementById('manualPosAmountInput');
    const noteInput = document.getElementById('manualPosNoteInput');
    const btnDel = document.getElementById('btnDeleteManualPos');
    const errDiv = document.getElementById('manualPosErrorMsg');

    const targetDate = date || new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = targetDate;
    if (amountInput) amountInput.value = currentAmount > 0 ? currentAmount : '';
    if (noteInput) noteInput.value = currentNote || '';
    if (errDiv) errDiv.style.display = 'none';

    if (btnDel) btnDel.style.display = currentAmount > 0 ? 'inline-block' : 'none';

    modal.style.display = 'flex';
    setTimeout(() => {
      if (amountInput) amountInput.focus();
    }, 150);
  },

  closeManualPosModal() {
    const modal = document.getElementById('manualPosModal');
    if (modal) modal.style.display = 'none';
  },

  async submitManualPos() {
    const dateInput = document.getElementById('manualPosDateInput');
    const amountInput = document.getElementById('manualPosAmountInput');
    const noteInput = document.getElementById('manualPosNoteInput');
    const errDiv = document.getElementById('manualPosErrorMsg');

    const date = dateInput?.value?.trim();
    const amount = parseFloat(amountInput?.value || 0);
    const note = noteInput?.value?.trim() || '';

    if (errDiv) errDiv.style.display = 'none';

    if (!date) {
      if (errDiv) { errDiv.textContent = 'Lütfen geçerli bir tarih seçin.'; errDiv.style.display = 'block'; }
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      if (errDiv) { errDiv.textContent = 'POS tutarı 0\'dan büyük olmalıdır.'; errDiv.style.display = 'block'; }
      return;
    }

    try {
      const res = await fetch('/api/admin/statement/pos-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({ date, amount, note })
      });

      const data = await res.json();
      if (data && data.success) {
        this.closeManualPosModal();
        this.showToast(`✅ POS Kaydı Güncellendi: ₺${amount.toLocaleString('tr-TR')} (${this.formatDateTr(date)})`);
        await this.loadStatement();
      } else {
        if (errDiv) { errDiv.textContent = data.message || 'Kayıt yapılamadı.'; errDiv.style.display = 'block'; }
      }
    } catch (err) {
      if (errDiv) { errDiv.textContent = 'Hata: ' + err.message; errDiv.style.display = 'block'; }
    }
  },

  async deleteManualPos() {
    const date = document.getElementById('manualPosDateInput')?.value?.trim();
    if (!date) return;
    if (!confirm(`${this.formatDateTr(date)} tarihindeki manuel POS kaydını silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch('/api/admin/statement/pos-entry/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({ date })
      });

      const data = await res.json();
      if (data && data.success) {
        this.closeManualPosModal();
        this.showToast('🗑️ Manuel POS kaydı silindi.');
        await this.loadStatement();
      }
    } catch (err) {
      alert('Silme hatası: ' + err.message);
    }
  },

  // 12. EXCEL ŞABLONUNA BİREBİR UYGUN .XLS RAPORU İNDİR (KÂR SÜTUNU DAHİL)
  exportStatementExcel() {
    const rows = this.filteredStatementRows || this.statementRows || [];
    if (rows.length === 0) {
      alert('Dışa aktarılacak ekstre kaydı bulunmuyor.');
      return;
    }

    const s = this.statementSummary || {};
    const fmt = val => Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const todayStr = new Date().toLocaleDateString('tr-TR');

    let totalProfit = 0;
    let tableRowsHtml = '';
    rows.forEach(r => {
      const dateFormatted = this.formatDateTr(r.date) + (r.time && r.time !== '12:00' ? ` ${r.time}` : '');
      const posVal = r.pos > 0 ? fmt(r.pos) : '—';
      const hakVal = r.hakedis > 0 ? fmt(r.hakedis) : '—';
      const payVal = r.paid > 0 ? fmt(r.paid) : '—';
      const descVal = r.description || '';

      let profitVal = '—';
      if (r.pos > 0) {
        const rate = this.getRateForDate(r.date);
        const bankFee = r.pos * (rate / 100);
        const profit = Math.round(((r.pos - (r.hakedis || 0)) - bankFee) * 100) / 100;
        totalProfit += profit;
        profitVal = fmt(profit);
      }

      tableRowsHtml += `
        <tr>
          <td style="text-align:center; padding:6px; border:1px solid #CBD5E1;">${dateFormatted}</td>
          <td style="text-align:left; padding:6px; border:1px solid #CBD5E1;">${this.escapeHtml(descVal)}</td>
          <td style="text-align:right; padding:6px; border:1px solid #CBD5E1; mso-number-format:'\\#,\\#\\#0\\.00';">${posVal}</td>
          <td style="text-align:right; padding:6px; border:1px solid #CBD5E1; color:#0369A1; mso-number-format:'\\#,\\#\\#0\\.00';">${hakVal}</td>
          <td style="text-align:right; padding:6px; border:1px solid #CBD5E1; color:#15803D; mso-number-format:'\\#,\\#\\#0\\.00';">${payVal}</td>
          <td style="text-align:right; padding:6px; border:1px solid #CBD5E1; font-weight:bold; color:#991B1B; mso-number-format:'\\#,\\#\\#0\\.00';">${fmt(r.remaining)}</td>
          <td style="text-align:right; padding:6px; border:1px solid #CBD5E1; font-weight:bold; color:#166534; mso-number-format:'\\#,\\#\\#0\\.00';">${profitVal}</td>
        </tr>
      `;
    });

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          .header-title { font-size: 16pt; font-weight: bold; color: #084C47; }
          .remaining-hero { font-size: 14pt; font-weight: bold; color: #DC2626; background: #FEE2E2; text-align: right; padding: 10px; }
          th { background: #084C47; color: #FFFFFF; font-weight: bold; padding: 8px; border: 1px solid #042A27; }
          .total-row td { background: #F1F5F9; font-weight: bold; padding: 8px; border: 1.5px solid #64748B; }
        </style>
      </head>
      <body>
        <table style="width:100%; margin-bottom:15px;">
          <tr>
            <td colspan="4" class="header-title">BELGİN KUYUMCULUK — CARİ HESAP & KÂR EKSTRESİ</td>
            <td colspan="3" class="remaining-hero">güncel ödenecek tutar: ${fmt(s.totalRemaining)} ₺</td>
          </tr>
          <tr>
            <td colspan="4" style="color:#64748B; font-size:10pt;">Rapor Tarihi: ${todayStr} | Kesinti Oranı: %8 | Banka POS Oranı: %${this.posBankCommissionRate}</td>
            <td colspan="3" style="text-align:right; color:#166534; font-size:10pt; font-weight:bold;">Toplam Net Kâr: ${fmt(totalProfit)} ₺</td>
          </tr>
        </table>

        <table border="1" style="border-collapse:collapse; width:100%;">
          <thead>
            <tr>
              <th style="width:130px;">tarih</th>
              <th style="width:260px; text-align:left;">işlem / açıklama</th>
              <th style="width:130px; text-align:right;">pos</th>
              <th style="width:150px; text-align:right;">hakediş<br><span style="font-size:8.5pt; font-weight:normal;">pos - %8 kesinti</span></th>
              <th style="width:130px; text-align:right;">ödenen</th>
              <th style="width:150px; text-align:right;">kalan tutar</th>
              <th style="width:150px; text-align:right;">kâr<br><span style="font-size:8.5pt; font-weight:normal;">pos - hakediş - pos komisyonu (%${this.posBankCommissionRate})</span></th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
            <tr class="total-row">
              <td style="text-align:center;">TOPLAM</td>
              <td style="text-align:right;">${fmt(s.totalPos)} ₺</td>
              <td style="text-align:right; color:#0369A1;">${fmt(s.totalHakedis)} ₺</td>
              <td style="text-align:left; color:#15803D;">${fmt(s.totalPaid)} ₺</td>
              <td style="text-align:right; color:#991B1B; font-size:12pt;">${fmt(s.totalRemaining)} ₺</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Belgin_Kuyumculuk_Cari_Hesap_Ekstresi_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // 13. RESMİ CARİ HESAP EKSTRESİ PDF / YAZDIR (KÂR BÖLÜMÜ HARİÇ)
  exportStatementPdf() {
    const rows = this.filteredStatementRows || this.statementRows || [];
    if (rows.length === 0) {
      alert('PDF çıktısı alınacak ekstre hareketi bulunmuyor.');
      return;
    }

    const s = this.statementSummary || {};
    const fmt = val => '₺' + Number(val || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const startVal = document.getElementById('stmtStartDate')?.value || '2016-08-01';
    const endVal = document.getElementById('stmtEndDate')?.value || new Date().toISOString().split('T')[0];
    const periodStr = `${this.formatDateTr(startVal)} — ${this.formatDateTr(endVal)}`;
    const nowStr = new Date().toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });

    let rowsHtml = '';
    rows.forEach((r, idx) => {
      const dateFormatted = this.formatDateTr(r.date) + (r.time && r.time !== '12:00' ? ` ${r.time}` : '');
      const isPayment = (r.type === 'PAYMENT');
      const posVal = r.pos > 0 ? fmt(r.pos) : '—';
      const hakVal = r.hakedis > 0 ? fmt(r.hakedis) : '—';
      const payVal = r.paid > 0 ? fmt(r.paid) : '—';
      const remVal = fmt(r.remaining);

      rowsHtml += `
        <tr style="border-bottom: 1px solid #E2E8F0; ${isPayment ? 'background:#F0FDF4;' : (idx % 2 === 1 ? 'background:#F8FAFC;' : 'background:#FFFFFF;')}">
          <td style="padding: 7px 9px; text-align: center; white-space: nowrap; font-size: 10.5px; color: #334155;">
            ${dateFormatted}
          </td>
          <td style="padding: 7px 9px; text-align: left; font-size: 11px; color: #0F172A;">
            <div style="font-weight: 700;">${this.escapeHtml(r.description || 'İşlem')}</div>
            ${r.customerName && r.type === 'POS_SALE' ? `<div style="font-size: 10px; color: #64748B;">Müşteri: ${this.escapeHtml(r.customerName)} | Sağlayıcı: ${r.provider || 'AKBANK'}</div>` : ''}
          </td>
          <td style="padding: 7px 9px; text-align: right; font-weight: 700; font-size: 11px; color: #1E293B;">
            ${posVal}
          </td>
          <td style="padding: 7px 9px; text-align: right; font-weight: 700; font-size: 11px; color: #0369A1;">
            ${hakVal}
          </td>
          <td style="padding: 7px 9px; text-align: right; font-weight: 700; font-size: 11px; color: #15803D;">
            ${payVal}
          </td>
          <td style="padding: 7px 9px; text-align: right; font-weight: 800; font-size: 11.5px; color: ${Number(r.remaining || 0) > 0 ? '#B91C1C' : '#059669'};">
            ${remVal}
          </td>
        </tr>
      `;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Cari Hesap Ekstresi — Belgin Kuyumculuk</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 16px;
            background: #FFF;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #084C47;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .brand-name {
            font-size: 18px;
            font-weight: 900;
            color: #084C47;
            letter-spacing: 0.5px;
          }
          .doc-title {
            font-size: 14px;
            font-weight: 800;
            color: #1E293B;
            margin-top: 2px;
          }
          .doc-meta {
            font-size: 10.5px;
            color: #64748B;
            margin-top: 4px;
          }
          .hero-box {
            background: #FEF2F2;
            border: 2px solid #F87171;
            border-radius: 8px;
            padding: 8px 14px;
            text-align: right;
            min-width: 220px;
          }
          .hero-label {
            font-size: 10.5px;
            font-weight: 800;
            color: #991B1B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .hero-val {
            font-size: 20px;
            font-weight: 900;
            color: #DC2626;
            line-height: 1.2;
          }
          .hero-sub {
            font-size: 9px;
            color: #B91C1C;
            font-weight: 600;
          }
          .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }
          .kpi-card {
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 6px 10px;
            background: #F8FAFC;
          }
          .kpi-card-label {
            font-size: 9.5px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
          }
          .kpi-card-val {
            font-size: 13px;
            font-weight: 800;
            color: #0F172A;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          thead tr {
            background: #084C47 !important;
            color: #FFFFFF !important;
          }
          th {
            padding: 7px 9px;
            font-weight: 800;
            font-size: 10.5px;
            letter-spacing: 0.3px;
          }
          .footer-note {
            margin-top: 16px;
            border-top: 1px solid #E2E8F0;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 9.5px;
            color: #64748B;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; background:#F1F5F9; padding:8px 14px; border-radius:8px;">
          <span style="font-size:12.5px; font-weight:700; color:#334155;">📄 Cari Hesap Ekstresi (Kâr Bilgisi Gizlenmiş Resmi Döküm)</span>
          <button onclick="window.print()" style="background:#084C47; color:#FFF; border:none; padding:7px 16px; border-radius:6px; font-weight:800; font-size:12px; cursor:pointer;">🖨️ PDF Olarak Kaydet / Yazdır</button>
        </div>

        <div class="header">
          <div>
            <div class="brand-name">BELGİN KUYUMCULUK</div>
            <div class="doc-title">CARİ HESAP EKSTRESİ</div>
            <div class="doc-meta">
              <strong>Dönem:</strong> ${periodStr} | <strong>Rapor Tarihi:</strong> ${nowStr}
            </div>
          </div>
          <div class="hero-box">
            <div class="hero-label">Güncel Ödenecek Tutar</div>
            <div class="hero-val">${fmt(s.totalRemaining)}</div>
            <div class="hero-sub">Hakediş — Ödenen Net Bakiye</div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-card-label">Toplam POS Cirosu</div>
            <div class="kpi-card-val">${fmt(s.totalPos)}</div>
          </div>
          <div class="kpi-card" style="background:#F0F9FF; border-color:#BAE6FD;">
            <div class="kpi-card-label" style="color:#0369A1;">Net Hakediş (%92)</div>
            <div class="kpi-card-val" style="color:#0284C7;">${fmt(s.totalHakedis)}</div>
          </div>
          <div class="kpi-card" style="background:#F0FDF4; border-color:#BBF7D0;">
            <div class="kpi-card-label" style="color:#166534;">Toplam Yapılan Ödemeler</div>
            <div class="kpi-card-val" style="color:#16A34A;">${fmt(s.totalPaid)}</div>
          </div>
          <div class="kpi-card" style="background:#FEF2F2; border-color:#FEB2B2;">
            <div class="kpi-card-label" style="color:#991B1B;">Güncel Ödenecek Tutar</div>
            <div class="kpi-card-val" style="color:#DC2626;">${fmt(s.totalRemaining)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:115px; text-align:center;">Tarih & Saat</th>
              <th style="text-align:left;">İşlem & Açıklama</th>
              <th style="width:110px; text-align:right;">POS (₺)</th>
              <th style="width:125px; text-align:right;">Hakediş (%92) (₺)</th>
              <th style="width:110px; text-align:right;">Ödenen (₺)</th>
              <th style="width:125px; text-align:right;">Bakiye (₺)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr style="background:#084C47; color:#FFFFFF; font-weight:800; font-size:11.5px;">
              <td colspan="2" style="padding:8px 9px; text-align:right; text-transform:uppercase;">GENEL TOPLAMLAR:</td>
              <td style="padding:8px 9px; text-align:right;">${fmt(s.totalPos)}</td>
              <td style="padding:8px 9px; text-align:right;">${fmt(s.totalHakedis)}</td>
              <td style="padding:8px 9px; text-align:right;">${fmt(s.totalPaid)}</td>
              <td style="padding:8px 9px; text-align:right; color:#FEF08A;">${fmt(s.totalRemaining)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer-note">
          <div>Belgin Kuyumculuk Resmi Cari Hesap Dökümüdür.</div>
          <div>Menderes Cad. No:231/B Buca / İZMİR</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=950,height=750');
    if (!printWin) {
      alert('Lütfen tarayıcınızın açılır pencere (pop-up) engelleyicisini kapatıp tekrar deneyin.');
      return;
    }
    printWin.document.open();
    printWin.document.write(printHtml);
    printWin.document.close();
  },

  // ========================================================
  // MAĞAZA VE MANUEL FATURALAR MODÜLÜ MOTORU
  // ========================================================

  // 1. FORM BAŞLATICI & SIFIRLAYICI
  initStoreInvoiceForm() {
    const dateInput = document.getElementById('storeInvoiceDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
    if (!this.storeItems || this.storeItems.length === 0) {
      this.storeItems = [
        { name: '7 Gram 22 Ayar Ajda Altın Bilezik', qty: 1, unitPrice: 10000, kdvRate: 0, lineTotal: 10000, kdvAmount: 0 },
        { name: 'İşçilik', qty: 1, unitPrice: 1000, kdvRate: 20, lineTotal: 1000, kdvAmount: 166.67 }
      ];
    }
    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();
  },

  editStoreInvoice(orderId) {
    const inv = (this.storeInvoices || []).find(i => i.orderId === orderId || i.id === orderId);
    if (!inv) {
      alert('Fatura kaydı bulunamadı.');
      return;
    }

    this.editingStoreInvoiceId = inv.orderId;

    const nameEl = document.getElementById('storeCustName');
    const idEl = document.getElementById('storeCustIdentity');
    const dateEl = document.getElementById('storeInvoiceDate');
    const addrEl = document.getElementById('storeCustAddress');
    const phoneEl = document.getElementById('storeCustPhone');
    const emailEl = document.getElementById('storeCustEmail');
    const noteEl = document.getElementById('storeInvoiceNote');
    const errEl = document.getElementById('storeInvoiceFormError');

    if (nameEl) nameEl.value = inv.customerName || '';
    if (idEl) idEl.value = inv.customerIdentity || '11111111111';
    if (dateEl) dateEl.value = inv.invoiceDate || new Date().toISOString().slice(0, 10);
    if (addrEl) addrEl.value = inv.customerAddress || 'Menderes Cad. No:231/B Buca İzmir';
    if (phoneEl) phoneEl.value = inv.customerPhone || '';
    if (emailEl) emailEl.value = inv.customerEmail || '';
    if (noteEl) noteEl.value = inv.note || '';
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    if (Array.isArray(inv.items) && inv.items.length > 0) {
      this.storeItems = JSON.parse(JSON.stringify(inv.items));
    } else {
      this.storeItems = [
        { name: inv.productName || 'Satış Kalemi', qty: 1, unitPrice: Number(inv.totalAmount || 0), kdvRate: 0, lineTotal: Number(inv.totalAmount || 0), kdvAmount: 0 }
      ];
    }

    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();

    const banner = document.getElementById('storeEditModeBanner');
    const textEl = document.getElementById('storeEditInvoiceIdText');
    if (banner) banner.style.display = 'flex';
    if (textEl) textEl.textContent = inv.orderId;

    const saveDraftBtn = document.getElementById('btnSaveStoreDraft');
    const saveGibBtn = document.getElementById('btnSaveAndGibStore');
    if (saveDraftBtn) saveDraftBtn.innerHTML = '<span>💾 Değişiklikleri Güncelle (Taslak)</span>';
    if (saveGibBtn) saveGibBtn.innerHTML = '<span>🧾 Güncelle & GİB SMS Başlat</span>';

    document.getElementById('storeInvoiceForm')?.scrollIntoView({ behavior: 'smooth' });
    this.showToast(`✏️ Fatura (${inv.orderId}) düzenleme moduna alındı.`);
  },

  cancelStoreInvoiceEdit() {
    this.editingStoreInvoiceId = null;
    this.resetStoreInvoiceForm();
    this.showToast('ℹ️ Fatura düzenleme işlemi iptal edildi.');
  },

  resetStoreInvoiceForm(showFeedback = true) {
    this.editingStoreInvoiceId = null;

    const banner = document.getElementById('storeEditModeBanner');
    if (banner) banner.style.display = 'none';

    const saveDraftBtn = document.getElementById('btnSaveStoreDraft');
    const saveGibBtn = document.getElementById('btnSaveAndGibStore');
    if (saveDraftBtn) saveDraftBtn.innerHTML = '<span>💾 Faturayı Kaydet (Taslak)</span>';
    if (saveGibBtn) saveGibBtn.innerHTML = '<span>🧾 Resmi GİB e-Arşiv Faturası Kes (SMS Onayı)</span>';

    const nameEl = document.getElementById('storeCustName');
    const idEl = document.getElementById('storeCustIdentity');
    const dateEl = document.getElementById('storeInvoiceDate');
    const addrEl = document.getElementById('storeCustAddress');
    const phoneEl = document.getElementById('storeCustPhone');
    const emailEl = document.getElementById('storeCustEmail');
    const noteEl = document.getElementById('storeInvoiceNote');
    const errEl = document.getElementById('storeInvoiceFormError');

    if (nameEl) nameEl.value = '';
    if (idEl) idEl.value = '11111111111';
    if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
    if (addrEl) addrEl.value = 'Menderes Cad. No:231/B Buca İzmir';
    if (phoneEl) phoneEl.value = '';
    if (emailEl) emailEl.value = '';
    if (noteEl) noteEl.value = '';
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    // Formu tamamen sıfırla - boş başlangıç kalemi
    this.storeItems = [
      { name: '', qty: 1, unitPrice: 0, kdvRate: 0, lineTotal: 0, kdvAmount: 0 }
    ];
    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();

    if (showFeedback) {
      this.showToast('🧹 Fatura formu temizlendi.');
    }
  },

  // ==========================================
  // AKILLI FATURA & İŞÇİLİK HESAPLAMA ASİSTANI METODLARI
  // ==========================================
  setSmartCalcAmount(amount) {
    const el = document.getElementById('smartCalcTotalAmount');
    if (el) {
      el.value = Number(amount).toLocaleString('tr-TR');
    }
    this.handleSmartCalcChange();
  },

  selectSmartCalcProduct(name, unitPrice) {
    const nameEl = document.getElementById('smartCalcProductName');
    const priceEl = document.getElementById('smartCalcUnitPrice');
    if (nameEl) nameEl.value = name;
    if (priceEl) priceEl.value = unitPrice;
    this.handleSmartCalcChange();
  },

  setSmartCalcWorkmanshipRate(rate) {
    const rateEl = document.getElementById('smartCalcWorkmanshipRate');
    if (rateEl) {
      rateEl.value = rate;
    }
    this.handleSmartCalcChange();
  },

  parseSmartCalcAmount(valStr) {
    if (!valStr) return 0;
    const clean = String(valStr).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
    return Math.max(0, parseFloat(clean) || 0);
  },

  calculateSmartCalcBreakdown(skipQtyAutoCalc = false) {
    const totalInput = document.getElementById('smartCalcTotalAmount');
    const nameInput = document.getElementById('smartCalcProductName');
    const priceInput = document.getElementById('smartCalcUnitPrice');
    const qtyInput = document.getElementById('smartCalcQty');
    const rateInput = document.getElementById('smartCalcWorkmanshipRate');
    const amountInput = document.getElementById('smartCalcWorkmanshipAmount');

    const totalAmount = this.parseSmartCalcAmount(totalInput?.value || 0);
    const prodName = String(nameInput?.value || '22 Ayar Altın / Ziynet').trim();
    let unitPrice = Math.max(0, parseFloat(priceInput?.value) || 0);
    const workmanshipRate = Math.max(0, parseFloat(rateInput?.value) || 0);

    // İşçilik tutarı ve altın matrahı hesabı
    const workmanshipTotal = Math.round((totalAmount * (workmanshipRate / 100)) * 100) / 100;
    const goldTotal = Math.max(0, Math.round((totalAmount - workmanshipTotal) * 100) / 100);

    // İşçilik KDV %20 ayrıştırması
    const workmanshipNet = Math.round((workmanshipTotal / 1.20) * 100) / 100;
    const workmanshipKdv = Math.round((workmanshipTotal - workmanshipNet) * 100) / 100;

    // Adet hesabı
    let calcQty = 1;
    if (skipQtyAutoCalc && qtyInput && parseInt(qtyInput.value, 10) > 0) {
      calcQty = Math.max(1, parseInt(qtyInput.value, 10));
      if (calcQty > 0 && goldTotal > 0 && priceInput) {
        unitPrice = Math.round((goldTotal / calcQty) * 100) / 100;
        priceInput.value = unitPrice;
      }
    } else if (unitPrice > 0 && goldTotal > 0) {
      calcQty = Math.max(1, Math.floor(goldTotal / unitPrice));
      if (qtyInput) {
        qtyInput.value = calcQty;
      }
    } else if (qtyInput && parseInt(qtyInput.value, 10) > 0) {
      calcQty = Math.max(1, parseInt(qtyInput.value, 10));
    }

    // Canlı metin alanlarını güncelle
    const liveGoldEl = document.getElementById('smartCalcLiveGoldText');
    const liveWorkEl = document.getElementById('smartCalcLiveWorkmanshipText');
    const liveGrandEl = document.getElementById('smartCalcLiveGrandTotalText');

    if (liveGoldEl) {
      liveGoldEl.textContent = '₺' + goldTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (liveWorkEl) {
      liveWorkEl.textContent = '₺' + workmanshipTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        ` (KDV %20: ₺${workmanshipKdv.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    if (liveGrandEl) {
      liveGrandEl.textContent = '₺' + totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return {
      totalAmount,
      goldTotal,
      workmanshipTotal,
      workmanshipNet,
      workmanshipKdv,
      prodName,
      unitPrice,
      calcQty
    };
  },

  handleSmartCalcChange() {
    const res = this.calculateSmartCalcBreakdown(false);
    const amountInput = document.getElementById('smartCalcWorkmanshipAmount');
    if (amountInput && res.workmanshipTotal >= 0) {
      amountInput.value = res.workmanshipTotal > 0 ? res.workmanshipTotal : 0;
    }
  },

  handleSmartCalcQtyChange() {
    const res = this.calculateSmartCalcBreakdown(true);
    const amountInput = document.getElementById('smartCalcWorkmanshipAmount');
    if (amountInput && res.workmanshipTotal >= 0) {
      amountInput.value = res.workmanshipTotal > 0 ? res.workmanshipTotal : 0;
    }
  },

  handleSmartCalcWorkmanshipAmountChange() {
    const totalInput = document.getElementById('smartCalcTotalAmount');
    const amountInput = document.getElementById('smartCalcWorkmanshipAmount');
    const rateInput = document.getElementById('smartCalcWorkmanshipRate');

    const totalAmount = this.parseSmartCalcAmount(totalInput?.value || 0);
    const workAmt = Math.max(0, parseFloat(amountInput?.value) || 0);

    if (totalAmount > 0 && rateInput) {
      const calculatedRate = Math.round(((workAmt / totalAmount) * 100) * 100) / 100;
      rateInput.value = calculatedRate;
    }
    this.calculateSmartCalcBreakdown(false);
  },

  applySmartCalcToInvoice(isAppend = false) {
    const res = this.calculateSmartCalcBreakdown();
    if (!res.totalAmount || res.totalAmount <= 0) {
      alert('⚠️ Lütfen önce geçerli bir Fatura Toplam Tutarı giriniz (Örn: 100.000 TL).');
      const totalInput = document.getElementById('smartCalcTotalAmount');
      if (totalInput) totalInput.focus();
      return;
    }

    const itemsToAdd = [];
    const q = Math.max(1, Number(res.calcQty || 1));
    const unitGoldPrice = Math.round((res.goldTotal / q) * 100) / 100;
    const calculatedGoldLineTotal = Math.round(q * unitGoldPrice * 100) / 100;

    if (res.workmanshipTotal > 0) {
      // 1 kuruş yuvarlama farkını işçilik satırı ile dengeleyerek genel toplamı kuruşu kuruşuna tam res.totalAmount yap
      const delta = Math.round((res.totalAmount - (calculatedGoldLineTotal + res.workmanshipTotal)) * 100) / 100;
      const balancedWorkmanshipTotal = Math.round((res.workmanshipTotal + delta) * 100) / 100;
      const workNet = Math.round((balancedWorkmanshipTotal / 1.20) * 100) / 100;
      const workKdv = Math.round((balancedWorkmanshipTotal - workNet) * 100) / 100;

      // 1. Kıymetli Maden Satırı (%0 KDV Özel Matrah)
      if (calculatedGoldLineTotal > 0) {
        itemsToAdd.push({
          name: res.prodName,
          qty: q,
          unitPrice: unitGoldPrice,
          kdvRate: 0,
          lineTotal: calculatedGoldLineTotal,
          kdvAmount: 0
        });
      }

      // 2. İşçilik Satırı (%20 KDV)
      if (balancedWorkmanshipTotal > 0) {
        const workItemName = 'İşçilik';
        itemsToAdd.push({
          name: workItemName,
          qty: 1,
          unitPrice: balancedWorkmanshipTotal,
          kdvRate: 20,
          lineTotal: balancedWorkmanshipTotal,
          kdvAmount: workKdv
        });
      }
    } else {
      // İşçiliksiz (%0 KDV) durumda 1 kuruş fark varsa adetleri dengele
      const delta = Math.round((res.totalAmount - calculatedGoldLineTotal) * 100) / 100;
      if (delta !== 0 && q > 1) {
        const line1Qty = q - 1;
        const line1Total = Math.round(line1Qty * unitGoldPrice * 100) / 100;
        const line2Price = Math.round((unitGoldPrice + delta) * 100) / 100;

        itemsToAdd.push({
          name: res.prodName,
          qty: line1Qty,
          unitPrice: unitGoldPrice,
          kdvRate: 0,
          lineTotal: line1Total,
          kdvAmount: 0
        });
        itemsToAdd.push({
          name: res.prodName,
          qty: 1,
          unitPrice: line2Price,
          kdvRate: 0,
          lineTotal: line2Price,
          kdvAmount: 0
        });
      } else {
        itemsToAdd.push({
          name: res.prodName,
          qty: q,
          unitPrice: unitGoldPrice,
          kdvRate: 0,
          lineTotal: calculatedGoldLineTotal,
          kdvAmount: 0
        });
      }
    }

    if (itemsToAdd.length === 0) {
      alert('⚠️ Eklenecek fatura kalemi oluşturulamadı.');
      return;
    }

    if (!isAppend) {
      // Satırları doldur (mevcut satırları temizle ve yenilerini koy)
      this.storeItems = itemsToAdd;
    } else {
      // Ek kalem olarak ilave et
      if (this.storeItems.length === 1 && (!this.storeItems[0].name || this.storeItems[0].unitPrice === 0)) {
        this.storeItems = itemsToAdd;
      } else {
        this.storeItems.push(...itemsToAdd);
      }
    }

    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();

    this.showToast(isAppend ? `➕ ${itemsToAdd.length} yeni kalem faturaya eklendi.` : `⚡ Fatura satırları (₺${res.totalAmount.toLocaleString('tr-TR')}) kuruşu kuruşuna tam olarak dolduruldu.`);
  },

  // İşçilik Kalemi Ekle (Açıklama: 'İşçilik', KDV: %1, %1.5, %2)
  addStoreLaborRow(laborPercent = 1) {
    const rate = parseFloat(laborPercent) || 1;
    
    // Eğer faturada daha önce girilmiş bir altın satırı varsa, onun tutarı üzerinden akıllı hesapla
    let calculatedAmount = 0;
    const goldItems = (this.storeItems || []).filter(it => (it.name || '').trim() && Number(it.unitPrice || 0) > 0 && it.name.trim() !== 'İşçilik');
    if (goldItems.length > 0) {
      const lastGold = goldItems[goldItems.length - 1];
      const goldTot = Number(lastGold.lineTotal || lastGold.unitPrice || 0);
      if (goldTot > 0) {
        calculatedAmount = Math.round(goldTot * (rate / 100) * 100) / 100;
      }
    }

    const lineTot = calculatedAmount;
    let kdvAmt = 0;
    if (rate > 0 && lineTot > 0) {
      kdvAmt = Math.round((lineTot - (lineTot / (1 + (rate / 100)))) * 100) / 100;
    }

    const newLaborItem = {
      name: 'İşçilik',
      qty: 1,
      unitPrice: calculatedAmount || '',
      kdvRate: rate,
      lineTotal: lineTot,
      kdvAmount: kdvAmt
    };

    if (this.storeItems.length === 1 && (!this.storeItems[0].name || this.storeItems[0].unitPrice === 0)) {
      this.storeItems = [newLaborItem];
    } else {
      this.storeItems.push(newLaborItem);
    }

    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();
    this.showToast(`➕ "İşçilik" (%${rate} KDV) satırı faturaya eklendi${calculatedAmount > 0 ? ` (Tutar: ₺${calculatedAmount.toLocaleString('tr-TR')})` : ''}.`);
  },

  // Hızlı Ürün Şablonu Uygula
  applyStoreProductTemplate(name, price, kdvRate = 0) {
    let rate = Number(kdvRate);
    if (this.isWatchProduct(name)) {
      rate = 20; // Saat ürünlerinde %20 KDV yasal zorunluluktur
    }
    const lineTot = Number(price || 0);
    let kdvAmt = 0;
    if (rate > 0) {
      kdvAmt = Math.round((lineTot - (lineTot / (1 + (rate / 100)))) * 100) / 100;
    }

    if (this.storeItems.length === 1 && (!this.storeItems[0].name || this.storeItems[0].unitPrice === 0)) {
      this.storeItems[0] = { name, qty: 1, unitPrice: price, kdvRate: rate, lineTotal: lineTot, kdvAmount: kdvAmt };
    } else {
      this.storeItems.push({ name, qty: 1, unitPrice: price, kdvRate: rate, lineTotal: lineTot, kdvAmount: kdvAmt });
    }
    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();
  },

  addStoreInvoiceItemRow(name = '', qty = 1, unitPrice = 0, kdvRate = 20) {
    const q = Math.max(1, Number(qty || 1));
    const p = Number(unitPrice || 0);
    const rate = Number(kdvRate !== undefined ? kdvRate : 20);
    const lineTot = Math.round(q * p * 100) / 100;
    let kdvAmt = 0;
    if (rate > 0) {
      kdvAmt = Math.round((lineTot - (lineTot / (1 + (rate / 100)))) * 100) / 100;
    }

    this.storeItems.push({
      name: name || '',
      qty: q,
      unitPrice: p,
      kdvRate: rate,
      lineTotal: lineTot,
      kdvAmount: kdvAmt
    });
    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();
  },

  removeStoreInvoiceItemRow(idx) {
    if (this.storeItems.length <= 1) {
      this.storeItems = [{ name: '', qty: 1, unitPrice: 0, kdvRate: 0, lineTotal: 0, kdvAmount: 0 }];
    } else {
      this.storeItems.splice(idx, 1);
    }
    this.renderStoreInvoiceItems();
    this.calculateStoreInvoiceLiveSummary();
  },

  isWatchProduct(name) {
    if (!name) return false;
    const n = String(name).toLowerCase().trim();
    const watchKeywords = [
      'saat', 'watch', 'rolex', 'submariner', 'datejust', 'daytona', 'oyster',
      'gmt-master', 'day-date', 'yacht-master', 'sea-dweller', 'air-king', 'explorer', 'sky-dweller',
      'cartier', 'santos', 'tank', 'panthere', 'ballon bleu', 'ronde',
      'patek', 'philippe', 'nautilus', 'aquanaut', 'calatrava', 'complications',
      'audemars', 'piguet', 'royal oak', 'offshore',
      'omega', 'speedmaster', 'seamaster', 'constellation', 'de ville',
      'breitling', 'navitimer', 'superocean', 'chronomat', 'avenger',
      'tag heuer', 'monaco', 'carrera', 'aquaracer', 'formula 1',
      'hublot', 'big bang', 'classic fusion',
      'iwc', 'portugieser', 'portofino', 'da vinci',
      'panerai', 'luminor', 'radiomir',
      'vacheron', 'constantin', 'overseas', 'patrimony',
      'seiko', 'prospex', 'presage', 'astron', 'king seiko', '5 sports',
      'tissot', 'prx', 'seastar', 'gentleman', 'le locle',
      'longines', 'hydroconquest', 'master collection', 'spirit',
      'versace', 'medusa', 'icon active',
      'calvin klein', 'michael kors', 'diesel', 'fossil', 'guess', 'welder', 'gc',
      'citizen', 'orient', 'casio', 'edifice', 'g-shock', 'hamilton', 'chopard', 'zenith', 'montblanc'
    ];

    return watchKeywords.some(kw => {
      const regex = new RegExp('(?:^|\\s|[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])' + kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?:$|\\s|[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])', 'i');
      return regex.test(n) || n.includes(kw);
    });
  },

  updateStoreItem(idx, field, val) {
    if (!this.storeItems[idx]) return;
    if (field === 'name') {
      const nameVal = String(val || '');
      this.storeItems[idx].name = nameVal;
      // Saat ürünü girildiyse ve KDV 0 ise otomatik 20 yap ve uyar
      if (this.isWatchProduct(nameVal) && Number(this.storeItems[idx].kdvRate || 0) === 0) {
        this.storeItems[idx].kdvRate = 20;
        this.showToast(`⚠️ "${nameVal}" saat ürünü olduğu için 3065 Sayılı KDV Kanunu gereğince KDV oranı otomatik %20 yapıldı.`);
        this.renderStoreInvoiceItems();
        return;
      }
    } else if (field === 'kdvRate') {
      const newRate = Number(val || 0);
      // Eğer saat ürününe 0 KDV verilmek istenirse REDDET ve %20'de tut
      if (newRate < 20 && this.isWatchProduct(this.storeItems[idx].name)) {
        this.storeItems[idx].kdvRate = 20;
        alert(`❌ MEVZUAT UYARISI / KDV KORUMASI:\n\n"${this.storeItems[idx].name}" bir saat ürünüdür.\n\n3065 Sayılı KDV Kanunu gereğince saat satışlarında %20 KDV oranı yasal zorunluluktur. Saat ürünleri altın gibi %0 KDV (Özel Matrah) olarak faturalandırılamaz!\n\nKDV oranı zorunlu olarak %20'ye sabitlendi.`);
        this.showToast(`❌ Saat ürünlerinde %0 KDV uygulanamaz. %20 KDV zorunludur!`);
        this.renderStoreInvoiceItems();
        return;
      }
      this.storeItems[idx].kdvRate = newRate;
    } else if (field === 'qty') {
      this.storeItems[idx].qty = Math.max(1, parseInt(val, 10) || 1);
    } else if (field === 'unitPrice') {
      this.storeItems[idx].unitPrice = Math.max(0, parseFloat(val) || 0);
    }

    const q = Number(this.storeItems[idx].qty || 1);
    const p = Number(this.storeItems[idx].unitPrice || 0);
    const rate = Number(this.storeItems[idx].kdvRate || 0);
    const lineTot = Math.round(q * p * 100) / 100;
    let kdvAmt = 0;
    if (rate > 0) {
      kdvAmt = Math.round((lineTot - (lineTot / (1 + (rate / 100)))) * 100) / 100;
    }

    this.storeItems[idx].lineTotal = lineTot;
    this.storeItems[idx].kdvAmount = kdvAmt;

    const lineTotalEl = document.getElementById(`storeItemLineTotal_${idx}`);
    if (lineTotalEl) {
      lineTotalEl.textContent = '₺' + lineTot.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const kdvAmountEl = document.getElementById(`storeItemKdvAmount_${idx}`);
    if (kdvAmountEl) {
      kdvAmountEl.textContent = '₺' + kdvAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    this.calculateStoreInvoiceLiveSummary();
  },

  renderStoreInvoiceItems() {
    const tbody = document.getElementById('storeItemsTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.storeItems.map((item, idx) => `
      <tr>
        <td style="text-align:center; font-weight:700; color:var(--admin-muted);">${idx + 1}</td>
        <td>
          <input type="text" class="form-field-input" style="padding:6px 8px; font-size:12px; width:100%;" 
                 value="${this.escapeHtml(item.name || '')}" 
                 placeholder="Ürün veya hizmet adı (Örn: 22 Ayar Bilezik, İşçilik, Saat)" 
                 oninput="AdminApp.updateStoreItem(${idx}, 'name', this.value)" required>
        </td>
        <td style="text-align:center;">
          <input type="number" min="1" step="1" class="form-field-input" style="padding:6px 4px; font-size:12px; width:60px; text-align:center; font-weight:700;" 
                 value="${item.qty || 1}" 
                 oninput="AdminApp.updateStoreItem(${idx}, 'qty', this.value)" required>
        </td>
        <td style="text-align:right;">
          <input type="number" min="0" step="0.01" class="form-field-input" style="padding:6px 6px; font-size:12px; width:110px; text-align:right; font-weight:700;" 
                 value="${item.unitPrice || ''}" 
                 placeholder="0.00" 
                 oninput="AdminApp.updateStoreItem(${idx}, 'unitPrice', this.value)" required>
        </td>
        <td style="text-align:center;">
          <select class="form-field-input" style="padding:5px 4px; font-size:12px; width:85px; text-align:center; font-weight:800; background:#FFF; border-color:${Number(item.kdvRate) === 0 ? '#10B981' : '#0284C7'};" 
                  onchange="AdminApp.updateStoreItem(${idx}, 'kdvRate', this.value)">
            <option value="0" ${Number(item.kdvRate) === 0 ? 'selected' : ''}>%0</option>
            <option value="1" ${Number(item.kdvRate) === 1 ? 'selected' : ''}>%1</option>
            <option value="1.5" ${Number(item.kdvRate) === 1.5 ? 'selected' : ''}>%1,5</option>
            <option value="2" ${Number(item.kdvRate) === 2 ? 'selected' : ''}>%2</option>
            <option value="10" ${Number(item.kdvRate) === 10 ? 'selected' : ''}>%10</option>
            <option value="20" ${Number(item.kdvRate) === 20 ? 'selected' : ''}>%20</option>
          </select>
        </td>
        <td style="text-align:right; font-weight:700; font-size:12px; color:#0284C7;" id="storeItemKdvAmount_${idx}">
          ₺${Number(item.kdvAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="text-align:right; font-weight:800; font-size:12.5px; color:#047857;" id="storeItemLineTotal_${idx}">
          ₺${Number(item.lineTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="text-align:center;">
          <button type="button" style="background:none; border:none; color:#DC2626; font-size:15px; cursor:pointer; padding:4px;" 
                  onclick="AdminApp.removeStoreInvoiceItemRow(${idx})" title="Kalemi Sil">
            ✕
          </button>
        </td>
      </tr>
    `).join('');
  },

  calculateStoreInvoiceLiveSummary() {
    let totalGoldMatrah = 0;
    let totalTaxableNet = 0;
    let totalKdv = 0;
    let totalGrand = 0;

    this.storeItems.forEach(it => {
      const q = Math.max(1, Number(it.qty || 1));
      const p = Number(it.unitPrice || 0);
      const lineTot = Math.round(q * p * 100) / 100;
      const rate = Number(it.kdvRate !== undefined ? it.kdvRate : 0);

      totalGrand = Math.round((totalGrand + lineTot) * 100) / 100;

      if (rate === 0) {
        totalGoldMatrah = Math.round((totalGoldMatrah + lineTot) * 100) / 100;
      } else {
        const netMatrah = Math.round((lineTot / (1 + (rate / 100))) * 100) / 100;
        const kdvAmt = Math.round((lineTot - netMatrah) * 100) / 100;
        totalTaxableNet = Math.round((totalTaxableNet + netMatrah) * 100) / 100;
        totalKdv = Math.round((totalKdv + kdvAmt) * 100) / 100;
      }
    });

    const goldEl = document.getElementById('storeLiveGoldMatrah');
    const workNetEl = document.getElementById('storeLiveWorkmanshipNet');
    const workKdvEl = document.getElementById('storeLiveWorkmanshipKdv');
    const grandTotEl = document.getElementById('storeLiveGrandTotal');

    if (goldEl) goldEl.textContent = '₺' + Number(totalGoldMatrah || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (workNetEl) workNetEl.textContent = '₺' + Number(totalTaxableNet || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (workKdvEl) workKdvEl.textContent = '₺' + Number(totalKdv || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (grandTotEl) grandTotEl.textContent = '₺' + Number(totalGrand || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      total: totalGrand,
      hasGoldAmount: totalGoldMatrah,
      workmanshipNet: totalTaxableNet,
      workmanshipKdv: totalKdv,
      grandTotal: totalGrand
    };
  },

  // 2. MAĞAZA FATURASI KAYDETME (TASLAK VEYA ANINDA GİB SMS)
  async submitStoreInvoice(autoStartGibSms = false) {
    const name = (document.getElementById('storeCustName')?.value || '').trim();
    let identity = (document.getElementById('storeCustIdentity')?.value || '').trim().replace(/\D/g, '');
    if (identity.length !== 10 && identity.length !== 11) {
      identity = '11111111111';
    }
    const date = (document.getElementById('storeInvoiceDate')?.value || '').trim();
    const address = (document.getElementById('storeCustAddress')?.value || '').trim();
    const phone = (document.getElementById('storeCustPhone')?.value || '').trim();
    const email = (document.getElementById('storeCustEmail')?.value || '').trim();
    const note = (document.getElementById('storeInvoiceNote')?.value || '').trim();
    const errEl = document.getElementById('storeInvoiceFormError');

    if (!name) {
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Lütfen alıcı müşteri adı / unvanını giriniz.'; }
      return;
    }
    if (!date) {
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Lütfen fatura düzenleme tarihini seçiniz.'; }
      return;
    }

    const validItems = this.storeItems.filter(it => (it.name || '').trim() && (Number(it.lineTotal || 0) > 0 || Number(it.unitPrice || 0) > 0));
    if (validItems.length === 0) {
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Lütfen en az 1 adet geçerli ürün adı ve fiyatı giriniz.'; }
      return;
    }

    const totalAmount = validItems.reduce((acc, it) => acc + Number(it.lineTotal || 0), 0);
    if (totalAmount <= 0) {
      if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Fatura toplam tutarı 0\'dan büyük olmalıdır.'; }
      return;
    }

    // 3065 Sayılı KDV Kanunu Koruma Kalkanı: Saat ürünlerinde %20 KDV kontrolü
    for (const it of validItems) {
      if (this.isWatchProduct(it.name) && Number(it.kdvRate || 0) < 20) {
        if (errEl) {
          errEl.style.display = 'block';
          errEl.innerHTML = `<strong>❌ MEVZUAT ENGELİ:</strong> "${it.name}" bir saat ürünüdür. 3065 Sayılı KDV Kanunu gereğince saat satışlarında %20 KDV oranı yasal zorunluluktur. %0 KDV (Özel Matrah) uygulanamaz! Lütfen KDV oranını %20 olarak güncelleyiniz.`;
        }
        alert(`❌ MEVZUAT ENGELİ / KDV KORUMASI:\n\n"${it.name}" bir saat ürünüdür.\n\n3065 Sayılı KDV Kanunu gereğince saat ürünlerinde %20 KDV oranı yasal zorunluluktur. Saat ürünleri altın gibi %0 KDV olarak faturalandırılamaz!\n\nLütfen ilgili satırın KDV oranını %20 yapınız.`);
        return;
      }
    }

    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    const saveDraftBtn = document.getElementById('btnSaveStoreDraft');
    const saveGibBtn = document.getElementById('btnSaveAndGibStore');

    if (saveDraftBtn) saveDraftBtn.disabled = true;
    if (saveGibBtn) saveGibBtn.disabled = true;

    const isEdit = Boolean(this.editingStoreInvoiceId);
    let existingDoc = this.editingStoreInvoiceId ? (this.storeInvoices || []).find(i => i.orderId === this.editingStoreInvoiceId || i.id === this.editingStoreInvoiceId) : null;

    let invoiceId = this.editingStoreInvoiceId;
    if (!invoiceId) {
      const datePart = date.replace(/-/g, '');
      const randPart = Math.floor(1000 + Math.random() * 9000);
      invoiceId = `MGS-${datePart}-${randPart}`;
    }

    const summaryData = this.calculateStoreInvoiceLiveSummary();
    const nowIso = new Date().toISOString();
    const invoiceDoc = {
      orderId: invoiceId,
      id: invoiceId,
      isStoreManual: true,
      source: 'STORE_MANUAL',
      customerName: name,
      customerIdentity: identity,
      invoiceDate: date,
      customerAddress: address || 'Menderes Cad. No:231/B Buca İzmir',
      customerPhone: phone,
      customerEmail: email,
      items: validItems,
      totalAmount: totalAmount,
      total: totalAmount,
      productName: validItems.map(i => `${i.name} (x${i.qty || 1})`).join(', '),
      breakdown: summaryData,
      invoiceStatus: existingDoc?.invoiceStatus || 'PENDING',
      invoiceNumber: existingDoc?.invoiceNumber || null,
      invoiceUuid: existingDoc?.invoiceUuid || null,
      status: 'PAID',
      paymentStatus: 'PAID',
      isPaid: true,
      note: note,
      createdAt: existingDoc?.createdAt || nowIso,
      updatedAt: isEdit ? nowIso : (existingDoc?.createdAt || nowIso)
    };

    // 1. Önce Local Cache'e anında kaydet ve ekranda listele
    try {
      let localList = [];
      const stored = localStorage.getItem('belgin_store_invoices');
      if (stored) {
        try { localList = JSON.parse(stored); } catch (_) {}
      }
      localList = [invoiceDoc, ...localList.filter(x => x.orderId !== invoiceId)];
      localStorage.setItem('belgin_store_invoices', JSON.stringify(localList));
      this.storeInvoices = localList;
      this.filterStoreTable();
      this.showToast(isEdit ? `✅ Fatura (${invoiceId}) başarıyla güncellendi.` : `✅ Mağaza Fatura Taslağı (${invoiceId}) listeye eklendi.`);
    } catch (_) {}

    this.resetStoreInvoiceForm();

    // 2. Sunucuya arka planda kaydet
    try {
      const res = await fetch('/api/admin/store-invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          ...invoiceDoc,
          adminKey: this.adminPin
        })
      });

      const rawText = await res.text();
      let data = null;
      try { data = JSON.parse(rawText); } catch (_) {}

      if (data && data.success) {
        await this.loadStoreInvoices();
      }
    } catch (e) {
      console.warn('[Store Invoices] Sunucu senkronizasyon uyarısı:', e.message);
    } finally {
      if (saveDraftBtn) saveDraftBtn.disabled = false;
      if (saveGibBtn) saveGibBtn.disabled = false;
    }

    // 3. Kullanıcı "Hemen GİB SMS Başlat" dediyse SMS sürecini başlat
    if (autoStartGibSms) {
      await this.startStoreInvoiceSigning(invoiceId, invoiceDoc);
    }
  },

  // 3. MAĞAZA FATURALARINI YÜKLE
  async loadStoreInvoices() {
    // 1. Önce localStorage'dan hızlıca yükle
    try {
      const stored = localStorage.getItem('belgin_store_invoices');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.storeInvoices = parsed;
          this.filterStoreTable();
        }
      }
    } catch (_) {}

    const startDate = document.getElementById('storeStartDate')?.value || '';
    const endDate = document.getElementById('storeEndDate')?.value || '';
    const status = document.getElementById('storeStatusFilter')?.value || 'ALL';

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (status) params.append('status', status);

    try {
      const res = await fetch(`/api/admin/store-invoices?${params.toString()}`, {
        headers: { 'x-admin-key': this.adminPin }
      });

      if (res.status === 401) {
        this.showAuthGate();
        return;
      }

      const rawText = await res.text();
      let data = null;
      try { data = JSON.parse(rawText); } catch (_) {}

      if (data && data.success && Array.isArray(data.invoices)) {
        this.storeInvoices = data.invoices;
        try { localStorage.setItem('belgin_store_invoices', JSON.stringify(this.storeInvoices)); } catch (_) {}

        // KPI Metrikleri
        const kpiVol = document.getElementById('storeKpiTotalVolume');
        const kpiSigned = document.getElementById('storeKpiSignedCount');
        const kpiPending = document.getElementById('storeKpiPendingCount');
        const badgeStore = document.getElementById('tabBadgeStoreInvoices');

        if (kpiVol) kpiVol.textContent = data.summary?.formattedTotalVolume || '₺0';
        if (kpiSigned) kpiSigned.textContent = data.summary?.signedCount || 0;
        if (kpiPending) kpiPending.textContent = data.summary?.pendingCount || 0;
        if (badgeStore) badgeStore.textContent = this.storeInvoices.length;

        this.filterStoreTable();
      }
    } catch (err) {
      console.warn('[AdminApp] Mağaza faturaları yüklenirken hata:', err.message);
    }

    const syncEl = document.getElementById('storeLastSyncTime');
    if (syncEl) syncEl.textContent = 'Son Güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
  },

  // 4. MAĞAZA TARİH VE PRESET SEÇİMİ
  selectStorePreset(preset, btnEl) {
    this.currentStorePreset = preset;
    document.querySelectorAll('[data-store-preset]').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const startInput = document.getElementById('storeStartDate');
    const endInput = document.getElementById('storeEndDate');
    const today = new Date();
    const toDateStr = d => d.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        if (startInput) startInput.value = toDateStr(today);
        if (endInput) endInput.value = toDateStr(today);
        break;
      case 'yesterday':
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        if (startInput) startInput.value = toDateStr(y);
        if (endInput) endInput.value = toDateStr(y);
        break;
      case 'last7':
        const d7 = new Date(today);
        d7.setDate(d7.getDate() - 6);
        if (startInput) startInput.value = toDateStr(d7);
        if (endInput) endInput.value = toDateStr(today);
        break;
      case 'thisMonth':
        const fMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (startInput) startInput.value = toDateStr(fMonth);
        if (endInput) endInput.value = toDateStr(today);
        break;
      case 'last30':
        const d30 = new Date(today);
        d30.setDate(d30.getDate() - 29);
        if (startInput) startInput.value = toDateStr(d30);
        if (endInput) endInput.value = toDateStr(today);
        break;
      case 'all':
      default:
        if (startInput) startInput.value = '';
        if (endInput) endInput.value = '';
        break;
    }

    this.loadStoreInvoices();
  },

  onStoreCustomDateChange() {
    document.querySelectorAll('[data-store-preset]').forEach(b => b.classList.remove('active'));
    this.loadStoreInvoices();
  },

  // 5. MAĞAZA TABLO FİLTRELEME VE SAYFALAMA
  filterStoreTable() {
    const searchVal = (document.getElementById('storeSearchInput')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('storeStatusFilter')?.value || 'ALL';

    const visibleInvoices = this.storeInvoices.filter(inv => {
      const matchSearch = !searchVal ||
        (inv.orderId && inv.orderId.toLowerCase().includes(searchVal)) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(searchVal)) ||
        (inv.customerIdentity && inv.customerIdentity.includes(searchVal)) ||
        (inv.customerPhone && inv.customerPhone.includes(searchVal)) ||
        (inv.productName && inv.productName.toLowerCase().includes(searchVal));

      let matchStatus = true;
      if (statusVal === 'INVOICE_PENDING') {
        matchStatus = inv.invoiceStatus !== 'SIGNED';
      } else if (statusVal === 'INVOICE_SIGNED') {
        matchStatus = inv.invoiceStatus === 'SIGNED';
      }

      return matchSearch && matchStatus;
    });

    const countBadge = document.getElementById('storeTableCountBadge');
    if (countBadge) {
      countBadge.textContent = `(${visibleInvoices.length} Fatura)`;
    }

    const totalItems = visibleInvoices.length;
    const totalPages = Math.ceil(totalItems / this.storePageSize) || 1;
    if (this.currentStorePage > totalPages) this.currentStorePage = totalPages;
    if (this.currentStorePage < 1) this.currentStorePage = 1;

    const startIdx = totalItems === 0 ? 0 : (this.currentStorePage - 1) * this.storePageSize + 1;
    const endIdx = Math.min(this.currentStorePage * this.storePageSize, totalItems);
    const pagedInvoices = visibleInvoices.slice((this.currentStorePage - 1) * this.storePageSize, this.currentStorePage * this.storePageSize);

    // Sayfalama Barı
    const pageInfo = document.getElementById('storePaginationInfo');
    if (pageInfo) {
      pageInfo.textContent = `Toplam ${totalItems} faturadan ${startIdx}-${endIdx} arası gösteriliyor (Sayfa ${this.currentStorePage} / ${totalPages})`;
    }

    const btnPrev = document.getElementById('btnStorePrevPage');
    const btnNext = document.getElementById('btnStoreNextPage');
    if (btnPrev) btnPrev.disabled = this.currentStorePage <= 1;
    if (btnNext) btnNext.disabled = this.currentStorePage >= totalPages;

    const pageButtonsContainer = document.getElementById('storePageNumberButtons');
    if (pageButtonsContainer) {
      let pageBtnsHtml = '';
      for (let p = 1; p <= totalPages; p++) {
        pageBtnsHtml += `
          <button class="btn-page ${p === this.currentStorePage ? 'active' : ''}" onclick="AdminApp.goToStorePage(${p})">
            ${p}
          </button>
        `;
      }
      pageButtonsContainer.innerHTML = pageBtnsHtml;
    }

    const tbody = document.getElementById('storeInvoicesTableBody');
    const mobileList = document.getElementById('storeInvoicesMobileList');

    if (pagedInvoices.length === 0) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center; padding:36px; color:var(--admin-muted); font-size:13px; font-weight:600;">
              Seçilen kriterlere uygun mağaza faturası bulunamadı.
            </td>
          </tr>
        `;
      }
      if (mobileList) {
        mobileList.innerHTML = `
          <div style="text-align:center; padding:32px 16px; color:var(--admin-muted); font-size:13px; font-weight:600;">
            Seçilen kriterlere uygun mağaza faturası bulunamadı.
          </div>
        `;
      }
      this.updateStoreAccountingUI();
      return;
    }

    // 1. Masaüstü Tablo Satırları
    if (tbody) {
      tbody.innerHTML = pagedInvoices.map(inv => {
        const isSigned = (inv.invoiceStatus === 'SIGNED');
        const isSelected = this.selectedStoreInvoiceIds.has(inv.orderId);

        const invoiceBadge = isSigned
          ? '<span style="background:#DCFCE7; color:#15803D; padding:4px 9px; border-radius:6px; font-weight:800; border:1px solid #86EFAC;">🧾 İmzalandı</span>'
          : (inv.invoiceStatus === 'DRAFT'
          ? '<span style="background:#FEF3C7; color:#92400E; padding:4px 9px; border-radius:6px; font-weight:800; border:1px solid #FCD34D;">🧾 Taslak</span>'
          : '<span style="background:#FEE2E2; color:#991B1B; padding:4px 9px; border-radius:6px; font-weight:800; border:1px solid #FCA5A5;">⚠️ Kesilmedi</span>');

        const createdTime = this.formatTimeTr(inv.createdAt);
        const updatedTime = this.formatTimeTr(inv.updatedAt);
        const invoicedTime = this.formatTimeTr(inv.invoicedAt);

        const itemsDisplay = Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.map(i => `<span style="font-weight:700; color:#0F172A;">${this.escapeHtml(i.name || 'Ürün')}</span> <span style="color:#64748B; font-weight:800;">(x${i.qty || 1})</span>`).join('<br>')
          : `<span style="font-weight:700; color:#0F172A;">${this.escapeHtml(inv.productName || 'Kuyumculuk Satışı')}</span>`;

        return `
          <tr style="${isSelected ? 'background:#F0FDF4;' : ''}">
            <td style="text-align:center;">
              <input type="checkbox" class="invoice-row-checkbox" value="${inv.orderId}" 
                     ${isSelected ? 'checked' : ''} 
                     ${!isSigned ? 'disabled title="Yalnızca imzalanmış faturalar seçilebilir"' : 'title="Muhasebeye iletmek için seçin"'} 
                     onchange="AdminApp.toggleStoreInvoiceSelection('${inv.orderId}', this.checked)">
            </td>
            <td style="font-family:monospace; font-weight:800; font-size:12px; color:#064E3B;">${inv.orderId}</td>
            <td style="font-size:11.5px; color:#334155; white-space:nowrap;">
              <div style="font-weight:800; color:#0F172A; font-size:12px;">${this.formatDateTr(inv.invoiceDate)}</div>
              ${createdTime ? `<div style="font-size:10.5px; color:#64748B; margin-top:2px;">🕒 Kayıt: <strong style="color:#334155;">${createdTime}</strong></div>` : ''}
              ${(updatedTime && updatedTime !== createdTime) ? `<div style="font-size:10px; color:#92400E; margin-top:1px;">✏️ Günc: <strong>${updatedTime}</strong></div>` : ''}
              ${invoicedTime ? `<div style="font-size:10px; color:#15803D; margin-top:1px;">🧾 İmza: <strong>${invoicedTime}</strong></div>` : ''}
            </td>
            <td>
              <div style="font-weight:800; font-size:13px; color:#0F172A;">${this.escapeHtml(inv.customerName || 'Müşteri')}</div>
              <div style="font-size:11.5px; color:#475569; font-weight:600;">${inv.customerPhone || '—'}</div>
              <div style="font-size:11px; color:#92400E; font-weight:800;">🆔 <span style="font-family:monospace;">${inv.customerIdentity || '11111111111'}</span></div>
            </td>
            <td style="font-size:12px; color:#1E293B; line-height:1.4;">${itemsDisplay}</td>
            <td style="font-weight:800; font-size:14px; color:#047857; text-align:right; white-space:nowrap;">
              ₺${Number(inv.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="text-align:center;">
              ${invoiceBadge}
            </td>
            <td style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
              ${!isSigned ? `
                <button class="btn-admin-primary" style="padding:5px 10px; font-size:11.5px; background:linear-gradient(135deg, #059669 0%, #10B981 100%); border-color:#059669; color:#FFF; font-weight:800;" onclick="AdminApp.startStoreInvoiceSigning('${inv.orderId}')" title="GİB e-Arşiv Fatura Kes (SMS)">
                  🧾 Fatura Kes
                </button>
                <button class="btn-admin-secondary" style="padding:5px 10px; font-size:11.5px; background:#FFFBEB; border-color:#FCD34D; color:#92400E; font-weight:800;" onclick="AdminApp.editStoreInvoice('${inv.orderId}')" title="Taslak Faturayı Düzenle">
                  ✏️ Düzenle
                </button>
              ` : `
                <button class="btn-admin-secondary" style="padding:5px 10px; font-size:11.5px; background:#F0FDF4; border-color:#86EFAC; color:#15803D; font-weight:800;" onclick="AdminApp.viewStoreInvoice('${inv.invoiceUuid}', '${inv.orderId}')" title="Faturayı Aç / Yazdır">
                  📄 Fatura
                </button>
                <button class="btn-admin-secondary" style="padding:5px 10px; font-size:11.5px; background:#10B981; border-color:#059669; color:#FFF; font-weight:800;" onclick="AdminApp.sendStoreInvoiceViaWhatsApp('${inv.orderId}')" title="Faturayı WhatsApp ile Müşteriye İlet">
                  📲 Müşteri
                </button>
                <button class="btn-admin-secondary" style="padding:5px 10px; font-size:11.5px; background:#DCFCE7; border-color:#86EFAC; color:#166534; font-weight:800;" onclick="AdminApp.sendStoreInvoiceToAccounting('${inv.orderId}')" title="Bu Faturayı Doğrudan Muhasebeye İlet">
                  📲 Muhasebe
                </button>
              `}
              <button class="btn-admin-secondary" style="padding:5px 8px; font-size:11.5px; border-color:#FCA5A5; color:#DC2626; background:#FEF2F2;" onclick="AdminApp.deleteStoreInvoice('${inv.orderId}')" title="Mağaza Faturasını Kalıcı Sil">
                🗑️
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // 2. Mobil Kart Listesi (≤ 768px)
    if (mobileList) {
      mobileList.innerHTML = pagedInvoices.map(inv => {
        const isSigned = (inv.invoiceStatus === 'SIGNED');
        const isSelected = this.selectedStoreInvoiceIds.has(inv.orderId);
        const cleanPhone = String(inv.customerPhone || '').replace(/\D/g, '');
        const waPhone = cleanPhone.startsWith('0') ? '90' + cleanPhone.substring(1) : (cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone);

        const createdTime = this.formatTimeTr(inv.createdAt);
        const updatedTime = this.formatTimeTr(inv.updatedAt);

        const invoiceBadge = isSigned
          ? '<span style="background:#DCFCE7; color:#15803D; padding:4px 10px; border-radius:12px; font-weight:800; border:1px solid #86EFAC; font-size:11px;">🧾 İmzalandı</span>'
          : (inv.invoiceStatus === 'DRAFT'
          ? '<span style="background:#FEF3C7; color:#92400E; padding:4px 10px; border-radius:12px; font-weight:800; border:1px solid #FCD34D; font-size:11px;">🧾 Taslak</span>'
          : '<span style="background:#FEE2E2; color:#991B1B; padding:4px 10px; border-radius:12px; font-weight:800; border:1px solid #FCA5A5; font-size:11px;">⚠️ Kesilmedi</span>');

        const itemsDisplay = Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items.map(i => `${this.escapeHtml(i.name || 'Ürün')} (x${i.qty || 1})`).join(', ')
          : this.escapeHtml(inv.productName || 'Kuyumculuk Satışı');

        return `
          <article class="admin-mobile-card ${isSigned ? 'card-status-paid' : 'card-status-pending'}" style="${isSelected ? 'border-color:#10B981; background:#F8FCF9;' : ''}">
            <div class="mobile-card-header">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                ${isSigned ? `
                  <label class="mobile-select-chip ${isSelected ? 'selected' : ''}" onclick="event.stopPropagation();">
                    <input type="checkbox" class="mobile-invoice-checkbox" value="${inv.orderId}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="AdminApp.toggleStoreInvoiceSelection('${inv.orderId}', this.checked)">
                    <span>${isSelected ? '✓ Muhasebe Seçili' : '+ Muhasebe Seç'}</span>
                  </label>
                ` : ''}
                <span class="mobile-order-id">${inv.orderId}</span>
                ${invoiceBadge}
              </div>
              <time class="mobile-order-time" style="font-size:11.5px; line-height:1.3; text-align:right;">
                <div style="color:#0F172A; font-weight:800;">${this.formatDateTr(inv.invoiceDate)}</div>
                ${createdTime ? `<div style="font-size:10px; color:#475569; font-weight:600;">🕒 ${createdTime}</div>` : ''}
                ${(updatedTime && updatedTime !== createdTime) ? `<div style="font-size:9.5px; color:#92400E; font-weight:700;">✏️ ${updatedTime}</div>` : ''}
              </time>
            </div>

            <div class="mobile-card-body">
              <div class="mobile-customer-info">
                <div class="mobile-customer-name" style="font-size:15px; font-weight:800; color:#0F172A;">${this.escapeHtml(inv.customerName || 'Müşteri')}</div>
                <div class="mobile-customer-meta" style="margin-top:6px;">
                  ${inv.customerPhone && inv.customerPhone !== '—' ? `
                    <a href="tel:${inv.customerPhone}" class="mobile-meta-link mobile-meta-phone" title="Müşteriyi Ara">
                      📞 ${inv.customerPhone}
                    </a>
                    <a href="https://wa.me/${waPhone}" target="_blank" rel="noopener" class="mobile-meta-link mobile-meta-wa" title="WhatsApp Aç">
                      💬 WhatsApp
                    </a>
                  ` : ''}
                  <span class="mobile-meta-tckn">🆔 ${inv.customerIdentity || '11111111111'}</span>
                </div>
                <div style="font-size:12px; color:#1E293B; font-weight:600; margin-top:6px; background:#F1F5F4; padding:6px 10px; border-radius:6px;">📦 ${itemsDisplay}</div>
              </div>

              <div class="mobile-financial-row" style="background:#F8FAFB; border:1px solid #CBD5E1; padding:12px 14px; border-radius:10px;">
                <div class="mobile-amount-box">
                  <span class="mobile-amount-label" style="color:#475569; font-weight:800;">Fatura Tutarı</span>
                  <span class="mobile-amount-value" style="font-size:18px; color:#047857; font-weight:800;">₺${Number(inv.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="mobile-invoice-box">
                  <span class="mobile-amount-label" style="color:#475569; font-weight:800;">e-Arşiv Durumu</span>
                  <div style="margin-top:2px;">${invoiceBadge}</div>
                </div>
              </div>
            </div>

            <div class="mobile-card-actions">
              ${!isSigned ? `
                <button type="button" class="btn-mobile-action btn-mobile-invoice-sign" onclick="AdminApp.startStoreInvoiceSigning('${inv.orderId}')">
                  <span>🧾 GİB e-Arşiv Fatura Kes (SMS)</span>
                </button>
              ` : `
                <div class="mobile-actions-split">
                  <button type="button" class="btn-mobile-action btn-mobile-invoice-view" onclick="AdminApp.viewStoreInvoice('${inv.invoiceUuid}', '${inv.orderId}')">
                    <span>📄 Faturayı Aç</span>
                  </button>
                  <button type="button" class="btn-mobile-action btn-mobile-invoice-wa" onclick="AdminApp.sendStoreInvoiceViaWhatsApp('${inv.orderId}')">
                    <span>📲 Müşteriye</span>
                  </button>
                </div>
              `}

              <div class="mobile-actions-grid-bottom" style="grid-template-columns: 1fr 1fr;">
                ${isSigned ? `
                  <button type="button" class="btn-mobile-subaction" style="background:#DCFCE7; color:#166534; border-color:#86EFAC; font-weight:800;" onclick="AdminApp.sendStoreInvoiceToAccounting('${inv.orderId}')">
                    <span>📲 Muhasebe</span>
                  </button>
                ` : `
                  <button type="button" class="btn-mobile-subaction" style="background:#FEF3C7; color:#92400E; border-color:#FCD34D; font-weight:800;" onclick="AdminApp.editStoreInvoice('${inv.orderId}')">
                    <span>✏️ Düzenle</span>
                  </button>
                `}
                <button type="button" class="btn-mobile-subaction" style="color:#991B1B; border-color:#FCA5A5; background:#FEE2E2; font-weight:800;" onclick="AdminApp.deleteStoreInvoice('${inv.orderId}')">
                  <span>🗑️ Sil</span>
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    this.updateStoreAccountingUI();
  },

  goToStorePage(p) {
    this.currentStorePage = p;
    this.filterStoreTable();
  },
  prevStorePage() {
    if (this.currentStorePage > 1) {
      this.currentStorePage--;
      this.filterStoreTable();
    }
  },
  nextStorePage() {
    this.currentStorePage++;
    this.filterStoreTable();
  },

  // 6. MAĞAZA SEÇİM & MUHASEBE GÖNDERİMİ
  toggleStoreInvoiceSelection(orderId, isChecked) {
    if (isChecked) {
      this.selectedStoreInvoiceIds.add(orderId);
    } else {
      this.selectedStoreInvoiceIds.delete(orderId);
    }
    this.filterStoreTable();
  },

  toggleSelectAllStoreInvoices(isChecked) {
    if (isChecked) {
      this.storeInvoices.forEach(inv => {
        if (inv.invoiceStatus === 'SIGNED') {
          this.selectedStoreInvoiceIds.add(inv.orderId);
        }
      });
    } else {
      this.selectedStoreInvoiceIds.clear();
    }
    this.filterStoreTable();
  },

  updateStoreAccountingUI() {
    const badge = document.getElementById('storeAccountingSelectedBadge');
    const count = this.selectedStoreInvoiceIds.size;
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  },

  openStoreAccountingModal() {
    const selected = this.storeInvoices.filter(i => this.selectedStoreInvoiceIds.has(i.orderId) && i.invoiceStatus === 'SIGNED');
    const invoicesToSend = selected.length > 0 ? selected : this.storeInvoices.filter(i => i.invoiceStatus === 'SIGNED');

    if (invoicesToSend.length === 0) {
      alert('⚠️ Muhasebeye gönderilecek imzalanmış mağaza faturası bulunamadı.\n\nLütfen önce faturaları GİB üzerinde imzalayınız.');
      return;
    }

    const modal = document.getElementById('accountingModal');
    const summaryCount = document.getElementById('accModalSummaryCount');
    const summaryTotal = document.getElementById('accModalSummaryTotal');
    const listEl = document.getElementById('accModalList');
    const previewEl = document.getElementById('accModalMessagePreview');

    const totalSum = invoicesToSend.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);

    if (summaryCount) summaryCount.textContent = `${invoicesToSend.length} Mağaza Faturası Seçildi`;
    if (summaryTotal) summaryTotal.textContent = '₺' + totalSum.toLocaleString('tr-TR', { minimumFractionDigits: 2 });

    if (listEl) {
      listEl.innerHTML = invoicesToSend.map((inv, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-bottom:1px solid #EEE; font-size:12px;">
          <div>
            <span style="font-weight:800; color:#064E3B;">${idx + 1}. ${inv.orderId}</span> — 
            <span style="font-weight:700; color:#1E293B;">${this.escapeHtml(inv.customerName || 'Müşteri')}</span>
            <span style="font-size:11px; color:#64748B;">(${this.formatDateTr(inv.invoiceDate)})</span>
          </div>
          <div style="font-weight:800; color:#15803D;">
            ₺${Number(inv.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      `).join('');
    }

    const msg = this.generateAccountingWhatsAppMessage(invoicesToSend);
    if (previewEl) previewEl.value = msg;

    if (modal) modal.classList.add('open');
  },

  sendStoreInvoiceToAccounting(orderId) {
    const inv = this.storeInvoices.find(i => i.orderId === orderId);
    if (!inv || inv.invoiceStatus !== 'SIGNED') {
      alert('⚠️ Bu fatura henüz imzalanmamış.');
      return;
    }

    const msg = this.generateAccountingWhatsAppMessage([inv]);
    const waUrl = `https://api.whatsapp.com/send?phone=${this.ACCOUNTING_PHONE}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  },

  // 7. GİB İŞLEMLERİ (TEKİL & TOPLU İMZA)
  async startStoreInvoiceSigning(invoiceId, fallbackDoc = null) {
    this.isBatchInvoice = false;
    let inv = (this.storeInvoices || []).find(i => i.orderId === invoiceId || i.id === invoiceId);
    if (!inv && fallbackDoc) inv = fallbackDoc;
    if (!inv) return;

    this.activeInvoiceOrderId = invoiceId;
    const bd = inv.breakdown || this.calculateStoreInvoiceLiveSummary();
    this.activeInvoiceBreakdown = bd;

    const summaryBox = document.getElementById('smsModalOrderSummary');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>Fatura No:</strong> ${inv.orderId}</span>
          <span><strong>Müşteri:</strong> ${this.escapeHtml(inv.customerName || 'Nihai Tüketici')}</span>
        </div>
        ${Number(bd.hasGoldAmount || 0) > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>Kıymetli Maden (%0 KDV):</strong> ₺${Number(bd.hasGoldAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>` : ''}
        ${Number(bd.workmanshipTotal || bd.workmanshipNet || 0) > 0 ? `
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span><strong>Saat / İşçilik (%20 KDV):</strong> ₺${Number(bd.workmanshipTotal || (Number(bd.workmanshipNet || 0) + Number(bd.workmanshipKdv || 0))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between; font-weight:800; color:var(--admin-teal); border-top:1px solid #D1E5E1; padding-top:3px; margin-top:3px;">
          <span>Toplam Fatura Tutarı:</span>
          <span>₺${Number(inv.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>
      `;
    }

    const input = document.getElementById('gibSmsInput');
    const errDiv = document.getElementById('smsErrorMsg');
    const submitBtn = document.getElementById('btnSubmitGibSms');
    if (input) input.value = '';
    if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>'; }

    try {
      if (submitBtn) submitBtn.innerHTML = '<span>⏳ GİB Taslak & SMS Hazırlanıyor...</span>';
      const draftRes = await fetch('/api/admin/invoice/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': this.adminPin
        },
        body: JSON.stringify({
          orderId: inv.orderId,
          totalAmount: Number(inv.totalAmount || 0),
          orderData: inv,
          adminKey: this.adminPin
        })
      });

      const rawText = await draftRes.text();
      let draftData = null;
      try { draftData = JSON.parse(rawText); } catch (_) {}

      if (!draftData || !draftData.success) {
        alert('❌ Taslak Fatura Uyarısı:\n\n' + (draftData?.message || 'GİB bağlantısı kurulamadı.'));
        if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';
        return;
      }

      this.activeInvoiceUuid = draftData.invoiceUuid;
      this.activeInvoiceOid = draftData.oid || '';
      if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';

      const smsModal = document.getElementById('invoiceSmsModal');
      if (smsModal) smsModal.classList.add('open');
      if (input) setTimeout(() => input.focus(), 150);

      if (draftData && draftData.isMock && errDiv) {
        errDiv.style.display = 'block';
        errDiv.style.color = '#084C47';
        errDiv.textContent = 'ℹ️ Test / Simülasyon Modu: Kod olarak 123456 girebilirsiniz.';
      }
    } catch (e) {
      alert('❌ GİB Bağlantı Hatası: ' + e.message);
      if (submitBtn) submitBtn.innerHTML = '<span>✅ Doğrula & Faturayı İmzala</span>';
    }
  },

  async startBatchStoreInvoiceSigning() {
    const selected = this.storeInvoices.filter(i => this.selectedStoreInvoiceIds.has(i.orderId) && i.invoiceStatus !== 'SIGNED');
    const pending = selected.length > 0 ? selected : this.storeInvoices.filter(i => i.invoiceStatus !== 'SIGNED');

    if (pending.length === 0) {
      alert('⚠️ Faturası kesilecek bekleyen veya seçilmiş mağaza kaydı bulunamadı.');
      return;
    }

    const orderIds = pending.map(i => i.orderId);
    const confirmMsg = `🧾 TOPLU GİB E-ARŞİV FATURA KESİMİ\n\nToplam ${orderIds.length} adet mağaza kaydı için tek seferde GİB taslağı açılacak ve telefonunuza TEK BİR SMS kodu gönderilecektir.\n\nİşlemi başlatmak istiyor musunuz?`;
    if (!confirm(confirmMsg)) return;

    this.isBatchInvoice = true;
    this.batchPendingStoreInvoices = pending;

    const summaryBox = document.getElementById('smsModalOrderSummary');
    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="font-weight:800; color:var(--admin-teal); margin-bottom:4px;">
          📦 Toplu Mağaza Fatura Listesi (${pending.length} Adet):
        </div>
        <div style="max-height:110px; overflow-y:auto; font-size:11.5px;">
          ${pending.map(p => `<div>• <strong>${p.orderId}</strong> — ${this.escapeHtml(p.customerName)} (₺${Number(p.totalAmount || 0).toLocaleString('tr-TR')})</div>`).join('')}
        </div>
      `;
    }

    try {
      const draftRes = await fetch('/api/admin/invoice/batch-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': this.adminPin },
        body: JSON.stringify({ orderIds, adminKey: this.adminPin })
      });

      const draftData = await draftRes.json();
      if (draftData && draftData.success) {
        this.batchDraftItems = draftData.draftInvoices || [];
        this.activeInvoiceOid = draftData.oid || '';

        const smsModal = document.getElementById('invoiceSmsModal');
        if (smsModal) smsModal.classList.add('open');
        const input = document.getElementById('gibSmsInput');
        if (input) setTimeout(() => input.focus(), 150);
      } else {
        alert('❌ Toplu taslak hatası: ' + (draftData?.message || 'Bağlantı kurulamadı.'));
      }
    } catch (e) {
      alert('❌ Toplu işlem hatası: ' + e.message);
    }
  },

  viewStoreInvoice(invoiceUuid, orderId) {
    const url = `/api/admin/invoice/view?uuid=${encodeURIComponent(invoiceUuid || '')}&orderId=${encodeURIComponent(orderId || '')}&adminKey=${encodeURIComponent(this.adminPin)}`;
    window.open(url, '_blank');
  },

  sendStoreInvoiceViaWhatsApp(orderId) {
    const inv = this.storeInvoices.find(i => i.orderId === orderId);
    if (!inv) return;

    let phone = String(inv.customerPhone || '').replace(/\D/g, '');
    if (!phone) {
      alert('⚠️ Müşteri telefon numarası kayıtlı değil.');
      return;
    }
    if (phone.startsWith('0')) phone = '90' + phone.substring(1);
    if (!phone.startsWith('90')) phone = '90' + phone;

    const invoiceUrl = `https://www.belginkuyumculuk.com/api/admin/invoice/view?uuid=${encodeURIComponent(inv.invoiceUuid || '')}&orderId=${encodeURIComponent(inv.orderId || '')}&print=1`;
    const msg = `Sayın ${inv.customerName},\n\nBelgin Kuyumculuk mağazamızdan gerçekleştirdiğiniz alışverişe ait e-Arşiv faturanız düzenlenmiştir.\n\n📄 Belge No: ${inv.invoiceNumber || 'GİB e-Arşiv'}\n💰 Tutar: ₺${Number(inv.totalAmount || 0).toLocaleString('tr-TR')}\n📄 Fatura (PDF İndir): ${invoiceUrl}\n\nBizi tercih ettiğiniz için teşekkür ederiz.\nBelgin Kuyumculuk — Menderes Cad. No:231/B Buca İzmir`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  },

  async deleteStoreInvoice(orderId) {
    if (!orderId) return;
    if (!confirm(`⚠️ ${orderId} numaralı mağaza faturası kalıcı olarak silinecektir.\n\nOnaylıyor musunuz?`)) return;

    // 1. Önce anında memory ve localStorage'dan sil ve arayüzü anında güncelle
    this.storeInvoices = (this.storeInvoices || []).filter(inv => inv.orderId !== orderId && inv.id !== orderId);
    this.selectedStoreInvoiceIds.delete(orderId);
    try {
      localStorage.setItem('belgin_store_invoices', JSON.stringify(this.storeInvoices));
    } catch (_) {}
    this.filterStoreTable();
    this.showToast(`🗑️ ${orderId} başarıyla silindi.`);

    // 2. Sunucudan sil
    try {
      const res = await fetch('/api/admin/store-invoices/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': this.adminPin },
        body: JSON.stringify({ invoiceId: orderId, orderId: orderId, adminKey: this.adminPin })
      });

      const rawText = await res.text();
      let data = null;
      try { data = JSON.parse(rawText); } catch (_) {}

      // Sunucu listesini tazeleyerek senkronize et
      await this.loadStoreInvoices();
    } catch (e) {
      console.warn('[Store Invoice Delete Server]:', e.message);
    }
  },

  exportStoreInvoicesExcel() {
    if (!this.storeInvoices || this.storeInvoices.length === 0) {
      alert('⚠️ İndirilecek mağaza faturası bulunmuyor.');
      return;
    }

    const fmt = n => Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let totalSum = 0;

    const rowsHtml = this.storeInvoices.map((inv, idx) => {
      totalSum += Number(inv.totalAmount || 0);
      const itemsStr = Array.isArray(inv.items) ? inv.items.map(i => `${i.name} (x${i.qty})`).join(', ') : inv.productName;
      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${inv.orderId}</td>
          <td style="text-align:center;">${this.formatDateTr(inv.invoiceDate)}</td>
          <td>${this.escapeHtml(inv.customerName || 'Müşteri')}</td>
          <td style="text-align:center;">${inv.customerIdentity || '11111111111'}</td>
          <td>${this.escapeHtml(inv.customerPhone || '—')}</td>
          <td>${this.escapeHtml(itemsStr || '')}</td>
          <td style="text-align:right;">${fmt(inv.totalAmount)} ₺</td>
          <td style="text-align:center;">${inv.invoiceStatus === 'SIGNED' ? 'İmzalandı' : 'Taslak/Bekliyor'}</td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
          table { border-collapse: collapse; width: 100%; }
          th { background: #064E3B; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px; font-size: 11pt; }
          td { border: 1px solid #E2E8F0; padding: 6px 8px; font-size: 10pt; }
          .total-row { background: #F0FDF4; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>BELGİN KUYUMCULUK — MAĞAZA VE MANUEL FATURALAR LİSTESİ</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Fatura Takip No</th>
              <th>Tarih</th>
              <th>Müşteri Adı Soyadı</th>
              <th>TCKN / VKN</th>
              <th>Telefon</th>
              <th>Ürünler / Kalemler</th>
              <th>Tutar (₺)</th>
              <th>e-Arşiv Durumu</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="7" style="text-align:right;">GENEL TOPLAM:</td>
              <td style="text-align:right; color:#047857;">${fmt(totalSum)} ₺</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Belgin_Kuyumculuk_Magaza_Faturalari_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  formatDateTr(dateStr) {
    if (!dateStr) return '—';
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}.${month}.${year}`;
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR');
    } catch (_) {
      return dateStr;
    }
  },

  formatTimeTr(ts) {
    if (!ts) return null;
    try {
      if (typeof ts === 'object' && ts._seconds) {
        return new Date(ts._seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      if (typeof ts === 'object' && ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      const d = new Date(ts);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (_) {
      return null;
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.AdminApp = AdminApp;
window.openDeclarationModal = function(id) {
  if (window.AdminApp && typeof window.AdminApp.openDeclarationModal === 'function') {
    window.AdminApp.openDeclarationModal(id);
  }
};
window.closeDeclarationModal = function() {
  if (window.AdminApp && typeof window.AdminApp.closeDeclarationModal === 'function') {
    window.AdminApp.closeDeclarationModal();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
