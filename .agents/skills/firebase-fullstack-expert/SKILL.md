---
name: firebase-fullstack-expert
description: >-
  Expert implementation of Firebase Cloud Functions (2nd gen Node.js/TS), Firestore security rules, Firebase Auth token verification, and Firebase App Hosting rewrites. Use when developing or auditing Firebase backend and serverless logic.
---

# Firebase 2nd Gen & Security Architecture

## Architecture & Rules

1. **Cloud Functions 2nd Gen (Node.js):**
   - Build on Cloud Run architecture with concurrency support and fast CPU scaling.
   - Keep cold starts minimal: avoid heavy top-level imports; initialize third-party SDKs lazily inside function handlers when appropriate.
   - Enforce CORS validation strictly using specific origin whitelists instead of wildcard `*`.

2. **Firestore Security Rules Optimization:**
   - Zero-trust default: `match /{document=**} { allow read, write: if false; }`.
   - Granular RBAC (Role-Based Access Control) using custom claims or token auth UID:
     ```
     match /orders/{orderId} {
       allow read: if request.auth != null && request.auth.uid == resource.data.userId;
       allow write: if false; // Only written via trusted server-side Cloud Function
     }
     ```

3. **Local Testing & Verification:**
   - Always test rules and functions locally with Firebase Suite Emulator:
     `npx firebase emulators:start --only functions,firestore,hosting`

