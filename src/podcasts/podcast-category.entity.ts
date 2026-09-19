import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('podcast_categories')
@Unique(['label'])
export class PodcastCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  emoji!: string;

  @Column()
  label!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
