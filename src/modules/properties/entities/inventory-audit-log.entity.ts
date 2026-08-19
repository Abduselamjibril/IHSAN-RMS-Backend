import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Unit } from './unit.entity';

@Entity('rems_inventory_audit_log')
@Index('idx_rems_inventory_audit_log_unit', ['unit'])
@Index('idx_rems_inventory_audit_log_changed', ['changedAt'])
export class InventoryAuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'field_name', type: 'varchar', length: 100 })
  fieldName: string;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue: string | null;

  @Column({ name: 'changed_by', type: 'varchar', length: 150, nullable: true })
  changedBy: string | null;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;
}
