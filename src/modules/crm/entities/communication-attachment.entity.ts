import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Communication } from './communication.entity';

@Entity('crm_communication_attachment')
export class CommunicationAttachment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Communication, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communication_id' })
  communication: Communication;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @Column({ name: 'uploaded_by', type: 'bigint', nullable: true })
  uploadedBy: number;
}
