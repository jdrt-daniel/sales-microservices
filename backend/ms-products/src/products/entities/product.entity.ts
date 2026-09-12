import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, name: 'sku' })
  sku!: string;

  @Column({ name: 'name' })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price' })
  price!: number;

  @Column({ default: 0, name: 'stock' })
  stock!: number;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true })
  category?: Category;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable:true })
  updatedAt?: Date;
}
