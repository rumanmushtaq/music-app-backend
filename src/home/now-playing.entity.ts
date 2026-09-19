import { Column, Entity, PrimaryColumn } from 'typeorm';

// Singleton row - always looked up by this fixed id.
export const NOW_PLAYING_ID = 'current';

@Entity('home_now_playing')
export class NowPlaying {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column('float')
  progress!: number;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;
}
