---
name: migrating-static-data-to-db-seeded-entity
description: Use when a NestJS service in this repo returns hardcoded/static in-memory arrays and needs to read from Postgres via TypeORM instead, with the existing dummy data pushed into the database as seed rows.
---

# Migrating Static Data to a DB-Seeded Entity

## Overview

This repo has no migrations folder or seed CLI. The convention (see the idempotent
find-or-create loop in `music-languages.service.ts`'s `onModuleInit`, and `search.service.ts` for the
fuller version with error handling) is: define a TypeORM entity, then seed it idempotently from
`OnModuleInit` using the data that used to be a static array. Note `music-languages.service.ts`
itself doesn't wrap its seed loop in try/catch — that's a gap, not something to copy; always add the
try/catch from step 4 below regardless.

## When to Use

- A service file has a `const someArray = [...]` at module scope that it filters/returns directly,
  where each entry is a row-like record with a stable `id` (not a small cosmetic lookup table, like a
  gradient palette cycled by index — that isn't "data" in this sense and doesn't need an entity).
- You're asked to "get this from the database" / "push dummy data into the DB" for a service.
- Check `src/library/*.entity.ts` and other feature entities first — reuse an existing entity/table
  if the static data is the same domain concept (songs, artists, playlists) another feature already
  persists, instead of creating a duplicate table.

## Steps

1. **Define the entity** in the owning feature folder, one file per entity:
   ```ts
   import { Column, Entity, PrimaryColumn } from 'typeorm';

   @Entity('mood_cards')
   export class MoodCard {
     @PrimaryColumn()
     id!: string;

     @Column()
     label!: string;

     @Column({ type: 'varchar', nullable: true })
     artworkUrl!: string | null;
   }
   ```
   Field → column mapping used throughout this repo:
   | Static field type | Column decorator |
   |---|---|
   | `string` id | `@PrimaryColumn()` |
   | `string` / `number` | `@Column()` / `@Column({ type: 'int' })` |
   | `string[]` | `@Column('simple-json')` |
   | `string \| null` (optional url) | `@Column({ type: 'varchar', nullable: true })` |

2. **Register the entity** in two places or it silently won't exist as a table / won't be injectable:
   - Add it to the `entities: [...]` array in `src/config/database.config.ts` (drives `synchronize`).
   - Add `TypeOrmModule.forFeature([YourEntity])` to the feature module's `imports`.

3. **Inject the repository** in the service constructor: `@InjectRepository(YourEntity) private readonly x: Repository<YourEntity>`.

4. **Move the seed rows out of the service file into `src/constants/<feature>-seed-data.ts`**,
   exported as `<FEATURE>_SEED_<ENTITY>` (see `src/constants/search-seed-data.ts` /
   `SEARCH_SEED_SONGS` etc.) — the service file should hold logic, not data literals. Import the
   arrays into the service from there.

5. **Seed idempotently in `OnModuleInit`** — implement `OnModuleInit` on the service, loop the
   imported seed rows, and only insert what's missing:
   ```ts
   async onModuleInit(): Promise<void> {
     try {
       for (const row of FEATURE_SEED_ROWS) {
         const existing = await this.repo.findOne({ where: { id: row.id } });
         if (!existing) {
           await this.repo.save(this.repo.create(row));
         }
       }
     } catch (error) {
       this.logger.error('Failed to seed X', error instanceof Error ? error.stack : error);
     }
   }
   ```
   Catch and log, don't rethrow — a seed failure at boot must not crash the app.

6. **Replace reads** with `repository.find()` (add caching per `redis-cache-read-through`; wrap the
   public method in try/catch per `nestjs-service-error-handling`). Keep any in-memory
   filter/pagination logic from the original code if it isn't trivial to express in SQL.

## Common Mistakes

- Adding `TypeOrmModule.forFeature` but forgetting `database.config.ts` — DI works, but the table
  never gets created under `synchronize`.
- Creating a new entity/table when an existing one (e.g. `src/library/song.entity.ts`) already
  covers the same rows — check for an existing entity first; add missing columns to it instead.
- Seeding on every request instead of `OnModuleInit` — seeding must run once at boot, not per call.
- Leaving the seed data as literals inside the service file instead of moving it to
  `src/constants/<feature>-seed-data.ts` — keep the service file logic-only.
