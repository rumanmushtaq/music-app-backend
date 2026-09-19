import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Plan } from './plan.entity';
import { PLANS_CACHE_KEY, PLANS_CACHE_TTL_SECONDS, planCacheKey } from '../constants/cache';
import { CommonMessages, PlansMessages } from '../constants/message';
import { PLANS_SEED } from '../constants/plans-seed-data';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly plans: Repository<Plan>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Upsert rather than insert-if-missing: pricing and features must re-sync with the
      // seed on every boot, or existing rows drift away from the source of truth.
      await this.plans.upsert(PLANS_SEED, ['id']);
      await this.redisService.del(PLANS_CACHE_KEY, ...PLANS_SEED.map((plan) => planCacheKey(plan.id)));
    } catch (error) {
      this.logger.error('Failed to seed plans', error instanceof Error ? error.stack : error);
    }
  }

  async getAll(): Promise<Plan[]> {
    try {
      return await this.redisService.getOrSet(PLANS_CACHE_KEY, PLANS_CACHE_TTL_SECONDS, async () => {
        const order = ['free', 'pro', 'black'];
        const plans = await this.plans.find();
        return plans.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));
      });
    } catch (error) {
      throw this.toHttpException(error, PlansMessages.loadPlansFailed);
    }
  }

  async getById(id: string): Promise<Plan> {
    try {
      const plan = await this.redisService.getOrSet(planCacheKey(id), PLANS_CACHE_TTL_SECONDS, () =>
        this.plans.findOne({ where: { id } }),
      );
      if (!plan) {
        throw new NotFoundException(PlansMessages.planNotFound(id));
      }
      return plan;
    } catch (error) {
      throw this.toHttpException(error, PlansMessages.loadPlanFailed(id));
    }
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }

  computeDiscountedPrice(plan: Plan): number {
    const original = Number(plan.originalPrice);
    return Number((original * (1 - plan.discountPercent / 100)).toFixed(2));
  }

  toPublicPlan(plan: Plan, currentPlanId: string) {
    return {
      id: plan.id,
      tier: plan.tier,
      name: plan.name,
      durationLabel: plan.durationLabel,
      durationDays: plan.durationDays,
      originalPrice: Number(plan.originalPrice),
      discountPercent: plan.discountPercent,
      discountedPrice: this.computeDiscountedPrice(plan),
      currency: plan.currency,
      features: plan.features,
      isActiveForUser: plan.id === currentPlanId,
    };
  }
}
