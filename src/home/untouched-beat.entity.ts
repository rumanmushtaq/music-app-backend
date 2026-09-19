import { Column, Entity, PrimaryColumn } from 'typeorm';

// id is a fixed slug - see quick-play-item.entity.ts for why (UNTOUCHED_BEAT_IMAGES).
@Entity('home_untouched_beats')
export class UntouchedBeat {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;
}
