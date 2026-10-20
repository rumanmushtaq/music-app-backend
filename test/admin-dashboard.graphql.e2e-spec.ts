import 'reflect-metadata';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AdminDashboardModule } from '../src/admin-dashboard/admin-dashboard.module';
import { ClerkAuthGuard } from '../src/auth/clerk-auth.guard';
import { requestFromContext } from '../src/auth/request-from-context';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { buildGraphqlConfig } from '../src/config/graphql.config';
import { Artist } from '../src/library/artist.entity';
import { Song } from '../src/library/song.entity';
import { MusicLanguage } from '../src/music-languages/music-language.entity';
import { Order } from '../src/orders/order.entity';
import { PlayEvent } from '../src/plays/play-event.entity';
import { RedisModule } from '../src/redis/redis.module';
import { RedisService } from '../src/redis/redis.service';
import { User } from '../src/users/user.entity';
import { UsersModule } from '../src/users/users.module';

// Same disposable-database rule as admin-dashboard.e2e-spec.ts: the schema is dropped on every run.
const DATABASE_URL = process.env.TEST_DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL must point at a disposable Postgres database to run the e2e tests');
}

// Identifies the caller with a header instead of calling Clerk. Reads the request through
// requestFromContext, because in a resolver switchToHttp() has no request.
const fakeClerkGuard = {
  canActivate(context: ExecutionContext) {
    const req = requestFromContext(context);
    const clerkId = req.headers['x-test-clerk-id'] as string | undefined;
    if (!clerkId) {
      throw new UnauthorizedException('Missing bearer token');
    }
    req.auth = { userId: clerkId, email: `${clerkId}@example.com` };
    return true;
  },
};

const fakeRedis = {
  getOrSet: jest.fn(async (_key: string, _ttl: number, factory: () => unknown) => factory()),
  get: jest.fn(async () => null),
  set: jest.fn(async () => undefined),
  del: jest.fn(async () => undefined),
  delByPrefix: jest.fn(async () => undefined),
  incrWithExpiry: jest.fn(async () => 0),
  ping: jest.fn(async () => true),
};

const ADMIN = 'clerk_admin';
const LISTENER = 'clerk_listener';

// Same selection the Angular admin sends on page load.
const ADMIN_DASHBOARD = `
  query AdminDashboard($period: ActivityPeriod!) {
    stats: dashboardStats { key title value rawValue change changeType comparisonText trend }
    activity: dashboardActivity(period: $period) { period subtitle points { label plays } }
    activeDays { day value }
    activeHours { hour value }
    retention { rate returning newListeners totalListeners }
    topSongs(limit: 5) { id title artist plays playCount change accent }
    topArtists(limit: 5) { id name songs plays playCount accent }
    contentOverview { songs { label value tone } artists { label value tone } }
    recentActivity(limit: 10) { id type title description time createdAt }
    alerts: platformAlerts { id level title description }
    languages { label value count }
  }
`;

describe('Admin dashboard GraphQL (e2e)', () => {
  let app: INestApplication;

  const gql = (query: string, clerkId?: string, variables?: Record<string, unknown>) => {
    const req = request(app.getHttpServer()).post('/graphql').send({ query, variables });
    return clerkId ? req.set('x-test-clerk-id', clerkId) : req;
  };

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
        GraphQLModule.forRoot<ApolloDriverConfig>(buildGraphqlConfig()),
        RedisModule,
        UsersModule,
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

    const users = app.get(DataSource).getRepository(User);
    await users.save([
      users.create({ clerkId: ADMIN, email: 'admin@example.com', name: 'Admin', role: 'admin' }),
      users.create({ clerkId: LISTENER, email: 'listener@example.com', role: 'user' }),
    ]);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects a caller with no token as UNAUTHENTICATED', async () => {
    const res = await gql('{ dashboardStats { key } }');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a non-admin as FORBIDDEN', async () => {
    const res = await gql('{ dashboardStats { key } }', LISTENER);
    expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
    expect(res.body.errors[0].message).toBe('Admin access required');
  });

  it('does not send stack traces or internal error details to the client', async () => {
    const res = await gql('{ dashboardStats { key } }', LISTENER);
    const extensions = res.body.errors[0].extensions;
    expect(extensions.stacktrace).toBeUndefined();
    expect(extensions.originalError).toBeUndefined();
  });

  it('returns the four headline stats for an admin', async () => {
    const res = await gql('{ dashboardStats { key } }', ADMIN);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.dashboardStats.map((s: { key: string }) => s.key)).toEqual(['users', 'songs', 'artists', 'plays']);
  });

  it('answers the full AdminDashboard query with no errors', async () => {
    const res = await gql(ADMIN_DASHBOARD, ADMIN, { period: 'THIRTY_DAYS' });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.activity.period).toBe('THIRTY_DAYS');
    expect(res.body.data.activity.points).toHaveLength(30);
    expect(res.body.data.activeDays).toHaveLength(7);
  });

  it('returns the same retention as REST', async () => {
    const [graphql, rest] = await Promise.all([
      gql('{ retention { rate returning newListeners totalListeners } }', ADMIN),
      request(app.getHttpServer()).get('/admin/dashboard/retention').set('x-test-clerk-id', ADMIN),
    ]);
    expect(rest.status).toBe(200);
    expect(graphql.body.data.retention).toEqual(rest.body);
  });

  it('rejects topSongs(limit: 51) as BAD_REQUEST', async () => {
    const res = await gql('{ topSongs(limit: 51) { id } }', ADMIN);
    expect(res.body.errors[0].extensions.code).toBe('BAD_REQUEST');
    expect(res.body.errors[0].message).toBe('limit must be an integer between 1 and 50');
  });
});
