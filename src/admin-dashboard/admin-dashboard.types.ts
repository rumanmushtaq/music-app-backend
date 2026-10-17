// Response shapes for GET /admin/dashboard/*. They mirror the admin panel's
// `features/dashboard/types/dashboard.types.ts`, except ids are strings here
// (songs/artists use slug ids, users use uuids).

export const ACTIVITY_PERIODS = ['12M', '6M', '30D'] as const;
export type ActivityPeriod = (typeof ACTIVITY_PERIODS)[number];

export type StatKey = 'users' | 'songs' | 'artists' | 'plays';
export type ChangeType = 'up' | 'down';

export type DashboardStat = {
  key: StatKey;
  title: string;
  value: string;
  rawValue: number;
  change: number;
  changeType: ChangeType;
  comparisonText: string;
  trend: number[];
};

export type ActivityPoint = { label: string; plays: number };
export type ActivityData = { period: ActivityPeriod; subtitle: string; points: ActivityPoint[] };

export type ActiveDay = { day: string; value: number };
export type HourActivity = { hour: string; value: number };

export type Retention = { rate: number; returning: number; newListeners: number; totalListeners: number };

export type TopSong = {
  id: string;
  title: string;
  artist: string;
  plays: string;
  playCount: number;
  change: number;
  accent: string;
};

export type TopArtist = {
  id: string;
  name: string;
  songs: number;
  plays: string;
  playCount: number;
  accent: string;
};

export type StatusTone = 'green' | 'orange' | 'gray' | 'red' | 'blue';
export type StatusCount = { label: string; value: number; tone: StatusTone };
export type ContentOverview = { songs: StatusCount[]; artists: StatusCount[] };

export type ActivityItemType = 'user' | 'song' | 'artist' | 'report';
export type ActivityItem = {
  id: string;
  type: ActivityItemType;
  title: string;
  description: string;
  time: string;
  createdAt: string;
};

export type AlertLevel = 'warning' | 'danger' | 'success' | 'info';
export type PlatformAlert = { id: string; level: AlertLevel; title: string; description: string };

export type LanguageShare = { label: string; value: number; count: number };
