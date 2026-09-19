import { Column, Entity, PrimaryColumn } from 'typeorm';

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
}
