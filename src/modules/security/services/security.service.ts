import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { PermissionGroup } from '../entities/permission-group.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserSession } from '../entities/user-session.entity';
import { LoginHistory } from '../entities/login-history.entity';
import { PasswordHistory } from '../entities/password-history.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { verifyPassword, hashPassword, generateToken } from '../utils/security.crypto';
import { LoginDto, CreateUserDto, UpdateUserDto, CreateRoleDto, AssignPermissionsDto } from '../dto/security.dto';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(PermissionGroup) private readonly groupRepo: Repository<PermissionGroup>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserSession) private readonly sessionRepo: Repository<UserSession>,
    @InjectRepository(LoginHistory) private readonly loginHistoryRepo: Repository<LoginHistory>,
    @InjectRepository(PasswordHistory) private readonly passwordHistoryRepo: Repository<PasswordHistory>,
    @InjectRepository(AuditLog) private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { username: dto.username },
      relations: { userRoles: { role: true } },
    });

    if (!user) {
      await this.logLogin(null, dto.username, 'FAILED', 'User not found', dto);
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!user.isActive) {
      await this.logLogin(user.userId, dto.username, 'FAILED', 'Account is deactivated', dto);
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.isLocked) {
      await this.logLogin(user.userId, dto.username, 'LOCKED', 'Account is locked', dto);
      throw new UnauthorizedException('Account is locked. Contact administrator.');
    }

    // Check password
    const isPasswordCorrect = verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordCorrect) {
      // Handle login lockout policy (5 failed attempts in the last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const failedAttempts = await this.loginHistoryRepo.count({
        where: {
          username: dto.username,
          loginResultId: 'FAILED',
          loginDate: MoreThan(fifteenMinutesAgo),
        },
      });

      if (failedAttempts >= 4) {
        user.isLocked = true;
        await this.userRepo.save(user);
        await this.logLogin(user.userId, dto.username, 'LOCKED', 'Account locked due to consecutive failures', dto);
        throw new UnauthorizedException('Account locked due to too many failed attempts.');
      } else {
        await this.logLogin(user.userId, dto.username, 'FAILED', 'Incorrect password', dto);
        throw new UnauthorizedException('Invalid username or password');
      }
    }

    // Clear lockout on success
    user.lastLoginDate = new Date();
    await this.userRepo.save(user);

    // Get all user permissions
    const roleIds = user.userRoles.filter((ur) => ur.isActive).map((ur) => ur.roleId);
    let permissions: any[] = [];
    if (roleIds.length > 0) {
      const rolePerms = await this.rolePermRepo.find({
        where: { roleId: roleIds[0] }, // Simplify to main role or merge
        relations: { permission: true },
      });
      permissions = rolePerms.map((rp) => ({
        code: rp.permission.permissionCode,
        canView: rp.canView,
        canCreate: rp.canCreate,
        canEdit: rp.canEdit,
        canDelete: rp.canDelete,
        canApprove: rp.canApprove,
        canExport: rp.canExport,
      }));
    }

    const payload = {
      userId: user.userId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.userRoles.filter((ur) => ur.isActive).map((ur) => ur.role.roleName),
    };

    const token = generateToken(payload);

    // Register active user session
    const session = this.sessionRepo.create({
      userId: user.userId,
      sessionToken: token,
      deviceName: dto.deviceName,
      deviceType: dto.deviceType,
      browserName: dto.browserName,
      ipAddress: dto.ipAddress,
      loginDate: new Date(),
      isActive: true,
    });
    await this.sessionRepo.save(session);

    await this.logLogin(user.userId, dto.username, 'SUCCESS', null, dto);

    return {
      token,
      user: {
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        roles: payload.roles,
        permissions,
      },
    };
  }

  async logout(token: string) {
    const session = await this.sessionRepo.findOne({ where: { sessionToken: token, isActive: true } });
    if (session) {
      session.isActive = false;
      session.logoutDate = new Date();
      await this.sessionRepo.save(session);
    }
    return { success: true };
  }

  private async logLogin(userId: string | null, username: string, result: string, reason: string | null, dto: LoginDto) {
    const history = this.loginHistoryRepo.create({
      userId,
      username,
      loginDate: new Date(),
      ipAddress: dto.ipAddress,
      deviceName: dto.deviceName || 'Unknown',
      loginResultId: result,
      failureReason: reason,
    });
    await this.loginHistoryRepo.save(history);
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  async getUsers() {
    return this.userRepo.find({
      relations: { userRoles: { role: true } },
      order: { userId: 'DESC' },
    });
  }

  async createUser(dto: CreateUserDto, createdBy: string = 'ADMIN') {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) throw new BadRequestException('Username is already taken');

    const user = this.userRepo.create({
      employeeCode: dto.employeeCode,
      username: dto.username,
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      emailAddress: dto.emailAddress,
      phoneNumber: dto.phoneNumber,
      passwordHash: hashPassword(dto.password),
      departmentId: dto.departmentId,
      branchId: dto.branchId,
      isActive: true,
      isLocked: false,
      createdBy,
    });

    const saved = await this.userRepo.save(user);

    if (dto.roleIds && dto.roleIds.length > 0) {
      for (const roleId of dto.roleIds) {
        const ur = this.userRoleRepo.create({
          userId: saved.userId,
          roleId,
          effectiveFromDate: new Date(),
          isActive: true,
        });
        await this.userRoleRepo.save(ur);
      }
    }

    return this.userRepo.findOne({ where: { userId: saved.userId }, relations: { userRoles: { role: true } } });
  }

  async updateUser(id: string, dto: UpdateUserDto, updatedBy: string = 'ADMIN') {
    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.middleName) user.middleName = dto.middleName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.emailAddress) user.emailAddress = dto.emailAddress;
    if (dto.phoneNumber) user.phoneNumber = dto.phoneNumber;
    if (dto.departmentId) user.departmentId = dto.departmentId;
    if (dto.branchId) user.branchId = dto.branchId;

    if (dto.password) {
      user.passwordHash = hashPassword(dto.password);
      // Log to password history
      const history = this.passwordHistoryRepo.create({
        userId: user.userId,
        passwordHash: user.passwordHash,
      });
      await this.passwordHistoryRepo.save(history);
    }

    user.updatedBy = updatedBy;
    user.updatedDate = new Date();
    await this.userRepo.save(user);

    if (dto.roleIds) {
      await this.userRoleRepo.delete({ userId: id });
      for (const roleId of dto.roleIds) {
        const ur = this.userRoleRepo.create({
          userId: id,
          roleId,
          effectiveFromDate: new Date(),
          isActive: true,
        });
        await this.userRoleRepo.save(ur);
      }
    }

    return this.userRepo.findOne({ where: { userId: id }, relations: { userRoles: { role: true } } });
  }

  async activateUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = true;
    return this.userRepo.save(user);
  }

  async deactivateUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    return this.userRepo.save(user);
  }

  async lockUnlockUser(userId: string, isLocked: boolean) {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isLocked = isLocked;
    return this.userRepo.save(user);
  }

  // ==========================================
  // ROLE & PERMISSION MANAGEMENT
  // ==========================================
  async getRoles() {
    return this.roleRepo.find({ order: { roleId: 'ASC' } });
  }

  async createRole(dto: CreateRoleDto, createdBy: string = 'ADMIN') {
    const role = this.roleRepo.create({
      roleCode: dto.roleCode.toUpperCase(),
      roleName: dto.roleName,
      description: dto.description,
      isSystemRole: false,
      isActive: true,
      createdBy,
    });
    return this.roleRepo.save(role);
  }

  async getPermissionGroups() {
    return this.groupRepo.find({ relations: { permissions: true } });
  }

  async getRolePermissions(roleId: string) {
    return this.rolePermRepo.find({ where: { roleId }, relations: { permission: true } });
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    const role = await this.roleRepo.findOne({ where: { roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // Wipe existing
    await this.rolePermRepo.delete({ roleId });

    // Insert new
    const entities = dto.permissions.map((p) =>
      this.rolePermRepo.create({
        roleId,
        permissionId: p.permissionId,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
        canApprove: p.canApprove,
        canExport: p.canExport,
      }),
    );

    await this.rolePermRepo.save(entities);
    return { success: true };
  }

  // ==========================================
  // AUDIT LOGS & REPORTS
  // ==========================================
  async getAuditLogs() {
    return this.auditLogRepo.find({
      relations: { user: true, details: true },
      order: { activityDate: 'DESC' },
      take: 100,
    });
  }

  async getLoginHistory() {
    return this.loginHistoryRepo.find({
      relations: { user: true },
      order: { loginDate: 'DESC' },
      take: 100,
    });
  }
}
