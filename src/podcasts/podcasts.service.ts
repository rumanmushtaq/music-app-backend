import { Injectable, NotFoundException } from '@nestjs/common';

import {
  EpisodeData,
  PodcastCategoryData,
  PodcastDetailData,
  PodcastFeedItemData,
} from './podcast.types';

const podcastCategories: PodcastCategoryData[] = [
  { id: 'virus', emoji: '🦠', label: 'Virus' },
  { id: 'science', emoji: '🔬', label: 'Science' },
  { id: 'health', emoji: '🧬', label: 'Health' },
];

const podcastFeed: PodcastFeedItemData[] = [
  {
    id: 'lillys-life',
    podcastName: "Lilly's Life",
    episodeTag: 'Ep - 42',
    title: 'Tough Life #42 - The Last Fight | Lilly Menon Ft. Mr Fantastic',
    description:
      "Discover inspiring stories, practical tips, and real-life moments from Lilly's journey. Each episode dives into resilience and growth.",
    gradient: ['#0091FF', '#1B2735'],
  },
  {
    id: 'le-femme',
    podcastName: 'Le Femme Podcast',
    episodeTag: 'Ep - 12',
    title: 'Le Femme Podcast - Finding Your Voice',
    description:
      'From personal growth to everyday wins, we cover it all. Listen, learn, and live your best life.',
    gradient: ['#8E2DE2', '#4A00E0'],
  },
];

const podcastDetails: PodcastDetailData[] = [
  {
    id: 'lillys-life',
    name: "Lilly's Life - Podcast",
    followers: '12.5k',
    listeners: '12M+',
    description:
      'From personal growth to everyday wins, we cover it all. Listen, learn, and live your best life.',
    gradient: ['#F7C59F', '#8E2DE2'],
    episodes: [
      {
        id: 'ep-42',
        title: 'Party Night - Doom Spot',
        subtitle: 'Doom Spot, Jhon Snow, Eddy brok',
        number: '#42',
        views: '24K Views',
        daysAgo: '13 Days Ago',
        gradient: ['#0091FF', '#1B2735'],
      },
      {
        id: 'ep-43',
        title: 'Party Night - Doom Spot',
        subtitle: 'Doom Spot, Jhon Snow, Eddy brok',
        number: '#43',
        views: '24K Views',
        daysAgo: '13 Days Ago',
        gradient: ['#0091FF', '#1B2735'],
      },
      {
        id: 'ep-44',
        title: 'Party Night - Doom Spot',
        subtitle: 'Doom Spot, Jhon Snow, Eddy brok',
        number: '#44',
        views: '24K Views',
        daysAgo: '13 Days Ago',
        gradient: ['#0091FF', '#1B2735'],
      },
      {
        id: 'ep-45',
        title: 'Saul Mate - By Emmy Stark',
        subtitle: 'Emmy Stark, Jhon Snow, Eddy brok',
        number: '#45',
        views: '18K Views',
        daysAgo: '15 Days Ago',
        gradient: ['#FE3030', '#FF4E88'],
      },
    ],
    similar: [
      {
        id: 'le-femme',
        podcastName: 'Le Femme Podcast',
        episodeTag: 'Ep - 12',
        title: 'Finding Your Voice',
        description:
          'From personal growth to everyday wins, we cover it all. Listen, learn, and live your best life.',
        gradient: ['#8E2DE2', '#4A00E0'],
      },
    ],
  },
];

@Injectable()
export class PodcastsService {
  getCategories(): PodcastCategoryData[] {
    return podcastCategories;
  }

  getFeed(): PodcastFeedItemData[] {
    return podcastFeed;
  }

  getPodcastDetail(id: string): PodcastDetailData {
    const podcast = podcastDetails.find((item) => item.id === id);
    if (!podcast) {
      throw new NotFoundException(`Podcast "${id}" not found`);
    }
    return podcast;
  }

  getEpisode(podcastId: string, episodeId: string): EpisodeData {
    const podcast = this.getPodcastDetail(podcastId);
    const episode = podcast.episodes.find((item) => item.id === episodeId);
    if (!episode) {
      throw new NotFoundException(`Episode "${episodeId}" not found on podcast "${podcastId}"`);
    }
    return episode;
  }
}
