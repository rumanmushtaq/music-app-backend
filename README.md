# Music App Backend

NestJS API for the Music App (Expo/React Native frontend lives in the sibling `music-app` folder).

Authentication is handled by [Clerk](https://clerk.com): the frontend signs users in with Clerk and sends the
resulting session token as a bearer token; this backend verifies that token, then just-in-time provisions a local
`users` row keyed by the Clerk user id.

## Setup

```bash
cp .env.example .env   # fill in CLERK_SECRET_KEY and DATABASE_URL
npm install
npm run start:dev
```

## Env vars

- `CLERK_SECRET_KEY` — from the Clerk dashboard for this app's instance.
- `DATABASE_URL` — Postgres connection string (or set `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` instead).
- `PORT` — defaults to `3000`.

## Endpoints

- `GET /me` — requires `Authorization: Bearer <clerk-session-token>`. Verifies the token with Clerk, upserts the
  local user row, and returns it.

## Status

Scaffold only: auth guard + user provisioning. Catalog/podcast/search APIs are separate follow-up work.
# music-app-backend
