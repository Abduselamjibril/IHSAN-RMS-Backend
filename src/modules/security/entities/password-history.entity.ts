import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('rems_password_history')
export class PasswordHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'passwordhistoryid' })
  passwordHistoryId: string;

  @Column({ name: 'userid', type: 'bigint' })
  userId: string;

  @Column({ name: 'passwordhash', length: 500 })
  passwordHash: string;

  @CreateDateColumn({ name: 'changeddate', type: 'timestamp' })
  changedDate: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userid' })
  user: User;
}
