import 'reflect-metadata';
// Must load before AppModule: several modules (e.g. ClerkAuthGuard) read process.env at
// module-load time, which is before ConfigModule.forRoot() would otherwise populate it -
// that left CLERK_SECRET_KEY undefined for the whole app's lifetime.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
