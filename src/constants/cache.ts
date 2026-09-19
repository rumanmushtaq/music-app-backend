export const PROFILE_CACHE_TTL_SECONDS = 5 * 60;
export const PLANS_CACHE_TTL_SECONDS = 60 * 60;
export const PODCASTS_CACHE_TTL_SECONDS = 60 * 60;
export const LIBRARY_CACHE_TTL_SECONDS = 60 * 60;
export const HOME_FEED_CACHE_TTL_SECONDS = 60 * 60;
export const SEARCH_CACHE_TTL_SECONDS = 60 * 60;
export const MUSIC_LANGUAGES_CACHE_TTL_SECONDS = 60 * 60;
export const SUBSCRIPTIONS_CACHE_TTL_SECONDS = 5 * 60;
export const USERS_CACHE_TTL_SECONDS = 5 * 60;

export const HOME_FEED_CACHE_KEY = 'home:feed';

export const PLANS_CACHE_KEY = 'plans:all';
export const planCacheKey = (id: string) => `plans:${id}`;

export const PODCASTS_CATEGORIES_CACHE_KEY = 'podcasts:categories';
export const PODCASTS_FEED_CACHE_KEY = 'podcasts:feed';
export const podcastDetailCacheKey = (id: string) => `podcasts:detail:${id}`;
export const podcastEpisodeCacheKey = (podcastId: string, episodeId: string) =>
  `podcasts:episode:${podcastId}:${episodeId}`;

export const LIBRARY_SONGS_CACHE_KEY = 'library:songs';
export const LIBRARY_ARTISTS_CACHE_KEY = 'library:artists';
export const LIBRARY_PLAYLISTS_CACHE_KEY = 'library:playlists';

export const SEARCH_MOODS_CACHE_KEY = 'search:moods';

export const MUSIC_LANGUAGES_CACHE_KEY = 'music-languages:all';

export const subscriptionCacheKey = (userId: string) => `subscriptions:${userId}`;

export const userCacheKey = (clerkId: string) => `users:${clerkId}`;
