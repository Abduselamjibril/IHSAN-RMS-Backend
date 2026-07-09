import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Index('IX_LoginHistory_UserId', ['userId', 'loginDate'])
@Entity('rems_login_history')
export class LoginHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'loginhistoryid' })
  loginHistoryId: string;

  @Column({ name: 'userid', type: 'bigint', nullable: true })
  userId: string | null;

  @Column({ name: 'username', length: 100 })
  username: string;

  @Column({ name: 'logindate', type: 'timestamp' })
  loginDate: Date;

  @Column({ type: 'varchar', name: 'ipaddress', length: 100, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', name: 'devicename', length: 250, nullable: true })
  deviceName: string | null;

  @Column({ name: 'loginresultid', length: 50 })
  loginResultId: string; // SUCCESS, FAILED, LOCKED, PASSWORD_EXPIRED

  @Column({ type: 'varchar', name: 'failurereason', length: 500, nullable: true })
  failureReason: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userid' })
  user: User;
}
