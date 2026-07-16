import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { NotificationCategory } from '../entities/notification-category.entity';
import { NotificationChannel } from '../entities/notification-channel.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationTemplateVariable } from '../entities/notification-template-variable.entity';
import { Notification as NotificationEntity } from '../entities/notification.entity';
import { NotificationRecipient } from '../entities/notification-recipient.entity';
import { NotificationQueue } from '../entities/notification-queue.entity';
import { NotificationDeliveryLog } from '../entities/notification-delivery-log.entity';
import { NotificationRetryLog } from '../entities/notification-retry-log.entity';
import { UserNotificationPreference } from '../entities/user-notification-preference.entity';
import { NotificationReadHistory } from '../entities/notification-read-history.entity';
import { NotificationAuditLog } from '../entities/notification-audit-log.entity';
import { EmailService } from '../../crm/services/email.service';
import { TelegramService } from './telegram.service';
import { SendNotificationDto, CreateTemplateDto, UpdateTemplateDto } from '../dto/notification.dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationCategory)
    private readonly categoryRepo: Repository<NotificationCategory>,
    @InjectRepository(NotificationChannel)
    private readonly channelRepo: Repository<NotificationChannel>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(NotificationTemplateVariable)
    private readonly varRepo: Repository<NotificationTemplateVariable>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationRecipient)
    private readonly recipientRepo: Repository<NotificationRecipient>,
    @InjectRepository(NotificationQueue)
    private readonly queueRepo: Repository<NotificationQueue>,
    @InjectRepository(NotificationDeliveryLog)
    private readonly deliveryLogRepo: Repository<NotificationDeliveryLog>,
    @InjectRepository(NotificationRetryLog)
    private readonly retryLogRepo: Repository<NotificationRetryLog>,
    @InjectRepository(UserNotificationPreference)
    private readonly prefRepo: Repository<UserNotificationPreference>,
    @InjectRepository(NotificationReadHistory)
    private readonly readHistoryRepo: Repository<NotificationReadHistory>,
    @InjectRepository(NotificationAuditLog)
    private readonly auditLogRepo: Repository<NotificationAuditLog>,

    private readonly emailService: EmailService,
    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit() {
    this.logger.log('Seeding core notification categories, channels and templates...');

    try {
      // 1. Seed Categories
      const categories = [
        { code: 'PAYMENT', name: 'Payment & Collection Management Alerts' },
        { code: 'RESERVATION', name: 'Reservation Expiry & Confirms' },
        { code: 'FOLLOWUP', name: 'CRM & Lead Follow-ups' },
        { code: 'SYSTEM', name: 'System and Approvals Workflow' },
      ];
      for (const cat of categories) {
        const exists = await this.categoryRepo.findOne({ where: { categoryCode: cat.code } });
        if (!exists) {
          await this.categoryRepo.save(this.categoryRepo.create({
            categoryCode: cat.code,
            categoryName: cat.name,
          }));
        }
      }

      // 2. Seed Channels
      const channels = [
        { code: 'EMAIL', name: 'Email Delivery' },
        { code: 'TELEGRAM', name: 'Telegram Messenger' },
        { code: 'INAPP', name: 'In-App Notification Center' },
        { code: 'ALL', name: 'All Delivery Channels (Multi-Channel)' },
        { code: 'EMAIL_TELEGRAM', name: 'Email & Telegram Only' },
        { code: 'EMAIL_INAPP', name: 'Email & In-App Only' },
        { code: 'TELEGRAM_INAPP', name: 'Telegram & In-App Only' },
      ];
      for (const ch of channels) {
        const exists = await this.channelRepo.findOne({ where: { channelCode: ch.code } });
        if (!exists) {
          await this.channelRepo.save(this.channelRepo.create({
            channelCode: ch.code,
            channelName: ch.name,
          }));
        }
      }

      // 3. Seed core Templates
      const emailChannel = await this.channelRepo.findOne({ where: { channelCode: 'EMAIL' } });
      const telegramChannel = await this.channelRepo.findOne({ where: { channelCode: 'TELEGRAM' } });
      const inAppChannel = await this.channelRepo.findOne({ where: { channelCode: 'INAPP' } });

      const paymentCategory = await this.categoryRepo.findOne({ where: { categoryCode: 'PAYMENT' } });
      const reservationCategory = await this.categoryRepo.findOne({ where: { categoryCode: 'RESERVATION' } });
      const followupCategory = await this.categoryRepo.findOne({ where: { categoryCode: 'FOLLOWUP' } });

      if (emailChannel && paymentCategory) {
        const tCode = 'PAYMENT_REMINDER_EMAIL';
        const exists = await this.templateRepo.findOne({ where: { templateCode: tCode } });
        if (!exists) {
          await this.templateRepo.save(this.templateRepo.create({
            templateCode: tCode,
            templateName: 'Payment Reminder Email Template',
            subjectTemplate: 'Upcoming Installment Payment Due',
            bodyTemplate: 'Dear {{CustomerName}},\nYour installment payment of ETB {{PaymentAmount}} for Unit {{PropertyName}} is due on {{DueDate}}.\nPlease make payment before the due date.',
            category: paymentCategory,
            channel: emailChannel,
          }));
        }
      }

      if (telegramChannel && paymentCategory) {
        const tCode = 'PAYMENT_REMINDER_TELEGRAM';
        const exists = await this.templateRepo.findOne({ where: { templateCode: tCode } });
        if (!exists) {
          await this.templateRepo.save(this.templateRepo.create({
            templateCode: tCode,
            templateName: 'Payment Reminder Telegram Template',
            subjectTemplate: 'Upcoming Payment Reminder',
            bodyTemplate: 'Dear {{CustomerName}},\nYour payment of ETB {{PaymentAmount}} is due on {{DueDate}}.',
            category: paymentCategory,
            channel: telegramChannel,
          }));
        }
      }

      if (emailChannel && reservationCategory) {
        const tCode = 'RESERVATION_EXPIRY_EMAIL';
        const exists = await this.templateRepo.findOne({ where: { templateCode: tCode } });
        if (!exists) {
          await this.templateRepo.save(this.templateRepo.create({
            templateCode: tCode,
            templateName: 'Reservation Expiry Warning Email Template',
            subjectTemplate: 'Reservation Expiry Warning',
            bodyTemplate: 'Dear {{CustomerName}},\nYour reservation for Unit {{UnitCode}} is expiring in {{DaysLeft}} days.',
            category: reservationCategory,
            channel: emailChannel,
          }));
        }
      }

      if (inAppChannel && followupCategory) {
        const tCode = 'CRM_FOLLOWUP_INAPP';
        const exists = await this.templateRepo.findOne({ where: { templateCode: tCode } });
        if (!exists) {
          await this.templateRepo.save(this.templateRepo.create({
            templateCode: tCode,
            templateName: 'CRM Lead Followup In-App Template',
            subjectTemplate: 'CRM Followup Alert',
            bodyTemplate: 'You have a scheduled follow-up reminder for Lead {{LeadName}}.',
            category: followupCategory,
            channel: inAppChannel,
          }));
        }
      }

      this.logger.log('Notification templates, categories and channels seeded successfully.');
    } catch (err) {
      this.logger.error('Failed to seed notifications metadata:', err);
    }
  }

  // --- Dynamic Variable Parsing ---
  private parseTemplate(content: string, variables: Record<string, string>): string {
    if (!content) return '';
    let result = content;
    Object.keys(variables || {}).forEach((key) => {
      // support both {{variable}} and {{ variable }}
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, variables[key]);
    });
    return result;
  }

  // --- Send Notification Engine ---
  async sendNotification(dto: SendNotificationDto): Promise<NotificationEntity> {
    // 1. Resolve Category
    const category = await this.categoryRepo.findOne({ where: { categoryCode: dto.categoryCode } });
    if (!category) {
      throw new NotFoundException(`Notification Category "${dto.categoryCode}" not found.`);
    }

    // 2. Resolve Template & Channels
    let finalTitle = dto.title || '';
    let finalBody = dto.body || '';
    let template: NotificationTemplate | null = null;
    let templateChannel: NotificationChannel | null = null;

    if (dto.templateCode) {
      template = await this.templateRepo.findOne({
        where: { templateCode: dto.templateCode },
        relations: { category: true, channel: true },
      });
      if (!template) {
        throw new NotFoundException(`Notification Template "${dto.templateCode}" not found.`);
      }
      finalTitle = this.parseTemplate(template.subjectTemplate || '', dto.variables || {});
      finalBody = this.parseTemplate(template.bodyTemplate, dto.variables || {});
      templateChannel = template.channel;
    }

    // 3. Create Notification Record
    const notification = this.notificationRepo.create({
      category,
      template,
      referenceTypeId: dto.referenceTypeId,
      referenceId: dto.referenceId,
      notificationTitle: finalTitle,
      notificationBody: finalBody,
      priority: dto.priority || 'NORMAL',
      status: dto.scheduledDate ? 'PENDING' : 'QUEUED',
      scheduledDate: dto.scheduledDate || null,
    });
    const savedNotification = await this.notificationRepo.save(notification);

    // Log Audit Trail
    await this.logAudit(savedNotification, 'CREATED', 'System', `Notification generated. Status: ${savedNotification.status}`);

    // 4. Create Recipients and Channel Queue items
    const defaultChannels = await this.channelRepo.find({ where: { isActive: true } });

    for (const recDto of dto.recipients) {
      const recipient = this.recipientRepo.create({
        notification: savedNotification,
        userId: recDto.userId || null,
        recipientName: recDto.recipientName || 'Recipient',
        emailAddress: recDto.emailAddress || null,
        phoneNumber: recDto.phoneNumber || null,
        pushToken: recDto.pushToken || null,
        deliveryStatus: 'PENDING',
      });
      const savedRecipient = await this.recipientRepo.save(recipient);

      // Resolve Delivery Channels based on preference & template rules
      let channelsToDeliver = templateChannel ? [templateChannel] : defaultChannels;
      
      if (templateChannel) {
        if (templateChannel.channelCode === 'ALL') {
          channelsToDeliver = defaultChannels.filter(c => ['EMAIL', 'TELEGRAM', 'INAPP'].includes(c.channelCode));
        } else if (templateChannel.channelCode === 'EMAIL_TELEGRAM') {
          channelsToDeliver = defaultChannels.filter(c => c.channelCode === 'EMAIL' || c.channelCode === 'TELEGRAM');
        } else if (templateChannel.channelCode === 'EMAIL_INAPP') {
          channelsToDeliver = defaultChannels.filter(c => c.channelCode === 'EMAIL' || c.channelCode === 'INAPP');
        } else if (templateChannel.channelCode === 'TELEGRAM_INAPP') {
          channelsToDeliver = defaultChannels.filter(c => c.channelCode === 'TELEGRAM' || c.channelCode === 'INAPP');
        } else {
          channelsToDeliver = [templateChannel];
        }
      } else {
        channelsToDeliver = defaultChannels.filter(c => ['EMAIL', 'TELEGRAM', 'INAPP'].includes(c.channelCode));
      }

      if (recDto.userId) {
        // If recipient has user ID, query preferences
        const preferences = await this.prefRepo.find({
          where: { userId: recDto.userId, category: { id: category.id } },
        });

        if (preferences.length > 0) {
          const pref = preferences[0];
          channelsToDeliver = channelsToDeliver.filter((c) => {
            if (c.channelCode === 'EMAIL') return pref.enableEmail;
            if (c.channelCode === 'SMS') return pref.enableSMS;
            if (c.channelCode === 'PUSH') return pref.enablePush;
            if (c.channelCode === 'INAPP') return pref.enableInApp;
            if (c.channelCode === 'TELEGRAM') return pref.enableTelegram;
            return true;
          });
        }
      }

      // Add to Queue
      for (const channel of channelsToDeliver) {
        // Filter empty channel addresses
        if (channel.channelCode === 'EMAIL' && !recipient.emailAddress) continue;
        if (channel.channelCode === 'TELEGRAM' && !recipient.phoneNumber) continue;

        const queueItem = this.queueRepo.create({
          notification: savedNotification,
          channel,
          status: dto.scheduledDate ? 'PENDING' : 'PENDING',
        });
        await this.queueRepo.save(queueItem);
      }
    }

    // Trigger immediate background delivery if not scheduled in future
    if (!dto.scheduledDate) {
      this.processQueue().catch((err) => this.logger.error('Error running immediate queue sweep:', err));
    }

    return savedNotification;
  }

  // --- Queue Processor & Delivery Worker ---
  async processQueue(): Promise<void> {
    const now = new Date();
    // Fetch pending or failed items that are ready for attempt
    const items = await this.queueRepo.find({
      where: [
        { status: 'PENDING' },
        { status: 'FAILED', nextRetryDate: LessThanOrEqual(now) },
      ],
      relations: { notification: true, channel: true },
      take: 50,
    });

    if (items.length === 0) return;

    this.logger.log(`Processing ${items.length} notifications in delivery queue...`);

    for (const item of items) {
      item.status = 'PROCESSING';
      item.lastAttemptDate = new Date();
      const savedItem = await this.queueRepo.save(item);

      // Load recipients of this notification
      const recipients = await this.recipientRepo.find({
        where: { notification: { id: savedItem.notification.id } },
      });

      let overallSuccess = true;
      let errorMsg = '';

      for (const recipient of recipients) {
        let sent = false;

        try {
          if (savedItem.channel.channelCode === 'EMAIL') {
            sent = await this.emailService.sendEmail(
              recipient.emailAddress!,
              savedItem.notification.notificationTitle,
              savedItem.notification.notificationBody
            );
          } else if (savedItem.channel.channelCode === 'TELEGRAM') {
            sent = await this.telegramService.sendDirectMessage(
              recipient.phoneNumber!,
              `*${savedItem.notification.notificationTitle}*\n\n${savedItem.notification.notificationBody}`
            );
          } else if (savedItem.channel.channelCode === 'INAPP') {
            // InApp is instantaneous inside database
            sent = true;
          } else {
            // SMS, PUSH, WHATSAPP simulated simulation logging
            this.logger.log(`[SIMULATED] Channel: ${savedItem.channel.channelCode} to: ${recipient.phoneNumber || recipient.recipientName}`);
            sent = true;
          }
        } catch (e) {
          errorMsg = e.message;
          sent = false;
        }

        if (sent) {
          recipient.deliveryStatus = 'SENT';
          recipient.deliveredDate = new Date();
          await this.recipientRepo.save(recipient);

          // Log Delivery Successful
          await this.deliveryLogRepo.save(
            this.deliveryLogRepo.create({
              notification: savedItem.notification,
              recipient,
              channel: savedItem.channel,
              deliveryStatus: 'SENT',
              deliveryDate: new Date(),
            })
          );
        } else {
          overallSuccess = false;
          // Log Delivery Failure
          await this.deliveryLogRepo.save(
            this.deliveryLogRepo.create({
              notification: savedItem.notification,
              recipient,
              channel: savedItem.channel,
              deliveryStatus: 'FAILED',
              errorMessage: errorMsg || 'Channel driver error.',
            })
          );
        }
      }

      if (overallSuccess) {
        savedItem.status = 'SENT';
        await this.queueRepo.save(savedItem);

        // Check if all channels for the notification are complete
        const remainingQueue = await this.queueRepo.count({
          where: { notification: { id: savedItem.notification.id }, status: 'PENDING' },
        });

        if (remainingQueue === 0) {
          savedItem.notification.status = 'SENT';
          savedItem.notification.sentDate = new Date();
          await this.notificationRepo.save(savedItem.notification);
          await this.logAudit(savedItem.notification, 'SENT', 'System', 'All channel dispatches complete.');
        }
      } else {
        // Retry logic
        savedItem.retryCount += 1;
        if (savedItem.retryCount < 3) {
          savedItem.status = 'FAILED';
          savedItem.nextRetryDate = new Date(Date.now() + 5 * 60 * 1000); // 5 mins delay
          await this.queueRepo.save(savedItem);

          await this.retryLogRepo.save(
            this.retryLogRepo.create({
              queueItem: savedItem,
              retryNumber: savedItem.retryCount,
              retryResult: 'FAILED',
              errorMessage: errorMsg || 'Failure during queue processing.',
            })
          );
          await this.logAudit(savedItem.notification, 'RETRIED', 'System', `Attempt ${savedItem.retryCount} failed. Scheduled next retry.`);
        } else {
          savedItem.status = 'FAILED';
          await this.queueRepo.save(savedItem);

          savedItem.notification.status = 'FAILED';
          await this.notificationRepo.save(savedItem.notification);
          await this.logAudit(savedItem.notification, 'FAILED', 'System', 'Delivery failed permanently after 3 attempts.');
        }
      }
    }
  }

  // --- Templates Management ---
  async getTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepo.find({ relations: { category: true, channel: true } });
  }

  async createTemplate(dto: CreateTemplateDto): Promise<NotificationTemplate> {
    const category = await this.categoryRepo.findOne({ where: { categoryCode: dto.categoryCode } });
    if (!category) {
      throw new NotFoundException(`Category Code "${dto.categoryCode}" not found.`);
    }
    const channel = await this.channelRepo.findOne({ where: { channelCode: dto.channelCode } });
    if (!channel) {
      throw new NotFoundException(`Channel Code "${dto.channelCode}" not found.`);
    }

    const template = this.templateRepo.create({
      category,
      channel,
      templateCode: dto.templateCode,
      templateName: dto.templateName,
      subjectTemplate: dto.subjectTemplate || null,
      bodyTemplate: dto.bodyTemplate,
    });
    const saved = await this.templateRepo.save(template);

    // Save variables
    if (dto.variables && dto.variables.length > 0) {
      for (const varName of dto.variables) {
        await this.varRepo.save(
          this.varRepo.create({
            template: saved,
            variableName: varName,
          })
        );
      }
    }

    const res = await this.templateRepo.findOne({ where: { id: saved.id }, relations: { category: true, channel: true } });
    if (!res) throw new NotFoundException('Template created but not found.');
    return res;
  }

  async updateTemplate(id: number, dto: UpdateTemplateDto): Promise<NotificationTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found.');

    if (dto.templateName !== undefined) template.templateName = dto.templateName;
    if (dto.subjectTemplate !== undefined) template.subjectTemplate = dto.subjectTemplate;
    if (dto.bodyTemplate !== undefined) template.bodyTemplate = dto.bodyTemplate;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;

    return this.templateRepo.save(template);
  }

  async getCategories(): Promise<NotificationCategory[]> {
    return this.categoryRepo.find();
  }

  async getChannels(): Promise<NotificationChannel[]> {
    return this.channelRepo.find();
  }

  // --- In-App Notification Inbox ---
  async getUserInbox(userId: number): Promise<any[]> {
    return this.recipientRepo.find({
      where: { userId },
      relations: { notification: true },
      order: { id: 'DESC' },
    });
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.recipientRepo.count({
      where: { userId, deliveryStatus: 'SENT' }, // SENT means delivered to inbox but not read
    });
  }

  async markAsRead(userId: number, recipientId?: number): Promise<void> {
    if (recipientId) {
      const recipient = await this.recipientRepo.findOne({ where: { id: recipientId, userId } });
      if (recipient) {
        recipient.deliveryStatus = 'READ';
        recipient.readDate = new Date();
        await this.recipientRepo.save(recipient);

        // Write Read History
        await this.readHistoryRepo.save(
          this.readHistoryRepo.create({
            notification: recipient.notification,
            userId,
          })
        );
      }
    } else {
      const unreads = await this.recipientRepo.find({ where: { userId, deliveryStatus: 'SENT' } });
      for (const rec of unreads) {
        rec.deliveryStatus = 'READ';
        rec.readDate = new Date();
        await this.recipientRepo.save(rec);

        await this.readHistoryRepo.save(
          this.readHistoryRepo.create({
            notification: rec.notification,
            userId,
          })
        );
      }
    }
  }

  // --- Preferences ---
  async getUserPreferences(userId: number): Promise<UserNotificationPreference[]> {
    const prefs = await this.prefRepo.find({ where: { userId } });
    if (prefs.length === 0) {
      // Seed default active preferences for categories
      const categories = await this.categoryRepo.find({ where: { isActive: true } });
      const seeded: UserNotificationPreference[] = [];
      for (const cat of categories) {
        const item = this.prefRepo.create({
          userId,
          category: cat,
          enableEmail: true,
          enableSMS: true,
          enablePush: true,
          enableInApp: true,
          enableTelegram: false, // Default to disabled for TELEGRAM per requirement
        });
        seeded.push(await this.prefRepo.save(item));
      }
      return seeded;
    }
    return prefs;
  }

  async updateUserPreferences(userId: number, list: any[]): Promise<void> {
    for (const item of list) {
      const pref = await this.prefRepo.findOne({
        where: { userId, category: { id: item.categoryId } },
      });
      if (pref) {
        if (item.enableEmail !== undefined) pref.enableEmail = item.enableEmail;
        if (item.enableSMS !== undefined) pref.enableSMS = item.enableSMS;
        if (item.enablePush !== undefined) pref.enablePush = item.enablePush;
        if (item.enableInApp !== undefined) pref.enableInApp = item.enableInApp;
        if (item.enableTelegram !== undefined) pref.enableTelegram = item.enableTelegram;
        await this.prefRepo.save(pref);
      }
    }
  }

  // --- Reports & KPIs Queries ---
  async getDeliveryStats(): Promise<any> {
    const total = await this.deliveryLogRepo.count();
    const sent = await this.deliveryLogRepo.count({ where: { deliveryStatus: 'SENT' } });
    const failed = await this.deliveryLogRepo.count({ where: { deliveryStatus: 'FAILED' } });
    const read = await this.recipientRepo.count({ where: { deliveryStatus: 'READ' } });

    // Compute percentages
    const successRate = total > 0 ? (sent / total) * 100 : 0;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;
    const readRate = sent > 0 ? (read / sent) * 100 : 0;

    return {
      totalSent: total,
      successRate,
      failureRate,
      readRate,
    };
  }

  async getHistoryLogs(): Promise<any[]> {
    return this.deliveryLogRepo.find({
      relations: { notification: true, recipient: true, channel: true },
      order: { id: 'DESC' },
      take: 200,
    });
  }

  // --- Telegram Admin Dynamic Settings ---
  async getTelegramConfig() {
    const channel = await this.channelRepo.findOne({ where: { channelCode: 'TELEGRAM' } });
    if (!channel) throw new NotFoundException('Telegram channel code definition missing.');

    const mask = (val: string | null | undefined, visibleChars = 4) => {
      if (!val) return '';
      if (val.length <= visibleChars) return '******';
      return val.slice(0, visibleChars) + '******';
    };

    return {
      telegramApiId: channel.telegramApiId || null,
      telegramApiHashMasked: mask(channel.telegramApiHash, 4),
      telegramSessionStringMasked: mask(channel.telegramSessionString, 8),
      hasConfig: !!(channel.telegramApiId && channel.telegramApiHash && channel.telegramSessionString),
    };
  }

  async updateTelegramConfig(dto: { telegramApiId: number; telegramApiHash: string; telegramSessionString: string }) {
    const channel = await this.channelRepo.findOne({ where: { channelCode: 'TELEGRAM' } });
    if (!channel) throw new NotFoundException('Telegram channel code definition missing.');

    channel.telegramApiId = dto.telegramApiId;
    channel.telegramApiHash = dto.telegramApiHash;
    channel.telegramSessionString = dto.telegramSessionString;
    await this.channelRepo.save(channel);

    // Trigger immediate connection tryout
    const res = await this.telegramService.connectClient(
      dto.telegramApiId,
      dto.telegramApiHash,
      dto.telegramSessionString
    );

    return {
      success: res.success,
      error: res.error,
    };
  }

  getTelegramStatus() {
    return this.telegramService.getStatus();
  }

  async requestTelegramCode(apiId: number, apiHash: string, phoneNumber: string) {
    return this.telegramService.requestAuthCode(apiId, apiHash, phoneNumber);
  }

  async verifyTelegramCode(phoneNumber: string, code: string, password?: string) {
    return this.telegramService.verifyAuthCode(phoneNumber, code, password);
  }

  // --- Helpers ---
  private async logAudit(notification: NotificationEntity, actionType: string, actionBy: string, remarks: string) {
    const log = this.auditLogRepo.create({
      notification,
      actionType,
      actionBy,
      remarks,
    });
    await this.auditLogRepo.save(log);
  }
}
