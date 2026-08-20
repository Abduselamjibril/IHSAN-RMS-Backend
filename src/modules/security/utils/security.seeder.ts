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
      const existingMap = new Map(existing.map((e) => [e.permissionId, e]));
      const toSave: RolePermission[] = [];

      for (const p of allPermissions) {
        if (filterFn(p.permissionCode)) {
          const existingItem = existingMap.get(p.permissionId);
          if (!existingItem) {
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
          } else {
            // Update capabilities if needed
            existingItem.canView = capabilities.canView ?? existingItem.canView;
            existingItem.canCreate = capabilities.canCreate ?? existingItem.canCreate;
            existingItem.canEdit = capabilities.canEdit ?? existingItem.canEdit;
            existingItem.canDelete = capabilities.canDelete ?? existingItem.canDelete;
            existingItem.canApprove = capabilities.canApprove ?? existingItem.canApprove;
            existingItem.canExport = capabilities.canExport ?? existingItem.canExport;
            toSave.push(existingItem);
          }
        }
      }
      if (toSave.length > 0) {
        await this.rolePermRepo.save(toSave);
        this.logger.log(`Assigned/Updated ${toSave.length} permissions for role: ${roleCode}`);
      }
    };

    // SYS_ADMIN gets everything
    await assignRolePermissions('SYS_ADMIN', () => true, {
      canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true,
    });

    // SALES_MGR (Sales Manager): full Sales, CRM, Property views, Broker & Reports
    await assignRolePermissions(
      'SALES_MGR',
      (code) => code.startsWith('sales.') || code.startsWith('crm.') || code.startsWith('property.') || code.startsWith('broker.') || code.startsWith('finance.balances.') || code.startsWith('finance.reports.'),
      { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true }
    );

    // SALES_OFFICER (Sales Officer / Executive): Quotations, Bookings, Discount Requests, View units & contracts
    await assignRolePermissions(
      'SALES_OFFICER',
      (code) =>
        code.startsWith('sales.quotations.') ||
        code === 'sales.bookings.create' ||
        code === 'sales.bookings.read_all' ||
        code === 'sales.discounts.request' ||
        code === 'sales.discounts.read_all' ||
        code === 'sales.contracts.read_all' ||
        code.startsWith('sales.installments.') ||
        code.startsWith('crm.') ||
        code.startsWith('property.units.') ||
        code.startsWith('property.properties.') ||
        code.startsWith('property.pricing.change_requests'),
      { canView: true, canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: true }
    );

    // FINANCE_MGR (Finance Manager): full Finance, Commission Approvals, Payment Reversals/Adjustments, Booking Finance Approvals
    await assignRolePermissions(
      'FINANCE_MGR',
      (code) =>
        code.startsWith('finance.') ||
        code.startsWith('sales.commissions.') ||
        code === 'sales.bookings.finance_review' ||
        code.startsWith('sales.contracts.') ||
        code.startsWith('sales.installments.') ||
        code.startsWith('property.'),
      { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true }
    );

    // FINANCE_OFFICER (Finance Officer): Collections, Payments, Receipts, Due-Date Reminders, Statements, Aging
    await assignRolePermissions(
      'FINANCE_OFFICER',
      (code) =>
        code.startsWith('finance.payments.') ||
        code.startsWith('finance.receipts.') ||
        code.startsWith('finance.balances.') ||
        code.startsWith('finance.statements.') ||
        code.startsWith('finance.reminders.') ||
        code.startsWith('finance.reports.') ||
        code === 'sales.bookings.finance_review' ||
        code === 'sales.commissions.read_all' ||
        code.startsWith('sales.installments.'),
      { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true }
    );

    // INV_MGR (Inventory Manager): full Property & Unit Inventory & Price Approvals
    await assignRolePermissions(
      'INV_MGR',
      (code) => code.startsWith('property.') || code === 'sales.contracts.read_all' || code === 'sales.quotations.read_all',
      { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true }
    );

    // BRK_MGR (Broker Manager): Broker & Commissions
    await assignRolePermissions(
      'BRK_MGR',
      (code) => code.startsWith('broker.') || code.startsWith('sales.commissions.') || code.startsWith('sales.contracts.read_all'),
      { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true }
    );

    // MKT_MGR (Marketing Manager): Marketing & CRM Leads
    await assignRolePermissions(
      'MKT_MGR',
      (code) => code.startsWith('marketing.') || code.startsWith('crm.'),
      { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true }
    );

    // EXEC (Executive Management): View and export all modules
    await assignRolePermissions('EXEC', () => true, {
      canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true,
    });

    // 4. Seed Standard Default Users
    const seedUsers = [
      { emp: 'EMP-0001', username: 'admin', first: 'System', last: 'Administrator', email: 'admin@ihsanrems.com', role: 'SYS_ADMIN' },
      { emp: 'EMP-0002', username: 'sales.manager', first: 'Abebe', last: 'SalesMgr', email: 'sales.mgr@ihsanrems.com', role: 'SALES_MGR' },
      { emp: 'EMP-0003', username: 'sales.officer', first: 'Dawit', last: 'SalesOfficer', email: 'sales.officer@ihsanrems.com', role: 'SALES_OFFICER' },
      { emp: 'EMP-0004', username: 'finance.manager', first: 'Hanan', last: 'FinanceMgr', email: 'finance.mgr@ihsanrems.com', role: 'FINANCE_MGR' },
      { emp: 'EMP-0005', username: 'finance.officer', first: 'Yonas', last: 'FinanceOfficer', email: 'finance.officer@ihsanrems.com', role: 'FINANCE_OFFICER' },
      { emp: 'EMP-0006', username: 'inventory.manager', first: 'Solomon', last: 'InvMgr', email: 'inv.mgr@ihsanrems.com', role: 'INV_MGR' },
      { emp: 'EMP-0007', username: 'broker.manager', first: 'Elias', last: 'BrokerMgr', email: 'broker.mgr@ihsanrems.com', role: 'BRK_MGR' },
      { emp: 'EMP-0008', username: 'marketing.manager', first: 'Sara', last: 'MarketingMgr', email: 'mkt.mgr@ihsanrems.com', role: 'MKT_MGR' },
      { emp: 'EMP-0009', username: 'executive', first: 'Almaz', last: 'Executive', email: 'exec@ihsanrems.com', role: 'EXEC' },
    ];

    const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    for (const u of seedUsers) {
      let userEntity = await this.userRepo.findOne({ where: { username: u.username } });
      if (!userEntity) {
        userEntity = this.userRepo.create({
          employeeCode: u.emp,
          username: u.username,
          firstName: u.first,
          lastName: u.last,
          emailAddress: u.email,
          phoneNumber: '+251911000000',
          passwordHash: hashPassword(defaultPassword),
          isActive: true,
          isLocked: false,
          forcePasswordChange: false,
          createdBy: 'SEEDER',
        });
        userEntity = await this.userRepo.save(userEntity);
        this.logger.log(`Created default user: ${u.username}`);
      } else {
        userEntity.passwordHash = hashPassword(defaultPassword);
        userEntity.isLocked = false;
        userEntity.isActive = true;
        userEntity.forcePasswordChange = false;
        await this.userRepo.save(userEntity);
      }

      // Link User to Role
      const role = roleEntities[u.role];
      if (role) {
        let existingUserRole = await this.userRoleRepo.findOne({
          where: { userId: userEntity.userId, roleId: role.roleId },
        });
        if (!existingUserRole) {
          existingUserRole = this.userRoleRepo.create({
            userId: userEntity.userId,
            roleId: role.roleId,
            effectiveFromDate: new Date(),
            isActive: true,
          });
          await this.userRoleRepo.save(existingUserRole);
          this.logger.log(`Linked user ${u.username} to role ${u.role}`);
        }
      }
    }

    this.logger.log('Security database seeding completed successfully.');
  }
}
