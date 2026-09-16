import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subscription } from './subscription.entity';
import { UsersService } from '../users/users.service';
import { SubscriptionsMessages } from '../constants/messages';

const FREE_PLAN_ID = 'free';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    private readonly usersService: UsersService,
  ) {}

  async getCurrent(clerkId: string) {
    const user = await this.usersService.findByClerkIdOrThrow(clerkId);
    const subscription = await this.subscriptions.findOne({ where: { userId: user.id } });

    if (!subscription) {
      return { planId: FREE_PLAN_ID, status: 'active' as const, startedAt: null, expiresAt: null };
    }

    return {
      planId: subscription.planId,
      status: subscription.status,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
    };
  }

  async cancel(clerkId: string) {
    const user = await this.usersService.findByClerkIdOrThrow(clerkId);
    const subscription = await this.subscriptions.findOne({ where: { userId: user.id } });

    if (!subscription || subscription.status !== 'active') {
      throw new BadRequestException(SubscriptionsMessages.noActiveSubscription);
    }

    subscription.status = 'canceled';
    await this.subscriptions.save(subscription);

    return {
      planId: subscription.planId,
      status: subscription.status,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
    };
  }
}
