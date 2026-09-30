import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { LibraryService } from './library.service';

@ApiTags('Library')
@ApiBearerAuth('clerk-token')
@Controller('api/library')
@UseGuards(ClerkAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  getLibrary() {
    return this.libraryService.getLibrary();
  }
}
