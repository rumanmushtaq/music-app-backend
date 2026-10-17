import { BadRequestException } from '@nestjs/common';

import {
  changeSummary,
  dayBuckets,
  formatCompact,
  formatStatValue,
  hourLabel,
  monthBuckets,
  parseLimit,
  percentChange,
  relativeTime,
  startOfUtcDay,
  startOfUtcMonth,
} from './admin-dashboard.util';

describe('admin dashboard utils', () => {
  describe('formatCompact', () => {
    it.each([
      [0, '0'],
      [980, '980'],
      [128_400, '128.4K'],
      [1_200_000, '1.2M'],
      [2_500_000_000, '2.5B'],
    ])('formats %d as %s', (value, expected) => {
      expect(formatCompact(value)).toBe(expected);
    });
  });

  describe('formatStatValue', () => {
    it('groups digits below a million', () => {
      expect(formatStatValue(12_480)).toBe('12,480');
      expect(formatStatValue(486)).toBe('486');
    });

    it('switches to compact notation from a million', () => {
      expect(formatStatValue(1_234_567)).toBe('1.2M');
    });
  });

  describe('percentChange', () => {
    it('returns the signed change rounded to one decimal', () => {
      expect(percentChange(150, 100)).toBe(50);
      expect(percentChange(2, 3)).toBe(-33.3);
    });

    it('treats growth from zero as +100% and zero-to-zero as 0', () => {
      expect(percentChange(5, 0)).toBe(100);
      expect(percentChange(0, 0)).toBe(0);
    });
  });

  describe('changeSummary', () => {
    it('reports magnitude plus direction', () => {
      expect(changeSummary(90, 100)).toEqual({ change: 10, changeType: 'down' });
      expect(changeSummary(110, 100)).toEqual({ change: 10, changeType: 'up' });
      expect(changeSummary(100, 100)).toEqual({ change: 0, changeType: 'up' });
    });
  });

  describe('hourLabel', () => {
    it.each([
      [0, '12AM'],
      [2, '2AM'],
      [11, '11AM'],
      [12, '12PM'],
      [22, '10PM'],
    ])('labels hour %d as %s', (hour, expected) => {
      expect(hourLabel(hour)).toBe(expected);
    });
  });

  describe('relativeTime', () => {
    const now = new Date('2026-10-17T12:00:00Z');

    it.each([
      ['2026-10-17T11:59:30Z', 'just now'],
      ['2026-10-17T11:58:00Z', '2m ago'],
      ['2026-10-17T09:00:00Z', '3h ago'],
      ['2026-10-15T12:00:00Z', '2d ago'],
      ['2026-08-01T12:00:00Z', 'Aug 1, 2026'],
    ])('formats %s as %s', (iso, expected) => {
      expect(relativeTime(new Date(iso), now)).toBe(expected);
    });

    it('never reports a future date as negative', () => {
      expect(relativeTime(new Date('2026-10-17T12:05:00Z'), now)).toBe('just now');
    });
  });

  describe('UTC buckets', () => {
    it('computes month and day starts in UTC', () => {
      const now = new Date('2026-01-15T23:30:00Z');
      expect(startOfUtcMonth(now).toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(startOfUtcMonth(now, 1).toISOString()).toBe('2025-12-01T00:00:00.000Z');
      expect(startOfUtcDay(now, 15).toISOString()).toBe('2025-12-31T00:00:00.000Z');
    });

    it('lists months oldest first across a year boundary', () => {
      const buckets = monthBuckets(new Date('2026-02-10T00:00:00Z'), 4);
      expect(buckets).toEqual([
        { key: '2025-11', label: 'Nov' },
        { key: '2025-12', label: 'Dec' },
        { key: '2026-01', label: 'Jan' },
        { key: '2026-02', label: 'Feb' },
      ]);
    });

    it('lists days oldest first ending today', () => {
      const buckets = dayBuckets(new Date('2026-03-02T08:00:00Z'), 3);
      expect(buckets).toEqual([
        { key: '2026-02-28', label: 'Feb 28' },
        { key: '2026-03-01', label: 'Mar 1' },
        { key: '2026-03-02', label: 'Mar 2' },
      ]);
    });
  });

  describe('parseLimit', () => {
    it('falls back to the default when absent', () => {
      expect(parseLimit(undefined, 5, 50)).toBe(5);
      expect(parseLimit('', 10, 50)).toBe(10);
    });

    it('accepts integers within range', () => {
      expect(parseLimit('1', 5, 50)).toBe(1);
      expect(parseLimit('50', 5, 50)).toBe(50);
    });

    it.each(['0', '-3', '51', '2.5', 'abc'])('rejects %s', (raw) => {
      expect(() => parseLimit(raw, 5, 50)).toThrow(BadRequestException);
    });
  });
});
