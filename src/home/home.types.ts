export type TileGradient = [string, string];

export type CategoryChipData = {
  id: string;
  emoji: string;
  label: string;
};

export type QuickPlayItemData = {
  id: string;
  title: string;
  gradient: TileGradient;
  imageUrl: string | null;
};

export type DailyMixItemData = {
  id: string;
  title: string;
  curators: string;
  gradient: TileGradient;
  imageUrl: string | null;
};

export type TrackItemData = {
  id: string;
  title: string;
  subtitle: string;
  kind?: string;
  views?: string;
  gradient: TileGradient;
  imageUrl: string | null;
};

export type BeatItemData = {
  id: string;
  title: string;
  gradient: TileGradient;
  imageUrl: string | null;
};

export type VoiceItemData = {
  id: string;
  name: string;
  initials: string;
  gradient: TileGradient;
  imageUrl: string | null;
};

export type NowPlayingData = {
  title: string;
  progress: number;
  gradient: TileGradient;
};

export type HomeFeed = {
  categories: CategoryChipData[];
  quickPlayItems: QuickPlayItemData[];
  dailyMixItems: DailyMixItemData[];
  hollywoodTracks: TrackItemData[];
  untouchedBeats: BeatItemData[];
  topVoices: VoiceItemData[];
  nowPlaying: NowPlayingData;
};
