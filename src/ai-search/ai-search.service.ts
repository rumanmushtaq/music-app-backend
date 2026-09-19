import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Song } from '../library/song.entity';
import { LIBRARY_CACHE_TTL_SECONDS, LIBRARY_SONGS_CACHE_KEY } from '../constants/cache';
import { AiSearchMessages, CommonMessages } from '../constants/message';
import { RedisService } from '../redis/redis.service';
import { AiMix } from '../search/search.types';

const RECOMMENDED_GRADIENTS: Array<{ gradientStart: string; gradientEnd: string }> = [
  { gradientStart: '#FE3030', gradientEnd: '#FF4E88' },
  { gradientStart: '#2B86FF', gradientEnd: '#134E5E' },
  { gradientStart: '#8E2DE2', gradientEnd: '#4A00E0' },
  { gradientStart: '#7B2FF7', gradientEnd: '#C29DFF' },
];

function hashPrompt(prompt: string, poolSize: number): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) % poolSize;
  }
  return hash;
}

@Injectable()
export class AiSearchService {
  private readonly logger = new Logger(AiSearchService.name);

  constructor(
    @InjectRepository(Song)
    private readonly songs: Repository<Song>,
    private readonly redisService: RedisService,
  ) {}

  async generateMix(prompt?: string): Promise<{
    mix: AiMix;
    recommended: Array<{ id: string; title: string; artworkUrl: string | null; gradientStart: string; gradientEnd: string }>;
  }> {
    try {
      // Reuses the same songs table/cache key library and search already read from -
      // the AI mix is drawn from the same pool of real songs, not a separate dataset.
      const pool = await this.redisService.getOrSet(LIBRARY_SONGS_CACHE_KEY, LIBRARY_CACHE_TTL_SECONDS, () =>
        this.songs.find(),
      );

      const title = prompt ? `Mix for "${prompt}"` : 'Your Daily AI Mix';
      if (pool.length === 0) {
        return { mix: { id: 'ai-mix-1', title, trackCount: 0, tracks: [] }, recommended: [] };
      }

      const offset = prompt ? hashPrompt(prompt, pool.length) : 0;
      const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];

      const mixTracks = rotated.slice(0, 4);
      const recommendedSource = rotated.slice(4, 8);

      const mix: AiMix = {
        id: 'ai-mix-1',
        title,
        trackCount: mixTracks.length,
        tracks: mixTracks,
      };

      const recommended = recommendedSource.map((song, index) => ({
        id: song.id,
        title: song.title,
        artworkUrl: song.artworkUrl,
        ...RECOMMENDED_GRADIENTS[index % RECOMMENDED_GRADIENTS.length],
      }));

      return { mix, recommended };
    } catch (error) {
      throw this.toHttpException(error, AiSearchMessages.generateMixFailed);
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
