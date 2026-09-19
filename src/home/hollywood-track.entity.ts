import { Column, Entity, PrimaryColumn } from 'typeorm';

// id is a fixed slug - see quick-play-item.entity.ts for why (HOLLYWOOD_TRACK_IMAGES).
@Entity('home_hollywood_tracks')
export class HollywoodTrack {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  subtitle!: string;

  @Column({ type: 'varchar', nullable: true })
  kind!: string | null;

  @Column({ type: 'varchar', nullable: true })
  views!: string | null;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;
}
