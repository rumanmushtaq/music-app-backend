import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import type { Request } from 'express';

import { AuthMessages } from '../constants/message';

export type AuthClaims = {
  userId: string;
  email: string;
  sessionId?: string;
};


export const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// DEV-ONLY: widens verifyToken's exp/nbf/iat tolerance to paper over a dev machine/container
// whose system clock is out of sync with real-world time (Clerk tokens are stamped with real
// time, so every token looks expired otherwise). Unset in any real deployment - CLERK_DEV_CLOCK_SKEW_MS
// must never be set outside a local dev environment, since it weakens token expiry checking.
const DEV_CLOCK_SKEW_MS = Number(process.env.CLERK_DEV_CLOCK_SKEW_MS ?? 0) || undefined;

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { auth?: AuthClaims }>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

    if (!token) {
      throw new UnauthorizedException(AuthMessages.missingBearerToken);
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        clockSkewInMs: DEV_CLOCK_SKEW_MS,
      });
      const user = await clerkClient.users.getUser(payload.sub);
      const email = user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress
        ?? user.emailAddresses[0]?.emailAddress
        ?? '';

      request.auth = { userId: payload.sub, email, sessionId: payload.sid };
      return true;
    } catch {
      throw new UnauthorizedException(AuthMessages.invalidOrExpiredToken);
    }
  }
}
