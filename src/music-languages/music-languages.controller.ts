import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { AdminGuard } from '../auth/admin.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { MusicLanguagesService } from './music-languages.service';

type MusicLanguageBody = { name: string };

const MUSIC_LANGUAGE_BODY_SCHEMA = {
  schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Punjabi' } } },
};

@ApiTags('Music Languages')
@ApiBearerAuth('clerk-token')
@Controller('api/music-languages')
@UseGuards(ClerkAuthGuard)
export class MusicLanguagesController {
  constructor(private readonly musicLanguagesService: MusicLanguagesService) {}

  @Get()
  @ApiOperation({ summary: 'List music languages' })
  async list() {
    return this.musicLanguagesService.getAll();
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Create a music language', description: 'Requires the caller\'s role to be "admin".' })
  @ApiBody(MUSIC_LANGUAGE_BODY_SCHEMA)
  async create(@Body() body: MusicLanguageBody) {
    return this.musicLanguagesService.create(body.name);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Update a music language', description: 'Requires the caller\'s role to be "admin".' })
  @ApiParam({ name: 'id' })
  @ApiBody(MUSIC_LANGUAGE_BODY_SCHEMA)
  async update(@Param('id') id: string, @Body() body: MusicLanguageBody) {
    return this.musicLanguagesService.update(id, body.name);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '[Admin] Delete a music language', description: 'Requires the caller\'s role to be "admin".' })
  @ApiParam({ name: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.musicLanguagesService.remove(id);
  }
}
