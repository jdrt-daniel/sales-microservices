import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('request_logs')
export class RequestLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'timestamptz' })
  @Index()
  timestamp!: Date;

  @Column({ length: 10 })
  method!: string;

  @Column()
  path!: string;

  @Column({ type: 'int', name: 'status_code' })
  statusCode!: number;

  @Column({ type: 'double precision', name: 'duration_ms' })
  durationMs!: number;

  @Column({ type: 'varchar', nullable: true, name: 'user_id' })
  userId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip?: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'user_agent' })
  userAgent?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}