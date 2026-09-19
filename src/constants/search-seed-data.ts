import { Artist } from '../library/artist.entity';
import { Playlist } from '../library/playlist.entity';
import { Song } from '../library/song.entity';
import { MoodCard } from '../search/mood-card.entity';

export const SEARCH_SEED_MOOD_CARDS: MoodCard[] = [
  { id: 'rainy-wave', label: 'Rainy Wave', gradientStart: '#2B3A4A', gradientEnd: '#4E6478', artworkUrl: null },
  { id: 'workout-boost', label: 'Workout Boost', gradientStart: '#3A0000', gradientEnd: '#B0173A', artworkUrl: null },
  { id: 'late-night-chill', label: 'Late Night Chill', gradientStart: '#1B2735', gradientEnd: '#2B86FF', artworkUrl: null },
  { id: 'dining-room', label: 'Dining Room', gradientStart: '#1F3D2B', gradientEnd: '#3D6B4A', artworkUrl: null },
  { id: 'pop-party', label: 'Pop Party', gradientStart: '#3A3A3A', gradientEnd: '#5C5C5C', artworkUrl: null },
  { id: 'super-hits-20s', label: "20's Super Hits", gradientStart: '#5A0F0F', gradientEnd: '#B0173A', artworkUrl: null },
];

export const SEARCH_SEED_SONGS: Song[] = [
  { id: 'strom-huise', title: 'Strom Huise', artistNames: ['Emmy Stark'], artworkUrl: null, durationSeconds: 212, viewsCount: 24000 },
  { id: 'party-night-doom', title: 'Party Night - Doom Spot', artistNames: ['Doom Spot', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 187, viewsCount: 455000000 },
  { id: 'endor-spark', title: 'Endor Spark - Repair', artistNames: ['Tarin', 'Kevin', 'Bob Sammy'], artworkUrl: null, durationSeconds: 201, viewsCount: 246000 },
  { id: 'edm-house', title: 'Edm House', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 233, viewsCount: 25000000 },
  { id: 'party-night-lofi', title: 'Party Night Lo-Fi', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 198, viewsCount: 654000 },
  { id: 'saturday-kelly-clen', title: 'Saturday', artistNames: ['Kelly Clen', 'Kevin', 'Doom Spot'], artworkUrl: null, durationSeconds: 176, viewsCount: 246000 },
  { id: 'party-pool', title: 'Party Pool - Re-Released', artistNames: ['Doom Spot'], artworkUrl: null, durationSeconds: 220, viewsCount: 89000 },
  { id: 'bolt-strange', title: 'Bolt Strange - All Songs', artistNames: ['Tarin'], artworkUrl: null, durationSeconds: 205, viewsCount: 132000 },
];

export const SEARCH_SEED_ARTISTS: Artist[] = [
  { id: 'emmy-stark', name: 'Emmy Stark', avatarUrl: null, followersCount: 1200000 },
  { id: 'doom-spot', name: 'Doom Spot', avatarUrl: null, followersCount: 845000 },
  { id: 'jhon-snow', name: 'Jhon Snow', avatarUrl: null, followersCount: 2400000 },
  { id: 'kelly-clen', name: 'Kelly Clen', avatarUrl: null, followersCount: 640000 },
  { id: 'tarin', name: 'Tarin', avatarUrl: null, followersCount: 312000 },
  { id: 'eddy-brok', name: 'Eddy Brok', avatarUrl: null, followersCount: 198000 },
];

export const SEARCH_SEED_PLAYLISTS: Playlist[] = [
  { id: 'weekend-warmup', title: 'Weekend Warmup', curatorNames: [], songCount: 32, durationLabel: '', artworkUrl: null },
  { id: 'chill-vibes', title: 'Chill Vibes Only', curatorNames: [], songCount: 48, durationLabel: '', artworkUrl: null },
  { id: 'dinner-mood', title: 'Dinner Mood', curatorNames: [], songCount: 21, durationLabel: '', artworkUrl: null },
  { id: 'pop-party-mix', title: 'Pop Party Mix', curatorNames: [], songCount: 56, durationLabel: '', artworkUrl: null },
  { id: 'road-trip', title: 'Road Trip Anthems', curatorNames: [], songCount: 40, durationLabel: '', artworkUrl: null },
  { id: 'focus-flow', title: 'Focus Flow', curatorNames: [], songCount: 18, durationLabel: '', artworkUrl: null },
];
