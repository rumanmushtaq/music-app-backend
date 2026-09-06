import { Controller, Get, Param } from '@nestjs/common';

import { PodcastsService } from './podcasts.service';

@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly podcastsService: PodcastsService) {}

  @Get()
  getFeed() {
    return {
      categories: this.podcastsService.getCategories(),
      feed: this.podcastsService.getFeed(),
    };
  }

  @Get(':id')
  getPodcastDetail(@Param('id') id: string) {
    return this.podcastsService.getPodcastDetail(id);
  }

  @Get(':id/episodes/:episodeId')
  getEpisode(@Param('id') id: string, @Param('episodeId') episodeId: string) {
    return this.podcastsService.getEpisode(id, episodeId);
  }
}
