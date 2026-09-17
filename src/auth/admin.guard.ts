import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { UsersService } from '../users/users.service';
import type { AuthClaims } from './clerk-auth.guard';
import { AuthMessages } from '../constants/message';

// Runs after ClerkAuthGuard (which only verifies identity) - this checks the
// authenticated user's stored role, so it must always be paired with
// ClerkAuthGuard: @UseGuards(ClerkAuthGuard, AdminGuard).
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { auth?: AuthClaims }>();
    if (!request.auth) {
      throw new UnauthorizedException(AuthMessages.missingBearerToken);
    }

    const user = await this.usersService.findByClerkIdOrThrow(request.auth.userId);
    if (user.role !== 'admin') {
      throw new ForbiddenException(AuthMessages.adminAccessRequired);
    }

    return true;
  }
}
