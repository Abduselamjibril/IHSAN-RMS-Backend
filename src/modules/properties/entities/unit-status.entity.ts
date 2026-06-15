import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('rems_unit_status')
@Index('idx_rems_unit_status_name', ['statusName'], { unique: true })
export class UnitStatus {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'status_name', type: 'varchar', length: 50, unique: true })
  statusName: string;

  @Column({ name: 'color_code', type: 'varchar', length: 20, nullable: true })
  colorCode: string;

  @Column({ name: 'is_sellable', type: 'boolean', default: true })
  isSellable: boolean;

  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
