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
  function isHighValueProduct(p){return Number(p?.price||0)>HIGH_VALUE_SECURE_DELIVERY_THRESHOLD && (isWatchProduct(p)||isGoldProduct(p));}
  function hasHighValueItems(items){return (items||[]).some(i=>isHighValueProduct(i));}
  function productNotice(p){
    if(!isHighValueProduct(p)) return '';
    return `<div class="high-value-notice" role="note"><strong>Yalnız mağazadan güvenli teslim</strong>12.000 TL üzerindeki altın ve saat ürünleri kargo veya kurye ile gönderilmez. Sipariş sahibi ürünü mağazada geçerli resmî kimlik doğrulaması ve imzalı teslim-tesellüm ile teslim alır. <a href="yuksek-degerli-urun-teslimi.html" target="_blank" rel="noopener">Teslim koşulları</a></div>`;
  }
  function productLegalLinks(){return `<div class="legal-product-links"><a href="iade-degisim.html" target="_blank" rel="noopener">İade ve cayma koşulları</a><a href="garanti-ve-satis-sonrasi.html" target="_blank" rel="noopener">Garanti ve satış sonrası</a><a href="guvenli-odeme-ve-3d-secure.html" target="_blank" rel="noopener">Güvenli ödeme</a></div>`;}
  function syncCheckout(){
    const hv=hasHighValueItems(window.Cart?.items||[]);
    const hvBox=document.getElementById('highValueCheckoutConsent');
    const hvCheck=document.getElementById('highValueConsentCheck');
    const shipping=document.getElementById('shippingMethods');
    const addressWrap=document.getElementById('deliveryAddressWrap');
    const address=document.getElementById('deliveryAddress');
    const loomis=document.getElementById('shippingLoomis');
    const showroom=document.getElementById('shippingShowroom');
    const summary=document.getElementById('legalDeliverySummary');
    if(hvBox) hvBox.style.display=hv?'block':'none';
    if(hvCheck) hvCheck.required=hv;
    if(loomis){loomis.disabled=hv; if(hv) loomis.checked=false;}
    if(showroom && hv) showroom.checked=true;
    if(shipping) shipping.dataset.highValue=hv?'true':'false';
    if(addressWrap) addressWrap.style.display=hv?'none':'block';
    if(address) address.required=!hv;
    if(summary) summary.innerHTML=hv?'<strong>Teslim:</strong> Belgin Kuyumculuk mağazasından sipariş sahibine resmî kimlik doğrulaması ve imza karşılığı. Kargo/kurye yoktur.':'<strong>Teslim:</strong> Seçtiğiniz teslim yöntemi sipariş öncesinde gösterilecektir.';
    return hv;
  }
  function recordConsent(key, value){
    try{localStorage.setItem(`belgin_${key}`, JSON.stringify({value,at:new Date().toISOString(),version:TERMS_VERSION}));}catch(e){}
  }
  function validateCheckout(form){
    const terms=document.getElementById('termsConsentCheck');
    const hv=syncCheckout(); const hvCheck=document.getElementById('highValueConsentCheck');
    if(!terms?.checked){alert('Siparişi tamamlamadan önce Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi bilgilendirmesini onaylamanız gerekir.');terms?.focus();return false;}
    if(hv && !hvCheck?.checked){alert('Bu sipariş yüksek değerli ürün içeriyor. Mağazadan kimlik doğrulaması ve imza karşılığı teslim koşulunu onaylamanız gerekir.');hvCheck?.focus();return false;}
    recordConsent('terms_consent',{termsVersion:TERMS_VERSION,preInfoVersion:PREINFO_VERSION});
    if(hv) recordConsent('high_value_delivery_consent',{version:HIGH_VALUE_VERSION});
    const marketing=document.getElementById('marketingConsentCheck');
    recordConsent('marketing_consent',{granted:Boolean(marketing?.checked)});
    return true;
  }
  function submitCheckout(event){
    event.preventDefault(); const form=event.currentTarget;
    if(!form.checkValidity()){form.reportValidity();return false;}
    if(!validateCheckout(form)) return false;
    if(window.App?.processOrder) window.App.processOrder();
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
  function init(){
    if(!cookieState()) document.getElementById('cookiePreferences')?.classList.add('show');
    syncCheckout();
  }
  return {HIGH_VALUE_SECURE_DELIVERY_THRESHOLD,TERMS_VERSION,PREINFO_VERSION,HIGH_VALUE_VERSION,isGoldProduct,isWatchProduct,isHighValueProduct,hasHighValueItems,productNotice,productLegalLinks,syncCheckout,validateCheckout,submitCheckout,saveCookies,showCookiePreferences,init};
})();
window.addEventListener('DOMContentLoaded',()=>LegalCompliance.init());
