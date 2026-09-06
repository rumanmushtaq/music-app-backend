import { Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AuthClaims, ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { SubscriptionsService } from './subscriptions.service';

@Controller('api/subscription')
@UseGuards(ClerkAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  getCurrent(@CurrentAuth() auth: AuthClaims) {
    return this.subscriptionsService.getCurrent(auth.userId);
  }

  @Post('cancel')
  cancel(@CurrentAuth() auth: AuthClaims) {
    return this.subscriptionsService.cancel(auth.userId);
  }
}
