import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('crm_communication_channel')
export class CommunicationChannel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'channel_name', type: 'varchar', length: 50, unique: true })
  channelName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
