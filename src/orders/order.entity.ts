import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type OrderStatus = 'pending' | 'paid' | 'failed';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  planId!: string;

  @Column({ type: 'varchar', nullable: true })
countryCode!: string | null;

  
  @Column({ type: 'varchar', nullable: true })
  stateCode!: string | null;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  discountAmount!: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  taxAmount!: string | null;

  @Column({ type: 'varchar', nullable: true })
  taxLabel!: string | null;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal!: string;

  @Column({ default: 'google_play' })
  paymentProvider!: string;

  @Column({ type: 'varchar', nullable: true })
  paymentAccountEmailMasked!: string | null;

  @Column()
  status!: OrderStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;
}
