import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HomeCategory } from './home-category.entity';
import { QuickPlayItem } from './quick-play-item.entity';
import { DailyMixItem } from './daily-mix-item.entity';
import { HollywoodTrack } from './hollywood-track.entity';
import { UntouchedBeat } from './untouched-beat.entity';
import { TopVoice } from './top-voice.entity';
import { NOW_PLAYING_ID, NowPlaying } from './now-playing.entity';
import { HomeFeed } from './home.types';
import { HOME_FEED_CACHE_KEY, HOME_FEED_CACHE_TTL_SECONDS } from '../constants/cache';
import { CommonMessages, HomeMessages } from '../constants/message';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    @InjectRepository(HomeCategory)
    private readonly categories: Repository<HomeCategory>,
    @InjectRepository(QuickPlayItem)
    private readonly quickPlayItems: Repository<QuickPlayItem>,
    @InjectRepository(DailyMixItem)
    private readonly dailyMixItems: Repository<DailyMixItem>,
    @InjectRepository(HollywoodTrack)
    private readonly hollywoodTracks: Repository<HollywoodTrack>,
    @InjectRepository(UntouchedBeat)
    private readonly untouchedBeats: Repository<UntouchedBeat>,
    @InjectRepository(TopVoice)
    private readonly topVoices: Repository<TopVoice>,
    @InjectRepository(NowPlaying)
    private readonly nowPlayingRepo: Repository<NowPlaying>,
    private readonly redisService: RedisService,
  ) {}

  async getHomeFeed(): Promise<HomeFeed> {
    try {
      return await this.redisService.getOrSet(HOME_FEED_CACHE_KEY, HOME_FEED_CACHE_TTL_SECONDS, async () => {
        const order = { displayOrder: 'ASC' as const };
        const [categories, quickPlayItems, dailyMixItems, hollywoodTracks, untouchedBeats, topVoices, nowPlaying] =
          await Promise.all([
            this.categories.find({ order }),
            this.quickPlayItems.find({ order }),
            this.dailyMixItems.find({ order }),
            this.hollywoodTracks.find({ order }),
            this.untouchedBeats.find({ order }),
            this.topVoices.find({ order }),
            this.nowPlayingRepo.findOne({ where: { id: NOW_PLAYING_ID } }),
          ]);

        return {
          categories: categories.map((category) => ({
            id: category.id,
            emoji: category.emoji,
            label: category.label,
          })),
          quickPlayItems: quickPlayItems.map((item) => ({
            id: item.id,
            title: item.title,
            gradient: [item.gradientStart, item.gradientEnd],
            imageUrl: item.imageUrl,
          })),
          dailyMixItems: dailyMixItems.map((item) => ({
            id: item.id,
            title: item.title,
            curators: item.curators,
            gradient: [item.gradientStart, item.gradientEnd],
            imageUrl: item.imageUrl,
          })),
          hollywoodTracks: hollywoodTracks.map((track) => ({
            id: track.id,
            title: track.title,
            subtitle: track.subtitle,
            kind: track.kind ?? undefined,
            views: track.views ?? undefined,
            gradient: [track.gradientStart, track.gradientEnd],
            imageUrl: track.imageUrl,
          })),
          untouchedBeats: untouchedBeats.map((beat) => ({
            id: beat.id,
            title: beat.title,
            gradient: [beat.gradientStart, beat.gradientEnd],
            imageUrl: beat.imageUrl,
          })),
          topVoices: topVoices.map((voice) => ({
            id: voice.id,
            name: voice.name,
            initials: voice.initials,
            gradient: [voice.gradientStart, voice.gradientEnd],
            imageUrl: voice.imageUrl,
          })),
          nowPlaying: nowPlaying
            ? {
                title: nowPlaying.title,
                progress: nowPlaying.progress,
                gradient: [nowPlaying.gradientStart, nowPlaying.gradientEnd],
              }
            : { title: '', progress: 0, gradient: ['#000000', '#000000'] },
        };
      });
    } catch (error) {
      throw this.toHttpException(error, HomeMessages.loadHomeFeedFailed);
    }
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }
}
