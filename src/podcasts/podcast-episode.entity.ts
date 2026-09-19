import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

// id is a fixed slug for the same reason as Podcast.id - the frontend keys
// locally-bundled episode thumbnails onto these exact ids (EPISODE_ART in
// music-app's data/podcast.ts).
@Entity('podcast_episodes')
export class PodcastEpisode {
  @PrimaryColumn()
  id!: string;

  @Column()
  podcastId!: string;

  @Column()
  title!: string;

  @Column()
  subtitle!: string;

  @Column()
  number!: string;

  @Column()
  views!: string;

  @Column()
  daysAgo!: string;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
