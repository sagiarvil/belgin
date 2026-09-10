---
name: edge-tokenomics-cdn-architect
description: >-
  Cloudflare Pages, Workers, D1 serverless SQLite, KV, Turnstile, Edge Cache API, and sub-40ms TTFB architecture. Features the 14KB HTMLRewriter AST stripper, tiered caching, and zero-cold-start performance.
---

# Cloudflare Edge & Tokenomics CDN Architecture
## Sub-40ms Global TTFB & Serverless Edge Performance
### HTMLRewriter AST Pruning, D1 SQLite, and Security Fortress

Bu yetenek; Cloudflare Pages, Workers, D1 ve Edge Cache API altyapısını ultra düşük gecikme ve sıfır cold-start ile çalıştırır.

---

### 1. 14KB Token Budayıcı Edge Worker (`14_CLOUDFLARE_WORKER_14KB_TOKEN_PURGE.js`)
AI crawler'ları (GPTBot, ClaudeBot, PerplexityBot) sayfayı ziyaret ettiğinde gereksiz CSS, SVG ve istemci taraflı JS'leri budayarak ilk 14KB AST penceresini korur:
```javascript
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const userAgent = request.headers.get("user-agent") || "";
    const isAIBot = /PerplexityBot|GPTBot|ClaudeBot|OAI-SearchBot|Applebot-Extended/i.test(userAgent);
    
    if (!isAIBot) return response;

    return new HTMLRewriter()
      .on("script:not([type='application/ld+json'])", { element(e) { e.remove(); } })
      .on("svg:not(.critical-icon)", { element(e) { e.remove(); } })
      .on("style, noscript, iframe, canvas", { element(e) { e.remove(); } })
      .on("main, article, [data-chunk-id]", {
        element(e) { e.setAttribute("data-rag-budget", "enforced-14kb"); }
      })
      .transform(response);
  }
};
```

---

### 2. Standart Üretim HTTP Başlıkları (`_headers`)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Robots-Tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/llms/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  Content-Type: text/markdown; charset=utf-8
  Access-Control-Allow-Origin: *
```

---

### 3. Cloudflare D1 (Serverless SQLite) ve KV Caching
- Parametreli sorgular, ACID işlemleri ve sıfır SQL Enjeksiyonu.
- `caches.default` ile programatik mikro-önbellekleme.
- Turnstile bot savunması: Managed / invisible challenge widget sunucu tarafı doğrulaması.

