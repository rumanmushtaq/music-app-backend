import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../auth/admin.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { MusicLanguagesService } from './music-languages.service';

type MusicLanguageBody = { name: string };

@Controller('api/music-languages')
@UseGuards(ClerkAuthGuard)
export class MusicLanguagesController {
  constructor(private readonly musicLanguagesService: MusicLanguagesService) {}

  @Get()
  async list() {
    return this.musicLanguagesService.getAll();
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() body: MusicLanguageBody) {
    return this.musicLanguagesService.create(body.name);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(@Param('id') id: string, @Body() body: MusicLanguageBody) {
    return this.musicLanguagesService.update(id, body.name);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.musicLanguagesService.remove(id);
  }
}
