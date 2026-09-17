import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Plan } from './plan.entity';
import { PLAN_IDS } from '../constants/plan';
import { PlansMessages } from '../constants/message';

const SEED_PLANS: Plan[] = [
  {
    id: PLAN_IDS.free,
    tier: 'free',
    name: 'Musinto Free',
    durationLabel: 'Unlimited',
    durationDays: null,
    originalPrice: '0.00',
    currency: 'USD',
    discountPercent: 0,
    features: ['Ad-Supported Streaming', 'Limited Skips'],
  },
  {
    id: PLAN_IDS.pro,
    tier: 'pro',
    name: 'Musinto Pro',
    durationLabel: '1 Month',
    durationDays: 30,
    originalPrice: '9.99',
    currency: 'USD',
    discountPercent: 20,
    features: ['Unlimited Music', "Ad's Free Experience", 'Offline Downloads'],
  },
  {
    id: PLAN_IDS.black,
    tier: 'black',
    name: 'Musinto Black',
    durationLabel: '1 Year',
    durationDays: 365,
    originalPrice: '99.99',
    currency: 'USD',
    discountPercent: 30,
    features: ['Unlimited Music', 'AI Features', "Ad's Free Experience", 'Lossless Audio', 'Offline Downloads'],
  },
];

@Injectable()
export class PlansService implements OnModuleInit {
  constructor(
    @InjectRepository(Plan)
    private readonly plans: Repository<Plan>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const plan of SEED_PLANS) {
      const existing = await this.plans.findOne({ where: { id: plan.id } });
      if (existing) {
        await this.plans.save(this.plans.merge(existing, plan));
      } else {
        await this.plans.save(this.plans.create(plan));
      }
    }
  }

  async getAll(): Promise<Plan[]> {
    const order = ['free', 'pro', 'black'];
    const plans = await this.plans.find();
    return plans.sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));
  }

  async getById(id: string): Promise<Plan> {
    const plan = await this.plans.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(PlansMessages.planNotFound(id));
    }
    return plan;
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
