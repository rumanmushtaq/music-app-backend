import 'reflect-metadata';
// Must load before AppModule: several modules (e.g. ClerkAuthGuard) read process.env at
// module-load time, which is before ConfigModule.forRoot() would otherwise populate it -
// that left CLERK_SECRET_KEY undefined for the whole app's lifetime.
import 'dotenv/config';
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net';
import { NestFactory } from '@nestjs/core';

// Node races every address a hostname resolves to and abandons each after 250ms by
// default. A managed Postgres host resolves to several addresses and its TLS handshake
// takes seconds from a distant region, so the default makes connections fail with an
// opaque AggregateError [ETIMEDOUT] long before the handshake could finish.
setDefaultAutoSelectFamilyAttemptTimeout(5000);

import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
