import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { AuthMessages } from '../constants/message';
import { requestFromContext } from './request-from-context';

// Runs after ClerkAuthGuard (which only verifies identity) - this checks the
// authenticated user's stored role, so it must always be paired with
// ClerkAuthGuard: @UseGuards(ClerkAuthGuard, AdminGuard).
// Passes for 'admin' AND 'superAdmin' - superAdmin is a superset of admin access.
// For routes that must be superAdmin-only, use SuperAdminGuard instead.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = requestFromContext(context);
    if (!request.auth) {
      throw new UnauthorizedException(AuthMessages.missingBearerToken);
    }

    const user = await this.usersService.findByClerkIdOrThrow(request.auth.userId);
    if (user.role !== 'admin' && user.role !== 'superAdmin') {
      throw new ForbiddenException(AuthMessages.adminAccessRequired);
    }

    return true;
  }
}
