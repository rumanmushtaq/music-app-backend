import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { AiSearchService } from './ai-search.service';

type AiSearchBody = {
  prompt?: string;
};

@ApiTags('AI Search')
@ApiBearerAuth('clerk-token')
@Controller('api/ai-search')
@UseGuards(ClerkAuthGuard)
export class AiSearchController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  @Post()
  async search(@Body() body: AiSearchBody) {
    const { mix, recommended } = await this.aiSearchService.generateMix(body?.prompt);
    return {
      mix: { id: mix.id, title: mix.title, trackCount: mix.trackCount },
      mixTracks: mix.tracks,
      recommended,
    };
  }
}
