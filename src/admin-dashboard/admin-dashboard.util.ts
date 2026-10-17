import { BadRequestException } from '@nestjs/common';

import { AdminDashboardMessages } from '../constants/message';
import type { ChangeType } from './admin-dashboard.types';

export const DAY_MS = 24 * 60 * 60 * 1000;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Same gradient set the admin panel uses for its placeholder rows, cycled by rank.
export const ACCENTS = [
  'from-rose-500 to-orange-400',
  'from-sky-500 to-indigo-500',
  'from-violet-500 to-fuchsia-500',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-red-400',
];

const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const groupedFormatter = new Intl.NumberFormat('en-US');

/** 128400 -> "128.4K", 1200000 -> "1.2M", 980 -> "980". */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/** Stat-card value: full digits below a million ("12,480"), compact above ("1.2M"). */
export function formatStatValue(value: number): string {
  return value >= 1_000_000 ? formatCompact(value) : groupedFormatter.format(value);
}

/** Signed percentage change rounded to one decimal. A rise from zero counts as +100%. */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return round1(((current - previous) / previous) * 100);
}

export function changeSummary(current: number, previous: number): { change: number; changeType: ChangeType } {
  const change = percentChange(current, previous);
  return { change: Math.abs(change), changeType: change < 0 ? 'down' : 'up' };
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** "YYYY-MM" for the UTC month of `date`. */
export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/** "YYYY-MM-DD" for the UTC day of `date`. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** First instant of the UTC month `monthsBack` months before `now`'s month. */
export function startOfUtcMonth(now: Date, monthsBack = 0): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1));
}

/** First instant of the UTC day `daysBack` days before `now`'s day. */
export function startOfUtcDay(now: Date, daysBack = 0): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysBack));
}

/** The last `count` UTC months ending with the current one, oldest first. */
export function monthBuckets(now: Date, count: number): { key: string; label: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const start = startOfUtcMonth(now, count - 1 - index);
    return { key: monthKey(start), label: MONTH_LABELS[start.getUTCMonth()] };
  });
}

/** The last `count` UTC days ending with today, oldest first. Labels look like "Oct 17". */
export function dayBuckets(now: Date, count: number): { key: string; label: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const start = startOfUtcDay(now, count - 1 - index);
    return { key: dayKey(start), label: `${MONTH_LABELS[start.getUTCMonth()]} ${start.getUTCDate()}` };
  });
}

/** "12AM", "2PM", ... for an hour of the day 0-23. */
export function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${suffix}`;
}

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function relativeTime(date: Date, now: Date): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** Parses an optional `limit` query value; throws 400 for anything outside 1..max. */
export function parseLimit(raw: string | undefined, fallback: number, max: number): number {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new BadRequestException(AdminDashboardMessages.invalidLimit(max));
  }
  return value;
}
