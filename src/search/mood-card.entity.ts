import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('mood_cards')
export class MoodCard {
  @PrimaryColumn()
  id!: string;

  @Column()
  label!: string;

  @Column()
  gradientStart!: string;

  @Column()
  gradientEnd!: string;

  @Column({ type: 'varchar', nullable: true })
  artworkUrl!: string | null;
}
