export const CheckoutMessages = {
  orderAlreadyStatus: (status: string) => `Order is already "${status}"`,
  paymentVerificationFailed: 'Payment verification failed',
  orderNotFound: (orderId: string) => `Order "${orderId}" not found`,
  postPaymentUpdateFailed: (orderId: string) =>
    `Payment for order "${orderId}" was verified, but activating your subscription failed. Our team has been notified - please contact support before retrying.`,
};
