(() => {
  'use strict';

  const form = document.getElementById('evidenceAccessForm');
  const receiptEl = document.getElementById('receipt');
  const messageEl = document.getElementById('message');
  const orderInput = document.getElementById('orderId');

  const params = new URLSearchParams(location.search);
  if (params.get('orderId')) orderInput.value = params.get('orderId');

  function esc(v) {
    return String(v ?? '—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function money(v) {
    return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v||0));
  }
  function dt(v) {
    if (!v) return '—';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeStyle:'medium',timeZone:'Europe/Istanbul'}).format(d);
  }
  function yesNo(v) { return v === true ? 'Evet' : 'Hayır'; }

  async function post(url, body, token) {
    const headers = {'Content-Type':'application/json'};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',credentials:'same-origin'});
    const data = await res.json().catch(()=>({success:false,message:'Sunucu yanıtı okunamadı.'}));
    if (!res.ok || !data.success) throw new Error(data.message || 'İşlem tamamlanamadı.');
    return data;
  }

  function legalRows(documents) {
    if (!documents) return '<tr><td colspan="4">Belge kaydı bulunamadı.</td></tr>';
    return Object.entries(documents).filter(([,v])=>v && typeof v === 'object' && v.sha256).map(([key,v])=>`<tr><td>${esc(key)}</td><td>${esc(v.file)}</td><td>${esc(v.version)}</td><td class="hash">${esc(v.sha256)}</td></tr>`).join('') || '<tr><td colspan="4">Belge kaydı bulunamadı.</td></tr>';
  }

  function itemRows(items) {
    return (items||[]).map(i=>`<tr><td>${esc(i.brand)} ${esc(i.name)}</td><td>${esc(i.reference)}</td><td>${esc(i.metal)}</td><td>${esc(i.qty)}</td><td>${money(i.price)}</td><td>${i.highValueSecureDelivery?'12.000 TL+ güvenli teslim':'Standart'}</td></tr>`).join('');
  }

  function auditRows(events) {
    return (events||[]).map(e=>`<tr><td>${dt(e.serverAt)}</td><td>${esc(e.eventType)}</td><td>${esc(e.paymentStatus||e.deliveryStatus||e.auditId||'—')}</td></tr>`).join('') || '<tr><td colspan="3">Audit olayı bulunamadı.</td></tr>';
  }

  function render(r) {
    const proof = r.legal?.externalProof;
    const d = r.kycAndDelivery?.deliveryVerification;
    receiptEl.innerHTML = `
      <div class="seller-buyer">
        <div class="party"><h3>Satıcı</h3><strong>${esc(r.seller.tradeName)}</strong><div>${esc(r.seller.address)}</div><div>${esc(r.seller.phone)} · ${esc(r.seller.secondaryPhone)}</div><div>${esc(r.seller.email)}</div><div class="small">${esc(r.seller.note)}</div></div>
        <div class="party"><h3>Alıcı</h3><strong>${esc(r.buyer.name)}</strong><div>${esc(r.buyer.email)}</div><div>${esc(r.buyer.phone)}</div><div class="small">Kişisel veriler bu görüntüde ölçülü biçimde maskelenmiştir.</div></div>
      </div>

      <div class="section"><h2>1. Sipariş ve Delil Kimliği</h2><div class="cards">
        <div class="card"><b>Sipariş No</b>${esc(r.order.orderId)}</div>
        <div class="card"><b>Evidence ID</b><span class="hash">${esc(r.order.evidenceId)}</span></div>
        <div class="card"><b>Sipariş Zamanı</b>${dt(r.order.createdAt)}</div>
        <div class="card"><b>Toplam</b>${money(r.order.total)}</div>
        <div class="card"><b>Ödeme</b>${esc(r.payment.provider)} / ${esc(r.payment.status)}</div>
        <div class="card"><b>Teslim</b>${esc(r.order.deliveryMethod)} / ${esc(r.order.deliveryStatus)}</div>
      </div></div>

      <div class="section"><h2>2. Ürün/Fiyat Snapshot</h2><table class="table"><thead><tr><th>Ürün</th><th>Referans</th><th>Metal</th><th>Adet</th><th>Fiyat</th><th>Kontrol</th></tr></thead><tbody>${itemRows(r.items)}</tbody></table><p class="small"><strong>Product Snapshot SHA-256:</strong> <span class="hash">${esc(r.order.productSnapshotHash)}</span></p></div>

      <div class="section"><h2>3. Hukuki Kabul ve Belge Sürümleri</h2><div class="cards">
        <div class="card"><b>Sözleşme Kabulü</b>${yesNo(r.legal.termsAccepted)}</div>
        <div class="card"><b>Ön Bilgilendirme Kabulü</b>${yesNo(r.legal.preInformationAccepted)}</div>
        <div class="card"><b>Yüksek Değerli Teslim Onayı</b>${yesNo(r.legal.highValueDeliveryAccepted)}</div>
        <div class="card"><b>Sunucu Kabul Zamanı</b>${dt(r.legal.acceptedAt)}</div>
        <div class="card"><b>İstemci Gösterim Zamanı</b>${dt(r.legal.clientReportedPresentedAt)}</div>
        <div class="card"><b>İstemci Kabul Zamanı</b>${dt(r.legal.clientReportedAcceptedAt)}</div>
      </div><table class="table"><thead><tr><th>Kayıt</th><th>Belge</th><th>Sürüm</th><th>SHA-256</th></tr></thead><tbody>${legalRows(r.legal.documents)}</tbody></table></div>

      <div class="section"><h2>4. Dış Zaman / Bütünlük İspatı</h2>${proof?`<div class="note"><strong>${esc(proof.model)}</strong><br>Hukuki belge seti kök SHA-256: <span class="hash">${esc(proof.manifestRootSha256)}</span><br><a class="proof-link" href="${esc(proof.proofFile)}" target="_blank" rel="noopener">OpenTimestamps .ots kanıt dosyasını aç</a><div class="small">${esc(proof.legalQualification)}</div></div>`:'<p>Dış zaman ispatı bu sipariş kaydında mevcut değil.</p>'}</div>

      <div class="section"><h2>5. KYC ve Teslim Kontrolleri</h2><div class="cards">
        <div class="card"><b>İç KYC Uygulandı</b>${yesNo(r.kycAndDelivery.internalKycPolicyApplied)}</div>
        <div class="card"><b>İç Eşik</b>${r.kycAndDelivery.internalKycThreshold?money(r.kycAndDelivery.internalKycThreshold):'—'}</div>
        <div class="card"><b>MASAK Kanuni Katmanı</b>${r.kycAndDelivery.masakLegalOverlayRequired?'Kanuni şartlarda ayrıca uygulanır':'—'}</div>
      </div>${d?`<table class="table"><tbody><tr><th>Kimlik doğrulandı</th><td>${yesNo(d.identityVerified)}</td></tr><tr><th>Teslim formu</th><td>${yesNo(d.deliveryFormCompleted)} · ${esc(d.deliveryFormReference)}</td></tr><tr><th>Ürün kimliklendirme</th><td>${yesNo(d.productIdentifiersVerified)} · <span class="hash">${esc(d.productIdentifiersHash)}</span></td></tr><tr><th>Teslim audit ID</th><td>${esc(d.auditId)}</td></tr><tr><th>Teslim zamanı</th><td>${dt(d.completedAt)}</td></tr></tbody></table>`:'<p class="small">Teslim doğrulama kaydı henüz tamamlanmamış olabilir.</p>'}</div>

      <div class="section"><h2>6. Audit Olay Zinciri</h2><table class="table audit"><thead><tr><th>Sunucu Zamanı</th><th>Olay</th><th>Referans/Durum</th></tr></thead><tbody>${auditRows(r.auditTimeline)}</tbody></table></div>

      <div class="section"><h2>7. Delil Belgesinin Kendi Bütünlük Özeti</h2><div class="card"><b>Receipt SHA-256</b><span class="hash">${esc(r.receiptSha256)}</span></div><div class="card" style="margin-top:10px"><b>İstek Fingerprint Hash</b><span class="hash">${esc(r.order.requestFingerprintHash)}</span></div><div class="note">${esc(r.qualification)}</div></div>

      <div class="legal-notice-box" style="border-left:5px solid #CA8A04; background:#FFFDF0; padding:16px 20px; font-size:14px; line-height:1.8; margin-top:20px; border-radius:8px; border:1px solid #FACC15;">
        <strong style="color:#854D0E; font-size:15px; display:block; margin-bottom:6px;">⚖️ HMK m. 193 Delil Sözleşmesi & Kesin İbra Teyidi</strong>
        İşbu dijital delil kaydı, <mark class="legal-highlight">tüketicinin kendi özgür iradesiyle gerçekleştirdiği sipariş, 3D Secure ödeme doğrulaması ve teslimatını</mark> kayıt altına alır. Alıcı, <mark class="legal-highlight">haksız ters ibraz (chargeback) girişiminde bulunmayacağını ve satıcıyı gayrikabili rücu ibra ettiğini</mark> kabul ve taahhüt etmiştir.
      </div>

      <div class="actions"><button class="btn secondary" type="button" id="closeReceipt">Belgeyi Kapat</button><button class="btn" type="button" id="printReceipt">Yazdır / PDF Kaydet</button></div>`;
    receiptEl.classList.add('show');
    document.getElementById('printReceipt')?.addEventListener('click',()=>window.print());
    document.getElementById('closeReceipt')?.addEventListener('click',()=>{receiptEl.classList.remove('show'); receiptEl.innerHTML='';});
    receiptEl.scrollIntoView({behavior:'smooth',block:'start'});
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fd = new FormData(form);
    const payload = {orderId:String(fd.get('orderId')||'').trim(),email:String(fd.get('email')||'').trim(),phone:String(fd.get('phone')||'').trim()};
    form.classList.add('loading'); messageEl.textContent = 'Sipariş doğrulanıyor…';
    try {
      const issued = await post('/api/issueEvidenceAccessToken',payload);
      sessionStorage.setItem(`belgin_evidence_${payload.orderId}`,issued.accessToken);
      const evidence = await post('/api/getOrderEvidence',{orderId:payload.orderId},issued.accessToken);
      messageEl.textContent = 'Doğrulama başarılı. Delil belgesi oluşturuldu.';
      render(evidence.receipt);
    } catch (error) {
      messageEl.textContent = error.message;
    } finally {
      form.classList.remove('loading');
    }
  });
})();
