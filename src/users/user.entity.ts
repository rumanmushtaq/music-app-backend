import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type ThemePreference = 'system' | 'light' | 'dark';
export type UserRole = 'user' | 'admin';

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

  @Column({ nullable: true })
  musicLanguageId?: string;

  @Column({ nullable: true })
  currentPlanId?: string;

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;
}
