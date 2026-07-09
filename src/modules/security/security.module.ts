import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { PermissionGroup } from './entities/permission-group.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { DataAccessScope } from './entities/data-access-scope.entity';
import { PasswordHistory } from './entities/password-history.entity';
import { UserSession } from './entities/user-session.entity';
import { LoginHistory } from './entities/login-history.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogDetail } from './entities/audit-log-detail.entity';
import { SecurityService } from './services/security.service';
import { SecurityController } from './controllers/security.controller';
import { SecuritySeeder } from './utils/security.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      PermissionGroup,
      Permission,
      RolePermission,
      DataAccessScope,
      PasswordHistory,
      UserSession,
      LoginHistory,
      AuditLog,
      AuditLogDetail,
    ]),
  ],
  providers: [SecurityService, SecuritySeeder],
  controllers: [SecurityController],
  exports: [SecurityService, SecuritySeeder, TypeOrmModule],
})
export class SecurityModule implements OnModuleInit {
  constructor(private readonly seeder: SecuritySeeder) {}

  async onModuleInit() {
    try {
      await this.seeder.seed();
    } catch (err) {
      console.error('Failed to run security seeder during initialization', err);
    }
  }
}
