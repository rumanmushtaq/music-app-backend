# Music App Backend

NestJS REST API for the Music App. The Expo/React Native client lives in the sibling [`music-app`](../music-app) folder.

Authentication is delegated to [Clerk](https://clerk.com): the mobile app signs users in with Clerk and sends the
resulting session token as a bearer token on every request. This backend verifies that token against Clerk on each
call, then just-in-time provisions (or updates) a local `users` row keyed by the Clerk user id. There is no local
password/session storage — Clerk is the source of truth for identity.

## Tech stack

- [NestJS 10](https://docs.nestjs.com/) (Express platform)
- [TypeORM](https://typeorm.io/) + PostgreSQL
- [`@clerk/backend`](https://clerk.com/docs/references/backend/overview) for token verification and user lookup
- TypeScript, compiled with `nest build`

## Project structure

```
src/
  main.ts                    Nest bootstrap (global exception filter, PORT)
  app.module.ts               Root module wiring every feature module + TypeORM
  config/
    database.config.ts        Builds TypeOrmModuleOptions from DATABASE_URL or discrete DB_* vars
  auth/
    clerk-auth.guard.ts        ClerkAuthGuard — verifies the bearer token, exposes createClerkClient
    current-auth.decorator.ts  @CurrentAuth() param decorator (userId/email/sessionId)
    me.controller.ts           GET /me
  users/                       User entity + upsert-by-Clerk-id service (used by every other module)
  plans/                       Plan entity, seeded plans (free/pro/black), GET /api/plans
  profile/                     GET/PATCH /api/profile, POST /api/logout
  checkout/                    Order entity + checkout flow (create → set address → pay)
  subscriptions/               Subscription entity, GET/POST /api/subscription
  home/                        GET /home — static mock feed data (no DB)
  podcasts/                    GET /podcasts — static mock data (no DB)
  search/                      GET /api/search, /api/search/moods — static mock data (no DB)
  ai-search/                   POST /api/ai-search — deterministic mock "AI mix" generator (no DB, no LLM call)
  library/                     Song/Artist/Playlist entities, seeded on boot, GET /api/library
  common/                      Global exception filter, tax lookup table, email masking helper
```

Modules marked "static mock data" return hardcoded arrays instead of querying Postgres — they exist to unblock the
frontend UI and are expected to be replaced with real data sources later. `users`, `plans`, `subscriptions`,
`orders`, and `library` (`songs`/`artists`/`playlists`) are the tables backed by Postgres today.

## Prerequisites

- Node.js (LTS) and npm
- A PostgreSQL database (local or hosted)
- A [Clerk](https://dashboard.clerk.com) application/instance, using the same instance as the `music-app` frontend

## Setup

```bash
cp .env.example .env   # fill in CLERK_SECRET_KEY and your DB connection
npm install
npm run start:dev
```

The server starts on `http://localhost:3000` by default (or `PORT` if set). With `NODE_ENV` unset/non-production,
TypeORM `synchronize` is on, so tables are created/updated automatically from the entities — no manual migrations
needed for local dev.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | Yes | Secret key from the Clerk dashboard for this app's instance. Used to verify bearer tokens and call the Clerk backend API. **Never commit or share this value.** |
| `DATABASE_URL` | One of `DATABASE_URL` or the `DB_*` vars below | Full Postgres connection string, e.g. `postgres://user:pass@host:5432/dbname`. Takes priority over the discrete `DB_*` vars when set. |
| `DB_HOST` | No | Defaults to `localhost`. Used only when `DATABASE_URL` is unset. |
| `DB_PORT` | No | Defaults to `5432`. |
| `DB_USER` | No | Defaults to `postgres`. |
| `DB_PASSWORD` | No | Defaults to `postgres`. |
| `DB_NAME` | No | Defaults to `music_app`. |
| `PORT` | No | HTTP port the Nest app listens on. Defaults to `3000`. |

See `.env.example` for a ready-to-copy template.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start in watch mode (recommended for local development) |
| `npm run start` | Run the compiled app from `dist/` (`node dist/main.js`) |
| `npm run build` | Compile TypeScript with `nest build` into `dist/` |
| `npm run lint` | Lint `src` and `test` with ESLint |

## Authentication

Every protected route expects:

```
Authorization: Bearer <clerk-session-token>
```

`ClerkAuthGuard` verifies the token with `verifyToken()`, fetches the user from Clerk, and attaches
`{ userId, email, sessionId }` to the request as `request.auth`, retrievable in a handler via the `@CurrentAuth()`
decorator. An invalid/expired/missing token returns `401 Unauthorized`.

## API reference

Unguarded routes are marked "Public"; everything else requires the `Authorization: Bearer` header above.

### Auth / Me

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/me` | Required | Verifies the token, upserts the local user row, returns it. |

### Home & discovery (mock data)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/home` | Public | Static home feed: categories, quick-play items, daily mixes, tracks, beats, top voices, now-playing. |
| GET | `/podcasts` | Public | Podcast categories + feed. |
| GET | `/podcasts/:id` | Public | Podcast detail (episodes + similar podcasts). |
| GET | `/podcasts/:id/episodes/:episodeId` | Public | Single episode detail. |

### Search

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/search/moods` | Required | Mood cards for the search landing screen. |
| GET | `/api/search?q=&type=&limit=&cursor=` | Required | Search songs/artists/playlists. `type` is `songs` \| `artists` \| `playlists` (default `songs`). `limit` defaults to 20. `cursor` is an opaque base64 offset returned as `nextCursor`; pass it back to page. `q` is required (`400` if missing/blank). |
| POST | `/api/ai-search` | Required | Body: `{ "prompt"?: string }`. Returns a deterministic mock "AI mix" (`mix`, `mixTracks`, `recommended`) derived from the prompt — not a real recommendation/LLM call yet. |

### Plans

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/plans` | Required | All plans (`free`, `pro`, `black`), each flagged `isActiveForUser` against the caller's current plan. Seeded automatically on boot. |
| GET | `/api/plans/:planId` | Required | Single plan by id. `404` if unknown. |

### Profile

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/profile` | Required | Current user's profile + current plan summary. |
| PATCH | `/api/profile` | Required | Body: any of `name`, `avatarUrl`, `notificationsEnabled`, `darkModeEnabled`, `musicLanguage`. Returns the updated profile. |
| POST | `/api/logout` | Required | Best-effort revokes the Clerk session server-side. Returns `204 No Content`. |

### Checkout

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/checkout` | Required | Body: `{ "planId": string }`. Creates a `pending` order with base price/discount computed from the plan. |
| PATCH | `/api/checkout/:orderId/address` | Required | Body: `{ "countryCode": string, "stateCode"?: string }`. Applies a tax lookup (see `common/tax.util.ts`) and recomputes the order subtotal. |
| POST | `/api/checkout/:orderId/pay` | Required | Body: `{ "paymentProvider": string, "paymentToken": string }`. Verifies the token via `GooglePlayVerificationService` (stub — see below), marks the order `paid` or `failed`, and on success activates/renews the user's subscription and current plan. |
| GET | `/api/checkout/:orderId` | Required | Order status/breakdown. `404` if the order doesn't belong to the caller. |

> `GooglePlayVerificationService.verifyPurchaseToken` is currently a stub that accepts any non-empty token string.
> A production integration should call the Google Play Developer API's `purchases.subscriptions.get` to verify the
> purchase token server-side before marking an order as paid.

### Library

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/library` | Required | `{ songs, artists, playlists }` from Postgres. Seeded automatically on boot by `LibraryService.onModuleInit` (idempotent — only inserts rows that don't already exist). |

### Subscription

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/subscription` | Required | Current subscription (`planId`, `status`, `startedAt`, `expiresAt`). Returns an implicit `free`/`active` subscription if none exists yet. |
| POST | `/api/subscription/cancel` | Required | Cancels the active subscription. `400` if there isn't one. |

## Error format

Uncaught exceptions are normalized by the global `ApiExceptionFilter` into:

```json
{ "error": { "code": "BadRequestException", "message": "q is required" } }
```

`code` is the exception class name for `HttpException`s (or `InternalServerError` otherwise); the HTTP status code
matches the exception (e.g. `401` for auth failures, `404` for missing resources, `402` for `PaymentFailedException`).

## Data model

- **`User`** — `id` (uuid), `clerkId` (unique), `email`, `name?`, `avatarUrl?`, `notificationsEnabled`,
  `darkModeEnabled`, `musicLanguage`, `currentPlanId?`, `createdAt`.
- **`Plan`** — `id` (`free`/`pro`/`black`), `tier`, `name`, `durationLabel`, `durationDays`, `originalPrice`,
  `currency`, `discountPercent`, `features` (JSON string array). Seeded on startup by `PlansService.onModuleInit`.
- **`Order`** — `id`, `userId`, `planId`, `countryCode?`, `stateCode?`, `basePrice`, `discountAmount`, `taxAmount?`,
  `taxLabel?`, `subtotal`, `paymentProvider`, `paymentAccountEmailMasked?`, `status` (`pending`/`paid`/`failed`),
  `createdAt`, `paidAt?`.
- **`Subscription`** — `id`, `userId` (unique), `planId`, `status` (`active`/`expired`/`canceled`), `startedAt`,
  `expiresAt?`.
- **`Song`** — `id`, `title`, `artistNames` (JSON string array), `artworkUrl?`, `durationSeconds`.
- **`Artist`** — `id`, `name`, `avatarUrl?`.
- **`Playlist`** — `id`, `title`, `curatorNames` (JSON string array), `songCount`, `durationLabel`, `artworkUrl?`.

## Security notes

- Treat `CLERK_SECRET_KEY` and your database credentials as production secrets: never commit `.env`, paste it into
  screenshots/chat, or share it outside the team. If a secret key is ever exposed, rotate it immediately from the
  Clerk dashboard's **API keys** page (create a new key, update `.env` and any deployment config, then delete the old
  key).
- `.gitignore` only excludes `node_modules` by default — make sure `.env` and `dist/` are excluded before running
  `git add` so secrets and build output don't end up in version control.

## Status

Auth, user provisioning, plans, profile, checkout, subscriptions, and library are backed by Postgres. Home, podcasts,
and search/AI-search currently return static/mock data and are follow-up work to wire up to a real catalog.
