import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subscription } from './subscription.entity';
import { UsersService } from '../users/users.service';
import { CommonMessages, SubscriptionsMessages } from '../constants/message';
import { PLAN_IDS } from '../constants/plan';
import { SUBSCRIPTIONS_CACHE_TTL_SECONDS, subscriptionCacheKey } from '../constants/cache';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async getCurrent(clerkId: string) {
    try {
      const user = await this.usersService.findByClerkIdOrThrow(clerkId);
      return await this.redisService.getOrSet(
        subscriptionCacheKey(user.id),
        SUBSCRIPTIONS_CACHE_TTL_SECONDS,
        async () => {
          const subscription = await this.subscriptions.findOne({ where: { userId: user.id } });
          if (!subscription) {
            return { planId: PLAN_IDS.free, status: 'active' as const, startedAt: null, expiresAt: null };
          }
          return {
            planId: subscription.planId,
            status: subscription.status,
            startedAt: subscription.startedAt,
            expiresAt: subscription.expiresAt,
          };
        },
      );
    } catch (error) {
      throw this.toHttpException(error, SubscriptionsMessages.loadSubscriptionFailed(clerkId));
    }
  }

  async cancel(clerkId: string) {
    try {
      const user = await this.usersService.findByClerkIdOrThrow(clerkId);
      const subscription = await this.subscriptions.findOne({ where: { userId: user.id } });

      if (!subscription || subscription.status !== 'active') {
        throw new BadRequestException(SubscriptionsMessages.noActiveSubscription);
      }

      subscription.status = 'canceled';
      await this.subscriptions.save(subscription);
      await this.redisService.del(subscriptionCacheKey(user.id));

      return {
        planId: subscription.planId,
        status: subscription.status,
        startedAt: subscription.startedAt,
        expiresAt: subscription.expiresAt,
      };
    } catch (error) {
      throw this.toHttpException(error, SubscriptionsMessages.cancelSubscriptionFailed(clerkId));
    }
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }
}
