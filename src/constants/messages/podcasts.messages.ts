export const PodcastsMessages = {
  podcastNotFound: (id: string) => `Podcast "${id}" not found`,
  episodeNotFound: (episodeId: string, podcastId: string) =>
    `Episode "${episodeId}" not found on podcast "${podcastId}"`,
};
