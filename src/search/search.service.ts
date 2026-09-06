import { Injectable } from '@nestjs/common';

import { Artist, MoodCard, Playlist, SearchResultType, Song } from './search.types';

const moodCards: MoodCard[] = [
  { id: 'rainy-wave', label: 'Rainy Wave', gradientStart: '#2B3A4A', gradientEnd: '#4E6478', artworkUrl: null },
  { id: 'workout-boost', label: 'Workout Boost', gradientStart: '#3A0000', gradientEnd: '#B0173A', artworkUrl: null },
  { id: 'late-night-chill', label: 'Late Night Chill', gradientStart: '#1B2735', gradientEnd: '#2B86FF', artworkUrl: null },
  { id: 'dining-room', label: 'Dining Room', gradientStart: '#1F3D2B', gradientEnd: '#3D6B4A', artworkUrl: null },
  { id: 'pop-party', label: 'Pop Party', gradientStart: '#3A3A3A', gradientEnd: '#5C5C5C', artworkUrl: null },
  { id: 'super-hits-20s', label: "20's Super Hits", gradientStart: '#5A0F0F', gradientEnd: '#B0173A', artworkUrl: null },
];

const songs: Song[] = [
  { id: 'strom-huise', title: 'Strom Huise', artistNames: ['Emmy Stark'], artworkUrl: null, durationSeconds: 212, viewsCount: 24000 },
  { id: 'party-night-doom', title: 'Party Night - Doom Spot', artistNames: ['Doom Spot', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 187, viewsCount: 455000000 },
  { id: 'endor-spark', title: 'Endor Spark - Repair', artistNames: ['Tarin', 'Kevin', 'Bob Sammy'], artworkUrl: null, durationSeconds: 201, viewsCount: 246000 },
  { id: 'edm-house', title: 'Edm House', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 233, viewsCount: 25000000 },
  { id: 'party-night-lofi', title: 'Party Night Lo-Fi', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 198, viewsCount: 654000 },
  { id: 'saturday-kelly-clen', title: 'Saturday', artistNames: ['Kelly Clen', 'Kevin', 'Doom Spot'], artworkUrl: null, durationSeconds: 176, viewsCount: 246000 },
  { id: 'party-pool', title: 'Party Pool - Re-Released', artistNames: ['Doom Spot'], artworkUrl: null, durationSeconds: 220, viewsCount: 89000 },
  { id: 'bolt-strange', title: 'Bolt Strange - All Songs', artistNames: ['Tarin'], artworkUrl: null, durationSeconds: 205, viewsCount: 132000 },
];

const artists: Artist[] = [
  { id: 'emmy-stark', name: 'Emmy Stark', avatarUrl: null, followersCount: 1200000 },
  { id: 'doom-spot', name: 'Doom Spot', avatarUrl: null, followersCount: 845000 },
  { id: 'jhon-snow', name: 'Jhon Snow', avatarUrl: null, followersCount: 2400000 },
  { id: 'kelly-clen', name: 'Kelly Clen', avatarUrl: null, followersCount: 640000 },
  { id: 'tarin', name: 'Tarin', avatarUrl: null, followersCount: 312000 },
  { id: 'eddy-brok', name: 'Eddy Brok', avatarUrl: null, followersCount: 198000 },
];

const playlists: Playlist[] = [
  { id: 'weekend-warmup', title: 'Weekend Warmup', songCount: 32, artworkUrl: null },
  { id: 'chill-vibes', title: 'Chill Vibes Only', songCount: 48, artworkUrl: null },
  { id: 'dinner-mood', title: 'Dinner Mood', songCount: 21, artworkUrl: null },
  { id: 'pop-party-mix', title: 'Pop Party Mix', songCount: 56, artworkUrl: null },
  { id: 'road-trip', title: 'Road Trip Anthems', songCount: 40, artworkUrl: null },
  { id: 'focus-flow', title: 'Focus Flow', songCount: 18, artworkUrl: null },
];

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64');
}

function decodeCursor(cursor?: string): number {
  if (!cursor) {
    return 0;
  }
  const decoded = Number(Buffer.from(cursor, 'base64').toString('utf8'));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

@Injectable()
export class SearchService {
  getMoodCards(): MoodCard[] {
    return moodCards;
  }

  search(q: string, type: SearchResultType, limit: number, cursor?: string) {
    const needle = q.trim().toLowerCase();
    const offset = decodeCursor(cursor);

    if (type === 'artists') {
      return this.paginate(
        artists.filter((artist) => artist.name.toLowerCase().includes(needle)),
        offset,
        limit,
        'artists',
      );
    }

    if (type === 'playlists') {
      return this.paginate(
        playlists.filter((playlist) => playlist.title.toLowerCase().includes(needle)),
        offset,
        limit,
        'playlists',
      );
    }

    return this.paginate(
      songs.filter(
        (song) =>
          song.title.toLowerCase().includes(needle) ||
          song.artistNames.some((name) => name.toLowerCase().includes(needle)),
      ),
      offset,
      limit,
      'songs',
    );
  }

  private paginate<T>(matches: T[], offset: number, limit: number, key: SearchResultType) {
    const slice = matches.slice(offset, offset + limit);
    const nextCursor = offset + limit < matches.length ? encodeCursor(offset + limit) : null;
    return { [key]: slice, nextCursor };
  }
}
