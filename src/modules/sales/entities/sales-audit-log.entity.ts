import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sales_audit_log')
export class SalesAuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'audit_id' })
  id: number;

  @Column({ name: 'entity_name', type: 'varchar', length: 100, nullable: true })
  entityName: string;

  @Column({ name: 'entity_id', type: 'bigint', nullable: true })
  entityId: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  action: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: any;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: any;

  @Column({ name: 'changed_by', type: 'bigint', nullable: true })
  changedBy: number;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;
}
