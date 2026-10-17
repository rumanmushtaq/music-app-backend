import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../auth/admin.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { ACTIVITY_PERIODS } from './admin-dashboard.types';
import { parseLimit } from './admin-dashboard.util';

const MAX_LIMIT = 50;
const ADMIN_ONLY = 'Requires the caller\'s role to be "admin" or "superAdmin".';

@ApiTags('Admin')
@ApiBearerAuth('clerk-token')
@Controller('admin/dashboard')
@UseGuards(ClerkAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: '[Admin] Headline totals for users, songs, artists and plays', description: ADMIN_ONLY })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('activity')
  @ApiOperation({ summary: '[Admin] Plays over time', description: ADMIN_ONLY })
  @ApiQuery({ name: 'period', required: false, enum: ACTIVITY_PERIODS })
  getActivity(@Query('period') period?: string) {
    return this.dashboardService.getActivity(period);
  }

  @Get('active-days')
  @ApiOperation({ summary: '[Admin] Plays per weekday over the last 30 days (UTC)', description: ADMIN_ONLY })
  getActiveDays() {
    return this.dashboardService.getActiveDays();
  }

  @Get('active-hours')
  @ApiOperation({ summary: '[Admin] Plays per 2-hour slot over the last 30 days (UTC)', description: ADMIN_ONLY })
  getActiveHours() {
    return this.dashboardService.getActiveHours();
  }

  @Get('retention')
  @ApiOperation({ summary: '[Admin] Returning vs new listeners over the last 30 days', description: ADMIN_ONLY })
  getRetention() {
    return this.dashboardService.getRetention();
  }

  @Get('top-songs')
  @ApiOperation({ summary: '[Admin] Most played songs over the last 30 days', description: ADMIN_ONLY })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  getTopSongs(@Query('limit') limit?: string) {
    return this.dashboardService.getTopSongs(parseLimit(limit, 5, MAX_LIMIT));
  }

  @Get('top-artists')
  @ApiOperation({ summary: '[Admin] Most played artists over the last 30 days', description: ADMIN_ONLY })
  @ApiQuery({ name: 'limit', required: false, example: 5 })
  getTopArtists(@Query('limit') limit?: string) {
    return this.dashboardService.getTopArtists(parseLimit(limit, 5, MAX_LIMIT));
  }

  @Get('content-overview')
  @ApiOperation({ summary: '[Admin] Song and artist counts by moderation status', description: ADMIN_ONLY })
  getContentOverview() {
    return this.dashboardService.getContentOverview();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: '[Admin] Latest sign-ups, songs and artists', description: ADMIN_ONLY })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  getRecentActivity(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentActivity(parseLimit(limit, 10, MAX_LIMIT));
  }

  @Get('alerts')
  @ApiOperation({ summary: '[Admin] Items needing attention and system health', description: ADMIN_ONLY })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('languages')
  @ApiOperation({ summary: '[Admin] Share of users by chosen music language', description: ADMIN_ONLY })
  getLanguages() {
    return this.dashboardService.getLanguages();
  }
}
