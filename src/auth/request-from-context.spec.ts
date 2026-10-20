import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { requestFromContext } from './request-from-context';

describe('requestFromContext', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the HTTP request for an http context', () => {
    const req = { headers: {} };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    expect(requestFromContext(context)).toBe(req);
  });

  it('returns context.req for a graphql context', () => {
    const req = { headers: {} };
    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue({ getContext: () => ({ req }) } as unknown as GqlExecutionContext);
    const context = {
      getType: () => 'graphql',
      switchToHttp: () => {
        throw new Error('switchToHttp must not be used for graphql');
      },
    } as unknown as ExecutionContext;

    expect(requestFromContext(context)).toBe(req);
  });
});
