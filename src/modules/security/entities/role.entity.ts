import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';
import { RolePermission } from './role-permission.entity';

@Entity('rems_role')
export class Role {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'roleid' })
  roleId: string;

  @Column({ name: 'rolecode', length: 50, unique: true })
  roleCode: string;

  @Column({ name: 'rolename', length: 250 })
  roleName: string;

  @Column({ name: 'description', length: 1000, nullable: true })
  description: string;

  @Column({ name: 'issystemrole', type: 'boolean', default: false })
  isSystemRole: boolean;

  @Column({ name: 'isactive', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'createdby', length: 50 })
  createdBy: string;

  @CreateDateColumn({ name: 'createddate', type: 'timestamp' })
  createdDate: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => RolePermission, (rolePerm) => rolePerm.role)
  rolePermissions: RolePermission[];
}
