import { Column, Entity, PrimaryColumn } from 'typeorm';

// id is a fixed slug (not a generated uuid): the frontend keys locally-bundled
// artwork onto these exact ids (QUICK_PLAY_IMAGES in music-app's data/home.ts).
@Entity('home_quick_play_items')
export class QuickPlayItem {
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
