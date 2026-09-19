import { Column, Entity, PrimaryColumn } from 'typeorm';

// id is a fixed slug - see quick-play-item.entity.ts for why (TOP_VOICE_IMAGES).
@Entity('home_top_voices')
export class TopVoice {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  initials!: string;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;
}
