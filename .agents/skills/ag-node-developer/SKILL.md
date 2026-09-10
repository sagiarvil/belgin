---
name: ag-node-developer
description: node-developer reference
---

# Node.js Developer — Uzmanlık Dökümanı

## Yetkinlik
- Tüm Node yığınları: Express, Fastify, NestJS, Koa, Hono; Next.js/Nuxt/Remix (SSR API tarafı — UI `frontend-developer`); tRPC, GraphQL (Apollo/Mercurius).
- ORM/DB: Prisma, Drizzle, TypeORM, Kysely, Knex, Mongoose. Kuyruk: BullMQ.
- Framework'süz veya **projeye özel çekirdek**: http server + router + DI + middleware pipeline, kendi CLI.
- Dil: TypeScript tercih (`strict: true`). ESM. Node LTS.

## Standartlar
- Katman: route/controller → service → domain → repository. Bağımlılık içe. NestJS'te module/provider yapısı.
- Tipleme: `tsc --noEmit` temiz, `any` yasak (gerekiyorsa `unknown` + daraltma). Girdi doğrulama: zod/valibot/class-validator — route'ta değil şema ile.
- Async: her yerde `async/await`, `Promise` reddini yut(ma). `unhandledRejection`/`uncaughtException` handler + graceful shutdown.
- Hata: özel `Error` sınıfları + merkezi error middleware; HTTP dışı sızıntı yok. `next(err)` / Fastify `setErrorHandler`.
- DB: Prisma/Drizzle ile parametreli; ham SQL'de `$queryRaw`/tagged template. N+1 için `include`/`with`/DataLoader. Transaction. Migration (`prisma migrate`/`drizzle-kit`) + uygula.
- Config: `dotenv` + şema doğrulama (zod). Secret kodda değil, repoda değil.
- Logging: `pino` structured, PII yok. `console.log` bırakma.
- Paket: `package-lock.json`/`pnpm-lock.yaml` sabit. `npm audit` / `pnpm audit`. Kullanılmayan bağımlılık çıkar.
- Stil: ESLint (`@typescript-eslint`) + Prettier temiz.

## Doğrulama (sırayla)
1. `tsc --noEmit` — 0 hata.
2. `eslint .` + `prettier --check`.
3. `npm test` / `vitest run` — ilgili testler yeşil.
4. Migration eklendiyse dev DB'ye uygula.
5. Web'de görünürse çalıştır (`npm run dev`) + endpoint/tarayıcı testi, konsol hatası kontrol.

## Sık hatalar
- `await` unutmak → yüzen promise, yakalanmayan hata.
- Blocking senkron API (fs.readFileSync, JSON.parse dev sonuç) request path'te.
- `process.env.X` doğrulamadan kullanmak (undefined).
- Prisma client'ı her istekte yeni oluşturmak (bağlantı tükenir) — singleton.
- ESM/CJS karışımı, `__dirname` ESM'de yok.

## İletişim
- Bitince özet: değişen modüller, yeni endpoint'ler, migration, env anahtarları, frontend/mobil sözleşmesi.
- Güvenlik hassas alan → `node-security-expert`. Bağımlılık → `SendMessage`.
