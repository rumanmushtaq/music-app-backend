import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { User } from '../users/user.entity';
import { Plan } from '../plans/plan.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Order } from '../orders/order.entity';
import { Song } from '../library/song.entity';
import { Artist } from '../library/artist.entity';
import { Playlist } from '../library/playlist.entity';
import { MusicLanguage } from '../music-languages/music-language.entity';
import { Podcast } from '../podcasts/podcast.entity';
import { PodcastEpisode } from '../podcasts/podcast-episode.entity';
import { PodcastCategory } from '../podcasts/podcast-category.entity';
import { HomeCategory } from '../home/home-category.entity';
import { QuickPlayItem } from '../home/quick-play-item.entity';
import { DailyMixItem } from '../home/daily-mix-item.entity';
import { HollywoodTrack } from '../home/hollywood-track.entity';
import { UntouchedBeat } from '../home/untouched-beat.entity';
import { TopVoice } from '../home/top-voice.entity';
import { NowPlaying } from '../home/now-playing.entity';
import { MoodCard } from '../search/mood-card.entity';

export function buildDatabaseConfig(): TypeOrmModuleOptions {
  const url = process.env.DATABASE_URL;

  const base: TypeOrmModuleOptions = {
    type: 'postgres',
    entities: [
      User,
      Plan,
      Subscription,
      Order,
      Song,
      Artist,
      Playlist,
      MusicLanguage,
      Podcast,
      PodcastEpisode,
      PodcastCategory,
      HomeCategory,
      QuickPlayItem,
      DailyMixItem,
      HollywoodTrack,
      UntouchedBeat,
      TopVoice,
      NowPlaying,
      MoodCard,
    ],
    synchronize: process.env.NODE_ENV !== 'production',
  };

  if (url) {
    return { ...base, url };
  }

  return {
    ...base,
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'music_app',
  };
}
