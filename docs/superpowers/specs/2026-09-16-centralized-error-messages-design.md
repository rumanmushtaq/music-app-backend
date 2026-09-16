# Centralized error messages + safer error responses

## Problem

`music-app-backend` throws its user-facing error strings inline, scattered across
7 files (11 call sites): `subscriptions.service.ts`, `podcasts.service.ts` (x2),
`users.service.ts`, `search.controller.ts`, `checkout.service.ts` (x3),
`plans.service.ts`, `auth/clerk-auth.guard.ts` (x2). There's no single place to
find or edit this text, and no consistency guarantee across domains.

Separately, the global `ApiExceptionFilter` (`src/common/api-exception.filter.ts`)
already catches every exception and formats a `{ error: { code, message } }`
response, but for *unexpected* errors (anything that isn't one of our own
`HttpException` throws — e.g. a TypeORM/DB failure) it forwards the raw
`exception.message` to the client. That can leak internal details (DB
constraint text, driver errors, etc.) to API consumers.

Note: this is *not* a "missing try/catch" problem. Only 2 files in the codebase
use `try/catch` today, and both are deliberate (best-effort Clerk session
revoke on logout; wrapping Clerk token verification into a generic
`UnauthorizedException`). Every other thrown error already propagates
correctly to the global filter — that's the intended NestJS pattern. Adding
`try/catch` to every service method would just be boilerplate that re-throws
the same error.

## Scope

Backend only (`music-app-backend`). The frontend (`music-app`) has its own
scattered fallback strings but is explicitly out of scope for this change.

No test framework exists in this project (no Jest, no `.spec.ts` files) and
none is being introduced here. Verification is `nest build` (tsc) passing
cleanly plus manual review of the diff.

## Design

### 1. `src/constants/messages/` — one file per existing domain folder

```
src/constants/messages/
  index.ts                 // barrel: re-exports every domain object
  common.messages.ts        // CommonMessages: cross-cutting (e.g. unexpectedError)
  auth.messages.ts          // AuthMessages
  checkout.messages.ts      // CheckoutMessages
  plans.messages.ts         // PlansMessages
  podcasts.messages.ts      // PodcastsMessages
  search.messages.ts        // SearchMessages
  subscriptions.messages.ts // SubscriptionsMessages
  users.messages.ts         // UsersMessages
```

Each file exports a single `const <Domain>Messages = { ... }` object.
Messages that are plain text stay string properties; messages that currently
interpolate a variable become small arrow-function properties, e.g.:

```ts
// checkout.messages.ts
export const CheckoutMessages = {
  orderAlreadyStatus: (status: string) => `Order is already "${status}"`,
  orderNotFound: (orderId: string) => `Order "${orderId}" not found`,
  paymentVerificationFailed: 'Payment verification failed',
};
```

`index.ts` re-exports all of them so call sites can do
`import { CheckoutMessages } from '@/constants/messages'` (or the project's
existing relative-import convention — this codebase doesn't use path aliases
in `src/`, so plain relative imports will be used, matching existing files).

### Message inventory (existing string → new home)

| File:line | Current string | New home |
|---|---|---|
| `subscriptions.service.ts:39` | `'No active subscription to cancel'` | `SubscriptionsMessages.noActiveSubscription` |
| `podcasts.service.ts:111` | `` `Podcast "${id}" not found` `` | `PodcastsMessages.podcastNotFound(id)` |
| `podcasts.service.ts:120` | `` `Episode "${episodeId}" not found on podcast "${podcastId}"` `` | `PodcastsMessages.episodeNotFound(episodeId, podcastId)` |
| `users.service.ts:33` | `'User not found'` | `UsersMessages.userNotFound` |
| `search.controller.ts:25` | `'q is required'` | `SearchMessages.queryRequired` |
| `checkout.service.ts:98` | `` `Order is already "${order.status}"` `` | `CheckoutMessages.orderAlreadyStatus(order.status)` |
| `checkout.service.ts:105` | `'Payment verification failed'` | `CheckoutMessages.paymentVerificationFailed` |
| `checkout.service.ts:160` | `` `Order "${orderId}" not found` `` | `CheckoutMessages.orderNotFound(orderId)` |
| `plans.service.ts:70` | `` `Plan "${id}" not found` `` | `PlansMessages.planNotFound(id)` |
| `auth/clerk-auth.guard.ts:28` | `'Missing bearer token'` | `AuthMessages.missingBearerToken` |
| `auth/clerk-auth.guard.ts:44` | `'Invalid or expired token'` | `AuthMessages.invalidOrExpiredToken` |

`CommonMessages.unexpectedError` is new (used by the hardened filter below);
its text is the same `'Unexpected error'` the filter already defaults to.

### 2. Harden `ApiExceptionFilter`

Current behavior (`src/common/api-exception.filter.ts`):
- `HttpException` → message comes from the exception's own response body (safe, since we wrote it).
- Anything else → `message = exception.message` if it's an `Error`, else `'Unexpected error'`. **This leaks internal error text for real bugs.**

New behavior:
- `HttpException` branch: unchanged.
- Non-`HttpException` branch: always respond with `CommonMessages.unexpectedError`
  and status 500 (never forward `exception.message`). Log the real exception
  (message + stack) server-side via Nest's `Logger` before responding, so
  it's still debuggable from server logs.

### 3. Testing

No test framework exists in this repo. Verification is:
- `nest build` (tsc) succeeds with no type errors.
- Manual diff review confirming every one of the 11 inventory rows above was
  replaced with the corresponding messages-object call, and the filter change
  matches the described behavior.
