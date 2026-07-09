import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('rems_data_access_scope')
export class DataAccessScope {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'dataaccessscopeid' })
  dataAccessScopeId: string;

  @Column({ name: 'userid', type: 'bigint' })
  userId: string;

  @Column({ name: 'scopetypeid', length: 50 })
  scopeTypeId: string; // PROJECT, BRANCH, DEPARTMENT, REGION

  @Column({ name: 'scopereferenceid', type: 'bigint' })
  scopeReferenceId: string;

  @CreateDateColumn({ name: 'createddate', type: 'timestamp' })
  createdDate: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userid' })
  user: User;
}
