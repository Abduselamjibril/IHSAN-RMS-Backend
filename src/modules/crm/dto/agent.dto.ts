import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgentDto {
  @ApiPropertyOptional({ example: 'AGT004', description: 'Employee code' })
  employeeCode?: string;

  @ApiProperty({ example: 'Mohammed Ali', description: 'Full name of the sales agent' })
  fullName: string;

  @ApiPropertyOptional({ example: '+251911000111', description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'mohammed.ali@ihsanproperties.com', description: 'Email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'Sales', description: 'Department/Team name' })
  department?: string;

  @ApiPropertyOptional({ example: true, description: 'Is the agent active?' })
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Date the agent joined the company' })
  joinedAt?: Date;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'AGT004', description: 'Employee code' })
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Mohammed Ali Update', description: 'Full name' })
  fullName?: string;

  @ApiPropertyOptional({ example: '+251911000111', description: 'Phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'mohammed.ali@ihsanproperties.com', description: 'Email address' })
  email?: string;

  @ApiPropertyOptional({ example: 'Sales Manager', description: 'Department/Team name' })
  department?: string;

  @ApiPropertyOptional({ example: true, description: 'Is the agent active?' })
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Date the agent joined the company' })
  joinedAt?: Date;
}
