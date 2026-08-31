const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

let compiledTemplate = null;

function getCompiledTemplate() {
  if (!compiledTemplate) {
    const templatePath = path.join(__dirname, 'earsiv_fatura_template_exact.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    compiledTemplate = Handlebars.compile(templateSource);
  }
  return compiledTemplate;
}

function formatMoney(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

function renderOfficialGibHtml(data) {
  const customerObj = (data && typeof data.customer === 'object' && data.customer !== null) ? data.customer : {};
  const {
    invoiceNumber = 'GIB2026000000004',
    ettn = '',
    invoiceDate = new Date().toISOString().split('T')[0],
    invoiceTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    orderId = '',
    note = '',
    items = [],
    bd = {}
  } = data;

  const customerName = (data.customerName || customerObj.name || customerObj.fullName || 'Nihai Tüketici').trim();
  const rawId = String(data.customerIdentity || customerObj.identityNumber || customerObj.tckn || customerObj.vkn || customerObj.tc || customerObj.identity || '11111111111').replace(/\D/g, '');
  const customerIdentity = (rawId.length === 10 || rawId.length === 11) ? rawId : '11111111111';
  const customerAddress = data.customerAddress || customerObj.address || 'Menderes Cad. No:231/B Buca İzmir';
  const customerPhone = data.customerPhone || customerObj.phone || '';
  const customerEmail = data.customerEmail || customerObj.email || 'destek@belginkuyumculuk.com';

  const seller = {
    name: 'SEMİH SONBAHAR',
    addressLine1: 'EFELER MAH. MENDERES CAD. Kapı No:231/B',
    addressLine2: 'BUCA/ İzmir / Türkiye',
    phone: '0.5419305272',
    fax: '',
    website: 'https://www.belginkuyumculuk.com',
    email: 'destek@belginkuyumculuk.com',
    taxOffice: 'şirinyer vergi dairesi',
    idLabel: 'TCKN',
    id: '62764066838'
  };

  const buyerIdLabel = (customerIdentity.length === 10) ? 'VKN' : 'TCKN';
  
  const buyer = {
    name: customerName,
    addressLine1: customerAddress,
    addressLine2: 'Buca/ İzmir Türkiye',
    website: 'https://www.belginkuyumculuk.com',
    email: customerEmail,
    phone: customerPhone || '0.5419305272',
    fax: '',
    idLabel: buyerIdLabel,
    id: customerIdentity
  };

  const invoice = {
    customizationNo: 'TR1.2',
    scenario: 'EARSIVFATURA',
    type: 'SATIS',
    number: invoiceNumber,
    dateDisplay: invoiceDate + ' ' + invoiceTime,
    ettn: ettn || ''
  };

  let displayLines = [];
  let goodsServicesTotal = 0;
  let hasKdv0 = false;
  let hasKdv20 = false;
  let totalKdv0Matrah = 0;
  let totalKdv20Matrah = 0;
  let totalKdv20Amount = 0;
  let grandTotal = Number(data.totalAmount || bd.grandTotal || 0);

  if (items && items.length > 0) {
    const itemRows = [];
    let taxableNetSum = 0;
    let taxableVatSum = 0;

    items.forEach((item) => {
      const qty = Math.max(1, Number(item.qty || item.quantity || item.miktar || 1));
      const unitPrice = Number(item.unitPrice || item.birimFiyat || item.price || 0);
      const rawLine = Number(item.lineTotal || item.malHizmetTutari || item.fiyat || item.total || (unitPrice > 0 ? unitPrice * qty : 0) || 0);
      const vatRate = item.kdvRate !== undefined ? Number(item.kdvRate) : (item.kdvOrani !== undefined ? Number(item.kdvOrani) : (item.vatRate !== undefined ? Number(item.vatRate) : (String(item.name || item.malHizmet || '').toLowerCase().includes('işçilik') ? 20 : 0)));

      let grossLine = rawLine;
      let netLine = rawLine;
      let vatAmt = Number(item.kdvTutari || item.vatAmount || 0);

      if (vatRate > 0) {
        if (vatAmt > 0 && Math.abs(rawLine - (netLine + vatAmt)) < 1) {
          grossLine = Math.round((netLine + vatAmt) * 100) / 100;
        } else if (vatAmt > 0 && Math.abs(rawLine - netLine) < 1 && rawLine > vatAmt) {
          netLine = Math.round((rawLine - vatAmt) * 100) / 100;
          grossLine = rawLine;
        } else {
          netLine = Math.round((grossLine / (1 + (vatRate / 100))) * 100) / 100;
          vatAmt = Math.round((grossLine - netLine) * 100) / 100;
        }
        taxableNetSum = Math.round((taxableNetSum + netLine) * 100) / 100;
        taxableVatSum = Math.round((taxableVatSum + vatAmt) * 100) / 100;
      }

      itemRows.push({
        rawItem: item,
        name: item.name || item.malHizmet || item.title || 'Kuyumculuk Ürünü',
        qty,
        vatRate,
        grossLine,
        netLine,
        vatAmt
      });
    });

    const resolvedTargetTotal = grandTotal > 0 ? grandTotal : Math.round((taxableNetSum + taxableVatSum + itemRows.filter(r => r.vatRate === 0).reduce((a, b) => a + b.grossLine, 0)) * 100) / 100;
    grandTotal = resolvedTargetTotal;

    const totalTaxableGross = Math.round((taxableNetSum + taxableVatSum) * 100) / 100;
    const requiredGoldPool = Math.max(0, Math.round((grandTotal - totalTaxableGross) * 100) / 100);

    const goldRows = itemRows.filter(r => r.vatRate === 0);
    const taxableRows = itemRows.filter(r => r.vatRate > 0);
    const rawGoldSum = goldRows.reduce((acc, r) => acc + r.grossLine, 0);

    let runningGoldSum = 0;
    displayLines = [];

    // 0% KDV Satırlarını oluştur
    goldRows.forEach((r, gIdx) => {
      hasKdv0 = true;
      const isLastGold = gIdx === goldRows.length - 1;
      let finalLineTotal = r.grossLine;

      if (rawGoldSum > 0 && Math.abs(rawGoldSum - requiredGoldPool) > 0.01) {
        if (!isLastGold) {
          finalLineTotal = Math.round((requiredGoldPool * (r.grossLine / rawGoldSum)) * 100) / 100;
        } else {
          finalLineTotal = Math.round((requiredGoldPool - runningGoldSum) * 100) / 100;
        }
      } else if (rawGoldSum === 0) {
        if (!isLastGold) {
          finalLineTotal = Math.round((requiredGoldPool / goldRows.length) * 100) / 100;
        } else {
          finalLineTotal = Math.round((requiredGoldPool - runningGoldSum) * 100) / 100;
        }
      } else if (isLastGold) {
        finalLineTotal = Math.round((requiredGoldPool - runningGoldSum) * 100) / 100;
      }

      runningGoldSum = Math.round((runningGoldSum + finalLineTotal) * 100) / 100;
      totalKdv0Matrah = Math.round((totalKdv0Matrah + finalLineTotal) * 100) / 100;
      goodsServicesTotal = Math.round((goodsServicesTotal + finalLineTotal) * 100) / 100;

      const unitNet = Math.round((finalLineTotal / r.qty) * 100) / 100;
      let desc = r.name;
      if (!desc.includes('Özel Matrah')) {
        desc += ' (Kıymetli Maden Bedeli - Özel Matrah)';
      }

      displayLines.push({
        seq: displayLines.length + 1,
        description: desc,
        quantityDisplay: r.qty + ' Adet',
        unitPriceDisplay: formatMoney(unitNet),
        discountRateDisplay: '%0,00',
        discountAmountDisplay: '0,00 TL',
        discountReason: 'İskonto -',
        vatRateDisplay: '%0,00',
        vatAmountDisplay: '0,00 TL',
        otherTaxesDisplay: '',
        lineTotalDisplay: formatMoney(finalLineTotal)
      });
    });

    // KDV'ye tabi (İşçilik/Saat) Satırlarını oluştur
    taxableRows.forEach((r) => {
      hasKdv20 = true;
      totalKdv20Matrah = Math.round((totalKdv20Matrah + r.netLine) * 100) / 100;
      totalKdv20Amount = Math.round((totalKdv20Amount + r.vatAmt) * 100) / 100;
      goodsServicesTotal = Math.round((goodsServicesTotal + r.netLine) * 100) / 100;

      const unitNet = Math.round((r.netLine / r.qty) * 100) / 100;
      let desc = r.name.toLowerCase().includes('işçilik') ? 'İşçilik' : r.name;

      displayLines.push({
        seq: displayLines.length + 1,
        description: desc,
        quantityDisplay: r.qty + ' Adet',
        unitPriceDisplay: formatMoney(unitNet),
        discountRateDisplay: '%0,00',
        discountAmountDisplay: '0,00 TL',
        discountReason: 'İskonto -',
        vatRateDisplay: '%' + r.vatRate + ',00',
        vatAmountDisplay: formatMoney(r.vatAmt),
        otherTaxesDisplay: '',
        lineTotalDisplay: formatMoney(r.netLine)
      });
    });

    grandTotal = Math.round((goodsServicesTotal + totalKdv20Amount) * 100) / 100;
  } else {
    // Özel Matrah Kuyumculuk Satışı
    const hasGold = Number(bd.hasGoldAmount || 0);
    const workNet = Number(bd.workmanshipNet || 0);
    const workKdv = Number(bd.workmanshipKdv || 0);
    goodsServicesTotal = hasGold + workNet;
    hasKdv0 = true;
    hasKdv20 = true;
    totalKdv0Matrah = hasGold;
    totalKdv20Matrah = workNet;
    totalKdv20Amount = workKdv;
    grandTotal = Number(bd.grandTotal || (goodsServicesTotal + workKdv));

    const resolvedProductName = data.productName || (bd && bd.productName) || (items && items[0]?.name ? items[0]?.name : 'Kuyumculuk Satışı');

    displayLines = [
      {
        seq: 1,
        description: (orderId ? orderId + ' - ' : '') + `${resolvedProductName} (Kıymetli Maden Bedeli - Özel Matrah)`,
        quantityDisplay: '1 Adet',
        unitPriceDisplay: formatMoney(hasGold),
        discountRateDisplay: '%0,00',
        discountAmountDisplay: '0,00 TL',
        discountReason: 'İskonto -',
        vatRateDisplay: '%0,00',
        vatAmountDisplay: '0,00 TL',
        otherTaxesDisplay: '',
        lineTotalDisplay: formatMoney(hasGold)
      },
      {
        seq: 2,
        description: 'İşçilik',
        quantityDisplay: '1 Adet',
        unitPriceDisplay: formatMoney(workNet),
        discountRateDisplay: '%0,00',
        discountAmountDisplay: '0,00 TL',
        discountReason: 'İskonto -',
        vatRateDisplay: '%20,00',
        vatAmountDisplay: formatMoney(workKdv),
        otherTaxesDisplay: '',
        lineTotalDisplay: formatMoney(workNet)
      }
    ];
  }

  // Kompakt GİB tablosu (Tek sayfaya A4 sığdırma)
  while (displayLines.length < Math.max(displayLines.length, 5)) {
    displayLines.push({
      seq: '',
      description: '',
      quantityDisplay: '',
      unitPriceDisplay: '',
      discountRateDisplay: '',
      discountAmountDisplay: '',
      discountReason: '',
      vatRateDisplay: '',
      vatAmountDisplay: '',
      otherTaxesDisplay: '',
      lineTotalDisplay: ''
    });
  }

  const taxRows = [];
  if (hasKdv0 || totalKdv0Matrah > 0) {
    taxRows.push({ label: 'Hesaplanan KDV(%0)', valueDisplay: '0,00 TL' });
  }
  if (hasKdv20 || totalKdv20Amount > 0) {
    taxRows.push({ label: 'Hesaplanan KDV(%20)', valueDisplay: formatMoney(totalKdv20Amount) });
  }
  if (taxRows.length === 0) {
    taxRows.push({ label: 'Hesaplanan KDV(%20)', valueDisplay: formatMoney(totalKdv20Amount) });
  }

  const totals = {
    goodsServicesTotalDisplay: formatMoney(goodsServicesTotal),
    totalDiscountDisplay: '0,00 TL',
    taxRows: taxRows,
    taxInclusiveTotalDisplay: formatMoney(grandTotal),
    payableAmountDisplay: formatMoney(grandTotal)
  };

  const qrPayload = JSON.stringify({
    vkntckn: seller.id,
    avkntckn: buyer.id,
    senaryo: invoice.scenario,
    tip: invoice.type,
    tarih: invoiceDate,
    no: invoiceNumber,
    ettn: ettn,
    parabirimi: 'TRY',
    malhizmettoplam: String(goodsServicesTotal.toFixed(2)),
    'kdvmatrah(0)': String(totalKdv0Matrah.toFixed(2)),
    'kdvmatrah(20)': String(totalKdv20Matrah.toFixed(2)),
    'hesaplanankdv(0)': '0.00',
    'hesaplanankdv(20)': String(totalKdv20Amount.toFixed(2)),
    vergidahil: String(grandTotal.toFixed(2)),
    odenecek: String(grandTotal.toFixed(2))
  });

  const invoiceNote = note || ('Sipariş No: ' + (orderId || '') + ' | 3065 sayılı KDV Kanununun 23/f maddesi uyarınca Özel Matrah uygulanmıştır. Belgin Kuyumculuk - Semih Sonbahar');

  const template = getCompiledTemplate();
  return template({
    seller,
    buyer,
    invoice,
    qrPayload,
    displayLines,
    totals,
    note: invoiceNote
  });
}

module.exports = { renderOfficialGibHtml };
