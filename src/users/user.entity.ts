import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type ThemePreference = 'system' | 'light' | 'dark';

@Entity('users')
@Unique(['clerkId'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  clerkId!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ default: true })
  notificationsEnabled!: boolean;

  @Column({ default: 'system' })
  themePreference!: ThemePreference;

  @Column({ default: 'English' })
  musicLanguage!: string;

  @Column({ nullable: true })
  currentPlanId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
