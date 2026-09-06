import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order } from '../orders/order.entity';
import { PlansModule } from '../plans/plans.module';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { GooglePlayVerificationService } from './google-play-verification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), PlansModule, UsersModule, SubscriptionsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, GooglePlayVerificationService],
})
export class CheckoutModule {}
