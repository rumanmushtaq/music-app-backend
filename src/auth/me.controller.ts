import { Controller, Get, UseGuards } from '@nestjs/common';

import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CurrentAuth } from './current-auth.decorator';
import { AuthClaims, ClerkAuthGuard } from './clerk-auth.guard';

@Controller()
export class MeController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async me(@CurrentAuth() auth: AuthClaims): Promise<User> {
    return this.usersService.upsertByClerkId(auth.userId, auth.email);
  }
}
