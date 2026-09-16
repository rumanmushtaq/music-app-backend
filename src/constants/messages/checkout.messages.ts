export const CheckoutMessages = {
  orderAlreadyStatus: (status: string) => `Order is already "${status}"`,
  paymentVerificationFailed: 'Payment verification failed',
  orderNotFound: (orderId: string) => `Order "${orderId}" not found`,
};
