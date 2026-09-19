---
name: nestjs-service-error-handling
description: Use when a NestJS service method in this repo needs try/catch error handling and logging, or when a new/edited service is missing the standard toHttpException pattern used elsewhere.
---

# NestJS Service Error Handling (try/catch + toHttpException)

## Overview

The read-heavy services in this repo (`library.service.ts`, `home.service.ts`, `profile.service.ts`,
`search.service.ts`) follow the same shape: a `Logger`, try/catch around each public method, and a
private `toHttpException` helper that turns unexpected errors into a logged 500 while letting
intentional `HttpException`s (like `NotFoundException`) pass through untouched. This is the pattern
to add to a service that doesn't have it yet.

A global `ApiExceptionFilter` (`src/common/api-exception.filter.ts`, registered in `main.ts`) is the
backstop: it shapes every response into `{ error: { code, message } }` and blocks non-`HttpException`
errors from leaking internals to the client. It does **not** replace per-service `toHttpException` —
the filter has no idea *which operation* failed, so the service-level catch is what attaches that
context to the log line.

Note `music-languages.service.ts` does **not** follow this shape (no `Logger`, no `toHttpException`,
no try/catch on most methods) — don't copy it as a reference for this skill. It's only relevant to
step 4 below, for its `isUniqueViolation` usage.

## When to Use

- Writing or editing a service method that touches the DB, cache, or an external call.
- A service is missing try/catch, throws raw errors, or uses inline string messages.

## Steps

1. **Add a logger**: `private readonly logger = new Logger(XService.name);`

2. **Add the helper** (copy-pasted per service in this repo — not a shared base class):
   ```ts
   private toHttpException(error: unknown, context: string): HttpException {
     if (error instanceof HttpException) {
       return error;
     }
     this.logger.error(context, error instanceof Error ? error.stack : error);
     return new InternalServerErrorException(CommonMessages.unexpectedError);
   }
   ```

3. **Wrap every public method body**:
   ```ts
   async getSongs(): Promise<Song[]> {
     try {
       return await this.repo.find();
     } catch (error) {
       throw this.toHttpException(error, XMessages.loadSongsFailed);
     }
   }
   ```

4. **Throw specific exceptions directly for expected cases** inside the same try block —
   `toHttpException` passes any `HttpException` through unchanged, so `NotFoundException` /
   `ConflictException` reach the client as-is instead of becoming a generic 500:
   ```ts
   const row = await this.repo.findOne({ where: { id } });
   if (!row) {
     throw new NotFoundException(XMessages.xNotFound(id));
   }
   ```
   For Postgres unique-constraint violations, check `isUniqueViolation(error)` from
   `src/common/db-errors.util.ts` before deciding it's a `ConflictException` vs. an unexpected error.

5. **Add messages to `src/constants/message.ts`**, not inline strings — one exported const object
   per feature (`XMessages`), following the existing pattern (`CommonMessages.notFound(entity, id)`
   for not-found messages, plain strings or functions for the rest).

## Common Mistakes

- Wrapping a `throw new NotFoundException(...)` through `toHttpException` incorrectly — it's fine as
  long as `toHttpException`'s `instanceof HttpException` check comes first (it already does in the
  snippet above); don't remove that check.
- Logging the raw `error` object instead of `error.stack` — always prefer the stack when it's an
  `Error` instance.
- Inline string literals instead of a `*Messages` constant — breaks the "centralize messages"
  convention and makes messages harder to find/reuse.
