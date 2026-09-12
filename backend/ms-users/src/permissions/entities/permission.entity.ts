import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, name: 'name' })
  name!: string; // ej: "products.create", "sales.read"

  @Column({ name: 'resource' })
  resource!: string; // ej: "products", "sales"

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];
}
