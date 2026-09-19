import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Podcast } from './podcast.entity';
import { PodcastEpisode } from './podcast-episode.entity';
import { PodcastCategory } from './podcast-category.entity';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Podcast, PodcastEpisode, PodcastCategory])],
  controllers: [PodcastsController],
  providers: [PodcastsService],
})
export class PodcastsModule {}
