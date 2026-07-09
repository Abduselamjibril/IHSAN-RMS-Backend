import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { PermissionGroup } from './permission-group.entity';
import { RolePermission } from './role-permission.entity';

@Entity('rems_permission')
export class Permission {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'permissionid' })
  permissionId: string;

  @Column({ name: 'permissiongroupid', type: 'bigint' })
  permissionGroupId: string;

  @Column({ name: 'permissioncode', length: 100, unique: true })
  permissionCode: string;

  @Column({ name: 'permissionname', length: 250 })
  permissionName: string;

  @Column({ name: 'description', length: 1000, nullable: true })
  description: string;

  @ManyToOne(() => PermissionGroup, (pg) => pg.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissiongroupid' })
  permissionGroup: PermissionGroup;

  @OneToMany(() => RolePermission, (rolePerm) => rolePerm.permission)
  rolePermissions: RolePermission[];
}
