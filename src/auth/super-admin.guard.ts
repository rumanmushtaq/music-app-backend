import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { AuthMessages } from '../constants/message';
import { requestFromContext } from './request-from-context';

// Runs after ClerkAuthGuard, same pairing rule as AdminGuard: @UseGuards(ClerkAuthGuard, SuperAdminGuard).
// Strict check - only 'superAdmin' passes, unlike AdminGuard which also accepts plain 'admin'.
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = requestFromContext(context);
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
