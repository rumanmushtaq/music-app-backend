export type MoodCard = {
  id: string;
  label: string;
  gradientStart: string;
  gradientEnd: string;
  artworkUrl: string | null;
};

export type Song = {
  id: string;
  title: string;
  artistNames: string[];
  artworkUrl: string | null;
  durationSeconds: number;
  viewsCount: number;
};

export type Artist = {
  id: string;
  name: string;
  avatarUrl: string | null;
  followersCount: number;
};

export type Playlist = {
  id: string;
  title: string;
  songCount: number;
  artworkUrl: string | null;
};

export type AiMix = {
  id: string;
  title: string;
  trackCount: number;
  tracks: Song[];
};

export type SearchResultType = 'songs' | 'artists' | 'playlists';
