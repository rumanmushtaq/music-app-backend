import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthClaims } from './clerk-auth.guard';

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext): AuthClaims => {
  const request = context.switchToHttp().getRequest<Request & { auth?: AuthClaims }>();
  return request.auth as AuthClaims;
});
