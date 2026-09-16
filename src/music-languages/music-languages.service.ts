import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MusicLanguage } from './music-language.entity';
import { MusicLanguagesMessages } from '../constants/messages';
import { isUniqueViolation } from '../common/db-errors.util';

@Injectable()
export class MusicLanguagesService {
  constructor(
    @InjectRepository(MusicLanguage)
    private readonly musicLanguages: Repository<MusicLanguage>,
  ) {}

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
