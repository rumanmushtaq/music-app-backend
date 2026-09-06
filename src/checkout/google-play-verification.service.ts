import { Injectable } from '@nestjs/common';

@Injectable()
export class GooglePlayVerificationService {
  // Production implementation would call the Google Play Developer API's
  // `purchases.subscriptions.get` to verify `paymentToken` server-side.
  async verifyPurchaseToken(_planId: string, paymentToken: string): Promise<{ valid: boolean }> {
    return { valid: typeof paymentToken === 'string' && paymentToken.length > 0 };
  }
}
