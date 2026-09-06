import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';

import { AuthClaims, ClerkAuthGuard, clerkClient } from '../auth/clerk-auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { PlansService } from '../plans/plans.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

type UpdateProfileBody = Partial<
  Pick<User, 'name' | 'avatarUrl' | 'notificationsEnabled' | 'darkModeEnabled' | 'musicLanguage'>
>;

@Controller('api')
@UseGuards(ClerkAuthGuard)
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly plansService: PlansService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentAuth() auth: AuthClaims) {
    const user = await this.usersService.upsertByClerkId(auth.userId, auth.email);
    return this.toProfileResponse(user);
  }

  @Patch('profile')
  async updateProfile(@CurrentAuth() auth: AuthClaims, @Body() body: UpdateProfileBody) {
    await this.usersService.upsertByClerkId(auth.userId, auth.email);
    const user = await this.usersService.updateProfile(auth.userId, body);
    return this.toProfileResponse(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentAuth() auth: AuthClaims): Promise<void> {
    if (auth.sessionId) {
      try {
        await clerkClient.sessions.revokeSession(auth.sessionId);
      } catch {
        // Best-effort: the client also discards its local token regardless.
      }
    }
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
      darkModeEnabled: user.darkModeEnabled,
      musicLanguage: user.musicLanguage,
      currentPlan: { id: plan.id, name: plan.name, tier: plan.tier },
    };
  }
}
