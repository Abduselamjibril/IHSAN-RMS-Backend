import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallmentSchedule } from '../../sales/entities/installment-schedule.entity';
import { SalesReservation } from '../../sales/entities/sales-reservation.entity';
import { FollowupReminder } from '../../crm/entities/followup-reminder.entity';
import { Unit } from '../../properties/entities/unit.entity';
import { UnitStatus } from '../../properties/entities/unit-status.entity';
import { UnitStatusHistory } from '../../properties/entities/unit-status-history.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsSchedulerService.name);
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(InstallmentSchedule)
    private readonly scheduleRepo: Repository<InstallmentSchedule>,
    @InjectRepository(SalesReservation)
    private readonly reservationRepo: Repository<SalesReservation>,
    @InjectRepository(FollowupReminder)
    private readonly followupRepo: Repository<FollowupReminder>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(UnitStatus)
    private readonly unitStatusRepo: Repository<UnitStatus>,
    @InjectRepository(UnitStatusHistory)
    private readonly unitStatusHistoryRepo: Repository<UnitStatusHistory>,

    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.logger.log('Notification Scheduler initialized. Starting background triggers...');
    // Run initial sweep on startup after a brief delay
    setTimeout(() => {
      this.runAllSweeps().catch((err) => this.logger.error('Error running startup sweeps:', err));
    }, 10000);

    // Run sweeps daily (every 24 hours)
    this.sweepTimer = setInterval(() => {
      this.runAllSweeps().catch((err) => this.logger.error('Error running daily sweeps:', err));
    }, 24 * 60 * 60 * 1000);
  }

  async runAllSweeps() {
    this.logger.log('--- Starting Notification Sweep Job ---');
    await this.runPaymentReminders();
    await this.runReservationExpiry();
    await this.runFollowUpEscalation();
    this.logger.log('--- Completed Notification Sweep Job ---');
  }

  // --- Epic 3: Payment Reminders ---
  async runPaymentReminders(): Promise<void> {
    this.logger.log('Running Payment Reminders Sweep...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = await this.scheduleRepo.find({
      where: { status: 'PENDING' },
      relations: {
        contract: {
          customer: { lead: { assignedSalesAgent: true } },
          property: true,
          agreement: { booking: { unit: true } },
        },
      },
    });

    for (const schedule of schedules) {
      if (!schedule.contract || !schedule.contract.customer) continue;

      const dueDate = new Date(schedule.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const customer = schedule.contract.customer;
      const customerName = customer.fullName;
      const unitCode = schedule.contract.agreement?.booking?.unit?.unitCode || schedule.contract.property?.propertyName || 'Unit';
      const amountStr = Number(schedule.installmentAmount).toLocaleString();
      const dateStr = dueDate.toLocaleDateString();

      // Rule Matches: 30, 15, 7, 3, 1 Days Before
      if ([30, 15, 7, 3, 1].includes(diffDays)) {
        await this.notificationsService.sendNotification({
          categoryCode: 'PAYMENT',
          title: `Payment Reminder - ${diffDays} Days Remaining`,
          body: `Dear ${customerName},\nYour installment payment of ETB ${amountStr} for Unit ${unitCode} is due on ${dateStr}.\nPlease make payment before the due date.`,
          referenceTypeId: 'CONTRACT',
          referenceId: schedule.contract.id,
          recipients: [
            {
              userId: customer.id, // if linked
              recipientName: customerName,
              emailAddress: customer.primaryEmail || undefined,
              phoneNumber: customer.primaryPhone,
            },
          ],
        });
      }

      // Overdue Matches: 1, 7, 15, 30, 60 Days Overdue (diffDays = -1, -7, etc.)
      const overdueDays = -diffDays;
      if ([1, 7, 15, 30, 60].includes(overdueDays)) {
        await this.notificationsService.sendNotification({
          categoryCode: 'PAYMENT',
          title: `Overdue Payment Notice - ${overdueDays} Days Past Due`,
          body: `Dear ${customerName},\nYour installment payment of ETB ${amountStr} for Unit ${unitCode} was due on ${dateStr} and is now ${overdueDays} days overdue.\nPlease settle this balance immediately to avoid penalties.`,
          referenceTypeId: 'CONTRACT',
          referenceId: schedule.contract.id,
          priority: 'HIGH',
          recipients: [
            {
              userId: customer.id,
              recipientName: customerName,
              emailAddress: customer.primaryEmail || undefined,
              phoneNumber: customer.primaryPhone,
            },
          ],
        });
      }
    }
  }

  // --- Epic 4: Reservation Expiry ---
  async runReservationExpiry(): Promise<void> {
    this.logger.log('Running Reservation Expiry Sweep...');
    const today = new Date();
    const reservations = await this.reservationRepo.find({
      where: { status: 'RESERVED' },
      relations: { customer: { lead: { assignedSalesAgent: true } }, unit: true, property: true },
    });

    const availableStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });

    for (const res of reservations) {
      if (!res.customer) continue;

      const expiryDate = new Date(res.expiryDate);
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const customer = res.customer;
      const customerName = customer.fullName;
      const unitCode = res.unit?.unitCode || 'Unit';
      const resNo = res.reservationNo;

      const salesRep = customer.lead?.assignedSalesAgent || null;

      if (diffDays > 0) {
        // Expiry Warning: 7, 3, 1 Days Before
        if ([7, 3, 1].includes(diffDays)) {
          const recipients: any[] = [
            {
              recipientName: customerName,
              emailAddress: customer.primaryEmail || undefined,
              phoneNumber: customer.primaryPhone,
            },
          ];

          if (salesRep) {
            recipients.push({
              recipientName: salesRep.fullName,
              emailAddress: salesRep.email || undefined,
              phoneNumber: salesRep.phone || undefined,
            });
          }

          // Also alert Manager
          recipients.push({
            recipientName: 'Sales Manager',
            emailAddress: 'manager@ihsanproperties.com',
          });

          await this.notificationsService.sendNotification({
            categoryCode: 'RESERVATION',
            title: `Reservation Expiry Warning - ${diffDays} Days Left`,
            body: `Dear ${customerName},\nYour reservation #${resNo} for Unit ${unitCode} will expire in ${diffDays} days on ${expiryDate.toLocaleDateString()}.\nContact your agent to execute the Sales Agreement.`,
            referenceTypeId: 'RESERVATION',
            referenceId: res.id,
            recipients,
          });
        }
      } else {
        // Expired!
        res.status = 'EXPIRED';
        await this.reservationRepo.save(res);

        // Auto release unit in inventory
        if (res.unit && availableStatus) {
          const unit = await this.unitRepo.findOne({
            where: { id: res.unit.id },
            relations: { unitStatus: true },
          });

          if (unit && unit.unitStatus.statusName === 'Reserved') {
            const oldStatus = unit.unitStatus;
            unit.unitStatus = availableStatus;
            unit.reservationExpiry = null;
            await this.unitRepo.save(unit);

            // Log unit status history log
            await this.unitStatusHistoryRepo.save(
              this.unitStatusHistoryRepo.create({
                unit,
                oldStatus,
                newStatus: availableStatus,
                reason: `Reservation expired ref: ${resNo}`,
              })
            );
          }
        }

        // Notify Customer, Sales Rep, and Manager
        const recipients: any[] = [
          {
            recipientName: customerName,
            emailAddress: customer.primaryEmail || undefined,
            phoneNumber: customer.primaryPhone,
          },
        ];

        if (salesRep) {
          recipients.push({
            recipientName: salesRep.fullName,
            emailAddress: salesRep.email || undefined,
            phoneNumber: salesRep.phone || undefined,
          });
        }

        recipients.push({
          recipientName: 'Sales Manager',
          emailAddress: 'manager@ihsanproperties.com',
        });

        await this.notificationsService.sendNotification({
          categoryCode: 'RESERVATION',
          title: `Reservation Expired - ${resNo}`,
          body: `Dear ${customerName},\nYour reservation #${resNo} for Unit ${unitCode} has expired and the unit has been released back to general availability.`,
          referenceTypeId: 'RESERVATION',
          referenceId: res.id,
          priority: 'HIGH',
          recipients,
        });
      }
    }
  }

  // --- Epic 5: CRM Follow-up Escalations ---
  async runFollowUpEscalation(): Promise<void> {
    this.logger.log('Running CRM Follow-up Escalation Sweep...');
    const today = new Date();
    const reminders = await this.followupRepo.find({
      where: { isCompleted: false, status: 'Pending' },
      relations: { assignedTo: true, lead: true },
    });

    for (const reminder of reminders) {
      const reminderDate = new Date(reminder.reminderDatetime);
      const diffTime = today.getTime() - reminderDate.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);

      const agentName = reminder.assignedTo?.fullName || 'Sales Agent';
      const leadName = reminder.lead?.fullName || 'Lead';
      const subject = reminder.subject;

      // Escalate if overdue by >= 24 hours
      if (diffHours >= 24) {
        reminder.status = 'Escalated';
        reminder.priority = 'High';
        await this.followupRepo.save(reminder);

        // Trigger escalation alerts
        await this.notificationsService.sendNotification({
          categoryCode: 'FOLLOWUP',
          title: `[ESCALATION] Overdue Follow-up: ${subject}`,
          body: `Escalation Notice:\nSales Agent ${agentName} has missed the scheduled follow-up for Lead "${leadName}" (Scheduled: ${reminderDate.toLocaleString()}).\nSubject: ${subject}`,
          referenceTypeId: 'LEAD',
          referenceId: reminder.lead?.id,
          priority: 'HIGH',
          recipients: [
            {
              recipientName: 'Sales Manager',
              emailAddress: 'manager@ihsanproperties.com',
            },
            {
              recipientName: 'Branch Manager',
              emailAddress: 'branch-manager@ihsanproperties.com',
            },
          ],
        });
      }
    }
  }
}
