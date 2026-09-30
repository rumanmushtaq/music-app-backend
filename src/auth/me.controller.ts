import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CurrentAuth } from './current-auth.decorator';
import { AuthClaims, ClerkAuthGuard } from './clerk-auth.guard';

@ApiTags('Auth')
@Controller()
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth('clerk-token')
  @UseGuards(ClerkAuthGuard)
  async me(@CurrentAuth() auth: AuthClaims): Promise<User> {
    return this.usersService.upsertByClerkId(auth.userId, auth.email);
  }
}
