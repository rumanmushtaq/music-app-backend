---
name: redis-cache-read-through
description: Use when adding Redis caching to a NestJS service's read path in this repo, or when a service already reads from a TypeORM repository and needs its results cached.
---

# Redis Cache Read-Through

## Overview

This repo has one global cache helper, `RedisService` (`src/redis/redis.service.ts`), exported by
the `@Global()` `RedisModule` — inject it directly, no module import needed. It wraps `ioredis` and
**fails open**: any Redis error is logged and swallowed, falling through to an uncached read rather
than throwing. Never re-implement retry/fallback logic around it.

## When to Use

- A service method does a `repository.find()` / `repository.findOne()` (or similar) on every call.
- You're asked to "add Redis" / "add caching" to a service.

## Steps

1. **Inject `RedisService`** in the constructor: `private readonly redisService: RedisService`.

2. **Wrap the read** with `getOrSet<T>(key, ttlSeconds, factory)`:
   ```ts
   return this.redisService.getOrSet(MY_CACHE_KEY, MY_CACHE_TTL_SECONDS, () => this.repo.find());
   ```
   `getOrSet` returns the cached value if present, otherwise calls `factory`, caches the result for
   `ttlSeconds`, and returns it.

3. **Add the key and TTL to `src/constants/cache.ts`**, following the existing naming convention:
   - Static key: `export const LIBRARY_SONGS_CACHE_KEY = 'library:songs';`
   - Parameterized key: `export const podcastDetailCacheKey = (id: string) => \`podcasts:detail:${id}\`;`
   - TTL: `export const LIBRARY_CACHE_TTL_SECONDS = 60 * 60;` (an hour is the default across features;
     use 5 minutes for data that changes often, per `PROFILE_CACHE_TTL_SECONDS`).
   - **Reuse an existing key** if you're caching literally the same rows another feature already
     caches (e.g. a search feature reading the same `songs` table a library feature caches) — one
     cache entry, not two copies of the same data.

4. **Invalidate on writes.** After any mutation that changes cached rows, call
   `this.redisService.del(MY_CACHE_KEY)` (see `profile.service.ts`'s `updateProfile`). Use
   `delByPrefix(prefix)` when a write can affect multiple parameterized keys at once.

5. **Don't catch Redis errors yourself.** `getOrSet`/`get`/`set`/`del` never throw. Only wrap the
   surrounding method in try/catch for the underlying DB/logic errors (see
   `nestjs-service-error-handling`) — not for the cache call.

## Common Mistakes

- Wrapping `getOrSet` in its own try/catch "just in case" — it's redundant, `getOrSet` already fails
  open.
- Hardcoding the cache key string inline instead of adding it to `src/constants/cache.ts`.
- Forgetting invalidation on a write path, leaving stale cached reads for up to the full TTL.
- Creating a second cache key for data another feature already caches under a different key.
