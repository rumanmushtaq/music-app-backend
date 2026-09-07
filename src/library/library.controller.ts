import { Controller, Get, UseGuards } from '@nestjs/common';

import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { LibraryService } from './library.service';

@Controller('api/library')
@UseGuards(ClerkAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  getLibrary() {
    return this.libraryService.getLibrary();
  }
}
