import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity('rems_permission_group')
export class PermissionGroup {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'permissiongroupid' })
  permissionGroupId: string;

  @Column({ name: 'groupcode', length: 50, unique: true })
  groupCode: string;

  @Column({ name: 'groupname', length: 250 })
  groupName: string;

  @OneToMany(() => Permission, (permission) => permission.permissionGroup)
  permissions: Permission[];
}
