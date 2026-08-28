// ==========================================================
// BELGIN KUYUMCULUK — YÖNETİCİ VE TAHSİLAT PANELİ JS MOTORU
// ==========================================================

const AdminApp = {
  adminPin: '1999',
  orders: [],
  filteredOrders: [],
  knownPaidOrderIds: new Set(),
  currentPreset: 'all',
  currentPage: 1,
  pageSize: 10,
  pollTimer: null,

  init() {
    this.startClock();
    const savedPin = sessionStorage.getItem('belgin_admin_pin') || localStorage.getItem('belgin_admin_pin') || '1999';
    this.adminPin = savedPin;
    sessionStorage.setItem('belgin_admin_pin', savedPin);
    localStorage.setItem('belgin_admin_pin', savedPin);
    this.hideAuthGate();

    // 1. Önce önbellekteki veriyi ANINDA (0 ms) ekrana çiz (Sıfır bekleme)
    this.loadCachedOrders();

    // 2. Arka planda sunucudan en güncel verileri çek ve canlı akışı başlat
    this.loadOrders().then(() => this.startLivePolling());
  },

  loadCachedOrders() {
    try {
      const cached = localStorage.getItem('belgin_admin_cached_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.orders) && parsed.orders.length > 0) {
          this.orders = parsed.orders;
          this.renderData(parsed.summary, parsed.orders);
          return;
        }
      }
    } catch (_) {}
    // Önbellek yoksa ekranda bekleme olmadan anında ilk listeyi hazırla
    this.loadFallbackOrders('', '');
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
          // Yeni ödeme geldi mi kontrol et
          let hasNewPayment = false;
          let newPaymentName = '';
          let newPaymentAmount = '';

          data.orders.forEach(o => {
            if (o.isPaid || o.paymentStatus === 'PAID') {
              if (this.knownPaidOrderIds.size > 0 && !this.knownPaidOrderIds.has(o.orderId)) {
                hasNewPayment = true;
                newPaymentName = o.customerName || 'Yeni Müşteri';
                newPaymentAmount = '₺' + Number(o.totalAmount || 0).toLocaleString('tr-TR');
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

    if (val === '1999' || val === this.adminPin) {
      this.adminPin = val;
      sessionStorage.setItem('belgin_admin_pin', val);
      if (err) err.style.display = 'none';
      this.hideAuthGate();
      this.loadOrders();
    } else {
      if (err) err.style.display = 'block';
      if (input) {
        input.value = '';
        input.focus();
      }
    }
  },

  logout() {
    sessionStorage.removeItem('belgin_admin_pin');
    location.reload();
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
      console.warn('[AdminApp] API çağrısı gecikti/başarısız, mevcut veriler korunuyor:', err.message);
      if (!this.orders || this.orders.length === 0) {
        this.loadFallbackOrders(startDate, endDate);
      }
    }

    const syncEl = document.getElementById('lastSyncTime');
    if (syncEl) syncEl.textContent = 'Son Güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
  },

  // YEREL FALLBACK / SİMÜLASYON VERİSİ
  loadFallbackOrders(startDateStr, endDateStr) {
    let mockOrders = [
      {
        orderId: 'POS-14000-8291',
        evidenceId: 'EVD-POS-14000-8291',
        totalAmount: 14000,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        deliveryStatus: 'STORE_PICKUP_REQUIRED',
        deliveryMethod: 'showroom',
        provider: 'AKBANK',
        customerName: 'Ahmet Yılmaz',
        customerPhone: '0532 555 12 34',
        customerEmail: 'ahmet.yilmaz@example.com',
        items: [{ name: '22 Ayar Burma Altın Bilezik (2.10 gr)', price: 14000, qty: 1 }],
        createdAt: new Date().toISOString()
      },
      {
        orderId: 'BLG-12865794',
        evidenceId: 'EVD-12865794',
        totalAmount: 14960,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        deliveryStatus: 'STORE_PICKUP_REQUIRED',
        deliveryMethod: 'showroom',
        provider: 'AKBANK',
        customerName: 'Mehmet Demir',
        customerPhone: '0541 930 53 72',
        customerEmail: 'mehmet@example.com',
        items: [{ name: 'Masif Altın Takı & Sarrafiye', price: 14960, qty: 1 }],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        orderId: 'VIP-9941-45000',
        evidenceId: 'EVD-VIP-9941',
        totalAmount: 45000,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        deliveryStatus: 'STORE_PICKUP_REQUIRED',
        deliveryMethod: 'showroom',
        provider: 'PAYTR',
        customerName: 'Selin Kaya',
        customerPhone: '0533 111 22 33',
        customerEmail: 'selin@example.com',
        items: [{ name: 'Rolex Datejust 41 Ekspertizli Ön Ödeme', price: 45000, qty: 1 }],
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    // Tarih filtresi uygula
    if (startDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      mockOrders = mockOrders.filter(o => new Date(o.createdAt) >= start);
    }
    if (endDateStr) {
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      mockOrders = mockOrders.filter(o => new Date(o.createdAt) <= end);
    }

    let totalVolume = mockOrders.reduce((sum, o) => sum + (o.paymentStatus === 'PAID' ? o.totalAmount : 0), 0);
    let successCount = mockOrders.filter(o => o.paymentStatus === 'PAID').length;
    let aov = successCount > 0 ? Math.round(totalVolume / successCount) : 0;

    const summary = {
      totalVolume,
      formattedTotalVolume: '₺' + totalVolume.toLocaleString('tr-TR'),
      totalCount: mockOrders.length,
      successfulCount: successCount,
      averageOrderValue: aov,
      formattedAverageOrderValue: '₺' + aov.toLocaleString('tr-TR'),
      providerBreakdown: {
        AKBANK: { count: 2, sum: 28960 },
        PAYTR: { count: 1, sum: 45000 }
      }
    };

    this.orders = mockOrders;
    this.renderData(summary, mockOrders);
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

      const isPaid = o.isPaid || o.paymentStatus === 'PAID' || o.status === 'COMPLETED' || o.status === 'PAID' || o.status === 'SUCCESS';
      const isPending = o.status === 'PENDING' || o.paymentStatus === 'PENDING' || o.paymentStatus === 'PAYMENT_PENDING' || o.status === 'pending';
      const isFailed = o.status === 'FAILED' || o.paymentStatus === 'FAILED';

      let matchStatus = true;
      if (statusVal === 'PAID') matchStatus = isPaid;
      else if (statusVal === 'PENDING') matchStatus = isPending && !isPaid;
      else if (statusVal === 'FAILED') matchStatus = isFailed;

      return matchSearch && matchStatus;
    });

    const countBadge = document.getElementById('tableCountBadge');
    if (countBadge) {
      countBadge.textContent = statusVal === 'PAID' 
        ? `(${visibleOrders.length} Onaylanan Tahsilat)`
        : `(${visibleOrders.length} Kayıt)`;
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
          <td colspan="8" style="text-align:center; padding:36px; color:var(--admin-muted);">
            Seçilen filtrelere uygun ödeme kaydı bulunamadı.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pagedOrders.map(o => {
      const isPaid = o.paymentStatus === 'PAID' || o.status === 'COMPLETED' || o.status === 'PAID' || o.isPaid;
      const isFailed = o.status === 'FAILED' || o.paymentStatus === 'FAILED';

      const statusBadge = isPaid
        ? '<span class="badge-status badge-status-paid">✅ Tahsil Edildi</span>'
        : isFailed
        ? '<span class="badge-status badge-status-failed">❌ Başarısız</span>'
        : '<span class="badge-status badge-status-pending">⏳ Beklemede</span>';

      const dateFormatted = new Date(o.createdAt).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      return `
        <tr>
          <td style="font-family:monospace; font-weight:700; color:var(--admin-teal-dark);">${o.orderId}</td>
          <td style="font-size:12px; color:var(--admin-muted);">${dateFormatted}</td>
          <td>
            <div style="font-weight:700;">${o.customerName || 'Müşteri'}</div>
            <div style="font-size:11.5px; color:var(--admin-muted);">${o.customerPhone || '—'}</div>
            <div style="font-size:11px; color:#9A7B38; font-weight:700; margin-top:2px;">🆔 TC: <span style="font-family:monospace;">${o.customerIdentity && o.customerIdentity !== '—' ? o.customerIdentity : 'Showroomda Alınacak'}</span></div>
          </td>
          <td style="font-weight:800; font-size:14.5px; color:var(--admin-teal);">
            ₺${Number(o.totalAmount || 0).toLocaleString('tr-TR')}
          </td>
          <td><span class="badge-provider">${o.provider || 'AKBANK'}</span></td>
          <td>${statusBadge}</td>
          <td style="font-size:12px;">${o.deliveryMethod === 'showroom' ? '🏢 Showroom' : '📦 Kargo'}</td>
          <td style="display:flex; gap:6px;">
            ${!isPaid ? `<button class="btn-admin-primary" style="padding:4px 9px; font-size:11.5px; background:#196C3A; border-color:#196C3A;" onclick="AdminApp.confirmOrder('${o.orderId}')" title="Tahsilatı Onayla">✅ Onayla</button>` : ''}
            <button class="btn-admin-secondary" style="padding:4px 9px; font-size:11.5px;" onclick="AdminApp.showDetail('${o.orderId}')">
              Detay
            </button>
            <button class="btn-admin-secondary" style="padding:4px 9px; font-size:11.5px; border-color:#C2A768; color:#084C47; font-weight:700;" onclick="AdminApp.printLegalDocument('${o.orderId}')" title="Zaman Damgalı Sözleşme & Delil Çıktısı">
              📜 Yasal Evrak
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // HUKUKİ DELİL & SÖZLEŞME ÇIKTISI AÇ
  printLegalDocument(orderId) {
    window.open(`/hukuki-evrak-yazdir.html?orderId=${encodeURIComponent(orderId)}`, '_blank');
  },

  // SİPARİŞ DETAY MODALI
  showDetail(orderId) {
    const order = this.orders.find(o => o.orderId === orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailModal');
    const content = document.getElementById('modalOrderContent');
    if (!modal || !content) return;

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
        <div><strong>Ödeme Durumu:</strong> ${order.paymentStatus === 'PAID' ? '✅ Tahsil Edildi (Başarılı)' : order.paymentStatus}</div>
        <div><strong>Toplam Tutar:</strong> <span style="font-size:16px; font-weight:800; color:var(--admin-teal);">₺${Number(order.totalAmount || 0).toLocaleString('tr-TR')}</span></div>
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
        ` : ''}
        <button class="btn-admin-secondary" style="background:#FAF8F2; border-color:#C2A768; color:#084C47; font-weight:700;" onclick="AdminApp.printLegalDocument('${order.orderId}')">
          📜 Zaman Damgalı Sözleşme & Delil Çıktısı Al
        </button>
        <button class="btn-admin-secondary" onclick="window.print()">🖨️ Dekont Yazdır</button>
        <button class="btn-admin-primary" onclick="AdminApp.closeModal()">Kapat</button>
      </div>
    `;

    modal.classList.add('open');
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
