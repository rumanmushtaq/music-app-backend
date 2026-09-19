import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('home_categories')
export class HomeCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  emoji!: string;

  @Column()
  label!: string;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;
}
