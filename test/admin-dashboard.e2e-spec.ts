import 'reflect-metadata';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AdminDashboardModule } from '../src/admin-dashboard/admin-dashboard.module';
import { DASHBOARD_WINDOW_DAYS } from '../src/admin-dashboard/admin-dashboard.service';
import { DAY_MS, dayKey, startOfUtcDay, startOfUtcMonth } from '../src/admin-dashboard/admin-dashboard.util';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { Artist } from '../src/library/artist.entity';
import { Song } from '../src/library/song.entity';
import { MusicLanguage } from '../src/music-languages/music-language.entity';
import { Order } from '../src/orders/order.entity';
import { PlayEvent } from '../src/plays/play-event.entity';
import { PlaysModule } from '../src/plays/plays.module';
import { RedisModule } from '../src/redis/redis.module';
import { RedisService } from '../src/redis/redis.service';
import { User } from '../src/users/user.entity';
import { UsersModule } from '../src/users/users.module';

// Runs against a real, disposable Postgres database (the dashboard relies on Postgres-only
// SQL such as FILTER, jsonb containment and AT TIME ZONE). The schema is dropped and
// recreated on every run, so never point this at a database you care about.
const DATABASE_URL = process.env.TEST_DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL must point at a disposable Postgres database to run the e2e tests');
}

// The real Clerk guard calls Clerk's API; tests identify the caller with a header instead.
const fakeClerkGuard = {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const clerkId = req.headers['x-test-clerk-id'];
    if (!clerkId) {
      throw new UnauthorizedException('Missing bearer token');
    }
    req.auth = { userId: clerkId, email: `${clerkId}@example.com` };
    return true;
  },
};

// Pass-through cache: every call hits the database, so assertions see fresh data.
const cacheHealth = { healthy: true };
const fakeRedis = {
  getOrSet: jest.fn(async (_key: string, _ttl: number, factory: () => unknown) => factory()),
  get: jest.fn(async () => null),
  set: jest.fn(async () => undefined),
  del: jest.fn(async () => undefined),
  delByPrefix: jest.fn(async () => undefined),
  incrWithExpiry: jest.fn(async () => 0),
  ping: jest.fn(async (): Promise<boolean> => cacheHealth.healthy),
};

const ADMIN = 'clerk_admin';
const SUPER_ADMIN = 'clerk_super';
const LISTENER = 'clerk_listener';

describe('Admin dashboard API (e2e)', () => {
  let app: INestApplication;
  let db: DataSource;
  const now = Date.now();
  const ago = (days: number, extraMs = 0) => new Date(now - days * DAY_MS - extraMs);

  const asAdmin = (path: string) => request(app.getHttpServer()).get(path).set('x-test-clerk-id', ADMIN);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: DATABASE_URL,
          entities: [User, Song, Artist, Order, PlayEvent, MusicLanguage],
          synchronize: true,
          dropSchema: true,
        }),
        RedisModule,
        UsersModule,
        PlaysModule,
        AdminDashboardModule,
      ],
    })
      .overrideProvider(RedisService)
      .useValue(fakeRedis)
      .overrideGuard(ClerkAuthGuard)
      .useValue(fakeClerkGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    db = app.get(DataSource);

    const users = db.getRepository(User);
    await users.save([
      users.create({ clerkId: ADMIN, email: 'admin@example.com', name: 'Admin', role: 'admin' }),
      users.create({ clerkId: SUPER_ADMIN, email: 'super@example.com', role: 'superAdmin' }),
      users.create({ clerkId: LISTENER, email: 'listener@example.com', role: 'user' }),
    ]);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('auth', () => {
    const endpoints = [
      '/admin/dashboard/stats',
      '/admin/dashboard/activity?period=12M',
      '/admin/dashboard/active-days',
      '/admin/dashboard/active-hours',
      '/admin/dashboard/retention',
      '/admin/dashboard/top-songs?limit=5',
      '/admin/dashboard/top-artists?limit=5',
      '/admin/dashboard/content-overview',
      '/admin/dashboard/recent-activity?limit=10',
      '/admin/dashboard/alerts',
      '/admin/dashboard/languages',
    ];

    it.each(endpoints)('%s rejects unauthenticated callers with 401', async (path) => {
      const res = await request(app.getHttpServer()).get(path);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UnauthorizedException');
    });

    it.each(endpoints)('%s rejects non-admin users with 403', async (path) => {
      const res = await request(app.getHttpServer()).get(path).set('x-test-clerk-id', LISTENER);
      expect(res.status).toBe(403);
      expect(res.body.error).toEqual({ code: 'ForbiddenException', message: 'Admin access required' });
    });

    it.each(endpoints)('%s allows admins', async (path) => {
      const res = await asAdmin(path);
      expect(res.status).toBe(200);
    });

    it('allows superAdmins', async () => {
      const res = await request(app.getHttpServer()).get('/admin/dashboard/stats').set('x-test-clerk-id', SUPER_ADMIN);
      expect(res.status).toBe(200);
    });

    it('rejects a caller with no local user row with 404', async () => {
      const res = await request(app.getHttpServer()).get('/admin/dashboard/stats').set('x-test-clerk-id', 'clerk_ghost');
      expect(res.status).toBe(404);
    });
  });

  describe('empty catalog', () => {
    it('stats report zero plays/songs/artists', async () => {
      const res = await asAdmin('/admin/dashboard/stats');
      const byKey = Object.fromEntries(res.body.map((stat: { key: string }) => [stat.key, stat]));
      expect(Object.keys(byKey)).toEqual(['users', 'songs', 'artists', 'plays']);
      expect(byKey.users.rawValue).toBe(3);
      expect(byKey.songs).toMatchObject({ value: '0', rawValue: 0, change: 0, changeType: 'up' });
      expect(byKey.plays).toMatchObject({ value: '0', rawValue: 0, change: 0 });
      expect(byKey.plays.trend).toEqual(new Array(10).fill(0));
    });

    it('list endpoints return empty arrays and zeroed charts', async () => {
      expect((await asAdmin('/admin/dashboard/top-songs')).body).toEqual([]);
      expect((await asAdmin('/admin/dashboard/top-artists')).body).toEqual([]);
      expect((await asAdmin('/admin/dashboard/languages')).body).toEqual([]);
      expect((await asAdmin('/admin/dashboard/retention')).body).toEqual({
        rate: 0,
        returning: 0,
        newListeners: 0,
        totalListeners: 0,
      });
      const days = (await asAdmin('/admin/dashboard/active-days')).body;
      expect(days.map((d: { day: string }) => d.day)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      expect(days.every((d: { value: number }) => d.value === 0)).toBe(true);
    });

    it('alerts report a healthy system', async () => {
      const res = await asAdmin('/admin/dashboard/alerts');
      expect(res.body).toEqual([
        {
          id: 'system-ok',
          level: 'info',
          title: 'No system issues detected',
          description: 'Database and cache are operational',
        },
      ]);
    });
  });

  describe('with data', () => {
    // Plays inside the 30-day window: alpha x4 (listener-1 x3, listener-2 x1), beta x1.
    // Plays in the previous window (30-60 days ago): alpha x1 (listener-1), beta x1 (listener-3).
    const windowPlays = [
      { user: 'l1', song: 'alpha', at: ago(1) },
      { user: 'l1', song: 'alpha', at: ago(1, 60_000) },
      { user: 'l1', song: 'alpha', at: ago(1, 120_000) },
      { user: 'l1', song: 'beta', at: ago(2) },
      { user: 'l2', song: 'alpha', at: ago(5) },
    ];
    const olderPlays = [
      { user: 'l1', song: 'alpha', at: ago(40) },
      { user: 'l3', song: 'beta', at: ago(45) },
    ];

    beforeAll(async () => {
      const languages = db.getRepository(MusicLanguage);
      const langs = await languages.save(
        ['English', 'Urdu', 'Hindi', 'Punjabi', 'Pashto', 'Sindhi'].map((name) => languages.create({ name })),
      );
      const langId = (name: string) => langs.find((lang) => lang.name === name)!.id;

      const users = db.getRepository(User);
      const listenerLangs = ['English', 'English', 'English', 'English', 'Urdu', 'Urdu', 'Hindi', 'Pashto', 'Punjabi', 'Sindhi'];
      const listeners = await users.save(
        listenerLangs.map((lang, index) =>
          users.create({ clerkId: `clerk_l${index + 1}`, email: `listener${index + 1}@example.com`, musicLanguageId: langId(lang) }),
        ),
      );
      const userId = (alias: string) => listeners[Number(alias.slice(1)) - 1].id;
      // Two listeners signed up before the window, so the users stat has a baseline to compare with.
      await db.query(`UPDATE users SET "createdAt" = $1 WHERE "clerkId" IN ('clerk_l9', 'clerk_l10')`, [ago(60)]);

      const songs = db.getRepository(Song);
      await songs.save([
        { id: 'alpha', title: 'Alpha', artistNames: ['Artist A'], artworkUrl: null, durationSeconds: 200, viewsCount: 0 },
        { id: 'beta', title: 'Beta', artistNames: ['Artist A', 'Artist B'], artworkUrl: null, durationSeconds: 200, viewsCount: 0 },
        { id: 'gamma', title: 'Gamma', artistNames: ['Artist C'], artworkUrl: null, durationSeconds: 200, viewsCount: 0, status: 'pending' },
        { id: 'delta', title: 'Delta', artistNames: ['Artist C'], artworkUrl: null, durationSeconds: 200, viewsCount: 0, status: 'draft' },
        { id: 'omega', title: 'Omega', artistNames: ['Artist D'], artworkUrl: null, durationSeconds: 200, viewsCount: 0, status: 'rejected' },
      ]);
      await db.query(`UPDATE songs SET "createdAt" = $1`, [ago(90)]);
      await db.query(`UPDATE songs SET "createdAt" = $1 WHERE id = 'omega'`, [new Date(now - 30_000)]);

      const artists = db.getRepository(Artist);
      await artists.save([
        { id: 'artist-a', name: 'Artist A', avatarUrl: null, followersCount: 0 },
        { id: 'artist-b', name: 'Artist B', avatarUrl: null, followersCount: 0 },
        { id: 'artist-c', name: 'Artist C', avatarUrl: null, followersCount: 0, status: 'pending' },
        { id: 'artist-d', name: 'Artist D', avatarUrl: null, followersCount: 0, status: 'blocked' },
      ]);
      await db.query(`UPDATE artists SET "createdAt" = $1`, [ago(90)]);

      for (const play of [...windowPlays, ...olderPlays]) {
        await db.query(`INSERT INTO play_events ("userId", "songId", "playedAt") VALUES ($1, $2, $3)`, [
          userId(play.user),
          play.song,
          play.at,
        ]);
      }

      const orders = db.getRepository(Order);
      const order = (status: Order['status']) => ({
        userId: listeners[0].id,
        planId: 'pro',
        countryCode: null,
        stateCode: null,
        basePrice: '9.99',
        discountAmount: '0',
        taxAmount: null,
        taxLabel: null,
        subtotal: '9.99',
        paymentAccountEmailMasked: null,
        paidAt: null,
        status,
      });
      const [, oldFailed] = await orders.save([order('failed'), order('failed'), order('paid')]);
      await db.query(`UPDATE orders SET "createdAt" = $1 WHERE id = $2`, [ago(3), oldFailed.id]);
    });

    it('GET /stats returns totals, changes and trends', async () => {
      const res = await asAdmin('/admin/dashboard/stats');
      expect(res.status).toBe(200);
      const byKey = Object.fromEntries(res.body.map((stat: { key: string }) => [stat.key, stat]));

      // 13 users now, 2 of them existed 30 days ago -> +550%.
      expect(byKey.users).toMatchObject({ title: 'Total Users', value: '13', rawValue: 13, change: 550, changeType: 'up' });
      expect(byKey.users.trend).toHaveLength(10);
      expect(byKey.users.trend[9]).toBe(13);

      // All songs/artists predate the window except omega (30s old): 5 vs 4 -> +25%.
      expect(byKey.songs).toMatchObject({ value: '5', rawValue: 5, change: 25, changeType: 'up' });
      expect(byKey.artists).toMatchObject({ value: '4', rawValue: 4, change: 0, changeType: 'up' });

      // 7 plays total; 5 in the window vs 2 in the previous one -> +150%.
      expect(byKey.plays).toMatchObject({ value: '7', rawValue: 7, change: 150, changeType: 'up' });
      expect(byKey.plays.trend.reduce((a: number, b: number) => a + b, 0)).toBe(7);
      expect(byKey.plays.comparisonText).toBe(`vs previous ${DASHBOARD_WINDOW_DAYS} days`);
    });

    it.each([
      ['12M', 12, 7, 'Total plays over last 12 months'],
      ['6M', 6, 7, 'Total plays over last 6 months'],
      ['30D', 30, 5, 'Total plays over last 30 days'],
    ])('GET /activity?period=%s returns %d points', async (period, length, total, subtitle) => {
      const res = await asAdmin(`/admin/dashboard/activity?period=${period}`);
      expect(res.status).toBe(200);
      expect(res.body.period).toBe(period);
      expect(res.body.subtitle).toBe(subtitle);
      expect(res.body.points).toHaveLength(length);
      expect(res.body.points.reduce((sum: number, p: { plays: number }) => sum + p.plays, 0)).toBe(total);
    });

    it('GET /activity defaults to 12M and is case-insensitive', async () => {
      expect((await asAdmin('/admin/dashboard/activity')).body.period).toBe('12M');
      expect((await asAdmin('/admin/dashboard/activity?period=30d')).body.period).toBe('30D');
    });

    it('GET /activity?period=30D puts plays on the right days', async () => {
      const res = await asAdmin('/admin/dashboard/activity?period=30D');
      const points: { label: string; plays: number }[] = res.body.points;
      const dayIndex = (date: Date) =>
        Math.round((startOfUtcDay(date).getTime() - startOfUtcDay(new Date(now), 29).getTime()) / DAY_MS);
      const expected = new Array(30).fill(0);
      windowPlays.forEach((play) => (expected[dayIndex(play.at)] += 1));
      expect(points.map((p) => p.plays)).toEqual(expected);
    });

    it('GET /activity rejects an unknown period', async () => {
      const res = await asAdmin('/admin/dashboard/activity?period=7D');
      expect(res.status).toBe(400);
      expect(res.body.error).toEqual({ code: 'BadRequestException', message: 'period must be one of: 12M, 6M, 30D' });
    });

    it('GET /active-days counts window plays per UTC weekday', async () => {
      const res = await asAdmin('/admin/dashboard/active-days');
      const expected: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      windowPlays.forEach((play) => (expected[names[play.at.getUTCDay()]] += 1));
      expect(res.body).toEqual(Object.entries(expected).map(([day, value]) => ({ day, value })));
    });

    it('GET /active-hours counts window plays per 2-hour UTC slot', async () => {
      const res = await asAdmin('/admin/dashboard/active-hours');
      expect(res.body).toHaveLength(12);
      expect(res.body[0].hour).toBe('12AM');
      expect(res.body[11].hour).toBe('10PM');
      const expected = new Array(12).fill(0);
      windowPlays.forEach((play) => (expected[Math.floor(play.at.getUTCHours() / 2)] += 1));
      expect(res.body.map((slot: { value: number }) => slot.value)).toEqual(expected);
    });

    it('GET /retention splits listeners into returning and new', async () => {
      // l1 played before the window (returning), l2 first played inside it (new), l3 didn't play in it.
      const res = await asAdmin('/admin/dashboard/retention');
      expect(res.body).toEqual({ rate: 50, returning: 1, newListeners: 1, totalListeners: 2 });
    });

    it('GET /top-songs ranks by window plays with change vs the previous window', async () => {
      const res = await asAdmin('/admin/dashboard/top-songs?limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { id: 'alpha', title: 'Alpha', artist: 'Artist A', plays: '4', playCount: 4, change: 300, accent: expect.any(String) },
        { id: 'beta', title: 'Beta', artist: 'Artist A, Artist B', plays: '1', playCount: 1, change: 0, accent: expect.any(String) },
      ]);
      expect(res.body[0].accent).not.toBe(res.body[1].accent);
    });

    it('GET /top-songs honours limit', async () => {
      const res = await asAdmin('/admin/dashboard/top-songs?limit=1');
      expect(res.body.map((song: { id: string }) => song.id)).toEqual(['alpha']);
    });

    it('GET /top-artists aggregates plays across every song an artist appears on', async () => {
      const res = await asAdmin('/admin/dashboard/top-artists?limit=5');
      expect(res.body).toEqual([
        { id: 'artist-a', name: 'Artist A', songs: 2, plays: '5', playCount: 5, accent: expect.any(String) },
        { id: 'artist-b', name: 'Artist B', songs: 1, plays: '1', playCount: 1, accent: expect.any(String) },
      ]);
    });

    it.each(['0', '51', 'abc', '1.5'])('top-songs/top-artists/recent-activity reject limit=%s', async (limit) => {
      for (const path of ['top-songs', 'top-artists', 'recent-activity']) {
        const res = await asAdmin(`/admin/dashboard/${path}?limit=${limit}`);
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe('limit must be an integer between 1 and 50');
      }
    });

    it('GET /content-overview counts songs and artists by status', async () => {
      const res = await asAdmin('/admin/dashboard/content-overview');
      expect(res.body).toEqual({
        songs: [
          { label: 'Published', value: 2, tone: 'green' },
          { label: 'Pending', value: 1, tone: 'orange' },
          { label: 'Draft', value: 1, tone: 'gray' },
          { label: 'Rejected', value: 1, tone: 'red' },
        ],
        artists: [
          { label: 'Verified', value: 2, tone: 'blue' },
          { label: 'Pending', value: 1, tone: 'orange' },
          { label: 'Rejected', value: 0, tone: 'red' },
          { label: 'Blocked', value: 1, tone: 'gray' },
        ],
      });
    });

    it('GET /recent-activity merges newest users, songs and artists', async () => {
      const res = await asAdmin('/admin/dashboard/recent-activity?limit=10');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(10);
      const times = res.body.map((item: { createdAt: string }) => Date.parse(item.createdAt));
      expect([...times].sort((a, b) => b - a)).toEqual(times);

      const omega = res.body.find((item: { id: string }) => item.id === 'song:omega');
      expect(omega).toMatchObject({ type: 'song', title: 'Song added', description: '"Omega" by Artist D', time: 'just now' });

      const userItem = res.body.find((item: { type: string }) => item.type === 'user');
      expect(userItem.title).toBe('New user registered');
      // Users without a name are shown by masked email, never the raw address.
      expect(userItem.description).toMatch(/^l\*\*\*\w{2}@example\.com joined$/);
      expect(JSON.stringify(res.body)).not.toMatch(/listener\d+@example\.com/);
    });

    it('GET /recent-activity defaults to 10 items and honours limit', async () => {
      expect((await asAdmin('/admin/dashboard/recent-activity')).body).toHaveLength(10);
      expect((await asAdmin('/admin/dashboard/recent-activity?limit=3')).body).toHaveLength(3);
    });

    it('GET /alerts flags pending content and recent failed payments', async () => {
      const res = await asAdmin('/admin/dashboard/alerts');
      expect(res.body).toEqual([
        { id: 'pending-songs', level: 'warning', title: '1 song waiting for approval', description: 'Review pending uploads' },
        {
          id: 'pending-artists',
          level: 'warning',
          title: '1 artist profile waiting for verification',
          description: 'Review artist verification requests',
        },
        {
          id: 'failed-payments',
          level: 'danger',
          title: '1 failed payment in the last 24 hours',
          description: 'Check checkout and payment provider status',
        },
      ]);
    });

    it('GET /alerts reports an unreachable cache', async () => {
      cacheHealth.healthy = false;
      try {
        const res = await asAdmin('/admin/dashboard/alerts');
        expect(res.body.map((alert: { id: string }) => alert.id)).toContain('cache-unavailable');
        expect(res.body.map((alert: { id: string }) => alert.id)).not.toContain('system-ok');
      } finally {
        cacheHealth.healthy = true;
      }
    });

    it('GET /languages shows the top 4 languages and folds the rest into Other', async () => {
      // 10 listeners: English 4, Urdu 2, then Hindi/Pashto/Punjabi/Sindhi 1 each (ties by name).
      const res = await asAdmin('/admin/dashboard/languages');
      expect(res.body).toEqual([
        { label: 'English', count: 4, value: 40 },
        { label: 'Urdu', count: 2, value: 20 },
        { label: 'Hindi', count: 1, value: 10 },
        { label: 'Pashto', count: 1, value: 10 },
        { label: 'Other', count: 2, value: 20 },
      ]);
    });

    it('caches each section under its own key for 60 seconds', async () => {
      fakeRedis.getOrSet.mockClear();
      await asAdmin('/admin/dashboard/top-songs?limit=3');
      await asAdmin('/admin/dashboard/activity?period=6M');
      expect(fakeRedis.getOrSet).toHaveBeenCalledWith('admin:dashboard:top-songs:3', 60, expect.any(Function));
      expect(fakeRedis.getOrSet).toHaveBeenCalledWith('admin:dashboard:activity:6M', 60, expect.any(Function));
    });
  });

  describe('POST /api/plays', () => {
    const post = (body: object, clerkId = LISTENER) =>
      request(app.getHttpServer()).post('/api/plays').set('x-test-clerk-id', clerkId).send(body);

    it('records a play for the caller and it shows up on the dashboard', async () => {
      const before = (await asAdmin('/admin/dashboard/top-songs')).body.find((s: { id: string }) => s.id === 'beta');

      const res = await post({ songId: 'beta' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ songId: 'beta', id: expect.any(String), playedAt: expect.any(String) });

      const after = (await asAdmin('/admin/dashboard/top-songs')).body.find((s: { id: string }) => s.id === 'beta');
      expect(after.playCount).toBe(before.playCount + 1);

      const [row] = await db.query(
        `SELECT u."clerkId" FROM play_events pe JOIN users u ON u.id::text = pe."userId" WHERE pe.id = $1`,
        [res.body.id],
      );
      expect(row.clerkId).toBe(LISTENER);
    });

    it('rejects an unknown song with 404', async () => {
      const res = await post({ songId: 'does-not-exist' });
      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Song "does-not-exist" not found');
    });

    it('rejects a missing songId with 400', async () => {
      expect((await post({})).status).toBe(400);
      expect((await post({ songId: '   ' })).status).toBe(400);
    });

    it('requires authentication', async () => {
      const res = await request(app.getHttpServer()).post('/api/plays').send({ songId: 'beta' });
      expect(res.status).toBe(401);
    });
  });

  it('day keys used above are UTC', () => {
    // Guards the TZ pin in test/setup-tz.ts that the users."createdAt" assertions rely on.
    expect(dayKey(new Date('2026-01-01T00:30:00Z'))).toBe('2026-01-01');
    expect(startOfUtcMonth(new Date('2026-01-01T00:30:00Z')).toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
