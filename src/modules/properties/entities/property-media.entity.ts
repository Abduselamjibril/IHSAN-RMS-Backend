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

@Entity('rems_property_media')
@Index('idx_rems_property_media_property', ['property'])
export class PropertyMedia {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'media_type', type: 'varchar', length: 30, nullable: true })
  mediaType: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string;

  @Column({ name: 'thumbnail_path', type: 'text', nullable: true })
  thumbnailPath: string;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @Column({ name: 'uploaded_by', type: 'bigint', nullable: true, default: 1 })
  uploadedBy: number;
}
