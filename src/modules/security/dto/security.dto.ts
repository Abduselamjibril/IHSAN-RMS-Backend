import { IsString, IsNotEmpty, IsOptional, IsEmail, IsArray, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsString()
  @IsOptional()
  deviceType?: string;

  @IsString()
  @IsOptional()
  browserName?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  emailAddress?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsArray()
  @IsOptional()
  roleIds?: string[];
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @IsString()
  @IsNotEmpty()
  roleName: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class RolePermissionItemDto {
  @IsString()
  @IsNotEmpty()
  permissionId: string;

  @IsBoolean()
  canView: boolean;

  @IsBoolean()
  canCreate: boolean;

  @IsBoolean()
  canEdit: boolean;

  @IsBoolean()
  canDelete: boolean;

  @IsBoolean()
  canApprove: boolean;

  @IsBoolean()
  canExport: boolean;
}

export class AssignPermissionsDto {
  @IsArray()
  permissions: RolePermissionItemDto[];
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPasswordHash: string;

  @IsString()
  @IsNotEmpty()
  newPasswordHash: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  newPasswordHash: string;
}
