import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

import { CommonMessages } from '../constants/message';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = exception.constructor.name;
      const body = exception.getResponse();

      let message: string = CommonMessages.unexpectedError;
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body && 'message' in body) {
        const raw = (body as { message: string | string[] }).message;
        message = Array.isArray(raw) ? raw.join(', ') : raw;
      }

      response.status(status).json({ error: { code, message } });
      return;
    }

    // A real bug, not a deliberate HttpException - never forward its message to the
    // client (it can leak internal details like DB constraint text), but keep the
    // full error in server logs so it's still debuggable.
    this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: { code: 'InternalServerError', message: CommonMessages.unexpectedError } });
  }
}
