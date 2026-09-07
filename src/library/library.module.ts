import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Artist } from './artist.entity';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { Playlist } from './playlist.entity';
import { Song } from './song.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song, Artist, Playlist])],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
