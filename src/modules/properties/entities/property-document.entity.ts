import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('rems_property_document')
@Index('idx_rems_property_document_property', ['property'])
export class PropertyDocument {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'document_category', type: 'varchar', length: 100, nullable: true })
  documentCategory: string;

  @Column({ name: 'document_name', type: 'varchar', length: 255, nullable: true })
  documentName: string;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string;

  @Column({ name: 'version_number', type: 'integer', default: 1 })
  versionNumber: number;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @Column({ name: 'uploaded_by', type: 'bigint', nullable: true, default: 1 })
  uploadedBy: number;
}
