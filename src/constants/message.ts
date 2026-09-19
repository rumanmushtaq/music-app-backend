export const CommonMessages = {
  unexpectedError: 'Unexpected error',
  notFound: (entity: string, id: string) => `${entity} "${id}" not found`,
};

export const AiSearchMessages = {
  generateMixFailed: 'Failed to generate AI mix',
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
  createOrderFailed: 'Failed to create order',
  setAddressFailed: (orderId: string) => `Failed to set address for order "${orderId}"`,
  getOrderFailed: (orderId: string) => `Failed to load order "${orderId}"`,
  payFailed: (orderId: string) => `Failed to process payment for order "${orderId}"`,
};

export const HomeMessages = {
  loadHomeFeedFailed: 'Failed to load home feed',
};

export const LibraryMessages = {
  loadSongsFailed: 'Failed to load songs',
  loadArtistsFailed: 'Failed to load artists',
  loadPlaylistsFailed: 'Failed to load playlists',
};

export const MusicLanguagesMessages = {
  musicLanguageNotFound: (id: string) => CommonMessages.notFound('Music language', id),
  musicLanguageAlreadyExists: (name: string) => `Music language "${name}" already exists`,
  loadLanguagesFailed: 'Failed to load music languages',
  createLanguageFailed: (name: string) => `Failed to create music language "${name}"`,
  updateLanguageFailed: (id: string) => `Failed to update music language "${id}"`,
  removeLanguageFailed: (id: string) => `Failed to remove music language "${id}"`,
};

export const PlansMessages = {
  planNotFound: (id: string) => CommonMessages.notFound('Plan', id),
  loadPlansFailed: 'Failed to load plans',
  loadPlanFailed: (id: string) => `Failed to load plan "${id}"`,
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
  loadCategoriesFailed: 'Failed to load podcast categories',
  loadFeedFailed: 'Failed to load podcast feed',
  loadPodcastFailed: (id: string) => `Failed to load podcast "${id}"`,
  loadEpisodeFailed: (episodeId: string, podcastId: string) =>
    `Failed to load episode "${episodeId}" on podcast "${podcastId}"`,
};

export const SearchMessages = {
  queryRequired: 'q is required',
  loadMoodsFailed: 'Failed to load mood cards',
  searchFailed: 'Search failed',
};

export const SubscriptionsMessages = {
  noActiveSubscription: 'No active subscription to cancel',
  loadSubscriptionFailed: (clerkId: string) => `Failed to load subscription for user "${clerkId}"`,
  cancelSubscriptionFailed: (clerkId: string) => `Failed to cancel subscription for user "${clerkId}"`,
};

export const UsersMessages = {
  userNotFound: 'User not found',
  upsertUserFailed: (clerkId: string) => `Failed to upsert user for clerk id "${clerkId}"`,
  updateUserProfileFailed: (clerkId: string) => `Failed to update profile for clerk id "${clerkId}"`,
  setCurrentPlanFailed: (clerkId: string) => `Failed to set current plan for clerk id "${clerkId}"`,
};
