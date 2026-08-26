# Belgin Kuyumculuk Design System Contract

Version: 1.0.0  
Scope: `belginkuyumculuk.com` luxury jewellery/watch commerce UI, product discovery, product detail, cart, checkout, legal/trust surfaces and responsive behavior  
Status: mandatory project design contract

## 0. Purpose and authority

This file defines how Belgin Kuyumculuk must look, feel and convert. It exists to prevent generic marketplace styling, black-and-gold luxury clichés, inconsistent product photography treatment, over-designed checkout flows and mobile layout regressions.

Belgin Kuyumculuk is a jewellery and watch retail experience. The design must communicate craftsmanship, material value, trust, showroom credibility and secure purchasing without becoming visually loud.

Priority order:

1. Explicit user-approved product, price, stock, legal and payment truth.
2. This `DESIGN.md`.
3. Current runtime tokens and styles in `css/style.css`.
4. Existing HTML/JS commerce behavior and legal pages.
5. Reusable UI patterns already present in the project.
6. External references such as 21st.dev or high-trust luxury/financial commerce sites.

External references are inspiration only. Never copy another brand's palette, photography, typography, logo treatment, exact wording or signature component composition.

---

## 1. Design thesis

### 1.1 Core idea — Quiet Jewellery House

Belgin Kuyumculuk should feel like a modern jewellery house translated to the web:

- quiet luxury rather than nightclub luxury;
- product-first rather than decoration-first;
- tactile, editorial and material-aware;
- premium through proportion, photography, spacing and detail;
- trustworthy enough for high-value payment decisions;
- mobile-first where buying behavior requires it.

The commercial narrative should follow:

`desire/discovery -> product -> material/detail -> trust -> price/availability -> purchase -> secure payment -> delivery/service`

Avoid:

`dark hero -> gold gradients -> generic luxury slogans -> endless carousel -> buy now`

### 1.2 First-screen questions

On a product or collection page the user should quickly understand:

1. What the product is.
2. Why it is valuable/special.
3. The current price/availability facts.
4. What evidence/details support the purchase.
5. What the next action is.

---

## 2. Runtime brand system

The live token system in `css/style.css` is the implementation source of truth.

### 2.1 Core palette

Current brand family:

- deep teal: `--color-teal`, `--color-teal-rich`, `--color-teal-hover`;
- gold: `--color-gold`, `--color-gold-bright`, `--color-gold-dark`, `--color-gold-light`;
- dark/caviar: `--color-caviar`;
- paper/page: `--color-paper`, `--color-bg-page`, `--color-pedestal`;
- primary ink: `--color-ink`;
- muted text: `--color-muted`;
- borders: `--color-border`, `--color-border-gold`.

Rules:

1. Deep teal is the house color; gold is a restrained precious-metal accent.
2. Gold must not flood large areas just to signal luxury.
3. Caviar/black is reserved for high-contrast editorial, ticker or evening-luxury moments.
4. Most product-reading surfaces stay light and warm so jewellery imagery remains dominant.
5. Do not introduce a second luxury palette such as purple, royal blue or rose gold without an explicit product/brand reason.
6. Status colors have semantic meaning; live/available/success states must not be faked for decoration.

### 2.2 Surface hierarchy

Preferred surface rhythm:

- warm paper page;
- white product/card surface;
- pedestal/soft neutral for product staging;
- deep teal/caviar for high-trust or market-data bars;
- gold line/detail for emphasis.

A screen should normally show no more than three surface levels at once.

---

## 3. Typography

Current runtime typography:

- primary display/body: Plus Jakarta Sans / Inter stack;
- editorial luxury accent: Playfair Display through `--font-serif`;
- fluid type scale defined in `css/style.css`.

Rules:

- product and commerce readability outranks decorative serif usage;
- serif may be used for brand/editorial moments, collection names or selected product headings;
- price, size, karat, material, reference number and transactional labels remain clean sans;
- no thin microtext that becomes unreadable on mobile;
- numeric values use stable/tabular alignment where useful;
- Turkish characters must render correctly across all pages.

---

## 4. Photography and product proof

Product photography is the primary visual proof. Decorative UI must never compete with it.

Rules:

1. Preserve image aspect ratio; never stretch jewellery/watch images.
2. Product detail pages prioritize sharp material/detail views over decorative composites.
3. Use neutral/pedestal surfaces to preserve metal and stone color fidelity.
4. Crops must not remove important watch dial, clasp, hallmark, stone or setting detail.
5. If an image is illustrative or generated, it must not be presented as the exact sale item.
6. Avoid heavy filters that alter perceived metal/stone color.
7. Thumbnails and galleries must remain operable by touch and keyboard.

---

## 5. Component contract

Before creating a new component, inspect the existing HTML/CSS/JS implementation and extend stable patterns where possible.

Core conceptual components:

- top contact/status bar;
- live gold/market ticker;
- main header/navigation;
- collection hero;
- product card;
- product image gallery;
- material/specification block;
- price/availability block;
- quantity selector;
- add-to-cart action;
- wishlist action;
- trust/payment block;
- delivery/returns/service block;
- cart item;
- checkout step/block;
- legal-consent block;
- order status;
- store/showroom/contact block;
- footer.

A component must represent a reusable commerce/luxury concept, not a one-page ornament.

### 5.1 Product card

A product card should make the decision to open detail easy.

Show only decision-relevant facts:

- product name;
- category/collection where useful;
- one clear price/price-status fact;
- one concise material/spec fact when useful;
- availability if current and truthful;
- one primary detail action.

Do not turn cards into mini product-detail pages.

### 5.2 Product detail

Preferred anatomy:

`gallery -> product identity -> price -> essential material/specs -> availability/delivery -> primary purchase action -> service/trust -> deeper description`

The user should not have to scroll through brand storytelling before seeing price and purchase-critical facts.

### 5.3 Price and market data

Price data is trust-sensitive.

- show currency clearly;
- distinguish live/reference gold data from product selling price;
- live ticker must have a reliable source/freshness behavior;
- stale or unavailable live data must fail gracefully rather than display fake `live` status;
- do not animate price changes so aggressively that values become hard to read.

### 5.4 Cart and checkout

Checkout is a trust interface, not a marketing canvas.

Priorities:

1. order items and totals;
2. delivery/contact information;
3. legally required approvals;
4. payment/security explanation;
5. clear final action;
6. success/failure state.

Do not introduce decorative elements that distract from totals, consent or payment state.

---

## 6. Luxury trust and conversion architecture

This section adapts high-trust product/fintech patterns such as intent routing, evidence ladders and contextual CTAs to luxury retail. It does not copy another company's look.

### 6.1 Intent-first discovery

Users may start from different purchase intentions. Discovery may route by current catalog structure, for example:

- Mücevher;
- Saat;
- Yeni / Öne Çıkan;
- Hediye / occasion only if the catalog genuinely supports it;
- direct product search.

Rules:

1. Do not expose every product in the primary navigation.
2. Collection/category discovery and search must lead to the same canonical product detail.
3. Filters should help narrow real inventory, not exist as decorative UI.

### 6.2 Evidence ladder

High-intent product pages should move from desire to evidence:

`product -> real imagery -> material/specification -> price -> availability/delivery -> trust/service -> purchase`

For high-value goods, evidence may include only factual details such as:

- karat/material;
- stone/material specification where known;
- watch movement/case/glass specification where known;
- dimensions/weight where known;
- warranty/service terms;
- delivery/return terms;
- secure payment method;
- business/contact/showroom facts.

Never invent certificates, provenance, limited-edition status, scarcity or technical specifications.

### 6.3 Trust density

Trust should appear near the decision:

- price -> payment/security fact nearby;
- add-to-cart -> delivery/return confidence nearby;
- technical luxury watch -> movement/material facts nearby;
- checkout -> legal/security and order summary nearby;
- live gold data -> source/freshness context nearby.

Do not isolate all trust information in the footer.

### 6.4 Contextual CTA hierarchy

Preferred progression:

- discovery: `Koleksiyonu İncele` / current approved equivalent;
- product card: `Ürünü İncele`;
- product detail: `Sepete Ekle`;
- checkout: `Güvenli Ödemeye Geç` / current implemented equivalent;
- support: contact/showroom action when relevant.

One decision block normally has one dominant CTA.

Wishlist/favorite is always secondary to the purchase action.

### 6.5 Progressive disclosure

Order:

1. product and visual proof;
2. price and essential specification;
3. purchase/availability;
4. delivery/service trust;
5. deeper story/craft detail;
6. related products.

Do not put long brand copy ahead of purchase-critical information.

### 6.6 Related products

Recommendations should have a real relationship:

- same collection;
- same material/category;
- meaningful complementary piece;
- relevant price/style neighborhood.

Do not show unrelated items only to fill a carousel.

---

## 7. Page archetypes

### 7.1 Home

The home page should operate as a curated maison window.

Preferred sequence:

`brand/collection statement -> selected product proof -> collection discovery -> craftsmanship/material trust -> services/payment/delivery -> selected recommendations -> contact/showroom/footer`

The home page is not a complete inventory dump.

### 7.2 Collection/category

Preferred sequence:

1. concise collection title/context;
2. useful filters/sort where inventory justifies them;
3. product grid;
4. light supporting trust/content;
5. related collection path.

Product grid must remain the dominant content.

### 7.3 Product detail

Preferred sequence:

1. breadcrumb/context;
2. gallery + buying panel;
3. essential specifications;
4. delivery/payment/warranty facts;
5. story/details;
6. related products;
7. service/contact close.

### 7.4 Cart

- preserve item image/name/price/quantity clarity;
- totals must remain visible and unambiguous;
- destructive actions must look secondary and require deliberate interaction;
- no fake urgency.

### 7.5 Checkout

- minimal navigation distraction;
- visible progress if multiple steps exist;
- clear errors near the relevant field;
- legal consent text accessible and not visually hidden;
- payment provider/security truth must match the current implementation;
- final total stays obvious.

### 7.6 Legal pages

Legal pages inherit typography and brand shell but prioritize readability over luxury decoration.

- narrow readable prose width;
- clear heading hierarchy;
- no animated decoration;
- stable anchor/navigation if document is long;
- current business identity/contact facts must be consistent.

---

## 8. Responsive contract — non-negotiable

Verify edited surfaces at minimum at:

- 320px;
- 360px;
- 375px;
- 390px;
- 430px;
- 768px;
- 1024px;
- 1280px;
- 1440px.

Rules:

- no page-level horizontal overflow;
- do not treat the historical `body { overflow-x: hidden; }` as proof that layout is safe;
- new/edited components must be locally shrinkable and bounded;
- product galleries must stay inside viewport;
- header/nav tools must collapse without clipping;
- live ticker may scroll inside its own deliberate strip only;
- currency selector and topbar must not force viewport overflow;
- cart/checkout forms must remain one-column and easy to tap on narrow screens;
- effective touch targets should normally be at least 44x44px;
- sticky purchase actions must not cover product content or system browser safe areas.

---

## 9. Accessibility

Target WCAG 2.2 AA or better.

Required:

- semantic headings/landmarks;
- descriptive product image alt text;
- keyboard-operable gallery, menu, cart and checkout;
- visible focus;
- sufficient color contrast;
- labels tied to inputs;
- errors associated with fields;
- status not communicated only by color;
- reduced-motion behavior;
- no hover-only essential product information.

Luxury styling does not justify inaccessible text or controls.

---

## 10. Motion

Motion should feel quiet and material.

Allowed:

- small opacity/transform transitions;
- gallery transitions;
- restrained hover elevation;
- ticker motion with pause/reduced-motion behavior.

Avoid:

- perpetual glow effects on purchase buttons;
- aggressive parallax;
- rotating decorative logos that distract from commerce;
- large scroll-jacking transitions;
- animation that makes price or stock information harder to read.

---

## 11. Commerce claim discipline

Only show facts supported by current product data or store policy.

Never fabricate:

- scarcity (`son 1 ürün`) unless inventory proves it;
- fake countdowns;
- fake customer/review counts;
- fake certificates;
- fake live showroom status;
- unsupported movement/material/steel/glass specifications;
- misleading crossed-out prices;
- misleading `ücretsiz kargo` or return promises.

If a fact is unknown, omit it or label it clearly rather than infer it.

---

## 12. Anti-patterns

Reject:

- generic black + gold everywhere;
- gold gradients on every CTA;
- excessive glassmorphism;
- oversized rounded SaaS cards;
- product imagery inside tiny decorative frames;
- autoplay hero carousels that hide products;
- five competing purchase/support CTAs;
- tiny serif body text;
- fake scarcity or live indicators;
- endless unrelated product carousels;
- page-level horizontal scrolling;
- competitor-look imitation.

---

## 13. External reference policy

21st.dev, high-trust fintech and luxury-commerce sites may inspire:

- product comparison layouts;
- gallery composition;
- trust placement;
- cart/checkout hierarchy;
- contextual CTA sequencing;
- mobile sticky purchase behavior;
- dense information disclosure.

They may not provide Belgin's brand identity. Every adopted pattern must be rebuilt with the teal/gold/warm-paper system and current static HTML/CSS/JS architecture.

---

## 14. Production discipline

Before changing shared commerce UI:

1. identify every route/SPA state using it;
2. preserve cart and wishlist data behavior;
3. preserve payment flow and callbacks;
4. preserve legal consent requirements;
5. preserve SEO/canonical behavior;
6. preserve live data failure behavior;
7. test desktop and mobile.

Do not weaken payment, legal or security behavior to achieve a visual result.

---

## 15. Validation checklist

For every UI change verify:

### Visual

- current tokens reused;
- product imagery remains dominant;
- one dominant CTA per decision block;
- no accidental luxury cliché drift.

### Responsive

- 320/375/390/430/768/1024/1280/1440 tested;
- no page-level horizontal overflow;
- header, ticker, gallery, cart and checkout fit;
- long Turkish product/legal text tested.

### Commerce

- price/currency correct;
- cart total correct;
- quantity controls work;
- wishlist remains secondary;
- payment path unchanged unless explicitly requested;
- legal checkboxes/consents remain usable;
- success/failure states are clear.

### Accessibility

- keyboard flow works;
- focus visible;
- contrast safe;
- images have useful alt text;
- reduced motion respected.

---

## 16. Agent execution prompt

For future UI tasks:

> Read `DESIGN.md`, the target HTML/JS state and the relevant section of `css/style.css` before editing. Treat current product, price, legal, payment and inventory data as factual truth. Reuse the existing teal/gold/warm-paper tokens and commerce patterns. Use external references only for information architecture, trust placement, comparison and interaction ideas; never copy another brand's visual identity. Keep product photography dominant, one primary action per decision block and secure-purchase facts near the action. Design from 320px through large desktop without relying on page-level overflow masking. Validate gallery, ticker, cart, checkout, legal consent and reduced-motion behavior before merge.

---

## 17. Definition of done

A Belgin Kuyumculuk visual change is done only when:

- it looks native to Belgin, not like a generic template or copied luxury brand;
- product proof is stronger than decoration;
- current teal/gold/warm-paper tokens are respected;
- price/material/payment facts remain accurate;
- purchase and trust hierarchy is clear;
- no fake scarcity/review/certification claim is introduced;
- mobile has no page-level horizontal overflow;
- cart/checkout/legal behavior remains intact;
- accessibility fundamentals pass;
- shared commerce behavior is regression-tested.
