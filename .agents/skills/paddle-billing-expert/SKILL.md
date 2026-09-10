---
name: paddle-billing-expert
description: >-
  Expert guide for integrating Paddle Billing v2, Paddle.js checkout overlays, webhook signature verification (Paddle-Signature), subscription management, and transaction handling. Use when implementing, debugging, or auditing Paddle payment workflows.
---

# Paddle Billing v2 & Payment Architecture

## Core Architecture & Guidelines

1. **Client-Side Paddle.js Integration:**
   - Initialize Paddle in Sandbox vs Production environment using client tokens:
     ```javascript
     Paddle.Environment.set('sandbox'); // or 'production'
     Paddle.Initialize({
       token: 'live_... or test_...',
       eventCallback: function(data) {
         if (data.name === 'checkout.completed') {
           // Handle immediate user feedback
         }
       }
     });
     ```
   - Triggering checkout overlay:
     ```javascript
     Paddle.Checkout.open({
       settings: { displayMode: 'overlay', theme: 'light', locale: 'tr' },
       items: [{ priceId: 'pri_...', quantity: 1 }],
       customer: { email: userEmail },
       customData: { userId: '...', orderId: '...' }
     });
     ```

2. **Server-Side Webhook Verification (Zero-Trust Security):**
   - Paddle sends a `Paddle-Signature` header with timestamp `ts` and hashes `h1`.
   - Never trust webhook payloads without verifying the HMAC-SHA256 signature against your webhook secret key!
   - Verify timestamp freshness (prevent replay attacks, reject requests older than 5 seconds).
   - Use timing-safe comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

3. **Subscription & Transaction Events:**
   - `transaction.completed`: Provision user license / unlock features immediately.
   - `subscription.activated` / `subscription.updated`: Update access tier and renewal dates.
   - `subscription.canceled` / `subscription.past_due`: Handle grace periods before cutting access.
   - Store transaction IDs with strict idempotency (never credit access twice for the same event ID).

