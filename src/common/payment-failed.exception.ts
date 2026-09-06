import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentFailedException extends HttpException {
  constructor(message: string) {
    super({ message }, HttpStatus.PAYMENT_REQUIRED);
  }
}
