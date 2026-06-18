import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesContract } from './sales-contract.entity';

@Entity('sales_contract_document')
export class SalesContractDocument {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'document_id' })
  id: number;

  @ManyToOne(() => SalesContract, (contract) => contract.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SalesContract;

  @Column({ name: 'file_name', type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath: string;

  @Column({ name: 'uploaded_by', type: 'bigint', nullable: true, default: 1 })
  uploadedBy: number;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;
}
