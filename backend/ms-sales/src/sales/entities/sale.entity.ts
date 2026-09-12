import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { SaleItem } from './sale-item.entity';

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // No es FK real: ms-sales tiene su propia base. Se valida vía gRPC contra ms-users.
  @Column({ name: 'client_id' })
  clientId!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total' })
  total!: number;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.PENDING, name: 'status' })
  status!: SaleStatus;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items!: SaleItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
