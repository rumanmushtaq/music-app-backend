import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

// id is a fixed slug (not a generated uuid): the frontend keys locally-bundled
// podcast art onto these exact ids (see PODCAST_ART in music-app's data/podcast.ts),
// so it must stay stable across seeds/restarts.
@Entity('podcasts')
export class Podcast {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  followers!: string;

  @Column()
  listeners!: string;

  @Column()
  description!: string;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;

  // Display fields for this podcast's card in the feed / similar-podcasts list —
  // deliberately separate from `description` above, which is the detail-page copy.
  @Column()
  feedEpisodeTag!: string;

  @Column()
  feedTitle!: string;

  @Column()
  feedDescription!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
