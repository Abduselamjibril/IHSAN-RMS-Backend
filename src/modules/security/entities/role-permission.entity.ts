import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('rems_role_permission')
export class RolePermission {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'rolepermissionid' })
  rolePermissionId: string;

  @Index('IX_RolePermission_RoleId')
  @Column({ name: 'roleid', type: 'bigint' })
  roleId: string;

  @Column({ name: 'permissionid', type: 'bigint' })
  permissionId: string;

  @Column({ name: 'canview', type: 'boolean', default: false })
  canView: boolean;

  @Column({ name: 'cancreate', type: 'boolean', default: false })
  canCreate: boolean;

  @Column({ name: 'canedit', type: 'boolean', default: false })
  canEdit: boolean;

  @Column({ name: 'candelete', type: 'boolean', default: false })
  canDelete: boolean;

  @Column({ name: 'canapprove', type: 'boolean', default: false })
  canApprove: boolean;

  @Column({ name: 'canexport', type: 'boolean', default: false })
  canExport: boolean;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleid' })
  role: Role;

  @ManyToOne(() => Permission, (perm) => perm.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionid' })
  permission: Permission;
}
