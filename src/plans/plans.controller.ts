import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { AuthClaims, ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { UsersService } from '../users/users.service';
import { PlansService } from './plans.service';

@Controller('api/plans')
@UseGuards(ClerkAuthGuard)
export class PlansController {
  constructor(
    private readonly plansService: PlansService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async list(@CurrentAuth() auth: AuthClaims) {
    const user = await this.usersService.upsertByClerkId(auth.userId, auth.email);
    const currentPlanId = this.usersService.effectivePlanId(user);
    const plans = await this.plansService.getAll();
    return plans.map((plan) => this.plansService.toPublicPlan(plan, currentPlanId));
  }

  @Get(':planId')
  async getOne(@Param('planId') planId: string, @CurrentAuth() auth: AuthClaims) {
    const user = await this.usersService.upsertByClerkId(auth.userId, auth.email);
    const currentPlanId = this.usersService.effectivePlanId(user);
    const plan = await this.plansService.getById(planId);
    return this.plansService.toPublicPlan(plan, currentPlanId);
  }
}
