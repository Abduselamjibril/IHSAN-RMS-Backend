import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('rems_unit_import_log')
@Index('idx_rems_unit_import_log_ref', ['importReference'])
@Index('idx_rems_unit_import_log_status', ['importStatus'])
export class UnitImportLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'import_reference', type: 'varchar', length: 100, nullable: true })
  importReference: string;

  @Column({ name: 'imported_file_name', type: 'varchar', length: 255, nullable: true })
  importedFileName: string;

  @Column({ name: 'total_records', type: 'integer', nullable: true })
  totalRecords: number;

  @Column({ name: 'successful_records', type: 'integer', nullable: true })
  successfulRecords: number;

  @Column({ name: 'failed_records', type: 'integer', nullable: true })
  failedRecords: number;

  @Column({ name: 'import_status', type: 'varchar', length: 50, nullable: true })
  importStatus: string;

  @Column({ name: 'error_log', type: 'text', nullable: true })
  errorLog: string;

  @CreateDateColumn({ name: 'imported_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  importedAt: Date;

  @Column({ name: 'imported_by', type: 'bigint', nullable: true, default: 1 })
  importedBy: number;
}
