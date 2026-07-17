import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { verifyToken } from '../utils/security.crypto';
import { SEEDED_PERMISSIONS } from '../../../../seeded-permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { method, headers } = request;
    const routePath = request.route?.path;

    if (!routePath) {
      return true; // Bypasses if not a registered route
    }

    // 1. Find matching seeded permission rule
    const seedPerm = SEEDED_PERMISSIONS.find(
      (sp) => sp.method === method && sp.path === routePath
    );

    // If endpoint is not registered in seeded-permissions, it is public
    if (!seedPerm) {
      return true;
    }

    // 2. Validate token
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization credentials not provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedException('Invalid or expired security token');
    }

    // A valid JWT alone is not enough: its server-side session must still be active.
    // This ensures logout/revocation takes effect immediately instead of waiting for expiry.
    const activeSession = await this.dataSource.query(
      `SELECT 1 FROM rems_user_session
       WHERE sessiontoken = $1 AND userid = $2 AND isactive = true
       LIMIT 1`,
      [token, decoded.userId]
    );
    if (!activeSession.length) {
      throw new UnauthorizedException('This login session is no longer active');
    }

    // Attach decoded user info to request context for controllers to use
    request.user = decoded;

    // 3. Superadmin bypass
    if (decoded.roles && decoded.roles.includes('System Administrator')) {
      return true;
    }

    // 4. Query database for user permissions matrix mappings
    const userPermissions = await this.dataSource.query(
      `SELECT p.permissioncode as code, 
              rp.canview as "canView", 
              rp.cancreate as "canCreate", 
              rp.canedit as "canEdit", 
              rp.candelete as "canDelete", 
              rp.canapprove as "canApprove", 
              rp.canexport as "canExport"
       FROM rems_user_role ur
       INNER JOIN rems_role_permission rp ON ur.roleid = rp.roleid
       INNER JOIN rems_permission p ON rp.permissionid = p.permissionid
       WHERE ur.userid = $1 AND ur.isactive = true`,
      [decoded.userId]
    );

    const userPerm = userPermissions.find((up: any) => up.code === seedPerm.name);
    if (!userPerm) {
      throw new ForbiddenException(`Access Denied: You do not possess capability mapping for ${seedPerm.name}`);
    }

    // 5. Verify action capability switch
    let hasAccess = false;
    if (method === 'GET') {
      hasAccess = userPerm.canView;
    } else if (method === 'POST') {
      hasAccess = userPerm.canCreate;
    } else if (method === 'PUT' || method === 'PATCH') {
      hasAccess = userPerm.canEdit;
    } else if (method === 'DELETE') {
      hasAccess = userPerm.canDelete;
    }

    if (!hasAccess) {
      throw new ForbiddenException(`Access Denied: Action level unauthorized for capability ${seedPerm.name}`);
    }

    return true;
  }
}
