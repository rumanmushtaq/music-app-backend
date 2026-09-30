import 'reflect-metadata';
// Must load before AppModule: several modules (e.g. ClerkAuthGuard) read process.env at
// module-load time, which is before ConfigModule.forRoot() would otherwise populate it -
// that left CLERK_SECRET_KEY undefined for the whole app's lifetime.
import 'dotenv/config';
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Music App API')
    .setDescription(
      'Endpoints marked with a lock icon need a Clerk bearer token. Endpoints tagged "Admin" additionally require the ' +
        'authenticated user\'s stored role to be "admin" (checked by AdminGuard) - a valid token alone is not enough for those.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Clerk session token (from the mobile app\'s auth state)' },
      'clerk-token',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Swagger docs: http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
