import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { MusicLanguage } from './music-language.entity';
import { MusicLanguagesService } from './music-languages.service';
import { MusicLanguagesController } from './music-languages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MusicLanguage]), UsersModule],
  controllers: [MusicLanguagesController],
  providers: [MusicLanguagesService],
  exports: [MusicLanguagesService],
})
export class MusicLanguagesModule {}
