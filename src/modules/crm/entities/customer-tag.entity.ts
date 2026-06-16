import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Lead } from './lead.entity';

@Entity('crm_customer_tag')
export class CustomerTag {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'tag_name', type: 'varchar', length: 50, unique: true })
  tagName: string;

  @Column({ name: 'color_code', type: 'varchar', length: 20, default: '#6b7280' })
  colorCode: string;

  @ManyToMany(() => Lead, (lead) => lead.tags)
  leads: Lead[];
}
