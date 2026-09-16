import { Injectable } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';
import {
  BeatItemData,
  CategoryChipData,
  DailyMixItemData,
  HomeFeed,
  QuickPlayItemData,
  TrackItemData,
  VoiceItemData,
} from './home.types';

const categories: CategoryChipData[] = [
  { id: 'devotion', emoji: '🙏', label: 'Devotion' },
  { id: 'workout', emoji: '💪', label: 'Workout' },
  { id: 'party', emoji: '🥳', label: 'Party' },
  { id: 'focus', emoji: '🎯', label: 'Focus' },
];

const quickPlayItems: QuickPlayItemData[] = [
  { id: 'strom-h', title: 'Strom H...', gradient: ['#2B5876', '#4E4376'], imageUrl: null },
  { id: 'jui-lofi', title: 'Jui - LoFi', gradient: ['#8E2DE2', '#4A00E0'], imageUrl: null },
  { id: 'saul-mate', title: 'Saul Mate', gradient: ['#FE3030', '#FF4E88'], imageUrl: null },
  { id: 'jack-sui', title: 'Jack - Sui', gradient: ['#134E5E', '#71B280'], imageUrl: null },
];

const dailyMixItems: DailyMixItemData[] = [
  {
    id: 'daily-mix-1',
    title: 'Mix 1',
    curators: 'Reyan Wran, Goobin...',
    gradient: ['#FE3030', '#FF9DBF'],
    imageUrl: null,
  },
  {
    id: 'daily-mix-2',
    title: 'Mix 2',
    curators: 'Pritam, Arigit Singh,...',
    gradient: ['#2B86FF', '#9DD1FF'],
    imageUrl: null,
  },
  {
    id: 'daily-mix-3',
    title: 'Mix 3',
    curators: 'Diljit Dosanjh, AP...',
    gradient: ['#7B2FF7', '#C29DFF'],
    imageUrl: null,
  },
];

const hollywoodTracks: TrackItemData[] = [
  {
    id: 'edm-house',
    title: 'Edm House - By Uni...',
    subtitle: 'Unimagine Foxes, Jhon Sn...',
    kind: 'Playlist',
    views: '25M Views',
    gradient: ['#1B2735', '#2B86FF'],
    imageUrl: null,
  },
  {
    id: 'party-night-lofi',
    title: 'Party Night Lo-Fi',
    subtitle: 'Eddy Sins, Worsen, Doom',
    kind: 'Song',
    views: '654K Views',
    gradient: ['#3A0000', '#B0173A'],
    imageUrl: null,
  },
];

const untouchedBeats: BeatItemData[] = [
  { id: 'anova-bee', title: 'Anova Bee By Amma Brok', gradient: ['#5A0F5A', '#B0173A'], imageUrl: null },
  { id: 'pink-dream', title: 'Pink Dream by Emma Brok', gradient: ['#2B0B4F', '#5A2DA0'], imageUrl: null },
];

const topVoices: VoiceItemData[] = [
  {
    id: 'aaditya-gandhi',
    name: 'Aaditya Gandhi',
    initials: 'AG',
    gradient: ['#FF4E88', '#7B2FF7'],
    imageUrl: null,
  },
  {
    id: 'prabhu-ramaswamy',
    name: 'Prabhu Ramaswamy',
    initials: 'PR',
    gradient: ['#2B86FF', '#134E5E'],
    imageUrl: null,
  },
  {
    id: 'megha-padkare',
    name: 'Megha Padkare',
    initials: 'MP',
    gradient: ['#FE3030', '#FF9500'],
    imageUrl: null,
  },
];

const nowPlaying = {
  title: 'Saul Mate - By...',
  progress: 0.35,
  gradient: ['#FE3030', '#FF4E88'] as [string, string],
};

const HOME_FEED_CACHE_KEY = 'home:feed';
const HOME_FEED_CACHE_TTL_SECONDS = 60 * 60;

@Injectable()
export class HomeService {
  constructor(private readonly redisService: RedisService) {}

  getHomeFeed(): Promise<HomeFeed> {
    return this.redisService.getOrSet(HOME_FEED_CACHE_KEY, HOME_FEED_CACHE_TTL_SECONDS, () => ({
      categories,
      quickPlayItems,
      dailyMixItems,
      hollywoodTracks,
      untouchedBeats,
      topVoices,
      nowPlaying,
    }));
  }
}
