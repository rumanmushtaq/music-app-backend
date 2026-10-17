import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export type ArtistStatus = 'verified' | 'pending' | 'rejected' | 'blocked';

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

  // Verification state shown on the admin dashboard. Defaults to 'verified' so the rows
  // seeded before this column existed keep counting as approved artists.
  @Column({ type: 'varchar', default: 'verified' })
  status!: ArtistStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
