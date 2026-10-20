import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { ApolloDriverConfig } from '@nestjs/apollo';

import { buildDatabaseConfig } from './config/database.config';
import { buildGraphqlConfig } from './config/graphql.config';
import { RedisModule } from './redis/redis.module';
import { MeController } from './auth/me.controller';
import { LoginController } from './auth/login.controller';
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
import { PlaysModule } from './plays/plays.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(buildDatabaseConfig()),
    GraphQLModule.forRoot<ApolloDriverConfig>(buildGraphqlConfig()),
    RedisModule,
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
    PlaysModule,
    AdminDashboardModule,
  ],
  controllers: [MeController, LoginController],
})
export class AppModule {}
