import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomerSegment } from './customer-segment.entity';

@Entity('crm_customer_segment_rule')
export class CustomerSegmentRule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => CustomerSegment, (segment) => segment.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segment_id' })
  segment: CustomerSegment;

  @Column({ name: 'field_name', type: 'varchar', length: 50 })
  fieldName: string;

  @Column({ type: 'varchar', length: 20 })
  operator: string;

  @Column({ type: 'varchar', length: 255 })
  value: string;
}
