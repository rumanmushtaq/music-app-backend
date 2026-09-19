import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Song } from '../library/song.entity';
import { AiSearchController } from './ai-search.controller';
import { AiSearchService } from './ai-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Song])],
  controllers: [AiSearchController],
  providers: [AiSearchService],
})
export class AiSearchModule {}
