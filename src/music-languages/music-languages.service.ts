import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MusicLanguage } from './music-language.entity';
import { MusicLanguagesMessages } from '../constants/message';
import { isUniqueViolation } from '../common/db-errors.util';

const SEED_LANGUAGE_NAMES = [
  'English',
  'Hindi',
  'Punjabi',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Malayalam',
];

@Injectable()
export class MusicLanguagesService implements OnModuleInit {
  constructor(
    @InjectRepository(MusicLanguage)
    private readonly musicLanguages: Repository<MusicLanguage>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const name of SEED_LANGUAGE_NAMES) {
      const existing = await this.musicLanguages.findOne({ where: { name } });
      if (!existing) {
        await this.musicLanguages.save(this.musicLanguages.create({ name }));
      }
    }
  }

  async getAll(): Promise<MusicLanguage[]> {
    return this.musicLanguages.find({ order: { name: 'ASC' } });
  }

  async getById(id: string): Promise<MusicLanguage> {
    const language = await this.musicLanguages.findOne({ where: { id } });
    if (!language) {
      throw new NotFoundException(MusicLanguagesMessages.musicLanguageNotFound(id));
    }
    return language;
  }

  async create(name: string): Promise<MusicLanguage> {
    const language = this.musicLanguages.create({ name });
    try {
      return await this.musicLanguages.save(language);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(MusicLanguagesMessages.musicLanguageAlreadyExists(name));
      }
      throw error;
    }
  }

  async update(id: string, name: string): Promise<MusicLanguage> {
    const language = await this.getById(id);
    language.name = name;
    try {
      return await this.musicLanguages.save(language);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(MusicLanguagesMessages.musicLanguageAlreadyExists(name));
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.musicLanguages.delete(id);
    if (!result.affected) {
      throw new NotFoundException(MusicLanguagesMessages.musicLanguageNotFound(id));
    }
  }
}
