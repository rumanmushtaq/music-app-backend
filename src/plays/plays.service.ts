import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PlayEvent } from './play-event.entity';
import { Song } from '../library/song.entity';
import { UsersService } from '../users/users.service';
import type { AuthClaims } from '../auth/clerk-auth.guard';
import { CommonMessages, PlaysMessages } from '../constants/message';

@Injectable()
export class PlaysService {
  private readonly logger = new Logger(PlaysService.name);

  constructor(
    @InjectRepository(PlayEvent)
    private readonly playEvents: Repository<PlayEvent>,
    @InjectRepository(Song)
    private readonly songs: Repository<Song>,
    private readonly usersService: UsersService,
  ) {}

  async recordPlay(auth: AuthClaims, songId: string): Promise<PlayEvent> {
    try {
      const songExists = await this.songs.exists({ where: { id: songId } });
      if (!songExists) {
        throw new NotFoundException(PlaysMessages.songNotFound(songId));
      }

      const user = await this.usersService.upsertByClerkId(auth.userId, auth.email);
      return await this.playEvents.save(this.playEvents.create({ userId: user.id, songId }));
    } catch (error) {
      throw this.toHttpException(error, PlaysMessages.recordPlayFailed(songId));
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
