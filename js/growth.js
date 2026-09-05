(() => {
  'use strict';
  const AI_HOSTS = ['chatgpt.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'copilot.microsoft.com'];
  const KEY = 'belgin:growth:session:v1';
  const FIRST = 'belgin:growth:first-touch:v1';

  function id(prefix) {
    const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${prefix}_${token}`;
  }
  function read(key) { try { return sessionStorage.getItem(key); } catch { return null; } }
  function write(key, value) { try { sessionStorage.setItem(key, value); } catch {} }
  function sessionValue(key, fallback) { let value = read(key); if (!value) { value = fallback(); write(key, value); } return value; }
  function source() {
    const url = new URL(location.href);
    let traffic = url.searchParams.get('utm_source') || 'direct';
    if (traffic === 'direct' && document.referrer) {
      try {
        const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
        traffic = host.includes('google.') ? 'google' : host.includes('bing.') ? 'bing' : host;
      } catch { traffic = 'referral'; }
    }
    const medium = url.searchParams.get('utm_medium') || (traffic === 'direct' ? 'direct' : ['google','bing'].includes(traffic) ? 'organic' : AI_HOSTS.some((h) => traffic.includes(h)) ? 'ai_referral' : 'referral');
    const campaign = url.searchParams.get('utm_campaign') || '';
    const touch = `${traffic}/${medium}${campaign ? `/${campaign}` : ''}`;
    const first = sessionValue(FIRST, () => touch);
    return { traffic_source: traffic, medium, campaign, referrer: document.referrer || '', first_touch: first, last_touch: touch };
  }
  function track(event, payload = {}) {
    const detail = {
      event,
      event_id: id('ev'),
      session_id: sessionValue(KEY, () => id('ss')),
      site: 'belginkuyumculuk.com',
      page: location.pathname,
      timestamp: new Date().toISOString(),
      ...source(),
      ...payload,
    };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);
    window.dispatchEvent(new CustomEvent('sagiarvil:growth', { detail }));
  }

  // Production header guard: jewellery and live-price navigation must remain visible.
  // This runs after static HTML/CSS and again after SPA initialization so older hide rules
  // cannot suppress these two first-class navigation entries.
  function ensureCommerceNavigationVisible() {
    const desktopNav = document.querySelector('.nav-desktop > ul');

    if (desktopNav) {
      // Keep the expanded desktop menu inside the premium single-row header.
      desktopNav.style.setProperty('gap', '18px', 'important');

      const ensureFallbackItem = (page, href, label, extraClass = '') => {
        let link = desktopNav.querySelector(`a[data-page="${page}"]`);
        if (!link) {
          const before = desktopNav.querySelector('a[data-page="biz-kimiz"]')?.closest('li') || null;
          const li = document.createElement('li');
          li.className = page === 'mucevherat' ? 'nav-has-dropdown commerce-nav-fallback' : 'commerce-nav-fallback';
          li.innerHTML = `<a href="${href}" data-page="${page}" class="nav-link-main ${extraClass}">${label}</a>`;
          desktopNav.insertBefore(li, before);
          link = li.querySelector('a');
        }
        return link;
      };

      ensureFallbackItem('mucevherat', '/mucevherat/', 'Mücevherat ▾');
      ensureFallbackItem('canli-fiyatlar', '/canli-fiyatlar/', 'Canlı Fiyatlar', 'nav-link-live-rates');
    }

    document.querySelectorAll('.nav-desktop a[data-page="mucevherat"], .nav-desktop a[data-page="canli-fiyatlar"]').forEach((link) => {
      const item = link.closest('li');
      for (const el of [item, link]) {
        if (!el) continue;
        el.hidden = false;
        el.removeAttribute('aria-hidden');
        el.style.setProperty('display', el.tagName === 'LI' ? 'inline-flex' : 'inline-block', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('opacity', '1', 'important');
      }
    });

    document.querySelectorAll('.mobile-drawer-nav [data-page="mucevherat"], .mobile-drawer-nav [data-page="canli-fiyatlar"], .mobile-bottom-dock [data-page="mucevherat"]').forEach((link) => {
      link.hidden = false;
      link.removeAttribute('aria-hidden');
      link.style.removeProperty('display');
      link.style.setProperty('visibility', 'visible', 'important');
      link.style.setProperty('opacity', '1', 'important');

      let parent = link.parentElement;
      while (parent && !parent.classList.contains('mobile-drawer-nav') && !parent.classList.contains('mobile-bottom-dock')) {
        if (getComputedStyle(parent).display === 'none' || parent.style.getPropertyValue('display') === 'none') {
          parent.style.setProperty('display', 'block', 'important');
        }
        parent = parent.parentElement;
      }
    });
  }

  window.BelginGrowth = { track, ensureCommerceNavigationVisible };
  track('page_view');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCommerceNavigationVisible, { once: true });
  } else {
    ensureCommerceNavigationVisible();
  }
  setTimeout(ensureCommerceNavigationVisible, 250);
  setTimeout(ensureCommerceNavigationVisible, 1200);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('a,button') : null;
    if (!target) return;
    const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') || '' : '';
    const text = (target.textContent || '').trim().slice(0, 80);
    if (/\/urun\//.test(href)) track('product_click', { cta_id: 'product-link' });
    if (/odeme|checkout|sepet|satın|satin/i.test(`${href} ${text}`)) track('checkout_start', { cta_id: 'checkout' });
    if (/tel:/.test(href)) track('phone_click', { cta_id: 'phone' });
    if (/maps|google\.com\/maps|harita/i.test(href)) track('store_visit_intent', { cta_id: 'map' });
    if (/showroom|mağaza|magaza/i.test(`${href} ${text}`)) track('store_visit_intent', { cta_id: 'showroom' });
    if (target.matches('[data-brand], [data-brand-filter]')) track('brand_filter', { cta_id: 'brand-filter' });
  }, true);
})();
