import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('rems_user_session')
export class UserSession {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'usersessionid' })
  userSessionId: string;

  @Column({ name: 'userid', type: 'bigint' })
  userId: string;

  @Column({ name: 'sessiontoken', length: 500 })
  sessionToken: string;

  @Column({ name: 'devicename', length: 250, nullable: true })
  deviceName: string;

  @Column({ name: 'devicetype', length: 100, nullable: true })
  deviceType: string;

  @Column({ name: 'browsername', length: 100, nullable: true })
  browserName: string;

  @Column({ name: 'ipaddress', length: 100, nullable: true })
  ipAddress: string;

  @Column({ name: 'logindate', type: 'timestamp' })
  loginDate: Date;

  @Column({ name: 'logoutdate', type: 'timestamp', nullable: true })
  logoutDate: Date;

  @Column({ name: 'isactive', type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userid' })
  user: User;
}
