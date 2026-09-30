import { BadRequestException, Body, Controller, ForbiddenException, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { clerkClient } from './clerk-auth.guard';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { AuthMessages } from '../constants/message';
import { LOGIN_ATTEMPT_LIMIT, LOGIN_ATTEMPT_WINDOW_SECONDS, loginAttemptsCacheKey } from '../constants/cache';

type LoginBody = { email?: string; password?: string };

@ApiTags('Auth')
@Controller('auth')
export class LoginController {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  // This endpoint proxies password verification to Clerk's Backend API for teams/tools
  // (e.g. Swagger, internal admin panels) that can't run the mobile app's Clerk client SDK.
  // It bypasses Clerk's own client-side bot/rate protection, hence the attempt throttle below.
  @Post('login')
  @ApiOperation({
    summary: 'Log in with email + password',
    description:
      'Verifies credentials against Clerk and returns a Clerk session bearer token. Paste the returned token into ' +
      'the "Authorize" button above to call the rest of this API, including [Admin]-tagged endpoints.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', example: 'admin@example.com' },
        password: { type: 'string', example: 'hunter2' },
      },
    },
  })
  async login(@Body() body: LoginBody, @Req() request: Request) {
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    if (!email || !password) {
      throw new BadRequestException(AuthMessages.emailAndPasswordRequired);
    }

    const ip = request.ip ?? 'unknown';
    const attempts = await this.redisService.incrWithExpiry(loginAttemptsCacheKey(email, ip), LOGIN_ATTEMPT_WINDOW_SECONDS);
    if (attempts > LOGIN_ATTEMPT_LIMIT) {
      throw new ForbiddenException(AuthMessages.tooManyLoginAttempts);
    }

    const { data: matches } = await clerkClient.users.getUserList({ emailAddress: [email] });
    const clerkUser = matches[0];
    if (!clerkUser) {
      throw new UnauthorizedException(AuthMessages.invalidCredentials);
    }

    try {
      await clerkClient.users.verifyPassword({ userId: clerkUser.id, password });
    } catch {
      throw new UnauthorizedException(AuthMessages.invalidCredentials);
    }

    const session = await clerkClient.sessions.createSession({ userId: clerkUser.id });
    const { jwt } = await clerkClient.sessions.getToken(session.id, '');

    const primaryEmail =
      clerkUser.emailAddresses.find((entry) => entry.id === clerkUser.primaryEmailAddressId)?.emailAddress
        ?? clerkUser.emailAddresses[0]?.emailAddress
        ?? email;
    const user = await this.usersService.upsertByClerkId(clerkUser.id, primaryEmail);

    return { token: jwt, user: { id: user.id, email: user.email, role: user.role } };
  }
}
