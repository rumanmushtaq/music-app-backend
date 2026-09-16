import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { buildDatabaseConfig } from './config/database.config';
import { MeController } from './auth/me.controller';
import { UsersModule } from './users/users.module';
import { HomeModule } from './home/home.module';
import { PodcastsModule } from './podcasts/podcasts.module';
import { SearchModule } from './search/search.module';
import { PlansModule } from './plans/plans.module';
import { ProfileModule } from './profile/profile.module';
import { CheckoutModule } from './checkout/checkout.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AiSearchModule } from './ai-search/ai-search.module';
import { LibraryModule } from './library/library.module';
import { MusicLanguagesModule } from './music-languages/music-languages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(buildDatabaseConfig()),
    UsersModule,
    HomeModule,
    PodcastsModule,
    SearchModule,
    PlansModule,
    ProfileModule,
    CheckoutModule,
    SubscriptionsModule,
    AiSearchModule,
    LibraryModule,
    MusicLanguagesModule,
  ],
  controllers: [MeController],
})
export class AppModule {}
