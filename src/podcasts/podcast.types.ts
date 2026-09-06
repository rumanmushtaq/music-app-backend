export type TileGradient = [string, string];

export type PodcastCategoryData = {
  id: string;
  emoji: string;
  label: string;
};

export type PodcastFeedItemData = {
  id: string;
  podcastName: string;
  episodeTag: string;
  title: string;
  description: string;
  gradient: TileGradient;
};

export type EpisodeData = {
  id: string;
  title: string;
  subtitle: string;
  number: string;
  views: string;
  daysAgo: string;
  gradient: TileGradient;
};

export type PodcastDetailData = {
  id: string;
  name: string;
  followers: string;
  listeners: string;
  description: string;
  gradient: TileGradient;
  episodes: EpisodeData[];
  similar: PodcastFeedItemData[];
};
