import { Column, Entity, PrimaryColumn } from 'typeorm';

// id is a fixed slug - see quick-play-item.entity.ts for why (DAILY_MIX_IMAGES).
@Entity('home_daily_mix_items')
export class DailyMixItem {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  curators!: string;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;
}
