import { Controller, Get, Post, Put, Body, Param, Headers, UnauthorizedException, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SecurityService } from '../services/security.service';
import { LoginDto, CreateUserDto, UpdateUserDto, CreateRoleDto, AssignPermissionsDto } from '../dto/security.dto';

@ApiTags('Security')
@Controller('api')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Authenticate user and issue JWT session token' })
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    let ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    if (Array.isArray(ip)) {
      ip = ip[0];
    } else if (typeof ip === 'string') {
      ip = ip.split(',')[0].trim();
    }
    const result = await this.securityService.login(dto, ip, userAgent);
    
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return result;
  }

  @Post('auth/logout')
  @ApiOperation({ summary: 'Terminate active session' })
  async logout(@Headers('authorization') authHeader: string, @Req() req: any, @Res({ passthrough: true }) res: any) {
    res.clearCookie('auth_token', { path: '/' });
    const cookieToken = (req.headers.cookie || '').split(';').map((item: string) => item.trim()).find((item: string) => item.startsWith('auth_token='))?.slice('auth_token='.length);
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : cookieToken;
    if (!token) return { success: true };
    return this.securityService.logout(token);
  }

  // ==========================================
  // USERS ENDPOINTS
  // ==========================================
  @Get('users')
  @ApiOperation({ summary: 'Get list of all users' })
  async getUsers() {
    return this.securityService.getUsers();
  }

  @Post('users')
  @ApiOperation({ summary: 'Onboard a new system user' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.securityService.createUser(dto);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update system user details' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.securityService.updateUser(id, dto);
  }

  @Post('users/:id/activate')
  @ApiOperation({ summary: 'Activate user account' })
  async activateUser(@Param('id') id: string) {
    return this.securityService.activateUser(id);
  }

  @Post('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  async deactivateUser(@Param('id') id: string) {
    return this.securityService.deactivateUser(id);
  }

  @Post('users/:id/lock')
  @ApiOperation({ summary: 'Lock user account' })
  async lockUser(@Param('id') id: string) {
    return this.securityService.lockUnlockUser(id, true);
  }

  @Post('users/:id/unlock')
  @ApiOperation({ summary: 'Unlock user account' })
  async unlockUser(@Param('id') id: string) {
    return this.securityService.lockUnlockUser(id, false);
  }

  // ==========================================
  // ROLES & PERMISSIONS ENDPOINTS
  // ==========================================
  @Get('roles')
  @ApiOperation({ summary: 'Get all configurable security roles' })
  async getRoles() {
    return this.securityService.getRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new security role' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.securityService.createRole(dto);
  }

  @Get('permissions/groups')
  @ApiOperation({ summary: 'Get all permission groups and permission list' })
  async getPermissionGroups() {
    return this.securityService.getPermissionGroups();
  }

  @Get('roles/:id/permissions')
  @ApiOperation({ summary: 'Get permissions mapping for a role' })
  async getRolePermissions(@Param('id') id: string) {
    return this.securityService.getRolePermissions(id);
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  async assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.securityService.assignPermissions(id, dto);
  }

  // ==========================================
  // AUDIT LOGS & EVENTS
  // ==========================================
  @Get('security/audit-logs')
  @ApiOperation({ summary: 'Get audit logs history log' })
  async getAuditLogs() {
    return this.securityService.getAuditLogs();
  }

  @Get('security/login-history')
  @ApiOperation({ summary: 'Get user login history logs' })
  async getLoginHistory() {
    return this.securityService.getLoginHistory();
  }
}
