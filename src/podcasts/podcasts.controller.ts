import { Controller, Get, Param } from '@nestjs/common';

import { PodcastsService } from './podcasts.service';

@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly podcastsService: PodcastsService) {}

  @Get()
  async getFeed() {
    const [categories, feed] = await Promise.all([this.podcastsService.getCategories(), this.podcastsService.getFeed()]);
    return { categories, feed };
  }

  @Get(':id')
  async getPodcastDetail(@Param('id') id: string) {
    return this.podcastsService.getPodcastDetail(id);
  }

  @Get(':id/episodes/:episodeId')
  async getEpisode(@Param('id') id: string, @Param('episodeId') episodeId: string) {
    return this.podcastsService.getEpisode(id, episodeId);
  }
}
