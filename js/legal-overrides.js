// BELGIN KUYUMCULUK — runtime legal integration layer
(function () {
  'use strict';

  const SELECT_COLLECTION = Object.freeze({
    internalPage: 'ikinci-el',
    label: 'Seçkin Ürünler',
    href: '/seckin-urunler/'
  });

  function exposeSelectCollectionRoute() {
    // Preserve the internal page/category key to avoid breaking catalogue filters,
    // while publishing a new customer-facing route.
    window.SEO_CATEGORY_ROUTES = Object.freeze({
      ...(window.SEO_CATEGORY_ROUTES || {}),
      [SELECT_COLLECTION.internalPage]: SELECT_COLLECTION.href
    });
  }

  function renameSelectCollectionEntryPoints() {
    const links = document.querySelectorAll('a[data-page="ikinci-el"]');
    links.forEach((link) => link.setAttribute('href', SELECT_COLLECTION.href));

    const desktopMain = document.querySelector('.nav-desktop > ul > li > a[data-page="ikinci-el"]');
    if (desktopMain) {
      desktopMain.innerHTML = 'Seçkin Ürünler <span class="nav-arrow">▾</span>';
    }

    const desktopItem = desktopMain?.closest('li');
    const dropdownHeader = desktopItem?.querySelector('.nav-dropdown-header > span');
    if (dropdownHeader) dropdownHeader.textContent = 'SEÇKİN ÜRÜNLER KOLEKSİYONU';

    const desktopAll = desktopItem?.querySelector('.nav-dropdown-single-item.nav-all-item .nav-item-title');
    if (desktopAll) desktopAll.textContent = 'TÜMÜ (Seçkin Ürünler)';

    const mobileFirstLink = document.querySelector('.mobile-nav-accordion-sub a[data-page="ikinci-el"]');
    const mobileBlock = mobileFirstLink?.closest('.mobile-nav-accordion-sub')?.parentElement;
    const mobileHeaderLabel = mobileBlock?.querySelector('.mobile-nav-accordion-header > span:first-child');
    if (mobileHeaderLabel) mobileHeaderLabel.textContent = '🪙 Seçkin Ürünler (32)';
    if (mobileFirstLink) mobileFirstLink.textContent = '⭐ TÜMÜ (Seçkin Ürünler - 32)';

    const heroTab = document.querySelector('.hero-tab-btn[onclick*="filterHeroTab(\'ikinci-el\'"]');
    if (heroTab) heroTab.textContent = '🪙 Seçkin Ürünler';

    const footerLink = document.querySelector('.footer-art a[data-page="ikinci-el"]');
    if (footerLink) footerLink.textContent = 'Seçkin Ürünler (32)';

    const categoryTitle = document.querySelector('#page-ikinci-el h2');
    if (categoryTitle) categoryTitle.textContent = 'Seçkin Ürünler';
  }

  function normalizeSelectCollectionSeo() {
    if (location.pathname.replace(/\/+$/, '') !== '/seckin-urunler') return;

    document.title = 'Seçkin Ürünler | Ekspertizli Saat & Mücevher | Belgin Kuyumculuk';

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        'content',
        'İzmir Buca’da ekspertiz ve orijinallik kontrolünden geçirilmiş seçkin saat ve mücevher koleksiyonu. Kondisyon raporu, güvenli ödeme ve takas imkânı.'
      );
    }

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', 'https://www.belginkuyumculuk.com/seckin-urunler/');

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', 'https://www.belginkuyumculuk.com/seckin-urunler/');
  }

  function activateDirectSelectCollectionRoute() {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/seckin-urunler') return;

    if (typeof Router !== 'undefined' && typeof Router.navigate === 'function') {
      Router.navigate(SELECT_COLLECTION.internalPage, false);
    }
  }

  exposeSelectCollectionRoute();
  renameSelectCollectionEntryPoints();
  activateDirectSelectCollectionRoute();
  normalizeSelectCollectionSeo();
})();
