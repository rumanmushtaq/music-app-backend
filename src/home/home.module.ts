import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HomeCategory } from './home-category.entity';
import { QuickPlayItem } from './quick-play-item.entity';
import { DailyMixItem } from './daily-mix-item.entity';
import { HollywoodTrack } from './hollywood-track.entity';
import { UntouchedBeat } from './untouched-beat.entity';
import { TopVoice } from './top-voice.entity';
import { NowPlaying } from './now-playing.entity';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HomeCategory,
      QuickPlayItem,
      DailyMixItem,
      HollywoodTrack,
      UntouchedBeat,
      TopVoice,
      NowPlaying,
    ]),
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
