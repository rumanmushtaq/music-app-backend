import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { UsersMessages } from '../constants/messages';
import { isUniqueViolation } from '../common/db-errors.util';

export const FREE_PLAN_ID = 'free';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async upsertByClerkId(clerkId: string, email: string): Promise<User> {
    const existing = await this.users.findOne({ where: { clerkId } });
    if (existing) {
      if (existing.email !== email) {
        existing.email = email;
        return this.users.save(existing);
      }
      return existing;
    }

    const created = this.users.create({ clerkId, email });
    try {
      return await this.users.save(created);
    } catch (error) {
      // Two concurrent requests for a brand-new clerkId can both pass the
      // `existing` check above and race to insert; the loser hits the unique
      // constraint on clerkId instead of a real failure, so fall back to the
      // row the winner just created.
      if (isUniqueViolation(error)) {
        return this.findByClerkIdOrThrow(clerkId);
      }
      throw error;
    }
  }

  async findByClerkIdOrThrow(clerkId: string): Promise<User> {
    const user = await this.users.findOne({ where: { clerkId } });
    if (!user) {
      throw new NotFoundException(UsersMessages.userNotFound);
    }
    return user;
  }

  effectivePlanId(user: User): string {
    return user.currentPlanId ?? FREE_PLAN_ID;
  }

  async updateProfile(
    clerkId: string,
    patch: Partial<Pick<User, 'name' | 'avatarUrl' | 'notificationsEnabled' | 'themePreference' | 'musicLanguageId'>>,
  ): Promise<User> {
    const user = await this.findByClerkIdOrThrow(clerkId);
    Object.assign(user, patch);
    return this.users.save(user);
  }

  async setCurrentPlan(clerkId: string, planId: string): Promise<User> {
    const user = await this.findByClerkIdOrThrow(clerkId);
    user.currentPlanId = planId;
    return this.users.save(user);
  }
}
