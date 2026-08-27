// BELGIN KUYUMCULUK — runtime legal integration layer
(function () {
  'use strict';

  // Feature flags: temporary catalogue visibility controls.
  // Keep the second-hand route/data intact; only remove category entry points from the UI.
  const FEATURE_FLAGS = Object.freeze({
    secondHandCategoryVisible: false
  });

  function removeSecondHandCategoryEntryPoints() {
    if (FEATURE_FLAGS.secondHandCategoryVisible) return;

    // Desktop primary navigation: remove the whole dropdown item.
    document
      .querySelectorAll('.nav-desktop > ul > li > a[data-page="ikinci-el"]')
      .forEach((link) => link.closest('li')?.remove());

    // Mobile drawer: remove the whole second-hand accordion block, not only its inner links.
    document
      .querySelectorAll('.mobile-nav-accordion-sub a[data-page="ikinci-el"]')
      .forEach((link) => link.closest('.mobile-nav-accordion-sub')?.parentElement?.remove());

    // Homepage quick-category entry point.
    document
      .querySelectorAll('.hero-tab-btn[onclick*="filterHeroTab(\'ikinci-el\'"]')
      .forEach((button) => button.remove());

    // Footer/category navigation and any mobile dock shortcut, if present.
    document
      .querySelectorAll('.footer-art a[data-page="ikinci-el"], .mobile-bottom-dock a[data-page="ikinci-el"]')
      .forEach((link) => (link.closest('li') || link).remove());
  }

  removeSecondHandCategoryEntryPoints();
})();
