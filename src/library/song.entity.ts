import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export type SongStatus = 'published' | 'pending' | 'draft' | 'rejected';

@Entity('songs')
export class Song {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column('simple-json')
  artistNames!: string[];

  @Column({ type: 'varchar', nullable: true })
  artworkUrl!: string | null;

  @Column({ type: 'int' })
  durationSeconds!: number;

  @Column({ type: 'int', default: 0 })
  viewsCount!: number;

  // Moderation state shown on the admin dashboard. Defaults to 'published' so the rows
  // seeded before this column existed stay visible as live catalog entries.
  @Column({ type: 'varchar', default: 'published' })
  status!: SongStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
