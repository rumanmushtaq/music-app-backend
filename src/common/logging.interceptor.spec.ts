import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  it('passes graphql calls through without reading an HTTP request', async () => {
    const interceptor = new LoggingInterceptor();
    const switchToHttp = jest.fn();
    const context = { getType: () => 'graphql', switchToHttp } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('result') };

    await expect(lastValueFrom(interceptor.intercept(context, next))).resolves.toBe('result');
    expect(switchToHttp).not.toHaveBeenCalled();
  });
});
