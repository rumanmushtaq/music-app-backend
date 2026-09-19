import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('artists')
export class Artist {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  followersCount!: number;
}
