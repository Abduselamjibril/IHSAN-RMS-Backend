import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { CustomerSegmentRule } from './customer-segment-rule.entity';
import { Lead } from './lead.entity';

@Entity('crm_customer_segment')
export class CustomerSegment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'segment_name', type: 'varchar', length: 100, unique: true })
  segmentName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => CustomerSegmentRule, (rule) => rule.segment, { cascade: true, onDelete: 'CASCADE' })
  rules: CustomerSegmentRule[];

  @ManyToMany(() => Lead)
  @JoinTable({
    name: 'crm_customer_segment_member',
    joinColumn: { name: 'segment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'lead_id', referencedColumnName: 'id' },
  })
  members: Lead[];
}
