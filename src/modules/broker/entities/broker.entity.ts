import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('rems_broker')
@Index('IX_Broker_Status', ['statusId'])
export class Broker {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_id' })
  id: number;

  @Column({ name: 'broker_code', type: 'varchar', length: 50, unique: true })
  brokerCode: string;

  @Column({ name: 'broker_type_id', type: 'varchar', length: 50 })
  brokerTypeId: string; // INDIVIDUAL, COMPANY

  @Column({ name: 'broker_name', type: 'varchar', length: 250 })
  brokerName: string;

  @Column({ name: 'trade_license_number', type: 'varchar', length: 100, nullable: true })
  tradeLicenseNumber?: string | null;

  @Column({ name: 'tin_number', type: 'varchar', length: 100, nullable: true })
  tinNumber?: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 50 })
  phoneNumber: string;

  @Column({ name: 'alternate_phone_number', type: 'varchar', length: 50, nullable: true })
  alternatePhoneNumber?: string | null;

  @Column({ name: 'email_address', type: 'varchar', length: 250, nullable: true })
  emailAddress?: string | null;

  @Column({ name: 'address', type: 'varchar', length: 500, nullable: true })
  address?: string | null;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ name: 'status_id', type: 'varchar', length: 50, default: 'ACTIVE' })
  statusId: string; // ACTIVE, INACTIVE, BLACKLISTED

  @Column({ name: 'remarks', type: 'varchar', length: 1000, nullable: true })
  remarks?: string | null;

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 50, nullable: true })
  updatedBy?: string | null;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz', nullable: true })
  updatedAt?: Date | null;
}
