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
  let grandTotal = 0;

  if (items && items.length > 0) {
    displayLines = items.map((item, idx) => {
      const grossLine = Number(item.lineTotal || (Number(item.unitPrice || 0) * Number(item.qty || 1)) || 0);
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));
      const vatRate = item.kdvRate !== undefined ? Number(item.kdvRate) : (item.vatRate !== undefined ? Number(item.vatRate) : 20);

      let netLine = grossLine;
      let vatAmt = 0;
      if (vatRate > 0) {
        netLine = Math.round((grossLine / (1 + (vatRate / 100))) * 100) / 100;
        vatAmt = Math.round((grossLine - netLine) * 100) / 100;
      }
      const unitNet = Math.round((netLine / qty) * 100) / 100;

      goodsServicesTotal += netLine;

      if (vatRate === 0) {
        hasKdv0 = true;
        totalKdv0Matrah += netLine;
      } else if (vatRate === 20) {
        hasKdv20 = true;
        totalKdv20Matrah += netLine;
        totalKdv20Amount += vatAmt;
      } else {
        totalKdv20Amount += vatAmt;
      }

      let desc = item.name || item.title || 'Kuyumculuk Ürünü';
      if (vatRate === 0 && !desc.includes('Özel Matrah')) {
        desc += ' (Kıymetli Maden Bedeli - Özel Matrah)';
      }

      return {
        seq: idx + 1,
        description: desc,
        quantityDisplay: qty + ' Adet',
        unitPriceDisplay: formatMoney(unitNet),
        discountRateDisplay: '%0,00',
        discountAmountDisplay: '0,00 TL',
        discountReason: 'İskonto -',
        vatRateDisplay: '%' + vatRate + ',00',
        vatAmountDisplay: formatMoney(vatAmt),
        otherTaxesDisplay: '',
        lineTotalDisplay: formatMoney(netLine)
      };
    });
    grandTotal = goodsServicesTotal + totalKdv20Amount;
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

  // 20 satırlık standart GİB gridi
  while (displayLines.length < 20) {
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
