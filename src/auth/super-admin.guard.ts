import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { UsersService } from '../users/users.service';
import type { AuthClaims } from './clerk-auth.guard';
import { AuthMessages } from '../constants/message';

// Runs after ClerkAuthGuard, same pairing rule as AdminGuard: @UseGuards(ClerkAuthGuard, SuperAdminGuard).
// Strict check - only 'superAdmin' passes, unlike AdminGuard which also accepts plain 'admin'.
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { auth?: AuthClaims }>();
    if (!request.auth) {
      throw new UnauthorizedException(AuthMessages.missingBearerToken);
    }

    const user = await this.usersService.findByClerkIdOrThrow(request.auth.userId);
    if (user.role !== 'superAdmin') {
      throw new ForbiddenException(AuthMessages.superAdminAccessRequired);
    }

    return true;
  }
}
