import { Module } from '@nestjs/common';

import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';

@Module({
  controllers: [PodcastsController],
  providers: [PodcastsService],
})
export class PodcastsModule {}
