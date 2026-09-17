export const CommonMessages = {
  unexpectedError: 'Unexpected error',
  notFound: (entity: string, id: string) => `${entity} "${id}" not found`,
};

export const AuthMessages = {
  missingBearerToken: 'Missing bearer token',
  invalidOrExpiredToken: 'Invalid or expired token',
  adminAccessRequired: 'Admin access required',
};

export const CheckoutMessages = {
  orderAlreadyStatus: (status: string) => `Order is already "${status}"`,
  paymentVerificationFailed: 'Payment verification failed',
  orderNotFound: (orderId: string) => CommonMessages.notFound('Order', orderId),
  postPaymentUpdateFailed: (orderId: string) =>
    `Payment for order "${orderId}" was verified, but activating your subscription failed. Our team has been notified - please contact support before retrying.`,
};

export const MusicLanguagesMessages = {
  musicLanguageNotFound: (id: string) => CommonMessages.notFound('Music language', id),
  musicLanguageAlreadyExists: (name: string) => `Music language "${name}" already exists`,
};

export const PlansMessages = {
  planNotFound: (id: string) => CommonMessages.notFound('Plan', id),
};

export const ProfileMessages = {
  loadProfileFailed: (userId: string) => `Failed to load profile for user ${userId}`,
  updateProfileFailed: (userId: string) => `Failed to update profile for user ${userId}`,
  revokeSessionFailed: (sessionId: string) => `Failed to revoke Clerk session ${sessionId}`,
};

export const PodcastsMessages = {
  podcastNotFound: (id: string) => CommonMessages.notFound('Podcast', id),
  episodeNotFound: (episodeId: string, podcastId: string) =>
    `${CommonMessages.notFound('Episode', episodeId)} on podcast "${podcastId}"`,
};

export const SearchMessages = {
  queryRequired: 'q is required',
};

export const SubscriptionsMessages = {
  noActiveSubscription: 'No active subscription to cancel',
};

export const UsersMessages = {
  userNotFound: 'User not found',
};
