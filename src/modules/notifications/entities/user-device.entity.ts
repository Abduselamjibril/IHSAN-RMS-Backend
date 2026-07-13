import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rems_user_device')
export class UserDevice {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_device_id' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'device_token', type: 'varchar', length: 1000 })
  deviceToken: string;

  @Column({ name: 'device_type_id', type: 'varchar', length: 50 })
  deviceType: string; // 'ANDROID', 'IOS', 'WEB'

  @Column({ name: 'device_name', type: 'varchar', length: 250, nullable: true })
  deviceName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_used_date', type: 'timestamptz', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
