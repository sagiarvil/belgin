---
name: core-web-vitals-optimizer
description: >-
  Optimization protocol for Core Web Vitals (LCP < 1.2s, INP < 100ms, CLS < 0.05), asset minification, critical CSS inlining, image modern formats (AVIF/WebP), and non-blocking DOM execution. Use when analyzing or accelerating page speed.
---

# Core Web Vitals & Frontend Performance Protocol

## Performance Thresholds & Rules

1. **Largest Contentful Paint (LCP < 1.2s):**
   - Preload above-the-fold hero images: `<link rel="preload" fetchpriority="high" as="image" href="..." type="image/webp">`.
   - Never lazy-load the hero/LCP image! Only lazy-load below-the-fold assets (`loading="lazy" decoding="async"`).
   - Inline critical path CSS directly into `<head><style>...</style></head>` to avoid render-blocking CSS requests.

2. **Cumulative Layout Shift (CLS < 0.05):**
   - Always declare explicit `width` and `height` (or aspect-ratio) on all `<img>`, `<svg>`, and `<iframe>` tags.
   - Reserve dynamic container heights before content loads (skeleton loaders or min-height wrappers).
   - Use `font-display: swap` combined with font fallback metrics (`size-adjust`, `ascent-override`) to avoid FOIT/FOUT shift.

3. **Interaction to Next Paint (INP < 100ms):**
   - Eliminate long tasks (>50ms) on the main thread.
   - Break heavy JavaScript computation using `scheduler.yield()` or `requestIdleCallback()`.
   - Use passive event listeners for scroll, wheel, and touch events: `{ passive: true }`.
   - Defer third-party scripts (Google Analytics, tracking tags) using `defer` or `requestIdleCallback`.

