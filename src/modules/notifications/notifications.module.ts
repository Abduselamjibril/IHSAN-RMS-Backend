import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { NotificationCategory } from './entities/notification-category.entity';
import { NotificationChannel } from './entities/notification-channel.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationTemplateVariable } from './entities/notification-template-variable.entity';
import { Notification } from './entities/notification.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { NotificationQueue } from './entities/notification-queue.entity';
import { NotificationDeliveryLog } from './entities/notification-delivery-log.entity';
import { NotificationRetryLog } from './entities/notification-retry-log.entity';
import { UserNotificationPreference } from './entities/user-notification-preference.entity';
import { UserDevice } from './entities/user-device.entity';
import { NotificationReadHistory } from './entities/notification-read-history.entity';
import { NotificationAuditLog } from './entities/notification-audit-log.entity';
import { ScheduledNotificationRule } from './entities/scheduled-notification-rule.entity';

// CRM, Sales & Property Entities needed for schedulers
import { SalesContract } from '../sales/entities/sales-contract.entity';
import { InstallmentSchedule } from '../sales/entities/installment-schedule.entity';
import { SalesReservation } from '../sales/entities/sales-reservation.entity';
import { FollowupReminder } from '../crm/entities/followup-reminder.entity';
import { Unit } from '../properties/entities/unit.entity';
import { UnitStatus } from '../properties/entities/unit-status.entity';
import { UnitStatusHistory } from '../properties/entities/unit-status-history.entity';

// Controllers & Services
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { TelegramService } from './services/telegram.service';
import { NotificationsSchedulerService } from './services/notifications-scheduler.service';

// Modules
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => CrmModule), // To get EmailService exports
    TypeOrmModule.forFeature([
      NotificationCategory,
      NotificationChannel,
      NotificationTemplate,
      NotificationTemplateVariable,
      Notification,
      NotificationRecipient,
      NotificationQueue,
      NotificationDeliveryLog,
      NotificationRetryLog,
      UserNotificationPreference,
      UserDevice,
      NotificationReadHistory,
      NotificationAuditLog,
      ScheduledNotificationRule,
      SalesContract,
      InstallmentSchedule,
      SalesReservation,
      FollowupReminder,
      Unit,
      UnitStatus,
      UnitStatusHistory,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, TelegramService, NotificationsSchedulerService],
  exports: [NotificationsService, TelegramService, NotificationsSchedulerService, TypeOrmModule],
})
export class NotificationsModule {}
