import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';

import { AuthClaims, ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { ProfileService, UpdateProfileBody } from './profile.service';

@Controller('api')
@UseGuards(ClerkAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  async getProfile(@CurrentAuth() auth: AuthClaims) {
    return this.profileService.getProfile(auth);
  }

  @Patch('profile')
  async updateProfile(@CurrentAuth() auth: AuthClaims, @Body() body: UpdateProfileBody) {
    return this.profileService.updateProfile(auth, body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentAuth() auth: AuthClaims): Promise<void> {
    return this.profileService.logout(auth);
  }
}
