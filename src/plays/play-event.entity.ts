import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// One row per song play. Every listening metric on the admin dashboard (activity,
// active days/hours, retention, top songs/artists) is aggregated from this table.
@Entity('play_events')
@Index(['playedAt'])
@Index(['songId', 'playedAt'])
export class PlayEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Local users.id (not the Clerk id).
  @Column()
  userId!: string;

  @Column()
  songId!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  playedAt!: Date;
}
