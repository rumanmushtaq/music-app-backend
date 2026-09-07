import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Artist } from './artist.entity';
import { Playlist } from './playlist.entity';
import { Song } from './song.entity';

const SEED_SONGS: Song[] = [
  { id: 'edm-house', title: 'Edm House - By Unimagine Foxes', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 233 },
  { id: 'party-night-lofi', title: 'Party Night Lo-Fi', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 198 },
  { id: 'saturday-kelly-clen', title: 'Saturday - Kelly Clen', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 176 },
  { id: 'strom-huise', title: 'Strom Huise - By Emmy Stark', artistNames: ['Emmy Stark', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 212 },
  { id: 'party-night-doom-spot', title: 'Party Night - Doom Spot', artistNames: ['Doom Spot', 'Jhon Snow', 'Eddy Brok'], artworkUrl: null, durationSeconds: 187 },
  { id: 'endor-spark-repair', title: 'Endor Spark - Repair', artistNames: ['Tarin', 'Kevin', 'Bob Sammy'], artworkUrl: null, durationSeconds: 201 },
  { id: 'bolt-strange', title: 'Bolt Strange - All Songs', artistNames: ['Tarin'], artworkUrl: null, durationSeconds: 205 },
  { id: 'party-pool', title: 'Party Pool - Re-Released', artistNames: ['Doom Spot'], artworkUrl: null, durationSeconds: 220 },
  { id: 'pink-dream', title: 'Pink Dream by Emma Brok', artistNames: ['Emma Brok'], artworkUrl: null, durationSeconds: 209 },
  { id: 'anova-bee', title: 'Anova Bee By Amma Brok', artistNames: ['Amma Brok'], artworkUrl: null, durationSeconds: 165 },
];

const SEED_ARTISTS: Artist[] = [
  { id: 'aaditya-gandhi', name: 'Aaditya Gandhi', avatarUrl: null },
  { id: 'prabhu-ramaswamy', name: 'Prabhu Ramaswamy', avatarUrl: null },
  { id: 'megha-padkare', name: 'Megha Padkare', avatarUrl: null },
];

const SEED_PLAYLISTS: Playlist[] = [
  {
    id: 'party-night-doom-spot-mix',
    title: 'Party Night - Doom Spot',
    curatorNames: ['Doom Spot', 'Jhon Snow', 'Eddy Brok'],
    songCount: 12,
    durationLabel: '12 Hours',
    artworkUrl: null,
  },
  {
    id: 'endor-spark-repair-mix',
    title: 'Endor Spark - Repair',
    curatorNames: ['Tarin', 'Kevin', 'Bob Sammy'],
    songCount: 16,
    durationLabel: '3 Hours',
    artworkUrl: null,
  },
];

@Injectable()
export class LibraryService implements OnModuleInit {
  constructor(
    @InjectRepository(Song)
    private readonly songs: Repository<Song>,
    @InjectRepository(Artist)
    private readonly artists: Repository<Artist>,
    @InjectRepository(Playlist)
    private readonly playlists: Repository<Playlist>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed(this.songs, SEED_SONGS);
    await this.seed(this.artists, SEED_ARTISTS);
    await this.seed(this.playlists, SEED_PLAYLISTS);
  }

  private async seed<T extends { id: string }>(repository: Repository<T>, rows: T[]): Promise<void> {
    for (const row of rows) {
      const existing = await repository.findOne({ where: { id: row.id } as never });
      if (!existing) {
        await repository.save(repository.create(row as never));
      }
    }
  }

  async getSongs(): Promise<Song[]> {
    return this.songs.find();
  }

  async getArtists(): Promise<Artist[]> {
    return this.artists.find();
  }

  async getPlaylists(): Promise<Playlist[]> {
    return this.playlists.find();
  }

  async getLibrary(): Promise<{ songs: Song[]; artists: Artist[]; playlists: Playlist[] }> {
    const [songs, artists, playlists] = await Promise.all([
      this.getSongs(),
      this.getArtists(),
      this.getPlaylists(),
    ]);
    return { songs, artists, playlists };
  }
}
