import { ArgumentsHost, ForbiddenException, InternalServerErrorException } from '@nestjs/common';

import { CommonMessages } from '../constants/message';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  beforeEach(() => jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  const graphqlHost = () => {
    const switchToHttp = jest.fn();
    return { host: { getType: () => 'graphql', switchToHttp } as unknown as ArgumentsHost, switchToHttp };
  };

  it('graphql host: returns an HttpException unchanged', () => {
    const { host, switchToHttp } = graphqlHost();
    const exception = new ForbiddenException('x');

    expect(filter.catch(exception, host)).toBe(exception);
    expect(switchToHttp).not.toHaveBeenCalled();
  });

  it('graphql host: hides an unknown error', () => {
    const { host } = graphqlHost();

    const result = filter.catch(new Error('db secret'), host);

    expect(result).toBeInstanceOf(InternalServerErrorException);
    expect((result as InternalServerErrorException).message).toBe(CommonMessages.unexpectedError);
    expect((result as InternalServerErrorException).message).not.toContain('db secret');
  });

  it('http host: still writes JSON', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    filter.catch(new ForbiddenException('Admin access required'), host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: { code: 'ForbiddenException', message: 'Admin access required' } });
  });
});
