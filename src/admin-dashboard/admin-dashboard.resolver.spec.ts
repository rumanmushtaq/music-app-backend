import { BadRequestException } from '@nestjs/common';

import { AdminDashboardResolver } from './admin-dashboard.resolver';
import type { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardResolver', () => {
  const service = {
    getStats: jest.fn(async () => []),
    getActivity: jest.fn(async () => ({ period: '30D', subtitle: '', points: [] })),
    getActiveDays: jest.fn(async () => []),
    getActiveHours: jest.fn(async () => []),
    getRetention: jest.fn(async () => ({ rate: 0, returning: 0, newListeners: 0, totalListeners: 0 })),
    getTopSongs: jest.fn(async () => []),
    getTopArtists: jest.fn(async () => []),
    getContentOverview: jest.fn(async () => ({ songs: [], artists: [] })),
    getRecentActivity: jest.fn(async () => []),
    getAlerts: jest.fn(async () => []),
    getLanguages: jest.fn(async () => []),
  };
  const resolver = new AdminDashboardResolver(service as unknown as AdminDashboardService);

  beforeEach(() => jest.clearAllMocks());

  it('dashboardActivity passes the internal period value', async () => {
    await resolver.dashboardActivity('30D');
    expect(service.getActivity).toHaveBeenCalledWith('30D');
  });

  it('topSongs passes the limit', async () => {
    await resolver.topSongs(7);
    expect(service.getTopSongs).toHaveBeenCalledWith(7);
  });

  it('rejects limit 0 and 51', () => {
    expect(() => resolver.topSongs(0)).toThrow(BadRequestException);
    expect(() => resolver.topArtists(51)).toThrow(BadRequestException);
    expect(() => resolver.recentActivity(0)).toThrow(BadRequestException);
    expect(service.getTopSongs).not.toHaveBeenCalled();
    expect(service.getTopArtists).not.toHaveBeenCalled();
    expect(service.getRecentActivity).not.toHaveBeenCalled();
  });

  it('platformAlerts calls getAlerts', async () => {
    await resolver.platformAlerts();
    expect(service.getAlerts).toHaveBeenCalled();
  });
});
