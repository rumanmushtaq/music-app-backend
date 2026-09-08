import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import type { AuthClaims } from '../auth/clerk-auth.guard';

type AuthedRequest = Request & { auth?: AuthClaims };

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization'];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive)) ? '[REDACTED]' : redact(val),
      ]),
    );
  }
  return value;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response.statusCode, start),
        error: (error: unknown) => {
          const status = error instanceof HttpException ? error.getStatus() : 500;
          this.log(request, status, start);
        },
      }),
    );
  }

  private log(request: AuthedRequest, status: number, start: number): void {
    const duration = Date.now() - start;
    const userId = request.auth?.userId ?? '-';
    const query =
      request.query && Object.keys(request.query).length ? ` query=${JSON.stringify(request.query)}` : '';
    const body =
      request.body && Object.keys(request.body).length ? ` body=${JSON.stringify(redact(request.body))}` : '';

    this.logger.log(
      `${request.method} ${request.originalUrl} ${status} ${duration}ms user=${userId}${query}${body}`,
    );
  }
}
