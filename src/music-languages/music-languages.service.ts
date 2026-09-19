import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MusicLanguage } from './music-language.entity';
import { MUSIC_LANGUAGES_CACHE_KEY, MUSIC_LANGUAGES_CACHE_TTL_SECONDS } from '../constants/cache';
import { CommonMessages, MusicLanguagesMessages } from '../constants/message';
import { MUSIC_LANGUAGES_SEED_NAMES } from '../constants/music-languages-seed-data';
import { isUniqueViolation } from '../common/db-errors.util';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MusicLanguagesService implements OnModuleInit {
  private readonly logger = new Logger(MusicLanguagesService.name);

  constructor(
    @InjectRepository(MusicLanguage)
    private readonly musicLanguages: Repository<MusicLanguage>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      for (const name of MUSIC_LANGUAGES_SEED_NAMES) {
        const existing = await this.musicLanguages.findOne({ where: { name } });
        if (!existing) {
          await this.musicLanguages.save(this.musicLanguages.create({ name }));
        }
      }
    } catch (error) {
      this.logger.error('Failed to seed music languages', error instanceof Error ? error.stack : error);
    }
  }

  async getAll(): Promise<MusicLanguage[]> {
    try {
      return await this.redisService.getOrSet(MUSIC_LANGUAGES_CACHE_KEY, MUSIC_LANGUAGES_CACHE_TTL_SECONDS, () =>
        this.musicLanguages.find({ order: { name: 'ASC' } }),
      );
    } catch (error) {
      throw this.toHttpException(error, MusicLanguagesMessages.loadLanguagesFailed);
    }
  }

  async getById(id: string): Promise<MusicLanguage> {
    try {
      const language = await this.musicLanguages.findOne({ where: { id } });
      if (!language) {
        throw new NotFoundException(MusicLanguagesMessages.musicLanguageNotFound(id));
      }
      return language;
    } catch (error) {
      throw this.toHttpException(error, MusicLanguagesMessages.musicLanguageNotFound(id));
    }
  }

  async create(name: string): Promise<MusicLanguage> {
    try {
      const language = this.musicLanguages.create({ name });
      const saved = await this.musicLanguages.save(language);
      await this.redisService.del(MUSIC_LANGUAGES_CACHE_KEY);
      return saved;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(MusicLanguagesMessages.musicLanguageAlreadyExists(name));
      }
      throw this.toHttpException(error, MusicLanguagesMessages.createLanguageFailed(name));
    }
  }

  async update(id: string, name: string): Promise<MusicLanguage> {
    try {
      const language = await this.getById(id);
      language.name = name;
      const saved = await this.musicLanguages.save(language);
      await this.redisService.del(MUSIC_LANGUAGES_CACHE_KEY);
      return saved;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(MusicLanguagesMessages.musicLanguageAlreadyExists(name));
      }
      throw this.toHttpException(error, MusicLanguagesMessages.updateLanguageFailed(id));
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.musicLanguages.delete(id);
      if (!result.affected) {
        throw new NotFoundException(MusicLanguagesMessages.musicLanguageNotFound(id));
      }
      await this.redisService.del(MUSIC_LANGUAGES_CACHE_KEY);
    } catch (error) {
      throw this.toHttpException(error, MusicLanguagesMessages.removeLanguageFailed(id));
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
