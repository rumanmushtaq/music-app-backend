import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { Song } from '../library/song.entity';
import { PlayEvent } from './play-event.entity';
import { PlaysController } from './plays.controller';
import { PlaysService } from './plays.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlayEvent, Song]), UsersModule],
  controllers: [PlaysController],
  providers: [PlaysService],
})
export class PlaysModule {}
