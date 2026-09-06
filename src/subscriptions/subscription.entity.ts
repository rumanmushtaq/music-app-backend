import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

@Entity('subscriptions')
@Unique(['userId'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  planId!: string;

  @Column()
  status!: SubscriptionStatus;

  @CreateDateColumn()
  startedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;
}
