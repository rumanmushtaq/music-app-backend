import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { SearchResultType } from './search.types';
import { SearchService } from './search.service';

@Controller('api/search')
@UseGuards(ClerkAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('moods')
  getMoods() {
    return this.searchService.getMoodCards();
  }

  @Get()
  search(
    @Query('q') q?: string,
    @Query('type') type: SearchResultType = 'songs',
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    if (!q || !q.trim()) {
      throw new BadRequestException('q is required');
    }
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
    return this.searchService.search(q, type, safeLimit, cursor);
  }
}
