// BELGIN KUYUMCULUK — legal/compliance controls — 25.08.2026
const LegalCompliance = (() => {
  const HIGH_VALUE_SECURE_DELIVERY_THRESHOLD = 12000;
  const TERMS_VERSION = '2026-08-25';
  const PREINFO_VERSION = '2026-08-25';
  const HIGH_VALUE_VERSION = '2026-08-25';

  function normalizeCategory(v){return String(v||'').toLowerCase().trim();}
  function isGoldProduct(p){
    if(!p) return false;
    const category=normalizeCategory(p.category); const metal=String(p.metal||'').toLowerCase();
    return p.isGold===true || category==='gold' || category==='altin' || category==='altın' || metal.includes('altın') || metal.includes('gold') || /au\s?\d{3}/i.test(metal);
  }
  function isWatchProduct(p){const c=normalizeCategory(p?.category);return c==='watch'||c==='saat';}
  function isHighValueProduct(p){return Number(p?.price||0)>=HIGH_VALUE_SECURE_DELIVERY_THRESHOLD && (isWatchProduct(p)||isGoldProduct(p));}
  function hasHighValueItems(items){return (items||[]).some(i=>isHighValueProduct(i));}
  function productNotice(p){
    if(!isHighValueProduct(p)) return '';
    return `<div class="high-value-notice" role="note"><strong>Yalnız mağazadan güvenli teslim</strong>12.000 TL ve üzerindeki altın ve saat ürünleri kargo veya kurye ile gönderilmez. Sipariş sahibi ürünü mağazada geçerli resmî kimlik doğrulaması ve imzalı teslim-tesellüm ile teslim alır. Belgin Kuyumculuk bu tutardan itibaren kendi ihtiyati müşteri tanıma ve işlem güvenliği kontrollerini uygular; MASAK mevzuatından doğan yükümlülükler ise kanuni şartları oluştuğunda ayrıca ve eksiksiz uygulanır. <a href="yuksek-degerli-urun-teslimi.html" target="_blank" rel="noopener">Teslim ve uyum koşulları</a></div>`;
  }
  function productLegalLinks(){return `<div class="legal-product-links"><a href="iade-degisim.html" target="_blank" rel="noopener">İade ve cayma koşulları</a><a href="garanti-ve-satis-sonrasi.html" target="_blank" rel="noopener">Garanti ve satış sonrası</a><a href="guvenli-odeme-ve-3d-secure.html" target="_blank" rel="noopener">Güvenli ödeme</a><a href="musteri-tanima-ve-islem-guvenligi.html" target="_blank" rel="noopener">Müşteri tanıma ve işlem güvenliği</a></div>`;}
  function syncCheckout(){
    const hv=hasHighValueItems(window.Cart?.items||[]);
    const hvBox=document.getElementById('highValueCheckoutConsent');
    const hvCheck=document.getElementById('highValueConsentCheck');
    const shipping=document.getElementById('shippingMethods');
    const addressWrap=document.getElementById('deliveryAddressWrap');
    const address=document.getElementById('deliveryAddress');
    const carrier=document.getElementById('shippingLoomis');
    const showroom=document.getElementById('shippingShowroom');
    const summary=document.getElementById('legalDeliverySummary');
    if(hvBox) hvBox.style.display=hv?'block':'none';
    if(hvCheck) hvCheck.required=hv;
    if(carrier){carrier.disabled=hv;if(hv)carrier.checked=false;}
    if(showroom&&hv)showroom.checked=true;
    if(shipping)shipping.dataset.highValue=hv?'true':'false';
    if(addressWrap)addressWrap.style.display=hv?'none':'block';
    if(address)address.required=!hv;
    if(summary)summary.innerHTML=hv?'<strong>Teslim ve uyum:</strong> 12.000 TL ve üzerindeki altın/saat siparişi yalnız Belgin Kuyumculuk mağazasından sipariş sahibine resmî kimlik doğrulaması ve imza karşılığı teslim edilir. Kargo/kurye yoktur. Belgin iç KYC/güvenlik kontrolleri uygulanır; MASAK yükümlülükleri kanuni şartları oluştuğunda ayrıca uygulanır.':'<strong>Teslim:</strong> Seçtiğiniz teslim yöntemi sipariş öncesinde gösterilecektir.';
    return hv;
  }
  function recordConsent(key,value){try{localStorage.setItem(`belgin_${key}`,JSON.stringify({value,at:new Date().toISOString(),version:TERMS_VERSION}));}catch(e){}}
  function validateCheckout(){
    const terms=document.getElementById('termsConsentCheck');
    const hv=syncCheckout();const hvCheck=document.getElementById('highValueConsentCheck');
    if(!terms?.checked){alert('Siparişi tamamlamadan önce Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi bilgilendirmesini onaylamanız gerekir.');terms?.focus();return false;}
    if(hv&&!hvCheck?.checked){alert('Bu sipariş 12.000 TL ve üzeri yüksek değerli ürün içeriyor. Mağazadan kimlik doğrulaması, işlem güvenliği kontrolü ve imza karşılığı teslim koşulunu onaylamanız gerekir.');hvCheck?.focus();return false;}
    recordConsent('terms_consent',{termsVersion:TERMS_VERSION,preInfoVersion:PREINFO_VERSION});
    if(hv)recordConsent('high_value_delivery_consent',{version:HIGH_VALUE_VERSION,internalKycThreshold:HIGH_VALUE_SECURE_DELIVERY_THRESHOLD});
    recordConsent('marketing_consent',{granted:Boolean(document.getElementById('marketingConsentCheck')?.checked)});
    return true;
  }
  async function submitCheckout(event){
    event.preventDefault();const form=event.currentTarget;
    if(!form.checkValidity()){form.reportValidity();return false;}
    if(!validateCheckout())return false;
    if(!window.PayTR?.initializePayment){alert('Güvenli ödeme servisi hazır değil. Sipariş oluşturulmadı ve ödeme alınmadı.');return false;}
    const fd=new FormData(form);
    const highValue=hasHighValueItems(window.Cart?.items||[]);
    const deliveryMethod=highValue?'showroom':String(fd.get('shippingMethod')||'');
    const firstName=String(fd.get('firstName')||'').trim();
    const lastName=String(fd.get('lastName')||'').trim();
    const orderData={
      email:String(fd.get('email')||'').trim(),
      user_name:`${firstName} ${lastName}`.trim(),
      user_phone:String(fd.get('phone')||'').trim(),
      user_address:deliveryMethod==='showroom'?'Belgin Kuyumculuk mağazasından teslim':String(fd.get('deliveryAddress')||'').trim(),
      deliveryMethod,
      items:(window.Cart?.items||[]).map(i=>({id:i.id,qty:i.qty})),
      termsAccepted:true,
      preInformationAccepted:true,
      highValueDeliveryAccepted:highValue?Boolean(document.getElementById('highValueConsentCheck')?.checked):false,
      marketingConsent:Boolean(document.getElementById('marketingConsentCheck')?.checked),
      internalKycPolicyApplied:highValue,
      internalKycThreshold:HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,
      legalClientVersions:{terms:TERMS_VERSION,preInformation:PREINFO_VERSION,highValueDelivery:highValue?HIGH_VALUE_VERSION:null}
    };
    const result=await PayTR.initializePayment(orderData);
    if(!result?.success)return false;
    const receipt=document.getElementById('legalOrderReceipt');
    if(receipt)receipt.innerHTML=`<div class="high-value-notice"><strong>Ödeme oturumu oluşturuldu</strong>Sipariş referansı: ${result.merchant_oid}. ${highValue?'Bu sipariş 12.000 TL ve üzeri iç güvenlik/KYC standardı kapsamında olup yalnız mağazadan kimlik doğrulaması ve imza karşılığı teslim edilecektir.':''}</div>`;
    return false;
  }
  function cookieState(){try{return JSON.parse(localStorage.getItem('belgin_cookie_preferences')||'null');}catch(e){return null;}}
  function saveCookies(mode){
    const prefs={necessary:true,analytics:mode==='all',marketing:mode==='all',updatedAt:new Date().toISOString(),version:'2026-08-25'};
    localStorage.setItem('belgin_cookie_preferences',JSON.stringify(prefs));
    document.getElementById('cookiePreferences')?.classList.remove('show');
    document.getElementById('cookieBanner')?.classList.remove('show');
    window.dispatchEvent(new CustomEvent('belgin:cookie-consent',{detail:prefs}));
  }
  function showCookiePreferences(){document.getElementById('cookiePreferences')?.classList.add('show');}
  function init(){if(!cookieState())document.getElementById('cookiePreferences')?.classList.add('show');syncCheckout();}
  return {HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,TERMS_VERSION,PREINFO_VERSION,HIGH_VALUE_VERSION,isGoldProduct,isWatchProduct,isHighValueProduct,hasHighValueItems,productNotice,productLegalLinks,syncCheckout,validateCheckout,submitCheckout,saveCookies,showCookiePreferences,init};
})();
window.addEventListener('DOMContentLoaded',()=>LegalCompliance.init());
