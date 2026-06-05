import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowupReminder } from '../entities/followup-reminder.entity';
import { FollowupNotification } from '../entities/followup-notification.entity';
import { Lead } from '../entities/lead.entity';
import { SalesAgent } from '../entities/sales-agent.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(FollowupReminder)
    private readonly reminderRepo: Repository<FollowupReminder>,
    @InjectRepository(FollowupNotification)
    private readonly notificationRepo: Repository<FollowupNotification>,
  ) {}

  async createReminder(lead: Lead, agent: SalesAgent, reminderDatetime: Date, subject: string, message: string): Promise<FollowupReminder> {
    const reminder = new FollowupReminder();
    reminder.lead = lead;
    reminder.assignedTo = agent;
    reminder.reminderType = 'SystemAlert';
    reminder.subject = subject;
    reminder.reminderDatetime = reminderDatetime;
    reminder.priority = 'High';
    reminder.status = 'Pending';
    reminder.reminderMessage = message;
    reminder.isCompleted = false;
    return this.reminderRepo.save(reminder);
  }

  async getReminders() {
    return this.reminderRepo.find({
      where: { isCompleted: false },
      relations: { lead: true, assignedTo: true },
      order: { reminderDatetime: 'ASC' },
    });
  }

  async triggerAssignmentNotification(lead: Lead, agent: SalesAgent) {
    if (!lead || !agent) return;
    const subject = `New Lead Assigned`;
    const message = `Lead ${lead.fullName} has been assigned to Sales Agent ${agent.fullName}.`;
    await this.createReminder(lead, agent, new Date(), subject, message);
    console.log(`[NOTIFICATION] ${subject}: ${message}`);
  }

  async triggerStatusNotification(lead: Lead, statusName: string) {
    if (!lead) return;
    const subject = `Lead Status Updated`;
    const message = `Lead ${lead.fullName} status has been updated to ${statusName}.`;
    await this.createReminder(lead, lead.assignedSalesAgent, new Date(), subject, message);
    console.log(`[NOTIFICATION] ${subject}: ${message}`);
  }

  async completeReminder(id: number): Promise<FollowupReminder> {
    const reminder = await this.reminderRepo.findOne({ where: { id } });
    if (!reminder) {
      throw new Error(`Reminder with ID ${id} not found`);
    }
    reminder.isCompleted = true;
    return this.reminderRepo.save(reminder);
  }
}
