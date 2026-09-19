import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Artist } from '../library/artist.entity';
import { Playlist } from '../library/playlist.entity';
import { Song } from '../library/song.entity';
import { MoodCard } from './mood-card.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Song, Artist, Playlist, MoodCard])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
