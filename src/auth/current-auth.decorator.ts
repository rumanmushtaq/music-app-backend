import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthClaims } from './clerk-auth.guard';
import { requestFromContext } from './request-from-context';

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext): AuthClaims => {
  return requestFromContext(context).auth as AuthClaims;
});
