import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { PurchaseItem } from './purchase-item.entity';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Referencia libre a un proveedor; no hay microservicio de proveedores todavía
  @Column({ nullable: true })
  supplierId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total' })
  total!: number;

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.PENDING, name: 'status' })
  status!: PurchaseStatus;

  @OneToMany(() => PurchaseItem, (item) => item.purchase, { cascade: true })
  items!: PurchaseItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
