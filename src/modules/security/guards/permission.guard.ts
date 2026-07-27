import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { verifyToken, hashToken } from '../utils/security.crypto';
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

    // 1. Check for intentionally public endpoints (Login, Root Health Check, Swagger Documentation)
    if (
      (method === 'POST' && routePath === '/api/auth/login') ||
      (method === 'GET' && routePath === '/') ||
      routePath.startsWith('/api/docs')
    ) {
      return true;
    }

    // 2. Validate token
    const authHeader = headers['authorization'];
    const cookieToken = (headers['cookie'] || '').split(';').map((item: string) => item.trim()).find((item: string) => item.startsWith('auth_token='))?.slice('auth_token='.length);
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : cookieToken;
    if (!token) {
      throw new UnauthorizedException('Authorization credentials not provided');
    }
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedException('Invalid or expired security token');
    }

    // Check session validity using hashed token
    const hashedSessionToken = hashToken(token);
    const activeSession = await this.dataSource.query(
      `SELECT 1 FROM rems_user_session
       WHERE sessiontoken = $1 AND userid = $2 AND isactive = true
       LIMIT 1`,
      [hashedSessionToken, decoded.userId]
    );
    if (!activeSession.length) {
      throw new UnauthorizedException('This login session is no longer active');
    }

    // Attach decoded user info to request context
    request.user = decoded;

    // 3. Superadmin bypass
    if (decoded.roles && decoded.roles.includes('System Administrator')) {
      return true;
    }

    // 4. Authenticated-only base endpoints (allowing users to access their own notifications, inbox, and settings)
    if (
      (method === 'POST' && routePath === '/api/auth/logout') ||
      ((method === 'GET' && routePath === '/api/notifications/inbox') && (!request.query.userId || String(decoded.userId) === String(request.query.userId))) ||
      ((method === 'GET' && routePath === '/api/notifications/unread-count') && (!request.query.userId || String(decoded.userId) === String(request.query.userId))) ||
      ((method === 'POST' && routePath === '/api/notifications/read') && (!request.query.userId || String(decoded.userId) === String(request.query.userId))) ||
      ((method === 'GET' && routePath === '/api/notifications/preferences') && (!request.query.userId || String(decoded.userId) === String(request.query.userId))) ||
      ((method === 'POST' && routePath === '/api/notifications/preferences') && (!request.query.userId || String(decoded.userId) === String(request.query.userId))) ||
      (method === 'PUT' && routePath === '/api/users/:id' && decoded.userId === request.params.id)
    ) {
      return true;
    }

    // 5. Find matching seeded permission rule
    const seedPerm = SEEDED_PERMISSIONS.find(
      (sp) => sp.method === method && sp.path === routePath
    );

    // Deny by default: If the endpoint is NOT registered in seeded-permissions,
    // and is not in the public or authenticated-only lists, reject it.
    if (!seedPerm) {
      throw new ForbiddenException(`Access Denied: Unmapped API route path ${routePath} is protected.`);
    }

    // 6. Query database for user permissions matrix mappings
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

    // 7. Verify action capability switch
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
