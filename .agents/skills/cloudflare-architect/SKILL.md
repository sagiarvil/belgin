---
name: cloudflare-architect
description: >-
  Deep architectural expertise for Cloudflare Pages, Workers, D1 serverless SQLite, KV, R2, Turnstile bot protection, Cache API, and edge routing. Use when designing, optimizing, or debugging Cloudflare infrastructure, wrangler.jsonc, or edge functions.
---

# Cloudflare Edge & Serverless Architecture

## Core Edge Capabilities & Guidelines

1. **Cloudflare Pages & Routing:**
   - Configuration via `wrangler.jsonc` or `wrangler.toml`.
   - Custom HTTP headers in `_headers`: Strict HSTS, CSP (Content-Security-Policy), X-Content-Type-Options: nosniff, and immutable caching for static assets:
     ```
     /assets/*
       Cache-Control: public, max-age=31536000, immutable
     /*
       X-Frame-Options: SAMEORIGIN
       X-Content-Type-Options: nosniff
       Referrer-Policy: strict-origin-when-cross-origin
     ```
   - Clean URLs and dynamic routing via `_redirects` (HTTP 301/302 rewrites, proxying).

2. **Cloudflare Workers & D1 / KV Integration:**
   - Sub-millisecond cold starts using V8 isolates.
   - D1: Serverless SQLite database with prepared statements and transactions:
     ```javascript
     const { results } = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
     ```
   - KV: High-read, low-latency caching (use `cacheTtl` for edge expiry).

3. **Cloudflare Turnstile Bot Defense:**
   - Embed invisible or managed challenge widget on sensitive forms (checkout, login, contact).
   - Verify Turnstile response token server-side via `https://challenges.cloudflare.com/turnstile/v0/siteverify` using `CF-Connecting-IP`.

4. **Edge Performance & Caching:**
   - Utilize `caches.default` for programmatic micro-caching in Workers.
   - Enforce Brotli/Zstandard compression on all textual responses.

