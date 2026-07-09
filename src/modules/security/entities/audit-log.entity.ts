import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from './user.entity';
import { AuditLogDetail } from './audit-log-detail.entity';

@Index('IX_AuditLog_UserId', ['userId', 'activityDate'])
@Entity('rems_audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'auditlogid' })
  auditLogId: string;

  @Column({ name: 'userid', type: 'bigint' })
  userId: string;

  @Column({ name: 'modulename', length: 100 })
  moduleName: string;

  @Column({ name: 'entityname', length: 100 })
  entityName: string;

  @Column({ name: 'entityid', length: 100 })
  entityId: string;

  @Column({ name: 'actiontypeid', length: 50 })
  actionTypeId: string; // CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, LOGOUT

  @CreateDateColumn({ name: 'activitydate', type: 'timestamp' })
  activityDate: Date;

  @Column({ name: 'ipaddress', length: 100, nullable: true })
  ipAddress: string;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userid' })
  user: User;

  @OneToMany(() => AuditLogDetail, (detail) => detail.auditLog)
  details: AuditLogDetail[];
}
