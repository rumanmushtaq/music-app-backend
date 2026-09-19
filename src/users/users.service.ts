import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity';
import { CommonMessages, UsersMessages } from '../constants/message';
import { PLAN_IDS } from '../constants/plan';
import { isUniqueViolation } from '../common/db-errors.util';
import { USERS_CACHE_TTL_SECONDS, userCacheKey } from '../constants/cache';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async upsertByClerkId(clerkId: string, email: string): Promise<User> {
    try {
      const existing = await this.users.findOne({ where: { clerkId } });
      if (existing) {
        if (existing.email !== email) {
          existing.email = email;
          const saved = await this.users.save(existing);
          await this.redisService.del(userCacheKey(clerkId));
          return saved;
        }
        return existing;
      }

      const created = this.users.create({ clerkId, email });
      try {
        const saved = await this.users.save(created);
        await this.redisService.del(userCacheKey(clerkId));
        return saved;
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
    } catch (error) {
      throw this.toHttpException(error, UsersMessages.upsertUserFailed(clerkId));
    }
  }

  async findByClerkIdOrThrow(clerkId: string): Promise<User> {
    try {
      return await this.redisService.getOrSet(userCacheKey(clerkId), USERS_CACHE_TTL_SECONDS, async () => {
        const user = await this.users.findOne({ where: { clerkId } });
        if (!user) {
          throw new NotFoundException(UsersMessages.userNotFound);
        }
        return user;
      });
    } catch (error) {
      throw this.toHttpException(error, UsersMessages.userNotFound);
    }
  }

  effectivePlanId(user: User): string {
    return user.currentPlanId ?? PLAN_IDS.free;
  }

  async updateProfile(
    clerkId: string,
    patch: Partial<Pick<User, 'name' | 'avatarUrl' | 'notificationsEnabled' | 'themePreference' | 'musicLanguageId'>>,
  ): Promise<User> {
    try {
      const user = await this.findByClerkIdOrThrow(clerkId);
      Object.assign(user, patch);
      const saved = await this.users.save(user);
      await this.redisService.del(userCacheKey(clerkId));
      return saved;
    } catch (error) {
      throw this.toHttpException(error, UsersMessages.updateUserProfileFailed(clerkId));
    }
  }

  async setCurrentPlan(clerkId: string, planId: string): Promise<User> {
    try {
      const user = await this.findByClerkIdOrThrow(clerkId);
      user.currentPlanId = planId;
      const saved = await this.users.save(user);
      await this.redisService.del(userCacheKey(clerkId));
      return saved;
    } catch (error) {
      throw this.toHttpException(error, UsersMessages.setCurrentPlanFailed(clerkId));
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
