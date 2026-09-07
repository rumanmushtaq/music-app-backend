import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('playlists')
export class Playlist {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column('simple-json')
  curatorNames!: string[];

  @Column({ type: 'int' })
  songCount!: number;

  @Column()
  durationLabel!: string;

  @Column({ type: 'varchar', nullable: true })
  artworkUrl!: string | null;
}
