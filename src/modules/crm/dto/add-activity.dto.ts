export class AddActivityDto {
  activityType: string;
  activityDate?: Date;
  subject?: string;
  description?: string;
  performedBy?: number;
  outcome?: string;
  nextActionDate?: Date;
}
