import { Injectable } from '@nestjs/common';

import { AiMix, Song } from '../search/search.types';

// Mock song pool. A production implementation would call a real
// recommendation/LLM service instead of picking from a static list.
const SONG_POOL: Song[] = [
  { id: 'song-1', title: 'Strom Huise', artistNames: ['Emmy Stark'], artworkUrl: null, durationSeconds: 214, viewsCount: 24000 },
  { id: 'song-2', title: 'Jui - LoFi', artistNames: ['Jui'], artworkUrl: null, durationSeconds: 187, viewsCount: 455000000 },
  { id: 'song-3', title: 'Saul Mate', artistNames: ['Emmy Stark', "Jhon Snow"], artworkUrl: null, durationSeconds: 201, viewsCount: 18000 },
  { id: 'song-4', title: 'Jack - Sui', artistNames: ['Jack'], artworkUrl: null, durationSeconds: 176, viewsCount: 654000 },
  { id: 'song-5', title: 'Edm House', artistNames: ['Unimagine Foxes'], artworkUrl: null, durationSeconds: 230, viewsCount: 25000000 },
  { id: 'song-6', title: 'Party Night Lo-Fi', artistNames: ['Eddy Sins', 'Worsen'], artworkUrl: null, durationSeconds: 198, viewsCount: 654000 },
  { id: 'song-7', title: 'Anova Bee', artistNames: ['Amma Brok'], artworkUrl: null, durationSeconds: 165, viewsCount: 91000 },
  { id: 'song-8', title: 'Pink Dream', artistNames: ['Emma Brok'], artworkUrl: null, durationSeconds: 209, viewsCount: 132000 },
];

const RECOMMENDED_GRADIENTS: Array<{ gradientStart: string; gradientEnd: string }> = [
  { gradientStart: '#FE3030', gradientEnd: '#FF4E88' },
  { gradientStart: '#2B86FF', gradientEnd: '#134E5E' },
  { gradientStart: '#8E2DE2', gradientEnd: '#4A00E0' },
  { gradientStart: '#7B2FF7', gradientEnd: '#C29DFF' },
];

function hashPrompt(prompt: string): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) % SONG_POOL.length;
  }
  return hash;
}

@Injectable()
export class AiSearchService {
  generateMix(prompt?: string): {
    mix: AiMix;
    recommended: Array<{ id: string; title: string; artworkUrl: string | null; gradientStart: string; gradientEnd: string }>;
  } {
    // Cosmetic-only variety based on the prompt text, not real personalization.
    const offset = prompt ? hashPrompt(prompt) : 0;
    const rotated = [...SONG_POOL.slice(offset), ...SONG_POOL.slice(0, offset)];

    const mixTracks = rotated.slice(0, 4);
    const recommendedSource = rotated.slice(4, 8);

    const mix: AiMix = {
      id: 'ai-mix-1',
      title: prompt ? `Mix for "${prompt}"` : 'Your Daily AI Mix',
      trackCount: mixTracks.length,
      tracks: mixTracks,
    };

    const recommended = recommendedSource.map((song, index) => ({
      id: song.id,
      title: song.title,
      artworkUrl: song.artworkUrl,
      ...RECOMMENDED_GRADIENTS[index % RECOMMENDED_GRADIENTS.length],
    }));

    return { mix, recommended };
  }
}
