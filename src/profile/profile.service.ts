import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { AuthClaims, clerkClient } from '../auth/clerk-auth.guard';
import { PROFILE_CACHE_TTL_SECONDS } from '../constants/cache';
import { CommonMessages, ProfileMessages } from '../constants/message';
import { PlansService } from '../plans/plans.service';
import { RedisService } from '../redis/redis.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

export type UpdateProfileBody = Partial<
  Pick<User, 'name' | 'avatarUrl' | 'notificationsEnabled' | 'themePreference' | 'musicLanguageId'>
>;

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly plansService: PlansService,
    private readonly redisService: RedisService,
  ) {}

  async getProfile(auth: AuthClaims) {
    try {
      return await this.redisService.getOrSet(this.profileCacheKey(auth.userId), PROFILE_CACHE_TTL_SECONDS, async () => {
        const user = await this.usersService.upsertByClerkId(auth.userId, auth.email);
        return this.toProfileResponse(user);
      });
    } catch (error) {
      throw this.toHttpException(error, ProfileMessages.loadProfileFailed(auth.userId));
    }
  }

  async updateProfile(auth: AuthClaims, body: UpdateProfileBody) {
    try {
      await this.usersService.upsertByClerkId(auth.userId, auth.email);
      const user = await this.usersService.updateProfile(auth.userId, body);
      const profile = await this.toProfileResponse(user);
      await this.redisService.del(this.profileCacheKey(auth.userId));
      return profile;
    } catch (error) {
      throw this.toHttpException(error, ProfileMessages.updateProfileFailed(auth.userId));
    }
  }

  async logout(auth: AuthClaims): Promise<void> {
    if (auth.sessionId) {
      try {
        await clerkClient.sessions.revokeSession(auth.sessionId);
      } catch (error) {
        // Best-effort: the client also discards its local token regardless.
        this.logger.debug(
          ProfileMessages.revokeSessionFailed(auth.sessionId),
          error instanceof Error ? error.stack : error,
        );
      }
    }
  }

  private profileCacheKey(userId: string): string {
    return `profile:${userId}`;
  }

  private toHttpException(error: unknown, context: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    this.logger.error(context, error instanceof Error ? error.stack : error);
    return new InternalServerErrorException(CommonMessages.unexpectedError);
  }

  private async toProfileResponse(user: User) {
    const currentPlanId = this.usersService.effectivePlanId(user);
    const plan = await this.plansService.getById(currentPlanId);
    return {
      id: user.id,
      name: user.name ?? null,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      notificationsEnabled: user.notificationsEnabled,
      themePreference: user.themePreference,
      musicLanguageId: user.musicLanguageId ?? null,
      currentPlan: { id: plan.id, name: plan.name, tier: plan.tier },
    };
  }
}
