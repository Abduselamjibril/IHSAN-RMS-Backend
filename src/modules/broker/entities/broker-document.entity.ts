import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Broker } from './broker.entity';

@Entity('rems_broker_document')
export class BrokerDocument {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_document_id' })
  id: number;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @Column({ name: 'document_type_id', type: 'varchar', length: 50 })
  documentTypeId: string; // LICENSE, TIN, ID, AGREEMENT

  @Column({ name: 'document_name', type: 'varchar', length: 250 })
  documentName: string;

  @Column({ name: 'file_name', type: 'varchar', length: 500 })
  fileName: string;

  @Column({ name: 'file_path', type: 'varchar', length: 1000 })
  filePath: string;

  @Column({ name: 'expiry_date', type: 'timestamptz', nullable: true })
  expiryDate: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
