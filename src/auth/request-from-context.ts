import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';
import type { Request } from 'express';

import type { AuthClaims } from './clerk-auth.guard';

// Guards and param decorators run for both REST and GraphQL calls. A GraphQL call has no
// HTTP request at switchToHttp(); the Express request lives on the GraphQL context instead
// (see `context: ({ req }) => ({ req })` in app.module.ts).
export function requestFromContext(context: ExecutionContext): Request & { auth?: AuthClaims } {
  return context.getType<GqlContextType>() === 'graphql'
    ? GqlExecutionContext.create(context).getContext().req
    : context.switchToHttp().getRequest();
}
