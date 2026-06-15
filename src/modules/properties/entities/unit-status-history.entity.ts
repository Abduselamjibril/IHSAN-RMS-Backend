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
import { UnitStatus } from './unit-status.entity';

@Entity('rems_unit_status_history')
@Index('idx_rems_unit_status_history_unit', ['unit'])
@Index('idx_rems_unit_status_history_changed', ['changedAt'])
export class UnitStatusHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @ManyToOne(() => UnitStatus)
  @JoinColumn({ name: 'old_status_id' })
  oldStatus: UnitStatus;

  @ManyToOne(() => UnitStatus)
  @JoinColumn({ name: 'new_status_id' })
  newStatus: UnitStatus;

  @Column({ name: 'changed_by', type: 'bigint', nullable: true, default: 1 })
  changedBy: number;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;
}
