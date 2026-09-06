import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { AuthClaims, ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentAuth } from '../auth/current-auth.decorator';
import { CheckoutService } from './checkout.service';

type CreateOrderBody = { planId: string };
type SetAddressBody = { countryCode: string; stateCode?: string };
type PayBody = { paymentProvider: string; paymentToken: string };

@Controller('api/checkout')
@UseGuards(ClerkAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  createOrder(@CurrentAuth() auth: AuthClaims, @Body() body: CreateOrderBody) {
    return this.checkoutService.createOrder(auth.userId, auth.email, body.planId);
  }

  @Patch(':orderId/address')
  setAddress(
    @CurrentAuth() auth: AuthClaims,
    @Param('orderId') orderId: string,
    @Body() body: SetAddressBody,
  ) {
    return this.checkoutService.setAddress(auth.userId, orderId, body.countryCode, body.stateCode ?? null);
  }

  @Post(':orderId/pay')
  pay(@CurrentAuth() auth: AuthClaims, @Param('orderId') orderId: string, @Body() body: PayBody) {
    return this.checkoutService.pay(auth.userId, auth.email, orderId, body.paymentProvider, body.paymentToken);
  }

  @Get(':orderId')
  getOrder(@CurrentAuth() auth: AuthClaims, @Param('orderId') orderId: string) {
    return this.checkoutService.getOrder(auth.userId, orderId);
  }
}
