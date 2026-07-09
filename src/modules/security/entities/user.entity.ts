import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { UserRole } from './user-role.entity';
import { UserSession } from './user-session.entity';

@Entity('rems_user')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'userid' })
  userId: string;

  @Column({ name: 'employeecode', length: 50, unique: true })
  employeeCode: string;

  @Index('IX_User_Username', { unique: true })
  @Column({ name: 'username', length: 100, unique: true })
  username: string;

  @Column({ name: 'firstname', length: 100 })
  firstName: string;

  @Column({ name: 'middlename', length: 100, nullable: true })
  middleName: string;

  @Column({ name: 'lastname', length: 100 })
  lastName: string;

  @Index('IX_User_Email')
  @Column({ name: 'emailaddress', length: 250 })
  emailAddress: string;

  @Column({ name: 'phonenumber', length: 50, nullable: true })
  phoneNumber: string;

  @Column({ name: 'passwordhash', length: 500 })
  passwordHash: string;

  @Column({ name: 'departmentid', type: 'bigint', nullable: true })
  departmentId: string;

  @Column({ name: 'branchid', type: 'bigint', nullable: true })
  branchId: string;

  @Column({ name: 'isactive', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'islocked', type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ name: 'lastlogindate', type: 'timestamp', nullable: true })
  lastLoginDate: Date;

  @Column({ name: 'passwordexpirydate', type: 'timestamp', nullable: true })
  passwordExpiryDate: Date;

  @Column({ name: 'createdby', length: 50 })
  createdBy: string;

  @CreateDateColumn({ name: 'createddate', type: 'timestamp' })
  createdDate: Date;

  @Column({ name: 'updatedby', length: 50, nullable: true })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updateddate', type: 'timestamp', nullable: true })
  updatedDate: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];
}
