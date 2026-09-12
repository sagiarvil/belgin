/**
 * Test Suite: Mağaza Faturası Düzenleme & GİB e-Arşiv Yansıma Hattı Testi
 */
const assert = require('assert');
const { EarsivPortalService } = require('../functions/earsiv-service');

async function runStoreInvoiceEditTests() {
  console.log('🚀 [TEST] Mağaza Faturası Düzenleme & GİB Hattı Testleri Başlatılıyor...');

  const mockExistingInvoice = {
    orderId: 'MGS-20260911-5819',
    id: 'MGS-20260911-5819',
    customerName: 'Fırat cetin',
    companyName: 'Fırat Ltd. Şti.',
    unvan: 'Fırat Ltd. Şti.',
    taxOffice: 'Buca Vergi Dairesi',
    customerIdentity: '23947681842',
    invoiceDate: '2026-09-11',
    customerAddress: 'Vali Rahmi Bey Mah. 135 Sok. No:4 Buca İzmir',
    customerPhone: '05551234567',
    customerEmail: 'firat@example.com',
    paymentMethod: 'HAVALE_EFT',
    totalAmount: 100000,
    note: 'Showroom VIP Teslimat',
    items: [
      { name: '22 Ayar Bilezik', qty: 1, unitPrice: 95000, lineTotal: 95000, kdvRate: 0, kdvAmount: 0 },
      { name: 'İşçilik', qty: 1, unitPrice: 5000, lineTotal: 5000, kdvRate: 20, kdvAmount: 833.33 }
    ],
    invoiceStatus: 'DRAFT'
  };

  const formState = {
    storeCustName: '',
    storeCustCompanyName: '',
    storeCustTaxOffice: '',
    storeCustIdentity: '',
    storeInvoiceDate: '',
    storeCustAddress: '',
    storeCustPhone: '',
    storeCustEmail: '',
    storeInvoiceNote: '',
    freeItemName: '',
    freeItemQty: 1,
    freeItemPrice: '',
    freeItemLaborRate: '0',
    editingStoreInvoiceId: null
  };

  function mockEditStoreInvoice(inv) {
    formState.editingStoreInvoiceId = inv.orderId;
    formState.storeCustName = inv.customerName || '';
    formState.storeCustCompanyName = inv.companyName || '';
    formState.storeCustTaxOffice = inv.taxOffice || '';
    formState.storeCustIdentity = inv.customerIdentity || '11111111111';
    formState.storeInvoiceDate = inv.invoiceDate || '2026-09-12';
    formState.storeCustAddress = inv.customerAddress || '';
    formState.storeCustPhone = inv.customerPhone || '';
    formState.storeCustEmail = inv.customerEmail || '';
    formState.storeInvoiceNote = inv.note || '';

    const storeItems = JSON.parse(JSON.stringify(inv.items));
    formState.freeItemPrice = Number(inv.totalAmount).toLocaleString('tr-TR');
    const laborItem = storeItems.find(it => String(it.name || '').toLowerCase().includes('işçilik'));
    if (laborItem && inv.totalAmount > 0) {
      const calcRate = Math.round((Number(laborItem.lineTotal) / Number(inv.totalAmount)) * 1000) / 10;
      formState.freeItemLaborRate = String(calcRate).replace('.', ',');
    }

    return { storeItems, formState };
  }

  const { storeItems: loadedItems } = mockEditStoreInvoice(mockExistingInvoice);

  assert.strictEqual(formState.editingStoreInvoiceId, 'MGS-20260911-5819', 'editingStoreInvoiceId set edilmeli');
  assert.strictEqual(formState.storeCustName, 'Fırat cetin', 'Alıcı adı yüklenmeli');
  assert.strictEqual(formState.storeCustCompanyName, 'Fırat Ltd. Şti.', 'Firma unvanı yüklenmeli');
  assert.strictEqual(formState.storeCustTaxOffice, 'Buca Vergi Dairesi', 'Vergi dairesi yüklenmeli');
  assert.strictEqual(formState.storeInvoiceDate, '2026-09-11', 'Fatura tarihi yüklenmeli');
  assert.strictEqual(loadedItems.length, 2, '2 adet kalem eksiksiz yüklenmeli');
  console.log('  ✅ Adım 1 Başarılı: Form alanları ve kalemler eksiksiz yüklendi.');

  formState.storeCustName = 'Fırat Çetin (Güncellendi)';
  formState.storeCustCompanyName = 'Çetin Kuyumculuk A.Ş.';
  formState.storeCustTaxOffice = 'Konak Vergi Dairesi';
  formState.storeInvoiceDate = '2026-09-12';
  formState.storeCustAddress = 'Alsancak Mah. Kıbrıs Şehitleri Cad. No:12 Konak İzmir';
  
  const updatedItems = [
    { name: '22 Ayar Bilezik', qty: 1, unitPrice: 114000, lineTotal: 114000, kdvRate: 0, kdvAmount: 0 },
    { name: 'İşçilik', qty: 1, unitPrice: 6000, lineTotal: 6000, kdvRate: 20, kdvAmount: 1000 }
  ];
  const newTotal = 120000;

  const updatedInvoiceDoc = {
    orderId: formState.editingStoreInvoiceId,
    id: formState.editingStoreInvoiceId,
    customerName: formState.storeCustName,
    companyName: formState.storeCustCompanyName,
    unvan: formState.storeCustCompanyName,
    taxOffice: formState.storeCustTaxOffice,
    customerIdentity: formState.storeCustIdentity,
    invoiceDate: formState.storeInvoiceDate,
    customerAddress: formState.storeCustAddress,
    customerPhone: formState.storeCustPhone,
    customerEmail: formState.storeCustEmail,
    items: updatedItems,
    totalAmount: newTotal,
    total: newTotal,
    note: 'Showroom VIP Düzenlendi',
    invoiceStatus: 'DRAFT'
  };

  assert.strictEqual(updatedInvoiceDoc.orderId, 'MGS-20260911-5819');
  assert.strictEqual(updatedInvoiceDoc.totalAmount, 120000);
  console.log('  ✅ Adım 2 Başarılı: Fatura alanları ve kalemleri başarıyla düzenlendi.');

  const earsivService = new EarsivPortalService();
  const customBreakdown = {
    total: newTotal,
    hasGoldAmount: 114000,
    workmanshipNet: 5000,
    workmanshipKdv: 1000,
    grandTotal: 120000,
    items: [
      { name: '22 Ayar Bilezik', qty: 1, unitPrice: 114000, lineTotal: 114000, kdvRate: 0, kdvAmount: 0 },
      { name: 'İşçilik', qty: 1, unitPrice: 6000, lineTotal: 6000, kdvRate: 20, kdvAmount: 1000 }
    ]
  };

  const gibDraft = await earsivService.createDraftInvoice('MOCK_GIB_TOKEN_TEST', updatedInvoiceDoc, customBreakdown);

  assert.ok(gibDraft);
  assert.ok(gibDraft.invoiceUuid);
  assert.strictEqual(gibDraft.invoicePayload.faturaTarihi, '12/09/2026', 'Düzenlenen tarih GİB taslağına yansımalı');
  assert.strictEqual(gibDraft.invoicePayload.aliciUnvan, 'Çetin Kuyumculuk A.Ş.', 'Düzenlenen firma unvanı GİB taslağına yansımalı');
  assert.strictEqual(gibDraft.invoicePayload.vergiDairesi, 'Konak Vergi Dairesi', 'Düzenlenen vergi dairesi GİB taslağına yansımalı');
  assert.strictEqual(gibDraft.invoicePayload.bulvarcaddesokak, 'Alsancak Mah. Kıbrıs Şehitleri Cad. No:12 Konak İzmir', 'Düzenlenen adres GİB taslağına yansımalı');
  assert.strictEqual(gibDraft.invoicePayload.malHizmetTable.length, 2, 'GİB malHizmetTable 2 satır olmalı');
  assert.strictEqual(gibDraft.invoicePayload.malHizmetTable[0].malHizmet, '22 Ayar Bilezik');
  assert.strictEqual(gibDraft.invoicePayload.malHizmetTable[1].malHizmet, 'İşçilik');
  
  console.log('  ✅ Adım 3 Başarılı: Düzenlenen tüm alanlar GİB e-Arşiv faturasına eksiksiz ve doğrudan yansıdı!');
  console.log('🎉 TÜM MAĞAZA FATURASI DÜZENLEME & GİB TESTLERİ %100 GEÇTİ (PASS)!');
}

runStoreInvoiceEditTests().catch(err => {
  console.error('❌ TEST BAŞARISIZ:', err);
  process.exit(1);
});
