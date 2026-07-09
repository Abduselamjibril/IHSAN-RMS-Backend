import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Entity('rems_audit_log_detail')
export class AuditLogDetail {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'auditlogdetailid' })
  auditLogDetailId: string;

  @Column({ name: 'auditlogid', type: 'bigint' })
  auditLogId: string;

  @Column({ name: 'fieldname', length: 100 })
  fieldName: string;

  @Column({ name: 'oldvalue', type: 'text', nullable: true })
  oldValue: string;

  @Column({ name: 'newvalue', type: 'text', nullable: true })
  newValue: string;

  @ManyToOne(() => AuditLog, (log) => log.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auditlogid' })
  auditLog: AuditLog;
}
