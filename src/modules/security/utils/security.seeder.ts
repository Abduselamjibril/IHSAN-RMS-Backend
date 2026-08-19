import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { PermissionGroup } from '../entities/permission-group.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { hashPassword } from './security.crypto';
import { SEEDED_PERMISSIONS } from '../seeded-permissions';

@Injectable()
export class SecuritySeeder {
  private readonly logger = new Logger(SecuritySeeder.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole) private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(PermissionGroup) private readonly groupRepo: Repository<PermissionGroup>,
    @InjectRepository(Permission) private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private readonly rolePermRepo: Repository<RolePermission>,
  ) {}

  async seed() {
    this.logger.log('Starting Security database seeding...');

    // 1. Seed Permission Groups & Permissions
    const groupsMap = new Map<string, PermissionGroup>();
    for (const seed of SEEDED_PERMISSIONS) {
      const groupCode = seed.module.toUpperCase();
      let group: PermissionGroup | null | undefined = groupsMap.get(groupCode);
      if (!group) {
        group = await this.groupRepo.findOne({ where: { groupCode } });
        if (!group) {
          const newGroup = this.groupRepo.create({
            groupCode,
            groupName: `${seed.module} Module Permissions`,
          });
          group = await this.groupRepo.save(newGroup);
          this.logger.log(`Created permission group: ${groupCode}`);
        }
        groupsMap.set(groupCode, group);
      }

      let permission = await this.permissionRepo.findOne({ where: { permissionCode: seed.name } });
      if (!permission) {
        permission = this.permissionRepo.create({
          permissionGroupId: group!.permissionGroupId,
          permissionCode: seed.name,
          permissionName: seed.description,
          description: `${seed.method} ${seed.path} in ${seed.controller}`,
        });
        await this.permissionRepo.save(permission);
      }
    }
    this.logger.log('Permissions metadata seeded successfully.');

    // 2. Seed Standard Roles
    const standardRoles = [
      { code: 'SYS_ADMIN', name: 'System Administrator', desc: 'Full system access & administrative controls' },
      { code: 'SALES_MGR', name: 'Sales Manager', desc: 'Manages sales activities and performance reviews' },
      { code: 'SALES_OFFICER', name: 'Sales Officer', desc: 'Creates leads, runs quotations, and manages reservations' },
      { code: 'FINANCE_MGR', name: 'Finance Manager', desc: 'Approves disbursements, reviews receipts, and sets up settings' },
      { code: 'FINANCE_OFFICER', name: 'Finance Officer', desc: 'Registers collections and views payment logs' },
      { code: 'INV_MGR', name: 'Inventory Manager', desc: 'Manages property parameters, floor plans, and amenities' },
      { code: 'MKT_MGR', name: 'Marketing Manager', desc: 'Launches marketing campaigns and configures ad metrics' },
      { code: 'BRK_MGR', name: 'Broker Manager', desc: 'Manages broker listings, assignments, and payments' },
      { code: 'EXEC', name: 'Executive Management', desc: 'Views dashboards, summaries, and executive reports' },
    ];

    const roleEntities: { [code: string]: Role } = {};
    for (const r of standardRoles) {
      let roleEntity = await this.roleRepo.findOne({ where: { roleCode: r.code } });
      if (!roleEntity) {
        roleEntity = this.roleRepo.create({
          roleCode: r.code,
          roleName: r.name,
          description: r.desc,
          isSystemRole: r.code === 'SYS_ADMIN',
          isActive: true,
          createdBy: 'SEEDER',
        });
        roleEntity = await this.roleRepo.save(roleEntity);
        this.logger.log(`Created standard role: ${r.name}`);
      }
      roleEntities[r.code] = roleEntity;
    }

    // 3. Grant permissions to standard roles
    const allPermissions = await this.permissionRepo.find();

    // Helper to assign role capabilities
    const assignRolePermissions = async (
      roleCode: string,
      filterFn: (permCode: string) => boolean,
      capabilities: { canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean; canApprove?: boolean; canExport?: boolean },
    ) => {
      const role = roleEntities[roleCode];
      if (!role) return;
      const existing = await this.rolePermRepo.find({ where: { roleId: role.roleId } });
      const existingIds = new Set(existing.map((e) => e.permissionId));
      const toSave: RolePermission[] = [];

      for (const p of allPermissions) {
        if (filterFn(p.permissionCode) && !existingIds.has(p.permissionId)) {
          toSave.push(
            this.rolePermRepo.create({
              roleId: role.roleId,
              permissionId: p.permissionId,
              canView: capabilities.canView ?? true,
              canCreate: capabilities.canCreate ?? false,
              canEdit: capabilities.canEdit ?? false,
              canDelete: capabilities.canDelete ?? false,
              canApprove: capabilities.canApprove ?? false,
              canExport: capabilities.canExport ?? false,
            }),
          );
        }
      }
      if (toSave.length > 0) {
        await this.rolePermRepo.save(toSave);
        this.logger.log(`Assigned ${toSave.length} permissions to role: ${roleCode}`);
      }
    };

    // SYS_ADMIN gets everything
    await assignRolePermissions('SYS_ADMIN', () => true, {
      canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true,
    });

    // INV_MGR (Inventory Manager): full Property & Unit & Approvals
    await assignRolePermissions('INV_MGR', (code) => code.startsWith('property.'), {
      canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true,
    });

    // SALES_MGR (Sales Manager): view inventory, submit/approve price changes, promotions
    await assignRolePermissions('SALES_MGR', (code) => code.startsWith('property.'), {
      canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true,
    });

    // SALES_OFFICER (Sales Executive): view units, submit price change requests (canCreate: true, canApprove: false)
    await assignRolePermissions('SALES_OFFICER', (code) => code.startsWith('property.units.') || code.startsWith('property.pricing.change_requests') || code.startsWith('property.properties.'), {
      canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: true,
    });

    // EXEC (Executive Management): view and export everything
    await assignRolePermissions('EXEC', () => true, {
      canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true,
    });

    // 4. Seed Default Admin User
    let adminUser = await this.userRepo.findOne({ where: { username: 'admin' } });
    const finalPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    if (!adminUser) {
      adminUser = this.userRepo.create({
        employeeCode: 'EMP-0001',
        username: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        emailAddress: 'admin@ihsanrems.com',
        phoneNumber: '+251911000000',
        passwordHash: hashPassword(finalPassword),
        isActive: true,
        isLocked: false,
        forcePasswordChange: false,
        createdBy: 'SEEDER',
      });
      adminUser = await this.userRepo.save(adminUser);
      this.logger.log('Created default admin user (username: admin).');
    } else {
      adminUser.passwordHash = hashPassword(finalPassword);
      adminUser.isLocked = false;
      adminUser.isActive = true;
      adminUser.forcePasswordChange = false;
      await this.userRepo.save(adminUser);
      this.logger.log('Reset admin user password and unlocked account.');
    }

      // Link User to SYS_ADMIN Role
      const userRoleRelation = this.userRoleRepo.create({
        userId: adminUser.userId,
        roleId: roleEntities['SYS_ADMIN'].roleId,
        effectiveFromDate: new Date(),
        isActive: true,
      });
      await this.userRoleRepo.save(userRoleRelation);
      this.logger.log('Linked default admin user to System Administrator role.');

    this.logger.log('Security database seeding completed.');
  }
}
