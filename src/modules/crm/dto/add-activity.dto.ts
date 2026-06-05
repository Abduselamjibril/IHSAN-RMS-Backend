import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddActivityDto {
  @ApiProperty({ example: 'Call', description: 'Type of activity (e.g., Call, Meeting, Site Visit, Email)' })
  activityType: string;

  @ApiPropertyOptional({ example: '2026-06-01T10:00:00Z', description: 'Date and time of the activity' })
  activityDate?: Date;

  @ApiPropertyOptional({ example: 'Initial Intro Call', description: 'Subject or title of activity' })
  subject?: string;

  @ApiPropertyOptional({ example: 'Discussed budget and property requirements', description: 'Detailed notes' })
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of the sales agent who performed the action' })
  performedBy?: number;

  @ApiPropertyOptional({ example: 'Interested', description: 'Outcome of the interaction' })
  outcome?: string;

  @ApiPropertyOptional({ example: '2026-06-05T09:00:00Z', description: 'Scheduled next action date' })
  nextActionDate?: Date;
}

