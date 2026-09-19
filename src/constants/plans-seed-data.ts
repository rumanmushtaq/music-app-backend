import { Plan } from '../plans/plan.entity';
import { PLAN_IDS } from './plan';

export const PLANS_SEED: Plan[] = [
  {
    id: PLAN_IDS.free,
    tier: 'free',
    name: 'Musinto Free',
    durationLabel: 'Unlimited',
    durationDays: null,
    originalPrice: '0.00',
    currency: 'USD',
    discountPercent: 0,
    features: ['Ad-Supported Streaming', 'Limited Skips'],
  },
  {
    id: PLAN_IDS.pro,
    tier: 'pro',
    name: 'Musinto Pro',
    durationLabel: '1 Month',
    durationDays: 30,
    originalPrice: '9.99',
    currency: 'USD',
    discountPercent: 20,
    features: ['Unlimited Music', "Ad's Free Experience", 'Offline Downloads'],
  },
  {
    id: PLAN_IDS.black,
    tier: 'black',
    name: 'Musinto Black',
    durationLabel: '1 Year',
    durationDays: 365,
    originalPrice: '99.99',
    currency: 'USD',
    discountPercent: 30,
    features: ['Unlimited Music', 'AI Features', "Ad's Free Experience", 'Lossless Audio', 'Offline Downloads'],
  },
];
