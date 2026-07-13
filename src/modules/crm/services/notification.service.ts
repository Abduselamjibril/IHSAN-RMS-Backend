import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowupReminder } from '../entities/followup-reminder.entity';
import { FollowupNotification } from '../entities/followup-notification.entity';
import { FollowupHistory } from '../entities/followup-history.entity';
import { Lead } from '../entities/lead.entity';
import { SalesAgent } from '../entities/sales-agent.entity';
import { EmailService } from './email.service';
import { Inject, forwardRef } from '@nestjs/common';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(FollowupReminder)
    private readonly reminderRepo: Repository<FollowupReminder>,
    @InjectRepository(FollowupNotification)
    private readonly notificationRepo: Repository<FollowupNotification>,
    @InjectRepository(FollowupHistory)
    private readonly historyRepo: Repository<FollowupHistory>,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly centralNotifications: NotificationsService,
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
    const savedReminder = await this.reminderRepo.save(reminder);

    // Trigger email notification to sales agent if agent and agent email are present
    if (agent && agent.email) {
      const emailSubject = `[IHSAN RMS] ${subject}`;
      const emailBody = `Dear ${agent.fullName || 'Sales Agent'},

This is an automated notification from the IHSAN Real Estate Management System (REMS).

Subject:   ${subject}
Lead Name: ${lead?.fullName || 'N/A'} (Code: ${lead?.leadCode || 'N/A'})
Scheduled: ${new Date(reminderDatetime).toLocaleString()}
Priority:  High

Notification Message:
----------------------------------------
${message}
----------------------------------------

Please log in to your IHSAN REMS portal to take necessary action.

Best regards,
IHSAN REMS System Mailer`;

      this.emailService.sendEmail(agent.email, emailSubject, emailBody).catch(err => {
        console.error('[EMAIL ERROR] Failed to send email to agent in background:', err);
      });
    }

    // Trigger central notifications engine (Email, Telegram, InApp based on preferences)
    if (agent) {
      this.centralNotifications.sendNotification({
        categoryCode: 'FOLLOWUP',
        title: subject,
        body: message,
        referenceTypeId: 'LEAD',
        referenceId: lead?.id,
        recipients: [
          {
            userId: agent.id,
            recipientName: agent.fullName,
            emailAddress: agent.email || undefined,
            phoneNumber: agent.phone || undefined,
          },
        ],
      }).catch(err => {
        console.error('[CENTRAL NOTIFICATION ERROR] Failed to send followup central alert:', err);
      });
    }

    return savedReminder;
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
    reminder.completedAt = new Date();
    reminder.status = 'Completed';
    return this.reminderRepo.save(reminder);
  }

  async snoozeReminder(id: number, minutes: number): Promise<FollowupReminder> {
    const reminder = await this.reminderRepo.findOne({
      where: { id },
      relations: { assignedTo: true, lead: true },
    });
    if (!reminder) {
      throw new Error(`Reminder with ID ${id} not found`);
    }

    const oldStatus = reminder.status;
    const oldDatetime = new Date(reminder.reminderDatetime);
    const newDatetime = new Date(oldDatetime.getTime() + minutes * 60 * 1000);
    reminder.reminderDatetime = newDatetime;
    reminder.status = 'Snoozed';
    const saved = await this.reminderRepo.save(reminder);

    // Create history
    const hist = new FollowupHistory();
    hist.reminder = saved;
    hist.actionTaken = `Snoozed for ${minutes} minutes`;
    hist.oldStatus = oldStatus;
    hist.newStatus = 'Snoozed';
    hist.remarks = `Snoozed from ${oldDatetime.toLocaleString()} to ${newDatetime.toLocaleString()}`;
    hist.actionBy = 1;
    await this.historyRepo.save(hist);

    return saved;
  }

  async rescheduleReminder(id: number, newDate: Date): Promise<FollowupReminder> {
    const reminder = await this.reminderRepo.findOne({
      where: { id },
      relations: { assignedTo: true, lead: true },
    });
    if (!reminder) {
      throw new Error(`Reminder with ID ${id} not found`);
    }

    const oldStatus = reminder.status;
    const oldDatetime = new Date(reminder.reminderDatetime);
    reminder.reminderDatetime = newDate;
    reminder.status = 'Rescheduled';
    const saved = await this.reminderRepo.save(reminder);

    // Create history
    const hist = new FollowupHistory();
    hist.reminder = saved;
    hist.actionTaken = `Rescheduled`;
    hist.oldStatus = oldStatus;
    hist.newStatus = 'Rescheduled';
    hist.remarks = `Rescheduled from ${oldDatetime.toLocaleString()} to ${newDate.toLocaleString()}`;
    hist.actionBy = 1;
    await this.historyRepo.save(hist);

    return saved;
  }

  async checkEscalations(): Promise<{ escalatedCount: number }> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const overdueReminders = await this.reminderRepo.createQueryBuilder('reminder')
      .leftJoinAndSelect('reminder.assignedTo', 'agent')
      .leftJoinAndSelect('reminder.lead', 'lead')
      .where('reminder.isCompleted = :isCompleted', { isCompleted: false })
      .andWhere('reminder.status != :status', { status: 'Escalated' })
      .andWhere('reminder.reminderDatetime <= :cutoff', { cutoff: twentyFourHoursAgo })
      .getMany();

    let escalatedCount = 0;
    for (const reminder of overdueReminders) {
      const oldStatus = reminder.status;
      reminder.status = 'Escalated';
      reminder.priority = 'High';
      const saved = await this.reminderRepo.save(reminder);

      // Create history
      const hist = new FollowupHistory();
      hist.reminder = saved;
      hist.actionTaken = `Escalated`;
      hist.oldStatus = oldStatus;
      hist.newStatus = 'Escalated';
      hist.remarks = `Automatically escalated because follow-up was overdue by more than 24 hours.`;
      hist.actionBy = 1;
      await this.historyRepo.save(hist);

      // Create a FollowupNotification entry
      const notif = new FollowupNotification();
      notif.reminder = saved;
      notif.notificationType = 'EmailEscalation';
      notif.deliveryStatus = 'Sent';
      notif.sentAt = new Date();
      await this.notificationRepo.save(notif);

      // Trigger email alert to manager
      const managerEmail = 'manager@ihsanproperties.com';
      const emailSubject = `[OVERDUE ESCALATION] Follow-up Overdue: ${reminder.subject}`;
      const emailBody = `Dear Manager,

This is an automated escalation alert from the IHSAN Real Estate Management System (REMS).

The following follow-up reminder is OVERDUE by more than 24 hours and has been escalated:

Agent:       ${reminder.assignedTo?.fullName || 'Unassigned'} (${reminder.assignedTo?.email || 'N/A'})
Lead:        ${reminder.lead?.fullName || 'N/A'} (Code: ${reminder.lead?.leadCode || 'N/A'})
Subject:     ${reminder.subject}
Scheduled:   ${new Date(reminder.reminderDatetime).toLocaleString()}
Message:     ${reminder.reminderMessage || '-'}

Please take necessary actions.

Best regards,
IHSAN REMS System Mailer`;

      await this.emailService.sendEmail(managerEmail, emailSubject, emailBody).catch(err => {
        console.error('[EMAIL ERROR] Failed to send escalation email to manager:', err);
      });

      escalatedCount++;
    }

    return { escalatedCount };
  }
}
