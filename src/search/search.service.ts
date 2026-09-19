import { HttpException, Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Artist } from '../library/artist.entity';
import { Playlist } from '../library/playlist.entity';
import { Song } from '../library/song.entity';
import {
  LIBRARY_ARTISTS_CACHE_KEY,
  LIBRARY_CACHE_TTL_SECONDS,
  LIBRARY_PLAYLISTS_CACHE_KEY,
  LIBRARY_SONGS_CACHE_KEY,
  SEARCH_CACHE_TTL_SECONDS,
  SEARCH_MOODS_CACHE_KEY,
} from '../constants/cache';
import { CommonMessages, SearchMessages } from '../constants/message';
import {
  SEARCH_SEED_ARTISTS,
  SEARCH_SEED_MOOD_CARDS,
  SEARCH_SEED_PLAYLISTS,
  SEARCH_SEED_SONGS,
} from '../constants/search-seed-data';
import { RedisService } from '../redis/redis.service';
import { MoodCard } from './mood-card.entity';
import { Playlist as PlaylistResult, SearchResultType } from './search.types';

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

function decodeCursor(cursor?: string): number {
  if (!cursor) {
    return 0;
  }
  const decoded = Number(Buffer.from(cursor, 'base64').toString('utf8'));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

function toPlaylistResult(playlist: Playlist): PlaylistResult {
  const { id, title, songCount, artworkUrl } = playlist;
  return { id, title, songCount, artworkUrl };
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Song)
    private readonly songs: Repository<Song>,
    @InjectRepository(Artist)
    private readonly artists: Repository<Artist>,
    @InjectRepository(Playlist)
    private readonly playlists: Repository<Playlist>,
    @InjectRepository(MoodCard)
    private readonly moodCards: Repository<MoodCard>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      for (const moodCard of SEARCH_SEED_MOOD_CARDS) {
        const existing = await this.moodCards.findOne({ where: { id: moodCard.id } });
        if (!existing) {
          await this.moodCards.save(this.moodCards.create(moodCard));
        }
      }

      for (const song of SEARCH_SEED_SONGS) {
        const existing = await this.songs.findOne({ where: { id: song.id } });
        if (!existing) {
          await this.songs.save(this.songs.create(song));
        }
      }

      for (const artist of SEARCH_SEED_ARTISTS) {
        const existing = await this.artists.findOne({ where: { id: artist.id } });
        if (!existing) {
          await this.artists.save(this.artists.create(artist));
        }
      }

      for (const playlist of SEARCH_SEED_PLAYLISTS) {
        const existing = await this.playlists.findOne({ where: { id: playlist.id } });
        if (!existing) {
          await this.playlists.save(this.playlists.create(playlist));
        }
      }
    } catch (error) {
      this.logger.error('Failed to seed search dummy data', error instanceof Error ? error.stack : error);
    }
  }

  async getMoodCards(): Promise<MoodCard[]> {
    try {
      return await this.redisService.getOrSet(SEARCH_MOODS_CACHE_KEY, SEARCH_CACHE_TTL_SECONDS, () =>
        this.moodCards.find(),
      );
    } catch (error) {
      throw this.toHttpException(error, SearchMessages.loadMoodsFailed);
    }
  }

  async search(q: string, type: SearchResultType, limit: number, cursor?: string) {
    try {
      const needle = q.trim().toLowerCase();
      const offset = decodeCursor(cursor);

      if (type === 'artists') {
        const all = await this.redisService.getOrSet(LIBRARY_ARTISTS_CACHE_KEY, LIBRARY_CACHE_TTL_SECONDS, () =>
          this.artists.find(),
        );
        return this.paginate(
          all.filter((artist) => artist.name.toLowerCase().includes(needle)),
          offset,
          limit,
          'artists',
        );
      }

      if (type === 'playlists') {
        const all = await this.redisService.getOrSet(LIBRARY_PLAYLISTS_CACHE_KEY, LIBRARY_CACHE_TTL_SECONDS, () =>
          this.playlists.find(),
        );
        return this.paginate(
          all.filter((playlist) => playlist.title.toLowerCase().includes(needle)).map(toPlaylistResult),
          offset,
          limit,
          'playlists',
        );
      }

      const all = await this.redisService.getOrSet(LIBRARY_SONGS_CACHE_KEY, LIBRARY_CACHE_TTL_SECONDS, () =>
        this.songs.find(),
      );
      return this.paginate(
        all.filter(
          (song) =>
            song.title.toLowerCase().includes(needle) ||
            song.artistNames.some((name) => name.toLowerCase().includes(needle)),
        ),
        offset,
        limit,
        'songs',
      );
    } catch (error) {
      throw this.toHttpException(error, SearchMessages.searchFailed);
    }
  }

  private paginate<T>(matches: T[], offset: number, limit: number, key: SearchResultType) {
    const slice = matches.slice(offset, offset + limit);
    const nextCursor = offset + limit < matches.length ? encodeCursor(offset + limit) : null;
    return { [key]: slice, nextCursor };
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }
}
