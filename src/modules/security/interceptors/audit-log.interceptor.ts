import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataSource } from 'typeorm';
import { verifyToken } from '../utils/security.crypto';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;

    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return next.handle();
    }

    // Exclude security logs leak
    if (url.includes('/auth/login')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const authHeader = headers['authorization'];
          if (!authHeader) return;
          const token = authHeader.replace('Bearer ', '');
          const decoded = verifyToken(token);
          if (!decoded || !decoded.userId) return;

          // Parse module & entity info from route segment
          const pathParts = url.split('?')[0].split('/');
          const moduleName = pathParts[2] || 'SYSTEM';
          const entityName = pathParts[3] || 'ENTITY';
          const entityId = response?.id || response?.userId || response?.roleId || response?.workflowDefinitionId || pathParts[4] || 'N/A';

          const actionTypeId = method === 'POST' ? 'CREATE' : (method === 'DELETE' ? 'DELETE' : 'UPDATE');

          const queryRunner = this.dataSource.createQueryRunner();
          await queryRunner.connect();
          await queryRunner.startTransaction();

          try {
            const auditResult = await queryRunner.manager.query(
              `INSERT INTO rems_audit_log (userid, modulename, entityname, entityid, actiontypeid, activitydate, ipaddress, remarks)
               VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7) RETURNING auditlogid`,
              [
                decoded.userId,
                moduleName.toUpperCase(),
                entityName.toUpperCase(),
                String(entityId),
                actionTypeId,
                request.ip || '127.0.0.1',
                `User performed ${actionTypeId} action on ${entityName}`,
              ]
            );

            const auditLogId = auditResult[0]?.auditlogid;

            // If Update, save modified fields
            if (actionTypeId === 'UPDATE' && body && auditLogId) {
              for (const key of Object.keys(body)) {
                if (['password', 'passwordHash', 'passwordhash'].includes(key)) continue; // skip password logging
                const newVal = body[key];
                if (newVal !== undefined && typeof newVal !== 'object') {
                  await queryRunner.manager.query(
                    `INSERT INTO rems_audit_log_detail (auditlogid, fieldname, oldvalue, newvalue)
                     VALUES ($1, $2, $3, $4)`,
                    [auditLogId, key, 'PREVIOUS_VALUE', String(newVal)]
                  );
                }
              }
            }

            await queryRunner.commitTransaction();
          } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Audit interceptor transaction failed', err);
          } finally {
            await queryRunner.release();
          }
        } catch (e) {
          console.error('Audit logging failed', e);
        }
      })
    );
  }
}
