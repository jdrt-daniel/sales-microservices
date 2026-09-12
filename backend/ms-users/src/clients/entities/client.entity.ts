import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, name: 'document_number' })
  documentNumber!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ nullable: true, name: 'email' })
  email?: string;

  @Column({ nullable: true, name: 'phone' })
  phone?: string;

  @Column({ nullable: true, name: 'address' })
  address?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
