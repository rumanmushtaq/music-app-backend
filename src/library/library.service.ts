import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './artist.entity';
import { Playlist } from './playlist.entity';
import { Song } from './song.entity';
import {
  LIBRARY_ARTISTS_CACHE_KEY,
  LIBRARY_CACHE_TTL_SECONDS,
  LIBRARY_PLAYLISTS_CACHE_KEY,
  LIBRARY_SONGS_CACHE_KEY,
} from '../constants/cache';
import { CommonMessages, LibraryMessages } from '../constants/message';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(
    @InjectRepository(Song)
    private readonly songs: Repository<Song>,
    @InjectRepository(Artist)
    private readonly artists: Repository<Artist>,
    @InjectRepository(Playlist)
    private readonly playlists: Repository<Playlist>,
    private readonly redisService: RedisService,
  ) {}

  async getSongs(): Promise<Song[]> {
    try {
      return await this.redisService.getOrSet(LIBRARY_SONGS_CACHE_KEY, LIBRARY_CACHE_TTL_SECONDS, () =>
        this.songs.find(),
      );
    } catch (error) {
      throw this.toHttpException(error, LibraryMessages.loadSongsFailed);
    }
  }

  async getArtists(): Promise<Artist[]> {
    try {
      return await this.redisService.getOrSet(LIBRARY_ARTISTS_CACHE_KEY, LIBRARY_CACHE_TTL_SECONDS, () =>
        this.artists.find(),
      );
    } catch (error) {
      throw this.toHttpException(error, LibraryMessages.loadArtistsFailed);
    }
  }

  async getPlaylists(): Promise<Playlist[]> {
    try {
      return await this.redisService.getOrSet(LIBRARY_PLAYLISTS_CACHE_KEY, LIBRARY_CACHE_TTL_SECONDS, () =>
        this.playlists.find(),
      );
    } catch (error) {
      throw this.toHttpException(error, LibraryMessages.loadPlaylistsFailed);
    }
  }

  async getLibrary(): Promise<{ songs: Song[]; artists: Artist[]; playlists: Playlist[] }> {
    const [songs, artists, playlists] = await Promise.all([
      this.getSongs(),
      this.getArtists(),
      this.getPlaylists(),
    ]);
    return { songs, artists, playlists };
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }
}
