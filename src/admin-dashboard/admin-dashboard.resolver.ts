import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';

import { AdminGuard } from '../auth/admin.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import {
  ActiveDay,
  ActivityData,
  ActivityItem,
  ActivityPeriodEnum,
  ContentOverview,
  DashboardStat,
  HourActivity,
  LanguageShare,
  PlatformAlert,
  Retention,
  TopArtist,
  TopSong,
} from './admin-dashboard.models';
import { AdminDashboardService } from './admin-dashboard.service';
import type { ActivityPeriod } from './admin-dashboard.types';
import { checkLimit } from './admin-dashboard.util';

// GraphQL view of the same data as AdminDashboardController. Every query calls the existing
// service method, so the Redis cache and the admin-only rule apply exactly as they do for REST.
@Resolver()
@UseGuards(ClerkAuthGuard, AdminGuard)
export class AdminDashboardResolver {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Query(() => [DashboardStat])
  dashboardStats() {
    return this.dashboardService.getStats();
  }

  @Query(() => ActivityData)
  dashboardActivity(
    @Args('period', { type: () => ActivityPeriodEnum, defaultValue: ActivityPeriodEnum.TWELVE_MONTHS })
    period: ActivityPeriod,
  ) {
    return this.dashboardService.getActivity(period);
  }

  @Query(() => [ActiveDay])
  activeDays() {
    return this.dashboardService.getActiveDays();
  }

  @Query(() => [HourActivity])
  activeHours() {
    return this.dashboardService.getActiveHours();
  }

  @Query(() => Retention)
  retention() {
    return this.dashboardService.getRetention();
  }

  @Query(() => [TopSong])
  topSongs(@Args('limit', { type: () => Int, defaultValue: 5 }) limit: number) {
    return this.dashboardService.getTopSongs(checkLimit(limit));
  }

  @Query(() => [TopArtist])
  topArtists(@Args('limit', { type: () => Int, defaultValue: 5 }) limit: number) {
    return this.dashboardService.getTopArtists(checkLimit(limit));
  }

  @Query(() => ContentOverview)
  contentOverview() {
    return this.dashboardService.getContentOverview();
  }

  @Query(() => [ActivityItem])
  recentActivity(@Args('limit', { type: () => Int, defaultValue: 10 }) limit: number) {
    return this.dashboardService.getRecentActivity(checkLimit(limit));
  }

  @Query(() => [PlatformAlert])
  platformAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Query(() => [LanguageShare])
  languages() {
    return this.dashboardService.getLanguages();
  }
}
