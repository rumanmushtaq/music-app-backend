import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../orders/order.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { PlansService } from '../plans/plans.service';
import { UsersService } from '../users/users.service';
import { lookupTaxRate } from '../common/tax.util';
import { maskEmail } from '../common/mask-email.util';
import { PaymentFailedException } from '../common/payment-failed.exception';
import { GooglePlayVerificationService } from './google-play-verification.service';
import { CheckoutMessages } from '../constants/messages';

type Money = number;

function round2(value: number): Money {
  return Number(value.toFixed(2));
}

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    private readonly plansService: PlansService,
    private readonly usersService: UsersService,
    private readonly googlePlayVerification: GooglePlayVerificationService,
  ) {}

  async createOrder(clerkId: string, email: string, planId: string) {
    const user = await this.usersService.upsertByClerkId(clerkId, email);
    const plan = await this.plansService.getById(planId);

    const basePrice = Number(plan.originalPrice);
    const discountedPrice = this.plansService.computeDiscountedPrice(plan);
    const discountAmount = round2(basePrice - discountedPrice);
    const subtotal = round2(basePrice - discountAmount);

    const order = this.orders.create({
      userId: user.id,
      planId: plan.id,
      countryCode: null,
      stateCode: null,
      basePrice: basePrice.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: null,
      taxLabel: null,
      subtotal: subtotal.toFixed(2),
      status: 'pending',
      paidAt: null,
      paymentAccountEmailMasked: null,
    });
    const saved = await this.orders.save(order);

    return {
      orderId: saved.id,
      plan: this.plansService.toPublicPlan(plan, this.usersService.effectivePlanId(user)),
      basePrice,
      discountAmount,
      taxAmount: null,
      taxLabel: null,
      subtotal,
      requiresAddress: true,
    };
  }

  async setAddress(clerkId: string, orderId: string, countryCode: string, stateCode?: string | null) {
    const { order } = await this.loadOwnedOrder(clerkId, orderId);

    const basePrice = Number(order.basePrice);
    const discountAmount = Number(order.discountAmount);
    const taxRate = lookupTaxRate(countryCode, stateCode);

    let taxAmount: number | null = null;
    let taxLabel: string | null = null;
    if (taxRate) {
      taxAmount = round2((basePrice - discountAmount) * taxRate.rate);
      taxLabel = taxRate.label;
    }
    const subtotal = round2(basePrice - discountAmount + (taxAmount ?? 0));

    order.countryCode = countryCode;
    order.stateCode = stateCode ?? null;
    order.taxAmount = taxAmount === null ? null : taxAmount.toFixed(2);
    order.taxLabel = taxLabel;
    order.subtotal = subtotal.toFixed(2);
    await this.orders.save(order);

    return { orderId: order.id, basePrice, discountAmount, taxAmount, taxLabel, subtotal };
  }

  async pay(clerkId: string, email: string, orderId: string, paymentProvider: string, paymentToken: string) {
    const { order, user } = await this.loadOwnedOrder(clerkId, orderId);

    if (order.status !== 'pending') {
      throw new BadRequestException(CheckoutMessages.orderAlreadyStatus(order.status));
    }

    const verification = await this.googlePlayVerification.verifyPurchaseToken(order.planId, paymentToken);
    if (!verification.valid) {
      order.status = 'failed';
      await this.orders.save(order);
      throw new PaymentFailedException(CheckoutMessages.paymentVerificationFailed);
    }

    order.status = 'paid';
    order.paidAt = new Date();
    order.paymentProvider = paymentProvider;
    order.paymentAccountEmailMasked = maskEmail(email);
    await this.orders.save(order);

    const plan = await this.plansService.getById(order.planId);
    const startedAt = new Date();
    const expiresAt = plan.durationDays
      ? new Date(startedAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
      : null;

    let subscription = await this.subscriptions.findOne({ where: { userId: user.id } });
    if (!subscription) {
      subscription = this.subscriptions.create({ userId: user.id });
    }
    subscription.planId = plan.id;
    subscription.status = 'active';
    subscription.startedAt = startedAt;
    subscription.expiresAt = expiresAt;
    await this.subscriptions.save(subscription);

    await this.usersService.setCurrentPlan(clerkId, plan.id);

    return {
      orderId: order.id,
      status: 'paid' as const,
      subscription: { planId: plan.id, startedAt, expiresAt },
    };
  }

  async getOrder(clerkId: string, orderId: string) {
    const { order } = await this.loadOwnedOrder(clerkId, orderId);
    const plan = await this.plansService.getById(order.planId);

    return {
      orderId: order.id,
      status: order.status,
      plan: this.plansService.toPublicPlan(plan, order.planId),
      basePrice: Number(order.basePrice),
      discountAmount: Number(order.discountAmount),
      taxAmount: order.taxAmount === null ? null : Number(order.taxAmount),
      taxLabel: order.taxLabel,
      subtotal: Number(order.subtotal),
      paymentAccountEmail: order.paymentAccountEmailMasked,
    };
  }

  private async loadOwnedOrder(clerkId: string, orderId: string) {
    const user = await this.usersService.findByClerkIdOrThrow(clerkId);
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order || order.userId !== user.id) {
      throw new NotFoundException(CheckoutMessages.orderNotFound(orderId));
    }
    return { order, user };
  }
}
