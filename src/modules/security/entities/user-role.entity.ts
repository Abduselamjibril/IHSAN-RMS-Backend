import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('rems_user_role')
export class UserRole {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'userroleid' })
  userRoleId: string;

  @Index('IX_UserRole_UserId')
  @Column({ name: 'userid', type: 'bigint' })
  userId: string;

  @Column({ name: 'roleid', type: 'bigint' })
  roleId: string;

  @Column({ name: 'effectivefromdate', type: 'timestamp' })
  effectiveFromDate: Date;

  @Column({ name: 'effectivetodate', type: 'timestamp', nullable: true })
  effectiveToDate: Date;

  @Column({ name: 'isactive', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'createddate', type: 'timestamp' })
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userid' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleid' })
  role: Role;
}
