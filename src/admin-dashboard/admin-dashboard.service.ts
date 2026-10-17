import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { Song, SongStatus } from '../library/song.entity';
import { Artist, ArtistStatus } from '../library/artist.entity';
import { Order } from '../orders/order.entity';
import { RedisService } from '../redis/redis.service';
import { maskEmail } from '../common/mask-email.util';
import { ADMIN_DASHBOARD_CACHE_TTL_SECONDS, adminDashboardCacheKey } from '../constants/cache';
import { AdminDashboardMessages, CommonMessages } from '../constants/message';
import {
  ACTIVITY_PERIODS,
  ActiveDay,
  ActivityData,
  ActivityItem,
  ActivityPeriod,
  ContentOverview,
  DashboardStat,
  HourActivity,
  LanguageShare,
  PlatformAlert,
  Retention,
  StatusCount,
  StatusTone,
  TopArtist,
  TopSong,
} from './admin-dashboard.types';
import {
  ACCENTS,
  DAY_MS,
  changeSummary,
  dayBuckets,
  formatCompact,
  formatStatValue,
  hourLabel,
  monthBuckets,
  percentChange,
  relativeTime,
  round1,
  startOfUtcDay,
  startOfUtcMonth,
} from './admin-dashboard.util';

// Rolling window behind every "recent" metric (stat changes, active days/hours,
// retention, top songs/artists). Each one compares against the window before it.
export const DASHBOARD_WINDOW_DAYS = 30;
const TREND_POINTS = 10;
const LANGUAGE_SLICES = 4;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SONG_STATUSES: { status: SongStatus; label: string; tone: StatusTone }[] = [
  { status: 'published', label: 'Published', tone: 'green' },
  { status: 'pending', label: 'Pending', tone: 'orange' },
  { status: 'draft', label: 'Draft', tone: 'gray' },
  { status: 'rejected', label: 'Rejected', tone: 'red' },
];

const ARTIST_STATUSES: { status: ArtistStatus; label: string; tone: StatusTone }[] = [
  { status: 'verified', label: 'Verified', tone: 'blue' },
  { status: 'pending', label: 'Pending', tone: 'orange' },
  { status: 'rejected', label: 'Rejected', tone: 'red' },
  { status: 'blocked', label: 'Blocked', tone: 'gray' },
];

// users."createdAt" is a plain `timestamp`; the newer tables use `timestamptz`, which has
// to be shifted to UTC before date_trunc so month buckets line up with the JS-side keys.
type CreatedAtTable = { table: string; column: string; tz: boolean };
const USERS_TABLE: CreatedAtTable = { table: 'users', column: '"createdAt"', tz: false };
const SONGS_TABLE: CreatedAtTable = { table: 'songs', column: '"createdAt"', tz: true };
const ARTISTS_TABLE: CreatedAtTable = { table: 'artists', column: '"createdAt"', tz: true };

const utc = (column: string) => `(${column} AT TIME ZONE 'UTC')`;

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Song)
    private readonly songs: Repository<Song>,
    @InjectRepository(Artist)
    private readonly artists: Repository<Artist>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly redisService: RedisService,
  ) {}

  getStats(): Promise<DashboardStat[]> {
    return this.cached('stats', undefined, async () => {
      const now = new Date();
      const windowStart = new Date(now.getTime() - DASHBOARD_WINDOW_DAYS * DAY_MS);
      // Sequential on purpose, same as the seeders: parallel queries each grab a pool
      // connection, which is slow against a cold remote database.
      const users = await this.entityStat('users', 'Total Users', USERS_TABLE, now, windowStart);
      const songs = await this.entityStat('songs', 'Total Songs', SONGS_TABLE, now, windowStart);
      const artists = await this.entityStat('artists', 'Total Artists', ARTISTS_TABLE, now, windowStart);
      const plays = await this.playsStat(now, windowStart);
      return [users, songs, artists, plays];
    });
  }

  async getActivity(period: string | undefined): Promise<ActivityData> {
    const resolved = (period || '12M').toUpperCase();
    if (!(ACTIVITY_PERIODS as readonly string[]).includes(resolved)) {
      throw new BadRequestException(AdminDashboardMessages.invalidPeriod(ACTIVITY_PERIODS));
    }
    const activityPeriod = resolved as ActivityPeriod;

    return this.cached('activity', activityPeriod, async () => {
      const now = new Date();
      if (activityPeriod === '30D') {
        const buckets = dayBuckets(now, 30);
        const counts = await this.playsByBucket('YYYY-MM-DD', 'day', startOfUtcDay(now, 29));
        return {
          period: activityPeriod,
          subtitle: 'Total plays over last 30 days',
          points: buckets.map(({ key, label }) => ({ label, plays: counts.get(key) ?? 0 })),
        };
      }

      const months = activityPeriod === '12M' ? 12 : 6;
      const buckets = monthBuckets(now, months);
      const counts = await this.playsByBucket('YYYY-MM', 'month', startOfUtcMonth(now, months - 1));
      return {
        period: activityPeriod,
        subtitle: `Total plays over last ${months} months`,
        points: buckets.map(({ key, label }) => ({ label, plays: counts.get(key) ?? 0 })),
      };
    });
  }

  getActiveDays(): Promise<ActiveDay[]> {
    return this.cached('active-days', undefined, async () => {
      const rows: { dow: number; count: number }[] = await this.dataSource.query(
        `SELECT extract(isodow FROM ${utc('"playedAt"')})::int AS dow, count(*)::int AS count
           FROM play_events
          WHERE "playedAt" >= $1
          GROUP BY 1`,
        [this.windowStart()],
      );
      const byDow = new Map(rows.map((row) => [row.dow, row.count]));
      return WEEKDAYS.map((day, index) => ({ day, value: byDow.get(index + 1) ?? 0 }));
    });
  }

  getActiveHours(): Promise<HourActivity[]> {
    return this.cached('active-hours', undefined, async () => {
      const rows: { bucket: number; count: number }[] = await this.dataSource.query(
        `SELECT (floor(extract(hour FROM ${utc('"playedAt"')}) / 2) * 2)::int AS bucket, count(*)::int AS count
           FROM play_events
          WHERE "playedAt" >= $1
          GROUP BY 1`,
        [this.windowStart()],
      );
      const byBucket = new Map(rows.map((row) => [row.bucket, row.count]));
      return Array.from({ length: 12 }, (_, index) => ({
        hour: hourLabel(index * 2),
        value: byBucket.get(index * 2) ?? 0,
      }));
    });
  }

  getRetention(): Promise<Retention> {
    return this.cached('retention', undefined, async () => {
      // A listener is anyone who played something in the window; they're "new" when their
      // first play ever falls inside it, "returning" when they had played before it.
      const [row]: { total: number; fresh: number }[] = await this.dataSource.query(
        `WITH listeners AS (
           SELECT DISTINCT "userId" FROM play_events WHERE "playedAt" >= $1
         ), firsts AS (
           SELECT pe."userId", min(pe."playedAt") AS first_play
             FROM play_events pe
             JOIN listeners l ON l."userId" = pe."userId"
            GROUP BY pe."userId"
         )
         SELECT count(*)::int AS total, count(*) FILTER (WHERE first_play >= $1)::int AS fresh FROM firsts`,
        [this.windowStart()],
      );
      const total = row?.total ?? 0;
      const newListeners = row?.fresh ?? 0;
      const returning = total - newListeners;
      return {
        rate: total ? round1((returning / total) * 100) : 0,
        returning,
        newListeners,
        totalListeners: total,
      };
    });
  }

  getTopSongs(limit: number): Promise<TopSong[]> {
    return this.cached('top-songs', limit, async () => {
      const windowStart = this.windowStart();
      const previousStart = new Date(windowStart.getTime() - DASHBOARD_WINDOW_DAYS * DAY_MS);
      const rows: { id: string; title: string; artistNames: string; current: number; previous: number }[] =
        await this.dataSource.query(
          `SELECT s.id, s.title, s."artistNames",
                  count(*) FILTER (WHERE pe."playedAt" >= $1)::int AS current,
                  count(*) FILTER (WHERE pe."playedAt" < $1)::int AS previous
             FROM play_events pe
             JOIN songs s ON s.id = pe."songId"
            WHERE pe."playedAt" >= $2
            GROUP BY s.id, s.title, s."artistNames"
           HAVING count(*) FILTER (WHERE pe."playedAt" >= $1) > 0
            ORDER BY current DESC, s.title ASC
            LIMIT $3`,
          [windowStart, previousStart, limit],
        );
      return rows.map((row, index) => ({
        id: row.id,
        title: row.title,
        artist: parseArtistNames(row.artistNames).join(', '),
        plays: formatCompact(row.current),
        playCount: row.current,
        change: percentChange(row.current, row.previous),
        accent: ACCENTS[index % ACCENTS.length],
      }));
    });
  }

  getTopArtists(limit: number): Promise<TopArtist[]> {
    return this.cached('top-artists', limit, async () => {
      // songs keep artists as a JSON array of names (simple-json text), so artists are
      // matched to their songs by name membership in that array.
      const rows: { id: string; name: string; songs: number; plays: number }[] = await this.dataSource.query(
        `SELECT a.id, a.name, count(DISTINCT s.id)::int AS songs, count(pe.id)::int AS plays
           FROM artists a
           JOIN songs s ON s."artistNames"::jsonb @> jsonb_build_array(a.name)
           LEFT JOIN play_events pe ON pe."songId" = s.id AND pe."playedAt" >= $1
          GROUP BY a.id, a.name
         HAVING count(pe.id) > 0
          ORDER BY plays DESC, a.name ASC
          LIMIT $2`,
        [this.windowStart(), limit],
      );
      return rows.map((row, index) => ({
        id: row.id,
        name: row.name,
        songs: row.songs,
        plays: formatCompact(row.plays),
        playCount: row.plays,
        accent: ACCENTS[index % ACCENTS.length],
      }));
    });
  }

  getContentOverview(): Promise<ContentOverview> {
    return this.cached('content-overview', undefined, async () => {
      const songRows = await this.countByStatus('songs');
      const artistRows = await this.countByStatus('artists');
      return {
        songs: toStatusCounts(SONG_STATUSES, songRows),
        artists: toStatusCounts(ARTIST_STATUSES, artistRows),
      };
    });
  }

  getRecentActivity(limit: number): Promise<ActivityItem[]> {
    return this.cached('recent-activity', limit, async () => {
      const users = await this.users.find({ order: { createdAt: 'DESC' }, take: limit });
      const songs = await this.songs.find({ order: { createdAt: 'DESC' }, take: limit });
      const artists = await this.artists.find({ order: { createdAt: 'DESC' }, take: limit });

      const items: (Omit<ActivityItem, 'time' | 'createdAt'> & { at: Date })[] = [
        ...users.map((user) => ({
          id: `user:${user.id}`,
          type: 'user' as const,
          title: 'New user registered',
          description: `${user.name?.trim() || maskEmail(user.email)} joined`,
          at: user.createdAt,
        })),
        ...songs.map((song) => ({
          id: `song:${song.id}`,
          type: 'song' as const,
          title: 'Song added',
          description: `"${song.title}" by ${song.artistNames.join(', ')}`,
          at: song.createdAt,
        })),
        ...artists.map((artist) => ({
          id: `artist:${artist.id}`,
          type: 'artist' as const,
          title: 'Artist added',
          description: `${artist.name} was added`,
          at: artist.createdAt,
        })),
      ];

      const now = new Date();
      return items
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, limit)
        .map(({ at, ...item }) => ({ ...item, time: relativeTime(at, now), createdAt: at.toISOString() }));
    });
  }

  getAlerts(): Promise<PlatformAlert[]> {
    return this.cached('alerts', undefined, async () => {
      const pendingSongs = await this.songs.count({ where: { status: 'pending' } });
      const pendingArtists = await this.artists.count({ where: { status: 'pending' } });
      const failedPayments = await this.orders.count({
        where: { status: 'failed', createdAt: MoreThanOrEqual(new Date(Date.now() - DAY_MS)) },
      });
      const cacheHealthy = await this.redisService.ping();

      const alerts: PlatformAlert[] = [];
      if (pendingSongs) {
        alerts.push({
          id: 'pending-songs',
          level: 'warning',
          title: `${pendingSongs} ${pendingSongs === 1 ? 'song' : 'songs'} waiting for approval`,
          description: 'Review pending uploads',
        });
      }
      if (pendingArtists) {
        alerts.push({
          id: 'pending-artists',
          level: 'warning',
          title: `${pendingArtists} artist ${pendingArtists === 1 ? 'profile' : 'profiles'} waiting for verification`,
          description: 'Review artist verification requests',
        });
      }
      if (failedPayments) {
        alerts.push({
          id: 'failed-payments',
          level: 'danger',
          title: `${failedPayments} failed ${failedPayments === 1 ? 'payment' : 'payments'} in the last 24 hours`,
          description: 'Check checkout and payment provider status',
        });
      }
      if (!cacheHealthy) {
        alerts.push({
          id: 'cache-unavailable',
          level: 'danger',
          title: 'Cache is unavailable',
          description: 'Redis is not responding; the API is serving uncached reads',
        });
      }
      if (!alerts.some((alert) => alert.level === 'danger')) {
        alerts.push({
          id: 'system-ok',
          level: 'info',
          title: 'No system issues detected',
          description: 'Database and cache are operational',
        });
      }
      return alerts;
    });
  }

  getLanguages(): Promise<LanguageShare[]> {
    return this.cached('languages', undefined, async () => {
      // Share of users by their chosen music language (users.musicLanguageId); users who
      // never picked one are left out. Top slices are kept, the rest fold into "Other".
      const rows: { label: string; count: number }[] = await this.dataSource.query(
        `SELECT ml.name AS label, count(*)::int AS count
           FROM users u
           JOIN music_languages ml ON ml.id::text = u."musicLanguageId"
          GROUP BY ml.name
          ORDER BY count DESC, ml.name ASC`,
      );
      const total = rows.reduce((sum, row) => sum + row.count, 0);
      if (!total) {
        return [];
      }

      const slices = rows.length > LANGUAGE_SLICES + 1 ? rows.slice(0, LANGUAGE_SLICES) : rows;
      const otherCount = rows.slice(slices.length).reduce((sum, row) => sum + row.count, 0);
      const shares = slices.map((row) => ({ label: row.label, count: row.count }));
      if (otherCount) {
        shares.push({ label: 'Other', count: otherCount });
      }
      return shares.map((share) => ({ ...share, value: round1((share.count / total) * 100) }));
    });
  }

  private async entityStat(
    key: DashboardStat['key'],
    title: string,
    source: CreatedAtTable,
    now: Date,
    windowStart: Date,
  ): Promise<DashboardStat> {
    const trendStart = startOfUtcMonth(now, TREND_POINTS - 1);
    const bucketExpr = source.tz ? utc(source.column) : source.column;

    const [totals]: { total: number; before: number; beforeTrend: number }[] = await this.dataSource.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE ${source.column} < $1)::int AS before,
              count(*) FILTER (WHERE ${source.column} < $2)::int AS "beforeTrend"
         FROM ${source.table}`,
      [windowStart, trendStart],
    );
    const monthly: { bucket: string; count: number }[] = await this.dataSource.query(
      `SELECT to_char(date_trunc('month', ${bucketExpr}), 'YYYY-MM') AS bucket, count(*)::int AS count
         FROM ${source.table}
        WHERE ${source.column} >= $1
        GROUP BY 1`,
      [trendStart],
    );

    // Cumulative total at the end of each of the last TREND_POINTS months.
    const byMonth = new Map(monthly.map((row) => [row.bucket, row.count]));
    let running = totals.beforeTrend;
    const trend = monthBuckets(now, TREND_POINTS).map(({ key: month }) => (running += byMonth.get(month) ?? 0));

    return {
      key,
      title,
      value: formatStatValue(totals.total),
      rawValue: totals.total,
      ...changeSummary(totals.total, totals.before),
      comparisonText: `vs ${DASHBOARD_WINDOW_DAYS} days ago`,
      trend,
    };
  }

  private async playsStat(now: Date, windowStart: Date): Promise<DashboardStat> {
    const previousStart = new Date(windowStart.getTime() - DASHBOARD_WINDOW_DAYS * DAY_MS);
    const [totals]: { total: number; current: number; previous: number }[] = await this.dataSource.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE "playedAt" >= $1)::int AS current,
              count(*) FILTER (WHERE "playedAt" >= $2 AND "playedAt" < $1)::int AS previous
         FROM play_events`,
      [windowStart, previousStart],
    );
    const byMonth = await this.playsByBucket('YYYY-MM', 'month', startOfUtcMonth(now, TREND_POINTS - 1));

    return {
      key: 'plays',
      title: 'Total Plays',
      value: formatStatValue(totals.total),
      rawValue: totals.total,
      ...changeSummary(totals.current, totals.previous),
      comparisonText: `vs previous ${DASHBOARD_WINDOW_DAYS} days`,
      trend: monthBuckets(now, TREND_POINTS).map(({ key }) => byMonth.get(key) ?? 0),
    };
  }

  private async playsByBucket(format: 'YYYY-MM' | 'YYYY-MM-DD', unit: 'month' | 'day', from: Date) {
    const rows: { bucket: string; count: number }[] = await this.dataSource.query(
      `SELECT to_char(date_trunc('${unit}', ${utc('"playedAt"')}), '${format}') AS bucket, count(*)::int AS count
         FROM play_events
        WHERE "playedAt" >= $1
        GROUP BY 1`,
      [from],
    );
    return new Map(rows.map((row) => [row.bucket, row.count]));
  }

  private async countByStatus(table: 'songs' | 'artists'): Promise<Map<string, number>> {
    const rows: { status: string; count: number }[] = await this.dataSource.query(
      `SELECT status, count(*)::int AS count FROM ${table} GROUP BY status`,
    );
    return new Map(rows.map((row) => [row.status, row.count]));
  }

  private windowStart(): Date {
    return new Date(Date.now() - DASHBOARD_WINDOW_DAYS * DAY_MS);
  }

  private async cached<T>(section: string, param: string | number | undefined, factory: () => Promise<T>): Promise<T> {
    try {
      return await this.redisService.getOrSet(
        adminDashboardCacheKey(section, param),
        ADMIN_DASHBOARD_CACHE_TTL_SECONDS,
        factory,
      );
    } catch (error) {
      throw this.toHttpException(error, AdminDashboardMessages.loadSectionFailed(section));
    }
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }
}

function parseArtistNames(raw: string | string[]): string[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toStatusCounts(
  statuses: { status: string; label: string; tone: StatusTone }[],
  counts: Map<string, number>,
): StatusCount[] {
  return statuses.map(({ status, label, tone }) => ({ label, value: counts.get(status) ?? 0, tone }));
}
