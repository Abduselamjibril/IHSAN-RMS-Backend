import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rems_notification_category')
export class NotificationCategory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_category_id' })
  id: number;

  @Column({ name: 'category_code', type: 'varchar', length: 50, unique: true })
  categoryCode: string;

  @Column({ name: 'category_name', type: 'varchar', length: 200 })
  categoryName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
