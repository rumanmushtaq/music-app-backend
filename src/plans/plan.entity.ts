import { Column, Entity, PrimaryColumn } from 'typeorm';

export type PlanTier = 'free' | 'pro' | 'black';

@Entity('plans')
export class Plan {
  @PrimaryColumn()
  id!: string;

  @Column()
  tier!: PlanTier;

  @Column()
  name!: string;

  @Column()
  durationLabel!: string;

  @Column({ type: 'int', nullable: true })
  durationDays!: number | null;

  @Column('decimal', { precision: 10, scale: 2 })
  originalPrice!: string;

  @Column({ default: 'USD' })
  currency!: string;

  @Column({ type: 'int', default: 0 })
  discountPercent!: number;

  @Column('simple-json')
  features!: string[];
}
